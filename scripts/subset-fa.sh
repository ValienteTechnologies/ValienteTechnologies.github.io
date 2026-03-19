#!/usr/bin/env bash
# subset-fa.sh — Regenerate FontAwesome subset from source files.
#
# Scans all HTML/SCSS/JS sources for used fa-* icon classes, then rebuilds:
#   assets/css/all.min.css       (base utilities + icon rules + @font-face)
#   assets/css/webfonts/fa-solid-900.woff2
#   assets/css/webfonts/fa-brands-400.woff2
#
# Usage: ./scripts/subset-fa.sh
# Requirements: pyftsubset (pip install fonttools brotli)

set -e

SCRIPTS_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$SCRIPTS_DIR/.."
FULL_CSS="$SCRIPTS_DIR/fa-source/fa-full.css"
SOLID_FULL="$SCRIPTS_DIR/fa-source/fa-solid-900-full.woff2"
BRANDS_FULL="$SCRIPTS_DIR/fa-source/fa-brands-400-full.woff2"
OUT_CSS="$ROOT/assets/css/all.min.css"
OUT_SOLID="$ROOT/assets/css/webfonts/fa-solid-900.woff2"
OUT_BRANDS="$ROOT/assets/css/webfonts/fa-brands-400.woff2"

if ! command -v pyftsubset >/dev/null 2>&1; then
  echo "Error: pyftsubset not found. Run: pip install fonttools brotli"
  exit 1
fi

# --- 1. Collect all used icon names from source files ---
USED=$(grep -roh 'fa-[a-z0-9][a-z0-9-]*' \
  "$ROOT/_includes" \
  "$ROOT/_layouts" \
  "$ROOT/_pages" \
  "$ROOT/_data" \
  "$ROOT/assets/js/src" \
  2>/dev/null \
  | sed 's/.*://' \
  | grep -v '^fa-\(stack\|stack-1x\|stack-2x\|[0-9]*x\|spin\|inverse\|brands\|solid\|regular\|fw\|lg\|sm\|xs\)$' \
  | sort -u)

echo "Icons found in source:"
echo "$USED" | sed 's/^/  /'

# --- 2. Extract matching rules from full FA CSS ---
# Pull: base utilities block (everything before first icon rule)
BASE=$(python3 - <<'PYEOF'
import re, sys

css = open("scripts/fa-source/fa-full.css").read()
# Find position of first icon :before rule
m = re.search(r'\.fa-[a-z0-9-]+:before\{', css)
if m:
    print(css[:m.start()].rstrip())
PYEOF
)

# Pull: all icon rules from full CSS into a lookup dict, then filter to used set
ICON_RULES=$(python3 - "$USED" <<'PYEOF'
import re, sys

css = open("scripts/fa-source/fa-full.css").read()
# Strip fa- prefix; each entry in USED is e.g. "fa-arrow-right"
used = set(n[3:] if n.startswith("fa-") else n for n in sys.argv[1].split())

# Extract all icon rules: .fa-NAME:before{content:"\fXXX"}
rules = re.findall(r'(\.fa-([a-z0-9-]+):before\{[^}]+\})', css)
lookup = {name: rule for rule, name in rules}

matched = []
for name in sorted(used):
    if name in lookup:
        matched.append(lookup[name])
    else:
        print(f"  WARNING: fa-{name} not found in full FA CSS", file=sys.stderr)

print("".join(matched))
PYEOF
)

# Pull: @font-face + .fab/.fas tail (everything after last icon rule)
TAIL=$(python3 - <<'PYEOF'
import re

css = open("scripts/fa-source/fa-full.css").read()
# Find last icon :before rule end position
matches = list(re.finditer(r'\.fa-[a-z0-9-]+:before\{[^}]+\}', css))
if matches:
    print(css[matches[-1].end():])
PYEOF
)

