/**
 * ONE router for both build outputs, chosen at build time.
 *
 *  - SITE build (`npm run build`): real paths under the deployment base
 *    (/palang-web/install/ on GitHub Pages, /install at a domain root). The
 *    build pre-renders an index.html per route (scripts/prerender.mjs), so
 *    every static host serves them without a rewrite rule and a deep link
 *    never 404s.
 *  - APP build (`npm run build:app`): hash routes (#/convert). The native
 *    shells have no server to rewrite paths, and the app reloads itself on an
 *    update, so a nested path would come back as a blank page.
 *
 * Components never build a URL by hand: they call href()/goto(). The base
 * comes from Vite (BASE_URL), so the same code works at a domain root and
 * under a repository path.
 */
const HASH_MODE = import.meta.env.MODE === "app";
const BASE = import.meta.env.BASE_URL || "/"; // "/palang-web/" | "/" | "./"

/** Pathname (site mode) -> route, with the deployment base stripped. */
function routeFromPath(pathname) {
  let p = pathname || "/";
  if (BASE !== "/" && BASE !== "./" && p.startsWith(BASE)) p = p.slice(BASE.length);
  return p.replace(/^\/+/, "").replace(/\/+$/, "");
}

function read() {
  if (typeof location === "undefined") return "";
  if (HASH_MODE) return (location.hash || "").replace(/^#\/?/, "");
  return routeFromPath(location.pathname);
}

let current = read();
const listeners = new Set();

// Legacy links: the site used hash routes before the clean-path switch. A
// visit to /#/install lands on the same page instead of silently going home.
if (!HASH_MODE && typeof location !== "undefined" && location.hash.startsWith("#/")) {
  current = location.hash.replace(/^#\/?/, "");
  history.replaceState(null, "", href(current));
}

/** The current route, e.g. "" (home) | "install" | "features/palang". */
export function route() {
  return current;
}

/** A link target for a route, under the deployment base. */
export function href(path) {
  const clean = String(path ?? "").replace(/^\/+/, "");
  if (HASH_MODE) return "#/" + clean;
  return BASE + clean;
}

/** Navigate. pushState by default; `replace` keeps the history clean when a
 *  URL is canonicalised (an unknown path, or a tool route on the site). */
export function goto(path, { replace = false } = {}) {
  if (HASH_MODE) {
    location.hash = href(path); // hashchange fires sync()
    return;
  }
  if (replace) history.replaceState(null, "", href(path));
  else history.pushState(null, "", href(path));
  sync();
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function sync() {
  const next = read();
  if (next === current) return;
  current = next;
  for (const fn of listeners) fn(current);
}

if (typeof window !== "undefined") {
  window.addEventListener(HASH_MODE ? "hashchange" : "popstate", sync);
}

// Same-origin links navigate WITHOUT a reload (one listener, no per-link
// wiring). Without this, every internal <a href> is a full document load,
// which also 301s to a trailing slash on a plain static server.
if (!HASH_MODE && typeof document !== "undefined") {
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target?.closest?.("a[href]");
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
    let url;
    try {
      url = new URL(a.getAttribute("href"), location.href);
    } catch {
      return;
    }
    if (url.origin !== location.origin) return;
    e.preventDefault();
    goto(routeFromPath(url.pathname));
  });
}
