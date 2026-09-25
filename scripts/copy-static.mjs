// Copy pdf.js's standard font data into dist/ so page rendering never needs
// an external CDN (the default StandardFontDataFactory URL is a CDN, which
// stalls offline). Run after `vite build`.
import { cpSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules/pdfjs-dist/standard_fonts");
const dest = join(root, "dist/standard_fonts");
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log("standard fonts copied to dist/standard_fonts");

// Stale-bundle safety net: a visitor who cached an older index.html must not
// hit a 404 (and a blank app) when their asset hash was deleted by a rebuild.
// Keep the previous generation of JS and CSS alongside the current one, prune
// the rest. A stale index.html then loads the previous bundle, which shows the
// update banner pointing at the new version instead of dying. Kept per
// extension (js / css) so each generation's pair survives together.
const assets = join(root, "dist/assets");
let prune = [];
for (const ext of ["js", "css"]) {
  const gens = readdirSync(assets)
    .filter((f) => new RegExp(`^index-.*\\.${ext}$`).test(f))
    .map((f) => ({ f, m: statSync(join(assets, f)).mtimeMs }))
    .sort((b, a) => a.m - b.m);
  prune = prune.concat(gens.slice(2)); // keep the current + one previous generation
}
for (const { f } of prune) rmSync(join(assets, f), { force: true });
if (prune.length) console.log(`pruned ${prune.length} superseded bundle(s) (kept 1 previous generation)`);
