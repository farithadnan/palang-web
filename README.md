# Palang web app

A Malaysian-focused document prep tool: convert photos to PDF, stamp a
**palang** purpose watermark, and merge PDFs — all in your browser.

**Fully offline-by-construction.** The engine ([pdf-lib]) runs in the browser:
images are converted, palang markings are stamped, and PDFs are merged on the
device itself. Nothing is uploaded, nothing is stored on a server, and there
are no accounts. A built-in "Network activity" panel (footer) lists every
request the app makes, so the privacy claim can be checked rather than
trusted.

[pdf-lib]: https://github.com/Hopding/pdf-lib

- Live demo: <https://palang.oh-alam.my>
- Source: <https://github.com/farithadnan/palang-web>

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

## Build variants

One codebase, two build outputs — the landing page is NOT a separate project.

| Variant | Build | Ships |
| --- | --- | --- |
| Full site | `npm run build` | Landing page + app (the marketing site at palang.oh-alam.my) |
| App only | `VITE_MODE=app npm run build` | Tools only: users open the app and land straight in Convert. The landing page, entry modal and promo copy are tree-shaken out of the bundle — they do not ship at all. |

Use **app only** for Docker, APK, EXE and any third-party hosting where a promo
page would be noise. The full variant is only needed for the public marketing
site. CI builds and tests both.

The official instance URL and the build variant are configured through dotenv
files — the single config source (Vite's standard). `.env.production` holds
the committed defaults, `.env.local` holds YOUR overrides (gitignored), e.g. a
staging domain that should speak for itself:

```bash
# .env.local — personal / environment overrides (never committed)
VITE_HOST_URL=https://staging.example.com
```

Privacy wording follows the origin: equal to `VITE_HOST_URL` → "official
instance" copy, any other remote origin → third-party hosting, localhost /
`file:` → your own copy. Test all three locally with `?mode=hosted|third|self`
on any page. Runtime operator caps stay in `public/limits.json` (no rebuild).

## Hosting

The build output (`dist/`) is plain static files and processing happens in the
visitor's browser — so the app runs on any static host (Vercel, Cloudflare
Pages, GitHub Pages) for free. The live demo at palang.oh-alam.my is served
exactly this way.

### Docker (single static image)

```bash
docker compose up -d        # http://localhost:8000
docker compose build        # rebuild after a palang-web update
```

The image builds the **app-only** bundle and serves it with nginx. It only
ships files — all processing happens in the visitor's browser — so there is
no backend, no build token, nothing to configure. Caching is split in
`nginx.conf`: hashed assets are immutable, `index.html`/`version.json`/
`limits.json` always revalidate, so deploys propagate within seconds.

Override the operator limits without rebuilding:

```bash
docker run -p 8000:80 -v ./limits.json:/usr/share/nginx/html/limits.json:ro palang-web
```

The hosted app is deployment-aware: privacy copy switches between "hosted by
you / hosted by us" wording, and the Network activity panel is always
available so the no-upload claim stays checkable.

## Architecture

Clean separation, with a single engine:

**The engine.** Everything runs on the device: the PDF engine (pdf-lib)
executes in the browser — convert, stamp and merge never leave it. The same
bundle powers the website, the Docker image, the EXE and the APK: one engine,
identical output everywhere. Servers only ever ship files.

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

## Desktop & mobile (EXE / APK)

Same codebase, same app-only bundle, wrapped by [Tauri] (Windows/macOS/Linux
EXE) and [Capacitor] (Android APK). The build runs in GitHub Actions — tag a
release (`git tag v0.2.8 && git push --tags`) and the workflows produce:

- **Windows EXE/MSI** — `Package EXE (Windows)` workflow (tauri-action), the
  EXE+MSI land on the GitHub release.
- **Android APK** — `Package APK (Android)` workflow, debug-signed APK as a
  build artifact (sideloadable). Play-Store signing needs a keystore — wire
  `android/app/build.gradle` signingConfig with your keystore secrets before
  publishing to the Play Console.
- The bundle already uses relative asset paths, so the same `dist/` works on
  http hosts and inside `tauri://`/`capacitor://`.

Local Tauri development needs the Rust toolchain (`cargo tauri dev`). The APK
always builds in CI (Android SDK + Java are setup there).

[Tauri]: https://tauri.app
[Capacitor]: https://capacitorjs.com

## Roadmap

- PWA (installable, offline cache)
- Play-Store signing + hosted-downloads list on the landing page

## License

MIT
