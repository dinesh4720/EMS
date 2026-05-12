import { safeGetItem, safeSetItem } from "./safeStorage";

const KEY = "ems.pinnedPages.v1";
const EVENT = "ems:pinned-pages-changed";
const MAX_PINS = 8;

function read() {
  try {
    const raw = safeGetItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (pin) => pin && typeof pin.href === "string" && typeof pin.label === "string"
    );
  } catch {
    return [];
  }
}

function write(list) {
  safeSetItem(KEY, JSON.stringify(list));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT));
  }
}

export function getPinnedPages() {
  return read();
}

export function isPagePinned(href) {
  return read().some((pin) => pin.href === href);
}

export function togglePinnedPage(item) {
  const list = read();
  const idx = list.findIndex((pin) => pin.href === item.href);
  if (idx >= 0) {
    list.splice(idx, 1);
    write(list);
    return false;
  }
  const next = [{ href: item.href, label: item.label }, ...list].slice(0, MAX_PINS);
  write(next);
  return true;
}

export function subscribePinnedPages(cb) {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb(read());
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
