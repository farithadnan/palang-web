/**
 * Offline document engine — everything runs in the browser, nothing leaves
 * the device; no server is involved. Mirrors the server API contract
 * (/api/process) so the store can switch between local and remote without
 * changing shape.
 *
 * Geometry parity: images are fitted into the chosen page (margin 0,
 * centred) using the SAME formula as the server, via fittedPageSize.
 */
import { PDFDocument } from "pdf-lib";
import { PAGE_DIMS, buildPalangSpec, fittedPageSize } from "./domain.js";

/** Decode bytes into an ImageBitmap/HTMLImageElement for canvas work. */
async function decodeImage(bytes) {
  const blob = new Blob([bytes]);
  if (typeof createImageBitmap === "function") return createImageBitmap(blob);
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Crop + basic enhance via canvas (browser-native; the old server-side
 *  Pillow enhance is not available offline). Returns new image bytes.
 *
 *  JPEGs are ALWAYS normalised through a decode→canvas→re-encode: browsers
 *  apply EXIF orientation when decoding (so the preview shows the photo
 *  rotated), but pdf-lib embeds raw JPEG bytes with the UNrotated
 *  dimensions — a phone photo would get a different fit and letterbox in
 *  the output than in the preview, and the palang would land off relative
 *  to the photo. Re-encoding bakes the orientation into the pixels, so the
 *  embedded dims always match the preview's. */
async function processImage(bytes, mime, setting) {
  const needsWork = setting && (setting.crop || setting.enhance);
  if (!needsWork && mime !== "image/jpeg") return bytes;
  const img = await decodeImage(bytes);
  if (!needsWork) {
    // plain JPEG: orientation-baked copy, no crop/enhance
    const out = document.createElement("canvas");
    out.width = img.width; // oriented dims — what the preview shows
    out.height = img.height;
    out.getContext("2d").drawImage(img, 0, 0);
    return out.toBlob ? new Uint8Array(await outToBytes(out, "image/jpeg")) : bytes;
  }
  const cw = Math.round(img.width * ((setting.crop?.r ?? 1) - (setting.crop?.l ?? 0)));
  const ch = Math.round(img.height * ((setting.crop?.b ?? 1) - (setting.crop?.t ?? 0)));
  const out = document.createElement("canvas");
  out.width = Math.max(1, cw);
  out.height = Math.max(1, ch);
  const ctx = out.getContext("2d");
  ctx.drawImage(
    img,
    Math.round(img.width * (setting.crop?.l ?? 0)),
    Math.round(img.height * (setting.crop?.t ?? 0)),
    Math.round(img.width * ((setting.crop?.r ?? 1) - (setting.crop?.l ?? 0))) || img.width,
    Math.round(img.height * ((setting.crop?.b ?? 1) - (setting.crop?.t ?? 0))) || img.height,
    0,
    0,
    out.width,
    out.height
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
async function renderPalang(spec, pageSize) {
  const api = buildPalangSpec(spec);
  const text = api.label?.text || "";
  const fontPt = api.label?.font_size ?? 18;
  const color = api.label?.color ?? spec.color;
  const rotation = ((spec.rotationDeg ?? 0) % 360 + 360) % 360;
  const pad = 7; // pt padding around the text, mirrors the lines band
  const textW = textWidthApprox(text, fontPt);
  const wPt = textW + pad * 2;
  const hPt = 10 + fontPt * 1.75;
  const size = 4; // canvas oversample for crisp text
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
  ctx.font = `bold ${Math.round(fontPt * size)}px Inter, system-ui, sans-serif`;
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

function textWidthApprox(text, fontPt) {
  if (!text) return fontPt * 2;
  return text.length * fontPt * 0.84;
}

/** The full offline pipeline: images (+optional pdfs) → one PDF with the
 *  palang marking stamped, exactly like /api/process with merge=true.
 *  All pages are stamped in page space with per-native-size + /Rotate-aware
 *  placement (see palangDrawRect). */
export async function processOffline({ images, pdfs, pageSize = "A4", spec }) {
  const page = PAGE_DIMS[pageSize] ?? PAGE_DIMS.A4;
  const doc = await PDFDocument.create();

  for (const f of images) {
    const bytes = new Uint8Array(await f.bytes());
    const processed = await processImage(bytes, f.mime, f.setting);
    const p = doc.addPage([page.w, page.h]);
    const image =
      f.mime === "image/jpeg" ? await doc.embedJpg(processed) : await doc.embedPng(processed);
    const { w, h } = fittedPageSize(image.width, image.height, page.w, page.h);
    p.drawImage(image, { x: (page.w - w) / 2, y: (page.h - h) / 2, width: w, height: h });
  }

  for (const f of pdfs) {
    const src = await PDFDocument.load(await f.bytes());
    const pages = await doc.copyPages(src, src.getPageIndices());
    for (const pg of pages) doc.addPage(pg);
  }

  if (spec?.armed && images.length + pdfs.length > 0) {
    const palang = await renderPalang(spec, page);
    const png = await doc.embedPng(palang.bytes);
    const w = palang.rw;
    const h = palang.rh;
    for (const p of doc.getPages()) {
      // Each page has its OWN size: image pages are the chosen page size,
      // but pages copied from a source PDF keep their native geometry
      // (Letter, landscape, photo-size…).
      const { width: pw, height: ph } = p.getSize();
      const cx = (spec.leftPt ?? (pw - palang.w) / 2) + palang.w / 2;
      const cy = (spec.topPt ?? (ph - palang.h) / 2) + palang.h / 2;
      // Visual space (what the preview shows, pdf.js applies /Rotate) →
      // user space (pdf-lib draws unrotated): rotation-aware mapping.
      const rect = palangDrawRect(pw, ph, p.getRotation().angle, cx - w / 2, cy - h / 2, w, h);
      p.drawImage(png, rect);
    }
  }

  return doc.save();
}
