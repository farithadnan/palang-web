/**
 * PDF page previews, rendered ON the device with pdf.js.
 *
 * On-demand by design: for a document with any number of pages, picking it
 * only parses the structure (cheap, even for 1000+ pages). Individual page
 * geometry and images are produced only when a page is actually viewed —
 * the palang editor stepper and the merge preview step through pages one at
 * a time, so a huge PDF never triggers a bulk render.
 *
 * One parsed document is cached at a time; opening a different file closes
 * the previous one. Fonts are served from THIS app (dist/standard_fonts),
 * not a CDN, so previews work fully offline.
 */
import * as PDFJS from "pdfjs-dist/legacy/build/pdf.mjs";
import workerUrl from "pdfjs-dist/legacy/build/pdf.worker.mjs?url";

PDFJS.GlobalWorkerOptions.workerSrc = workerUrl;

const RENDER_TIMEOUT_MS = 15000;
const RENDER_SCALE = 1.5; // crisp previews, still cheap per page

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

let openDoc = null; // single-doc cache: { file, pdf }

/** Parse a PDF file (structure only — no page renders). Caches the last
 *  opened document so paging back and forth is instant; opening another
 *  file releases the previous one. Returns { file, count }. */
export async function openPdf(file) {
  if (openDoc && openDoc.file === file) return openDoc;
  if (openDoc) {
    try {
      openDoc.pdf.destroy();
    } catch {
      /* best effort */
    }
    openDoc = null;
  }
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await withTimeout(
    PDFJS.getDocument({
      data,
      standardFontDataUrl: "standard_fonts/",
      isEvalSupported: false,
      disableFontFace: true,
    }).promise,
    "load"
  );
  openDoc = { file, pdf, count: pdf.numPages };
  return openDoc;
}

function blankPageJpeg(wPt, hPt) {
  // A neutral page with the real PDF dimensions: previews only need the
  // geometry, so a page that can't rasterize (renderer limits, odd
  // encodings) stays fully usable instead of blocking the stepper.
  const s = 0.5;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(wPt * s));
  canvas.height = Math.max(1, Math.round(hPt * s));
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f2f0ec";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

/** Render ONE page of an opened document. Returns
 *  { page, width_pt, height_pt, url, mime, placeholder } — the fallback page
 *  carries the real geometry if rasterization fails. */
export async function renderPdfPage(doc, pageNumber) {
  const page = await withTimeout(doc.pdf.getPage(pageNumber), `page ${pageNumber}`);
  const pt = page.getViewport({ scale: 1 });
  let url = null;
  let placeholder = false;
  try {
    const vp = page.getViewport({ scale: RENDER_SCALE });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(vp.width);
    canvas.height = Math.ceil(vp.height);
    await withTimeout(
      page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise,
      `render ${pageNumber}`
    );
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    url = URL.createObjectURL(blob);
  } catch (err) {
    console.warn("pdf page preview fallback:", err);
    url = blankPageJpeg(pt.width, pt.height);
    placeholder = true;
  }
  return {
    page: pageNumber,
    width_pt: Math.round(pt.width),
    height_pt: Math.round(pt.height),
    url,
    mime: "image/jpeg",
    placeholder,
  };
}
