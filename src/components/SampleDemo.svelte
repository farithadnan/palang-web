<script>
  /** Interactive product sample: a mock document on canvas with the palang
   *  band rendered the same way the editor draws it (two accent lines +
   *  centred text). The band is draggable; Rotate and +/− resize it — a
   *  taster of the real editor. No props → local state is safe here. */
  import { t } from "../lib/i18n.js";
  let canvas;
  let band = $state({ x: 0.2, y: 0.42, w: 0.6, h: 0.09, rot: 0, size: 1 });
  let dragging = $state(false);
  let dragOff = { dx: 0, dy: 0 };

  const TEXT = "UNTUK KEGUNAAN RASMI";

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
    // header line
    ctx.fillRect(w * 0.14, h * 0.07, w * 0.5, h * 0.02);
    ctx.fillRect(w * 0.14, h * 0.105, w * 0.3, h * 0.012);
    // body: rows of "text"
    for (let i = 0; i < 7; i++) {
      const y = h * (0.2 + i * 0.09);
      ctx.fillRect(w * 0.14, y, w * 0.72, h * 0.011);
      ctx.fillRect(w * 0.14, y + h * 0.022, w * (0.72 - 0.16 - (i % 3) * 0.1), h * 0.011);
    }
    // signature block
    ctx.fillRect(w * 0.55, h * 0.86, w * 0.3, h * 0.03);

    // the palang band
    const bw = band.w * w * band.size;
    const bh = band.h * h;
    const bx = band.x * w;
    const by = band.y * h;
    ctx.save();
    ctx.translate(bx + bw / 2, by + bh / 2);
    ctx.rotate((band.rot * Math.PI) / 180);
    ctx.translate(-(bx + bw / 2), -(by + bh / 2));

    ctx.strokeStyle = "#003366";
    ctx.lineWidth = Math.max(1.5, 2 * band.size);
    const lineY1 = by + bh * 0.12;
    const lineY2 = by + bh * 0.88;
    ctx.beginPath();
    ctx.moveTo(bx, lineY1);
    ctx.lineTo(bx + bw, lineY1);
    ctx.moveTo(bx, lineY2);
    ctx.lineTo(bx + bw, lineY2);
    ctx.stroke();

    const fontPt = Math.max(9, 14 * band.size);
    ctx.fillStyle = "#003366";
    ctx.font = `700 ${fontPt}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(TEXT, bx + bw / 2, by + bh / 2);
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
    const bw = band.w * band.size;
    const bh = band.h;
    const inside =
      p.x >= band.x - 0.02 && p.x <= band.x + bw + 0.02 && p.y >= band.y - 0.03 && p.y <= band.y + bh + 0.03;
    if (!inside) {
      // snap the band to where you tapped — even more fun than a miss
      band = { ...band, x: clamp01(p.x - bw / 2), y: clamp01(p.y - bh / 2) };
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
    band = { ...band, x: clamp01(p.x - dragOff.dx), y: clamp01(p.y - dragOff.dy) };
  }

  function up() {
    dragging = false;
  }

  function clamp01(v) {
    return Math.min(1, Math.max(0, v));
  }

  function rotate() {
    band = { ...band, rot: (band.rot + 15) % 360 };
  }
  function grow(d) {
    band = { ...band, size: Math.min(2, Math.max(0.6, band.size + d)) };
  }
</script>

<div
  class="samplewrap"
  role="application"
  aria-label={t("sdAria")}
>
  <canvas
    bind:this={canvas}
    onpointerdown={down}
    onpointermove={move}
    onpointerup={up}
    onpointercancel={up}
  ></canvas>
  <div class="sampletools">
    <button type="button" class="btn btn-sm btn-ghost" onclick={rotate}>↻ 15°</button>
    <button type="button" class="btn btn-sm btn-ghost" aria-label={t("sdSmaller")} onclick={() => grow(-0.2)}>−</button>
    <button type="button" class="btn btn-sm btn-ghost" aria-label={t("sdBigger")} onclick={() => grow(0.2)}>+</button>
  </div>
</div>

<style>
  .samplewrap {
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
    gap: 0.5rem;
    margin-top: 0.7rem;
    justify-content: center;
  }
</style>
