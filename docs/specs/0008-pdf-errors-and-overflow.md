# 0008 — Explain PDF failures (locked / unreadable) and page overflow

Status: Implemented
Date: 2026-10-06

## Context

When a PDF could not be processed, the user got a generic toast:

- `PDFDocument.load()` throws on an **encrypted / password-protected** PDF, so
  merge and stamp failed with "Convert failed · …" and no actionable reason.
- A malformed PDF failed the same way.
- Exceeding the page cap (`LIMITS.pdfPages`) dropped pages with a message that
  did not name the file.

Offline apps fail silently or cryptically by nature; the fix is to say exactly
what happened and to which file.

## Goals / Non-goals

**Goals**

- Name the file and the reason for a PDF load failure.
- Report page overflow with the offending file.
- Keep messages localised (EN + BM).

**Non-goals**

- Opening encrypted PDFs (requires a password prompt and pdf-lib decryption —
  a feature, not a fix).
- Recovering from corrupt PDFs.

## UX

- Locked PDF: "*name* is password-protected, so it cannot be processed."
- Unreadable PDF: "*name* could not be read as a PDF."
- Overflow: "*name* pushed the document over *n* pages — the extra pages were
  dropped."

## State & data

`src/lib/engine/local-engine.js`

- New `PdfLoadError extends Error` carrying `code` (`"pdf-locked"` /
  `"pdf-unreadable"`) and `fileName`.
- `pdfLoadErrorCode(err)` (pure, exported) classifies a pdf-lib failure:
  `EncryptedPDFError` or an `/encrypt|password/` message → `pdf-locked`,
  otherwise `pdf-unreadable`.
- `loadPdf(bytes, fileName)` wraps `PDFDocument.load` and throws the tagged
  error; `processOffline` uses it per file and passes `f.name`
  (`offlineBlob` now includes `name`).

`src/lib/state/store.svelte.js`

- `generateErrorText(mode, err)` maps `err.code` to a localised toast, falling
  back to the existing "state · reason" line for unknown errors.
- Overflow toasts use `msgOverflowFile` with the file name.

## i18n

`msgPdfLocked`, `msgPdfBroken`, `msgOverflowFile` (EN + BM); the generic
`msgOverflow` was removed.

## Tests

- `pdfLoadErrorCode` classifies encrypted vs unreadable.
- `processOffline` rejects a broken PDF with `{ code: "pdf-unreadable",
  fileName }`.

## Rollout & risks

- The encrypted path is detected but not supported; the message says so, which
  is better than a stack-trace toast.
- `PdfLoadError` is engine-owned and the store maps it by `code`, keeping the
  engine free of UI strings (SOC).
