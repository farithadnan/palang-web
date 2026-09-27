# Palang

A Malaysian-focused document prep app: convert photos to PDF, stamp a
**palang** purpose watermark, and merge PDFs.

**Fully offline by construction.** The engine ([pdf-lib]) is bundled into the
app: images are converted, palang markings are stamped, and PDFs are merged on
the device itself. Nothing is uploaded, nothing is stored on a server, and
there are no accounts.

[pdf-lib]: https://github.com/Hopding/pdf-lib

- Site: <https://farithadnan.github.io/palang-web/> (landing, install, privacy, feature pages)
- Source: <https://github.com/farithadnan/palang-web>
- Builds are published on the repository's releases page

The product ships as **Windows (EXE/MSI, Tauri)** and **Android (APK,
Capacitor)**. Both are packaged from the same tools bundle, so there is one
codebase and one engine. Built with **Svelte 5 (runes) + Vite**, plain custom
CSS with design tokens (light/dark themes), EN/BM interface, mobile-first.

## Development

No server is needed — the app works on its own. One codebase, two dev servers:

```bash
npm install
npm run dev        # the public site (landing, install, privacy, feature pages)
npm run dev:app    # the tools only — what the EXE and APK run (hash routes)
```

`npm run dev:app` is the fastest way to exercise the editor in a desktop
browser: it is the same Svelte/CSS/JS the installers bundle, so gestures and
layout behave as they do in the packaged app.

**Test the tools on a phone (same Wi-Fi):** run `npm run dev:app:host`, then
open the printed **Network** URL on the device (e.g.
`http://192.168.0.5:5173/`) — it lands on `#/convert`. The desktop equivalent
is `npm run dev:host` for the site. Allow Node through the firewall the first
time.

## Build & test

```bash
npm run test       # vitest (domain helpers, store, on-device engine)
npm run build      # the public site -> dist/ (zero a11y warnings expected)
npm run build:app  # the tools bundle the EXE and APK are packaged from
```

The version is read from `package.json` at build time (Vite `define`), so it is
always current — even in dev. The build chain writes `dist/version.json` (the
update-check manifest), copies pdf.js standard fonts, and prunes superseded
hashed assets while keeping one previous generation, so a cached `index.html`
degrades to the older bundle instead of a blank page.

## Build variants

One codebase, two build outputs.

| Variant | Dev | Build | Ships |
| --- | --- | --- | --- |
| Site | `npm run dev` | `npm run build` | The public site: landing, install, privacy and the per-feature pages |
| App | `npm run dev:app` | `npm run build:app` | The tools only, no site — what Tauri and Capacitor package into the EXE and APK |

The variant is the Vite mode (`vite build --mode app`); the site graph is
aliased to a stub in app builds, so it never enters that bundle. Site routes
are not served in app builds and vice versa: the tools are not published on the
web, and the site is not shipped inside the installers.

Runtime operator caps stay in `public/limits.json` (adjustable without a
rebuild).

Each variant has its own output directory, so they never overwrite each other:
the site builds to `dist/` (published), the app to `dist-app/` (packaged by
Tauri/Capacitor, and git-ignored — build output is never committed).

## Publishing (GitHub Pages)

The site is published by `.github/workflows/pages.yml` on every push to `main`
(and on demand): it runs the tests, builds the site, and deploys `dist/` to
GitHub Pages.

A project repo is served from `/<repo>/`, so the build roots its assets and
routes there by default (`SITE_BASE` in `vite.config.js`, currently
`/palang-web/`). Serving from a domain root (a custom domain, or a
user/organisation Pages repo) only needs `SITE_BASE=/` in that workflow — the
router reads Vite's `BASE_URL`, so no code changes.

Deep links work because the build pre-renders one `index.html` per route; see
Routing below.

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
(GitHub Pages, Cloudflare Pages, Vercel, or a plain nginx) for free.

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

`src` is grouped by concern:

- `src/lib/domain/` — pure helpers. `domain.js` (spec builders, page-size fit
  geometry, `pageDims`), `crop.js` (crop-viewport geometry). No DOM, no fetch;
  unit-tested.
