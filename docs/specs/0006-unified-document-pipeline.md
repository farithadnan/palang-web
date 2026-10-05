# 0006 — Unified document pipeline

Status: In progress (stage 1 implemented)
Date: 2026-10-06

## Context

The three tools are three baskets with three slices of store state. Even with
handoffs (spec 0005), the user still manages separate lists: photos in Convert,
files in Palang, PDFs in Merge. The product's mental model — "prepare a
document" — is a single list of items that are converted, stamped and merged
into one output.

This is **Stage B**, the full unification. It should only start once the
bug fixes, spec 0002 and spec 0005 are in, because it depends on correct
per-file stamp scoping and a validated handoff UX.

## Goals / Non-goals

**Goals**

- One ordered list of items (images and PDFs together).
- Per-item operations: crop, rotate, enhance, and palang(s) for images; page
  operations for PDFs (from spec 0004).
- One export sheet: merge-all vs one-PDF-per-item, page size, stamp toggles,
  output filename.
- Keep the existing engine as the single pipeline (`processOffline` already
  accepts mixed images + PDFs and a `specs[]` per page).

**Non-goals**

- Changing the offline/privacy guarantees.
- Removing the per-tool deep links until parity and tests are proven.

## UX

A single **Prepare** view replaces the three tool tabs:

1. Add files (images and/or PDFs) into one list; reorder.
2. Tap an item to edit it in a full-screen editor (the existing crop / enhance
   / palang editors, reused).
3. Export: a sheet with output options and a filename field, then save.

The old tabs can remain during migration and be retired once the unified view
reaches parity.

## State & data

- Introduce `app.doc = { items: [{ id, kind, file, crop, rotationDeg, enhance,
  stamps }] }`, ordered; `kind` is `image | pdf`.
- Unify `addImages` / `addPdfs` / `pickPreviewFiles` into `addFiles`, and the
  preview builders into one path (the image + PDF-page metadata pipeline is
  already shared).
- Per-item `stamp` is the single palang spec from the current model
  (`app.stamp`, one per file).
- Keep `app.result` / `app.session` for the output and summary.

## Engine

- `processOffline` becomes the single entry point: images (compiled per item)
  + PDF pages (per-file specs) → one PDF or many.
- Add a page-plan input for PDF items (spec 0004) and an output-shape option
  (single vs per-item).

## i18n

A shared vocabulary for items and the export sheet, replacing the per-tool
strings over time; keep EN/BM key parity enforced by the existing test.

## Tests

- The unified store reducer (add/move/remove/update item).
- Output-shape selection (merge-all vs per-item) at the plan level.
- Regression: existing domain/engine/crop tests stay green through the move.

## Rollout & risks

- Highest-churn change in the roadmap. Do it behind the old tabs, migrate one
  capability at a time, and keep the golden geometry tests as the safety net.
- Risk: preview memory with mixed large PDFs and many images — preserve the
  one-page-at-a-time and object-URL lifecycle rules.
- Risk: the app grows a second way to do everything. Set an explicit cut-over
  point and delete the old views after it.

## Open questions

- Does the unified list replace the tabs, or nest them as edit modes?
- One output filename for the whole export, or derive per item?

## Implementation record

### Stage 1 — unified basket + export (committed `499719f`, implemented)

**State** (`src/lib/state/store.svelte.js`, `app.prepare`):

```js
prepare: {
  items: [],                 // ordered, mixed images + PDFs
  paper: "fit",              // A4 | A5 | Letter | fit
  stamp: false,              // stamp the purpose band (centred)
  stampText: "UNTUK KEGUNAAN BANK SAHAJA",
  merge: true,               // merge-all vs one PDF per item
  filename: "",              // output base name; localStamp() is appended
}
```

Item shapes:

```js
// image
{ id: "prep-N", kind: "image", file, url, originalUrl, baseUrl,
  crop: null, rotationDeg: 0, enhance: false, pageCount: 0 }
// pdf
{ id: "prep-N", kind: "pdf", file, url: null, originalUrl: null,
  baseUrl: null, crop: null, rotationDeg: 0, enhance: false, pageCount: N }
```

**Actions:** `addPrepareFiles(list)`, `removePrepareItem(id)`,
`movePrepareItem(id, delta)`, `setPrepare(patch)`, `generatePrepare()`.
Private: `readPreparePageCount(item)` (lazy `openPdf`), `prepareSetups(items)`
(splits into `{ images, pdfs }` engine setups), `isPdfFile(file)`.

**Export:** `generatePrepare()` builds `spec = defaultSpec()` with the stamp
text when `stamp` is on, then calls the existing `processOffline({ images,
pdfs, pageSize, spec })`. Merge mode → one PDF; otherwise one PDF per item.
Saved via `saveBlob`; result + a `recordOutput({ mode: "prepare" })` session
entry. The engine's `palangSpecFor(file, fallback)` applies the global stamp to
every page when an item carries no own spec.

**View** (`src/components/tools/PrepareView.svelte`): `ToolHeader` +
`FileBasket` (mixed accept, reorder) + `Field`/`Select` (paper) +
`Checkbox` (merge) + `Checkbox` + text (stamp) + `Field` (filename) +
`BusyButton` (`generatePrepare`) + `ResultBar`.

