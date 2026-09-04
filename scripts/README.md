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

**Requirements:** `npm install -g terser` — no version is pinned anywhere in this repo (there's no `package.json`); the hook and this script just invoke whatever global `terser` is on `PATH`.

---

## purgecss.config.js (repo root)

Manual audit tool, not part of the build or hooks. Run after a Jekyll build to check for unused CSS:

```bash
bundle exec jekyll build
npx purgecss --config purgecss.config.js
```

Output lands in `_site/assets/css/` for inspection only — never edit generated CSS; make changes in the SCSS source under `_sass/` instead. Like `terser`, this uses `npx` with no pinned version.

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

---

## visual-sweep.js

Screenshots every page in `sitemap.xml` at each given width and flags layout defects: horizontal
overflow, text clipped or painting outside its block/viewport, the navbar toggler breakpoint,
`position:fixed` elements colliding with the footer, broken/undersized images, and console or
network errors. Also captures the home-page mobile menu open and the first brochure modal open
on `/corporate/` and `/en/corporate/`. Writes `<out>/report.json` plus PNGs, prints a
page × width × variant table, and exits 1 if any check fails.

```bash
bundle exec jekyll build
python3 -m http.server 4090 --directory _site &

node scripts/visual-sweep.js --base http://localhost:4090 --out /tmp/sweep \
  --widths 360,390,1280 --fallback

fuser -k 4090/tcp
```

| Flag | Default | Description |
|------|---------|-------------|
| `--base` | required | Site origin to crawl (must be already built and served) |
| `--out` | required | Output directory for screenshots and `report.json` |
| `--widths` | `360,390,1280` | Comma-separated viewport widths; `< 768` gets mobile emulation |
| `--pages` | sitemap.xml | Comma-separated page paths, overrides the sitemap crawl |
| `--fallback` | off | Adds a second pass per page/width with `.woff2` requests aborted, to check fallback-font rendering |

**Requirements:** `playwright-core` and a Chromium build, unpinned — the tools are not
declared anywhere in this repo (there's no `package.json`). Paths resolve from env vars with
fallbacks to a known-good local install:

- `PLAYWRIGHT_CORE` — default `/home/tfp/selge-captest/pw/node_modules/playwright-core`
- `CHROME_PATH` — default `~/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`
