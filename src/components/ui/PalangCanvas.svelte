<script>
  /** Palang placement surface: a fitted, zoomable page preview with a freely
   *  draggable marking (lines band, filled bar, or region). Presentational —
   *  emits absolute point geometry {topPt,leftPt,heightPt,widthPt} on release.
   *  The lines band measures its width from the live text, like the server. */
  import { onMount } from "svelte";
  import { round1 } from "../../lib/domain.js";

  let { url, widthPt, heightPt, spec, onChange, class: cls = "" } = $props();

  let img;
  let wrap;
  let fitScale = $state(0); // px per pt at zoom 1 (fitted)
  let zoom = $state(1);
  let box = $state(null); // points; lines band keeps x/y only
  let mode = $state(null); // null | "move" | "se" (region) | "midb" (filled band)
  let sx = 0, sy = 0, bx = 0, by = 0, bw = 0, bh = 0;

  const region = $derived(spec.mode === "region");
  const lines = $derived(spec.mode === "band" && spec.style === "lines");
  const scale = $derived(fitScale * zoom);

  const LINES_LINE_H = 24.3; // ~18pt text line height
  const LINES_SECOND_H = 16.2;

  function textWidthPt(text, sizePt) {
    if (!text) return 0;
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.font = "500 " + Math.round(sizePt * scale) + "px 'Inter Variable', system-ui, sans-serif";
    return Math.max(0, ctx.measureText(text).width / scale);
  }

  // Lines band geometry follows the live text (recomputed without remounting).
  const lineLenPt = $derived(
    lines ? Math.max(40, Math.max(textWidthPt(spec.text || "", 18), textWidthPt(spec.second || "", 18)) + 14) : 0
  );
  const blockHPt = $derived(lines ? 6 + LINES_LINE_H + (spec.second ? 4 + LINES_SECOND_H : 0) + 6 : 0);

  function clampZoom(z) {
    return Math.min(4, Math.max(0.4, z));
  }
  function zoomBy(factor) {
    zoom = clampZoom(zoom * factor);
  }
  function onWheel(e) {
    e.preventDefault();
    zoom = clampZoom(zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12));
  }

  function resizeFit() {
    if (!img || !widthPt) return;
    fitScale = img.clientWidth / widthPt;
  }

  onMount(() => {
    window.addEventListener("resize", resizeFit);
    return () => window.removeEventListener("resize", resizeFit);
  });

  function fit() {
    const w = img.clientWidth;
    if (!w || !widthPt) return;
    fitScale = w / widthPt;
    if (lines) {
      const x = spec.leftPt ?? (widthPt - lineLenPt) / 2;
      const y = spec.topPt ?? (heightPt - blockHPt) / 2;
      box = { x, y };
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
    bw = box.w ?? 0;
    bh = box.h ?? 0;
    mode = m;
    wrap.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function clampPt(v, lo, hi) {
    return Math.min(hi, Math.max(lo, v));
  }

  function drag(e) {
    if (!mode || !box || !scale) return;
    const dx = (e.clientX - sx) / scale;
    const dy = (e.clientY - sy) / scale;
    const b = { ...box };
    const w = lines ? lineLenPt : bw;
    const h = lines ? blockHPt : bh;

    if (mode === "move") {
      if (lines || region) b.x = clampPt(bx + dx, 0, Math.max(0, widthPt - w));
      b.y = clampPt(by + dy, 0, Math.max(0, heightPt - h));
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
    const patch = { topPt: round1(box.y), heightPt: round1(box.h ?? blockHPt) };
    if (lines || region) patch.leftPt = round1(box.x);
    if (region) patch.widthPt = round1(box.w);
    onChange?.(patch);
  }

  const geom = $derived(
    box
      ? lines
        ? { x: box.x, y: box.y, w: lineLenPt, h: blockHPt }
        : { x: box.x, y: box.y, w: box.w, h: box.h }
      : null
  );
  const px = $derived(
    geom
      ? { x: geom.x * scale, y: geom.y * scale, w: geom.w * scale, h: geom.h * scale }
      : { x: 0, y: 0, w: 0, h: 0 }
  );
  const borderW = $derived(lines ? Math.max(1, Math.round(1.2 * scale)) : 2);
  const imgWidth = $derived(fitScale > 0 ? fitScale * widthPt * zoom : "100%");
  const boxStyle = $derived(
    [
      `left:${px.x}px`,
      `top:${px.y}px`,
      `width:${px.w}px`,
      `height:${px.h}px`,
      lines
        ? `border-top-width:${borderW}px; border-bottom-width:${borderW}px; border-top-style:solid; border-bottom-style:solid; border-color:${spec.color}`
        : "",
    ]
      .filter(Boolean)
      .join("; ")
  );
  const labelStyle = $derived(lines ? `color:${spec.color}; font-size:${Math.round(18 * scale)}px` : "");
</script>

<div class={cls}>
  <div class="canvas-zoom">
    <span class="caption">Zoom</span>
    <button type="button" class="btn btn-sm" aria-label="Zoom out" onclick={() => zoomBy(1 / 1.25)}>−</button>
    <span class="caption">{Math.round(zoom * 100)}%</span>
    <button type="button" class="btn btn-sm" aria-label="Zoom in" onclick={() => zoomBy(1.25)}>+</button>
    <button type="button" class="btn btn-sm" aria-label="Fit page" onclick={() => (zoom = 1)}>Fit</button>
  </div>

  <div class="canvas-frame" onwheel={onWheel}>
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
        style="width:{imgWidth}; max-width:{zoom <= 1 ? '100%' : 'none'}; max-height:74vh"
        onload={fit}
        onpointerdown={(e) => e.preventDefault()}
      />
      {#if geom && scale > 0}
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
  </div>
</div>
