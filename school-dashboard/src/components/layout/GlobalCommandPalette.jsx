import React, { useState, useEffect } from "react";
import CommandPalette from "./CommandPalette";

/**
 * GlobalCommandPalette
 * Mounts the ⌘K command palette and owns its global open triggers, independent
 * of any visible chrome. Previously this lived inside the Topbar; the Topbar was
 * removed (breadcrumb/search bar retired) but the palette must keep working.
 *
 * Open triggers:
 *   ⌘K / Ctrl+K            → open
 *   /                      → open (unless typing in an input/textarea/select)
 *   ems:open-command-palette (CustomEvent) → open  (sidebar search button fires this)
 */
function GlobalCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        return;
      }
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const t = e.target;
        const tag = t?.tagName;
        const isEditable =
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          t?.isContentEditable;
        if (isEditable) return;
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const openPalette = () => setOpen(true);
    window.addEventListener("ems:open-command-palette", openPalette);
    return () =>
      window.removeEventListener("ems:open-command-palette", openPalette);
  }, []);

  return <CommandPalette isOpen={open} onClose={() => setOpen(false)} />;
}

export default React.memo(GlobalCommandPalette);
