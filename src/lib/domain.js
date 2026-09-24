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

export const BAND_THICKNESS = { thin: 32, normal: 48, thick: 72 };
export const REGION_THICKNESS = { thin: 16, normal: 28, thick: 44 };
export const REGION_WIDTH = { narrow: 120, normal: 180, wide: 260 };
export const REGION_LEFT_PT = { left: 20, center: 207, right: 395 };
export const FONT_SIZE = 18;
const FILLED_OPACITY = { solid: 1.0, "see-through": 0.6 };

export function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

export function round1(v) {
  return Math.round(v * 10) / 10;
}

export function round2(v) {
  return Math.round(v * 100) / 100;
}

/** Resolve the "apply to pages" control into the API's page target. */
export function pagesValue(select, custom) {
  if (select === "custom") {
    const text = (custom || "").trim();
    return text || "all";
  }
  return select;
}

/** A fresh, untouched palang spec (absolute positioning mode, used by the canvas). */
export function defaultSpec() {
  return {
    mode: "band",
    pages: "all",
    pagesCustom: "",
    text: "UNTUK KEGUNAAN BANK SAHAJA", // visible immediately: users see where the marking sits
    second: "",
    ref: "",
    color: "#000000",
    style: "lines", // lines | solid | see-through
    topPt: null, // null = centred vertically
    leftPt: null, // null = centred horizontally (region)
    heightPt: 48,
    widthPt: 180,
    fontSize: 18,
    rotationDeg: 0,
    armed: true, // the marking shows on the page as soon as a document loads
  };
}

/**
 * Build the API palang spec JSON from the editor state.
 * anchored=true: position via anchors (templates); false: absolute points (canvas).
 */
export function buildPalangSpec(spec, anchored = false) {
  const style = spec.style || (spec.opacity || "lines");
  const region = spec.mode === "region";
  const opacity = region
    ? FILLED_OPACITY[style] ?? 1.0
    : style === "lines"
      ? 1.0
      : FILLED_OPACITY[style] ?? 1.0;
  // Lines style is monochrome: text shares the bar colour (white would vanish
  // on a transparent background). Filled bars keep white text.
  const labelColor = !region && style === "lines" ? spec.color : "#FFFFFF";
  const label = { text: (spec.text || "").trim(), color: labelColor, font_size: spec.fontSize || FONT_SIZE };
  const second = (spec.second || "").trim();
  const ref = (spec.ref || "").trim();
  if (second) label.second_line = second;
  if (ref) label.template_data = { ref: ref };

  const pages = pagesValue(spec.pages, spec.pagesCustom);

  let position;
  if (anchored) {
    position = { anchor: spec.anchor || "center" };
    if (region && spec.horiz) position.left_pt = REGION_LEFT_PT[spec.horiz];
  } else {
    position = {};
    if (spec.topPt != null) position.top_pt = round1(spec.topPt);
    const usesX = (region || style === "lines") && spec.leftPt != null;
    if (usesX) position.left_pt = round1(spec.leftPt);
  }

  if (!region) {
    const out = {
      mode: "band",
      band_style: style === "lines" ? "lines" : "filled",
      pages,
      position,
      height_pt: round1(spec.heightPt ?? BAND_THICKNESS.normal),
      color: spec.color,
      opacity,
      label,
    };
    if (spec.rotationDeg) out.rotation_deg = round1(spec.rotationDeg);
    return out;
  }
  return {
    mode: "region",
    pages,
    position,
    height_pt: round1(spec.heightPt ?? REGION_THICKNESS.normal),
    width_pt: round1(spec.widthPt ?? REGION_WIDTH.normal),
    color: spec.color,
    opacity,
    label: label.text ? label : null,
  };
}

/** Per-image settings for the API, aligned with upload order. */
export function imageSettings(images) {
  return images.map((im) => ({ enhance: im.enhance, crop: im.crop }));
}

