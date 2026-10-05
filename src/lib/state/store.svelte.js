/* Module-mode runes store: the single owner of app state and side effects.
   Views read/write `app.*`; components stay presentational. */

import { t, __bindLang } from "../i18n/index.js";
import { SvelteMap } from "svelte/reactivity";
import { processOffline, compileStampedImage, buildPdf } from "../engine/local-engine.js";
import { openPdf, renderPdfPage } from "../engine/pdf-preview.js";
import { LIMITS, loadLimits } from "../util/config.js";
import { APP_VERSION } from "../util/version.js";
import { defaultSpec, PAGE_DIMS, pageDims, parseRangeGroups } from "../domain/domain.js";
import { toast } from "./toast.svelte.js";
import { RELEASES_URL, SITE_URL } from "../util/links.js";
import { saveDocument, isNativeApp } from "../util/save.js";

const THEME_KEY = "palang-theme";
const LANG_KEY = "palang-lang";
const PAGESIZE_KEY = "palang-pagesize";
const DEFAULTTEXT_KEY = "palang-default-text";

function initialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light" || saved === "system") return saved;
  } catch {
    /* fall through */
  }
  return "system"; // follow the OS by default
}

function initialSystemDark() {
  return typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches;
}

function initialPageSize() {
  try {
    const saved = localStorage.getItem(PAGESIZE_KEY);
    if (["A4", "A5", "Letter", "fit"].includes(saved)) return saved;
  } catch {
    /* fall through */
  }
  return "fit";
}

/** The saved default palang text, or null to use the domain default. */
function savedDefaultText() {
  try {
    return localStorage.getItem(DEFAULTTEXT_KEY) || null;
  } catch {
    return null;
  }
}

/** A fresh spec, using the saved default palang text when one is set. */
function newSpec() {
  const s = defaultSpec();
  const text = savedDefaultText();
  if (text) s.text = text;
  return s;
}

export const app = $state({
  view: "convert",
  pageSize: initialPageSize(),
  theme: initialTheme(),
  systemDark: initialSystemDark(),
  defaultText: savedDefaultText(),
  images: [],
  pdfs: [],
  preview: null, // { count, pages: [{kind,file,page,url,w,h,loading,err}] }
  previewFiles: [],
  previewLoading: false,
  activePage: 0,
  merge: { pages: [], active: 0 }, // flat ordered page list across all merge PDFs
  split: { file: null, count: 0, ranges: "" }, // Extract tool: one PDF + chosen pages
  prepare: {
    // Stage 1 of the unified pipeline: ONE mixed basket + one export sheet.
    items: [], // { id, kind:'image'|'pdf', file, url, pageCount }
    paper: "fit",
    stamp: false,
    stampText: "UNTUK KEGUNAAN BANK SAHAJA",
    merge: true, // merge everything into one PDF (vs one PDF per item)
    filename: "",
  },
  busy: false,
  result: null, // { name, blob, size, mode } — the file just produced
  session: newSession(), // this run's summary: counts + recent outputs (in memory only)
  update: null, // { version } when a newer version.json is published
  lang: initialLang(), // ui language (en | ms)
  requestAdd: 0,
  updateFreq: updateFreqDefault(), // requests the app has made this session (privacy proof panel)
  compiledFiles: new Map(), // file -> Blob with the palang baked in ("second temp")
  fileThumbs: new SvelteMap(), // pdf File -> first-page thumbnail object URL (Palang basket)
  stamp: [], // per-image palang spec, index-aligned with previewFiles (per-image stamps)
});

// i18n reads the language through this getter (never by importing the store),
// so the store -> i18n import stays one-way and cycle-free.
__bindLang(() => app.lang);

// Keep the "system" theme live when the OS preference changes.
if (typeof window !== "undefined" && typeof matchMedia !== "undefined") {
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    app.systemDark = e.matches;
  });
}

export function setTheme(theme) {
  if (!["light", "dark", "system"].includes(theme)) return;
  app.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* theme lasts for this session only */
  }
}

/** Default paper size — also becomes the current choice. */
export function setDefaultPageSize(size) {
  if (!["A4", "A5", "Letter", "fit"].includes(size)) return;
  app.pageSize = size;
  try {
    localStorage.setItem(PAGESIZE_KEY, size);
  } catch {
    /* session only */
  }
}

