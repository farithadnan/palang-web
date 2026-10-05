/**
 * Offline document engine — everything runs in the browser, nothing leaves
 * the device; no server is involved. Mirrors the server API contract
 * (/api/process) so the store can switch between local and remote without
 * changing shape.
 *
 * Geometry parity: images are fitted into the chosen page (margin 0,
 * centred) using the SAME formula as the server, via fittedPageSize.
 */
import { PDFDocument, degrees } from "pdf-lib";
import { palangLabel, fittedPageSize, pageDims } from "../domain/domain.js";

/** Decode bytes into an ImageBitmap/HTMLImageElement for canvas work. */
async function decodeImage(bytes, opts) {
  const blob = new Blob([bytes]);
  if (typeof createImageBitmap === "function") return createImageBitmap(blob, opts);
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url); // the decoded bitmap stays valid after release
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

/** JPEG dimensions from the SOF markers (no full decode) — lets the
 *  compiled bake cap its size at DECODE time instead of rasterising a
 *  huge photo first. Returns { w, h } or null for non-JPEG/corrupt. */
function jpegDims(bytes) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < bytes.length) {
    if (bytes[i] !== 0xff) return null;
    const marker = bytes[i + 1];
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      i += 2;
      continue;
    }
    const segLen = (bytes[i + 2] << 8) | bytes[i + 3];
    if (segLen < 2) return null;
    if (marker >= 0xc0 && marker <= 0xc3) {
      return { w: (bytes[i + 7] << 8) | bytes[i + 8], h: (bytes[i + 5] << 8) | bytes[i + 6] };
    }
    i += 2 + segLen;
  }
  return null;
}

/** Normalise a decoded image to an upright canvas: EXIF orientation is applied
 *  by the browser's decode, then the user's 90° steps are baked in. Crop
 *  fractions are expressed against THIS canvas, so rotation always precedes
 *  crop — in the preview and in the output. */
function uprightCanvas(img, deg) {
  const rot = (((deg ?? 0) % 360) + 360) % 360;
  const swap = rot === 90 || rot === 270;
  const w = swap ? img.height : img.width;
  const h = swap ? img.width : img.height;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, w);
  canvas.height = Math.max(1, h);
  const ctx = canvas.getContext("2d");
  if (rot === 0) {
    ctx.drawImage(img, 0, 0);
  } else {
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
  }
  return canvas;
}

/** Rotate + crop + basic enhance via canvas (browser-native; the old
 *  server-side Pillow enhance is not available offline). Returns new bytes.
 *
 *  JPEGs are ALWAYS normalised through a decode→canvas→re-encode: browsers
 *  apply EXIF orientation when decoding (so the preview shows the photo
 *  rotated), but pdf-lib embeds raw JPEG bytes with the UNrotated dimensions —
 *  a phone photo would get a different fit and letterbox in the output than in
 *  the preview. Re-encoding bakes orientation + rotation into the pixels, so
 *  the embedded dims always match the preview's. */
async function processImage(bytes, mime, setting) {
  const rotation = setting?.rotation ?? 0;
  const needsWork = setting && (setting.crop || setting.enhance || rotation);
  if (!needsWork && mime !== "image/jpeg") return bytes;
  const img = await decodeImage(bytes);
  const base = uprightCanvas(img, rotation);
  if (!needsWork) {
    // plain JPEG: orientation-baked copy, no crop/enhance/rotation
    return base.toBlob ? new Uint8Array(await outToBytes(base, "image/jpeg")) : bytes;
  }
  const cw = Math.max(1, Math.round(base.width * ((setting.crop?.r ?? 1) - (setting.crop?.l ?? 0))));
  const ch = Math.max(1, Math.round(base.height * ((setting.crop?.b ?? 1) - (setting.crop?.t ?? 0))));
  const out = document.createElement("canvas");
  out.width = cw;
  out.height = ch;
  const ctx = out.getContext("2d");
  ctx.drawImage(
    base,
    Math.round(base.width * (setting.crop?.l ?? 0)),
    Math.round(base.height * (setting.crop?.t ?? 0)),
    Math.max(1, Math.round(base.width * ((setting.crop?.r ?? 1) - (setting.crop?.l ?? 0)))),
    Math.max(1, Math.round(base.height * ((setting.crop?.b ?? 1) - (setting.crop?.t ?? 0)))),
    0,
    0,
    cw,
    ch
  );
  if (setting.enhance) {
    ctx.filter = "contrast(1.12) saturate(1.08) brightness(1.02)";
    ctx.drawImage(out, 0, 0);
    ctx.filter = "none";
  }
  const type = mime === "image/jpeg" ? "image/jpeg" : "image/png";
  return out.toBlob ? new Uint8Array(await outToBytes(out, type)) : bytes;
}

