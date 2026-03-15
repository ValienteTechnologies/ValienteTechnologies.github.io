#!/usr/bin/env bash
# Minify JS sources from assets/js/src/ into assets/js/
# Usage: ./scripts/minify-js.sh [filename]
#   No args: minifies all files
#   With arg: minifies only that file, e.g. ./scripts/minify-js.sh mesh-network.js

set -e

SRC="assets/js/src"
OUT="assets/js"

minify() {
  local file="$1"
  echo "Minifying $file..."
  terser "$SRC/$file" -o "$OUT/$file" --compress --mangle
}

if [ -n "$1" ]; then
  minify "$1"
else
  for f in "$SRC"/*.js; do
    minify "$(basename "$f")"
  done
fi

echo "Done."
