import { describe, it, expect } from "vitest";
import { classifyDeploy } from "../src/lib/site-config.js";

describe("classifyDeploy", () => {
  it("marks the configured official origin as hosted", () => {
    expect(classifyDeploy("https://palang.oh-alam.my/whatever", "https://palang.oh-alam.my")).toBe("hosted");
    expect(classifyDeploy("https://palang.oh-alam.my", "https://palang.oh-alam.my/")).toBe("hosted");
  });

  it("marks a dev/staging domain as hosted when configured as official", () => {
    expect(classifyDeploy("https://staging.palang.example", "https://staging.palang.example")).toBe("hosted");
  });

  it("marks any other remote origin as third-party", () => {
    expect(classifyDeploy("https://someone-elses-vps.example", "https://palang.oh-alam.my")).toBe("third");
    expect(classifyDeploy("https://localhost:5173", "https://palang.oh-alam.my")).toBe("third");
    expect(classifyDeploy("https://192.168.1.5", "https://palang.oh-alam.my")).toBe("third");
  });

  it("never claims an unparseable origin or config as hosted", () => {
    expect(classifyDeploy("")).toBe("self");
    expect(classifyDeploy(null)).toBe("self");
    expect(classifyDeploy("https://palang.oh-alam.my", "not a url")).toBe("third");
    expect(classifyDeploy("garbage", "https://palang.oh-alam.my")).toBe("third");
  });
});