**Wiring:** `App.svelte` adds `{ id: "prepare", icon: "prepare" }` as the FIRST
tool and renders `<PrepareView />`; `Icon.svelte` gains `prepare` (layers);
`SessionView` gains a "Prepared" counter (`sessionPrepared`).

**i18n:** `prepare`, `prepareTitle`, `helpPrepare`, `prepareChoose`,
`preparePaper`, `prepareMerge`, `prepareMergeHint`, `prepareStamp`,
`prepareStampText`, `prepareFilename`, `prepareFilenameHint`, `prepareExport`,
`msgDonePrepare`, `msgFailPrepare`, `sessionPrepared` (EN + BM).

### Stage 2, increment 1 — image editing in Prepare (committed `b11e2bb`)

Images in `app.prepare.items` now carry the same shape as the Convert basket
(`originalUrl` / `baseUrl` / `url` / `crop` / `rotationDeg` / `enhance`) and are
rendered by the **same** private helpers (`rebuildBase`, `rebuildDisplay`,
`releaseDerived`, `refreshImage`, `rotatedDeg`) — one renderer, no duplicate
(SOC/DRY).

**Actions:** `rotatePrepareImage(id, delta)`, `cropPrepareImage(id, crop)`,
`togglePrepareEnhance(id)`, `revertPrepareImage(id)`; private `prepareImage(id)`.
`prepareSetups` passes each image's
`setting: { crop, rotation, enhance }` to the engine.

**View:** Prepare reuses `FullView` (rotate / enhance / delete) and `CropMode`
(`url = item.baseUrl`, restored `crop`), exactly like Convert.

**Tests:** `movePrepareItem`, `removePrepareItem`, `setPrepare`,
`revertPrepareImage`.

### Current state (handoff)

- **7 bottom tabs:** Prepare, Convert, Palang, Merge, Session, About, Settings.
  Prepare is first; the count drops as Stage 2 lands.
- Prepare can: add mixed files, reorder, remove, edit images
  (crop/rotate/enhance), choose paper size, stamp a **centred** purpose band,
  merge-all or one-per-item, name the file.
- Prepare **cannot yet**: place the stamp per item (drag/rotate/scale); do
  PDF page-level ops (rotate/remove/reorder); Extract page ranges. Those live
  in Palang and Merge until Stage 2 step 1/2.

## Stage 2 plan

### Step 1 — drag-placed stamp in Prepare (per item)

Goal: the stamp is placed per item like Palang, so Prepare reaches palang
parity and can eventually replace the Palang tab.

Recommended design:
1. Give each prepare item its own single spec: `item.stamp` (one per item,
   consistent with the one-palang-per-item model). Default `null`; a button
   adds/removes it.
2. Reuse the placement surface. Today `PalangEditor`/`PalangCanvas` read the
   Palang basket (`app.previewFiles` / `app.stamp`). Refactor them to take
   props (`url`, `widthPt`, `heightPt`, `spec`, `onChange`) — `PalangCanvas`
   already is prop-driven; `PalangEditor` is the coupled part. Extract a
   **host-agnostic** placement editor, then mount it from Prepare for the
   active item.
3. Export: `prepareSetups` attaches `item.stamp` as the file's `spec`
   (`palangSpecFor` uses `f.spec` when present, else the global fallback). For
   images, page-space stamping is enough; if preview parity demands it, reuse
   the `compileStampedImage` bake exactly as Convert/Palang do.
4. Preview: `PalangCanvas` already draws at the same fit geometry the engine
   stamps, so parity holds per item.

Open questions for Step 1:
- One stamp per item (recommended, matches the product) — confirm no
  multi-stamp is wanted.
- Does the stamp apply to every page of a PDF item, or a chosen subset?
  (Engine supports per-page; a `pages` control was deliberately removed in
  spec 0001/0007 — reintroduce only if truly wanted.)

### Step 2 — retire tabs (after parity)

Convert is already subsumed by Prepare (images → PDF, crop/rotate/enhance,
reorder, paper size), so **Convert can be retired** once the smoke test passes.

Palang can be retired after Step 1 (per-item placement).

Merge is **not** fully subsumed: Prepare has no PDF page-level ops and no
Extract yet. To retire Merge, either (a) bring page ops + Extract into Prepare
by reusing `app.merge.pages`-style state and `buildPdf`, or (b) keep Merge as
the PDF-specific tool. **Decision pending:** replace-with-short-overlap (my
recommendation for Convert/Palang; keep Merge until PDF ops land) vs keep all
as modes.

### Risks

- Preview memory with mixed large PDFs + many images: preserve one-page-at-a-time
  rendering and object-URL lifecycle (`releaseDerived`).
- Parity: image stamping must match the preview; prefer reusing the existing
  bake/canvas geometry rather than a new path.
- The store file is large and cross-cutting; keep editing it in small commits
  with tests green.

## Tests

- `movePrepareItem`, `removePrepareItem`, `setPrepare`, `revertPrepareImage`.
- Export reuses `processOffline`/`buildPdf`, covered by the engine tests.
- Add per-item stamp tests in Step 1.
