import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

// Variant switch — one codebase, two build outputs. The variant IS the Vite
// mode (industrial standard: vite build => .env.production, --mode app =>
// .env.app), so the config surface is dotenv files, no inline flags:
//   npm run build            mode "production" : landing page + app
//   npm run build:app        mode "app"        : tools only — the landing
//                             page, entry modal and promo copy are tree-shaken
//                             out entirely (Docker / APK / EXE / private
//                             hosting). Users land straight in Convert.
export default defineConfig(({ mode }) => {
  const APP_ONLY = mode === "app";
  return {
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
    server: {
      proxy: { "/api": "http://127.0.0.1:8000" },
    },
    build: { outDir: "dist", emptyOutDir: false },
  };
});
