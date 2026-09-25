/* Module-mode runes store: the single owner of app state and side effects.
   Views read/write `app.*`; components stay presentational. */

import { processOffline } from "./local-engine.js";
import { renderPdfPreviews } from "./pdf-preview.js";
import { APP_VERSION } from "./version.js";
import { defaultSpec, fittedPageSize, PAGE_DIMS } from "./domain.js";

const CONSENT_KEY = "palang-consent-v1";
const THEME_KEY = "palang-theme";
const LANG_KEY = "palang-lang";

function initialConsent() {
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem(CONSENT_KEY) === "1";
  } catch {
    return false;
  }
}

function initialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    /* fall through to system preference */
  }
  return typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export const app = $state({
  view: "convert",
  pageSize: "A4",
  theme: initialTheme(),
  images: [],
  pdfs: [],
  spec: defaultSpec(),
  preview: null, // { count, truncated, pages: [{page,width_pt,height_pt,png_base64}] }
  previewFiles: [],
  previewLoading: false,
  activePage: 0,
  busy: false,
  message: null, // { kind: "ok" | "error", text }
  update: null, // { version } when a newer version.json is published
  lang: initialLang(), // ui language (en | ms)
  network: [], // requests the app has made this session (privacy proof panel)
  consented: initialConsent(),
});

export function setConsent(agreed) {
  app.consented = agreed;
  try {
    if (agreed) localStorage.setItem(CONSENT_KEY, "1");
    else localStorage.removeItem(CONSENT_KEY);
  } catch {
    /* storage unavailable: consent lasts for this session only */
  }
}

export function setTheme(theme) {
  app.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* theme lasts for this session only */
  }
}

export function setLang(lang) {
  if (lang !== "en" && lang !== "ms") return;
  app.lang = lang;
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* language lasts for this session only */
  }
}

function initialLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "en" || saved === "ms") return saved;
  } catch {
    /* fall through */
  }
  return "ms"; // the product targets Malaysia — Malay-first, EN optional
}

export function setView(view) {
  app.view = view;
}

let messageSeq = 0;
export function flash(kind, text) {
  const seq = ++messageSeq;
  app.message = { kind, text };
  setTimeout(() => {
    if (messageSeq === seq) app.message = null;
  }, 6000);
}

/* ---------- images ---------- */

let imageSeq = 0;

export function addImages(fileList) {
  for (const file of fileList) {
    const url = URL.createObjectURL(file);
    app.images.push({
      id: "img-" + ++imageSeq,
      file,
      url,
      originalUrl: url,
      crop: null,
      enhance: false,
    });
  }
}

export function updateImage(id, patch) {
  const im = app.images.find((i) => i.id === id);
  if (im) Object.assign(im, patch);
}

/**
 * Apply a crop and show the RESULT: the gallery thumbnail is replaced with an
 * actually-cropped version of the photo, so "is it cropped or not" is visible.
 */
export function cropPreview(id, crop) {
  const im = app.images.find((i) => i.id === id);
  if (!im) return;
  const source = im.originalUrl || im.url;
  const img = new Image();
  img.onload = () => {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const l = Math.round(crop.l * w);
    const t = Math.round(crop.t * h);
    const r = Math.round(crop.r * w);
    const b = Math.round(crop.b * h);
    const cw = Math.max(1, r - l);
    const ch = Math.max(1, b - t);
    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    canvas.getContext("2d").drawImage(img, l, t, cw, ch, 0, 0, cw, ch);
    const croppedUrl = canvas.toDataURL("image/png");
    if (im.url !== im.originalUrl) URL.revokeObjectURL(im.url);
    im.url = croppedUrl;
    im.crop = crop;
  };
  img.src = source;
}

export function removeImage(id) {
  const index = app.images.findIndex((i) => i.id === id);
  if (index >= 0) {
    const im = app.images[index];
    if (im.url !== im.originalUrl) URL.revokeObjectURL(im.url);
    URL.revokeObjectURL(im.originalUrl);
    app.images.splice(index, 1);
  }
}

export function removeImages(ids) {
  const doomed = new Set(ids);
  for (const im of app.images) {
    if (doomed.has(im.id)) {
      if (im.url !== im.originalUrl) URL.revokeObjectURL(im.url);
      URL.revokeObjectURL(im.originalUrl);
    }
  }
  app.images = app.images.filter((im) => !doomed.has(im.id));
}

/** Undo: back to the original photo, crop and enhance cleared. */
export function revertImage(id) {
  const im = app.images.find((i) => i.id === id);
  if (!im) return;
  if (im.url !== im.originalUrl) URL.revokeObjectURL(im.url);
  im.url = im.originalUrl;
  im.crop = null;
  im.enhance = false;
}

