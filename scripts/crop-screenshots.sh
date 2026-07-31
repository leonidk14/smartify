#!/usr/bin/env bash
#
# Crop raw phone screenshots for the README: remove the top system status bar
# (clock / battery / signal) and the bottom Android navigation bar, keeping the
# app's own UI in between.
#
# Workflow (run next time you refresh the screenshots):
#   1. Drop full-resolution phone screenshots into docs/screenshots/raw/
#      (this device: 1080x2340 portrait, 3-button navigation bar). Keep the
#      filenames the README references — home.jpg, lookup.jpg,
#      practice-sentence.jpg.
#   2. Run:  ./scripts/crop-screenshots.sh
#   3. Cropped versions are written to docs/screenshots/ (the paths the README
#      uses). Re-running is safe: it always crops from raw/, never in place, so
#      there is no risk of double-cropping.
#
# The four constants below are calibrated for 1080x2340 captures with the
# 3-button nav bar. On a different device/resolution, or with gesture
# navigation (a thin pill instead of three buttons), re-measure and adjust
# them — anything not matching RAW_WIDTHxRAW_HEIGHT is skipped rather than
# mis-cropped. Uses macOS `sips`, so no dependencies to install.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC_DIR="$REPO_ROOT/docs/screenshots/raw"
OUT_DIR="$REPO_ROOT/docs/screenshots"

RAW_WIDTH=1080
RAW_HEIGHT=2340
TOP_CROP=120    # px removed from the top — the system status bar
BOTTOM_CROP=170 # px removed from the bottom — the Android navigation bar
OUT_HEIGHT=$((RAW_HEIGHT - TOP_CROP - BOTTOM_CROP))

if [ ! -d "$SRC_DIR" ]; then
  echo "No raw/ directory. Create $SRC_DIR, add full-resolution screenshots, then re-run."
  exit 1
fi

shopt -s nullglob
raw_files=("$SRC_DIR"/*.jpg "$SRC_DIR"/*.jpeg "$SRC_DIR"/*.png)
if [ ${#raw_files[@]} -eq 0 ]; then
  echo "No images in $SRC_DIR. Add screenshots and re-run."
  exit 1
fi

cropped=0
for src in "${raw_files[@]}"; do
  name="$(basename "$src")"
  w=$(sips -g pixelWidth "$src" | awk '/pixelWidth/{print $2}')
  h=$(sips -g pixelHeight "$src" | awk '/pixelHeight/{print $2}')
  if [ "$w" != "$RAW_WIDTH" ] || [ "$h" != "$RAW_HEIGHT" ]; then
    echo "skip  $name — ${w}x${h}, expected ${RAW_WIDTH}x${RAW_HEIGHT} (constants are device-specific)"
    continue
  fi
  sips --cropOffset "$TOP_CROP" 0 -c "$OUT_HEIGHT" "$RAW_WIDTH" "$src" --out "$OUT_DIR/$name" >/dev/null
  echo "crop  $name — ${RAW_WIDTH}x${RAW_HEIGHT} -> ${RAW_WIDTH}x${OUT_HEIGHT}"
  cropped=$((cropped + 1))
done

echo "Done. ${cropped} image(s) written to docs/screenshots/."
