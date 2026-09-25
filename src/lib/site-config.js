/**
 * Single source for app-level site configuration.
 *
 * Two layers, deliberately split:
 *   BUILD-TIME  dotenv files (the industrial standard: `.env.production`,
 *               `.env.development`, plus gitignored `.env.local` overrides
 *               per developer). Exposed to code as import.meta.env.VITE_*.
 *   RUNTIME     public/limits.json — the operator flag that adjusts caps
 *               without a rebuild (see config.js).
 *
 * Vars this module reads:
 *   VITE_HOST_URL  the official instance origin. The deploy copy and the
 *                  hosted/self wording key off it: same origin = "hosted",
 *                  any other remote origin = third-party, localhost / file:
 *                  = your own copy. Defaults to the production site.
 *
 * The build variant (full site vs app only) is the Vite MODE itself:
 *   vite build             -> mode "production" : landing page + app
 *   vite build --mode app  -> mode "app"        : tools only, tree-shaken
 *                              bundle (Docker / APK / EXE / private hosting).
 */

/** The official instance origin (trailing slashes stripped). */
export const hostUrl = (import.meta.env.VITE_HOST_URL || "https://palang.oh-alam.my").replace(/\/+$/, "");

/** Build variant: "app" = tools only (no landing page), else full site. */
export const appVariant = import.meta.env.MODE === "app";

/** Pure classifier: which deployment bucket does an origin fall into?
 *  "hosted" - the official instance (origin matches the configured URL)
 *  "third"  - any other remote server
 *  "self"   - no origin (offline/file/local) */
export function classifyDeploy(origin, official = hostUrl) {
  if (!origin) return "self";
  try {
    return new URL(origin).origin === new URL(official).origin ? "hosted" : "third";
  } catch {
    return "third"; // unparseable origin/config — never claim an official instance falsely
  }
}

/** Deployment mode of THIS copy, drives the honest privacy wording.
 *  Override for testing with ?mode=hosted|third|self on any page. */
export function detectDeploy() {
  if (typeof location === "undefined") return "self";
  const mode = new URLSearchParams(location.search).get("mode");
  if (mode === "hosted" || mode === "third" || mode === "self") return mode;
  if (location.protocol === "file:") return "self";
  const h = location.hostname;
  if (h === "" || h === "localhost" || h === "127.0.0.1" || h.endsWith(".local")) return "self";
  return classifyDeploy(location.href, hostUrl);
}

export const deployKind = detectDeploy();
