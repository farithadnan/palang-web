import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { processOffline } from "../src/lib/local-engine.js";

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

  it("still produces a parseable pdf when there is nothing to process", async () => {
    const out = await processOffline({ images: [], pdfs: [], pageSize: "A4", spec: { armed: false } });
    // Parsable is all that matters here — the store never calls the engine
    // with zero files (it guards first), and pdf-lib's empty save is
    // viewer-dependent.
    const doc = await PDFDocument.load(out);
    expect(doc.getPages().length).toBeGreaterThanOrEqual(0);
  });
});
