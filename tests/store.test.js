import { beforeEach, describe, expect, it } from "vitest";
import { app, setConsent, setTheme, updateSpec } from "../src/lib/store.svelte.js";
import { defaultSpec } from "../src/lib/domain.js";

beforeEach(() => {
  app.spec = defaultSpec();
  app.images = [];
});

describe("updateSpec", () => {
  it("merges a patch into the spec", () => {
    updateSpec({ fontSize: 26 });
    expect(app.spec.fontSize).toBe(26);
    expect(app.spec.text).toBe("UNTUK KEGUNAAN BANK SAHAJA"); // untouched fields stay
  });

  it("arms the marking on field edits", () => {
    app.spec.armed = false;
    updateSpec({ fontSize: 26 });
    expect(app.spec.armed).toBe(true);
  });

  it("honours an explicit armed flag (Delete keeps the marking hidden)", () => {
    app.spec.armed = true;
    updateSpec({ armed: false });
    expect(app.spec.armed).toBe(false);
  });
});

describe("consent and theme", () => {
  it("setConsent stores the choice", () => {
    setConsent(true);
    expect(app.consented).toBe(true);
    setConsent(false);
    expect(app.consented).toBe(false);
  });

  it("setTheme updates the theme", () => {
    setTheme("dark");
    expect(app.theme).toBe("dark");
  });
});
