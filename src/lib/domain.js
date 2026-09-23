/* Pure palang domain helpers: constants and spec builders. No DOM, no fetch. */

export const PAGE_SIZES = [
  { v: "A4", l: "A4 (most common)" },
  { v: "A5", l: "A5" },
  { v: "Letter", l: "Letter" },
  { v: "fit", l: "Fit the image" },
];

export const BAND_THICKNESS = { thin: 32, normal: 48, thick: 72 };
export const REGION_THICKNESS = { thin: 16, normal: 28, thick: 44 };
export const REGION_WIDTH = { narrow: 120, normal: 180, wide: 260 };
export const REGION_LEFT_PT = { left: 20, center: 207, right: 395 };
export const FONT_SIZE = 18;

/** Band rendering styles: lines = transparent, text with a line above+below;
 *  solid / see-through = the classic filled bar at full / partial opacity. */
export const BAND_STYLE_OPTIONS = [
  { v: "lines", l: "Lines only (transparent, follows the text)" },
  { v: "solid", l: "Filled bar, solid" },
  { v: "see-through", l: "Filled bar, see-through" },
];
const FILLED_OPACITY = { solid: 1.0, "see-through": 0.6 };

export function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

export function clamp01(v) {
  return clamp(v, 0, 1);
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

/** Nearest friendly value by point size (used when loading a template into the form). */
export function nearest(values, target) {
  let best = values[0];
  for (const v of values) {
    if (Math.abs(v - target) < Math.abs(best - target)) best = v;
  }
  return best;
}

export function keyOf(values, target) {
  const value = nearest(Object.values(values), target);
  for (const key of Object.keys(values)) {
    if (values[key] === value) return key;
  }
  return "normal";
}

/** A fresh, untouched palang spec (absolute positioning mode, used by the canvas). */
export function defaultSpec() {
  return {
    mode: "band",
    pages: "all",
    pagesCustom: "",
    text: "",
    second: "",
    ref: "",
    color: "#000000",
    style: "lines", // lines | solid | see-through
    topPt: null, // null = centred vertically
    leftPt: null, // null = centred horizontally (region)
    heightPt: 48,
    widthPt: 180,
    armed: false,
  };
}

/** A fresh template-editor spec (anchor positioning mode, used by Templates). */
export function presetDefaultSpec() {
  return {
    mode: "band",
    anchor: "center",
    horiz: "center",
    thickness: "normal",
    width: "normal",
    text: "",
    second: "",
    ref: "",
    color: "#000000",
    style: "lines",
    pages: "all",
    pagesCustom: "",
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
    return {
      mode: "band",
      band_style: style === "lines" ? "lines" : "filled",
      pages,
      position,
      height_pt: round1(spec.heightPt ?? BAND_THICKNESS.normal),
      color: spec.color,
      opacity,
      label,
    };
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

/** Map a preset document's first marking back into the template editor state. */
export function presetSpecFromDoc(doc) {
  if (!doc.palang || !doc.palang.length) return presetDefaultSpec();
  const s = doc.palang[0];
  const spec = presetDefaultSpec();
  spec.mode = s.mode === "region" ? "region" : "band";
  spec.anchor = s.position?.anchor || "center";
  if (s.position?.left_pt != null) spec.horiz = keyOf(REGION_LEFT_PT, s.position.left_pt);
  if (spec.mode === "region") {
    spec.thickness = keyOf(REGION_THICKNESS, s.height_pt);
    spec.width = keyOf(REGION_WIDTH, s.width_pt);
  } else {
    spec.thickness = keyOf(BAND_THICKNESS, s.height_pt);
  }
  spec.text = s.label?.text || "";
  spec.second = s.label?.second_line || "";
  spec.ref = s.label?.template_data?.ref || "";
  if (s.pages === "odd" || s.pages === "even" || s.pages === "all") {
    spec.pages = s.pages;
  } else {
    spec.pages = "custom";
    spec.pagesCustom = Array.isArray(s.pages) ? s.pages.join(", ") : String(s.pages);
  }
  spec.color = s.color || "#000000";
  const isFilled = s.mode !== "region" && s.band_style === "filled";
  if (isFilled) {
    spec.style = (s.opacity ?? 1) >= 0.9 ? "solid" : "see-through";
  } else if (s.mode === "region") {
    spec.style = (s.opacity ?? 1) >= 0.9 ? "solid" : "see-through";
  } else {
    spec.style = "lines";
  }
  return spec;
}