/** Default palang text, pre-filled on every new palang. */
export function setDefaultText(text) {
  app.defaultText = text || null;
  try {
    if (text) localStorage.setItem(DEFAULTTEXT_KEY, text);
    else localStorage.removeItem(DEFAULTTEXT_KEY);
  } catch {
    /* session only */
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

function updateFreqDefault() {
  try {
    return (typeof localStorage !== "undefined" && localStorage.getItem("palang-updfreq")) || "daily";
  } catch {
    return "daily";
  }
}

export function setUpdateFreq(freq) {
  app.updateFreq = freq;
  try {
    localStorage.setItem("palang-updfreq", freq);
  } catch {
    /* session only */
  }
}

export function requestAdd() {
  app.requestAdd += 1;
}

export function flash(kind, text) {
  // Every outcome in the app goes through the ONE toast service.
  toast(kind, text);
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
      url, // display: cropped(rotated(original))
      originalUrl: url, // the raw file, and the rotation source
      baseUrl: url, // rotated (uncropped); === originalUrl while rotation is 0
      crop: null,
      rotationDeg: 0,
      enhance: false,
    });
  }
}

export function updateImage(id, patch) {
  const im = app.images.find((i) => i.id === id);
  if (im) Object.assign(im, patch);
}

/* ---------- image preview rendering ----------
   `originalUrl` is the raw file; `baseUrl` is the ROTATED (uncropped) preview;
   `url` is what the app displays (cropped when a crop is set). The engine never
   uses these: it re-crops the original File with the same rotation + fractions,
   so preview and output stay in lock-step. */

const MAX_PREVIEW_PX = 2400;

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function canvasBlob(canvas, type) {
  return new Promise((res) => canvas.toBlob(res, type, 0.92));
}

function imageMime(im) {
  return im.file?.type === "image/png" ? "image/png" : "image/jpeg";
}

/** Revoke the derived (base/display) blob URLs — never the original. */
function releaseDerived(im) {
  for (const u of new Set([im.url, im.baseUrl])) {
    if (u && u !== im.originalUrl) URL.revokeObjectURL(u);
  }
}

function rotatedDeg(v) {
  return (((v ?? 0) % 360) + 360) % 360;
}

/** Rebuild `baseUrl` from the original at the current rotation. */
async function rebuildBase(im) {
  const deg = rotatedDeg(im.rotationDeg);
  const prev = im.baseUrl;
  if (deg === 0) {
    im.baseUrl = im.originalUrl;
  } else {
    const img = await loadImage(im.originalUrl);
    const swap = deg === 90 || deg === 270;
    const w = swap ? img.naturalHeight : img.naturalWidth;
    const h = swap ? img.naturalWidth : img.naturalHeight;
    const s = Math.min(1, MAX_PREVIEW_PX / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w * s));
    canvas.height = Math.max(1, Math.round(h * s));
    const ctx = canvas.getContext("2d");
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((deg * Math.PI) / 180);
    ctx.drawImage(
      img,
      (-img.naturalWidth * s) / 2,
      (-img.naturalHeight * s) / 2,
      img.naturalWidth * s,
      img.naturalHeight * s
    );
    const blob = await canvasBlob(canvas, imageMime(im));
    im.baseUrl = blob ? URL.createObjectURL(blob) : im.originalUrl;
  }
  if (prev && prev !== im.originalUrl && prev !== im.baseUrl) URL.revokeObjectURL(prev);
}

/** Rebuild `url` (what is displayed) from `baseUrl` + the current crop. */
async function rebuildDisplay(im) {
  const prev = im.url;
  if (!im.crop) {
    im.url = im.baseUrl;
  } else {
    const img = await loadImage(im.baseUrl);
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const l = Math.round(im.crop.l * w);
    const t = Math.round(im.crop.t * h);
    const r = Math.round(im.crop.r * w);
    const b = Math.round(im.crop.b * h);
    const cw = Math.max(1, r - l);
    const ch = Math.max(1, b - t);
    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    canvas.getContext("2d").drawImage(img, l, t, cw, ch, 0, 0, cw, ch);
    const blob = await canvasBlob(canvas, imageMime(im));
    im.url = blob ? URL.createObjectURL(blob) : im.baseUrl;
  }
  if (prev && prev !== im.originalUrl && prev !== im.url && prev !== im.baseUrl) {
    URL.revokeObjectURL(prev);
  }
}

async function refreshImage(im) {
  await rebuildBase(im);
  if (!app.images.includes(im)) return; // removed while decoding
  await rebuildDisplay(im);
}

/** Rotate a photo in 90° steps; an existing crop stays in rotated space. */
export function rotateImage(id, delta) {
  const im = app.images.find((i) => i.id === id);
  if (!im) return;
  im.rotationDeg = rotatedDeg((im.rotationDeg ?? 0) + delta);
  void refreshImage(im);
}

