import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { processOffline, rotatedPalangBox, palangDrawRect, imageStampRect } from "../src/lib/local-engine.js";

const PNG = new Uint8Array(Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
));

async function tinyPdfBytes() {
  const d = await PDFDocument.create();
  d.addPage([100, 100]);
  return Buffer.from(await d.save());
}

const image = (bytes = PNG, mime = "image/png") => ({ bytes: async () => bytes, mime, setting: null });

describe("rotatedPalangBox — the PDF stamp rect matches the preview silhouette", () => {
  it("returns the unrotated size at 0 degrees", () => {
    expect(rotatedPalangBox(300, 60, 0)).toEqual({ w: 300, h: 60 });
  });
  it("the box is the axis-aligned bounds of the tilted band — vertical extent grows, nothing clips", () => {
    const r = rotatedPalangBox(300, 60, 45);
    expect(r.w).toBeCloseTo(300 * Math.SQRT1_2 + 60 * Math.SQRT1_2, 5);
    expect(r.h).toBeCloseTo(300 * Math.SQRT1_2 + 60 * Math.SQRT1_2, 5);
    expect(r.h).toBeGreaterThan(60); // the band's height grows with tilt
  });
  it("normalises angles past 360", () => {
    const a = rotatedPalangBox(100, 40, 90);
    const b = rotatedPalangBox(100, 40, 450);
    expect(a).toEqual(b);
  });
  it("90 degrees swaps the axes", () => {
    const r = rotatedPalangBox(300, 60, 90);
    expect(r.w).toBeCloseTo(60, 1);
    expect(r.h).toBeCloseTo(300, 1);
  });
});

describe("palangDrawRect — visual space → user space, per-page sizes", () => {
  it("unrotated page: top-left anchored, y flipped from the top", () => {
    expect(palangDrawRect(595, 842, 0, 100, 200, 300, 60)).toEqual({ x: 100, y: 842 - 200 - 60, width: 300, height: 60 });
  });
  it("90° page: the rect is swapped and re-anchored, centered on the same visual point", () => {
    // visual rect l=100,t=200,w=300,h=60; visual centre (250, 230)
    const r = palangDrawRect(595, 842, 90, 100, 200, 300, 60);
    expect(r.x).toBe(200); // topPt
    expect(r.y).toBe(100); // leftPt
    expect(r.width).toBe(60);
    expect(r.height).toBe(300);
    expect(r.x + r.width / 2).toBeCloseTo(230, 5); // user cx = visual cy
    expect(r.y + r.height / 2).toBeCloseTo(250, 5); // user cy = visual cx
  });
  it("180° page: user x mirrors, y keeps the top offset", () => {
    const r = palangDrawRect(595, 842, 180, 100, 200, 300, 60);
    expect(r.x).toBe(595 - 100 - 300);
    expect(r.y).toBe(200);
  });
  it("270° page: both axes map through the rotated dims", () => {
    const r = palangDrawRect(595, 842, 270, 100, 200, 300, 60);
    expect(r.x).toBe(595 - 200 - 60);
    expect(r.y).toBe(842 - 100 - 300);
    expect(r.width).toBe(60);
    expect(r.height).toBe(300);
    expect(r.x + r.width / 2).toBeCloseTo(365, 5); // user centre = pdf.js inverse
    expect(r.y + r.height / 2).toBeCloseTo(592, 5);
  });
  it("normalises rotation past 360", () => {
    expect(palangDrawRect(595, 842, 450, 100, 200, 300, 60)).toEqual(palangDrawRect(595, 842, 90, 100, 200, 300, 60));
  });
});

describe("imageStampRect — image-space baking (preview-identical by construction)", () => {
  const page = { w: 595.28, h: 841.89 };
  it("centred spec lands the band on the image centre (landscape photo)", () => {
    const r = imageStampRect(1600, 1200, page.w, page.h, 300, 60, page.w / 2, page.h / 2);
    expect(r.x + r.w / 2).toBeCloseTo(800, 0);
    expect(r.y + r.h / 2).toBeCloseTo(600, 0);
  });
  it("an offset spec shifts by the image-space scale", () => {
    const r0 = imageStampRect(1600, 1200, page.w, page.h, 300, 60, page.w / 2, page.h / 2);
    const r1 = imageStampRect(1600, 1200, page.w, page.h, 300, 60, page.w / 2 + 90, page.h / 2);
    const s = 1600 / 595.28; // width-constrained fit: fitted.w === page.w
    expect(r1.x - r0.x).toBeCloseTo(90 * s, 1);
    expect(r1.y - r0.y).toBeCloseTo(0, 1);
  });
  it("portrait photo letterbox is included in the pixel offset", () => {
    const r = imageStampRect(900, 1600, page.w, page.h, 300, 60, page.w / 2, page.h / 2);
    expect(r.x + r.w / 2).toBeCloseTo(450, 0); // image centre, not page centre
    expect(r.y + r.h / 2).toBeCloseTo(800, 0);
  });
});

describe("processOffline — the on-device engine", () => {
  it("converts one image into a single A4 page", async () => {
    const out = await processOffline({
      images: [image()],
      pdfs: [],
      pageSize: "A4",
      spec: { armed: false },
    });
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(1);
    const { width, height } = doc.getPage(0).getSize();
    expect([Math.round(width), Math.round(height)]).toEqual([595, 842]);
  });

  it("emits one page per image, in order", async () => {
    const out = await processOffline({
      images: [image(), image()],
      pdfs: [],
      pageSize: "A5",
      spec: { armed: false },
    });
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(2);
    const { width, height } = doc.getPage(0).getSize();
    expect([Math.round(width), Math.round(height)]).toEqual([419, 595]);
  });

  it("merges existing pdf pages after the converted images", async () => {
    const out = await processOffline({
      images: [image()],
      pdfs: [{ bytes: tinyPdfBytes }],
      pageSize: "A4",
      spec: { armed: false },
    });
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(2);
  });

  it("keeps a source PDF's native page size (no A4 forcing)", async () => {
    const letter = new Uint8Array(
      Buffer.from(
        "%PDF-1.7\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 16 Tf 40 740 Td (Letter page) Tj ET\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000108 00000 n \n0000000250 00000 n \n0000000330 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n421\n%%EOF"
      ),
      "binary"
    );
    const out = await processOffline({
      images: [],
      pdfs: [{ bytes: async () => letter }],
      pageSize: "A4",
      spec: { armed: false },
    });
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(1);
    const { width, height } = doc.getPage(0).getSize();
    expect([Math.round(width), Math.round(height)]).toEqual([612, 792]);
  });

  it("still produces a parseable pdf when there is nothing to process", async () => {
    const out = await processOffline({ images: [], pdfs: [], pageSize: "A4", spec: { armed: false } });
    // Parsable is all that matters here — the store never calls the engine
    // with zero files (it guards first), and pdf-lib's empty save is
    // viewer-dependent.
    const doc = await PDFDocument.load(out);
    expect(doc.getPages().length).toBeGreaterThanOrEqual(0);
  });
});
