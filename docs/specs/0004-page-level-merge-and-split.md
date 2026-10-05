# 0004 — Page-level merge & split/extract

Status: Implemented
Date: 2026-10-06

## Context

Merge could reorder **files** and preview the whole output, but it could not
touch individual pages: no dropping a stray blank page, no turning one scanned
page upright, no reordering within a file. There was also no way to extract a
range of pages — the opposite of merging, and a common request.

## Goals / Non-goals

**Goals**

- Per-page operations in Merge: remove (recoverably), rotate 90°, reorder.
- An Extract tool: choose one PDF, list ranges, export one PDF or one per range.
- One shared page-plan representation and one engine path.

**Non-goals**

- Editing page content, annotations, or bookmarks.
- Encrypted PDFs (handled as a clear failure — spec 0008).

## UX

- The Merge tab gets a **Merge / Extract** segmented toggle (one tab, two
  modes — no seventh tab).
- In the fullscreen page preview, a toolbar offers rotate left/right, move
  earlier/later, and **Remove page** (which flips to **Restore page**). A
  removed page stays visible, dimmed and labelled, so the action is
  recoverable; export simply filters it out.
- A rotated page is shown rotated (CSS transform), matching the output.
- Extract: choose a PDF, type ranges (`1-3, 5, 8-10`), then "Extract to one
  PDF" or "One PDF per range".

## State & data

- `app.merge.pages` entries gain `removed` and `rotationDeg`. The flat ordered
  list stays the single source of truth for output order.
- `removeMergePage(index)` toggles `removed`; `rotateMergePage(index, delta)`
  normalises `rotationDeg`; `moveMergePage(index, delta)` swaps two pages.
- `buildMergePreview` **preserves** per-page edits across a rebuild (e.g. a
  file reorder), keyed by `pdfId:page`, so page work is never silently undone.
- `app.split = { file, count, ranges }`; `setSplitFile` reads the page count
  lazily via `openPdf`; `setSplitRanges`; `generateSplit(onePerRange)`.

## Engine

`src/lib/engine/local-engine.js`

- New `buildPdf(plan)`: builds one PDF from an explicit plan of
  `{ key, name, bytes, page, rotate }`, grouping by `key` so each source is
  parsed once, copying pages in order, and applying per-page rotation with
  pdf-lib's `degrees`.
- Merge export now builds from the page plan (removed pages filtered,
  rotation applied) instead of copying whole files. Extract reuses `buildPdf`.

## Domain

`parseRangeGroups(text, max)` (pure, exported, unit-tested): parses
`"1-3, 5, 8-10"` into groups of 1-based pages, clamped to the document, one
group per comma part (so "one file per range" is possible).

## i18n

`pdfTools`, `splitTab`, `splitTitle`, `helpSplit`, `split*` (choose, pages,
ranges, extract, one-per-range, errors), `mgRemove`, `mgRestore`, `mgRemoved`,
`mgNoPages`, `msgFailSplit` (EN + BM).

## Tests

- `parseRangeGroups` (ranges, clamping, reversed ranges, invalid input).
- `buildPdf` order and per-page rotation.
- `removeMergePage` toggle, `rotateMergePage` normalisation, `moveMergePage`
  ordering + active index.

## Rollout & risks

- Risk: multiple PDFs written on native share one sheet at a time — each range
  is saved sequentially through the existing single-save path.
- Risk: `app.merge.pages` is rebuilt on file changes; the preserve-by-key step
  limits the blast radius to genuinely changed files.
- Result shows the first produced file; the rest are saved to the device.

## Open questions

- Should "one PDF per range" also surface every produced file in the result
  area? (Currently only the first is shown; all are saved.)
