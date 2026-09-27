/* Pure crop-viewport geometry for the full-screen cropper. No DOM.
 *
 * Coordinate model (stage-relative pixels):
 *   screen_x = stageW/2 + (img_x - imgW/2) * view.scale + view.tx
 * `frame` is the crop window in stage pixels; `view` places the image.
 * Keeping this maths out of the component makes it unit-testable and keeps
 * the Svelte file about gestures and rendering only. */

import { clamp } from "./domain.js";

/** Contain-scale that fits the whole image inside the stage. */
export function fitScale(stageW, stageH, imgW, imgH) {
  if (!stageW || !stageH || !imgW || !imgH) return 1;
  return Math.min(stageW / imgW, stageH / imgH);
}

/** Where the image sits on the stage for a given view. */
export function displayRect(view, imgW, imgH, stageW, stageH) {
  const halfW = (imgW / 2) * view.scale;
  const halfH = (imgH / 2) * view.scale;
  const cx = stageW / 2 + view.tx;
  const cy = stageH / 2 + view.ty;
  return {
    left: cx - halfW,
    top: cy - halfH,
    right: cx + halfW,
    bottom: cy + halfH,
    w: halfW * 2,
    h: halfH * 2,
  };
}

/** Keep the crop window inside the displayed image, with a floor on its size. */
export function clampFrame(frame, rect, minPx = 48) {
  const w = clamp(frame.w, Math.min(minPx, rect.w), rect.w);
  const h = clamp(frame.h, Math.min(minPx, rect.h), rect.h);
  return {
    x: clamp(frame.x, rect.left, rect.right - w),
    y: clamp(frame.y, rect.top, rect.bottom - h),
    w,
    h,
  };
}

/** Smallest scale at which the image still covers the whole crop window. */
export function coverScale(frame, imgW, imgH) {
  if (!imgW || !imgH) return 0;
  return Math.max(frame.w / imgW, frame.h / imgH);
}

/** Clamp a view so the image covers the frame and never zooms past maxScale. */
export function clampView(view, frame, imgW, imgH, stageW, stageH, maxScale = Infinity) {
  const min = coverScale(frame, imgW, imgH);
  const scale = clamp(view.scale, min, Math.max(min, maxScale));
  const halfW = (imgW / 2) * scale;
  const halfH = (imgH / 2) * scale;
  // Image right edge >= frame right, and image left edge <= frame left.
  const txMin = frame.x + frame.w - stageW / 2 - halfW;
  const txMax = frame.x - stageW / 2 + halfW;
  const tyMin = frame.y + frame.h - stageH / 2 - halfH;
  const tyMax = frame.y - stageH / 2 + halfH;
  return {
    scale,
    tx: clamp(view.tx, txMin, txMax),
    ty: clamp(view.ty, tyMin, tyMax),
  };
}

/** The crop the window currently selects, as image fractions {l,t,r,b}. */
export function cropFromView(frame, view, imgW, imgH, stageW, stageH) {
  if (!view.scale || !imgW || !imgH) return { l: 0, t: 0, r: 1, b: 1 };
  const toX = (sx) => clamp((sx - stageW / 2 - view.tx) / view.scale / imgW + 0.5, 0, 1);
  const toY = (sy) => clamp((sy - stageH / 2 - view.ty) / view.scale / imgH + 0.5, 0, 1);
  const l = toX(frame.x);
  const t = toY(frame.y);
  const r = clamp(toX(frame.x + frame.w), l, 1);
  const b = clamp(toY(frame.y + frame.h), t, 1);
  return { l, t, r, b };
}

/**
 * Focus the view: zoom so the crop window fills the stage (minus `pad`) while
 * keeping the SAME image region selected. Returns null when there is no room
 * to zoom (the window already fills the stage), so repeated handle releases do
 * not run away.
 */
export function focusView(frame, view, imgW, imgH, stageW, stageH, { pad = 0.06, maxScale = Infinity } = {}) {
  if (!frame.w || !frame.h || !view.scale) return null;
  const room = 1 - 2 * pad;
  const targetW = stageW * room;
  const targetH = stageH * room;
  const k = Math.min(targetW / frame.w, targetH / frame.h);
  if (k <= 1.001) return null;

  const scale = Math.min(view.scale * k, maxScale);
  const kk = scale / view.scale;
  if (kk <= 1.001) return null;

  const cx = frame.x + frame.w / 2;
  const cy = frame.y + frame.h / 2;
  const nextFrame = {
    x: cx - (frame.w * kk) / 2,
    y: cy - (frame.h * kk) / 2,
    w: frame.w * kk,
    h: frame.h * kk,
  };
  const nextView = {
    scale,
    tx: cx - stageW / 2 - (cx - stageW / 2 - view.tx) * kk,
    ty: cy - stageH / 2 - (cy - stageH / 2 - view.ty) * kk,
  };
  return {
    frame: clampFrame(nextFrame, displayRect(nextView, imgW, imgH, stageW, stageH), 48),
    view: clampView(nextView, nextFrame, imgW, imgH, stageW, stageH, maxScale),
  };
}