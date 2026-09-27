/* App version + build time, injected by Vite (`define` in vite.config.js) from
 * package.json — so this is always correct, including in `npm run dev`, with no
 * generated file to go stale. dist/version.json (scripts/write-manifest.mjs) is
 * the published manifest the update check polls. */
export const APP_VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";
export const APP_BUILT_AT = typeof __APP_BUILT_AT__ !== "undefined" ? __APP_BUILT_AT__ : "";
export const APP_CHANNEL = "stable";
