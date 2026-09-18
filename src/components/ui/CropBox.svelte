<script>
  /** Image crop surface: drag a rectangle on the preview to choose what to keep.
   *  Presentational — emits crop fractions {l,t,r,b} (0..1) only on pointer release. */
  import { clamp, round2 } from "../../lib/domain.js";

  let { url, crop = null, onChange, filter = "none" } = $props();

  let wrap;
  let box = $state(null); // displayed px {x,y,w,h}; null = full image
  let mode = $state(null); // null | "draw" | "move" | "nw" | "ne" | "sw" | "se"
  let sx = 0, sy = 0, bx = 0, by = 0, bw = 0, bh = 0;

  function rect() {
    return wrap.getBoundingClientRect();
  }

  function initFromCrop() {
    const r = rect();
    if (!crop || r.width <= 0) {
      box = null;
      return;
    }
    box = {
      x: crop.l * r.width,
      y: crop.t * r.height,
      w: (crop.r - crop.l) * r.width,
      h: (crop.b - crop.t) * r.height,
    };
  }

  function begin(e, m) {
    const r = rect();
    sx = e.clientX;
    sy = e.clientY;
    bx = box ? box.x : 0;
    by = box ? box.y : 0;
    bw = box ? box.w : 0;
    bh = box ? box.h : 0;
    mode = m;
    wrap.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function wrapDown(e) {
    if (e.target.closest(".overlay-box")) return; // handled by box/handles
    const r = rect();
    if (r.width <= 0) return;
    sx = e.clientX;
    sy = e.clientY;
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    bx = x;
    by = y;
    bw = 0;
    bh = 0;
    mode = "draw";
    box = { x, y, w: 24, h: 24 };
    wrap.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function drag(e) {
    if (!mode || !box) return;
    const r = rect();
    if (!r.width) return;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    let b = { ...box };

    if (mode === "draw") {
      const cx = e.clientX - r.left;
      const cy = e.clientY - r.top;
      b.x = Math.min(bx, cx);
      b.y = Math.min(by, cy);
      b.w = clamp(Math.abs(cx - bx), 24, r.width);
      b.h = clamp(Math.abs(cy - by), 24, r.height);
    } else if (mode === "move") {
      b.x = clamp(bx + dx, 0, r.width - bw);
      b.y = clamp(by + dy, 0, r.height - bh);
    } else if (mode === "se") {
      b.w = clamp(bw + dx, 24, r.width - bx);
      b.h = clamp(bh + dy, 24, r.height - by);
    } else if (mode === "nw") {
      b.x = clamp(bx + dx, 0, bx + bw - 24);
      b.y = clamp(by + dy, 0, by + bh - 24);
      b.w = bw + (bx - b.x);
      b.h = bh + (by - b.y);
    } else if (mode === "ne") {
      b.y = clamp(by + dy, 0, by + bh - 24);
      b.h = bh + (by - b.y);
      b.w = clamp(bw + dx, 24, r.width - bx);
    } else if (mode === "sw") {
      b.x = clamp(bx + dx, 0, bx + bw - 24);
      b.w = bw + (bx - b.x);
      b.h = clamp(bh + dy, 24, r.height - by);
    }
    box = b;
  }

  function release() {
    if (!mode) return;
    mode = null;
    const r = rect();
    if (!box || !r.width) return;
    onChange?.({
      l: round2(box.x / r.width),
      t: round2(box.y / r.height),
      r: round2((box.x + box.w) / r.width),
      b: round2((box.y + box.h) / r.height),
    });
  }
</script>

<div
  class="canvas-wrap"
  bind:this={wrap}
  role="application"
  aria-label="Crop area"
  onpointerdown={wrapDown}
  onpointermove={drag}
  onpointerup={release}
  onpointercancel={release}
>
  <img
    src={url}
    alt=""
    draggable="false"
    style="filter:{filter}"
    onload={initFromCrop}
    onpointerdown={(e) => e.preventDefault()}
  />
  {#if box}
    <div
      class="overlay-box"
      style="left:{box.x}px; top:{box.y}px; width:{box.w}px; height:{box.h}px"
      onpointerdown={(e) => begin(e, "move")}
      role="application"
      aria-label="Crop area"
    >
      <div class="handle h-nw" role="button" tabindex="-1" aria-label="Resize top-left" onpointerdown={(e) => { e.stopPropagation(); begin(e, "nw"); }}></div>
      <div class="handle h-ne" role="button" tabindex="-1" aria-label="Resize top-right" onpointerdown={(e) => { e.stopPropagation(); begin(e, "ne"); }}></div>
      <div class="handle h-sw" role="button" tabindex="-1" aria-label="Resize bottom-left" onpointerdown={(e) => { e.stopPropagation(); begin(e, "sw"); }}></div>
      <div class="handle h-se" role="button" tabindex="-1" aria-label="Resize bottom-right" onpointerdown={(e) => { e.stopPropagation(); begin(e, "se"); }}></div>
    </div>
  {/if}
</div>
