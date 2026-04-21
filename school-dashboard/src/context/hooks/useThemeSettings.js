import { useState, useEffect } from "react";
import { z } from "zod";
import { safeGetItem, safeSetItem } from "../../utils/safeStorage";

const DEFAULT_THEME = {
  mode: "light",
  fontFamily: "Inter",
  fontSizeScale: 1,
  borderRadius: 12,
  reduceMotion: false,
};

// Validate cached theme data field-by-field so missing/invalid fields
// fall back to safe defaults rather than producing NaN CSS values.
const ThemeSettingsSchema = z.object({
  mode: z.enum(["light", "dark"]).catch(DEFAULT_THEME.mode),
  fontFamily: z.string().min(1).catch(DEFAULT_THEME.fontFamily),
  fontSizeScale: z.number().min(0.5).max(2).catch(DEFAULT_THEME.fontSizeScale),
  borderRadius: z.number().min(0).max(64).catch(DEFAULT_THEME.borderRadius),
  reduceMotion: z.boolean().catch(DEFAULT_THEME.reduceMotion),
});

function loadThemeSettings() {
  const saved = safeGetItem("themeSettings");
  if (!saved) return DEFAULT_THEME;
  try {
    const parsed = JSON.parse(saved);
    return ThemeSettingsSchema.parse(parsed);
  } catch {
    return DEFAULT_THEME;
  }
}

export function useThemeSettings() {
  const [themeSettings, setThemeSettings] = useState(loadThemeSettings);

  const updateThemeSettings = (newSettings) => {
    setThemeSettings(newSettings);
    safeSetItem("themeSettings", JSON.stringify(newSettings));
  };

  const resetThemeSettings = () => {
    setThemeSettings(DEFAULT_THEME);
    safeSetItem("themeSettings", JSON.stringify(DEFAULT_THEME));
  };

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--font-sans", `"${themeSettings.fontFamily}", sans-serif`);
    root.style.setProperty("--nextui-radius-small", `${themeSettings.borderRadius * 0.5}px`);
    root.style.setProperty("--nextui-radius-medium", `${themeSettings.borderRadius}px`);
    root.style.setProperty("--nextui-radius-large", `${themeSettings.borderRadius * 1.5}px`);
    root.style.fontSize = `${themeSettings.fontSizeScale * 100}%`;
  }, [themeSettings]);

  return { themeSettings, updateThemeSettings, resetThemeSettings };
}