- `src/lib/engine/` — the on-device engine. `local-engine.js` (pdf-lib:
  image→PDF, crop/enhance, rotated palang stamp, PDF merge), `pdf-preview.js`
  (pdf.js preview with a geometry-only fallback).
- `src/lib/state/` — module-run runes stores: `store.svelte.js` (the single
  owner of app state and side effects), `toast.svelte.js` (the one toast
  queue), `confirm.svelte.js` (the one confirmation service).
- `src/lib/i18n/` — `index.js` + `en.json` / `ms.json` (translations are JSON,
  so they are easy to edit; a test enforces matching keys).
- `src/lib/util/` — `config.js`, `links.js`, `pick.js`, `router.js`, `save.js`,
  `version.js`.
- `scripts/make-icon.mjs` — one description of the brand mark; writes the app
  icon and the favicon set.
- `src/components/ui/*` — generic presentational primitives (Icon, Toast,
  ConfirmDialog, Segmented, HelpTip, Skeleton, Topbar, fields, …).
- `src/components/gallery/*` — file/media UI: FileBasket, MediaGrid, FullView,
  CropMode.
- `src/components/palang/*` — PalangCanvas, PalangEditor.
- `src/components/tools/*` — the tool views (Convert, Palang, Merge, About,
  Settings).
- `src/components/site/*` — the public site pages and the shared top bar.
- `src/App.svelte` — routing + the app shell (tools only).

## Product behaviour worth knowing

- **Palang preview**: everything renders on the device with the same fit
  geometry the engine stamps, so what you see is what the output PDF produces.
- The marking **appears centred automatically** when the document loads. Drag it
  anywhere; the corner handle stretches it (exponential scaling, no cap); arrow
  keys nudge it (Shift = 10 pt); Delete removes it; Reset recentres it; rotation
  tilts the whole marking, matching the stamped output exactly (rotated bounding
  box, so a tilted band never clips).
- Photo crop is **visual and confirmable** and follows the Samsung-gallery
  gesture model: a corner handle resizes the window without moving the photo,
  releasing a handle focuses the crop window to fill the screen, one finger/mouse
  drag pans the photo, and pinch/wheel zooms (limited so the window never sees
  empty background). Save re-crops the thumbnail so you see the result.
- Merge needs **at least two PDFs** — one file is not a merge.
- Downloads use branded, timestamped names (e.g.
  `palang-stamped-2026-09-24-1430.pdf`), in local time.
- Every result is shown in-app (name, size, save again) so the file is findable.

## Desktop & mobile (EXE / APK)

Same codebase, same tools bundle, wrapped by [Tauri] and [Capacitor]. One
workflow, `.github/workflows/release.yml`, builds both platforms.

**Cut a release** — `npm version` bumps `package.json`, commits and tags; the
push triggers the release workflow:

```bash
npm version patch        # or minor / major
git push --follow-tags
```

`package.json` is the single source of version: `src-tauri/tauri.conf.json`
points at it (`"version": "../package.json"`), so there is nothing else to bump.

The workflow produces a **draft** GitHub release carrying:

- **Windows EXE/MSI** — built by tauri-action.
- **Android APK** — debug-signed (sideloadable). Play-Store signing needs a
  keystore — wire the signingConfig with your keystore secrets before publishing
  to the Play Console.

**Test a build without releasing** — run the *Release* workflow manually
(Actions → Release → Run workflow). It builds the same EXE/MSI and APK and
attaches them to the run; nothing is published.

The bundle uses relative asset paths, so the same `dist-app/` works on http
hosts and inside `tauri://`/`capacitor://`. Local Tauri development needs the
Rust toolchain; the APK always builds in CI (Android SDK + Java are set up
there).

[Tauri]: https://tauri.app
[Capacitor]: https://capacitorjs.com

## Roadmap

- Play-Store signing (the APK is debug-signed; wire a keystore first)
- iOS build (the native shell is mobile-ready; no CI target yet)

Native save/share is done: `src/lib/util/save.js` saves through the Tauri
Save-as dialog on Windows and the Android share sheet on device, falling back
to a browser download on the web.

## License

MIT
