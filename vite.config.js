import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const APP_ONLY = process.env.VITE_MODE === "app";

// Variant switch: one codebase, two build outputs.
//   VITE_MODE=app      -> palang-web ships the TOOLS ONLY (convert/palang/merge):
//                         no landing page, no entry modal, straight into the app.
//                         Used by Docker, APK, EXE and third-party hosting.
//   (default, unset)   -> the full marketing site: landing + app (palang.oh-alam.my).
// The alias makes the exclusion REAL: in app mode the Landing component and its
// whole graph (SampleDemo, landing copy, entry modal) are tree-shaken out of the
// bundle. In full mode the stub is what gets dropped, so nothing changes.
export default defineConfig({
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
  build: { outDir: "dist" },
});
