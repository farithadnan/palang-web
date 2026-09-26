/**
 * Generate the app icon art (app-icon.png + assets/icon-only.png).
 *
 * WHY THIS EXISTS: the previous icon was a #111 square with a small #fafafa
 * mark — 99.9% dark. At 32px (taskbar / APK launcher) it lost every light
 * pixel and Windows showed a plain dark square. The mark must therefore READ
 * SMALL: a solid accent block with chunky dark bars, no thin lines.
 *
 * Run: node scripts/make-icon.mjs
 * Then: npx tauri icon app-icon.png   (regenerates .ico/.icns/png sets)
 */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const SIZE = 1024;
const GOLD = [201, 180, 88];
const DARK = [17, 17, 17];

/** Rounded-rect alpha coverage at (x,y) for a box with radius r. */
function roundAlpha(x, y, size, r) {
  const inset = 0.5;
  const cx = Math.min(Math.max(x + inset, r), size - r);
  const cy = Math.min(Math.max(y + inset, r), size - r);
  const d = Math.hypot(x + inset - cx, y + inset - cy);
  if (d <= r - 1) return 1;
  if (d >= r + 1) return 0;
  return 1 - (d - (r - 1)) / 2;
}

function render(size) {
  const r = size * 0.22;
  const barW = size * 0.62;
  const barH = size * 0.1;
  const gap = size * 0.08;
  const totalH = barH * 2 + gap;
  const y1 = (size - totalH) / 2;
  const y2 = y1 + barH + gap;
  const x0 = (size - barW) / 2;

  const px = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const a = roundAlpha(x, y, size, r);
      let col = GOLD;
      const inBar =
        x >= x0 && x < x0 + barW &&
        ((y >= y1 && y < y1 + barH) || (y >= y2 && y < y2 + barH));
      if (inBar) {
        // second bar is the same mark at 50% opacity, like the UI brand mark
        const faded = y >= y2;
        col = faded
          ? GOLD.map((c, i) => Math.round(c * 0.5 + DARK[i] * 0.5))
          : DARK;
      }
      const o = (y * size + x) * 4;
      px[o] = col[0];
      px[o + 1] = col[1];
      px[o + 2] = col[2];
      px[o + 3] = Math.round(a * 255);
    }
  }
  return px;
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, px) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("assets", { recursive: true });
writeFileSync("app-icon.png", png(SIZE, render(SIZE)));
writeFileSync("assets/icon-only.png", png(SIZE, render(SIZE)));
console.log("wrote app-icon.png + assets/icon-only.png");