function outToBytes(canvas, type) {
  return new Promise((resolve) => canvas.toBlob(async (b) => resolve(await b.arrayBuffer()), type));
}

/** Render the lines marking (text + top/bottom lines, rotated) to a
 *  transparent PNG, so the PDF output matches the canvas preview exactly
 *  (same text rendering, same rotation). The canvas is sized to the ROTATED
 *  bounding box so a tilted band never clips at the edges — the preview
 *  never clips, so the output must not either. Returns { bytes, w, h, rw, rh }
 *  in pt — w/h is the unrotated frame (the editor's coordinate space),
 *  rw/rh the rotated bounding box the PDF must draw. */
async function renderPalang(spec) {
  const { text, color, fontPt } = palangLabel(spec);
  const rotation = ((spec.rotationDeg ?? 0) % 360 + 360) % 360;
  const pad = 7; // pt padding around the text, mirrors the lines band
  const size = 4; // canvas oversample for crisp text
  // Measure + draw with the EXACT same font the preview label uses
  // (.overlay-label: font-weight 400, and the app's "Inter Variable" stack).
  // Any mismatch — weight or family — changes glyph widths, so a
  // centre-anchored marking drifts by half the gap and the stamped text
  // looks bolder/thinner than what the user placed.
  const fontStack = `400 ${Math.round(fontPt * size)}px "Inter Variable", system-ui, -apple-system, "Segoe UI", sans-serif`;
  const probe = document.createElement("canvas").getContext("2d");
  probe.font = fontStack;
  const measured = text ? probe.measureText(text).width : 0;
  const textW = (measured > 0 ? measured : textWidthApprox(text, fontPt)) / size;
  const wPt = textW + pad * 2;
  const hPt = 10 + fontPt * 1.75;
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const rwPt = wPt * cos + hPt * sin; // rotated box (pt) — no clipping
  const rhPt = wPt * sin + hPt * cos;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(rwPt * size));
  canvas.height = Math.max(1, Math.round(rhPt * size));
  const ctx = canvas.getContext("2d");
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  const ox = -(wPt * size) / 2; // unrotated band frame, centred in the canvas
  const oy = -(hPt * size) / 2;
  ctx.lineWidth = Math.max(1, 1.2 * size);
  ctx.strokeStyle = color;
  const lineY1 = Math.round(4 * size);
  const lineY2 = Math.round((hPt - 4) * size);
  ctx.beginPath();
  ctx.moveTo(ox, oy + lineY1);
  ctx.lineTo(ox + wPt * size, oy + lineY1);
  ctx.moveTo(ox, oy + lineY2);
  ctx.lineTo(ox + wPt * size, oy + lineY2);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = fontStack;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(text, ox + (wPt * size) / 2, oy + (hPt * size) / 2);
  return {
    bytes: new Uint8Array(await outToBytes(canvas, "image/png")),
    w: wPt, // unrotated frame (the editor's coordinate space)
    h: hPt,
    rw: rwPt, // rotated bounding box — what the PDF must draw
    rh: rhPt,
  };
}

/** The rotated bounding box of a w×h band at `rotation` degrees (pt) —
 *  exported for tests: the PDF stamp rect must match the preview silhouette. */
