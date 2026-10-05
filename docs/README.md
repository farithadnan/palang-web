# Palang docs

Product and engineering docs live here. The top-level [`README.md`](../README.md)
stays the product guide (what the app is, how it builds, how releases work);
this folder holds the **specs** (what a feature should do before code is
written) and **ADRs** (decisions that outlive a single feature).

- [`adr/`](./adr) — Architecture Decision Records, one file per decision.
- [`specs/`](./specs) — feature specs. Each carries a **Status** line:
  `Draft` (proposed), `Accepted` (agreed, not built), `In progress` (partly
  built), `Implemented`, or `Superseded`.

## Spec template

```markdown
# NNNN — Title
Status: Draft | Accepted | Implemented | Superseded
Date: YYYY-MM-DD

## Context
Why this exists; the problem in the product today.

## Goals / Non-goals
What this changes, and what it deliberately leaves out.

## UX
The user-visible flow and controls.

## State & data
Store shape and side effects.

## Engine
`domain/` / `engine/` changes.

## i18n
New keys (EN + BM).

## Tests
What the unit tests must pin down.

## Rollout & risks
Sequencing, migration, what could break.

## Open questions
Undecided points.
```

## Index

| Spec | Status |
| --- | --- |
| [0001 — Per-file palang stamp scoping](./specs/0001-per-file-palang-stamp-scoping.md) | Implemented |
| [0002 — Convert rotation & reorder](./specs/0002-convert-rotation-and-reorder.md) | Implemented |
| [0003 — Session summary](./specs/0003-session-summary.md) | Implemented |
| [0004 — Page-level merge & split/extract](./specs/0004-page-level-merge-and-split.md) | Implemented |
| [0005 — Tool handoff](./specs/0005-tool-handoff.md) | Implemented |
| [0006 — Unified document pipeline](./specs/0006-unified-document-pipeline.md) | In progress (stage 1) |
| [0007 — Remove the unused API-parity layer](./specs/0007-remove-unused-api-parity-layer.md) | Implemented |
| [0008 — Explain PDF failures & overflow](./specs/0008-pdf-errors-and-overflow.md) | Implemented |

| ADR | Status |
| --- | --- |
| [0001 — Offline by construction](./adr/0001-offline-by-construction.md) | Accepted |
