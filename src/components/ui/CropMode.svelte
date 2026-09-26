<script>
  /** Full-screen crop mode (Samsung-style): the crop window is FIXED and
   *  centered with a rule-of-thirds grid; pinching/dragging/zooming moves the
   *  IMAGE underneath it. Revert resets the view, Save applies the crop
   *  (or a swipe-right on the bottom strip confirms). Emits fractions
   *  {l,t,r,b} (0..1) in the same format the store's crop path expects. */
  import { t } from "../../lib/i18n.js";
  import Icon from "./Icon.svelte";

  let { url, filter = "none", crop = null, onClose, onSave } = $props();

  let stageEl;
  let imgEl;
  const ZMIN = 1;
  const ZMAX = 8;

  let natW = 0;
  let natH = 0;
  let baseScale = 1;
  let z = $state(1);
  let tx = $state(0);
  let ty = $state(0);
  let changed = $state(false);

  // swipe-to-confirm
  let swTrack;
  let swX = $state(0);
  let swW = 1;
  let swFrom = 0;
  const SW_OK = 0.75;

  const imgTransform = $derived(
    `translate(${tx}px, ${ty}px) scale(${z})`
  );

  function onImgLoad() {
    natW = imgEl.naturalWidth;
    natH = imgEl.naturalHeight;
    const r = stageEl.getBoundingClientRect();
    baseScale = r.width && r.height && natW && natH
      ? Math.max(r.width / natW, r.height / natH)
      : 1;
    if (crop) {
      // Frame the existing crop region in the window.
      const fw = crop.r - crop.l;
      const fh = crop.b - crop.t;
      z = Math.min(ZMAX, Math.max(ZMIN, 1 / Math.max(fw, fh, 0.2)));
      const dispW = natW * baseScale * z;
      const dispH = natH * baseScale * z;
      const winL = r.left + r.width * 0.17;
      const winT = r.top + r.height * 0.17;
      const cw = r.width * 0.66;
      const ch = r.height * 0.66;
      tx = winL - crop.l * dispW - (r.left + r.width / 2 - dispW / 2);
      ty = winT - crop.t * dispH - (r.top + r.height / 2 - dispH / 2);
    }
  }

  function stageRect() {
    return stageEl.getBoundingClientRect();
  }

  /** Crop fractions the fixed window sees over the transformed image. */
  function compute() {
    const r = stageRect();
    const cw = r.width * 0.66;
    const ch = r.height * 0.66;
    const winL = r.left + (r.width - cw) / 2;
    const winT = r.top + (r.height - ch) / 2;
    const dispW = natW * baseScale * z;
    const dispH = natH * baseScale * z;
    const imgL = r.left + r.width / 2 - dispW / 2 + tx;
    const imgT = r.top + r.height / 2 - dispH / 2 + ty;
    const cl = (x) => Math.min(1, Math.max(0, x));
    const rect = {
      l: cl((winL - imgL) / dispW),
      t: cl((winT - imgT) / dispH),
      r: cl((winL + cw - imgL) / dispW),
      b: cl((winT + ch - imgT) / dispH),
    };
    return rect.r - rect.l > 0.06 && rect.b - rect.t > 0.06 ? rect : null;
  }

  function markChanged() {
    changed = Math.abs(z - 1) > 0.001 || Math.abs(tx) > 0.5 || Math.abs(ty) > 0.5;
  }

  function revert() {
    z = 1;
    tx = 0;
    ty = 0;
    changed = false;
  }

  function saveSwipe() {
    if (swX / swW >= SW_OK) finish();
    else swX = 0;
  }

  function finish() {
    const moved = Math.abs(z - 1) > 0.001 || Math.abs(tx) > 0.5 || Math.abs(ty) > 0.5;
    onSave?.(moved ? compute() : null);
  }

  /* ---------- pan / pinch ---------- */
  const ptrs = new Map();
  let pz = 1, pdist = 0, pmx = 0, pmy = 0;

  function pDown(e) {
    stageEl.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    pz = z;
    pdist = 0;
    pmx = e.clientX;
    pmy = e.clientY;
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
      if (pdist && pmx !== undefined) {
        const nz = Math.min(ZMAX, Math.max(ZMIN, pz * (d / (pdist || 1))));
        const k = nz / z;
        // zoom around the midpoint so the image point under the fingers stays put
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
      pmx = mx;
      pmy = my;
    }
    markChanged();
  }

  function pUp(e) {
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pdist = 0;
    markChanged();
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
    markChanged();
    e.preventDefault();
  }

  /* ---------- swipe-to-confirm ---------- */
  function swDown(e) {
    swFrom = e.clientX;
    swW = Math.max(swTrack?.getBoundingClientRect().width ?? 1, 1);
    swTrack?.setPointerCapture(e.pointerId);
    e.preventDefault();
  }
  function swMove(e) {
    swX = Math.min(swW, Math.max(0, swX + (e.clientX - swFrom)));
    swFrom = e.clientX;
  }
  function swUp() {
    saveSwipe();
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
    <div class="cm-pan" style={imgTransform}>
      <img
        bind:this={imgEl}
        src={url}
        alt={t("viewCrop")}
        draggable="false"
        onload={onImgLoad}
        style={filter && filter !== "none" ? "filter:" + filter : ""}
      />
    </div>
    <div class="cm-win" aria-hidden="true"></div>
  </div>

  <div class="cm-swipe" bind:this={swTrack} onpointerdown={swDown} onpointermove={swMove} onpointerup={swUp} onpointercancel={swUp}>
    <span class="cm-swipe-track">
      <span class="cm-knob" style="transform:translateX({swX}px)">→</span>
    </span>
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
  }
  .cm-title { flex: 1; font-size: 0.98rem; }
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
  /* fixed crop window: thirds grid + dim outside */
  .cm-win {
    position: absolute;
    width: 66%;
    height: 66%;
    left: 17%;
    top: 17%;
    border: 1px solid rgba(255, 255, 255, 0.85);
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.55);
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.35) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.35) 1px, transparent 1px);
    background-size: 33.333% 33.333%;
    pointer-events: none;
  }
  .cm-swipe { padding: 0.7rem 0.9rem 1.2rem; background: var(--panel); }
  .cm-swipe-track {
    display: block;
    height: 2.6rem;
    border-radius: 999px;
    background: var(--line);
    position: relative;
    overflow: hidden;
  }
  .cm-knob {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2.6rem;
    border-radius: 50%;
    background: var(--accent, #c9b458);
    color: #111;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    touch-action: none;
    cursor: grab;
  }
</style>
