# ValienteTechnologies.github.io

Marketing site for [Valiente Technologies](https://valiente.com.tr) — Turkey's first cybersecurity firm based in Antalya.

Built with **Jekyll** + [jekyll-agency](https://github.com/y7kim/agency-jekyll-theme) theme, deployed via **GitHub Pages**. DNS is managed through **Cloudflare** but kept DNS-only (grey-clouded, not proxied) so GitHub Pages can serve the site and manage its TLS certificate directly.

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Ruby | 3.3 (see `.ruby-version`) | Jekyll runtime |
| Bundler | latest | Gem management |
| Python 3 | any | WebP image conversion |
| Node / npm | any | JS minification |
| terser | `npm install -g terser` | Minify `assets/js/src/*.js` |
| Pillow | `pip install pillow` | Convert PNG/JPG → WebP on commit |

---

## Setup

```bash
# 1. Clone
git clone https://github.com/ValienteTechnologies/ValienteTechnologies.github.io
cd ValienteTechnologies.github.io

# 2. Ruby deps
bundle install

# 3. Python deps (for pre-commit WebP hook)
pip install pillow

# 4. JS minifier
npm install -g terser

# 5. Install git hooks
cp scripts/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

---

## Running locally

```bash
bundle exec jekyll serve --livereload
# → http://localhost:4000
```

---

## Project structure

```
_data/          # All site content (YAML). Edit here, not in templates.
  i18n.yml      # UI strings (breadcrumbs, title suffixes)
  header.yml    # Hero section text
  services.yml  # Services section
  testimonials.yml
  footer.yml
  navigation.yml
  style.yml     # Highlight color
  ...

_includes/
  layout/       # nav.html, nav-header.html, head.html, footer.html
  sections/     # services.html, testimonials.html, contact_form.html, ...

_layouts/
  default.html  # Base layout (scripts, footer)
  home.html     # Home page (nav+header, sections, page-specific JS)
  subpage.html  # Inner pages
  error.html    # 404

_pages/         # Page definitions (mostly include composition)
_sass/
  base/         # _variables.scss, _mixins.scss, _page.scss
  components/   # _navbar.scss, _buttons.scss, _utilities.scss, ...
  layout/       # Per-section SCSS (_masthead, _services, _footer, ...)

assets/
  css/          # valiente-*.scss entry sheets (Jekyll-compiled; Bootstrap is
                #   inlined via _sass/vendor/_bootstrap.scss), all.min.css
                #   (FontAwesome subset), webfonts/
  js/           # Minified JS (do not edit directly)
  js/src/       # JS source files (edit here, pre-commit auto-minifies)
  img/          # WebP images (PNG/JPG source → pre-commit auto-converts)

scripts/
  pre-commit    # Git hook: WebP conversion + JS minification
  minify-js.sh  # Manual: ./scripts/minify-js.sh [filename]
  to_webp.py    # Image converter used by pre-commit hook
```

---

## i18n (bilingual TR/EN)

The site uses [jekyll-polyglot](https://github.com/untra/polyglot). All content lives in `_data/*.yml` with this pattern:

```yaml
tr: &DEFAULT
  title: "Türkçe başlık"

tr-TR:
  <<: *DEFAULT   # inherits TR

en:
  title: "English title"
```

UI strings (breadcrumbs, title suffixes, etc.) live in `_data/i18n.yml`.

---

## JS workflow

Source files live in `assets/js/src/`. **Never edit the minified files in `assets/js/` directly.**

```bash
# Edit source
vim assets/js/src/mesh-network.js

# Minify one file
./scripts/minify-js.sh mesh-network.js

# Or minify all
./scripts/minify-js.sh
```

The pre-commit hook does this automatically when you stage `assets/js/src/*.js`.

---

## Images

Stage a PNG/JPG and the pre-commit hook converts it to WebP automatically. Use `<picture>` elements in templates for WebP + PNG/JPG fallback.

---

## Fonts

Montserrat (400/700), Droid Serif (400 italic only — the only style the site
actually uses), and IBM Plex Mono (400/500, normal style only — used solely by
the BadgerEye product page for chips and metric values) are self-hosted under
`assets/fonts/` instead of loaded from Google Fonts, so the site's CSS can be
render-blocking without adding a cross-origin round-trip. Each face ships as
separate `latin` and `latin-ext` woff2 subsets (unicode-range values copied
from Google's own CSS) so Turkish text (ş ğ ı İ ö ü ç) renders correctly — the
two ranges are needed because Google's `latin-ext` subset excludes basic
Latin/ASCII. The `@font-face` rules live in `_sass/base/_fonts.scss` —
IBM Plex Mono's rules are declared sitewide too (the browser only fetches a
face once a page actually renders text in it, so this costs nothing on pages
that don't use it). To refresh a subset (e.g. a new weight), fetch
`https://fonts.googleapis.com/css2?family=...` with an older Chrome user agent
(e.g. `Chrome/60.0.3112.113`) to get static per-weight files instead of a
merged variable font, then download the `latin`/`latin-ext` file URLs it
returns.

---

## Deployment

Push to `main` → GitHub Pages builds and serves the site directly; the Cloudflare DNS records are DNS-only (not proxied) so GitHub can renew the TLS certificate. Because the domain is grey-clouded, Cloudflare proxy-only features (email obfuscation, cache rules, AI scraping protection, etc.) are not in the request path — `robots.txt` is served directly from this repo by GitHub Pages, not by Cloudflare.

Analytics: GA4 tag `G-FF9YHPMVJL`.
