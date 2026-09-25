# Palang web app

The web client for [palang](https://github.com/farithadnan/palang) — a
Malaysian-focused document prep tool: convert photos to PDF, stamp a **palang**
purpose watermark, and merge PDFs.

**Fully offline-by-construction.** The engine ([pdf-lib]) runs in the browser:
images are converted, palang markings are stamped, and PDFs are merged on the
device itself. Nothing is uploaded, nothing is stored on a server, and there
are no accounts. A built-in "Network activity" panel (footer) lists every
request the app makes, so the privacy claim can be checked rather than
trusted.

[pdf-lib]: https://github.com/Hopding/pdf-lib

- Live demo: <https://palang.oh-alam.my>
- Reference engine (Python, REST contract): <https://github.com/farithadnan/palang>

Built with **Svelte 5 (runes) + Vite**, plain custom CSS with design tokens
(light/dark themes), EN/BM interface, mobile-first.

## Development

No server is needed — the app works on its own.

```bash
npm install
npm run dev        # local editor with the in-browser engine
```

## Build & test

```bash
npm run test       # vitest (domain helpers, store, on-device engine)
npm run build      # production build -> dist/ (zero a11y warnings expected)
```

The build chain stamps `src/lib/version.js` + `public/version.json`
(update-check manifest), copies pdf.js standard fonts into `dist/`, and writes
the PWA manifest.

## Hosting

The build output (`dist/`) is plain static files and processing happens in the
visitor's browser — so the app runs on any static host (Vercel, Cloudflare
Pages, GitHub Pages) for free. The live demo is served by the reference
engine's server (the core repo can serve `dist/` via the `PALANG_WEB_DIST`
env var), but that is one option, not a requirement.

## Architecture

Clean separation, mirroring the palang core's layering:

- `src/lib/domain.js` — pure helpers (spec builders, page-size fit geometry).
  No DOM, no fetch; unit-tested.
- `src/lib/local-engine.js` — the on-device engine (pdf-lib): image→PDF,
  crop/enhance, rotated palang stamp, PDF merge. One codebase for web/PWA/APK/EXE.
- `src/lib/pdf-preview.js` — pdf.js preview rendering with a geometry-only
  fallback; previews never leave the device.
- `src/lib/network-log.js` — wraps fetch/XHR so the app can show every request.
- `src/lib/i18n.js` — EN/BM dictionaries + deployment-mode detection
  (developer-hosted vs self-hosted copy, for honest claims).
- `src/lib/store.svelte.js` — module-run runes store: the single owner of app
  state and side effects (files, spec, consent, theme, previews, generate).
- `src/components/ui/*` — generic, presentational components (props in, callbacks
  out): FileBasket, Dropzone, CropBox, PalangCanvas, Modal, Icon, fields.
- `src/components/*` — thin view containers (Convert, Palang, Merge, Landing).
- `src/App.svelte` — shell: topbar/sidebar/tabs, hash routing, toast, footer.

## Product behaviour worth knowing

- **Palang preview**: everything renders in the browser with the same fit
  geometry the engine stamps, so what you see is what the output PDF produces.
- The marking **appears centred automatically** when the document loads. Drag it
  anywhere; the corner handle stretches it (exponential scaling, no cap); arrow
  keys nudge it (Shift = 10 pt); Delete removes it; Reset recentres it; rotation
  tilts the whole marking, matching the stamped output exactly (rotated bounding
  box, so a tilted band never clips).
- Photo crop is **visual and confirmable**: Apply & save re-crops the thumbnail
  so you see the result; Undo restores the original.
- Consent/disclaimer gate before first use (opens on page access), PDPA-aware
  privacy copy, and the Network activity panel for self-verification.
- Downloads use branded, timestamped names (e.g. `palang-stamped-2026-09-24.pdf`).

## Roadmap

- PWA (installable, offline cache)
- Android APK (Capacitor) and desktop EXE (Tauri) — same codebase
- Hosted-downloads list on the landing page

## License

MIT
