<script>
  /** Palang placement surface: drag/resize the marking over a rendered page.
   *  Presentational — emits absolute point geometry {topPt,leftPt,heightPt,widthPt}
   *  only on pointer release. Initial geometry comes from `spec` on image load. */
  import { clamp, round1 } from "../../lib/domain.js";

  let { url, widthPt, heightPt, spec, onChange } = $props();

  let img;
  let wrap;
  let scale = $state(0); // px per pt
  let box = $state(null); // current geometry in points {x,y,w,h}
  let mode = $state(null); // null | "move" | "se" (region) | "midb" (band height)
  let sx = 0, sy = 0, bx = 0, by = 0, bw = 0, bh = 0;

  function init() {
    const w = img.clientWidth;
    if (!w || !widthPt) return;
    scale = w / widthPt;
    const region = spec.mode === "region";
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
    const region = spec.mode === "region";

    if (mode === "move") {
      if (region) b.x = clamp(bx + dx, 0, widthPt - bw);
      b.y = clamp(by + dy, 0, heightPt - bh);
    } else if (mode === "se" && region) {
      b.w = clamp(bw + dx, 24, widthPt - bx);
      b.h = clamp(bh + dy, 24, heightPt - by);
    } else if (mode === "midb" || (mode === "se" && !region)) {
      b.h = clamp(bh + dy, 12, heightPt - by);
    }
    box = b;
  }

  function release() {
    if (!mode || !box) return;
    mode = null;
    const patch = {};
    if (box.y >= 0.05) patch.topPt = round1(box.y);
    else patch.topPt = 0;
    if (spec.mode === "region") {
      if (box.x >= 0.05) patch.leftPt = round1(box.x);
      else patch.leftPt = 0;
      patch.widthPt = round1(box.w);
    }
    patch.heightPt = round1(box.h);
    onChange?.(patch);
  }

  const px = $derived(
    box
      ? { x: box.x * scale, y: box.y * scale, w: box.w * scale, h: box.h * scale }
      : { x: 0, y: 0, w: 0, h: 0 }
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
      style="left:{px.x}px; top:{px.y}px; width:{px.w}px; height:{px.h}px"
      onpointerdown={(e) => begin(e, "move")}
      role="application"
      aria-label="Palang marking"
    >
      <div class="handle h-midb" role="button" tabindex="-1" aria-label="Resize bar height" onpointerdown={(e) => { e.stopPropagation(); begin(e, "midb"); }}></div>
      {#if spec.mode === "region"}
        <div class="handle h-se" role="button" tabindex="-1" aria-label="Resize section" onpointerdown={(e) => { e.stopPropagation(); begin(e, "se"); }}></div>
      {/if}
    </div>
  {/if}
</div>
