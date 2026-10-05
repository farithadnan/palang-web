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

## As implemented (stage 1)

A new **Prepare** tool (`PrepareView`) provides ONE mixed basket of images
and PDFs (`app.prepare.items`) with a single export sheet:

- add (mixed) / reorder / remove, with PDF page counts read lazily;
- paper size, an optional purpose **stamp** (text, centred), **merge-all vs
  one PDF per item**, and an output **filename**;
- export reuses the existing engine path (`processOffline`), so there is no
  second rendering pipeline (DRY). `localStamp()` now backs every export's
  filename (one helper).

Deliberately deferred to **stage 2** (parity before the old tabs retire):

- per-item editing inside Prepare (crop / rotate / enhance for images; drag
  placement for the stamp) — these still live in the Convert/Palang editors;
- retiring the Convert / Palang / Merge tabs once Prepare reaches parity.

Transitional cost, called out honestly: the app now has **7 bottom tabs**
(Prepare, Convert, Palang, Merge, Session, About, Settings). Prepare is first
because it is the unified entry; the tab count drops as stages land.

## Stage 2 progress

- **Done (increment 1):** images are edited in Prepare — crop / rotate /
  enhance reuse the ONE preview renderer (`rebuildBase`/`rebuildDisplay`)
  shared with Convert, and the export passes per-image rotation, crop and
  enhance to the engine. Prepare reuses `FullView` and `CropMode`.
- **Remaining:** drag placement of the purpose band in Prepare, then retiring
  the Convert / Palang / Merge tabs once placement reaches parity.

## Tests

- `movePrepareItem`, `removePrepareItem`, `setPrepare` (store).
- The export itself reuses `processOffline`/`buildPdf`, covered by the engine
  tests.
