import { useState, useEffect } from "react";
import { safeGetItem, safeSetItem } from "../../utils/safeStorage";

const DEFAULT_THEME = {
  mode: "light",
  fontFamily: "Inter",
  fontSizeScale: 1,
  borderRadius: 12,
  reduceMotion: false,
};

export function useThemeSettings() {
  const [themeSettings, setThemeSettings] = useState(() => {
    const saved = safeGetItem("themeSettings");
    if (!saved) return DEFAULT_THEME;
    try {
      return JSON.parse(saved);
    } catch {
      return DEFAULT_THEME;
    }
  });

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
