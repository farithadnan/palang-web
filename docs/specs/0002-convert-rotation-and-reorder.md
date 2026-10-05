# 0002 — Convert rotation & reorder

Status: Implemented
Date: 2026-10-06

## Context

Convert turns photos into PDF pages, but each photo became a page **in the
order it was picked**, and a sideways photo (a scanned form, a landscape
photo) could not be turned upright. EXIF orientation is baked automatically by
the engine, but that only corrects metadata, not a photo the user wants
rotated. Page order matters for document prep — a bank submission's pages must
be in sequence.

## Goals / Non-goals

**Goals**

- Rotate any Convert photo in 90° steps (left/right).
- Reorder photos before conversion (and the Palang basket, whose list order is
  the output's page order).
- Keep the preview honest: the thumbnail is the rotated/cropped result the PDF
  will contain.

**Non-goals**

- Free-angle rotation / straighten, flip, or mirror.
- Per-image page size (that stays a session-wide setting).

## UX

- `FullView` gains **rotate left / rotate right** buttons beside crop and
  enhance.
- Reorder: in **selection mode**, selecting a single tile reveals move
  earlier / move later buttons in the selection bar. This is implemented once
  in the shared `MediaGrid`, so both Convert and the Palang basket get it.
- The first item is page 1.

## State & data

Each image now carries three URLs, so rotation and crop compose without drift:

- `originalUrl` — the raw file (also the rotation source);
- `baseUrl` — the **rotated, uncropped** preview;
- `url` — what the app shows: `crop(baseUrl)` when a crop is set, else
  `baseUrl`.

`im.rotationDeg` (0/90/180/270) is normalised by `rotatedDeg`. A single
renderer owns the derivation: `rebuildBase` (rotate) then `rebuildDisplay`
(crop), with `releaseDerived` revoking only derived blob URLs. Functions:
`rotateImage(id, delta)`, `moveImage(id, delta)`, and `movePreviewFile(index,
delta)` for the Palang basket (swaps the file **and** its index-aligned spec,
then rebuilds the preview).

`CropMode` now receives `baseUrl` (the uncropped rotated image), so crop
fractions are expressed in rotated space and match the engine. This also fixes
a latent double-crop when re-opening crop on an already-cropped photo.

## Engine

`src/lib/engine/local-engine.js`

- `processImage(bytes, mime, setting)` normalises through one helper,
  `uprightCanvas(img, rotation)`: the browser's decode applies EXIF
  orientation, then the user's rotation is baked in, and only then is the crop
  rectangle applied. Enhance runs last. Order is rotate → crop → enhance, in
  the preview and the output alike.
- Because rotation is baked before embedding, `pageDims("fit", …)` and the
  fitted rect follow from the embedded dimensions — no separate swap logic.
- `setting.rotation` is threaded from `offlineBlob`.

## i18n

`viewRotateLeft`, `viewRotateRight` (EN + BM). Reused `olUp`/`olDown`.

## Tests

- `moveImage` ordering and bounds (store).
- Rotation itself is canvas work and is exercised manually; the geometry
  helpers (`pageDims`, `fittedPageSize`) remain covered by the existing tests.

## Rollout & risks

- Risk: memory. Three URLs per image multiply object-URL churn; `releaseDerived`
  revokes derived URLs on every rebuild, and `removeImage`/`removeImages`/
  `revertImage`/`replaceImage` release them consistently.
- Risk: reorder must keep `previewFiles` and `stamp` aligned; the swap does
  both together.
- Reordering the Palang basket rebuilds the preview, so any in-flight page
  render is superseded (the existing sequence guard handles it).

## Open questions

- Should rotation also be offered from the gallery selection bar, or is the
  full-screen viewer enough? (Current: viewer only.)
