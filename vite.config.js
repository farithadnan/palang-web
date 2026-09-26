import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

// Variant switch — one codebase, two build outputs. The variant IS the Vite
// mode (industrial standard: vite build => .env.production, --mode app =>
// .env.app), so the config surface is dotenv files, no inline flags:
//   npm run build            mode "production" : the public site
//   npm run build:app        mode "app"        : the tools only — the whole
//                             site graph is tree-shaken out; this is the bundle
//                             Tauri and Capacitor package into the EXE/APK.
export default defineConfig(({ mode }) => {
  const APP_ONLY = mode === "app";
  // GitHub Pages serves a project repo from /<repo>/, so the site's assets and
  // routes are rooted there. Set SITE_BASE=/ when a custom domain (or a
  // user/organisation Pages repo) serves it from the domain root instead.
  const SITE_BASE = process.env.SITE_BASE || "/palang-web/";
  return {
    // The site pre-renders one index.html per route, so its assets must be
    // rooted (under SITE_BASE on Pages). The native shells (tauri://,
    // capacitor://) have no root to be absolute against, so the app build uses
    // relative URLs — /assets/ would 404 there.
    base: APP_ONLY ? "./" : SITE_BASE,
    plugins: [svelte(), tailwindcss()],
    resolve: {
      alias: {
        $landing: fileURLToPath(
          new URL(
            APP_ONLY ? "./src/components/StubLanding.svelte" : "./src/components/Landing.svelte",
            import.meta.url,
          ),
        ),
      },
    },
    // manifest: prune-assets.mjs needs the authoritative file list
    build: { outDir: APP_ONLY ? "dist-app" : "dist", emptyOutDir: false, manifest: true },
  };
});