export function rotatedPalangBox(w, h, rotation) {
  const deg = ((rotation % 360) + 360) % 360;
  const rad = (deg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  return { w: w * cos + h * sin, h: w * sin + h * cos };
}

/** Where a stamp drawn at visual offsets (leftPt, topPt, visual box w×h)
 *  lands in a page's USER space. The preview works in visual space (pdf.js
 *  applies the page's /Rotate); pdf-lib draws in unrotated user space, so a
 *  page rotated 90/180/270 swaps/mirrors the rect. Pure + exported for tests. */
export function palangDrawRect(pageW, pageH, pageRot, leftPt, topPt, w, h) {
  const rot = ((pageRot % 360) + 360) % 360;
  // Derived from pdf.js's viewport transforms (user→visual, y-down):
  //   rot 0:  vx=ux,      vy=H-uy
  //   rot 90: vx=uy,      vy=ux
  //   rot180: vx=W-ux,    vy=uy
  //   rot270: vx=H-uy,    vy=W-ux
  if (rot === 0) return { x: leftPt, y: pageH - topPt - h, width: w, height: h };
  if (rot === 90) return { x: topPt, y: leftPt, width: h, height: w };
  if (rot === 180) return { x: pageW - leftPt - w, y: topPt, width: w, height: h };
  return { x: pageW - topPt - h, y: pageH - leftPt - w, width: h, height: w }; // 270
}

/** Where the band (rotated box w×h, centred at page-space point cx,cy)
 *  lands on the IMAGE bitmap, in image pixels. The user's two-temp flow:
 *  Apply & save COMPILES the photo with the palang baked on (see
 *  compileStampedImage); Stamp then uses that compiled image, so the fit to
 *  A4 can never shift the marking relative to the photo. Pure + exported
 *  for tests. */
export function imageStampRect(imageW, imageH, pageW, pageH, w, h, cx, cy) {
  const fitted = fittedPageSize(imageW, imageH, pageW, pageH);
  const s = imageW / fitted.w; // uniform image-space scale, pt → px
  const offX = (pageW - fitted.w) / 2;
  const offY = (pageH - fitted.h) / 2;
  return {
    x: (cx - offX) * s - (w * s) / 2,
    y: (cy - offY) * s - (h * s) / 2,
    w: w * s,
    h: h * s,
  };
}

/** Draw the palang marking on an existing canvas (used by the compile path).
 *  One call per stamp — multi-palang is just this per-spec routine in a loop,
 *  so preview↔output parity holds per stamp exactly as with a single band.
 *  The base photo is drawn ONCE by the caller, never here, or each stamp
 *  would erase the previous one. */
async function drawStamped(c, page, spec) {
  const ctx = c.getContext("2d");
  const palang = await renderPalang(spec);
  const palangImg = await decodeImage(palang.bytes);
  const cx = (spec.leftPt ?? (page.w - palang.w) / 2) + palang.w / 2;
  const cy = (spec.topPt ?? (page.h - palang.h) / 2) + palang.h / 2;
  const r = imageStampRect(c.width, c.height, page.w, page.h, palang.rw, palang.rh, cx, cy);
  ctx.drawImage(palangImg, r.x, r.y, r.w, r.h);
}

/** Compile ONE photo into its stamped form (the "second temp": the armed
 *  palang is baked in and can no longer move). The editor keeps showing the
 *  original photo for re-editing. The compiled image is capped at
 *  MAX_COMPILE_PX on its longest side — it is only ever embedded on an A4
 *  page (~340 dpi at 2400 px); a 24 MP bake would be memory-heavy and bloat
 *  the PDF for zero visible gain. The cap is applied AT DECODE via
 *  createImageBitmap's native resize (no full-resolution rasterisation). */
export const MAX_COMPILE_PX = 2400;

export async function compileStampedImage(input, pageSize, spec) {
  const bytes = new Uint8Array(await input.bytes());
  const c = document.createElement("canvas");
  let img;
  const dims = jpegDims(bytes);
  if (dims && dims.w > MAX_COMPILE_PX) {
    img = await decodeImage(bytes, {
      resizeWidth: MAX_COMPILE_PX,
      resizeHeight: Math.max(1, Math.round((dims.h * MAX_COMPILE_PX) / dims.w)),
    });
  } else if (dims && dims.h > MAX_COMPILE_PX) {
    img = await decodeImage(bytes, {
      resizeHeight: MAX_COMPILE_PX,
      resizeWidth: Math.max(1, Math.round((dims.w * MAX_COMPILE_PX) / dims.h)),
    });
  } else {
    img = await decodeImage(bytes);
  }
  c.width = img.width;
  c.height = img.height;
  c.getContext("2d").drawImage(img, 0, 0); // base photo once — stamps layer on top
  // The page box follows the image (fit) or the chosen paper size, so the
  // stamp lands at the same point the preview placed it.
  const page = pageDims(pageSize, img.width, img.height);
  if (spec?.armed) await drawStamped(c, page, spec);
  return { bytes: new Uint8Array(await outToBytes(c, "image/png")), mime: "image/png" };
}

function textWidthApprox(text, fontPt) {
  if (!text) return fontPt * 2;
  return text.length * fontPt * 0.84;
}

/** A PDF that could not be loaded, tagged so the UI can explain WHY (and for
 *  which file). The store maps `code` to a localised toast. */
export class PdfLoadError extends Error {
  constructor(code, fileName) {
    super(code);
    this.name = "PdfLoadError";
    this.code = code; // "pdf-locked" | "pdf-unreadable"
    this.fileName = fileName || "PDF";
  }
}

/** Map a pdf-lib load failure to a stable code the UI can explain. Pure +
 *  exported for tests. */
export function pdfLoadErrorCode(err) {
  const msg = String(err?.message || "");
  return err?.name === "EncryptedPDFError" || /encrypt|password/i.test(msg)
    ? "pdf-locked"
    : "pdf-unreadable";
}

function loadPdf(bytes, fileName) {
  return PDFDocument.load(bytes).catch((err) => {
    throw new PdfLoadError(pdfLoadErrorCode(err), fileName);
  });
}

/** The armed palang that applies to ONE source file: the file's own `spec`,
 *  or the shared fallback when it carries none — never another file's spec.
 *  Returns null when the file has no armed palang. Pure + exported so the
 *  "one file's band stays on its own pages" contract is pinned by a test. */
export function palangSpecFor(file, fallback = null) {
  const own = file ? file.spec : undefined;
  const s = own !== undefined ? own : fallback;
  return s && s.armed ? s : null;
}

/** The full offline pipeline: images (+optional pdfs) → one PDF with the
 *  palang stamped. Each file carries its OWN single spec (`f.spec`) — one
 *  palang per file, never several — so a file's band lands only on that file's
 *  pages; a fallback `spec` is honoured for files that do not carry their own.
 *  Images are normally already compiled ("second temp", `f.stamped`), so they
 *  are not stamped twice; an uncompiled image falls back to page-space
 *  stamping with its own spec. */
export async function processOffline({ images, pdfs, pageSize = "A4", spec = null }) {
  const doc = await PDFDocument.create();
  const imagePages = new Set(); // pre-stamped (compiled) pages skip the stamp loop
  const pageSpec = new Map(); // pdf-lib page -> its single armed palang spec

  for (const f of images) {
    const bytes = new Uint8Array(await f.bytes());
    const processed = await processImage(bytes, f.mime, f.setting);
    const image =
      f.mime === "image/jpeg" ? await doc.embedJpg(processed) : await doc.embedPng(processed);
    // "fit" gives each photo a page shaped like itself (no border); a paper
    // size gives every photo the same page.
    const page = pageDims(pageSize, image.width, image.height);
    const p = doc.addPage([page.w, page.h]);
    const { w, h } = fittedPageSize(image.width, image.height, page.w, page.h);
    p.drawImage(image, { x: (page.w - w) / 2, y: (page.h - h) / 2, width: w, height: h });
    if (f.stamped) {
      imagePages.add(p); // the palang is already baked in
    } else {
      const s = palangSpecFor(f, spec);
      if (s) pageSpec.set(p, s);
    }
  }

  for (const f of pdfs) {
    const src = await loadPdf(await f.bytes(), f.name);
    const pages = await doc.copyPages(src, src.getPageIndices());
    const s = palangSpecFor(f, spec);
    for (const pg of pages) {
      const p = doc.addPage(pg);
      if (s) pageSpec.set(p, s);
    }
  }

  for (const [p, s] of pageSpec) {
    if (imagePages.has(p)) continue; // compiled image: palang already baked in
    // Each page has its OWN size: image pages are the chosen page size, but
    // pages copied from a source PDF keep their native geometry (Letter,
    // landscape, photo-size…).
    const { width: pw, height: ph } = p.getSize();
    const palang = await renderPalang(s);
    const png = await doc.embedPng(palang.bytes);
    const w = palang.rw;
    const h = palang.rh;
    const cx = (s.leftPt ?? (pw - palang.w) / 2) + palang.w / 2;
    const cy = (s.topPt ?? (ph - palang.h) / 2) + palang.h / 2;
    // Visual space (what the preview shows, pdf.js applies /Rotate) →
    // user space (pdf-lib draws unrotated): rotation-aware mapping.
    const rect = palangDrawRect(pw, ph, p.getRotation().angle, cx - w / 2, cy - h / 2, w, h);
    p.drawImage(png, rect);
  }

  return doc.save();
}

/** Build ONE PDF from an explicit page plan, in order. Each entry names a
 *  source (grouped by `key`, so a file is parsed once), a 1-based `page`, and
 *  an optional extra `rotate` in degrees. Shared by Merge (page-level edits —
 *  removal is applied by the caller filtering the plan) and Split/Extract. */
export async function buildPdf(plan) {
  const doc = await PDFDocument.create();
  const cache = new Map(); // key -> parsed source PDFDocument
  for (const p of plan) {
    let src = cache.get(p.key);
    if (!src) {
      src = await loadPdf(await p.bytes(), p.name);
      cache.set(p.key, src);
    }
    const [copied] = await doc.copyPages(src, [p.page - 1]);
    if (p.rotate) {
      const base = copied.getRotation().angle;
      copied.setRotation(degrees((((base + p.rotate) % 360) + 360) % 360));
    }
    doc.addPage(copied);
  }
  return doc.save();
}
