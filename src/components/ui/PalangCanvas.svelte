<script>
  /** Palang placement surface: a fitted, zoomable page preview with a freely
   *  draggable, resizable marking (lines band, filled bar, or region).
   *  Presentational — emits absolute point geometry {topPt,leftPt,heightPt,widthPt}
   *  on release. The lines band measures its width from the live text, like the
   *  server. Selection: the marking shows handles while selected; Delete/Esc
   *  remove/deselect it; tap the page to re-add it after deleting. */
  import { onMount } from "svelte";
  import { fittedPageSize, round1 } from "../../lib/domain.js";

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

  // The visible image is letterboxed inside the page box (the server page
  // at margin 0), so the marking must interact in IMAGE space: the clamps,
  // the overlay offset and the emitted points all shift by the letterbox
  // margin. PDF pages fill the box, so their offsets are zero.
  const imgDims = $derived(
    fitContain && img && img.naturalWidth > 0
      ? fittedPageSize(img.naturalWidth, img.naturalHeight, widthPt, heightPt)
      : null
  );
  const viewW = $derived(imgDims ? imgDims.w : widthPt); // interaction space (pt)
  const viewH = $derived(imgDims ? imgDims.h : heightPt);
  const imgOffX = $derived((widthPt - viewW) / 2); // letterbox margin (pt)
  const imgOffY = $derived((heightPt - viewH) / 2);

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
    return Math.min(6, Math.max(0.3, z));
  }
  function zoomBy(factor) {
    zoom = clampZoom(zoom * factor);
  }
  function onWheel(e) {
    e.preventDefault();
    zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12);
  }

  /** Fit the page to BOTH frame dimensions, so at 100% the whole image is
   *  visible, the marking is centred ON the image, and nothing needs
   *  scrolling. The page box must always match the image rect exactly. */
  function fitPage() {
    const w = frame ? frame.clientWidth : 0;
    const h = frame ? frame.clientHeight : 0;
    if (!w || !widthPt) return;
    fitScale = Math.min(w / widthPt, (h || w) / heightPt);
    // Re-centre only at fit (zoom 1): while zoomed, keep the marking where
    // the user put it and never chase a moving frame.
    if (zoom === 1) box = defaultBox();
  }

  function fitView() {
    // Industrial-standard recovery: whole image visible, marking centred.
    zoom = 1;
    fitPage();
    if (frame) frame.scrollTop = 0;
  }

  function ensureFit() {
    if (zoom > 1) return;
    fitPage();
    // Self-correcting: if the page still overflows the frame at 100%
    // (a first fit may have read the frame height before layout), keep
    // re-fitting until the whole image is visible. Idempotent, so this
    // converges and stops.
    if (frame && frame.scrollHeight > frame.clientHeight + 1) {
      requestAnimationFrame(ensureFit);
    }
  }

  onMount(() => {
    // Re-fit whenever the frame's layout changes (modal fade-in, image
    // decode, font swap, first paint) so the whole image always stays
    // visible at 100% — a stale one-shot fit is what made the marking
    // land on a hidden part of the page.
    let ro = null;
    if (typeof ResizeObserver !== "undefined" && frame) {
      ro = new ResizeObserver(() => {
        // Re-fit only at fit zoom: while zoomed, the frame may resize from
        // overflow/scrollbar changes and must not fight the user's zoom.
        if (zoom === 1) fitPage();
      });
      ro.observe(frame);
    }
    window.addEventListener("resize", fitPage);
    window.addEventListener("keydown", onWindowKey);
    window.addEventListener("pointerup", releaseHeld);
    window.addEventListener("pointercancel", releaseHeld);
    window.addEventListener("blur", releaseHeld);
    window.addEventListener("pointerdown", cancelStuck, true);
    ensureFit();
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", fitPage);
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
    // Spec points are page-space; the canvas works in image space (the
    // letterboxed photo), so convert before use. Null points mean centred.
    const specL = spec.leftPt != null ? spec.leftPt - imgOffX : null;
    const specT = spec.topPt != null ? spec.topPt - imgOffY : null;
    if (region) {
      const wpt = spec.widthPt ?? 180;
      const hpt = spec.heightPt ?? (region ? 28 : 48);
      return {
        x: specL ?? (viewW - wpt) / 2,
        y: specT ?? (viewH - hpt) / 2,
        w: Math.min(wpt, viewW),
        h: hpt,
      };
    }
    if (lines) {
      // Clamp so the marking never starts (or recentres) outside the image,
      // even when the text is wider than the page.
      return {
        x: Math.max(0, specL ?? (viewW - lineLenPt) / 2),
        y: Math.max(0, specT ?? (viewH - blockHPt) / 2),
      };
    }
    // filled band: full width of the image
    const hpt = spec.heightPt ?? 48;
    return { x: 0, y: specT ?? (viewH - hpt) / 2, w: viewW, h: hpt };
  }

  function fit() {
    fitPage();
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

  /** The marking's centre in VIEWPORT coordinates (pointer space). The box
   *  layout is wrap-relative, so any frame scroll or centring offset would
   *  skew the atan2 angle unless translated here. */
  function boxCenterScreen() {
    const wr = wrap.getBoundingClientRect();
    return { x: wr.left + px.x + px.w / 2, y: wr.top + px.y + px.h / 2 };
  }

  function drag(e) {
    if (!mode || !box || !scale) return;

    if (mode === "rotate") {
      const c = boxCenterScreen();
      let deg = ((Math.atan2(e.clientY - c.y, e.clientX - c.x) - rotBase) * 180) / Math.PI;
      deg = ((deg % 360) + 360) % 360;
      if (Math.abs(deg - (spec.rotationDeg ?? 0)) > 0.2) onChange?.({ rotationDeg: round1(deg) });
      if (ov) ov.scrollIntoView({ block: "nearest", inline: "nearest" });
      return;
    }

    const dx = (e.clientX - sx) / scale;
    const dy = (e.clientY - sy) / scale;
    const b = { ...box };
    const w = lines ? lineLenPt : bw;
    const h = lines ? blockHPt : bh;

    if (mode === "move") {
      if (lines || region) {
        // The marking may overhang the left/right edges when it is wider
        // than the image (stretch it to fill every pixel); at least 32 pt of
        // it always stays on the image so it can never be lost. Markings
        // that fit stay fully inside, as before.
        const over = w > viewW;
        const lo = over ? -(w - 32) : 0;
        const hi = over ? viewW - 32 : Math.max(0, viewW - w);
        b.x = clampPt(bx + dx, lo, hi);
      }
      b.y = clampPt(by + dy, 0, Math.max(0, viewH - h));
    } else if (region && mode === "se") {
      b.w = clampPt(bw + dx, MIN_SIDE, viewW - bx);
      b.h = clampPt(bh + dy, MIN_SIDE, viewH - by);
    } else if (region && mode === "nw") {
      b.x = clampPt(bx + dx, 0, bx + bw - MIN_SIDE);
      b.y = clampPt(by + dy, 0, by + bh - MIN_SIDE);
      b.w = bw + (bx - b.x);
      b.h = bh + (by - b.y);
    } else if (region && mode === "ne") {
      b.w = clampPt(bw + dx, MIN_SIDE, viewW - bx);
      b.y = clampPt(by + dy, 0, by + bh - MIN_SIDE);
      b.h = bh + (by - b.y);
    } else if (region && mode === "sw") {
      b.x = clampPt(bx + dx, 0, bx + bw - MIN_SIDE);
      b.w = bw + (bx - b.x);
      b.h = clampPt(bh + dy, MIN_SIDE, viewH - by);
    } else if (mode === "midb" && !lines) {
      b.h = clampPt(bh + dy, 12, viewH - by);
    } else if (mode === "scale" && lines) {
      // Stretch the marking like the crop box: drag scales the text size
      // exponentially (doubles roughly every 200px of drag), with no
      // practical size ceiling — users decide how big the marking should be.
      const f = clampPt(sf0 * Math.pow(1.0035, dx + dy), 6, 240);
      if (Math.abs(f - (spec.fontSize ?? 18)) > 0.1) onChange?.({ fontSize: round1(f) });
      return;
    }
    box = b;
    // Keep the marking visible while dragging (the frame may be scrolled/zoomed).
    if (ov && mode) ov.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function beginRotate(e) {
    if (!box || !armed) return;
    const c = boxCenterScreen();
    rotBase = Math.atan2(e.clientY - c.y, e.clientX - c.x) - ((spec.rotationDeg ?? 0) * Math.PI) / 180;
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
    const patch = { topPt: round1(imgOffY + box.y), heightPt: round1(box.h ?? blockHPt) };
    if (lines || region) patch.leftPt = round1(imgOffX + box.x);
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
    const patch = { topPt: round1(imgOffY + b.y), heightPt: round1(b.h ?? blockHPt) };
    if (lines || region) patch.leftPt = round1(imgOffX + b.x);
    if (region) patch.widthPt = round1(b.w);
    onChange?.(patch);
  }

  function centerReset() {
    // Recentre from scratch — never from stale spec coordinates, so the
    // marking can't get stuck bottom-right after a previous drag.
    box = lines
      ? { x: Math.max(0, (viewW - lineLenPt) / 2), y: Math.max(0, (viewH - blockHPt) / 2) }
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
      ? {
          x: (imgOffX + geom.x) * scale,
          y: (imgOffY + geom.y) * scale,
          w: geom.w * scale,
          h: geom.h * scale,
        }
      : { x: 0, y: 0, w: 0, h: 0 }
  );
  const borderW = $derived(lines ? Math.max(1, Math.round(1.2 * scale)) : 2);
  let pageBoxEl; // plain let: bind:this on $state miscompiles in this child
  // Apply the fitted width imperatively (Svelte 5 template-style sizing is
  // non-reactive in this child). Read fitScale/zoom directly in the effect:
  // reading them through a $derived intermediary does not re-run it, while
  // direct state reads do.
  $effect(() => {
    const el = fitContain ? pageBoxEl : img;
    if (!el) return;
    const w = fitScale > 0 ? `${fitScale * widthPt * zoom}px` : "100%";
    el.style.width = w;
    el.style.maxWidth = zoom <= 1 ? "100%" : "none";
  });
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
          bind:this={pageBoxEl}
          class="page-box"
          style:aspect-ratio={`${widthPt} / ${heightPt}`}
          style:margin="0 auto"
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
          onload={fit}
          onpointerdown={(e) => e.preventDefault()}
        />
        {@render overlayBox()}
      {/if}
    </div>
  </div>

  <div class="canvas-zoom">
    <button type="button" class="btn btn-sm" aria-label="Show the whole image" onclick={fitView}>
      Fit view
    </button>
    <button type="button" class="btn btn-sm" aria-label="Reset marking position to the middle" onclick={centerReset}>
      Reset position
    </button>
  </div>
</div>
