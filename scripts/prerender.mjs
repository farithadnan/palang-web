/**
 * Pre-render one index.html per site route, so clean URLs work on ANY static
 * host (a plain nginx, GitHub Pages, `python3 -m http.server`, a CDN) with no
 * rewrite rule: /install/ is a real directory containing the app shell, which
 * then reads location.pathname and renders that page.
 *
 * Also injects per-route <title>/<meta description> and writes robots.txt +
 * sitemap.xml, so crawlers get real metadata per page (the SPA sets titles at
 * runtime, which crawlers that do not run JS never see).
 *
 * Site build only — the app build ships hash routes and needs none of this.
 * Runs after vite build, before write-manifest.
 */
import { mkdirSync, copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { SITE_URL } from "../src/lib/util/links.js";

const OUT = process.argv[2] || "dist";

// route -> { title, desc }. "" is the home page (dist/index.html itself).
const META = {
  "": {
    title: "Palang — prepare documents for sharing",
    desc: "Convert photos to PDF, stamp a palang purpose band, and merge PDFs. Everything runs on your device — nothing is uploaded.",
  },
  install: {
    title: "Install Palang (Windows & Android)",
    desc: "Download Palang for Windows (EXE/MSI) and Android (APK). It works offline; nothing is uploaded.",
  },
  privacy: {
    title: "Privacy — Palang",
    desc: "Palang is fully offline: your documents are converted, stamped and merged on your device and never leave it.",
  },
  docs: {
    title: "Developer guide — Palang",
    desc: "How the Palang site and the two app builds are produced from one codebase.",
  },
  "features/convert": {
    title: "Convert photos to PDF — Palang",
    desc: "Turn photos into a PDF, crop and enhance them, and pick the page size. On-device, nothing uploaded.",
  },
  "features/palang": {
    title: "Palang watermark — Palang",
    desc: "Stamp a palang purpose band on photos and PDFs, place it, rotate and colour it. On-device.",
  },
  "features/merge": {
    title: "Merge PDFs — Palang",
    desc: "Combine PDFs into one document, reorder them, and preview every page. On-device.",
  },
};

const ROUTES = Object.keys(META);

if (!existsSync(`${OUT}/index.html`)) {
  console.error(`prerender: ${OUT}/index.html missing — run vite build first`);
  process.exit(1);
}

function escapeAttr(s) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function withMeta(html, meta) {
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeAttr(meta.title)}</title>`)
    .replace(
      /<meta name="description" content="[^"]*">/,
      `<meta name="description" content="${escapeAttr(meta.desc)}">`
    );
}

const shell = readFileSync(`${OUT}/index.html`, "utf8");
writeFileSync(`${OUT}/index.html`, withMeta(shell, META[""]));

for (const r of ROUTES) {
  if (!r) continue;
  const out = `${OUT}/${r}/index.html`;
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, withMeta(shell, META[r]));
}

const loc = (r) => `${SITE_URL}${r ? r + "/" : ""}`;
const sitemap =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  ROUTES.map((r) => `  <url><loc>${loc(r)}</loc></url>`).join("\n") +
  "\n</urlset>\n";
writeFileSync(`${OUT}/sitemap.xml`, sitemap);
writeFileSync(`${OUT}/robots.txt`, `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n`);

console.log(`prerendered ${ROUTES.length} route(s) + sitemap + robots: ${ROUTES.join(", ")}`);
