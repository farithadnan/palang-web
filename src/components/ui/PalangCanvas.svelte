<script>
  /** Palang placement surface: a fitted, zoomable page preview with a freely
   *  draggable, resizable marking (lines band, filled bar, or region).
   *  Presentational — emits absolute point geometry {topPt,leftPt,heightPt,widthPt}
   *  on release. The lines band measures its width from the live text, like the
   *  server. Selection: the marking shows handles while selected; Delete/Esc
   *  remove/deselect it; tap the page to re-add it after deleting. */
  import { onMount } from "svelte";
  import { round1 } from "../../lib/domain.js";

  let { url, widthPt, heightPt, spec, onChange, fitContain = false, class: cls = "" } = $props();

  let img;
  let wrap;
  let frame;
  let ov; // overlay element (for keeping it in view while dragging)
  let fitScale = $state(0); // px per pt at zoom 1 (fitted)
  let zoom = $state(1);
  let box = $state(null); // points; lines band keeps x/y only
  let mode = $state(null); // null | "move" | corners (region) | "midb" (band height)
  let selected = $state(true);
  let sx = 0, sy = 0, bx = 0, by = 0, bw = 0, bh = 0, sf0 = 18, rotBase = 0;
  let pointers = new Map(); // active background touches (pinch zoom)

  const region = $derived(spec.mode === "region");
  const lines = $derived(spec.mode === "band" && spec.style === "lines");
  const armed = $derived(!!spec.armed);
  const scale = $derived(fitScale * zoom);
  const showHandles = $derived(armed && selected);

  const fontPt = $derived(spec.fontSize ?? 18); // text size drives the whole lines band
  const MIN_SIDE = 24; // pt

  function textWidthPt(text, sizePt) {
    if (!text) return 0;
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.font = "500 " + Math.round(sizePt * scale) + "px 'Inter Variable', system-ui, sans-serif";
    return Math.max(0, ctx.measureText(text).width / scale);
  }

  // Lines band geometry follows the live text (recomputed without remounting),
  // mirroring the server's measurements: font_size * 1.75 line box, second
  // line at 60% size, 10pt outer padding.
  const hasSecond = $derived(!!(spec.second ?? "").trim());
  const secondW = $derived(hasSecond ? textWidthPt(spec.second, fontPt * 0.6) : 0);
  const lineLenPt = $derived(
    lines ? Math.max(40, Math.max(textWidthPt(spec.text || "", fontPt), secondW) + 14) : 0
  );
  const blockHPt = $derived(lines ? 10 + fontPt * 1.75 + (hasSecond ? fontPt * 1.14 : 0) : 0);

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

  function pageWidth() {
    // Contain mode: the page box fills the frame, so measure the frame (the
    // shrink-wrapped wrap has no width for a non-replaced element).
    if (fitContain) return frame ? frame.clientWidth : 0;
    return img ? img.clientWidth : 0;
  }

  function resizeFit() {
    const w = pageWidth();
    if (!w || !widthPt) return;
    fitScale = w / widthPt;
  }

  function ensureFit() {
    if (fitScale > 0) return;
    const w = pageWidth();
    if (w > 0) {
      fit();
      return;
    }
    // The frame may not have laid out yet; re-measure on the next frame.
    requestAnimationFrame(ensureFit);
  }

  onMount(() => {
    window.addEventListener("resize", resizeFit);
    window.addEventListener("keydown", onWindowKey);
    window.addEventListener("pointerup", releaseHeld);
    window.addEventListener("pointercancel", releaseHeld);
    window.addEventListener("blur", releaseHeld);
    window.addEventListener("pointerdown", cancelStuck, true);
    ensureFit();
    return () => {
      window.removeEventListener("resize", resizeFit);
      window.removeEventListener("keydown", onWindowKey);
      window.removeEventListener("pointerup", releaseHeld);
      window.removeEventListener("pointercancel", releaseHeld);
      window.removeEventListener("blur", releaseHeld);
      window.removeEventListener("pointerdown", cancelStuck, true);
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
    const w = pageWidth();
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
    sf0 = spec.fontSize ?? 18;
    // Only arm the drag if pointer capture is actually held — otherwise the
    // pointerup can be lost mid-drag and the marking would follow the cursor
    // forever.
    mode = m;
    try {
      wrap.setPointerCapture(e.pointerId);
    } catch {
      mode = null;
      return;
    }
    selected = true;
    e.preventDefault();
    e.stopPropagation();
  }

  function wrapDown(e) {
    // Track background touches for pinch zoom.
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    // A background press always ends any held drag (stuck-drag safety net).
    if (mode) releaseHeld();
    // Page background: re-add a deleted marking, or deselect the current one.
    if (!armed) {
      selected = true;
      onChange?.({ armed: true, topPt: null, leftPt: null });
      return;
    }
    if (!e.target.closest(".overlay-box")) selected = false;
  }

  function drag(e) {
    if (!mode || !box || !scale) return;

    if (mode === "rotate") {
      const cx = px.x + px.w / 2;
      const cy = px.y + px.h / 2;
      let deg = ((Math.atan2(e.clientY - cy, e.clientX - cx) - rotBase) * 180) / Math.PI;
      deg = ((deg % 360) + 360) % 360;
      if (Math.abs(deg - (spec.rotationDeg ?? 0)) > 0.2) onChange?.({ rotationDeg: round1(deg) });
      return;
    }

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
    } else if (mode === "scale" && lines) {
      // Stretch the marking like the crop box: drag scales the text size,
      // and the band (lines + text) grows with it.
      const f = clampPt(sf0 + (dx + dy) * 0.25, 10, 44);
      if (Math.abs(f - (spec.fontSize ?? 18)) > 0.1) onChange?.({ fontSize: round1(f) });
      return;
    }
    box = b;
    // Keep the marking visible while dragging (the frame may be scrolled/zoomed).
    if (ov && mode) ov.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function beginRotate(e) {
    if (!box || !armed) return;
    const cx = px.x + px.w / 2;
    const cy = px.y + px.h / 2;
    rotBase = Math.atan2(e.clientY - cy, e.clientX - cx) - ((spec.rotationDeg ?? 0) * Math.PI) / 180;
    mode = "rotate";
    try {
      wrap.setPointerCapture(e.pointerId);
    } catch {
      mode = null;
      return;
    }
    selected = true;
    e.preventDefault();
    e.stopPropagation();
  }

  /** Safety nets for a lost pointerup: a stuck drag must never survive. */
  function releaseHeld() {
    mode = null;
  }
  function cancelStuck(e) {
    // Starting a new interaction outside the canvas always ends a held drag.
    if (mode && !e.target.closest?.(".canvas-wrap")) releaseHeld();
  }

  function release(e) {
    if (!mode) return;
    if (mode === "rotate") {
      mode = null;
      try {
        wrap.releasePointerCapture(e.pointerId);
      } catch {
        /* pointer already released */
      }
      return;
    }
    if (!box) return;
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
    // Recentre from scratch — never from stale spec coordinates, so the
    // marking can't get stuck bottom-right after a previous drag.
    box = lines
      ? { x: Math.max(0, (widthPt - lineLenPt) / 2), y: Math.max(0, (heightPt - blockHPt) / 2) }
      : defaultBox();
    onChange?.({ topPt: null, leftPt: null });
    // Un-scroll the frame so the recentred marking is actually in view.
    if (frame) frame.scrollTo({ top: 0, left: 0 });
  }

  // Keep the canvas box in sync when geometry is edited in the number fields
  // (height/width), without remounting the canvas or losing zoom/position.
  $effect(() => {
    if (!box || !armed || lines) return;
    const h = spec.heightPt ?? 48;
    if (Math.abs((box.h ?? h) - h) > 0.5) box = { ...box, h };
    if (region) {
      const w = spec.widthPt ?? 180;
      if (Math.abs((box.w ?? w) - w) > 0.5) box = { ...box, w };
    }
  });

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
  // fitContain: the page box is exactly the page shape and the photo is
  // letterboxed inside it (object-fit: contain), mirroring the server's
  // image->PDF placement so preview and output always agree.
  const imgStyle = $derived(
    fitContain
      ? `width:${imgWidth}; height:${fitScale * heightPt * zoom}px; object-fit:contain; object-position:center; max-width:${zoom <= 1 ? "100%" : "none"}; max-height:74vh;`
      : `width:${imgWidth}; max-width:${zoom <= 1 ? "100%" : "none"}; max-height:74vh;`
  );
  const boxStyle = $derived(
    [
      `left:${px.x}px`,
      `top:${px.y}px`,
      `width:${px.w}px`,
      `height:${px.h}px`,
      lines
        ? `border-top-width:${borderW}px; border-bottom-width:${borderW}px; border-top-style:solid; border-bottom-style:solid; border-color:${spec.color}`
        : "",
      rotation ? `transform:rotate(${rotation}deg); transform-origin:center center;` : "",
    ]
      .filter(Boolean)
      .join("; ")
  );
  const labelStyle = $derived(lines ? `color:${spec.color}; font-size:${Math.round(fontPt * scale)}px` : "");
  const rotation = $derived(((spec.rotationDeg ?? 0) % 360 + 360) % 360);
  const pageBoxStyle = $derived(
    `aspect-ratio:${widthPt}/${heightPt}; width:${imgWidth}; max-width:${zoom <= 1 ? "100%" : "none"}; max-height:74vh; margin:0 auto;`
  );
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
      {#snippet overlayBox()}
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
            {#if showHandles && lines}
              <div class="rotate-handle" role="button" tabindex="-1" aria-label="Rotate the marking" onpointerdown={(e) => { e.preventDefault(); e.stopPropagation(); beginRotate(e); }}></div>
              <div class="handle h-se" role="button" tabindex="-1" aria-label="Scale the marking" onpointerdown={(e) => { e.preventDefault(); begin(e, "scale"); }}></div>
            {/if}
            {#if showHandles && region}
              <div class="handle h-nw" role="button" tabindex="-1" aria-label="Resize top-left" onpointerdown={(e) => { e.preventDefault(); begin(e, "nw"); }}></div>
              <div class="handle h-ne" role="button" tabindex="-1" aria-label="Resize top-right" onpointerdown={(e) => { e.preventDefault(); begin(e, "ne"); }}></div>
              <div class="handle h-sw" role="button" tabindex="-1" aria-label="Resize bottom-left" onpointerdown={(e) => { e.preventDefault(); begin(e, "sw"); }}></div>
              <div class="handle h-se" role="button" tabindex="-1" aria-label="Resize bottom-right" onpointerdown={(e) => { e.preventDefault(); begin(e, "se"); }}></div>
            {/if}
          </div>
        {/if}
      {/snippet}

      {#if fitContain}
        <div
          class="page-box"
          style={pageBoxStyle}
          role="application"
          aria-label="Page preview"
        >
          <img
            bind:this={img}
            src={url}
            alt=""
            draggable="false"
            style="width:100%; height:100%; object-fit:contain; object-position:center;"
            onload={fit}
            onpointerdown={(e) => e.preventDefault()}
          />
          {@render overlayBox()}
        </div>
      {:else}
        <img
          bind:this={img}
          src={url}
          alt=""
          draggable="false"
          style={imgStyle}
          onload={fit}
          onpointerdown={(e) => e.preventDefault()}
        />
        {@render overlayBox()}
      {/if}
    </div>
  </div>

  <div class="canvas-zoom">
    <span class="caption">{Math.round(zoom * 100)}%</span>
    <button type="button" class="btn btn-sm" aria-label="Reset marking position to the middle" onclick={centerReset}>
      Reset position
    </button>
  </div>
</div>
