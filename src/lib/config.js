/**
 * Operational limits for ONE visitor session (client-side guards).
 *
 * The hosted app is a static site — processing happens in the visitor's
 * browser, so there is no server to exhaust. These caps protect the USER's
 * own device from accidental overload and keep any browser tab sane. They
 * are also deliberately generous: normal document prep never gets near them.
 *
 * Deployment operator flag: put a `limits.json` next to the app on the
 * static host (overrides without a redeploy), e.g.
 *   { "images": 50, "files": 20, "pdfPages": 1500, "fileMb": 64 }
 * Missing/corrupt file → defaults below.
 */

export const LIMITS = {
  images: 50, // photos per convert / palang session
  files: 30, // PDFs per merge
  pdfPages: 3000, // total pages across a merged (or palang) document
  fileMb: 128, // per-file size cap
};

export async function loadLimits() {
  try {
    const res = await fetch(`limits.json?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return;
    const overrides = await res.json();
    if (!overrides || typeof overrides !== "object") return;
    for (const k of Object.keys(LIMITS)) {
      const v = Number(overrides[k]);
      if (Number.isFinite(v) && v > 0) LIMITS[k] = v;
    }
  } catch {
    /* offline / static host without the file: defaults stay in force */
  }
}
