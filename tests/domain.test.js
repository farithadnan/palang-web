import { describe, expect, it } from "vitest";
import {
  defaultSpec,
  fittedPageSize,
  PAGE_DIMS,
  pageDims,
  palangLabel,
  parseRangeGroups,
} from "../src/lib/domain/domain.js";

describe("pageDims — the page box for an image", () => {
  it("returns the chosen paper size", () => {
    expect(pageDims("A4", 2000, 1000)).toEqual({ w: 595, h: 842 });
    expect(pageDims("A5", 2000, 1000)).toEqual({ w: 419, h: 595 });
  });
  it("fit: the page takes the image's own shape, scaled inside A4 (no border)", () => {
    expect(pageDims("fit", 2000, 1000)).toEqual({ w: 595, h: 297.5 });
    expect(pageDims("fit", 1000, 2000)).toEqual({ w: 421, h: 842 });
    expect(pageDims("fit", 1000, 1000)).toEqual({ w: 595, h: 595 });
  });
  it("falls back to A4 for unknown sizes or missing dimensions", () => {
    expect(pageDims("nope", 1, 1)).toEqual(PAGE_DIMS.A4);
    expect(pageDims("fit", 0, 0)).toEqual(PAGE_DIMS.A4);
    expect(pageDims("fit", null, null)).toEqual(PAGE_DIMS.A4);
  });
});

describe("fittedPageSize", () => {
  const A4 = { w: 595, h: 842 };
  it("keeps a wide image's ratio on the page width", () => {
    expect(fittedPageSize(2000, 1000, A4.w, A4.h)).toEqual({ w: 595, h: 297.5 });
  });
  it("keeps a tall image's ratio on the page height", () => {
    expect(fittedPageSize(1000, 2000, A4.w, A4.h)).toEqual({ w: 421, h: 842 });
  });
  it("fits a square image to the shorter page edge", () => {
    expect(fittedPageSize(1000, 1000, A4.w, A4.h)).toEqual({ w: 595, h: 595 });
  });
  it("exact-ratio images fill the page", () => {
    expect(fittedPageSize(595, 842, A4.w, A4.h)).toEqual({ w: 595, h: 842 });
  });
  it("falls back to the page size for unknown dimensions", () => {
    expect(fittedPageSize(0, 100, A4.w, A4.h)).toEqual(A4);
    expect(fittedPageSize(null, null, A4.w, A4.h)).toEqual(A4);
  });
});

describe("palangLabel — the only shape the engine draws", () => {
  it("returns the trimmed text, the band colour and the font size", () => {
    const spec = defaultSpec();
    spec.text = "  UNTUK KEGUNAAN BANK SAHAJA  ";
    spec.fontSize = 26;
    spec.color = "#1a3a8f";
    expect(palangLabel(spec)).toEqual({
      text: "UNTUK KEGUNAAN BANK SAHAJA",
      color: "#1a3a8f",
      fontPt: 26,
    });
  });

  it("falls back to the default font size and an empty text", () => {
    const spec = defaultSpec();
    spec.fontSize = 0;
    spec.text = "";
    const out = palangLabel(spec);
    expect(out.text).toBe("");
    expect(out.fontPt).toBe(18);
  });

  it("keeps the lines band monochrome (text shares the band colour)", () => {
    const spec = defaultSpec();
    spec.color = "#b3261e";
    expect(palangLabel(spec).color).toBe(spec.color);
  });
});

describe("parseRangeGroups — page ranges for Extract", () => {
  it("parses comma groups of ranges and single pages", () => {
    expect(parseRangeGroups("1-3, 5, 8-10", 10)).toEqual([[1, 2, 3], [5], [8, 9, 10]]);
  });

  it("clamps to the page count and drops out-of-range numbers", () => {
    expect(parseRangeGroups("0, 3-100", 5)).toEqual([[3, 4, 5]]);
    expect(parseRangeGroups("9", 5)).toEqual([]);
  });

  it("accepts a reversed range and ignores empty/invalid parts", () => {
    expect(parseRangeGroups("5-2", 10)).toEqual([[2, 3, 4, 5]]);
    expect(parseRangeGroups("", 10)).toEqual([]);
    expect(parseRangeGroups("abc, , -", 10)).toEqual([]);
  });
});
