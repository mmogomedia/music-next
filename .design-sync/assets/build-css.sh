#!/bin/sh
# Compile the design-system stylesheet. Run from the repo root.
# Re-run this whenever component classes or the Tailwind theme change, then
# re-run package-build.mjs so the bundle picks up the new CSS.
set -e
cd "$(dirname "$0")/../.."
# invoked via node: node_modules/tailwindcss/lib/cli.js ships without the exec bit
node ./node_modules/tailwindcss/lib/cli.js \
  --config .design-sync/assets/tailwind.ds.js \
  --input .design-sync/assets/ds.css \
  --output .design-sync/assets/ds.compiled.css \
  --minify
