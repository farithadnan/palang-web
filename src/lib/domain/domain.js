/* Pure palang domain helpers: constants and spec builders. No DOM, no fetch. */

export const PAGE_SIZES = [
  { v: "A4", l: "A4 (most common)" },
  { v: "A5", l: "A5" },
  { v: "Letter", l: "Letter" },
  { v: "fit", l: "Fit the image" },
];

/* Point dimensions per page size (matches the server's paper sizes). */
export const PAGE_DIMS = {
  A4: { w: 595, h: 842 },
  A5: { w: 419, h: 595 },
  Letter: { w: 612, h: 792 },
};

/** Image->page fit rect, mirroring the server's _page_rect (margin 0). */
export function fittedPageSize(imgW, imgH, pageW, pageH) {
  if (!imgW || !imgH) return { w: pageW, h: pageH };
  const pageRatio = pageW / pageH;
  return imgW / imgH > pageRatio
    ? { w: pageW, h: pageW / (imgW / imgH) }
    : { w: pageH * (imgW / imgH), h: pageH };
}

/** The page box for an image: the chosen paper size, or — for "fit" — a page
 *  shaped exactly like the image, scaled inside A4, so the photo fills it with
 *  no white border. Falls back to A4 for unknown sizes or missing dimensions. */
export function pageDims(pageSize, imgW = 0, imgH = 0) {
  if (pageSize !== "fit") return PAGE_DIMS[pageSize] ?? PAGE_DIMS.A4;
  if (!imgW || !imgH) return PAGE_DIMS.A4;
  const ratio = imgW / imgH;
  const pageRatio = PAGE_DIMS.A4.w / PAGE_DIMS.A4.h;
  return ratio > pageRatio
    ? { w: PAGE_DIMS.A4.w, h: PAGE_DIMS.A4.w / ratio }
    : { w: PAGE_DIMS.A4.h * ratio, h: PAGE_DIMS.A4.h };
}

export const FONT_SIZE = 18;

export function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

export function round1(v) {
  return Math.round(v * 10) / 10;
}

/** A fresh, untouched palang spec (absolute positioning mode, used by the canvas). */
export function defaultSpec() {
  return {
    mode: "band",
    text: "UNTUK KEGUNAAN BANK SAHAJA", // visible immediately: users see where the marking sits
    color: "#000000",
    style: "lines", // the product ships one style: a transparent lines band
    topPt: null, // null = centred vertically
    leftPt: null, // null = centred horizontally
    heightPt: 48,
    widthPt: 180,
    fontSize: 18,
    rotationDeg: 0,
    armed: true, // the marking shows on the page as soon as a document loads
  };
}

/** The label the palang renderer draws: text, colour and font size. A lines
 *  band is monochrome, so the text shares the band colour. This is the ONLY
 *  shape the engine consumes — everything else in a spec is editor geometry. */
export function palangLabel(spec) {
  return {
    text: (spec.text || "").trim(),
    color: spec.color,
    fontPt: spec.fontSize || FONT_SIZE,
  };
}

/** Parse a page-range box ("1-3, 5, 8-10") into groups of 1-based page numbers,
 *  each clamped to 1..max. One group per comma part, so "one file per range"
 *  can be offered. Pure + unit-tested. */
export function parseRangeGroups(text, max) {
  const cap = Math.max(0, Math.floor(max) || 0);
  return String(text || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((part) => {
      const m = part.match(/^(\d+)\s*-\s*(\d+)$/);
      if (m) {
        let a = Number(m[1]);
        let b = Number(m[2]);
        if (a > b) [a, b] = [b, a];
        const out = [];
        for (let i = a; i <= b; i++) if (i >= 1 && i <= cap) out.push(i);
        return out;
      }
      const n = Number(part);
      return Number.isInteger(n) && n >= 1 && n <= cap ? [n] : [];
    })
    .filter((g) => g.length);
}

