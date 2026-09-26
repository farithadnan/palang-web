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
  return {
    // The site is served from a domain root and pre-renders one index.html per
    // route, so its assets must be root-absolute. The native shells (tauri://,
    // capacitor://) have no root to be absolute against, so the app build uses
    // relative URLs — /assets/ would 404 there.
    base: APP_ONLY ? "./" : "/",
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
    build: { outDir: "dist", emptyOutDir: false },
  };
});
