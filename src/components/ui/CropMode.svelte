<script>
  /** Full-screen crop mode. The crop window is a real, resizable frame:
   *  four round corner handles drag it, dragging inside it moves it, and the
   *  image underneath pans/pinches/wheel-zooms. Save lives in the TOP TOOLBAR
   *  (the swipe-to-confirm strip was removed — it read as a mystery button).
   *  Emits fractions {l,t,r,b} (0..1), the format the store's crop path uses. */
  import { t } from "../../lib/i18n.js";
  import Icon from "./Icon.svelte";

  let { url, filter = "none", crop = null, onClose, onSave } = $props();

  const ZMIN = 1;
  const ZMAX = 8;
  const MIN_WIN = 0.14; // window may not shrink below 14% of the stage
  const clamp01 = (v) => Math.min(1, Math.max(0, v));

  let stageEl;
  let imgEl;
  let panEl;

  let natW = 0;
  let natH = 0;
  let baseScale = $state(1);
  let z = $state(1);
  let tx = $state(0);
  let ty = $state(0);

  // Crop window as fractions of the stage box.
  let win = $state({ x: 0.17, y: 0.17, w: 0.66, h: 0.66 });
  let winMoved = false;

  const winStyle = $derived(
    `left:${win.x * 100}%;top:${win.y * 100}%;width:${win.w * 100}%;height:${win.h * 100}%`
  );
  const changed = $derived(winMoved || Math.abs(z - 1) > 0.001 || Math.abs(tx) > 0.5 || Math.abs(ty) > 0.5);

  // Apply the image transform imperatively: a reactive `style=` binding here
  // was dropping the transform entirely (the photo stayed at natural size, so
  // a big image always looked pre-zoomed-in with no way to zoom out). Writing
  // to the element directly in an effect is deterministic.
  $effect(() => {
    if (panEl) panEl.style.transform = `translate(${tx}px, ${ty}px) scale(${baseScale * z})`;
  });

  function stageRect() {
    return stageEl?.getBoundingClientRect() ?? { left: 0, top: 0, width: 1, height: 1 };
  }

  /** The image's visible rectangle, as fractions of the stage box. The crop
   *  window is clamped to stay inside it, so it can never be dragged (or
   *  resized) off the photo onto the empty background. */
  function imageFrac() {
    const r = stageRect();
    const dispW = natW * baseScale * z;
    const dispH = natH * baseScale * z;
    const imgL = r.width / 2 - dispW / 2 + tx;
    const imgT = r.height / 2 - dispH / 2 + ty;
    return {
      l: imgL / r.width,
      t: imgT / r.height,
      r: (imgL + dispW) / r.width,
      b: (imgT + dispH) / r.height,
    };
  }

  /** Keep a window rect inside the image bounds (centred when larger). */
  function clampWin(w) {
    const ir = imageFrac();
    let x =
      w.w > ir.r - ir.l + 0.0001
        ? (ir.l + ir.r) / 2 - w.w / 2
        : Math.min(ir.r - w.w, Math.max(ir.l, w.x));
    let y =
      w.h > ir.b - ir.t + 0.0001
        ? (ir.t + ir.b) / 2 - w.h / 2
        : Math.min(ir.b - w.h, Math.max(ir.t, w.y));
    return { x, y, w: w.w, h: w.h };
  }

  /** Keep the image covering the crop window (industrial-standard crop feel):
   *  the window can never look at empty background. */
  function clampPan() {
    const r = stageRect();
    const dispW = natW * baseScale * z;
    const dispH = natH * baseScale * z;
    const cx = win.x + win.w / 2;
    const cy = win.y + win.h / 2;
    const lo = win.x * r.width - r.width / 2 + dispW / 2;
    const hi = (win.x + win.w) * r.width - r.width / 2 - dispW / 2;
    tx = lo > hi ? (win.x + win.w / 2) * r.width - r.width / 2 : Math.min(hi, Math.max(lo, tx));
    const loY = win.y * r.height - r.height / 2 + dispH / 2;
    const hiY = (win.y + win.h) * r.height - r.height / 2 - dispH / 2;
    ty = loY > hiY ? cy * r.height - r.height / 2 : Math.min(hiY, Math.max(loY, ty));
  }

  function onImgLoad() {
    natW = imgEl.naturalWidth;
    natH = imgEl.naturalHeight;
    const r = stageRect();
    // CONTAIN, not cover: the whole photo must be visible at start. A cover base
    // with a ZMIN of 1 made a large photo look pre-zoomed-in with no way to zoom
    // out (the reported crop bug); the user finds the region, then zooms in.
    baseScale = r.width && r.height && natW && natH ? Math.min(r.width / natW, r.height / natH) : 1;
    if (crop) {
      // Re-open on the existing crop region.
      win = { x: crop.l, y: crop.t, w: Math.max(MIN_WIN, crop.r - crop.l), h: Math.max(MIN_WIN, crop.b - crop.t) };
      winMoved = true;
    }
    clampPan();
  }

  /** Crop fractions the window sees over the transformed image. */
  function compute() {
    const r = stageRect();
    const cw = win.w * r.width;
    const ch = win.h * r.height;
    const winL = r.left + win.x * r.width;
    const winT = r.top + win.y * r.height;
    const dispW = natW * baseScale * z;
    const dispH = natH * baseScale * z;
    const imgL = r.left + r.width / 2 - dispW / 2 + tx;
    const imgT = r.top + r.height / 2 - dispH / 2 + ty;
    const rect = {
      l: clamp01((winL - imgL) / dispW),
      t: clamp01((winT - imgT) / dispH),
      r: clamp01((winL + cw - imgL) / dispW),
      b: clamp01((winT + ch - imgT) / dispH),
    };
    return rect.r - rect.l > 0.04 && rect.b - rect.t > 0.04 ? rect : null;
  }

  function revert() {
    z = 1;
    tx = 0;
    ty = 0;
    win = { x: 0.17, y: 0.17, w: 0.66, h: 0.66 };
    winMoved = false;
    clampPan();
  }

  function finish() {
    onSave?.(changed ? compute() : null);
  }

  /* ---------- crop window: move + corner resize ---------- */
  let drag = null;

  function winDown(e, mode) {
    const r = stageRect();
    drag = { mode, sx: e.clientX, sy: e.clientY, box: { ...win }, rw: r.width, rh: r.height };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    e.stopPropagation();
    e.preventDefault();
  }

  function winMove(e) {
    if (!drag) return;
    const dx = (e.clientX - drag.sx) / (drag.rw || 1);
    const dy = (e.clientY - drag.sy) / (drag.rh || 1);
    const b = drag.box;
    if (drag.mode === "move") {
      win = clampWin({
        x: Math.max(0, Math.min(b.x + dx, 1 - win.w)),
        y: Math.max(0, Math.min(b.y + dy, 1 - win.h)),
        w: win.w,
        h: win.h,
      });
    } else {
      // corner handles: 'nw','ne','sw','se'
      const left = drag.mode.includes("w");
      const top = drag.mode.includes("n");
      let x1 = b.x;
      let y1 = b.y;
      let x2 = b.x + b.w;
      let y2 = b.y + b.h;
      if (left) x1 = Math.min(b.x + dx, x2 - MIN_WIN);
      else x2 = Math.max(b.x + b.w + dx, x1 + MIN_WIN);
      if (top) y1 = Math.min(b.y + dy, y2 - MIN_WIN);
      else y2 = Math.max(b.y + b.h + dy, y1 + MIN_WIN);
      win = clampWin({ x: Math.max(0, x1), y: Math.max(0, y1), w: Math.min(1, x2) - Math.max(0, x1), h: Math.min(1, y2) - Math.max(0, y1) });
    }
    winMoved = true;
    e.stopPropagation();
  }

  function winUp(e) {
    drag = null;
    clampPan();
    e?.stopPropagation?.();
  }

  /* ---------- image: pan / pinch (background only) ---------- */
  const ptrs = new Map();
  let pz = 1;
  let pdist = 0;

  function pDown(e) {
    stageEl.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    pz = z;
    pdist = 0;
    e.preventDefault();
  }

  function pMove(e) {
    if (!ptrs.has(e.pointerId)) return;
    const prev = ptrs.get(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 1) {
      tx += e.clientX - prev.x;
      ty += e.clientY - prev.y;
    } else if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      if (pdist) {
        const nz = Math.min(ZMAX, Math.max(ZMIN, pz * (d / (pdist || 1))));
        const k = nz / z;
        const r = stageRect();
        const dispW = natW * baseScale * z;
        const dispH = natH * baseScale * z;
        const imgL = r.left + r.width / 2 - dispW / 2 + tx;
        const imgT = r.top + r.height / 2 - dispH / 2 + ty;
        tx = mx - (mx - imgL) * k - (r.left + r.width / 2 - (dispW * k) / 2);
        ty = my - (my - imgT) * k - (r.top + r.height / 2 - (dispH * k) / 2);
        z = nz;
      }
      pdist = d;
    }
    clampPan();
  }

  function pUp(e) {
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pdist = 0;
    clampPan();
  }

  function wheel(e) {
    const f = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    const nz = Math.min(ZMAX, Math.max(ZMIN, z * f));
    const r = stageRect();
    const cx = e.clientX - r.left;
    const cy = e.clientY - r.top;
    const dispW = natW * baseScale * z;
    const dispH = natH * baseScale * z;
    const imgL = r.width / 2 - dispW / 2 + tx;
    const imgT = r.height / 2 - dispH / 2 + ty;
    tx = cx - (cx - imgL) * (nz / z) - (r.width / 2 - (dispW * (nz / z)) / 2);
    ty = cy - (cy - imgT) * (nz / z) - (r.height / 2 - (dispH * (nz / z)) / 2);
    z = nz;
    clampPan();
    e.preventDefault();
  }
