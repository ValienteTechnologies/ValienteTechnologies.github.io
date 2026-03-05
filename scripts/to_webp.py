#!/usr/bin/env python3
# NOTE: This directory is excluded from Jekyll builds (see _config.yml exclude).
# These are local development scripts, not part of the website.
"""
Convert PNG/JPG images to WebP.

Usage:
  python3 scripts/to_webp.py assets/img/partners/new-logo.png
  python3 scripts/to_webp.py assets/img/portfolio/
  python3 scripts/to_webp.py assets/img/ --recursive
"""

import argparse
import pathlib
import sys
from PIL import Image

SUPPORTED = {'.png', '.jpg', '.jpeg'}


def convert(src: pathlib.Path, quality: int, max_width: int | None) -> None:
    img = Image.open(src)

    if max_width and img.width > max_width:
        ratio = max_width / img.width
        new_size = (max_width, int(img.height * ratio))
        img = img.resize(new_size, Image.LANCZOS)
        print(f"  resized to {new_size[0]}x{new_size[1]}")

    dest = src.with_suffix('.webp')
    img.save(dest, 'webp', quality=quality)
    src_kb = src.stat().st_size / 1024
    dest_kb = dest.stat().st_size / 1024
    print(f"  {src.name} → {dest.name}  ({src_kb:.0f}KB → {dest_kb:.0f}KB)")


def main():
    parser = argparse.ArgumentParser(description='Convert images to WebP')
    parser.add_argument('path', help='File or directory to convert')
    parser.add_argument('-q', '--quality', type=int, default=85,
                        help='WebP quality 1-100 (default: 85)')
    parser.add_argument('-w', '--max-width', type=int, default=None,
                        help='Resize if wider than this (pixels)')
    parser.add_argument('-r', '--recursive', action='store_true',
                        help='Recurse into subdirectories')
    args = parser.parse_args()

    target = pathlib.Path(args.path)

    if target.is_file():
        if target.suffix.lower() not in SUPPORTED:
            print(f"Unsupported format: {target.suffix}")
            sys.exit(1)
        print(f"Converting {target}")
        convert(target, args.quality, args.max_width)

    elif target.is_dir():
        pattern = '**/*' if args.recursive else '*'
        files = [p for p in target.glob(pattern)
                 if p.is_file() and p.suffix.lower() in SUPPORTED]
        if not files:
            print("No PNG/JPG files found.")
            sys.exit(0)
        for f in sorted(files):
            print(f"Converting {f}")
            convert(f, args.quality, args.max_width)

    else:
        print(f"Path not found: {target}")
        sys.exit(1)

    print("Done.")


if __name__ == '__main__':
    main()
