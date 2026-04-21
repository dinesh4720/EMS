import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "ems.commandPalette.recents.v1";
const MAX_RECENTS = 8;

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorage(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* quota exceeded or disabled — silently ignore */
  }
}

export default function useRecentlyViewed() {
  const [recents, setRecents] = useState(() => readStorage());

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setRecents(readStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addRecent = useCallback((item) => {
    if (!item || !item.path) return;
    const entry = {
      key: item.key || `${item.category || "nav"}:${item.path}`,
      path: item.path,
      label: item.label || item.name || item.path,
      sublabel: item.sublabel || "",
      category: item.category || "Navigation",
      iconName: item.iconName || null,
      viewedAt: Date.now(),
    };
    setRecents((prev) => {
      const filtered = prev.filter((existing) => existing.key !== entry.key);
      const next = [entry, ...filtered].slice(0, MAX_RECENTS);
      writeStorage(next);
      return next;
    });
  }, []);

  const clearRecents = useCallback(() => {
    writeStorage([]);
    setRecents([]);
  }, []);

  return { recents, addRecent, clearRecents };
}
