import "@fontsource-variable/inter";
import "./app.css";
import { mount } from "svelte";
import App from "./App.svelte";

/**
 * A blank window is the worst possible failure: the user cannot tell whether the
 * app is loading, broken, or empty. If mounting throws (a missing chunk, a
 * WebView refusing a module script), show the reason on screen instead.
 */
function showBootError(err) {
  const detail = (err && (err.stack || err.message)) || String(err);
  const el = document.getElementById("app");
  if (!el) return;
  el.innerHTML =
    '<div style="font:14px/1.6 system-ui;padding:2rem 1.25rem;color:#181c22">' +
    '<h1 style="font-size:1.1rem;margin:0 0 .6rem">Palang could not start</h1>' +
    '<p style="margin:0 0 .8rem;color:#5b6472">Please reload. If it keeps failing, send this text:</p>' +
    '<pre style="white-space:pre-wrap;word-break:break-word;background:#f2f4f8;border:1px solid #d8dde5;' +
    'border-radius:8px;padding:.75rem;font-size:12px;margin:0">' +
    detail.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]) +
    "</pre></div>";
}

try {
  mount(App, { target: document.getElementById("app") });
} catch (err) {
  console.error("boot failed:", err);
  showBootError(err);
}

// A module that fails to LOAD (rather than throw) never reaches the catch above.
window.addEventListener("error", (e) => {
  if (document.getElementById("app")?.childElementCount) return;
  showBootError(e.error || e.message || "unknown error");
});
window.addEventListener("unhandledrejection", (e) => {
  if (document.getElementById("app")?.childElementCount) return;
  showBootError(e.reason || "unknown rejection");
});
