import { useState, useEffect, useCallback } from "react";
import { safeGetItem, safeSetItem } from "../../utils/safeStorage";

const ALLOWED_FONT_FAMILIES = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Nunito",
  "Source Sans Pro",
  "Helvetica Neue",
  "Arial",
  "system-ui",
  "sans-serif",
  "serif",
  "monospace",
];

const DEFAULT_THEME = {
  mode: "light",
  fontFamily: "Inter",
  fontSizeScale: 1,
  borderRadius: 12,
  reduceMotion: false,
};

const MIN_FONT_SIZE_SCALE = 0.5;
const MAX_FONT_SIZE_SCALE = 2.0;
const MIN_BORDER_RADIUS = 0;
const MAX_BORDER_RADIUS = 32;

/**
 * Sanitize fontFamily by stripping dangerous characters.
 * Only allows alphanumeric, spaces, hyphens, and underscores.
 */
function sanitizeFontFamily(value) {
  if (typeof value !== "string") return DEFAULT_THEME.fontFamily;
  // Strip any characters that could be used for CSS injection
  const sanitized = value.replace(/[^a-zA-Z0-9\s\-_]/g, "").trim();
  return sanitized || DEFAULT_THEME.fontFamily;
}

/**
 * Validate fontFamily against an allowlist of safe font names.
 */
function validateFontFamily(value) {
  const sanitized = sanitizeFontFamily(value);
  const match = ALLOWED_FONT_FAMILIES.find(
    (f) => f.toLowerCase() === sanitized.toLowerCase()
  );
  return match || DEFAULT_THEME.fontFamily;
}

function clamp(value, min, max) {
  if (typeof value !== "number" || Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * Sanitize and validate all theme settings to prevent CSS injection / XSS.
 */
export function sanitizeThemeSettings(raw) {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_THEME };
  }

  return {
    mode: raw.mode === "dark" ? "dark" : "light",
    fontFamily: validateFontFamily(raw.fontFamily),
    fontSizeScale: clamp(
      raw.fontSizeScale,
      MIN_FONT_SIZE_SCALE,
      MAX_FONT_SIZE_SCALE
    ),
    borderRadius: clamp(
      raw.borderRadius,
      MIN_BORDER_RADIUS,
      MAX_BORDER_RADIUS
    ),
    reduceMotion: Boolean(raw.reduceMotion),
  };
}

const STYLE_ID = "theme-settings-style";

/**
 * Apply sanitized theme settings via a dedicated <style> block.
 * This avoids direct DOM style manipulation and keeps CSS variable
 * injection strictly controlled.
 */
function applyThemeStyle(settings) {
  const sanitized = sanitizeThemeSettings(settings);
  let styleEl = document.getElementById(STYLE_ID);
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = STYLE_ID;
    document.head.appendChild(styleEl);
  }

  const fontFamily = sanitized.fontFamily;
  const borderRadius = sanitized.borderRadius;
  const fontSizePercent = sanitized.fontSizeScale * 100;

  styleEl.textContent = `
    :root {
      --font-sans: "${fontFamily}", sans-serif;
      --nextui-radius-small: ${borderRadius * 0.5}px;
      --nextui-radius-medium: ${borderRadius}px;
      --nextui-radius-large: ${borderRadius * 1.5}px;
      font-size: ${fontSizePercent}%;
    }
  `;
}

export function useThemeSettings() {
  const [themeSettings, setThemeSettings] = useState(() => {
    const saved = safeGetItem("themeSettings");
    if (!saved) return DEFAULT_THEME;
    try {
      const parsed = JSON.parse(saved);
      return sanitizeThemeSettings(parsed);
    } catch {
      return DEFAULT_THEME;
    }
  });

  const updateThemeSettings = useCallback((newSettings) => {
    const sanitized = sanitizeThemeSettings(newSettings);
    setThemeSettings(sanitized);
    safeSetItem("themeSettings", JSON.stringify(sanitized));
  }, []);

  const resetThemeSettings = useCallback(() => {
    setThemeSettings(DEFAULT_THEME);
    safeSetItem("themeSettings", JSON.stringify(DEFAULT_THEME));
  }, []);

  useEffect(() => {
    applyThemeStyle(themeSettings);
  }, [themeSettings]);

  return { themeSettings, updateThemeSettings, resetThemeSettings };
}
