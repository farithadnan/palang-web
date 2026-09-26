/**
 * Pre-render one index.html per site route, so clean URLs work on ANY static
 * host (a plain nginx, GitHub Pages, `python3 -m http.server`, a CDN) with no
 * rewrite rule: /install/ is a real directory containing the app shell, which
 * then reads location.pathname and renders that page.
 *
 * Site build only — the app build ships hash routes and needs none of this.
 * Runs after vite build, before write-manifest.
 */
import { mkdirSync, copyFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";

const ROUTES = ["install", "privacy", "docs", "features/convert", "features/palang", "features/merge"];
const OUT = process.env.PALANG_OUT || "dist";

if (!existsSync(`${OUT}/index.html`)) {
  console.error(`prerender: ${OUT}/index.html missing — run vite build first`);
  process.exit(1);
}

for (const r of ROUTES) {
  const out = `${OUT}/${r}/index.html`;
  mkdirSync(dirname(out), { recursive: true });
  copyFileSync(`${OUT}/index.html`, out);
}

console.log(`prerendered ${ROUTES.length} route(s): ${ROUTES.join(", ")}`);
