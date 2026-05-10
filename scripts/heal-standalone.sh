#!/bin/sh
# heal-standalone.sh — make sure .next/standalone has public/ and .next/static.
# Runs the same copy that `npm run postbuild` does, but is idempotent and safe to
# call from systemd ExecStartPre or by hand after a partial deploy.
#
# Background: `output: "standalone"` does not include the public/ folder or
# .next/static/, so a freshly built standalone serves 404 for /artists/*, etc.
# unless those are copied in. This script restores them.

set -e

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

if [ ! -d .next/standalone ]; then
  echo "heal-standalone: no .next/standalone — nothing to do"
  exit 0
fi

rm -rf .next/standalone/public .next/standalone/.next/static
cp -a public .next/standalone/public
mkdir -p .next/standalone/.next
cp -a .next/static .next/standalone/.next/static

echo "heal-standalone: copied public/ and .next/static into .next/standalone"
