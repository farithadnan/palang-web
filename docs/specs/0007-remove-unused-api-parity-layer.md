# 0007 — Remove the unused API-parity layer

Status: Implemented
Date: 2026-10-06

## Context

`domain.js` and the engine carried a layer that mirrored an old server API
(`/api/process`) that no longer exists: a page selector, region mode, a second
label line, a reference/template field, solid/see-through band styles, anchored
positions, and `REGION_*` constants. None were reachable in the UI, and — more
importantly — the local engine did not honor them:

- `renderPalang()` reads only the label (text, colour, font size) and rotation.
  It ignored `second_line`, `template_data`, `band_style`, `opacity`, and
  `pages`.
- A `solid` / `see-through` spec would change the **preview** but render as a
  transparent lines band in the **output** — a preview↔output parity break,
  the one invariant this codebase protects.

Dead code is tolerable; **misleading** dead code is not.

## What was removed

- The `pages` / `pagesCustom` selector and `pagesValue()` (already gone — see
  spec 0001).
- `buildPalangSpec(spec, anchored)` — a large API-shaped builder whose output
  the engine barely used — replaced by `palangLabel(spec)`, which returns
  exactly the three things the renderer needs: `{ text, color, fontPt }`.
- `second` and `ref` from `defaultSpec` and their handling.
- `style`/`opacity`/`band_style`/region branches from the domain, plus
  `BAND_THICKNESS`, `REGION_THICKNESS`, `REGION_WIDTH`, `REGION_LEFT_PT`,
  `FILLED_OPACITY`.
- `imageSettings()` (unused) and `round2()` (unused).

## What was kept

- `mode: "band"` and `style: "lines"` remain on the model because
  `PalangCanvas` reads them. The region/filled branches inside the canvas are
  still present but unreachable; removing them is a separate, riskier pass
  through the active gesture code (tracked as a possible follow-up, not done
  here).

## Rationale (SOLID / DRY / SOC)

- **Single responsibility:** the domain now exposes the one visual shape the
  engine consumes, not a speculative API document.
- **YAGNI / DRY:** two representations of the same band (an API spec and a
  drawn label) became one.
- **Honest contracts:** a field that is silently ignored no longer exists, so a
  future contributor cannot trust it.

## Tests

`tests/domain.test.js` rewritten: the `buildPalangSpec` suite (region, styles,
anchors, second line, reference) is replaced by a focused `palangLabel` suite
(text trimming, colour, font-size fallback). Total tests dropped, coverage of
live behavior unchanged.

## Rollout & risks

- No user-visible change; the renderer's inputs are identical for the shipping
  lines band.
- Reintroducing any of these features later (e.g. a second line) should start
  from a proper spec and implement both preview and output together.