/** Commit a crop (fractions of the rotated image) and show the result. */
export function cropPreview(id, crop) {
  const im = app.images.find((i) => i.id === id);
  if (!im) return;
  im.crop = crop;
  void rebuildDisplay(im);
}

/** Swap a photo with its neighbour — page order follows list order. */
export function moveImage(id, delta) {
  const i = app.images.findIndex((im) => im.id === id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= app.images.length) return;
  const tmp = app.images[i];
  app.images[i] = app.images[j];
  app.images[j] = tmp;
}

export function removeImage(id) {
  const index = app.images.findIndex((i) => i.id === id);
  if (index >= 0) {
    const im = app.images[index];
    releaseDerived(im);
    URL.revokeObjectURL(im.originalUrl);
    app.images.splice(index, 1);
  }
}

export function removeImages(ids) {
  const doomed = new Set(ids);
  for (const im of app.images) {
    if (doomed.has(im.id)) {
      releaseDerived(im);
      URL.revokeObjectURL(im.originalUrl);
    }
  }
  app.images = app.images.filter((im) => !doomed.has(im.id));
}

/** Undo: back to the original photo; crop, rotation and enhance cleared. */
export function revertImage(id) {
  const im = app.images.find((i) => i.id === id);
  if (!im) return;
  releaseDerived(im);
  im.rotationDeg = 0;
  im.baseUrl = im.originalUrl;
  im.url = im.originalUrl;
  im.crop = null;
  im.enhance = false;
}

export function replaceImage(id, file) {
  const im = app.images.find((i) => i.id === id);
  if (!im) return;
  releaseDerived(im);
  URL.revokeObjectURL(im.originalUrl);
  const url = URL.createObjectURL(file);
  im.file = file;
  im.url = url;
  im.originalUrl = url;
  im.baseUrl = url;
  im.crop = null;
  im.rotationDeg = 0;
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
  // Preserve any page-level edits (removed / rotation) across a rebuild, keyed
  // by source + page, so reordering files does not silently undo page work.
  const prev = new Map(app.merge.pages.map((p) => [`${p.pdfId}:${p.page}`, p]));
  const pages = [];
  let cum = 0;
  for (const p of app.pdfs) {
    try {
      const doc = await openPdf(p.file);
      if (cum + doc.count > LIMITS.pdfPages) {
        flash("error", t("msgOverflowFile", { name: p.file.name, n: LIMITS.pdfPages }));
        break;
      }
      for (let i = 1; i <= doc.count; i++) {
        const was = prev.get(`${p.id}:${i}`);
        pages.push({
          pdfId: p.id,
          file: p.file,
          page: i,
          url: null,
          w: null,
          h: null,
          loading: false,
          err: false,
          removed: was?.removed ?? false,
          rotationDeg: was?.rotationDeg ?? 0,
        });
      }
      cum += doc.count;
    } catch {
      console.warn("pdf structure failed:", p.file.name);
      pages.push({ pdfId: p.id, file: p.file, page: 1, url: null, w: null, h: null, loading: false, err: true, removed: false, rotationDeg: 0 });
    }
  }
  if (seq !== mergePreviewSeq) return;
  const active = Math.min(app.merge.active, Math.max(0, pages.length - 1));
  app.merge = { pages, active };
  void ensureMergePage(active);
}

let mergePreviewSeq = 0;

/** Toggle a page out of (or back into) the merged output. Recoverable: the page
 *  stays in the list, dimmed, and export simply filters it out. */
export function removeMergePage(index) {
  const pg = app.merge.pages?.[index];
  if (!pg) return;
  pg.removed = !pg.removed;
}

/** Rotate ONE page of the merged output in 90° steps. */
export function rotateMergePage(index, delta) {
  const pg = app.merge.pages?.[index];
  if (!pg) return;
  pg.rotationDeg = ((((pg.rotationDeg ?? 0) + delta) % 360) + 360) % 360;
}

/** Move ONE page earlier/later in the merged output. */
export function moveMergePage(index, delta) {
  const pages = app.merge.pages;
  const j = index + delta;
  if (!pages || index < 0 || index >= pages.length || j < 0 || j >= pages.length) return;
  [pages[index], pages[j]] = [pages[j], pages[index]];
  app.merge.active = j;
}

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

/** Jump straight to a page (the slider); renders only the target page. */
export function setMergePage(index) {
  const total = app.merge.pages.length;
  const next = Math.min(Math.max(0, index), Math.max(0, total - 1));
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

/** Natural pixel size of an object URL (needed only for the "fit" page box). */
function imageDims(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 0, h: 0 });
    img.src = url;
  });
}