export function replaceImage(id, file) {
  const im = app.images.find((i) => i.id === id);
  if (!im) return;
  if (im.url !== im.originalUrl) URL.revokeObjectURL(im.url);
  URL.revokeObjectURL(im.originalUrl);
  const url = URL.createObjectURL(file);
  im.file = file;
  im.url = url;
  im.originalUrl = url;
  im.crop = null;
  im.enhance = false;
}

/* ---------- pdfs (merge) ---------- */

let pdfSeq = 0;

export function addPdfs(fileList) {
  for (const file of fileList) {
    app.pdfs.push({ id: "pdf-" + ++pdfSeq, file, thumb: null, thumbErr: false, thumbDone: false });
  }
  void refreshPdfThumbs();
}

/** First-page thumbnails for the merge list, rendered on-device. */
async function refreshPdfThumbs() {
  for (const p of app.pdfs) {
    if (p.thumbDone) continue;
    p.thumbDone = true;
    try {
      const r = await renderPdfPreviews(p.file, 1);
      p.thumb = r.pages[0]?.url ?? null;
    } catch {
      p.thumbErr = true;
    }
  }
}

export function movePdf(id, delta) {
  const index = app.pdfs.findIndex((p) => p.id === id);
  const swap = index + delta;
  if (index < 0 || swap < 0 || swap >= app.pdfs.length) return;
  const tmp = app.pdfs[index];
  app.pdfs[index] = app.pdfs[swap];
  app.pdfs[swap] = tmp;
}

export function removePdf(id) {
  const index = app.pdfs.findIndex((p) => p.id === id);
  if (index >= 0) app.pdfs.splice(index, 1);
}

/* ---------- palang preview + spec ---------- */

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/bmp", "image/tiff", "image/gif"]);

function isImageFile(file) {
  return file.type ? IMAGE_TYPES.has(file.type) : /\.(jpe?g|png|webp|bmp|tiff?|gif)$/i.test(file.name);
}

/**
 * Preview pages for ANY document (images, PDFs, mixed), built in the browser
 * with no server round-trip. Mirrors the server's image->PDF placement
 * exactly: each page is sized to the image fitted within the chosen page
 * size (same formula as PyMuPDF's _page_rect); PDF pages render via pdf.js.
 */
async function buildClientPreview(files) {
  const seq = ++previewSeq;
  const pages = [];
  const size = PAGE_DIMS[app.pageSize] ?? PAGE_DIMS.A4;
  try {
    for (const f of files) {
      if (!isImageFile(f)) {
        const rendered = await renderPdfPreviews(f);
        pages.push(...rendered.pages);
        continue;
      }
      let w = 0;
      let h = 0;
      const url = URL.createObjectURL(f);
      try {
        const img = await new Promise((resolve, reject) => {
          const i = new Image();
          i.onload = () => resolve(i);
          i.onerror = () => reject(new Error("decode"));
          i.src = url;
        });
        w = img.naturalWidth;
        h = img.naturalHeight;
      } catch {
        /* fall back to A4 for undecodable images */
      }
      const rect = w && h ? fittedPageSize(w, h, size.w, size.h) : { w: size.w, h: size.h };
      pages.push({ page: pages.length + 1, width_pt: Math.round(rect.w), height_pt: Math.round(rect.h), url, mime: f.type || "image/jpeg" });
    }
  } catch (err) {
    // Surface failures (unsupported/corrupt files, render timeouts) into the
    // retry card instead of leaving the spinner forever.
    if (seq === previewSeq) {
      app.preview = null;
      app.previewLoading = false;
      console.error("preview failed:", err);
    }
    return;
  }
  if (seq !== previewSeq || !files.every((f, i) => app.previewFiles[i] === f)) return;
  app.preview = { count: pages.length, truncated: files.length > pages.length || pages.length >= 20, client: true, pages };
  app.previewLoading = false;
}

let previewSeq = 0;

export function pickPreviewFiles(fileList) {
  // "Add more" appends to the existing document instead of replacing it.
  const incoming = [...fileList];
  const known = new Set(app.previewFiles.map((f) => f.name));
  const fresh = incoming.filter((f) => !known.has(f.name));
  const files = fresh.length ? [...app.previewFiles, ...fresh] : app.previewFiles;
  app.previewFiles = files;
  app.activePage = 0;
  if (!files.length) {
    app.preview = null;
    return;
  }
  // Everything renders on-device now: images directly from the browser,
  // PDF pages via pdf.js.
  app.preview = null;
  app.previewLoading = true;
  void buildClientPreview(files);
}

