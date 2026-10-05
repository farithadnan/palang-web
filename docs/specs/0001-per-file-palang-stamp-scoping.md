# 0001 — Per-file palang stamp scoping

Status: Implemented
Date: 2026-10-06

## Context

The product is deliberately **one palang per file** — a single purpose band
placed on an image, or applied to every page of a PDF. There is no
multi-palang / multi-watermark feature, and none is planned.

The local engine did not respect that "one per file" boundary when several
stamped files were in one basket. `offlineBlob()` collected the armed specs
into a single list and passed it to `processOffline()`, which drew **every**
armed spec on **every** PDF page. So stamping two PDFs with different bands put
both bands on both documents.

This is a correctness bug, not a feature request. The fix keeps one palang per
file and simply stops a file's band from leaking onto another file's pages.

## Goals / Non-goals

**Goals**

- Each file's own palang appears only on that file's pages.
- Preview and output stay consistent with "one marking per file".
- Make the code model the domain exactly: **one singular `spec` per file**,
  so a second stamp is unrepresentable.
- Images keep the existing "second temp" bake (a compiled photo is never
  stamped again).

**Non-goals**

- Multiple palangs per file or per page. That idea is explicitly **scrapped**;
  the model stays one spec per file (`app.stamp[i]`).
- Per-page targeting (the `pages` selector is not part of the model).
- Region mode and solid/see-through styles (separate, unused parity surface).

## UX

No user-visible change. Two PDFs, each with its own marking, simply produce
the expected output: band A on file A's pages, band B on file B's pages.

## State & data

The store is unchanged in shape — `app.stamp` is a single spec per file,
aligned with `app.stamp[i]`. Only how `offlineBlob()` associates a spec with a
file changes: each setup entry carries that file's own `spec` (or `null`).

## Engine

`src/lib/engine/local-engine.js`

- `palangSpecFor(file, fallback)` (pure, exported) returns the one armed spec
  that applies to a file: the file's own `spec`, or the fallback when it
  carries none — never another file's spec. An explicit `null` means
  "unstamped" and never borrows the fallback.
- `processOffline()` associates each copied PDF page (and each uncompiled image
  page) with its own file's single spec. There is no per-page list.
- `compileStampedImage(input, pageSize, spec)` bakes one spec, not an array.
- Compiled ("second temp") image pages continue to be skipped.

## i18n

None.

## Tests

- `tests/local-engine.test.js` gains `palangSpecFor` cases: a file uses its own
  spec, never another file's or the fallback; the fallback applies only when a
  file carries no spec; an explicit `null` means unstamped; unarmed specs are
  dropped.

## Cleanup (same change)

- The old document-wide multi-stamp model — `app.specs`, `app.specIndex`,
  `setSpecIndex`, `addSpec`, `removeSpecAt`, `resetSpec` — was dead code
  (exported and tested, imported by no component) and belonged to the scrapped
  multi-palang idea. It has been removed, along with its tests.
- The unused `pages` / `pagesCustom` selector was removed: `pagesValue()`, the
  two `defaultSpec` fields, and the `pages` key in `buildPalangSpec`. It was
  computed and then ignored by the engine, and a page selector only makes sense
  for a per-page capability the product does not have. With one band applied to
  every page of a file, there is nothing to select.

## Rollout & risks

- Contained to the engine, the palang store path, and the domain helper.
- Risk: a basket where a PDF has no palang must stay unstamped. Each setup entry
  carries an explicit `spec` (possibly `null`), and `palangSpecFor` treats an
  explicit `null` as "unstamped" — it never borrows another file's spec.
- The global `spec` fallback remains for callers that pass no per-file spec
  (mainly tests).

## Open questions

- None. The singular model was chosen deliberately: model the domain exactly
  rather than carry an array of one.
