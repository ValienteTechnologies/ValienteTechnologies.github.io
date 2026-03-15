# scripts/

Local development scripts. Excluded from Jekyll builds via `_config.yml` — never served.

## Setup (run once after cloning)

```bash
cp scripts/pre-commit .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
pip install pillow fonttools brotli
npm install -g terser
```

---

## pre-commit

Git hook. Automatically runs on `git commit`:

| Trigger | Action |
|---------|--------|
| Staged `.png`/`.jpg`/`.jpeg` | Converts to WebP, stages the `.webp` |
| Staged `assets/js/src/*.js` | Minifies to `assets/js/`, stages output |
| Staged `_includes/`, `_layouts/`, `_pages/`, `_data/`, `assets/js/src/` | Regenerates FontAwesome subset |

---

## subset-fa.sh

Scans all source files for used `fa-*` icon classes, then rebuilds:
- `assets/css/all.min.css` — base utilities + only the icon rules actually used
- `assets/css/webfonts/fa-solid-900.woff2` — subsetted to used glyphs only
- `assets/css/webfonts/fa-brands-400.woff2` — subsetted to used glyphs only

Run manually after adding new icons if you're not committing the HTML change at the same time:

```bash
bash scripts/subset-fa.sh
```

**Requirements:** `pip install fonttools brotli`

**Source files** (in `fa-source/`): original unsubsetted FA 5.10.2 CSS and woff2 fonts. Do not edit these — they are the reference input for subsetting.

---

## minify-js.sh

Manually minify JS source files from `assets/js/src/` → `assets/js/`.
The pre-commit hook handles this automatically on commit; use this to rebuild everything at once.

```bash
# All files
bash scripts/minify-js.sh

# Single file
bash scripts/minify-js.sh mesh-network.js
```

**Requirements:** `npm install -g terser`

---

## to_webp.py

Converts PNG/JPG images to WebP format.

```bash
# Single file
python3 scripts/to_webp.py assets/img/partners/new-logo.png

# Whole folder
python3 scripts/to_webp.py assets/img/portfolio/

# Recursive + resize to max 900px wide
python3 scripts/to_webp.py assets/img/ --recursive --max-width 900 --quality 80
```

| Flag | Default | Description |
|------|---------|-------------|
| `-q`, `--quality` | 85 | WebP quality 1–100 |
| `-w`, `--max-width` | none | Resize if wider than this (px) |
| `-r`, `--recursive` | false | Recurse into subdirectories |

**Requirements:** `pip install pillow`
