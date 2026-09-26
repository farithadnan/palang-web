<script>
  /** Interactive product sample: a mock document on canvas with the palang
   *  band rendered the same way the editor draws it (two accent lines +
   *  centred text). Drag it, rotate it, resize it — a taster of the real
   *  editor, with a Reset so a stray drag is never a dead end.
   *
   *  Clamping rule: the band may never leave the page. The clamp uses the
   *  ROTATED footprint (w·|cos| + h·|sin|), because a tilted band is wider
   *  than its frame and clamping the frame alone let it slide out of the box.
   *  No props → local state is safe here. */
  import { t } from "../lib/i18n.js";

  const TEXT = "UNTUK KEGUNAAN RASMI";
  const DEFAULT = { x: 0.2, y: 0.42, w: 0.6, h: 0.09, rot: 0, size: 1 };
  const MAX_SIZE = 1.6; // keeps the band narrower than the page at size 1.6
  const MIN_SIZE = 0.5;

  let canvas;
  let band = $state({ ...DEFAULT });
  let dragging = $state(false);
  let dragOff = { dx: 0, dy: 0 };

  /** Everything the drawing, the hit test and the clamp need. */
  function geometry(b) {
    const bw = Math.min(0.98, b.w * b.size);
    const bh = b.h;
    const rad = (b.rot * Math.PI) / 180;
    const rx = bw * Math.abs(Math.cos(rad)) + bh * Math.abs(Math.sin(rad));
    const ry = bw * Math.abs(Math.sin(rad)) + bh * Math.abs(Math.cos(rad));
    return { bw, bh, rx, ry };
  }

  /** Keep the band inside the page, measured by its ROTATED footprint. */
  function inside(b) {
    const { bw, bh, rx, ry } = geometry(b);
    let cx = b.x + bw / 2;
    let cy = b.y + bh / 2;
    cx = rx >= 1 ? 0.5 : Math.min(1 - rx / 2, Math.max(rx / 2, cx));
    cy = ry >= 1 ? 0.5 : Math.min(1 - ry / 2, Math.max(ry / 2, cy));
    return { ...b, x: cx - bw / 2, y: cy - bh / 2 };
  }

  function draw() {
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // mock document page
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#ddd";
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

    const ink = "#b9b4ac";
    ctx.fillStyle = ink;
    ctx.fillRect(w * 0.14, h * 0.07, w * 0.5, h * 0.02);
    ctx.fillRect(w * 0.14, h * 0.105, w * 0.3, h * 0.012);
    for (let i = 0; i < 7; i++) {
      const y = h * (0.2 + i * 0.09);
      ctx.fillRect(w * 0.14, y, w * 0.72, h * 0.011);
      ctx.fillRect(w * 0.14, y + h * 0.022, w * (0.72 - 0.16 - (i % 3) * 0.1), h * 0.011);
    }
    ctx.fillRect(w * 0.55, h * 0.86, w * 0.3, h * 0.03);

    // the palang band
    const { bw, bh } = geometry(band);
    const pxW = bw * w;
    const pxH = bh * h;
    const bx = band.x * w;
    const by = band.y * h;
    ctx.save();
    ctx.translate(bx + pxW / 2, by + pxH / 2);
    ctx.rotate((band.rot * Math.PI) / 180);
    ctx.translate(-(bx + pxW / 2), -(by + pxH / 2));

    ctx.strokeStyle = "#003366";
    ctx.lineWidth = Math.max(1.5, 2 * band.size);
    ctx.beginPath();
    ctx.moveTo(bx, by + pxH * 0.12);
    ctx.lineTo(bx + pxW, by + pxH * 0.12);
    ctx.moveTo(bx, by + pxH * 0.88);
    ctx.lineTo(bx + pxW, by + pxH * 0.88);
    ctx.stroke();

    const fontPt = Math.max(9, 14 * band.size);
    ctx.fillStyle = "#003366";
    ctx.font = `700 ${fontPt}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(TEXT, bx + pxW / 2, by + pxH / 2);
    ctx.restore();
  }

  $effect(() => {
    if (canvas) draw();
  });

  function pos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  }

  function down(e) {
    const p = pos(e);
    const { bw, bh } = geometry(band);
    const insideBand =
      p.x >= band.x - 0.02 && p.x <= band.x + bw + 0.02 && p.y >= band.y - 0.03 && p.y <= band.y + bh + 0.03;
    if (!insideBand) {
      // snap the band to where you tapped, kept inside the page
      band = inside({ ...band, x: p.x - bw / 2, y: p.y - bh / 2 });
      return;
    }
    dragging = true;
    dragOff = { dx: p.x - band.x, dy: p.y - band.y };
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      dragging = false;
    }
  }

  function move(e) {
    if (!dragging) return;
    const p = pos(e);
    band = inside({ ...band, x: p.x - dragOff.dx, y: p.y - dragOff.dy });
  }

  function up() {
    dragging = false;
  }

  function rotate() {
    band = inside({ ...band, rot: (band.rot + 15) % 360 });
  }

  function grow(d) {
    band = inside({ ...band, size: Math.min(MAX_SIZE, Math.max(MIN_SIZE, band.size + d)) });
  }

  function reset() {
    band = { ...DEFAULT };
    dragging = false;
  }
</script>

<div class="samplewrap" role="application" aria-label={t("sdAria")}>
  <canvas
    bind:this={canvas}
    onpointerdown={down}
    onpointermove={move}
    onpointerup={up}
    onpointercancel={up}
  ></canvas>
  <div class="sampletools">
    <button type="button" class="btn btn-sm btn-ghost" aria-label={t("sdRotate")} onclick={rotate}>↻ 15°</button>
    <button type="button" class="btn btn-sm btn-ghost" aria-label={t("sdSmaller")} onclick={() => grow(-0.15)}>−</button>
    <button type="button" class="btn btn-sm btn-ghost" aria-label={t("sdBigger")} onclick={() => grow(0.15)}>+</button>
    <button type="button" class="btn btn-sm btn-ghost" onclick={reset}>{t("sdReset")}</button>
  </div>
</div>

<style>
  /* The demo's size belongs to the demo: it is the same component on the home
     page and on the palang page, so a host must not resize it (two caps made
     the marking scale differently in the same widget). */
  .samplewrap {
    width: 100%;
    max-width: 320px;
    margin: 0 auto;
    border: 1px solid var(--line);
    border-radius: 16px;
    background: var(--panel);
    padding: 0.9rem;
    touch-action: none;
  }
  canvas {
    width: 100%;
    aspect-ratio: 10 / 13;
    display: block;
    border-radius: 8px;
    background: #fff;
    cursor: grab;
    touch-action: none;
  }
  canvas:active { cursor: grabbing; }
  .sampletools {
    display: flex;
    gap: 0.4rem;
    margin-top: 0.7rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  /* !important-free specificity note: these must beat the site's `.site .btn`
     pill override, so they are scoped to .sampletools. */
  .sampletools .btn {
    min-height: 0;
    line-height: 30px;
    padding: 0 0.7rem;
    border-radius: 8px;
    font-size: 0.8125rem;
  }
</style>
