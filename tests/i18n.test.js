import { describe, expect, it } from "vitest";
import en from "../src/lib/i18n/en.json";
import ms from "../src/lib/i18n/ms.json";

/** Guards the single source of truth: every key must exist in both languages,
 *  or a translation slips through and silently falls back to English. */
describe("i18n dictionaries", () => {
  it("en and ms have exactly the same keys", () => {
    const missingInMs = Object.keys(en).filter((k) => !(k in ms));
    const missingInEn = Object.keys(ms).filter((k) => !(k in en));
    expect({ missingInMs, missingInEn }).toEqual({ missingInMs: [], missingInEn: [] });
  });

  it("no value is empty", () => {
    const empty = [...Object.entries(en), ...Object.entries(ms)]
      .filter(([, v]) => typeof v === "string" && v.trim() === "")
      .map(([k]) => k);
    expect(empty).toEqual([]);
  });
});
