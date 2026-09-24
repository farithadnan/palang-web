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
 *  Pillow enhance is not available offline). Returns new image bytes. */
async function processImage(bytes, mime, setting) {
  if (!setting || (!setting.crop && !setting.enhance)) return bytes;
  const img = await decodeImage(bytes);
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
 *  (same text rendering, same rotation). Returns { bytes, w, h } in pt. */
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
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(wPt * size));
  canvas.height = Math.max(1, Math.round(hPt * size));
  const ctx = canvas.getContext("2d");
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-canvas.width / 2, -canvas.height / 2);
  ctx.lineWidth = Math.max(1, 1.2 * size);
  ctx.strokeStyle = color;
  const lineY1 = Math.round(4 * size);
  const lineY2 = Math.round((hPt - 4) * size);
  ctx.beginPath();
  ctx.moveTo(0, lineY1);
  ctx.lineTo(canvas.width, lineY1);
  ctx.moveTo(0, lineY2);
  ctx.lineTo(canvas.width, lineY2);
  ctx.stroke();
  ctx.fillStyle = color;
  const fontName = `bold ${Math.round(fontPt * size)}px Inter, system-ui, sans-serif`;
  ctx.font = fontName;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  return {
    bytes: new Uint8Array(await outToBytes(canvas, "image/png")),
    w: wPt,
    h: hPt,
    scale: size,
  };
}

function textWidthApprox(text, fontPt) {
  if (!text) return fontPt * 2;
  return text.length * fontPt * 0.84;
}

/** The full offline pipeline: images (+optional pdfs) → one PDF with the
 *  palang marking stamped, exactly like /api/process with merge=true. */
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
    const w = palang.w;
    const h = palang.h;
    const leftPt = spec.leftPt ?? (page.w - w) / 2;
    const topPt = spec.topPt ?? (page.h - h) / 2;
    for (const p of doc.getPages()) {
      p.drawImage(png, { x: leftPt, y: page.h - topPt - h, width: w, height: h });
    }
  }

  return doc.save();
}
