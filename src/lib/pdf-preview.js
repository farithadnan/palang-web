/**
 * PDF page previews, rendered ON the device with pdf.js — the last piece
 * that still touched the server. Pages match the old /api/preview shape
 * ({page, width_pt, height_pt, url, mime}) so the canvas preview is
 * untouched.
 */
import * as PDFJS from "pdfjs-dist/legacy/build/pdf.mjs";
import workerUrl from "pdfjs-dist/legacy/build/pdf.worker.mjs?url";

PDFJS.GlobalWorkerOptions.workerSrc = workerUrl;

const MAX_PAGES = 20;
const RENDER_TIMEOUT_MS = 15000;

function withTimeout(promise, label) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`PDF render timed out: ${label}`)), RENDER_TIMEOUT_MS);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

function blankPageJpeg(wPt, hPt) {
  // A neutral page with the real PDF dimensions: the editor only needs the
  // geometry to place the marking, so a document whose page can't rasterize
  // (offline renderer limits, odd encodings) stays fully usable.
  const s = 0.5;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(wPt * s));
  canvas.height = Math.max(1, Math.round(hPt * s));
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f2f0ec";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

/** Render up to `maxPages` pages of a PDF file to JPEG data URLs. */
export async function renderPdfPreviews(file, maxPages = MAX_PAGES) {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await withTimeout(
    // Standard font data is served from THIS app (dist/standard_fonts), not
    // a CDN, so rendering works fully offline — the CDN default stalls.
    PDFJS.getDocument({
      data,
      standardFontDataUrl: "standard_fonts/",
      isEvalSupported: false,
      disableFontFace: true,
    }).promise,
    "load"
  );
  const pages = [];
  const renderScale = 1.5; // crisp previews without the old server round trip
  for (let i = 1; i <= Math.min(pdf.numPages, maxPages); i++) {
    const page = await withTimeout(pdf.getPage(i), `page ${i}`);
    const pt = page.getViewport({ scale: 1 }); // page geometry in points
    let url = null;
    let placeholder = false;
    try {
      const vp = page.getViewport({ scale: renderScale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(vp.width);
      canvas.height = Math.ceil(vp.height);
      await withTimeout(
        page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise,
        `render ${i}`
      );
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
      url = URL.createObjectURL(blob);
    } catch (err) {
      // Rendering this page failed (timeout or unsupported content): keep
      // the document usable with a blank page of the same size.
      console.warn("pdf page preview fallback:", err);
      url = blankPageJpeg(pt.width, pt.height);
      placeholder = true;
    }
    pages.push({
      page: pages.length + 1,
      width_pt: Math.round(pt.width),
      height_pt: Math.round(pt.height),
      url,
      mime: "image/jpeg",
      placeholder,
    });
  }
  return { count: pdf.numPages, truncated: pdf.numPages > MAX_PAGES, client: true, pages };
}
