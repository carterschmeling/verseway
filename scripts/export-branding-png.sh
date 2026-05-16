#!/usr/bin/env bash
# Optional: export PNGs for best link-preview support (Facebook, LinkedIn).
# Requires macOS `sips` or ImageMagick `convert`. Run from repo root.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUBLIC="$ROOT/public"
ASSETS="$(cd "$ROOT/.." && pwd)/assets"

if [[ -f "$ASSETS/og-image.png" && -f "$ASSETS/icon-512.png" ]]; then
  cp "$ASSETS/og-image.png" "$PUBLIC/og-image.png"
  cp "$ASSETS/icon-512.png" "$PUBLIC/icon-512.png"
  if command -v sips >/dev/null; then
    sips -z 192 192 "$PUBLIC/icon-512.png" --out "$PUBLIC/icon-192.png" >/dev/null
    sips -z 180 180 "$PUBLIC/icon-512.png" --out "$PUBLIC/apple-touch-icon.png" >/dev/null
  fi
  echo "Copied PNG branding into public/"
  echo "Set VITE_SITE_URL in .env and use og-image.png in index.html if you prefer PNG previews."
else
  echo "No PNG assets found at $ASSETS"
  echo "Share previews will use public/og-image.svg (works on many platforms)."
fi
