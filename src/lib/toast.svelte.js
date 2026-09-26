/**
 * Generic toast service — the ONE way the app reports an outcome.
 *
 * Rules (user feedback: toasts were long and inconsistent):
 *  - short, one line, state only ("Converted" / "Convert failed")
 *  - kind drives the look: "ok" = green tick, "error" = red alert
 *  - the file itself is NOT recited here; the result row shows it
 *
 * Kept out of the store module so any module can push a toast without an
 * import cycle.
 */
let seq = 0;
const DEFAULT_MS = 3800;

export const toasts = $state([]);

/** Push a toast. Returns its id (handy for tests). */
export function toast(kind, text, ms = DEFAULT_MS) {
  if (!text) return 0;
  const id = ++seq;
  toasts.push({ id, kind: kind === "error" ? "error" : "ok", text });
  if (ms > 0) setTimeout(() => dismissToast(id), ms);
  return id;
}

export function dismissToast(id) {
  const i = toasts.findIndex((x) => x.id === id);
  if (i >= 0) toasts.splice(i, 1);
}

export function clearToasts() {
  toasts.length = 0;
}
