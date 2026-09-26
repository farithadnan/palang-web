# Palang

A Malaysian-focused document prep app: convert photos to PDF, stamp a
**palang** purpose watermark, and merge PDFs.

**Fully offline by construction.** The engine ([pdf-lib]) is bundled into the
app: images are converted, palang markings are stamped, and PDFs are merged on
the device itself. Nothing is uploaded, nothing is stored on a server, and
there are no accounts.

[pdf-lib]: https://github.com/Hopding/pdf-lib

- Site: <https://palang.oh-alam.my> (landing, install, privacy, feature pages)
- Source: <https://github.com/farithadnan/palang-web>
- Builds are published on the repository's releases page

The product ships as **Windows (EXE/MSI, Tauri)** and **Android (APK,
Capacitor)**. Both are packaged from the same tools bundle, so there is one
codebase and one engine. Built with **Svelte 5 (runes) + Vite**, plain custom
CSS with design tokens (light/dark themes), EN/BM interface, mobile-first.

## Development

No server is needed — the app works on its own.

```bash
npm install
npm run dev        # local editor with the in-browser engine
```

## Build & test

```bash
npm run test       # vitest (domain helpers, store, on-device engine)
npm run build      # the public site -> dist/ (zero a11y warnings expected)
npm run build:app  # the tools bundle the EXE and APK are packaged from
```

The build chain stamps `src/lib/version.js` + `dist/version.json` (the
update-check manifest), copies pdf.js standard fonts into `dist/`, and prunes
superseded hashed assets while keeping one previous generation, so a cached
`index.html` degrades to the older bundle instead of a blank page.

## Build variants

One codebase, two build outputs.

| Variant | Build | Ships |
| --- | --- | --- |
| Site | `npm run build` | The public site: landing, install, privacy and the per-feature pages |
| App | `npm run build:app` | The tools only, no site — what Tauri and Capacitor package into the EXE and APK |

The variant is the Vite mode (`vite build --mode app`); the site graph is
aliased to a stub in app builds, so it never enters that bundle. Site routes
are not served in app builds and vice versa: the tools are not published on the
web, and the site is not shipped inside the installers.

Runtime operator caps stay in `public/limits.json` (adjustable without a
rebuild).

PITFALL: both variants write to `dist/` — the last build wins. Always finish a
packaging pass with the variant you intend to deploy.

## Routing

The router picks its mode at build time (`src/lib/router.js`):

- **Site build** — clean paths (`/install`, `/privacy`, `/features/palang`).
  `scripts/prerender.mjs` writes one `index.html` per route after the build, so
  every static host serves them with **no rewrite rule** (a plain nginx,
  GitHub Pages, `python3 -m http.server`, a CDN) and a deep link never 404s.
  Same-origin `<a>` clicks are intercepted, so navigation never reloads.
- **App build** — hash routes (`#/convert`). The native shells have no server
  to rewrite paths, and the app reloads itself on an update, so a nested path
  would come back blank.

Components never build a URL by hand: `href(route)` / `goto(route)`.

## Typography

Inter throughout, body 16px at 1.6 line-height, headings 600 weight with
-0.02em tracking, buttons 14px pills (38px) with a 16px hero variant (46px).
The public site deliberately reads calmer than a marketing page; the app UI
keeps its own 44px touch-target controls.

## Hosting

The site build (`dist/`) is plain static files, so it runs on any static host
(Vercel, Cloudflare Pages, GitHub Pages, or a plain nginx) for free.

### Docker (single static image)

```bash
docker compose up -d        # http://localhost:8000
docker compose build        # rebuild after a change
```

The image builds the **site** and serves it with nginx. It only ships files, so
there is no backend, no build token, nothing to configure. Caching is split in
`nginx.conf`: hashed assets are immutable, `index.html`/`version.json`/
`limits.json` always revalidate, so deploys propagate within seconds.

Override the operator limits without rebuilding:

```bash
docker run -p 8000:80 -v ./limits.json:/usr/share/nginx/html/limits.json:ro palang-web
```

## Architecture

- `src/lib/domain.js` — pure helpers (spec builders, page-size fit geometry).
  No DOM, no fetch; unit-tested.
- `src/lib/local-engine.js` — the on-device engine (pdf-lib): image→PDF,
  crop/enhance, rotated palang stamp, PDF merge.
- `src/lib/pdf-preview.js` — pdf.js preview rendering with a geometry-only
  fallback; previews never leave the device.
- `src/lib/store.svelte.js` — module-run runes store: the single owner of app
  state and side effects (files, specs, theme, previews, generate, update check).
- `src/lib/toast.svelte.js` — the one toast queue; every outcome goes through it.
- `src/lib/i18n.js` — flat EN/BM dictionaries + `t()`; imports nothing from the
  store (cycle-free).
- `src/lib/links.js` — the project's outbound links, in one place.
- `src/lib/router.js` — clean paths on the site, hash routes in the app.
- `scripts/make-icon.mjs` — one description of the brand mark; writes the app
  icon and the favicon set (a 10% bar is sub-pixel at 16px, so favicons use a
  chunkier variant).
- `src/components/ui/*` — generic, presentational components (props in,
  callbacks out): FileBasket, MediaGrid, FullView, CropMode, Dropzone,
  PalangCanvas, Modal, Toast, ResultBar, Icon, fields.
- `src/components/site/*` — the public site pages (home, feature, install,
  privacy); the site root owns the shared top bar and footer.
- `src/components/*` — thin tool views (Convert, Palang, Merge, About, Settings).
- `src/App.svelte` — routing + the app shell (tools only).

## Product behaviour worth knowing

- **Palang preview**: everything renders on the device with the same fit
  geometry the engine stamps, so what you see is what the output PDF produces.
- The marking **appears centred automatically** when the document loads. Drag it
  anywhere; the corner handle stretches it (exponential scaling, no cap); arrow
  keys nudge it (Shift = 10 pt); Delete removes it; Reset recentres it; rotation
  tilts the whole marking, matching the stamped output exactly (rotated bounding
  box, so a tilted band never clips).
- Photo crop is **visual and confirmable**: save re-crops the thumbnail so you
  see the result, and the crop window is a real frame (corner handles resize it,
  the image pans and pinches underneath).
- Merge needs **at least two PDFs** — one file is not a merge.
- Downloads use branded, timestamped names (e.g. `palang-stamped-2026-09-24.pdf`).
- Every result is shown in-app (name, size, save again) so the file is findable.

## Desktop & mobile (EXE / APK)

Same codebase, same tools bundle, wrapped by [Tauri] and [Capacitor]. The build
runs in GitHub Actions — tag a release (`git tag v0.3.0 && git push --tags`)
and the workflows produce:

- **Windows EXE/MSI** — `Package EXE (Windows)` workflow (tauri-action), the
  EXE+MSI land on the GitHub release.
- **Android APK** — `Package APK (Android)` workflow, debug-signed APK as a
  build artifact (sideloadable). Play-Store signing needs a keystore — wire the
  signingConfig with your keystore secrets before publishing to the Play Console.

The bundle uses relative asset paths, so the same `dist/` works on http hosts
and inside `tauri://`/`capacitor://`. Local Tauri development needs the Rust
toolchain; the APK always builds in CI (Android SDK + Java are set up there).

[Tauri]: https://tauri.app
[Capacitor]: https://capacitorjs.com

## Roadmap

- Native file save/share on Android and Windows (blob downloads are not
  reliable inside the Android WebView)
- Play-Store signing

## License

MIT
