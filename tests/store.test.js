import { beforeEach, describe, expect, it } from "vitest";
import {
  app,
  setTheme,
  setLang,
  updateSpec,
  moveImage,
  rotateMergePage,
  moveMergePage,
  removeMergePage,
  movePrepareItem,
  removePrepareItem,
  revertPrepareImage,
  setPrepare,
  recordOutput,
  clearSession,
  sendResultTo,
  canMerge,
  humanSize,
} from "../src/lib/state/store.svelte.js";
import { nextLang } from "../src/lib/i18n/index.js";
import { defaultSpec } from "../src/lib/domain/domain.js";

beforeEach(() => {
  app.images = [];
  app.pdfs = [];
  app.previewFiles = [];
  app.stamp = [];
  app.preview = null;
  app.activePage = 0;
  app.result = null;
  app.merge = { pages: [], active: 0 };
  app.prepare = {
    items: [],
    paper: "fit",
    stamp: false,
    stampText: "UNTUK KEGUNAAN BANK SAHAJA",
    merge: true,
    filename: "",
  };
  app.session = { startedAt: 0, outputs: [], counts: { convert: 0, palang: 0, merge: 0, prepare: 0 } };
});

function seedActiveImage() {
  const file = new File(["x"], "a.png", { type: "image/png" });
  app.previewFiles = [file];
  app.stamp = [defaultSpec()];
  app.preview = {
    count: 1,
    client: true,
    pages: [{ kind: "img", file, page: 1, url: "blob:x", w: 595, h: 842 }],
  };
  app.activePage = 0;
}

describe("updateSpec (active image's own palang)", () => {
  it("merges a patch into the active image's spec", () => {
    seedActiveImage();
    updateSpec({ fontSize: 26 });
    expect(app.stamp[0].fontSize).toBe(26);
    expect(app.stamp[0].text).toBe("UNTUK KEGUNAAN BANK SAHAJA"); // untouched fields stay
  });

  it("arms the marking on field edits", () => {
    seedActiveImage();
    app.stamp[0].armed = false;
    updateSpec({ fontSize: 26 });
    expect(app.stamp[0].armed).toBe(true);
  });

  it("honours an explicit armed flag (Remove keeps the marking hidden)", () => {
    seedActiveImage();
    app.stamp[0].armed = true;
    updateSpec({ armed: false });
    expect(app.stamp[0].armed).toBe(false);
  });

  it("edits only the active image; the other image's palang stays untouched", () => {
    const f1 = new File(["a"], "a.png", { type: "image/png" });
    const f2 = new File(["b"], "b.png", { type: "image/png" });
    app.previewFiles = [f1, f2];
    app.stamp = [defaultSpec(), defaultSpec()];
    app.preview = {
      count: 2,
      client: true,
      pages: [
        { kind: "img", file: f1, page: 1, url: "blob:1", w: 595, h: 842 },
        { kind: "img", file: f2, page: 1, url: "blob:2", w: 595, h: 842 },
      ],
    };
    app.activePage = 0;
    updateSpec({ text: "UNTUK KEGUNAAN KERAJAAN SAHAJA" });
    expect(app.stamp[0].text).toBe("UNTUK KEGUNAAN KERAJAAN SAHAJA");
    expect(app.stamp[1].text).toBe("UNTUK KEGUNAAN BANK SAHAJA");
  });
});

describe("moveImage — page order follows list order", () => {
  it("swaps an image with its neighbour and clamps at the ends", () => {
    app.images = [{ id: "a" }, { id: "b" }, { id: "c" }];
    moveImage("a", 1);
    expect(app.images.map((i) => i.id)).toEqual(["b", "a", "c"]);
    moveImage("a", 1);
    expect(app.images.map((i) => i.id)).toEqual(["b", "c", "a"]);
    moveImage("a", 1); // already last: no-op
    expect(app.images.map((i) => i.id)).toEqual(["b", "c", "a"]);
    moveImage("b", -1); // already first: no-op
    expect(app.images.map((i) => i.id)).toEqual(["b", "c", "a"]);
  });

  it("ignores an unknown id", () => {
    app.images = [{ id: "a" }];
    moveImage("nope", 1);
    expect(app.images.map((i) => i.id)).toEqual(["a"]);
  });
});

describe("session summary", () => {
  it("records outputs newest-first and counts by mode", () => {
    recordOutput({ mode: "convert", name: "a.pdf", size: 1 });
    recordOutput({ mode: "palang", name: "b.pdf", size: 2 });
    expect(app.session.counts.convert).toBe(1);
    expect(app.session.counts.palang).toBe(1);
    expect(app.session.outputs.map((o) => o.name)).toEqual(["b.pdf", "a.pdf"]);
    expect(app.session.outputs[0]).toMatchObject({ mode: "palang", name: "b.pdf", size: 2 });
  });

  it("caps the recent list and drops the oldest", () => {
    for (let i = 0; i < 12; i++) recordOutput({ mode: "convert", name: `f${i}.pdf`, size: i });
    expect(app.session.outputs.length).toBe(10);
    expect(app.session.outputs[0].name).toBe("f11.pdf");
    expect(app.session.counts.convert).toBe(12);
  });

  it("clearSession resets counts and outputs", () => {
    recordOutput({ mode: "merge", name: "m.pdf", size: 3 });
    clearSession();
    expect(app.session.outputs).toEqual([]);
    expect(app.session.counts).toEqual({ convert: 0, palang: 0, merge: 0, prepare: 0 });
  });
});

