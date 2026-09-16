#!/usr/bin/env bash
# Builds build/icon.icns (and icon.png) for electron-builder.
set -euo pipefail
cd "$(dirname "$0")/.."
python3 scripts/make-icon.py
rm -rf build/icon.iconset && mkdir -p build/icon.iconset
for size in 16 32 128 256 512; do
  sips -z $size $size build/icon.png --out "build/icon.iconset/icon_${size}x${size}.png" >/dev/null
  sips -z $((size * 2)) $((size * 2)) build/icon.png --out "build/icon.iconset/icon_${size}x${size}@2x.png" >/dev/null
done
iconutil -c icns build/icon.iconset -o build/icon.icns
rm -rf build/icon.iconset
echo "build/icon.icns written"
