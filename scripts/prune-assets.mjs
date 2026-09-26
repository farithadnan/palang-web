/**
 * Prune dist/assets, keeping what the CURRENT build needs plus ONE previous
 * generation (so a visitor with a cached index.html still boots the old bundle
 * instead of hitting a 404 and seeing a blank page).
 *
 * WHY NOT BY MTIME: the previous version kept "the 2 newest index-*.js", which
 * assumes each generation is a single file. Once the build emitted lazy chunks
 * every chunk is named index-<hash>.js too, so the rule deleted current files —
 * including the entry bundle that index.html references, which shipped a white
 * page to the live site. The manifest is the authoritative list, so use it.
 *
 * Requires build.manifest in vite.config.js (dist/.vite/manifest.json).
 */
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const assetsDir = join(dist, "assets");
const manifestPath = join(dist, ".vite/manifest.json");
const historyPath = join(dist, ".bundle-history.json");

if (!existsSync(manifestPath)) {
  console.error("prune-assets: dist/.vite/manifest.json missing — is build.manifest enabled?");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const current = new Set();
for (const entry of Object.values(manifest)) {
  if (entry.file) current.add(entry.file);
  for (const f of entry.css ?? []) current.add(f);
  for (const f of entry.assets ?? []) current.add(f);
}
// Belt and braces: anything index.html points at must never be pruned.
const html = readFileSync(join(dist, "index.html"), "utf8");
for (const m of html.matchAll(/assets\/[^"'\s>]+/g)) current.add(m[0]);

let previous = [];
try {
  previous = JSON.parse(readFileSync(historyPath, "utf8")).files ?? [];
} catch {
  /* first run */
}

const keep = new Set([...current, ...previous]);
let removed = 0;
for (const f of readdirSync(assetsDir)) {
  if (!keep.has("assets/" + f)) {
    rmSync(join(assetsDir, f), { force: true });
    removed++;
  }
}

writeFileSync(historyPath, JSON.stringify({ files: [...current] }, null, 2));
console.log(
  `assets: kept ${current.size} current + ${previous.length} previous file(s), pruned ${removed}`
);
