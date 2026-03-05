# scripts/

Local development scripts. This directory is excluded from Jekyll builds via `_config.yml` and is never served as part of the website.

## to_webp.py

Converts PNG/JPG images to WebP format.

**Requirements:**
```bash
pip install pillow
```

**Usage:**
```bash
# Single file
python3 scripts/to_webp.py assets/img/partners/new-logo.png

# Whole folder
python3 scripts/to_webp.py assets/img/portfolio/

# Recursive + resize to max 900px wide + quality 80
python3 scripts/to_webp.py assets/img/ --recursive --max-width 900 --quality 80
```

**Options:**

| Flag | Default | Description |
|------|---------|-------------|
| `-q`, `--quality` | 85 | WebP quality 1–100 |
| `-w`, `--max-width` | none | Resize if wider than this (px) |
| `-r`, `--recursive` | false | Recurse into subdirectories |

After converting, add the image to HTML using the `<picture>` pattern:

```html
<picture>
  <source srcset="image.webp" type="image/webp">
  <img src="image.png" alt="...">
</picture>
```
