<script>
  /** Palang placement surface: drag/resize the marking over a rendered page.
   *  Presentational — emits absolute point geometry {topPt,leftPt,heightPt,widthPt}
   *  only on pointer release. Initial geometry comes from `spec` on image load.
   *  Band style "lines" previews the transparent text-with-lines look, with the
   *  line length measured from the actual text (like the server does). */
  import { round1 } from "../../lib/domain.js";

  let { url, widthPt, heightPt, spec, onChange } = $props();

  let img;
  let wrap;
  let scale = $state(0); // px per pt
  let box = $state(null); // current geometry in points {x,y,w,h}
  let mode = $state(null); // null | "move" | "se" (region) | "midb" (filled band)
  let sx = 0, sy = 0, bx = 0, by = 0, bw = 0, bh = 0;

  const region = $derived(spec.mode === "region");
  const lines = $derived(spec.mode === "band" && spec.style === "lines");

  const LINES_LINE_H = 24.3; // ~18pt text line height
  const LINES_SECOND_H = 16.2;

  function textWidthPt(text, sizePt) {
    if (!text) return 0;
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.font = "bold " + Math.round(sizePt * scale) + "px system-ui, sans-serif";
    return Math.max(0, ctx.measureText(text).width / scale);
  }

  function clampPt(v, lo, hi) {
    return Math.min(hi, Math.max(lo, v));
  }

  function init() {
    const w = img.clientWidth;
    if (!w || !widthPt) return;
    scale = w / widthPt;
    if (lines) {
      const firstW = textWidthPt(spec.text || "", 18);
      const secondW = textWidthPt(spec.second || "", 18);
      const lineLen = Math.max(40, Math.max(firstW, secondW) + 14);
      const hBlock = 6 + LINES_LINE_H + (spec.second ? 4 + LINES_SECOND_H : 0) + 6;
      const x = (widthPt - lineLen) / 2;
      const y = spec.topPt ?? (heightPt - hBlock) / 2;
      box = { x, y, w: lineLen, h: hBlock };
      return;
    }
    const wpt = region ? spec.widthPt ?? 180 : widthPt;
    const hpt = spec.heightPt ?? (region ? 28 : 48);
    const x = region ? spec.leftPt ?? (widthPt - wpt) / 2 : 0;
    const y = spec.topPt ?? (heightPt - hpt) / 2;
    box = { x, y, w: wpt, h: hpt };
  }

  function begin(e, m) {
    if (!box) return;
    sx = e.clientX;
    sy = e.clientY;
    bx = box.x;
    by = box.y;
    bw = box.w;
    bh = box.h;
    mode = m;
    wrap.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function drag(e) {
    if (!mode || !box || !scale) return;
    const dx = (e.clientX - sx) / scale;
    const dy = (e.clientY - sy) / scale;
    const b = { ...box };

    if (mode === "move") {
      if (!lines && region) b.x = clampPt(bx + dx, 0, widthPt - bw);
      b.y = clampPt(by + dy, 0, heightPt - bh);
    } else if (mode === "se" && region) {
      b.w = clampPt(bw + dx, 24, widthPt - bx);
      b.h = clampPt(bh + dy, 24, heightPt - by);
    } else if (mode === "midb") {
      b.h = clampPt(bh + dy, 12, heightPt - by);
    }
    box = b;
  }

  function release() {
    if (!mode || !box) return;
    mode = null;
    const patch = { topPt: round1(box.y), heightPt: round1(box.h) };
    if (region) {
      patch.leftPt = round1(box.x);
      patch.widthPt = round1(box.w);
    }
    onChange?.(patch);
  }

  const px = $derived(
    box
      ? { x: box.x * scale, y: box.y * scale, w: box.w * scale, h: box.h * scale }
      : { x: 0, y: 0, w: 0, h: 0 }
  );
  const boxStyle = $derived(
    [
      `left:${px.x}px`,
      `top:${px.y}px`,
      `width:${px.w}px`,
      `height:${px.h}px`,
      lines ? `border-color:${spec.color}` : "",
    ]
      .filter(Boolean)
      .join("; ")
  );
  const labelStyle = $derived(
    lines ? `color:${spec.color}; font-size:${Math.round(18 * scale)}px` : ""
  );
</script>

<div
  class="canvas-wrap"
  bind:this={wrap}
  role="application"
  aria-label="Palang placement"
  onpointermove={drag}
  onpointerup={release}
  onpointercancel={release}
>
  <img
    bind:this={img}
    src={url}
    alt=""
    draggable="false"
    onload={init}
    onpointerdown={(e) => e.preventDefault()}
  />
  {#if box && scale > 0}
    <div
      class="overlay-box"
      class:overlay-lines={lines}
      style={boxStyle}
      onpointerdown={(e) => begin(e, "move")}
      role="application"
      aria-label={lines ? "Palang line marking" : "Palang marking"}
    >
      {#if lines}
        <span class="overlay-label" style={labelStyle}>{spec.text || ""}</span>
      {/if}
      {#if !lines}
        <div class="handle h-midb" role="button" tabindex="-1" aria-label="Resize bar height" onpointerdown={(e) => { e.stopPropagation(); begin(e, "midb"); }}></div>
      {/if}
      {#if region}
        <div class="handle h-se" role="button" tabindex="-1" aria-label="Resize section" onpointerdown={(e) => { e.stopPropagation(); begin(e, "se"); }}></div>
      {/if}
    </div>
  {/if}
</div>
