<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Deployment notes

The app is built with `output: "standalone"` and runs `node .next/standalone/server.js` (see `ritmohub.service` on the HA web VMs). Standalone does **not** copy `public/` or `.next/static/` into the standalone tree on its own — `npm run build` triggers `postbuild` to do it. If you ever deploy by syncing source without running `npm run build`, run `scripts/heal-standalone.sh` afterwards or `/artists/*`, `/cities/*`, `/brand/*` will all 404 in production.
