// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initialTheme, storeTheme } from "../../src/theme.js";

describe("theme (B1)", () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("falls back to prefers-color-scheme when nothing is stored", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true } as MediaQueryList);
    expect(initialTheme()).toBe("dark");
    window.matchMedia = vi.fn().mockReturnValue({ matches: false } as MediaQueryList);
    expect(initialTheme()).toBe("light");
  });

  it("prefers a stored choice over prefers-color-scheme", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true } as MediaQueryList);
    storeTheme("light");
    expect(initialTheme()).toBe("light");
  });

  it("never throws when localStorage is unavailable (private mode, quota, disabled)", () => {
    const getItem = vi.spyOn(window.localStorage.__proto__, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const setItem = vi.spyOn(window.localStorage.__proto__, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => storeTheme("dark")).not.toThrow();
    expect(() => initialTheme()).not.toThrow();
    getItem.mockRestore();
    setItem.mockRestore();
  });

  it("never throws when matchMedia is unavailable", () => {
    const original = window.matchMedia;
    // @ts-expect-error simulating an environment without matchMedia
    delete window.matchMedia;
    expect(() => initialTheme()).not.toThrow();
    window.matchMedia = original;
  });
});
