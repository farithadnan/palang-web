# 0005 — Tool handoff

Status: Implemented
Date: 2026-10-06

## Context

Convert, Palang and Merge each keep their own basket (`app.images`,
`app.previewFiles` + `app.stamps`, `app.pdfs`). A user who converts photos then
wants to stamp the result must re-add the PDF they just produced. The three
tools feel like three apps when the natural flow is one document passing
through stages.

This is **Stage A** of unifying the tools: keep the three baskets, add explicit
handoffs between them. Stage B (one pipeline) is spec 0006.

## Goals / Non-goals

**Goals**

- Move the current result into the next tool without re-picking files.
- Offer the handoff at the moment it is relevant (right after generate).
- No change to the three baskets or the store's per-tool state.

**Non-goals**

- A shared file list (that is Stage B).
- Automatic chaining that does work the user did not ask for.

## UX

After a result is produced, `ResultBar` shows contextual actions in addition to
"Save again":

- Convert result → "Stamp this PDF" and "Merge with…".
- Merge result → "Stamp this PDF".
- Palang result → "Merge with…".

Each action routes to the target tool with the file seeded in its basket, then
shows a short toast confirming what was carried over.

## State & data

- `app.result` already holds `{ name, blob, size, mode }`.
- New store helper `sendToTool(target)`:
  - wraps `app.result.blob` as `new File([blob], name, { type: "application/pdf" })`;
  - target `palang` → `pickPreviewFiles([file])`; target `merge` → `addPdfs([file])`;
  - then `goto(target)`.
- No new persistent state.

## Engine

None (the blob is already the engine's output).

## i18n

`sendStamp`, `sendMerge`, `sentStamp`, `sentMerge`.

## Tests

- `sendToTool` seeds the correct basket and (for Palang) creates a palang list
  for the new file.
- Guard: no-op when there is no result.

## Rollout & risks

- Risk: re-running a handoff adds duplicates. Deduplicate by name like
  `pickPreviewFiles` already does.
- Risk: a user may not realise a new tool opened. Use `goto` (visible tab
  change) plus a toast, not a silent seed.

## Open questions

- Resolved: handoff is offered from the session summary too (`sendOutputTo`),
  so an **earlier** output can be stamped or merged without re-adding it.

## As implemented

- `sendResultTo(target)` seeds from the current result; `sendOutputTo(out,
  target)` seeds from a session output. Both wrap the blob as a `File` and call
  `pickPreviewFiles` (Palang) or `addPdfs` (Merge). The store only seeds; the
  view navigates with `goto` and confirms with a toast (SOC).
- `ResultBar` shows the relevant actions per result mode; `SessionView` shows
  stamp/merge actions per output row.