/** Revoke the blob URLs held by a preview's pages (image pages and rendered
 *  PDF pages). `revokeObjectURL` ignores data URLs, so this is always safe. */
function releasePages(pages) {
  for (const pg of pages ?? []) {
    if (pg?.url && pg.url.startsWith("blob:")) URL.revokeObjectURL(pg.url);
  }
}

/** Tear down the current preview, releasing its page blob URLs. Rebuilding
 *  (add more / remove / retry) must go through this, or every rebuild leaks
 *  one object URL per image and per rendered PDF page. */
function clearPreview() {
  releasePages(app.preview?.pages);
  app.preview = null;
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
   let cumPdf = 0;
   for (const f of files) {
     if (!isImageFile(f)) {
       try {
         const doc = await openPdf(f);
         if (cumPdf + doc.count > LIMITS.pdfPages) {
           flash("error", t("msgOverflowFile", { name: f.name, n: LIMITS.pdfPages }));
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
     // The page box is the FULL page the output produces. A paper size gives
     // every photo that page; "fit" gives each photo a page shaped like itself
     // (scaled inside A4) so there is no white border. The canvas computes the
     // letterbox margin itself and shifts the emitted points by it.
     let box;
     if (app.pageSize === "fit") {
       const d = await imageDims(url);
       box = pageDims("fit", d.w, d.h);
     } else {
       box = PAGE_DIMS[app.pageSize] ?? PAGE_DIMS.A4;
     }
     pages.push({
       kind: "img",
       file: f,
       page: pages.length + 1,
       url,
       w: Math.round(box.w),
       h: Math.round(box.h),
       loading: false,
       err: false,
     });
   }
   if (seq !== previewSeq || !files.every((f, i) => app.previewFiles[i] === f)) {
     releasePages(pages); // this run was superseded: drop what it created
     return;
   }
   releasePages(app.preview?.pages);
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
     // Seed each photo's own palang spec (kept for existing files, default for
     // new ones) so specFor() stays a pure read below.
     app.stamp = files.map((f, i) => app.stamp[i] ?? newSpec());
     app.activePage = 0;
   if (!files.length) {
     clearPreview();
     return;
   }
   // Everything renders on-device now: images directly from the browser,
   // PDF pages via pdf.js — one page at a time, metadata first.
   clearPreview();
   app.previewLoading = true;
   void buildPreviewMeta(files);
 }

 export function removePreviewFile(index) {
   if (index < 0 || index >= app.previewFiles.length) return;
   const f = app.previewFiles[index];
   app.compiledFiles.delete(f);
   const thumb = app.fileThumbs.get(f);
   if (thumb) URL.revokeObjectURL(thumb);
   app.fileThumbs.delete(f);
   app.stamp.splice(index, 1);
   app.previewFiles.splice(index, 1);
   app.activePage = 0;
   if (!app.previewFiles.length) {
     clearPreview();
     return;
   }
   clearPreview();
   app.previewLoading = true;
   void buildPreviewMeta(app.previewFiles);
 }

 export function setActivePage(index) {
   app.activePage = index;
   void ensurePreviewPage(index);
 }

 /** Swap a palang-basket file with its neighbour. The page order of the output
  *  follows the list, so this reorders the produced pages too. The per-file
  *  palang list is swapped with its file to stay aligned. */
 export function movePreviewFile(index, delta) {
   const j = index + delta;
   if (index < 0 || index >= app.previewFiles.length || j < 0 || j >= app.previewFiles.length) return;
   [app.previewFiles[index], app.previewFiles[j]] = [app.previewFiles[j], app.previewFiles[index]];
   [app.stamp[index], app.stamp[j]] = [app.stamp[j], app.stamp[index]];
   app.activePage = 0;
   clearPreview();
   app.previewLoading = true;
   void buildPreviewMeta(app.previewFiles);
 }

 /** Render a PDF's FIRST page once, for the Palang basket thumbnail (so a PDF
  *  shows like an image instead of a file icon). Cached per File and queued so
  *  many PDFs render one at a time; "" marks a failed render (icon fallback). */
 let thumbChain = Promise.resolve();
 export function ensureFileThumb(file) {
   const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
   if (!isPdf || app.fileThumbs.has(file)) return;
   app.fileThumbs.set(file, null); // in-flight
   thumbChain = thumbChain.then(async () => {
     if (!app.fileThumbs.has(file)) return; // removed since queued
     try {
       const doc = await openPdf(file);
       const r = await renderPdfPage(doc, 1);
       if (app.fileThumbs.has(file)) app.fileThumbs.set(file, r.url);
     } catch {
       if (app.fileThumbs.has(file)) app.fileThumbs.set(file, "");
     }
   });
 }

 /** Rebuild the on-device preview (the retry path after a failed render). */
 export function retryPreview() {
   if (!app.previewFiles.length) return;
   clearPreview();
   app.previewLoading = true;
   void buildPreviewMeta(app.previewFiles);
 }

/** Update the ACTIVE spec (the one shown in the palette editor). Any change
 *  invalidates the compiled images, so Stamp can never use a stale bake. */
export function updateSpec(patch) {
  // Per-image stamps: edits target the ACTIVE image's own spec.
  const s = specFor(activePreviewFile() ?? app.previewFiles[0]);
  if (!s) return;
  Object.assign(s, patch);
  // Field edits implicitly arm the marking; an explicit `armed` in the patch
  // (delete, re-add) is honoured as-is.
  if (!Object.prototype.hasOwnProperty.call(patch, "armed")) s.armed = true;
  app.compiledFiles.clear();
}

/* ---------- compiled ("second temp") images ---------- */

/** The image/page the user is currently editing in the palang editor. */
function activePreviewFile() {
  return app.preview?.pages?.[app.activePage]?.file ?? null;
}
function fileIndex(file) {
  return file ? app.previewFiles.indexOf(file) : -1;
}

/** Each photo keeps its OWN palang spec (per-image stamps). Lazy-seeds the
 *  default stamp the first time an image is edited. */
export function specFor(file) {
  // Pure read: a spec is seeded when a file is picked (pickPreviewFiles), so
  // this never mutates state — calling it from a $derived is safe.
  const i = file ? app.previewFiles.indexOf(file) : -1;
  return i >= 0 && app.stamp[i] ? app.stamp[i] : newSpec();
}

/** Remove the palang from ONE image but keep the image: that photo then
 *  exports unstamped (its compiled copy has no palang baked in). */
export function removeStamp() {
  const file = activePreviewFile();
  const i = file ? app.previewFiles.indexOf(file) : -1;
  if (i < 0 || !app.stamp[i]) return;
  app.stamp[i].armed = false;
  app.compiledFiles.delete(file);
}

/** Bake the CURRENT spec into every photo in the palang basket (Apply &
 *  save). The editor keeps showing the originals for re-editing; Stamp uses
 *  the compiled blobs — keyed by File — so the A4 fit can never shift the
 *  marking relative to the photo. With onlyMissing it recompiles just the
 *  stale ones (e.g. after re-editing or adding a photo). */
export async function applyCompiled({ onlyMissing = false } = {}) {
  for (const f of app.previewFiles) {
    if (f.type === "application/pdf" || /\.pdf$/i.test(f.name)) continue;
    if (onlyMissing && app.compiledFiles.has(f)) continue;
    // Per-image: bake THIS photo with ITS own stamp (or none if removed). Every
    // photo is always compiled, so the output honours each image's
    // stamped / not-stamped state instead of the old document-wide spec.
    const i = fileIndex(f);
    const s = i >= 0 ? app.stamp[i] : null;
    // One palang per file: bake it when armed, otherwise nothing.
    const spec = s && s.armed ? s : null;
    try {
      const out = await compileStampedImage(
        { bytes: () => f.arrayBuffer(), mime: f.type, setting: null },
        app.pageSize,
        spec
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

/** Read the published manifest. Returns the remote version or null. */
async function fetchRemoteVersion() {
  // On device the app runs from tauri:// or capacitor://, where a RELATIVE
  // version.json is the BUNDLED one (same version as the app) — so an update
  // could never be seen. Fetch the published manifest from the site instead.
  const base = isNativeApp() ? SITE_URL : "";
  const res = await fetch(`${base}version.json?t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) return null;
  const manifest = await res.json();
  const remote = String(manifest.version ?? "");
  return remote && remote !== APP_VERSION ? remote : null;
}

/** Background check (boot, visibilitychange, cadence). Silent when current. */
export async function checkForUpdate() {
  try {
    const remote = await fetchRemoteVersion();
    if (!remote) {
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
    if (app.update) flash("ok", t("updateToast", { version: remote }));
  } catch {
    /* offline or static host unreachable: updates are best-effort */
  }
}

/** Manual check (About page). Always reports a result, even for a dismissed
 *  version, and never leaves the caller guessing: "latest" | "update" | "error". */
export async function checkNow() {
  try {
    const remote = await fetchRemoteVersion();
    if (!remote) return { state: "latest" };
    app.update = { version: remote };
    return { state: "update", version: remote };
  } catch {
    return { state: "error" };
  }
}

export function releaseUrl() {
  return RELEASES_URL;
}

export function applyUpdate() {
  if (isNativeApp()) {
    // A reload would load the SAME bundled build. Send the user to the release
    // page to install the new one (a true in-app updater is a future item).
    window.open(RELEASES_URL, "_blank", "noopener");
    return;
  }
  // Web/PWA: refresh pulls the new static bundle.
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

/* ---------- session summary ----------
   What was made THIS run. In memory only — never persisted, cleared on close —
   so the "nothing is stored" guarantee holds. */

const SESSION_LIMIT = 10; // recent outputs kept for re-save
let outputSeq = 0;

function newSession() {
  return { startedAt: Date.now(), outputs: [], counts: { convert: 0, palang: 0, merge: 0, prepare: 0 } };
}

/** Record one produced file. Newest first; the oldest is dropped past the cap
 *  (its blob reference is released with it). */
export function recordOutput(entry) {
  const s = app.session;
  s.counts[entry.mode] = (s.counts[entry.mode] ?? 0) + 1;
  s.outputs = [{ id: `out-${++outputSeq}`, at: Date.now(), ...entry }, ...s.outputs].slice(0, SESSION_LIMIT);
}

export function clearSession() {
  app.session = newSession();
  flash("ok", t("sessionCleared"));
}

/* ---------- generate ---------- */

export function canGenerate() {
  return app.images.length + app.pdfs.length > 0 && !app.busy;
}

/** Merge needs at least TWO PDFs — one file is not a merge. */
export function canMerge() {
  return app.pdfs.length >= 2 && !app.busy;
}

const DONE_KEY = { convert: "msgDoneConvert", palang: "msgDonePalang", merge: "msgDoneMerge", prepare: "msgDonePrepare" };
const FAIL_KEY = { convert: "msgFailConvert", palang: "msgFailPalang", merge: "msgFailMerge", split: "msgFailSplit", prepare: "msgFailPrepare" };

/** Local date+time for filenames (toISOString is UTC, so a late-day run in
 *  UTC+8 carried yesterday's date). One helper, used by every export. */
function localStamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
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
  if (mode === "merge" && files.length < 2) {
    flash("error", t("mgNeedMore"));
    return;
  }
  // The merged output follows the page plan (order + per-page rotation), minus
  // any page the user removed. Built here so the UI can validate early.
  const mergePlan =
    mode === "merge"
      ? app.merge.pages
          .filter((p) => !p.removed && !p.err)
          .map((p) => ({
            key: p.pdfId,
            name: p.file.name,
            bytes: () => p.file.arrayBuffer(),
            page: p.page,
            rotate: p.rotationDeg,
          }))
      : [];
  if (mode === "merge" && !mergePlan.length) {
    flash("error", t("mgNoPages"));
    return;
  }
  if (mode === "palang") {
    const missing = app.stamp.some(
      (x) => x && x.armed && x.mode === "band" && !(x.text || "").trim()
    );
    if (missing) {
      flash("error", t("msgPurpose"));
      return;
    }
  }

  const stamp = localStamp();
  const filename =
    mode === "merge"
      ? `palang-merged-${stamp}.pdf`
      : mode === "palang"
        ? `palang-stamped-${stamp}.pdf`
        : `palang-converted-${stamp}.pdf`;
  app.busy = true;
  try {
    if (mode === "palang") {
      // Bake every photo with ITS OWN stamp (or none, when removed). Images are
      // all pre-compiled, so a later page-space pass never re-stamps them.
      await applyCompiled({ onlyMissing: true });
    }
    let blob;
    if (mode === "merge") {
      blob = new Blob([await buildPdf(mergePlan)], { type: "application/pdf" });
    } else {
      blob = await offlineBlob(files);
    }
    const how = await saveDocument(blob, filename);
    app.result = { name: filename, blob, size: blob.size, mode };
    recordOutput({ mode, name: filename, blob, size: blob.size, files: files.length });
    if (how !== "cancelled") flash("ok", t(DONE_KEY[mode] ?? DONE_KEY.convert));
  } catch (err) {
    flash("error", generateErrorText(mode, err));
  } finally {
    app.busy = false;
  }
}

/** Turn a generate failure into a localised message: known PDF errors name the
 *  file and the reason; anything else keeps the short state line + the raw
 *  reason (never "undefined"). */
function generateErrorText(mode, err) {
  if (err?.code === "pdf-locked") return t("msgPdfLocked", { name: err.fileName });
  if (err?.code === "pdf-unreadable") return t("msgPdfBroken", { name: err.fileName });
  const reason = typeof err?.message === "string" && err.message ? " · " + err.message.slice(0, 90) : "";
  return (t(FAIL_KEY[mode] ?? FAIL_KEY.convert) + reason).trim();
}

/* ---------- extract (split) ---------- */

/** Choose the PDF to extract from; page count is read lazily. */
export function setSplitFile(file) {
  app.split = { file: file ?? null, count: 0, ranges: app.split.ranges };
  if (!file) return;
  void openPdf(file)
    .then((doc) => {
      if (app.split.file === file) app.split.count = doc.count;
    })
    .catch(() => {
      if (app.split.file === file) app.split.count = 0;
    });
}

export function setSplitRanges(text) {
  app.split.ranges = text;
}

/** Extract the chosen ranges: one PDF, or one PDF per range. */
export async function generateSplit(onePerRange) {
  const file = app.split.file;
  if (!file || !app.split.count) {
    flash("error", t("splitChooseFirst"));
    return;
  }
  const groups = parseRangeGroups(app.split.ranges, app.split.count);
  if (!groups.length) {
    flash("error", t("splitNoPages"));
    return;
  }
  const stamp = localStamp();
  app.busy = true;
  try {
    const outputs = onePerRange ? groups : [groups.flat()];
    let first = null;
    for (let i = 0; i < outputs.length; i++) {
      const plan = outputs[i].map((page) => ({
        key: "split",
        name: file.name,
        bytes: () => file.arrayBuffer(),
        page,
        rotate: 0,
      }));
      const blob = new Blob([await buildPdf(plan)], { type: "application/pdf" });
      const name = onePerRange
        ? `palang-split-${i + 1}-${stamp}.pdf`
        : `palang-extracted-${stamp}.pdf`;
      await saveBlob(blob, name);
      if (!first) first = { name, blob, size: blob.size, mode: "split" };
    }
    app.result = first;
    flash("ok", t("splitDone"));
  } catch (err) {
    flash("error", generateErrorText("split", err));
  } finally {
    app.busy = false;
  }
}

/* ---------- prepare (unified pipeline, stage 1) ----------
   ONE mixed basket of images and PDFs, exported by the SAME engine path as the
   rest of the app. Per-item editing (crop/rotate/enhance/placement) is stage 2;
   here the basket, paper size, optional purpose stamp and export shape are
   unified. */

let prepareSeq = 0;

function isPdfFile(file) {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

export function addPrepareFiles(fileList) {
  const room = LIMITS.images - app.prepare.items.length;
  if (room <= 0) {
    flash("error", t("msgMaxImages", { n: LIMITS.images }));
    return;
  }
  for (const file of fileList.slice(0, room)) {
    if (file.size > LIMITS.fileMb * 1024 * 1024) {
      flash("error", t("msgOverMb", { name: file.name, n: LIMITS.fileMb }));
      continue;
    }
    const isPdf = isPdfFile(file);
    const item = {
      id: `prep-${++prepareSeq}`,
      kind: isPdf ? "pdf" : "image",
      file,
      url: isPdf ? null : URL.createObjectURL(file),
      pageCount: 0,
    };
    app.prepare.items.push(item);
    if (isPdf) void readPreparePageCount(item);
  }
}

async function readPreparePageCount(item) {
  try {
    const doc = await openPdf(item.file);
    if (app.prepare.items.includes(item)) item.pageCount = doc.count;
  } catch {
    /* unreadable: the export will report it */
  }
}

export function removePrepareItem(id) {
  const i = app.prepare.items.findIndex((x) => x.id === id);
  if (i < 0) return;
  const item = app.prepare.items[i];
  if (item.url) URL.revokeObjectURL(item.url);
  app.prepare.items.splice(i, 1);
}

export function movePrepareItem(id, delta) {
  const i = app.prepare.items.findIndex((x) => x.id === id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= app.prepare.items.length) return;
  const tmp = app.prepare.items[i];
  app.prepare.items[i] = app.prepare.items[j];
  app.prepare.items[j] = tmp;
}

export function setPrepare(patch) {
  Object.assign(app.prepare, patch);
}

/** The engine setup for a slice of prepare items (images vs pdfs). */
function prepareSetups(items) {
  const images = [];
  const pdfs = [];
  for (const it of items) {
    const bytes = () => it.file.arrayBuffer();
    if (it.kind === "pdf") {
      pdfs.push({ bytes, name: it.file.name, mime: "application/pdf", isPdf: true });
    } else {
      images.push({ bytes, mime: it.file.type || "image/jpeg", setting: null, isPdf: false });
    }
  }
  return { images, pdfs };
}

export async function generatePrepare() {
  const items = app.prepare.items;
  if (!items.length) {
    flash("error", t("msgAddFirst"));
    return;
  }
  const paper = app.prepare.paper;
  const stampText = (app.prepare.stampText || "").trim();
  const spec = app.prepare.stamp ? { ...defaultSpec(), text: stampText || defaultSpec().text } : null;
  const stamp = localStamp();
  const base = (app.prepare.filename || "palang-prepared").replace(/\.pdf$/i, "").trim() || "palang-prepared";
  app.busy = true;
  try {
    if (app.prepare.merge) {
      const setup = prepareSetups(items);
      const out = await processOffline({ images: setup.images, pdfs: setup.pdfs, pageSize: paper, spec });
      const blob = new Blob([out], { type: "application/pdf" });
      const filename = `${base}-${stamp}.pdf`;
      await saveBlob(blob, filename);
      app.result = { name: filename, blob, size: blob.size, mode: "prepare" };
      recordOutput({ mode: "prepare", name: filename, blob, size: blob.size, files: items.length });
    } else {
      let first = null;
      for (let i = 0; i < items.length; i++) {
        const setup = prepareSetups([items[i]]);
        const out = await processOffline({ images: setup.images, pdfs: setup.pdfs, pageSize: paper, spec });
        const blob = new Blob([out], { type: "application/pdf" });
        const filename = `${base}-${i + 1}-${stamp}.pdf`;
        await saveBlob(blob, filename);
        if (!first) first = { name: filename, blob, size: blob.size, mode: "prepare" };
      }
      app.result = first;
      recordOutput({ mode: "prepare", name: first.name, blob: first.blob, size: first.size, files: items.length });
    }
    flash("ok", t("msgDonePrepare"));
  } catch (err) {
    flash("error", generateErrorText("prepare", err));
  } finally {
    app.busy = false;
  }
}

async function offlineBlob(files) {
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
      // This file's OWN palang (one per file). Convert/merge files are not in
      // previewFiles, so they get none — each file's band stays on its own
      // pages instead of every file's palang landing on every PDF page.
      const fi = app.previewFiles.indexOf(f);
      const ownSpec = fi >= 0 ? app.stamp[fi] : null;
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
        name: f.name,
        setting: im ? { enhance: im.enhance, crop: im.crop, rotation: im.rotationDeg } : null,
        isPdf,
        // Used only for PDF pages, and as a page-space fallback when a photo
        // could not be pre-compiled.
        spec: ownSpec,
      };
    })
  );
  const out = await processOffline({
    images: setup.filter((s) => !s.isPdf),
    pdfs: setup.filter((s) => s.isPdf),
    pageSize: app.pageSize,
  });
  return new Blob([out], { type: "application/pdf" });
}

export function clearResult() {
  app.result = null;
}

/** ONE path to (re-)save any produced file, so Result and Session cannot
 *  drift. Returns the platform outcome ("saved" | "shared" | "downloaded" |
 *  "cancelled"). */
async function saveBlob(blob, name) {
  const how = await saveDocument(blob, name);
  if (how === "shared" || how === "saved") flash("ok", t("msgSaved"));
  return how;
}

/** Save the current result again — the same platform path as the first save. */
export async function saveResult() {
  if (app.result) await saveBlob(app.result.blob, app.result.name);
}

/** Re-save an entry from the session summary. */
export async function saveOutput(out) {
  if (out) await saveBlob(out.blob, out.name);
}

/* ---------- tool handoff ----------
   Move a produced file into the next tool's basket, so the user never re-adds
   their own output. The store only seeds; the caller navigates (SOC). */

function seedBasket(blob, name, target) {
  const file = new File([blob], name, { type: "application/pdf" });
  if (target === "palang") {
    pickPreviewFiles([file]);
    return true;
  }
  if (target === "merge") {
    addPdfs([file]);
    return true;
  }
  return false;
}

/** Seed `target` from the current result. Returns false when there is none. */
export function sendResultTo(target) {
  return app.result ? seedBasket(app.result.blob, app.result.name, target) : false;
}

/** Seed `target` from a session output (an earlier file). */
export function sendOutputTo(out, target) {
  return out ? seedBasket(out.blob, out.name, target) : false;
}

export function humanSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/* Test/verification hook: lets headless checks read and drive the store.
   Dev-only — it must not exist in the packaged production bundle. */
if (import.meta.env.DEV && typeof window !== "undefined") {
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
    setMergePage,
    setActivePage,
    applyCompiled,
    removeStamp,
    setTheme,
    setLang,
    generate,
    canMerge,
    saveResult,
    clearResult,
    checkNow,
  };
}
