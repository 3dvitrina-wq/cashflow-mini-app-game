#!/bin/bash
# Converts all PNG/JPG assets to WebP, keeps originals, updates imports.
# Usage: bash scripts/convert-to-webp.sh
# Requires: brew install webp

set -e

ASSETS_DIR="apps/web/src/assets"
SRC_DIR="apps/web/src"

if ! command -v cwebp &> /dev/null; then
  echo "cwebp not found. Install: brew install webp"
  exit 1
fi

echo "Converting PNG assets to WebP (quality 85)..."
converted=0
skipped=0

while IFS= read -r f; do
  webp="${f%.png}.webp"
  if [ ! -f "$webp" ]; then
    cwebp -q 85 -mt "$f" -o "$webp" 2>/dev/null && echo "  + $(basename "$f")"
    converted=$((converted + 1))
  else
    skipped=$((skipped + 1))
  fi
done < <(find "$ASSETS_DIR" -name "*.png")

while IFS= read -r f; do
  base="${f%.jpg}"
  [ "$base" = "$f" ] && base="${f%.jpeg}"
  webp="$base.webp"
  if [ ! -f "$webp" ]; then
    cwebp -q 85 -mt "$f" -o "$webp" 2>/dev/null && echo "  + $(basename "$f")"
    converted=$((converted + 1))
  else
    skipped=$((skipped + 1))
  fi
done < <(find "$ASSETS_DIR" \( -name "*.jpg" -o -name "*.jpeg" \))

echo ""
echo "Converted: $converted  |  Already existed: $skipped"
echo ""
echo "Updating imports in .ts/.tsx files..."

updated=0
while IFS= read -r f; do
  if grep -qE "\.(png|jpg|jpeg)['\"]" "$f" 2>/dev/null; then
    sed -i '' \
      "s/\.png'/\.webp'/g; s/\.png\"/\.webp\"/g; \
       s/\.jpg'/\.webp'/g; s/\.jpg\"/\.webp\"/g; \
       s/\.jpeg'/\.webp'/g; s/\.jpeg\"/\.webp\"/g" "$f"
    echo "  * ${f#apps/web/src/}"
    updated=$((updated + 1))
  fi
done < <(find "$SRC_DIR" \( -name "*.ts" -o -name "*.tsx" \))

echo ""
echo "Updated $updated source files."
echo ""

echo "Old vs new asset sizes:"
old_size=$(find "$ASSETS_DIR" \( -name "*.png" -o -name "*.jpg" \) -exec du -k {} + | awk '{s+=$1}END{print s}')
new_size=$(find "$ASSETS_DIR" -name "*.webp" -exec du -k {} + | awk '{s+=$1}END{print s}')
echo "  PNG/JPG total: ${old_size} KB"
echo "  WebP total:    ${new_size} KB"
[ "$old_size" -gt 0 ] && echo "  Saved: $(( (old_size - new_size) * 100 / old_size ))%"

echo ""
echo "Done. Originals kept. Now build and deploy:"
echo "  npm run build --workspace=apps/web"
echo "  npx wrangler pages deploy apps/web/dist --project-name cashflow-game"
