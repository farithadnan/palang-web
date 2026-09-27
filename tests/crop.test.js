import { describe, expect, it } from "vitest";
import {
  clampFrame,
  clampView,
  coverScale,
  cropFromView,
  displayRect,
  fitScale,
  focusView,
} from "../src/lib/crop.js";

const STAGE = { w: 500, h: 500 };
const IMG = { w: 1000, h: 1000 };

function centeredFit(imgW = IMG.w, imgH = IMG.h, stageW = STAGE.w, stageH = STAGE.h) {
  const scale = fitScale(stageW, stageH, imgW, imgH);
  return { scale, tx: 0, ty: 0 };
}

function contains(rect, frame) {
  return (
    rect.left <= frame.x + 1e-6 &&
    rect.right >= frame.x + frame.w - 1e-6 &&
    rect.top <= frame.y + 1e-6 &&
    rect.bottom >= frame.y + frame.h - 1e-6
  );
}

describe("fitScale", () => {
  it("contains the whole image inside the stage", () => {
    expect(fitScale(500, 500, 1000, 500)).toBeCloseTo(0.5);
    expect(fitScale(500, 500, 500, 1000)).toBeCloseTo(0.5);
  });
  it("guards against zero dimensions", () => {
    expect(fitScale(0, 0, 1000, 1000)).toBe(1);
    expect(fitScale(500, 500, 0, 0)).toBe(1);
  });
});

describe("displayRect", () => {
  it("centres a fit image in the stage", () => {
    const r = displayRect(centeredFit(), IMG.w, IMG.h, STAGE.w, STAGE.h);
    expect(r.left).toBeCloseTo(0);
    expect(r.top).toBeCloseTo(0);
    expect(r.right).toBeCloseTo(500);
    expect(r.bottom).toBeCloseTo(500);
  });
});

describe("clampFrame", () => {
  const rect = displayRect(centeredFit(), IMG.w, IMG.h, STAGE.w, STAGE.h);

  it("keeps the frame inside the image", () => {
    const f = clampFrame({ x: -50, y: 400, w: 300, h: 300 }, rect, 40);
    expect(f.x).toBeGreaterThanOrEqual(rect.left - 1e-6);
    expect(f.y + f.h).toBeLessThanOrEqual(rect.bottom + 1e-6);
  });

  it("never shrinks below the minimum size", () => {
    const f = clampFrame({ x: 100, y: 100, w: 5, h: 5 }, rect, 40);
    expect(f.w).toBe(40);
    expect(f.h).toBe(40);
  });
});

describe("coverScale", () => {
  it("is the scale where the image just covers the frame", () => {
    expect(coverScale({ x: 0, y: 0, w: 200, h: 250 }, 1000, 1000)).toBeCloseTo(0.25);
  });
});

describe("clampView", () => {
  const frame = { x: 100, y: 100, w: 200, h: 200 };

  it("never lets the image shrink below the frame (no empty background)", () => {
    const view = clampView({ scale: 0.05, tx: 0, ty: 0 }, frame, IMG.w, IMG.h, STAGE.w, STAGE.h, 8);
    expect(view.scale).toBeGreaterThanOrEqual(coverScale(frame, IMG.w, IMG.h) - 1e-6);
    expect(contains(displayRect(view, IMG.w, IMG.h, STAGE.w, STAGE.h), frame)).toBe(true);
  });

  it("pulls a panned image back so the frame stays covered", () => {
    const view = clampView({ scale: 1, tx: 9999, ty: -9999 }, frame, IMG.w, IMG.h, STAGE.w, STAGE.h, 8);
    expect(contains(displayRect(view, IMG.w, IMG.h, STAGE.w, STAGE.h), frame)).toBe(true);
  });

  it("caps zoom at the maximum", () => {
    const view = clampView({ scale: 100, tx: 0, ty: 0 }, frame, IMG.w, IMG.h, STAGE.w, STAGE.h, 4);
    expect(view.scale).toBe(4);
  });
});

describe("cropFromView", () => {
  it("reads fraction 0..1 for the whole image", () => {
    const view = centeredFit();
    const crop = cropFromView({ x: 0, y: 0, w: 500, h: 500 }, view, IMG.w, IMG.h, STAGE.w, STAGE.h);
    expect(crop.l).toBeCloseTo(0);
    expect(crop.t).toBeCloseTo(0);
    expect(crop.r).toBeCloseTo(1);
    expect(crop.b).toBeCloseTo(1);
  });

  it("maps a sub-rectangle to image fractions", () => {
    const view = centeredFit();
    // scale 0.5: stage x 125..375 => image x 250..750 => fractions .25...75
    const crop = cropFromView({ x: 125, y: 250, w: 250, h: 125 }, view, IMG.w, IMG.h, STAGE.w, STAGE.h);
    expect(crop.l).toBeCloseTo(0.25);
    expect(crop.r).toBeCloseTo(0.75);
    expect(crop.t).toBeCloseTo(0.5);
    expect(crop.b).toBeCloseTo(0.75);
  });
});

describe("focusView", () => {
  it("expands the crop window toward the stage and preserves the selected region", () => {
    const view = centeredFit();
    const frame = { x: 150, y: 100, w: 200, h: 250 };
    const before = cropFromView(frame, view, IMG.w, IMG.h, STAGE.w, STAGE.h);

    const focused = focusView(frame, view, IMG.w, IMG.h, STAGE.w, STAGE.h, { pad: 0.06, maxScale: 8 });

    expect(focused).not.toBeNull();
    const after = cropFromView(focused.frame, focused.view, IMG.w, IMG.h, STAGE.w, STAGE.h);
    expect(after.l).toBeCloseTo(before.l, 6);
    expect(after.t).toBeCloseTo(before.t, 6);
    expect(after.r).toBeCloseTo(before.r, 6);
    expect(after.b).toBeCloseTo(before.b, 6);
    expect(focused.frame.x).toBeGreaterThanOrEqual(-1e-6);
    expect(focused.frame.x + focused.frame.w).toBeLessThanOrEqual(STAGE.w + 1e-6);
  });

  it("does nothing when the window already fills the stage", () => {
    const view = centeredFit();
    const frame = { x: 0, y: 0, w: 500, h: 500 };
    expect(focusView(frame, view, IMG.w, IMG.h, STAGE.w, STAGE.h, { pad: 0.06, maxScale: 8 })).toBeNull();
  });
});