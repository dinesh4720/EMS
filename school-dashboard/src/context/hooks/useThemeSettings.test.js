/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useThemeSettings, sanitizeThemeSettings } from "./useThemeSettings";

// Mock safeStorage
vi.mock("../../utils/safeStorage", () => ({
  safeGetItem: vi.fn(),
  safeSetItem: vi.fn(),
}));

import { safeGetItem, safeSetItem } from "../../utils/safeStorage";

describe("sanitizeThemeSettings", () => {
  it("returns default theme for null/undefined/non-object input", () => {
    expect(sanitizeThemeSettings(null)).toEqual({
      mode: "light",
      fontFamily: "Inter",
      fontSizeScale: 1,
      borderRadius: 12,
      reduceMotion: false,
    });
    expect(sanitizeThemeSettings(undefined)).toEqual(sanitizeThemeSettings(null));
    expect(sanitizeThemeSettings("string")).toEqual(sanitizeThemeSettings(null));
  });

  it("allows valid theme settings through", () => {
    const input = {
      mode: "dark",
      fontFamily: "Roboto",
      fontSizeScale: 1.5,
      borderRadius: 20,
      reduceMotion: true,
    };
    expect(sanitizeThemeSettings(input)).toEqual(input);
  });

  it("coerces invalid mode to light", () => {
    expect(sanitizeThemeSettings({ mode: "hacked" }).mode).toBe("light");
    expect(sanitizeThemeSettings({ mode: "dark" }).mode).toBe("dark");
  });

  it("rejects unknown font families and falls back to Inter", () => {
    expect(sanitizeThemeSettings({ fontFamily: " EvilFont" }).fontFamily).toBe("Inter");
    expect(sanitizeThemeSettings({ fontFamily: "; @import url(...)" }).fontFamily).toBe("Inter");
  });

  it("strips dangerous characters from fontFamily", () => {
    const result = sanitizeThemeSettings({
      fontFamily: '"}; body { background: red } /*',
    });
    expect(result.fontFamily).toBe("Inter");
  });

  it("allows alphanumeric font names with spaces, hyphens and underscores", () => {
    expect(sanitizeThemeSettings({ fontFamily: "Open Sans" }).fontFamily).toBe("Open Sans");
    expect(sanitizeThemeSettings({ fontFamily: "Source Sans Pro" }).fontFamily).toBe("Source Sans Pro");
  });

  it("clamps fontSizeScale to [0.5, 2.0]", () => {
    expect(sanitizeThemeSettings({ fontSizeScale: 0.1 }).fontSizeScale).toBe(0.5);
    expect(sanitizeThemeSettings({ fontSizeScale: 5 }).fontSizeScale).toBe(2.0);
    expect(sanitizeThemeSettings({ fontSizeScale: 1.25 }).fontSizeScale).toBe(1.25);
    expect(sanitizeThemeSettings({ fontSizeScale: "evil" }).fontSizeScale).toBe(0.5);
  });

  it("clamps borderRadius to [0, 32]", () => {
    expect(sanitizeThemeSettings({ borderRadius: -10 }).borderRadius).toBe(0);
    expect(sanitizeThemeSettings({ borderRadius: 100 }).borderRadius).toBe(32);
    expect(sanitizeThemeSettings({ borderRadius: 16 }).borderRadius).toBe(16);
    expect(sanitizeThemeSettings({ borderRadius: "evil" }).borderRadius).toBe(0);
  });

  it("coerces reduceMotion to boolean", () => {
    expect(sanitizeThemeSettings({ reduceMotion: 1 }).reduceMotion).toBe(true);
    expect(sanitizeThemeSettings({ reduceMotion: 0 }).reduceMotion).toBe(false);
    expect(sanitizeThemeSettings({ reduceMotion: true }).reduceMotion).toBe(true);
  });
});

describe("useThemeSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    safeGetItem.mockReturnValue(null);
    // Clean up any injected style tag
    const existing = document.getElementById("theme-settings-style");
    if (existing) existing.remove();
  });

  afterEach(() => {
    const existing = document.getElementById("theme-settings-style");
    if (existing) existing.remove();
  });

  it("initializes with defaults when localStorage is empty", () => {
    const { result } = renderHook(() => useThemeSettings());
    expect(result.current.themeSettings).toEqual({
      mode: "light",
      fontFamily: "Inter",
      fontSizeScale: 1,
      borderRadius: 12,
      reduceMotion: false,
    });
  });

  it("sanitizes malformed stored settings on init", () => {
    safeGetItem.mockReturnValue(
      JSON.stringify({
        mode: "dark",
        fontFamily: '"}; body { background: red } /*',
        fontSizeScale: 99,
        borderRadius: -999,
        reduceMotion: "yes",
      })
    );

    const { result } = renderHook(() => useThemeSettings());
    expect(result.current.themeSettings.fontFamily).toBe("Inter");
    expect(result.current.themeSettings.fontSizeScale).toBe(2.0);
    expect(result.current.themeSettings.borderRadius).toBe(0);
    expect(result.current.themeSettings.reduceMotion).toBe(true);
  });

  it("injects a <style> tag with sanitized CSS variables", async () => {
    const { result } = renderHook(() => useThemeSettings());

    act(() => {
      result.current.updateThemeSettings({
        mode: "dark",
        fontFamily: "Roboto",
        fontSizeScale: 1.25,
        borderRadius: 16,
        reduceMotion: true,
      });
    });

    await waitFor(() => {
      const styleEl = document.getElementById("theme-settings-style");
      expect(styleEl).toBeTruthy();
      const css = styleEl.textContent;
      expect(css).toContain('--font-sans: "Roboto", sans-serif');
      expect(css).toContain("--nextui-radius-medium: 16px");
      expect(css).toContain("font-size: 125%");
    });
  });

  it("prevents XSS payload from reaching the style tag", async () => {
    const { result } = renderHook(() => useThemeSettings());

    act(() => {
      result.current.updateThemeSettings({
        fontFamily: '"}; @import url(http://evil.com); body { background: url(http://evil.com) } /*',
        fontSizeScale: 1,
        borderRadius: 12,
      });
    });

    await waitFor(() => {
      const styleEl = document.getElementById("theme-settings-style");
      const css = styleEl.textContent;
      // The malicious characters should be stripped
      expect(css).not.toContain("@import");
      expect(css).not.toContain("body {");
      expect(css).toContain('--font-sans: "Inter", sans-serif');
    });
  });

  it("resetThemeSettings restores defaults", () => {
    safeGetItem.mockReturnValue(
      JSON.stringify({ mode: "dark", fontFamily: "Roboto", fontSizeScale: 1.5, borderRadius: 20, reduceMotion: true })
    );

    const { result } = renderHook(() => useThemeSettings());
    expect(result.current.themeSettings.mode).toBe("dark");

    act(() => {
      result.current.resetThemeSettings();
    });

    expect(result.current.themeSettings).toEqual({
      mode: "light",
      fontFamily: "Inter",
      fontSizeScale: 1,
      borderRadius: 12,
      reduceMotion: false,
    });
    expect(safeSetItem).toHaveBeenCalledWith(
      "themeSettings",
      JSON.stringify({
        mode: "light",
        fontFamily: "Inter",
        fontSizeScale: 1,
        borderRadius: 12,
        reduceMotion: false,
      })
    );
  });
});