export function removePreviewFile(index) {
  if (index < 0 || index >= app.previewFiles.length) return;
  app.previewFiles.splice(index, 1);
  app.activePage = 0;
  if (!app.previewFiles.length) {
    app.preview = null;
    return;
  }
  app.preview = null;
  app.previewLoading = true;
  void buildClientPreview(app.previewFiles);
}

export function setActivePage(index) {
  app.activePage = index;
}

/** Rebuild the on-device preview (the retry path after a failed render). */
export function retryPreview() {
  if (!app.previewFiles.length) return;
  app.preview = null;
  app.previewLoading = true;
  void buildClientPreview(app.previewFiles);
}

export function updateSpec(patch) {
  Object.assign(app.spec, patch);
  // Field edits implicitly arm the marking; an explicit `armed` in the patch
  // (delete, re-add) is honoured as-is.
  if (!Object.prototype.hasOwnProperty.call(patch, "armed")) app.spec.armed = true;
}

export function resetSpec() {
  app.spec = defaultSpec();
}

/* ---------- updates ---------- */

const UPDATE_KEY = "palang-update-dismissed";

export async function checkForUpdate() {
  try {
    const res = await fetch(`version.json?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return;
    const manifest = await res.json();
    const remote = String(manifest.version ?? "");
    const local = APP_VERSION;
    if (!remote || remote === local) {
      app.update = null;
      return;
    }
    let dismissed = {};
    try {
      dismissed = JSON.parse(localStorage.getItem(UPDATE_KEY) || "{}");
    } catch {
      /* storage unavailable */
    }
    app.update = dismissed[remote] ? null : { version: remote };
  } catch {
    /* offline or static host unreachable: updates are best-effort */
  }
}

export function applyUpdate() {
  // Web/PWA: refresh pulls the new static bundle. The native APK/EXE
  // updaters will point at the download page instead.
  location.reload();
}

export function dismissUpdate() {
  if (!app.update) return;
  try {
    const stored = JSON.parse(localStorage.getItem(UPDATE_KEY) || "{}");
    stored[app.update.version] = true;
    localStorage.setItem(UPDATE_KEY, JSON.stringify(stored));
  } catch {
    /* storage unavailable */
  }
  app.update = null;
}

/* ---------- generate ---------- */

export function canGenerate() {
  return app.images.length + app.pdfs.length > 0 && !app.busy;
}

export async function generate(mode = "convert") {
  const files =
    mode === "merge"
      ? app.pdfs.map((p) => p.file)
      : mode === "palang"
        ? app.previewFiles
        : app.images.map((im) => im.file);
  if (!files.length) {
    flash("error", "Add the files you want to process first.");
    return;
  }
  if (!app.consented) {
    flash("error", "Tick the agreement first: your files are processed on this device and never leave it.");
    return;
  }
  if (mode === "palang" && app.spec.armed && app.spec.mode === "band" && !(app.spec.text || "").trim()) {
    flash("error", "Add the purpose text for the bar.");
    return;
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const filename =
    mode === "merge"
      ? `palang-merged-${stamp}.pdf`
      : mode === "palang"
        ? `palang-stamped-${stamp}.pdf`
        : `palang-converted-${stamp}.pdf`;
  app.busy = true;
  try {
    const blob = await offlineBlob(mode, files);
    downloadBlob(blob, filename);
    flash("ok", "Done. Your file is downloading.");
  } catch (err) {
    flash("error", err.message);
  } finally {
    app.busy = false;
  }
}

async function offlineBlob(mode, files) {
  // Everything on-device: images are cropped/enhanced/stamped in the
  // browser; nothing is uploaded anywhere.
  const setup = await Promise.all(
    files.map(async (f) => {
      const bytes = await f.arrayBuffer();
      const mime = f.type || "image/jpeg";
      const im = app.images.find((x) => x.file === f);
      const pdf = app.pdfs.find((x) => x.file === f);
      return {
        bytes: () => Promise.resolve(bytes),
        mime,
        setting: im ? { enhance: im.enhance, crop: im.crop } : null,
        isPdf: !!pdf,
      };
    })
  );
  const out = await processOffline({
    images: setup.filter((s) => !s.isPdf),
    pdfs: setup.filter((s) => s.isPdf),
    pageSize: app.pageSize,
    spec: mode === "palang" ? app.spec : { armed: false },
  });
  return new Blob([out], { type: "application/pdf" });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* Test/verification hook: lets headless checks read and drive the store. */
if (typeof window !== "undefined") {
  window.__palang = {
    app,
    updateImage,
    addImages,
    addPdfs,
    removeImages,
    cropPreview,
    revertImage,
    updateSpec,
    pickPreviewFiles,
    setConsent,
    setTheme,
    setLang,
    generate,
  };
}