# --- 3. Determine unicodes for woff2 subsetting ---
SOLID_UNICODES=$(python3 - "$USED" <<'PYEOF'
import re, sys

css = open("scripts/fa-source/fa-full.css").read()
used = set(n[3:] if n.startswith("fa-") else n for n in sys.argv[1].split())

# Map name -> unicode codepoint
rules = re.findall(r'\.fa-([a-z0-9-]+):before\{content:"\\([0-9a-fA-F]+)"\}', css)
lookup = {name: cp for name, cp in rules}

# Determine which font each icon belongs to by checking .fab rules
fab_names = set(re.findall(r'\.fa-([a-z0-9-]+):before', css[css.find('.fab{'):css.find('.fas{')]) if '.fab{' in css else [])

solid_cps = []
for name in used:
    if name in lookup and name not in fab_names:
        solid_cps.append("U+" + lookup[name].upper())

print(",".join(sorted(set(solid_cps))))
PYEOF
)

BRANDS_UNICODES=$(python3 - "$USED" <<'PYEOF'
import re, sys

css = open("scripts/fa-source/fa-full.css").read()
used = set(n[3:] if n.startswith("fa-") else n for n in sys.argv[1].split())

rules = re.findall(r'\.fa-([a-z0-9-]+):before\{content:"\\([0-9a-fA-F]+)"\}', css)
lookup = {name: cp for name, cp in rules}

# Extract brand icon names from the brands font-face block context
# Brand icons are those in the .fab class section
fab_section_match = re.search(r'\.fab\{font-family:"Font Awesome 5 Brands"\}', css)
if not fab_section_match:
    sys.exit(0)

# Use a known brands list approach: find which codepoints are in the brands font
# by checking the fa-brands-400 woff2 via pyftsubset listing
import subprocess, json
result = subprocess.run(
    ["python3", "-c",
     "from fontTools.ttLib import TTFont; f=TTFont('scripts/fa-source/fa-brands-400-full.woff2'); "
     "cmap=f.getBestCmap(); print(' '.join(hex(c) for c in cmap.keys()))"],
    capture_output=True, text=True
)
brand_cps = set(int(x, 16) for x in result.stdout.split())

brand_unicodes = []
for name in used:
    if name in lookup:
        cp = int(lookup[name], 16)
        if cp in brand_cps:
            brand_unicodes.append("U+" + lookup[name].upper())

print(",".join(sorted(set(brand_unicodes))))
PYEOF
)

# --- 4. Write all.min.css (placeholder URLs; hashes added after woff2 generation) ---
printf '%s%s%s\n' "$BASE" "$ICON_RULES" "$TAIL" > "$OUT_CSS"
echo "Written: $OUT_CSS"

# --- 5. Regenerate woff2 subsets + stamp content-hash into CSS URLs ---
if [ -n "$SOLID_UNICODES" ]; then
  pyftsubset "$SOLID_FULL" \
    --unicodes="$SOLID_UNICODES" \
    --flavor=woff2 \
    --output-file="$OUT_SOLID" 2>/dev/null
  SOLID_HASH=$(md5sum "$OUT_SOLID" | cut -c1-8)
  sed -i "s|webfonts/fa-solid-900\.woff2|webfonts/fa-solid-900.woff2?v=$SOLID_HASH|g" "$OUT_CSS"
  echo "Written: $OUT_SOLID ($(wc -c < "$OUT_SOLID") bytes, hash=$SOLID_HASH)"
fi

if [ -n "$BRANDS_UNICODES" ]; then
  pyftsubset "$BRANDS_FULL" \
    --unicodes="$BRANDS_UNICODES" \
    --flavor=woff2 \
    --output-file="$OUT_BRANDS" 2>/dev/null
  BRANDS_HASH=$(md5sum "$OUT_BRANDS" | cut -c1-8)
  sed -i "s|webfonts/fa-brands-400\.woff2|webfonts/fa-brands-400.woff2?v=$BRANDS_HASH|g" "$OUT_CSS"
  echo "Written: $OUT_BRANDS ($(wc -c < "$OUT_BRANDS") bytes, hash=$BRANDS_HASH)"
fi

echo "Done."
