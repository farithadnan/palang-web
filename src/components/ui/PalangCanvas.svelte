<script>
  /** Palang placement surface: a fitted, zoomable page preview with a freely
   *  draggable, resizable marking (lines band, filled bar, or region).
   *  Presentational — emits absolute point geometry {topPt,leftPt,heightPt,widthPt}
   *  on release. The lines band measures its width from the live text, like the
   *  server. Selection: the marking shows handles while selected; Delete/Esc
   *  remove/deselect it; tap the page to re-add it after deleting. */
  import { onMount } from "svelte";
  import { round1 } from "../../lib/domain.js";

  let { url, widthPt, heightPt, spec, onChange, class: cls = "" } = $props();

  let img;
  let wrap;
  let frame;
  let ov; // overlay element (for keeping it in view while dragging)
  let fitScale = $state(0); // px per pt at zoom 1 (fitted)
  let zoom = $state(1);
  let box = $state(null); // points; lines band keeps x/y only
  let mode = $state(null); // null | "move" | corners (region) | "midb" (band height)
  let selected = $state(true);
  let sx = 0, sy = 0, bx = 0, by = 0, bw = 0, bh = 0;
  let pointers = new Map(); // active background touches (pinch zoom)

  const region = $derived(spec.mode === "region");
  const lines = $derived(spec.mode === "band" && spec.style === "lines");
  const armed = $derived(!!spec.armed);
  const scale = $derived(fitScale * zoom);
  const showHandles = $derived(armed && selected);

  const LINES_LINE_H = 24.3; // ~18pt text line height
  const LINES_SECOND_H = 16.2;
  const MIN_SIDE = 24; // pt

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
    zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12);
  }

  function resizeFit() {
    if (!img || !widthPt) return;
    fitScale = img.clientWidth / widthPt;
  }

  onMount(() => {
    window.addEventListener("resize", resizeFit);
    window.addEventListener("keydown", onWindowKey);
    return () => {
      window.removeEventListener("resize", resizeFit);
      window.removeEventListener("keydown", onWindowKey);
    };
  });

  // Arrow/Delete/Esc work without focusing the canvas, but never while typing
  // in a form field.
  function onWindowKey(e) {
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
    onKey(e);
  }

  function defaultBox() {
    if (region) {
      const wpt = spec.widthPt ?? 180;
      const hpt = spec.heightPt ?? (region ? 28 : 48);
      return {
        x: spec.leftPt ?? (widthPt - wpt) / 2,
        y: spec.topPt ?? (heightPt - hpt) / 2,
        w: wpt,
        h: hpt,
      };
    }
    if (lines) {
      return { x: spec.leftPt ?? (widthPt - lineLenPt) / 2, y: spec.topPt ?? (heightPt - blockHPt) / 2 };
    }
    // filled band: full width
    const hpt = spec.heightPt ?? 48;
    return { x: 0, y: spec.topPt ?? (heightPt - hpt) / 2, w: widthPt, h: hpt };
  }

  function fit() {
    const w = img.clientWidth;
    if (!w || !widthPt) return;
    fitScale = w / widthPt;
    box = defaultBox();
  }

  function clampPt(v, lo, hi) {
    return Math.min(hi, Math.max(lo, v));
  }

  function begin(e, m) {
    if (!box || !armed) return;
    sx = e.clientX;
    sy = e.clientY;
    bx = box.x;
    by = box.y;
    bw = box.w ?? 0;
    bh = box.h ?? 0;
    mode = m;
    selected = true;
    wrap.setPointerCapture(e.pointerId);
    e.preventDefault();
    e.stopPropagation();
  }

  function wrapDown(e) {
    // Track background touches for pinch zoom.
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    // Page background: re-add a deleted marking, or deselect the current one.
    if (!armed) {
      selected = true;
      onChange?.({ armed: true, topPt: null, leftPt: null });
      return;
    }
    if (e.target === wrap || e.target === img) selected = false;
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
    } else if (region && mode === "se") {
      b.w = clampPt(bw + dx, MIN_SIDE, widthPt - bx);
      b.h = clampPt(bh + dy, MIN_SIDE, heightPt - by);
    } else if (region && mode === "nw") {
      b.x = clampPt(bx + dx, 0, bx + bw - MIN_SIDE);
      b.y = clampPt(by + dy, 0, by + bh - MIN_SIDE);
      b.w = bw + (bx - b.x);
      b.h = bh + (by - b.y);
    } else if (region && mode === "ne") {
      b.w = clampPt(bw + dx, MIN_SIDE, widthPt - bx);
      b.y = clampPt(by + dy, 0, by + bh - MIN_SIDE);
      b.h = bh + (by - b.y);
    } else if (region && mode === "sw") {
      b.x = clampPt(bx + dx, 0, bx + bw - MIN_SIDE);
      b.w = bw + (bx - b.x);
      b.h = clampPt(bh + dy, MIN_SIDE, heightPt - by);
    } else if (mode === "midb" && !lines) {
      b.h = clampPt(bh + dy, 12, heightPt - by);
    }
    box = b;
    // Keep the marking visible while dragging (the frame may be scrolled/zoomed).
    if (ov && mode) ov.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function release(e) {
    if (!mode || !box) return;
    mode = null;
    try {
      wrap.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
    const patch = { topPt: round1(box.y), heightPt: round1(box.h ?? blockHPt) };
    if (lines || region) patch.leftPt = round1(box.x);
    if (region) patch.widthPt = round1(box.w);
    onChange?.(patch);
  }

  function emitMove(e) {
    drag(e);
    trackMove(e);
  }
  function emitUp(e) {
    release(e);
    trackUp(e);
  }

  function trackUp(e) {
    pointers.delete(e.pointerId);
  }
  function trackMove(e) {
    if (!pointers.has(e.pointerId) || pointers.size !== 2) {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      return;
    }
    const [a, b] = [...pointers.values()];
    const cur = Math.hypot(b.x - e.clientX, b.y - e.clientY);
    const prev = Math.hypot(b.x - a.x, b.y - a.y);
    if (prev > 0 && cur > 0) zoomBy(cur / prev);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }

  function onKey(e) {
    if (!armed || !selected || !box) return;
    const step = e.shiftKey ? 10 : 1;
    const b = { ...box };

    if (e.key === "ArrowLeft") b.x = clampPt(box.x - step, 0, Math.max(0, widthPt - (lines ? lineLenPt : box.w ?? 0)));
    else if (e.key === "ArrowRight") b.x = clampPt(box.x + step, 0, Math.max(0, widthPt - (lines ? lineLenPt : box.w ?? 0)));
    else if (e.key === "ArrowUp") b.y = clampPt(box.y - step, 0, Math.max(0, heightPt - (lines ? blockHPt : box.h ?? 0)));
    else if (e.key === "ArrowDown") b.y = clampPt(box.y + step, 0, Math.max(0, heightPt - (lines ? blockHPt : box.h ?? 0)));
    else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      onChange?.({ armed: false });
      selected = false;
      return;
    } else if (e.key === "Escape") {
      selected = false;
      return;
    } else return;

    e.preventDefault();
    box = b;
    const patch = { topPt: round1(b.y), heightPt: round1(b.h ?? blockHPt) };
    if (lines || region) patch.leftPt = round1(b.x);
    if (region) patch.widthPt = round1(b.w);
    onChange?.(patch);
  }

  function centerReset() {
    box = defaultBox();
    onChange?.({ topPt: null, leftPt: null });
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
  <div class="canvas-frame" bind:this={frame} onwheel={onWheel}>
    <div
      class="canvas-wrap"
      bind:this={wrap}
      role="application"
      aria-label="Page preview surface"
      onpointerdown={wrapDown}
      onpointermove={emitMove}
      onpointerup={emitUp}
      onpointercancel={emitUp}
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
      {#if armed && geom && scale > 0}
        <div
          bind:this={ov}
          class="overlay-box"
          class:overlay-lines={lines}
          class:selected={showHandles}
          style={boxStyle}
          onpointerdown={(e) => begin(e, "move")}
          onpointerup={emitUp}
          onpointercancel={release}
          role="application"
          aria-label={lines ? "Palang line marking" : "Palang marking"}
        >
          {#if lines}
            <span class="overlay-label" style={labelStyle}>{spec.text || ""}</span>
          {/if}
          {#if showHandles && !lines}
            <div class="handle h-midb" role="button" tabindex="-1" aria-label="Resize marking height" onpointerdown={(e) => { e.preventDefault(); begin(e, "midb"); }}></div>
          {/if}
          {#if showHandles && region}
            <div class="handle h-nw" role="button" tabindex="-1" aria-label="Resize top-left" onpointerdown={(e) => { e.preventDefault(); begin(e, "nw"); }}></div>
            <div class="handle h-ne" role="button" tabindex="-1" aria-label="Resize top-right" onpointerdown={(e) => { e.preventDefault(); begin(e, "ne"); }}></div>
            <div class="handle h-sw" role="button" tabindex="-1" aria-label="Resize bottom-left" onpointerdown={(e) => { e.preventDefault(); begin(e, "sw"); }}></div>
            <div class="handle h-se" role="button" tabindex="-1" aria-label="Resize bottom-right" onpointerdown={(e) => { e.preventDefault(); begin(e, "se"); }}></div>
          {/if}
        </div>
      {/if}
    </div>
  </div>

  <div class="canvas-zoom">
    <span class="caption">Zoom</span>
    <button type="button" class="btn btn-sm" aria-label="Zoom out" onclick={() => zoomBy(1 / 1.25)}>−</button>
    <span class="caption">{Math.round(zoom * 100)}%</span>
    <button type="button" class="btn btn-sm" aria-label="Zoom in" onclick={() => zoomBy(1.25)}>+</button>
    <button type="button" class="btn btn-sm" aria-label="Fit page to the editing area" onclick={() => (zoom = 1)}>Fit</button>
    <button type="button" class="btn btn-sm" aria-label="Reset marking position to the middle" onclick={centerReset}>
      Reset position
    </button>
  </div>
</div>
