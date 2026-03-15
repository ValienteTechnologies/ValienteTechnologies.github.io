# ValienteTechnologies.github.io

Marketing site for [Valiente Technologies](https://valientetechnologies.com) — Turkey's first cybersecurity firm based in Antalya.

Built with **Jekyll** + [jekyll-agency](https://github.com/y7kim/agency-jekyll-theme) theme, deployed via **GitHub Pages**, served behind **Cloudflare**.

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Ruby | 3.2.2 (see `.ruby-version`) | Jekyll runtime |
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
  style.yml     # Highlight color, fonts_urls
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
  css/          # agency.css (Jekyll-compiled), bootstrap.min.css, all.min.css
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

## Deployment

Push to `main` → GitHub Pages builds automatically. Cloudflare proxies the result.

**Cloudflare notes:**
- Email obfuscation: disable in Scrape Shield → Cloudflare Email Obfuscation to remove `email-decode.min.js`
- Cache TTLs for `/assets/*`: set via Cloudflare Cache Rules
- `robots.txt` is managed by Cloudflare AI scraping protection (Content-Signal directive is harmless)
- Analytics: GA4 tag `G-FF9YHPMVJL`
