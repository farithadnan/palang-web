/**
 * Final pass over dist/, run after vite build + prune + prerender:
 *
 * 1. STRIP `crossorigin` from the emitted HTML. Vite adds it to the entry
 *    <script type="module">, which forces the request into CORS mode. Inside the
 *    packaged shells (tauri://, capacitor://https://localhost) the asset loader
 *    is not obliged to answer with Access-Control-Allow-Origin, and when it does
 *    not the module never executes: a BLANK app window. Same-origin assets need
 *    no CORS, so removing the attribute is safe for the website too.
 *
 * 2. VERIFY every asset the HTML and the JS chunks reference exists. A build that
 *    ships a dangling reference produces a white page for every visitor (this
 *    happened: the old prune deleted current chunks while index.html kept
 *    pointing at them). Fail the build instead of shipping it.
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = process.env.PALANG_OUT || "dist";
const dist = join(root, OUT);

// ---------- 1. strip crossorigin from every emitted HTML ----------
const htmlFiles = ["index.html"];
for (const f of readdirSync(dist, { withFileTypes: true })) {
  if (f.isDirectory() && existsSync(join(dist, f.name, "index.html"))) {
    htmlFiles.push(join(f.name, "index.html"));
  }
}
let stripped = 0;
for (const rel of htmlFiles) {
  const p = join(dist, rel);
  const before = readFileSync(p, "utf8");
  const after = before.replace(/ crossorigin/g, "");
  if (after !== before) {
    writeFileSync(p, after);
    stripped++;
  }
}
console.log(`crossorigin stripped from ${stripped}/${htmlFiles.length} HTML file(s)`);

// ---------- 2. verify every referenced asset exists ----------
const refs = new Set();
/** collect refs from dist/index.html: they are written as assets/<file> */
const addHtmlRefs = (text) => {
  for (const m of text.matchAll(/assets\/[A-Za-z0-9._-]+/g)) refs.add(m[0]);
};
/** collect refs from a JS chunk: chunks import their siblings RELATIVE to
 *  themselves ("./index-abc.js"), which is exactly how the shipped app build
 *  pointed at three chunk files that had been pruned away. */
const addChunkRefs = (text) => {
  // Only Vite-emitted names count (name-HASH8.ext): a bare literal like
  // "./pdf.worker.mjs" is a library default, not a file this build wrote, and
  // flagging it would fail every build for nothing.
  for (const m of text.matchAll(/["'`]\.\/([A-Za-z0-9._-]+-[A-Za-z0-9_-]{6,12}\.(?:js|css|mjs|woff2|png))["'`]/g)) {
    refs.add("assets/" + m[1]);
  }
  for (const m of text.matchAll(/assets\/[A-Za-z0-9._-]+/g)) refs.add(m[0]);
};
addHtmlRefs(readFileSync(join(dist, "index.html"), "utf8"));

// Scan only THIS generation (the manifest's files). The previous generation is
// kept on purpose for cached visitors, but it is a safety net, not a build
// input: a stale chunk referring to its own pruned sibling must not fail a
// deploy of the current one.
const assetsDir = join(dist, "assets");
let current = readdirSync(assetsDir).filter((f) => f.endsWith(".js") || f.endsWith(".css"));
const manifestFile = join(dist, ".vite/manifest.json");
if (existsSync(manifestFile)) {
  const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
  const files = new Set();
  for (const e of Object.values(manifest)) {
    if (e.file) files.add(e.file.replace(/^assets\//, ""));
    for (const f of e.css ?? []) files.add(f.replace(/^assets\//, ""));
  }
  current = current.filter((f) => files.has(f));
}
for (const c of current) addChunkRefs(readFileSync(join(assetsDir, c), "utf8"));

const missing = [...refs].filter((r) => !existsSync(join(dist, r)));
if (missing.length) {
  console.error("dist verification FAILED — referenced but missing:");
  for (const m of missing) console.error("  " + m);
  process.exit(1);
}
console.log(`dist verified: ${refs.size} referenced asset(s), all present`);
