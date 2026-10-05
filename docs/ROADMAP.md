# Roadmap & status

**Start here after a break, or in a new session.** This is the handoff: what is
done, what is next, and where things live. Detailed design is in
[`specs/`](./specs); decisions are in [`adr/`](./adr).

_Last updated: 2026-10-06._

## How changes ship

1. Commit with [Conventional Commits] (`feat:`, `fix:`, `refactor:`, `docs:`).
2. Push to `main` → GitHub Actions runs **CI** (tests + builds), **Pages**
   (site deploy) and **Release**.
3. [release-please] keeps a version PR open. **Merging that PR is the only
   manual step** — it tags the release and the same workflow builds and
   attaches the Windows EXE/MSI and the Android APK.

Nothing else bumps a version; `package.json` is the source of truth.

## Feature specs

| Spec | Title | Status |
| --- | --- | --- |
| [0001](./specs/0001-per-file-palang-stamp-scoping.md) | Per-file palang stamp scoping | Implemented |
| [0002](./specs/0002-convert-rotation-and-reorder.md) | Convert rotation & reorder | Implemented |
| [0003](./specs/0003-session-summary.md) | Session summary | Implemented |
| [0004](./specs/0004-page-level-merge-and-split.md) | Page-level merge & split/extract | Implemented |
| [0005](./specs/0005-tool-handoff.md) | Tool handoff | Implemented |
| [0006](./specs/0006-unified-document-pipeline.md) | Unified document pipeline | **In progress (stage 1 + stage 2.1)** |
| [0007](./specs/0007-remove-unused-api-parity-layer.md) | Remove the unused API-parity layer | Implemented |
| [0008](./specs/0008-pdf-errors-and-overflow.md) | Explain PDF failures & overflow | Implemented |

## Shipped (recent)

- `499719f` — **feat(app):** unified Prepare (stage 1), session summary,
  convert rotate/reorder, merge page ops + Extract, PDF error messages,
  palang per-file scoping fix, parity-layer removal, copy fix, `docs/`.
- `b11e2bb` — **feat(prepare):** edit images in the unified basket
  (crop / rotate / enhance) — stage 2.1.
- `da4a0a8` — **docs(prepare):** spec 0006 progress.

`npm run test` → 79 passing; `npm run build` and `npm run build:app` clean.

## Next up

**0006 stage 2 step 1 — drag-placed stamp in Prepare (per item).**
See the "Stage 2 plan" section of [spec 0006](./specs/0006-unified-document-pipeline.md)
for the recommended design (per-item `item.stamp`; extract a host-agnostic
placement editor from `PalangEditor`; attach `item.stamp` per file in
`prepareSetups`). It is the prerequisite for retiring the Palang tab.

**0006 stage 2 step 2 — retire tabs.**
Convert is already subsumed by Prepare. Palang follows step 1. Merge still owns
PDF page-level ops + Extract, so retiring it needs those folded into Prepare
(or keeping Merge). **Decision pending:** replace-with-short-overlap
(recommended) vs keep as edit modes.

## Known caveats

- **7 bottom tabs** during migration (Prepare, Convert, Palang, Merge, Session,
  About, Settings). Watch the density on a narrow phone.
- **No component/e2e tests.** Only pure functions and the store are unit-tested;
  the gesture-heavy paths (palang canvas, crop, rotate-then-crop) are validated
  manually. Smoke-test in `npm run dev:app` before cutting a release.
- **Extract on Android** writes one file at a time through the share sheet when
  "one PDF per range" produces several.

## Where things live

- `src/lib/domain/` — pure helpers (`domain.js`: `palangLabel`, `parseRangeGroups`,
  page geometry; `crop.js`).
- `src/lib/engine/` — `local-engine.js` (pdf-lib: `processOffline`, `buildPdf`,
  `compileStampedImage`, `palangSpecFor`, `PdfLoadError`; `pdf-preview.js`).
- `src/lib/state/store.svelte.js` — the single owner of app state; sections for
  images, merge, palang, session, generate, extract, prepare.
- `src/lib/i18n/` — `en.json` / `ms.json` (key parity enforced by a test).
- `src/components/tools/` — the views (Prepare, Convert, Palang, Merge,
  Session, About, Settings; `SplitPanel` lives inside Merge).
- `tests/` — vitest: domain, engine, store, crop, i18n.

[Conventional Commits]: https://www.conventionalcommits.org/
[release-please]: https://github.com/googleapis/release-please
