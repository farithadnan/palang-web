/* Module-mode runes store: the single owner of app state and side effects.
   Views read/write `app.*`; components stay presentational. */

import * as api from "./api.js";
import { buildPalangSpec, defaultSpec, imageSettings } from "./domain.js";

const CONSENT_KEY = "palang-consent-v1";
const THEME_KEY = "palang-theme";

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
  presets: [],
  preview: null, // { count, truncated, pages: [{page,width_pt,height_pt,png_base64}] }
  previewFiles: [],
  previewLoading: false,
  activePage: 0,
  busy: false,
  message: null, // { kind: "ok" | "error", text }
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
    app.images.push({
      id: "img-" + ++imageSeq,
      file,
      url: URL.createObjectURL(file),
      crop: null,
      enhance: false,
    });
  }
}

export function updateImage(id, patch) {
  const im = app.images.find((i) => i.id === id);
  if (im) Object.assign(im, patch);
}

export function removeImage(id) {
  const index = app.images.findIndex((i) => i.id === id);
  if (index >= 0) {
    URL.revokeObjectURL(app.images[index].url);
    app.images.splice(index, 1);
  }
}

export function removeImages(ids) {
  const doomed = new Set(ids);
  for (const im of app.images) {
    if (doomed.has(im.id)) URL.revokeObjectURL(im.url);
  }
  app.images = app.images.filter((im) => !doomed.has(im.id));
}

export function revertImage(id) {
  updateImage(id, { crop: null, enhance: false });
}

export function replaceImage(id, file) {
  const im = app.images.find((i) => i.id === id);
  if (!im) return;
  URL.revokeObjectURL(im.url);
  im.file = file;
  im.url = URL.createObjectURL(file);
}

/* ---------- pdfs (merge) ---------- */

let pdfSeq = 0;

export function addPdfs(fileList) {
  for (const file of fileList) {
    app.pdfs.push({ id: "pdf-" + ++pdfSeq, file });
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

/* ---------- presets / templates ---------- */

export async function loadPresets() {
  try {
    app.presets = await api.getJSON("/api/presets");
  } catch {
    app.presets = [];
  }
}

export async function savePreset(doc) {
  await api.postJSON("/api/presets", doc);
  await loadPresets();
}

export async function deletePreset(name) {
  await api.del("/api/presets/" + encodeURIComponent(name));
  await loadPresets();
}

/* ---------- palang preview + spec ---------- */

export function pickPreviewFiles(fileList) {
  app.previewFiles = [...fileList];
  app.activePage = 0;
  if (!app.previewFiles.length) {
    app.preview = null;
    return;
  }
  void loadPreview();
}

export function removePreviewFile(index) {
  if (index < 0 || index >= app.previewFiles.length) return;
  app.previewFiles.splice(index, 1);
  app.activePage = 0;
  if (!app.previewFiles.length) {
    app.preview = null;
    return;
  }
  void loadPreview();
}

export async function loadPreview() {
  if (!app.previewFiles.length) return;
  app.previewLoading = true;
  app.preview = null;
  try {
    app.preview = await api.preview(app.previewFiles);
  } catch (err) {
    app.preview = null;
    flash("error", err.message);
  } finally {
    app.previewLoading = false;
  }
}

export function setActivePage(index) {
  app.activePage = index;
}

export function updateSpec(patch) {
  Object.assign(app.spec, patch);
  app.spec.armed = true;
}

export function resetSpec() {
  app.spec = defaultSpec();
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
    flash("error", "Tick the agreement first: your files are processed on this server and deleted right after.");
    return;
  }
  if (mode === "palang" && app.spec.armed && app.spec.mode === "band" && !(app.spec.text || "").trim()) {
    flash("error", "Add the purpose text for the bar.");
    return;
  }

  const fields = { merge: "true" };
  if (mode === "convert" && app.images.length) {
    fields.page = app.pageSize;
    fields.image_settings = JSON.stringify(imageSettings(app.images));
  }
  if (mode === "palang" && app.spec.armed) {
    fields.palang = JSON.stringify(buildPalangSpec(app.spec));
  }

  const filename = mode === "merge" ? "merged.pdf" : mode === "palang" ? "stamped.pdf" : "converted.pdf";
  app.busy = true;
  try {
    const blob = await api.upload(files, fields);
    downloadBlob(blob, filename);
    flash("ok", "Done. Your file is downloading.");
  } catch (err) {
    flash("error", err.message);
  } finally {
    app.busy = false;
  }
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
  window.__palang = { app, updateImage, addImages, removeImages, setConsent, setTheme, generate };
}
