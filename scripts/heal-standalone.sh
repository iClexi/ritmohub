#!/bin/sh
# heal-standalone.sh — complete assets and native image runtime in standalone.
# Runs the same copy that `npm run postbuild` needs, but is idempotent and safe
# to call from systemd ExecStartPre or by hand after a partial deploy.
#
# Background: `output: "standalone"` does not include public/ or .next/static/.
# File tracing can also omit Sharp's libvips shared object, which makes
# /_next/image return 400 even though the source image exists.

set -e

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

if [ ! -d .next/standalone ]; then
  echo "heal-standalone: no .next/standalone — nothing to do"
  exit 0
fi

mkdir -p .next/standalone/public .next/standalone/.next/static
cp -a public/. .next/standalone/public/
cp -a .next/static/. .next/standalone/.next/static/

if [ -d node_modules/@img ]; then
  mkdir -p .next/standalone/node_modules/@img
  cp -a node_modules/@img/. .next/standalone/node_modules/@img/
fi

echo "heal-standalone: copied assets and Sharp native runtime into standalone"
