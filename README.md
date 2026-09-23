# Palang web app

The web client for [palang](https://github.com/farithadnan/palang) — a Malaysian-focused
document prep tool: convert photos to PDF, stamp a **palang** purpose watermark
(lines, solid bar, or see-through region), and merge PDFs.

Built with **Svelte 5 (runes) + Vite + Tailwind-free custom CSS** (plain CSS with
design tokens, light/dark themes via `[data-theme="dark"]`). The UI is deliberately
plain-language and mobile-first: no jargon, no popups, small enough to feel calm.

Live at <https://palang.oh-alam.my> (served by the palang API server from the built
`dist/` via the `PALANG_WEB_DIST` env var).

---

## Development

```bash
npm install
npm run dev        # Vite dev server, proxies /api -> http://127.0.0.1:8000
```

The API server must be running: `uv run palang-server` in the palang core repo.

## Build & test

```bash
npm run test       # vitest (domain helpers)
npm run build      # Vite production build -> dist/ (zero a11y warnings expected)
```

## Pointing the API server at the dist

```bash
PALANG_WEB_DIST=/path/to/palang-web/dist uv run palang-server
```

The server serves the SPA at `GET /`; without `PALANG_WEB_DIST` it falls back to
palang's legacy built-in page (kept only as a self-host fallback, not developed).

---

## Architecture

Clean separation, mirroring the palang core's layering:

- `src/lib/domain.js` — pure helpers (spec builders, page-size fit geometry,
  tokens). No DOM, no fetch; unit-tested.
- `src/lib/api.js` — the only module that talks to the API (`/api/process`,
  `/api/preview`). No UI.
- `src/lib/store.svelte.js` — module-run runes store: the single owner of app
  state and side effects (files, spec, consent, theme, previews, generate).
- `src/components/ui/*` — generic, presentational components (props in, callbacks
  out): FileBasket (shared upload gallery for Convert and Palang), Dropzone,
  CropBox, PalangCanvas (drag/resize/zoom/keys), Modal, Icon, fields.
- `src/components/*` — thin view containers (Convert, Palang, Merge, Privacy).
- `src/App.svelte` — shell: header, sidebar/tabs, hash routing, toast, footer.

## Product behaviour worth knowing

- **Palang preview**: uploading only images previews them instantly in the browser
  (no server round-trip); the page geometry is computed with the same fit formula
  the server uses, so what you see is what the stamped PDF produces. PDFs are
  rendered server-side as 1x JPEGs via `/api/preview`.
- The marking is **added by tapping the page**, then dragged/resized with handles;
  arrow keys nudge it (Shift = 10 pt), Delete removes it, Esc deselects. Height and
  width are also editable as numbers and stay in sync with the canvas.
- Photo crop is **visual and confirmable**: Apply & save re-crops the thumbnail so
  you see the result; Undo restores the original. Enhance preview is approximate —
  the real enhance runs server-side.
- Consent gate before first upload, per-request file deletion server-side, and a
  plain-language privacy page link to the versioned [PRIVACY.md](https://github.com/farithadnan/palang/blob/main/PRIVACY.md).

## Roadmap

- Lazy page-at-a-time PDF preview (page 1 first, then the rest).
- Optional fully client-side processing mode.
- Tauri/Capacitor packaging for desktop (EXE) and Android (APK) over the same API.

## License

MIT
