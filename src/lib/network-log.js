/**
 * Live network recorder: wraps fetch/XHR so the app can SHOW the user every
 * request it makes. The privacy proof panel lists these — during document
 * processing the list stays empty (nothing leaves the device). Installed
 * once from the app shell with a push callback (no circular imports).
 */
export function installNetworkLog(onEntry) {
  if (typeof window === "undefined" || window.__palangNetInstalled) return;
  window.__palangNetInstalled = true;

  const fetch = window.fetch.bind(window);
  window.fetch = (...args) => {
    const url = String(args[0]);
    const method = (args[1] && args[1].method) || "GET";
    const t = performance.now();
    return fetch(...args).then(
      (res) => {
        onEntry({ method, url, status: res.status, ms: Math.round(performance.now() - t) });
        return res;
      },
      (err) => {
        onEntry({ method, url, status: 0, ms: Math.round(performance.now() - t), error: true });
        throw err;
      }
    );
  };

  const proto = window.XMLHttpRequest?.prototype;
  if (proto) {
    const open = proto.open;
    const send = proto.send;
    proto.open = function openHook(method, url) {
      this.__net = { method, url, t: performance.now() };
      return open.apply(this, arguments);
    };
    proto.send = function sendHook() {
      this.addEventListener?.("loadend", () => {
        onEntry({
          method: this.__net?.method || "?",
          url: this.__net?.url || "?",
          status: this.status,
          ms: Math.round(performance.now() - (this.__net?.t || performance.now())),
        });
      });
      return send.apply(this, arguments);
    };
  }
}