describe("tool handoff", () => {
  it("seeds the Palang basket (with a palang) from the current result", () => {
    app.result = { name: "x.pdf", blob: new Blob(["a"]), mode: "convert" };
    expect(sendResultTo("palang")).toBe(true);
    expect(app.previewFiles.length).toBe(1);
    expect(app.previewFiles[0].name).toBe("x.pdf");
    expect(app.stamp.length).toBe(1);
  });

  it("seeds the Merge basket from the current result", () => {
    app.result = { name: "y.pdf", blob: new Blob(["a"]), mode: "palang" };
    expect(sendResultTo("merge")).toBe(true);
    expect(app.pdfs.length).toBe(1);
  });

  it("no-ops without a result or for an unknown target", () => {
    expect(sendResultTo("palang")).toBe(false);
    app.result = { name: "z.pdf", blob: new Blob(["a"]), mode: "convert" };
    expect(sendResultTo("nope")).toBe(false);
  });
});

describe("merge page-level edits", () => {
  const page = (id) => ({ pdfId: id, file: { name: id + ".pdf" }, page: 1, removed: false, rotationDeg: 0 });

  it("removeMergePage toggles a page in and out, recoverably", () => {
    app.merge = { pages: [page("a")], active: 0 };
    removeMergePage(0);
    expect(app.merge.pages[0].removed).toBe(true);
    removeMergePage(0);
    expect(app.merge.pages[0].removed).toBe(false);
  });

  it("rotateMergePage rotates in 90° steps and normalises", () => {
    app.merge = { pages: [page("a")], active: 0 };
    rotateMergePage(0, 90);
    expect(app.merge.pages[0].rotationDeg).toBe(90);
    rotateMergePage(0, 270);
    expect(app.merge.pages[0].rotationDeg).toBe(0);
    rotateMergePage(0, -90);
    expect(app.merge.pages[0].rotationDeg).toBe(270);
  });

  it("moveMergePage swaps neighbours and follows the page with the active index", () => {
    app.merge = { pages: [page("a"), page("b"), page("c")], active: 0 };
    moveMergePage(0, 1);
    expect(app.merge.pages.map((p) => p.pdfId)).toEqual(["b", "a", "c"]);
    expect(app.merge.active).toBe(1);
    moveMergePage(0, -1); // already first: no-op
    expect(app.merge.pages.map((p) => p.pdfId)).toEqual(["b", "a", "c"]);
  });
});

describe("prepare (unified basket)", () => {
  const item = (id) => ({ id, kind: "image", file: { name: id + ".png" }, url: null, pageCount: 0 });

  it("moves an item with its neighbour", () => {
    app.prepare.items = [item("a"), item("b"), item("c")];
    movePrepareItem("a", 1);
    expect(app.prepare.items.map((i) => i.id)).toEqual(["b", "a", "c"]);
    movePrepareItem("a", 1);
    expect(app.prepare.items.map((i) => i.id)).toEqual(["b", "c", "a"]);
    movePrepareItem("b", -1); // already first: no-op
    expect(app.prepare.items.map((i) => i.id)).toEqual(["b", "c", "a"]);
  });

  it("removes an item", () => {
    app.prepare.items = [item("a"), item("b")];
    removePrepareItem("a");
    expect(app.prepare.items.map((i) => i.id)).toEqual(["b"]);
  });

  it("setPrepare merges export options", () => {
    setPrepare({ stamp: true, filename: "x" });
    expect(app.prepare.stamp).toBe(true);
    expect(app.prepare.filename).toBe("x");
    expect(app.prepare.merge).toBe(true); // untouched
  });

  it("revertPrepareImage clears crop, rotation and enhance", () => {
    app.prepare.items = [
      {
        id: "a",
        kind: "image",
        file: {},
        url: "blob:x",
        originalUrl: "blob:x",
        baseUrl: "blob:x",
        rotationDeg: 90,
        crop: { l: 0, t: 0, r: 1, b: 1 },
        enhance: true,
      },
    ];
    revertPrepareImage("a");
    const it = app.prepare.items[0];
    expect(it.rotationDeg).toBe(0);
    expect(it.crop).toBeNull();
    expect(it.enhance).toBe(false);
    expect(it.url).toBe(it.originalUrl);
  });
});

describe("theme", () => {
  it("setTheme updates the theme", () => {
    setTheme("dark");
    expect(app.theme).toBe("dark");
  });
});

describe("merge validation", () => {
  it("needs at least two PDFs (one file is not a merge)", () => {
    app.pdfs = [];
    expect(canMerge()).toBe(false);
    app.pdfs = [{ id: "pdf-1" }];
    expect(canMerge()).toBe(false);
    app.pdfs = [{ id: "pdf-1" }, { id: "pdf-2" }];
    expect(canMerge()).toBe(true);
    app.busy = true;
    expect(canMerge()).toBe(false);
    app.busy = false;
    app.pdfs = [];
  });
});

describe("humanSize", () => {
  it("humanises bytes for the result row", () => {
    expect(humanSize(0)).toBe("");
    expect(humanSize(512)).toBe("512 B");
    expect(humanSize(2048)).toBe("2 KB");
    expect(humanSize(3 * 1024 * 1024)).toBe("3.0 MB");
  });
});

describe("language toggle", () => {
  it("nextLang returns the target language (never throws)", () => {
    setLang("ms");
    expect(nextLang()).toBe("en");
    setLang("en");
    expect(nextLang()).toBe("ms");
    setLang("ms");
  });
});
