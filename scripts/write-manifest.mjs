// Writes dist/version.json after the build: the manifest the app's update
// check fetches (and future native updaters poll). Runs post-build.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = process.env.PALANG_OUT || "dist";
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

mkdirSync(join(root, OUT), { recursive: true });
writeFileSync(
  join(root, OUT, "version.json"),
  JSON.stringify({ version: pkg.version, note: "" }, null, 2) + "\n"
);
console.log(`manifest written: dist/version.json (v${pkg.version})`);
