# ADR 0001 — Offline by construction

Status: Accepted
Date: 2026-10-06

## Context

Palang prepares personal documents (bank statements, identity copies, forms).
Users cannot be asked to upload those to a server, and the project has no
backend to run. The product targets Malaysia, where PDPA 2010 governs
personal-data handling.

## Decision

All processing happens on the device. The engine (`pdf-lib`, plus `pdf.js`
for previews) is bundled into the app. There is no backend, no account, no
telemetry, and no document ever leaves the device. The only network request
is a best-effort update-manifest check (`version.json`).

The public site is a static bundle; its Docker image only serves files.

## Consequences

- Feature design must assume **no server**: anything that would need one
  (OCR, heavy batch, cross-device history) is out of scope or must run
  client-side.
- Nothing may be persisted as document data. UI state that outlives a session
  (theme, language, default paper, default palang text, dismissed updates)
  is limited to non-sensitive preferences in `localStorage`. The session
  summary (spec 0003) must stay in memory only.
- Memory becomes a first-class constraint: large files are handled lazily
  (metadata first, one page rendered at a time) and preview object URLs are
  released on teardown.
- Packaging must keep the engine inside the bundle, which is why the app
  build ships `pdf.js` standard fonts locally rather than from a CDN.
