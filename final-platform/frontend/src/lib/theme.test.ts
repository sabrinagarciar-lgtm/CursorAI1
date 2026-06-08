import { afterEach, describe, expect, it } from "vitest";

import { applyThemeClass } from "./theme";

describe("applyThemeClass", () => {
  afterEach(() => {
    document.documentElement.classList.remove("dark");
  });

  it("adds dark class when mode is dark", () => {
    applyThemeClass("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("removes dark class when mode is light", () => {
    document.documentElement.classList.add("dark");
    applyThemeClass("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
