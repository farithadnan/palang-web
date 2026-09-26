import { beforeEach, describe, expect, it } from "vitest";
import {
  app,
  setTheme,
  setLang,
  updateSpec,
  addSpec,
  removeSpecAt,
  setSpecIndex,
  resetSpec,
  canMerge,
  humanSize,
} from "../src/lib/store.svelte.js";
import { nextLang } from "../src/lib/i18n.js";
import { defaultSpec } from "../src/lib/domain.js";

beforeEach(() => {
  app.specs = [defaultSpec()];
  app.specIndex = 0;
  app.images = [];
});

describe("updateSpec (active spec)", () => {
  it("merges a patch into the active spec", () => {
    updateSpec({ fontSize: 26 });
    expect(app.specs[0].fontSize).toBe(26);
    expect(app.specs[0].text).toBe("UNTUK KEGUNAAN BANK SAHAJA"); // untouched fields stay
  });

  it("arms the marking on field edits", () => {
    app.specs[0].armed = false;
    updateSpec({ fontSize: 26 });
    expect(app.specs[0].armed).toBe(true);
  });

  it("honours an explicit armed flag (Delete keeps the marking hidden)", () => {
    app.specs[0].armed = true;
    updateSpec({ armed: false });
    expect(app.specs[0].armed).toBe(false);
  });

  it("edits whichever spec is active", () => {
    addSpec();
    updateSpec({ text: "UNTUK KEGUNAAN KERAJAAN SAHAJA" });
    expect(app.specs[1].text).toBe("UNTUK KEGUNAAN KERAJAAN SAHAJA");
    expect(app.specs[0].text).toBe("UNTUK KEGUNAAN BANK SAHAJA");
  });
});

describe("multi-palang", () => {
  it("addSpec appends a new spec and makes it active", () => {
    addSpec();
    expect(app.specs.length).toBe(2);
    expect(app.specIndex).toBe(1);
    // stacks below the previous band so it is visible immediately
    expect(app.specs[1].topPt).toBeGreaterThan(app.specs[0].topPt ?? 0);
  });

  it("removeSpecAt deletes only named spec and keeps at least one", () => {
    addSpec();
    addSpec();
    removeSpecAt(1);
    expect(app.specs.length).toBe(2);
    removeSpecAt(0);
    expect(app.specs.length).toBe(1);
    removeSpecAt(0); // last one cannot be removed
    expect(app.specs.length).toBe(1);
  });

  it("setSpecIndex selects and bounds-checks", () => {
    addSpec();
    setSpecIndex(0);
    expect(app.specIndex).toBe(0);
    setSpecIndex(9);
    expect(app.specIndex).toBe(0);
  });

  it("resetSpec restores a single default spec", () => {
    addSpec();
    addSpec();
    resetSpec();
    expect(app.specs.length).toBe(1);
    expect(app.specIndex).toBe(0);
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
