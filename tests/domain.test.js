import { describe, expect, it } from "vitest";
import {
  buildPalangSpec,
  defaultSpec,
  fittedPageSize,
  imageSettings,
  pagesValue,
  presetSpecFromDoc,
} from "../src/lib/domain.js";

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

describe("pagesValue", () => {
  it("passes through simple targets", () => {
    expect(pagesValue("all", "")).toBe("all");
    expect(pagesValue("odd", "")).toBe("odd");
  });
  it("falls back to all for an empty custom box", () => {
    expect(pagesValue("custom", "  ")).toBe("all");
    expect(pagesValue("custom", "1, 3, 5-8")).toBe("1, 3, 5-8");
  });
});

describe("buildPalangSpec", () => {
  it("builds a centred lines band by default (transparent, text-coloured)", () => {
    const spec = defaultSpec(); // style: "lines"
    spec.text = "UNTUK KEGUNAAN BANK SAHAJA";
    const out = buildPalangSpec(spec, true);
    expect(out.mode).toBe("band");
    expect(out.band_style).toBe("lines");
    expect(out.pages).toBe("all");
    expect(out.position.anchor).toBe("center");
    expect(out.position.top_pt).toBeUndefined();
    expect(out.opacity).toBe(1.0);
    expect(out.label.text).toBe("UNTUK KEGUNAAN BANK SAHAJA");
    // Lines style is monochrome: text shares the bar colour.
    expect(out.label.color).toBe(spec.color);
  });

  it("builds a filled see-through band with white text", () => {
    const spec = defaultSpec();
    spec.style = "see-through";
    spec.text = "UNTUK KEGUNAAN BANK SAHAJA";
    const out = buildPalangSpec(spec, true);
    expect(out.band_style).toBe("filled");
    expect(out.opacity).toBe(0.6);
    expect(out.label.color).toBe("#FFFFFF");
  });

  it("emits absolute points for canvas mode", () => {
    const spec = defaultSpec();
    spec.topPt = 120;
    spec.heightPt = 40;
    const out = buildPalangSpec(spec, false);
    expect(out.position.top_pt).toBe(120);
    expect(out.position.anchor).toBeUndefined();
    expect(out.height_pt).toBe(40);
  });

  it("emits left_pt for a freely placed lines band", () => {
    const spec = defaultSpec(); // style: "lines"
    spec.topPt = 300;
    spec.leftPt = 140;
    const out = buildPalangSpec(spec, false);
    expect(out.position.left_pt).toBe(140);
    expect(out.position.top_pt).toBe(300);
  });

  it("builds a region with left offset and no empty label", () => {
    const spec = defaultSpec();
    spec.mode = "region";
    spec.horiz = "right";
    spec.widthPt = 200;
    spec.heightPt = 30;
    const out = buildPalangSpec(spec, true);
    expect(out.mode).toBe("region");
    expect(out.position.left_pt).toBe(395);
    expect(out.width_pt).toBe(200);
    expect(out.label).toBeNull();
  });

  it("injects date and reference tokens", () => {
    const spec = defaultSpec();
    spec.text = "UNTUK KEGUNAAN KERAJAAN SAHAJA";
    spec.second = "Dijana pada {date} - Rujukan {ref}";
    spec.ref = "MOHON-2026";
    const out = buildPalangSpec(spec, true);
    expect(out.label.second_line).toContain("{date}");
    expect(out.label.template_data.ref).toBe("MOHON-2026");
  });
});

describe("imageSettings", () => {
  it("maps each image to its enhance/crop settings in order", () => {
    const images = [
      { enhance: true, crop: { l: 0, t: 0, r: 1, b: 0.5 } },
      { enhance: false, crop: null },
    ];
    expect(imageSettings(images)).toEqual([
      { enhance: true, crop: { l: 0, t: 0, r: 1, b: 0.5 } },
      { enhance: false, crop: null },
    ]);
  });
});

describe("presetSpecFromDoc", () => {
  it("round-trips a bank-style preset into the editor state", () => {
    const spec = presetSpecFromDoc({
      palang: [
        {
          mode: "band",
          pages: "all",
          position: { anchor: "center" },
          height_pt: 48,
          color: "#003366",
          opacity: 0.8,
          label: { text: "UNTUK KEGUNAAN BANK SAHAJA", second_line: "Dijana pada {date}" },
        },
      ],
    });
    expect(spec.mode).toBe("band");
    expect(spec.anchor).toBe("center");
    expect(spec.thickness).toBe("normal");
    expect(spec.text).toBe("UNTUK KEGUNAAN BANK SAHAJA");
    expect(spec.second).toBe("Dijana pada {date}");
    expect(spec.color).toBe("#003366");
    // No band_style in the preset: it renders with the new lines default.
    expect(spec.style).toBe("lines");
  });
});
