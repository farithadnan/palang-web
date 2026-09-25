/* Module-mode runes store: the single owner of app state and side effects.
   Views read/write `app.*`; components stay presentational. */

import { t, deployKind } from "./i18n.js"; // lazy use only — i18n imports `app` from here (cycle is safe)
import { processOffline, compileStampedImage } from "./local-engine.js";
import { openPdf, renderPdfPage } from "./pdf-preview.js";
import { LIMITS, loadLimits } from "./config.js";
import { APP_VERSION } from "./version.js";
import { defaultSpec, PAGE_DIMS } from "./domain.js";

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
  preview: null, // { count, pages: [{kind,file,page,url,w,h,loading,err}] }
  previewFiles: [],
  previewLoading: false,
  activePage: 0,
  merge: { pages: [], active: 0 }, // flat ordered page list across all merge PDFs
  busy: false,
  message: null, // { kind: "ok" | "error", text }
  update: null, // { version } when a newer version.json is published
  lang: initialLang(), // ui language (en | ms)
  network: [], // requests the app has made this session (privacy proof panel)
  consented: initialConsent(),
  compiledFiles: new Map(), // file -> Blob with the palang baked in ("second temp")
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
  const room = LIMITS.images - app.images.length;
  if (room <= 0) {
    flash("error", t("msgMaxImages", { n: LIMITS.images }));
    return;
  }
  for (const file of fileList.slice(0, room)) {
    if (file.size > LIMITS.fileMb * 1024 * 1024) {
      flash("error", t("msgOverMb", { name: file.name, n: LIMITS.fileMb }));
      continue;
    }
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

/** Add PDFs to the merge basket. Page images are NOT rendered here: a
 *  document with 1000+ pages must not trigger bulk work — the preview pane
 *  renders one page at a time (see ensureMergePage). */
export function addPdfs(fileList) {
  const room = LIMITS.files - app.pdfs.length;
  if (room <= 0) {
    flash("error", t("msgMaxFiles", { n: LIMITS.files }));
    return;
  }
  for (const file of fileList.slice(0, room)) {
    if (file.size > LIMITS.fileMb * 1024 * 1024) {
      flash("error", t("msgOverMb", { name: file.name, n: LIMITS.fileMb }));
      continue;
    }
    app.pdfs.push({ id: "pdf-" + ++pdfSeq, file });
  }
  void buildMergePreview();
}

/** Flatten every PDF into one ordered page list (metadata only — cheap for
 *  1000+ page files) and render the page being viewed. */
async function buildMergePreview() {
  const seq = ++mergePreviewSeq;
  const pages = [];
  let cum = 0;
  for (const p of app.pdfs) {
    try {
      const doc = await openPdf(p.file);
      if (cum + doc.count > LIMITS.pdfPages) {
        flash("error", t("msgOverflow", { n: LIMITS.pdfPages }));
        break;
      }
      for (let i = 1; i <= doc.count; i++) {
        pages.push({ pdfId: p.id, file: p.file, page: i, url: null, w: null, h: null, loading: false, err: false });
      }
      cum += doc.count;
    } catch {
      console.warn("pdf structure failed:", p.file.name);
      pages.push({ pdfId: p.id, file: p.file, page: 1, url: null, w: null, h: null, loading: false, err: true });
    }
  }
  if (seq !== mergePreviewSeq) return;
  const active = Math.min(app.merge.active, Math.max(0, pages.length - 1));
  app.merge = { pages, active };
  void ensureMergePage(active);
}

let mergePreviewSeq = 0;

export function movePdf(id, delta) {
  const index = app.pdfs.findIndex((p) => p.id === id);
  const swap = index + delta;
  if (index < 0 || swap < 0 || swap >= app.pdfs.length) return;
  const tmp = app.pdfs[index];
  app.pdfs[index] = app.pdfs[swap];
  app.pdfs[swap] = tmp;
  void buildMergePreview();
}

export function removePdf(id) {
  const index = app.pdfs.findIndex((p) => p.id === id);
  if (index >= 0) app.pdfs.splice(index, 1);
  void buildMergePreview();
}

/** Step through the WHOLE merged output — across file boundaries. */
export function stepMerge(delta) {
  const total = app.merge.pages.length;
  const next = Math.min(Math.max(0, app.merge.active + delta), Math.max(0, total - 1));
  if (next === app.merge.active) return;
  app.merge.active = next;
  void ensureMergePage(next);
}

/** Jump the preview to the first page of `id` (list row tap). */
export function selectMergeFile(id) {
  const idx = app.merge.pages.findIndex((pg) => pg.pdfId === id);
  if (idx < 0) return;
  app.merge.active = idx;
  void ensureMergePage(idx);
}

/** Render ONLY the page being viewed (pdf.js, one page at a time). */
async function ensureMergePage(index) {
  const entry = app.merge.pages?.[index];
  if (!entry || entry.err || entry.loading || entry.url) return;
  if (app.merge.active !== index) return; // only the visible page renders
  entry.loading = true;
  try {
    const doc = await openPdf(entry.file);
    const r = await renderPdfPage(doc, entry.page);
    if (app.merge.pages?.[index] === entry && app.merge.active === index) {
      entry.url = r.url;
      entry.w = r.width_pt;
      entry.h = r.height_pt;
      entry.err = r.placeholder;
    }
  } catch {
    if (app.merge.pages?.[index] === entry) entry.err = true;
  } finally {
    if (app.merge.pages?.[index] === entry) entry.loading = false;
  }
}

/* ---------- palang preview + spec ---------- */

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/bmp", "image/tiff", "image/gif"]);

function isImageFile(file) {
  return file.type ? IMAGE_TYPES.has(file.type) : /\.(jpe?g|png|webp|bmp|tiff?|gif)$/i.test(file.name);
}

/**
 /** Build the preview STRUCTURE for any document (images, PDFs, mixed), in
  *  the browser with no server round-trip. Mirrors the server's image->PDF
  *  placement exactly: each image page is sized to the chosen page size
  *  (same formula as PyMuPDF's _page_rect).
  *
  *  On-demand by design: a PDF contributes one metadata entry PER PAGE (cheap
  *  — a 1000-page file just makes 1000 entries) and page images are rendered
  *  lazily in ensurePreviewPage, only for the page actually viewed. */
 async function buildPreviewMeta(files) {
   const seq = ++previewSeq;
   const pages = [];
   const size = PAGE_DIMS[app.pageSize] ?? PAGE_DIMS.A4;
   let cumPdf = 0;
   for (const f of files) {
     if (!isImageFile(f)) {
       try {
         const doc = await openPdf(f);
         if (cumPdf + doc.count > LIMITS.pdfPages) {
           flash("error", t("msgOverflow", { n: LIMITS.pdfPages }));
           cumPdf = LIMITS.pdfPages;
         }
         const until = Math.min(doc.count, LIMITS.pdfPages - cumPdf);
         for (let i = 1; i <= until; i++) {
           pages.push({ kind: "pdf", file: f, page: i, url: null, w: null, h: null, loading: false, err: false });
         }
         cumPdf += until;
       } catch (err) {
         // A document that cannot be parsed keeps everything else usable.
         console.warn("pdf structure failed:", err);
         pages.push({ kind: "err", file: f, page: 1, url: null, w: null, h: null, loading: false, err: true });
       }
       continue;
     }
     const url = URL.createObjectURL(f);
     // The page box is the FULL chosen page (like the output PDF, where the
     // photo is fitted and centred inside it). The canvas computes the
     // letterbox margin itself and shifts the emitted points by it — using
     // the fitted rect instead would drop the margin and the marking would
     // land ~half a letterbox too high in the output (the reported bug).
     pages.push({
       kind: "img",
       file: f,
       page: pages.length + 1,
       url,
       w: Math.round(size.w),
       h: Math.round(size.h),
       loading: false,
       err: false,
     });
   }
   if (seq !== previewSeq || !files.every((f, i) => app.previewFiles[i] === f)) return;
   app.preview = { count: pages.length, client: true, pages };
   app.previewLoading = false;
   void ensurePreviewPage(0); // open on the first page
 }

 /** Render ONLY the page being viewed (pdf.js, one page at a time). Images
  *  already carry their object URL, so this is a no-op for them. */
 async function ensurePreviewPage(index) {
   const preview = app.preview;
   const entry = preview?.pages?.[index];
   if (!preview || !entry || entry.kind !== "pdf" || entry.loading || entry.url) return;
   if (app.activePage !== index) return; // only the visible page renders
   entry.loading = true;
   try {
     const doc = await openPdf(entry.file);
     const r = await renderPdfPage(doc, entry.page);
     // The user may have stepped away while rendering: keep the fresh page.
     if (app.preview?.pages?.[index] === entry && app.activePage === index) {
       entry.url = r.url;
       entry.w = r.width_pt;
       entry.h = r.height_pt;
       entry.err = r.placeholder;
     }
   } catch {
     if (app.preview?.pages?.[index] === entry) entry.err = true;
   } finally {
     if (app.preview?.pages?.[index] === entry) entry.loading = false;
   }
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
   // PDF pages via pdf.js — one page at a time, metadata first.
   app.preview = null;
   app.previewLoading = true;
   void buildPreviewMeta(files);
 }

 export function removePreviewFile(index) {
   if (index < 0 || index >= app.previewFiles.length) return;
   app.compiledFiles.delete(app.previewFiles[index]);
   app.previewFiles.splice(index, 1);
   app.activePage = 0;
   if (!app.previewFiles.length) {
     app.preview = null;
     return;
   }
   app.preview = null;
   app.previewLoading = true;
   void buildPreviewMeta(app.previewFiles);
 }

 export function setActivePage(index) {
   app.activePage = index;
   void ensurePreviewPage(index);
 }

 /** Rebuild the on-device preview (the retry path after a failed render). */
 export function retryPreview() {
   if (!app.previewFiles.length) return;
   app.preview = null;
   app.previewLoading = true;
   void buildPreviewMeta(app.previewFiles);
 }

export function updateSpec(patch) {
  Object.assign(app.spec, patch);
  // Field edits implicitly arm the marking; an explicit `armed` in the patch
  // (delete, re-add) is honoured as-is.
  if (!Object.prototype.hasOwnProperty.call(patch, "armed")) app.spec.armed = true;
  // The compiled ("second temp") images are bound to the spec — any change
  // invalidates them so Stamp can never use a stale bake.
  app.compiledFiles.clear();
}

export function resetSpec() {
  app.spec = defaultSpec();
  app.compiledFiles.clear();
}

/* ---------- compiled ("second temp") images ---------- */

/** Bake the CURRENT spec into every photo in the palang basket (Apply &
 *  save). The editor keeps showing the originals for re-editing; Stamp uses
 *  the compiled blobs — keyed by File — so the A4 fit can never shift the
 *  marking relative to the photo. With onlyMissing it recompiles just the
 *  stale ones (e.g. after re-editing or adding a photo). */
export async function applyCompiled({ onlyMissing = false } = {}) {
  if (!app.spec.armed) {
    app.compiledFiles.clear();
    return;
  }
  for (const f of app.previewFiles) {
    if (f.type === "application/pdf" || /\.pdf$/i.test(f.name)) continue;
    if (onlyMissing && app.compiledFiles.has(f)) continue;
    try {
      const out = await compileStampedImage(
        { bytes: () => f.arrayBuffer(), mime: f.type, setting: null },
        app.pageSize,
        app.spec
      );
      app.compiledFiles.set(f, new Blob([out.bytes], { type: "image/png" }));
    } catch (err) {
      console.warn("compile failed:", err);
      app.compiledFiles.delete(f);
    }
  }
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
    flash("error", t("msgAddFirst"));
    return;
  }
  if (!app.consented) {
    flash("error", t(deployKind === "self" ? "msgAgreeSelf" : "msgAgreeHosted"));
    return;
  }
  if (mode === "palang" && app.spec.armed && app.spec.mode === "band" && !(app.spec.text || "").trim()) {
    flash("error", t("msgPurpose"));
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
    if (mode === "palang" && app.spec.armed) {
      // The two-temp contract: Stamp uses the compiled images; anything not
      // yet compiled (add/change after the last Apply) is compiled now so a
      // stale bake is impossible.
      await applyCompiled({ onlyMissing: true });
    }
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
      // PDFs come from the merge basket OR the palang basket (previewFiles
      // can be a mix of images and PDFs) — both must copy pages, never be
      // fed to the image embedder (the reported PDF break).
      const isPdf = f.type === "application/pdf" || /\.pdf$/i.test(f.name);
      const im = app.images.find((x) => x.file === f);
      const compiled = app.compiledFiles.get(f);
      if (compiled && !isPdf) {
        // The photo already carries the baked palang ("second temp") — the
        // engine must NOT stamp it again.
        return {
          bytes: () => compiled.arrayBuffer(),
          mime: "image/png",
          setting: null,
          isPdf: false,
          stamped: true,
        };
      }
      return {
        bytes: () => Promise.resolve(bytes),
        mime,
        setting: im ? { enhance: im.enhance, crop: im.crop } : null,
        isPdf,
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
    selectMergeFile,
    stepMerge,
    setActivePage,
    applyCompiled,
    setConsent,
    setTheme,
    setLang,
    generate,
  };
}
