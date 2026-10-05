# 0003 — Session summary

Status: Implemented
Date: 2026-10-06

## Context

When a user prepares several documents in one sitting they lose track of what
they produced. The app keeps only `app.result` — the file from the **last**
generate — so an earlier output can no longer be re-saved. There is no receipt
of what was done: photos converted, pages stamped, files merged.

## Goals / Non-goals

**Goals**

- Show a summary of the current session (counts + recent outputs).
- Let the user re-save any output from this session.
- Stay true to "nothing is stored": the summary lives in memory only and is
  gone when the app closes.

**Non-goals**

- Persisting history across launches (would be a privacy and storage change).
- A full undo/redo stack.

## UX

A new **Session** view, reachable from the sidebar/topbar:

- Summary tiles: photos converted, pages stamped, files merged, crops/rotations
  applied (the last two are optional; counts that never happened stay hidden).
- A list of outputs: timestamped branded name, size, and a re-save action.
- A "Clear session" action.
- Privacy note in the view: "Kept in memory only — cleared when you close the
  app."

`ResultBar` could also show a compact one-line receipt after each generate.

## State & data

- `app.session = { startedAt, counters, outputs: [] }`. Each `generate()`
  pushes `{ id, mode, name, blob, size, at, files, pages }`. Blobs are
  retained so re-save needs no recompute; cap the list (e.g. 10) and drop the
  oldest blob to bound memory.
- A small `recordOutput(...)` reducer, unit-testable in isolation.
- Optional lightweight counters for edits (crop/rotate/enhance) updated from
  the existing store actions.

## Engine

None.

## i18n

`sessionTitle`, `sessionEmpty`, `sessionConverted`, `sessionStamped`,
`sessionMerged`, `sessionOutputs`, `sessionClear`, `sessionPrivacy`,
`sessionResave`, `sessionAt`.

## Tests

- `recordOutput` appends, trims to the cap, and updates counters.
- Clearing resets the summary but not the current basket.

## Rollout & risks

- Risk: retaining up to N output blobs holds memory. Mitigate with the cap and
  by dropping the blob when the view no longer needs it.
- Risk: scope creep into persistence. Keep it explicitly in-memory.

## Open questions

- New sidebar item, or a panel inside About?
- Should edit counters be per-file (e.g. "3 photos edited") or only totals?
