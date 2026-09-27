<script>
  /** Full-screen crop mode (desktop AND touch).
   *
   *  Gesture model — Samsung-gallery style:
   *    · A corner handle resizes the crop window ONLY. The photo never moves
   *      while you resize; the window is clamped inside the photo.
   *    · Releasing a handle auto-focuses: the view zooms so the crop window
   *      fills the screen (keeping the same selected region), for fine-tuning.
   *    · One finger / mouse drag moves the PHOTO under the fixed window.
   *    · Two fingers / mouse wheel pinches the photo, limited so the window
   *      always sees photo (never empty background) and never past max zoom.
   *
   *  All geometry lives in src/lib/crop.js (pure, unit-tested); this file is
   *  gestures, rendering and the toolbar only.
   *
   *  Emits fractions {l,t,r,b} (0..1) — the format the store's crop path uses. */
  import { onMount } from "svelte";
  import { t } from "../../lib/i18n/index.js";
  import { ask } from "../../lib/state/confirm.svelte.js";
  import Icon from "../ui/Icon.svelte";
  import {
    clampFrame,
    clampView,
    coverScale,
    cropFromView,
    displayRect,
    fitScale,
    focusView,
  } from "../../lib/domain/crop.js";

  let { url, filter = "none", crop = null, onClose, onSave } = $props();

  const MIN = 48; // smallest crop window, stage px
  const MAX_ZOOM = 8; // zoom-in limit, relative to "fit"
  const FOCUS_PAD = 0.06; // breathing room around the focused window

  let stageEl;
  let imgEl;
  let panEl;

  let natW = $state(0);
  let natH = $state(0);
  let stageW = $state(0);
  let stageH = $state(0);
  let view = $state({ scale: 1, tx: 0, ty: 0 });
  let frame = $state({ x: 0, y: 0, w: 1, h: 1 });
  let dirty = $state(false);
  let ready = $state(false);
  let animating = $state(false);

  const winStyle = $derived(
    `left:${frame.x}px;top:${frame.y}px;width:${frame.w}px;height:${frame.h}px`
  );

  function stageRect() {
    return stageEl?.getBoundingClientRect() ?? { left: 0, top: 0, width: 1, height: 1 };
  }
  function baseScale() {
    return fitScale(stageW, stageH, natW, natH);
  }
  function maxScale() {
    return Math.max(baseScale(), coverScale(frame, natW, natH)) * MAX_ZOOM;
  }

  // Apply the view transform imperatively: a reactive `style=` binding here was
  // dropping the transform entirely (a reported crop bug). Writing to the
  // element directly is deterministic.
  $effect(() => {
    if (panEl) panEl.style.transform = `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})`;
  });

  /** Start a session on the loaded photo: fit the whole image, then either
   *  re-open the saved crop region or show the default centred window. */
  function init() {
    if (!imgEl?.naturalWidth) return;
    natW = imgEl.naturalWidth;
    natH = imgEl.naturalHeight;
    const r = stageRect();
    stageW = r.width;
    stageH = r.height;
    const scale = fitScale(stageW, stageH, natW, natH);
    view = { scale, tx: 0, ty: 0 };
    const rect = displayRect(view, natW, natH, stageW, stageH);
    if (crop) {
      const toX = (f) => stageW / 2 + (f * natW - natW / 2) * scale;
      const toY = (f) => stageH / 2 + (f * natH - natH / 2) * scale;
      frame = clampFrame(
        {
          x: toX(crop.l),
          y: toY(crop.t),
          w: Math.max(MIN, (crop.r - crop.l) * natW * scale),
          h: Math.max(MIN, (crop.b - crop.t) * natH * scale),
        },
        rect,
        MIN
      );
      dirty = true;
    } else {
      frame = clampFrame(
        { x: stageW * 0.17, y: stageH * 0.17, w: stageW * 0.66, h: stageH * 0.66 },
        rect,
        MIN
      );
      dirty = false;
    }
    ready = true;
  }

  async function revert() {
    if (!(await ask({ title: t("cfRevertTitle"), body: t("cfRevertBody"), confirmLabel: t("cmRevert") }))) return;
    const r = stageRect();
    stageW = r.width;
    stageH = r.height;
    const scale = fitScale(stageW, stageH, natW, natH);
    animating = true;
    view = { scale, tx: 0, ty: 0 };
    frame = clampFrame(
      { x: stageW * 0.17, y: stageH * 0.17, w: stageW * 0.66, h: stageH * 0.66 },
      displayRect(view, natW, natH, stageW, stageH),
      MIN
    );
    dirty = false;
  }

  function finish() {
    onSave?.(dirty ? cropFromView(frame, view, natW, natH, stageW, stageH) : null);
  }

  /* ---------- gestures: one unified pointer pipeline ---------- */

  const ptrs = new Map();
  let mode = null; // "resize" | "pan" | "pinch"
  let corner = null;
  let drag = null; // { sx, sy, frame, view }
  let pinch = null; // { d0, scale0, ix, iy }

  function down(e) {
    if (!ready) return;
    stageEl.setPointerCapture?.(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    animating = false;
    if (ptrs.size === 1) {
      const handle = e.target instanceof Element ? e.target.closest(".cm-handle") : null;
      mode = handle ? "resize" : "pan";
      corner = handle?.dataset.corner ?? null;
      drag = { sx: e.clientX, sy: e.clientY, frame: { ...frame }, view: { ...view } };
    } else if (ptrs.size === 2) {
      startPinch();
    }
    e.preventDefault();
  }

  function startPinch() {
    const [a, b] = [...ptrs.values()];
    const r = stageRect();
    const d0 = Math.hypot(a.x - b.x, a.y - b.y) || 1;
    const mx = (a.x + b.x) / 2 - r.left;
    const my = (a.y + b.y) / 2 - r.top;
    pinch = {
      d0,
      scale0: view.scale,
      ix: (mx - stageW / 2 - view.tx) / view.scale + natW / 2,
      iy: (my - stageH / 2 - view.ty) / view.scale + natH / 2,
    };
    mode = "pinch";
    drag = null;
  }

  /** Zoom to `scale`, keeping the image point under (mx,my) pinned. */
  function zoomTo(scale, mx, my, ix, iy) {
    const s = Math.min(Math.max(scale, coverScale(frame, natW, natH)), maxScale());
    const tx = mx - stageW / 2 - (ix - natW / 2) * s;
    const ty = my - stageH / 2 - (iy - natH / 2) * s;
    view = clampView({ scale: s, tx, ty }, frame, natW, natH, stageW, stageH, maxScale());
    dirty = true;
  }

  function move(e) {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (mode === "resize" && drag) {
      // Resize the window only — the view is untouched, so the photo holds still.
      const dx = e.clientX - drag.sx;
      const dy = e.clientY - drag.sy;
      const b = drag.frame;
      let x1 = b.x;
      let y1 = b.y;
      let x2 = b.x + b.w;
      let y2 = b.y + b.h;
      if (corner.includes("w")) x1 = Math.min(b.x + dx, x2 - MIN);
      else x2 = Math.max(b.x + b.w + dx, x1 + MIN);
      if (corner.includes("n")) y1 = Math.min(b.y + dy, y2 - MIN);
      else y2 = Math.max(b.y + b.h + dy, y1 + MIN);
      frame = clampFrame(
        { x: x1, y: y1, w: x2 - x1, h: y2 - y1 },
        displayRect(drag.view, natW, natH, stageW, stageH),
        MIN
      );
      dirty = true;
    } else if (mode === "pinch" && pinch) {
      const [a, b] = [...ptrs.values()];
      const r = stageRect();
      const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const mx = (a.x + b.x) / 2 - r.left;
      const my = (a.y + b.y) / 2 - r.top;
      zoomTo(pinch.scale0 * (d / pinch.d0), mx, my, pinch.ix, pinch.iy);
    } else if (mode === "pan" && drag) {
      view = clampView(
        {
          scale: drag.view.scale,
          tx: drag.view.tx + (e.clientX - drag.sx),
          ty: drag.view.ty + (e.clientY - drag.sy),
        },
        frame,
        natW,
        natH,
        stageW,
        stageH,
        maxScale()
      );
      dirty = true;
    }
    e.preventDefault();
  }

  function up(e) {
    ptrs.delete(e.pointerId);
    if (ptrs.size === 0) {
      // Focus the window after a resize so the user can fine-tune it.
      if (mode === "resize" && dirty) {
        const focused = focusView(frame, view, natW, natH, stageW, stageH, {
          pad: FOCUS_PAD,
          maxScale: maxScale(),
        });
        if (focused) {
          animating = true;
          frame = focused.frame;
          view = focused.view;
        }
      }
      mode = null;
      corner = null;
      drag = null;
      pinch = null;
    } else if (ptrs.size === 1 && mode === "pinch") {
      // Lifted one finger: continue as a one-finger photo pan.
      const p = [...ptrs.values()][0];
      mode = "pan";
      corner = null;
      pinch = null;
      drag = { sx: p.x, sy: p.y, frame: { ...frame }, view: { ...view } };
    }
    e?.preventDefault?.();
  }

  function wheel(e) {
    if (!ready) return;
    const r = stageRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    const ix = (mx - stageW / 2 - view.tx) / view.scale + natW / 2;
    const iy = (my - stageH / 2 - view.ty) / view.scale + natH / 2;
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    animating = false;
    zoomTo(view.scale * factor, mx, my, ix, iy);
    e.preventDefault();
  }

  onMount(() => {
    const onResize = () => {
      if (!ready) return;
      const r = stageRect();
      stageW = r.width;
      stageH = r.height;
      view = clampView(view, frame, natW, natH, stageW, stageH, maxScale());
      frame = clampFrame(frame, displayRect(view, natW, natH, stageW, stageH), MIN);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  });
</script>

<div class="cropmode" role="dialog" aria-modal="true" aria-label={t("viewCrop")}>
  <div class="cm-top">
    <button type="button" class="iconbtn" aria-label={t("close")} onclick={onClose}>
      <Icon name="x" size={22} />
    </button>
    <span class="cm-title">{t("viewCrop")}</span>
    <button type="button" class="btn btn-sm" disabled={!dirty} onclick={revert}>{t("cmRevert")}</button>
    <button type="button" class="btn btn-sm btn-primary" onclick={finish}>{t("cmSave")}</button>
  </div>

  <div
    class="cm-stage"
    role="application"
    aria-label={t("viewCrop")}
    bind:this={stageEl}
    onpointerdown={down}
    onpointermove={move}
    onpointerup={up}
    onpointercancel={up}
    onwheel={wheel}
    style="touch-action:none"
  >
    <div class="cm-pan" class:animating bind:this={panEl}>
      <img
        bind:this={imgEl}
        src={url}
        alt={t("viewCrop")}
        draggable="false"
        onload={init}
        style={filter && filter !== "none" ? "filter:" + filter : ""}
      />
    </div>

    {#if ready}
      <div class="cm-win" class:animating style={winStyle}>
        <span class="cm-grid" aria-hidden="true"></span>
        {#each ["nw", "ne", "sw", "se"] as c (c)}
          <span class="cm-handle cm-{c}" data-corner={c} aria-hidden="true"></span>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .cropmode {
    position: fixed;
    inset: 0;
    z-index: 70;
    background: var(--bg, #111);
    display: flex;
    flex-direction: column;
    color: var(--text);
  }
  .cm-top {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 0.8rem;
    border-bottom: 1px solid var(--line);
    background: var(--panel);
    flex-wrap: wrap;
  }
  .cm-title { flex: 1; font-size: var(--fs-body); min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cm-stage {
    flex: 1;
    min-height: 0;
    position: relative;
    overflow: hidden;
    background: #000;
    cursor: grab;
  }
  .cm-stage:active { cursor: grabbing; }
  .cm-pan { position: absolute; inset: 0; will-change: transform; }
  .cm-pan.animating { transition: transform 0.22s ease; }
  .cm-pan img {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    max-width: none;
    width: auto;
    height: auto;
    user-select: none;
    -webkit-user-drag: none;
  }
  .cm-win {
    position: absolute;
    border: 1px solid rgba(255, 255, 255, 0.9);
    cursor: move;
    touch-action: none;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.55);
  }
  .cm-win.animating {
    transition: left 0.22s ease, top 0.22s ease, width 0.22s ease, height 0.22s ease;
  }
  .cm-grid {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.3) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.3) 1px, transparent 1px);
    background-size: 33.333% 33.333%;
  }
  .cm-handle {
    position: absolute;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #ffffff;
    border: 2px solid var(--accent, #c9b458);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);
    touch-action: none;
  }
  .cm-nw { left: -11px; top: -11px; cursor: nwse-resize; }
  .cm-ne { right: -11px; top: -11px; cursor: nesw-resize; }
  .cm-sw { left: -11px; bottom: -11px; cursor: nesw-resize; }
  .cm-se { right: -11px; bottom: -11px; cursor: nwse-resize; }
</style>
