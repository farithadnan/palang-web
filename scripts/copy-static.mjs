// Copy pdf.js's standard font data into dist/ so page rendering never needs
// an external CDN (the default StandardFontDataFactory URL is a CDN, which
// stalls offline). Run after `vite build`.
import { cpSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules/pdfjs-dist/standard_fonts");
const dest = join(root, "dist/standard_fonts");
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log("standard fonts copied to dist/standard_fonts");