</script>

<div class="cropmode" role="dialog" aria-modal="true" aria-label={t("viewCrop")}>
  <div class="cm-top">
    <button type="button" class="iconbtn" aria-label={t("close")} onclick={onClose}>
      <Icon name="x" size={22} />
    </button>
    <span class="cm-title">{t("viewCrop")}</span>
    <button type="button" class="btn btn-sm" disabled={!changed} onclick={revert}>{t("cmRevert")}</button>
    <button type="button" class="btn btn-sm btn-primary" onclick={finish}>{t("cmSave")}</button>
  </div>

  <div
    class="cm-stage"
    bind:this={stageEl}
    onpointerdown={pDown}
    onpointermove={pMove}
    onpointerup={pUp}
    onpointercancel={pUp}
    onwheel={wheel}
    style="touch-action:none"
  >
    <div class="cm-pan" bind:this={panEl}>
      <img
        bind:this={imgEl}
        src={url}
        alt={t("viewCrop")}
        draggable="false"
        onload={onImgLoad}
        style={filter && filter !== "none" ? "filter:" + filter : ""}
      />
    </div>

    <div class="cm-win" style={winStyle} onpointerdown={(e) => winDown(e, "move")} onpointermove={winMove} onpointerup={winUp} onpointercancel={winUp}>
      <span class="cm-grid" aria-hidden="true"></span>
      {#each ["nw", "ne", "sw", "se"] as corner (corner)}
        <span
          class="cm-handle cm-{corner}"
          role="button"
          tabindex="-1"
          aria-label={t("pcResizeH")}
          onpointerdown={(e) => winDown(e, corner)}
          onpointermove={winMove}
          onpointerup={winUp}
          onpointercancel={winUp}
        ></span>
      {/each}
    </div>
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
