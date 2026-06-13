import { useCallback, useEffect, useRef, useState } from "react";

/* ============================================================
   useNavHover — hover-driven overlay with "menu-aim" geometry.

   The overlay opens on hover. The hard part is the diagonal:
   when you hover a rail item and the panel opens to its right,
   moving the cursor down-and-right toward the panel's lower
   items sweeps it over the rail items *below* the hovered one.
   Naively, each of those would switch/close the panel.

   We solve it with the classic "safe triangle" (Amazon mega-menu
   / Ben Kamens' jQuery-menu-aim): while the cursor is moving
   into the triangle whose apex is the cursor and whose base is
   the panel's left edge (top→bottom, padded by a tolerance), we
   treat it as "aiming at the panel" and defer switching. Only
   once the cursor stops aiming do we let a newly-hovered item
   take over. This keeps the path from the hovered item all the
   way to the LAST item in the overlay friction-free.
   ============================================================ */

const OPEN_DELAY = 110;   // hover-intent before first open (avoids flash on sweep)
const CLOSE_DELAY = 240;  // grace period before closing on leave (covers the rail↔panel gap)
const AIM_DELAY = 260;    // re-check interval while the cursor is aiming at the panel
const TOLERANCE = 80;     // px added above/below the panel so the corner items stay reachable
const LOC_WINDOW = 200;   // ms of mouse history used to infer movement direction

const slope = (a, b) => (b.y - a.y) / (b.x - a.x);

export function useNavHover() {
  const [openId, setOpenId] = useState(null);
  const [anchorRect, setAnchorRect] = useState(null);

  const openIdRef = useRef(null);
  const lastHovered = useRef(null);     // { id, el } of the most recently entered rail item
  const locs = useRef([]);              // recent { x, y, t } mouse positions
  const openT = useRef(null);
  const closeT = useRef(null);
  const aimT = useRef(null);
  const suppressId = useRef(null);      // id click-closed: don't hover-reopen until pointer leaves it

  useEffect(() => { openIdRef.current = openId; }, [openId]);

  const clearOpen = () => clearTimeout(openT.current);
  const clearClose = () => clearTimeout(closeT.current);
  const clearAim = () => clearTimeout(aimT.current);
  const clearAll = () => { clearOpen(); clearClose(); clearAim(); };

  const doOpen = useCallback((id, el) => {
    clearAll();
    setAnchorRect(el.getBoundingClientRect());
    setOpenId(id);
  }, []);

  const close = useCallback(() => {
    clearAll();
    setOpenId(null);
    setAnchorRect(null);
  }, []);

  // Track the pointer only while a panel is open (the only time aim matters).
  useEffect(() => {
    if (!openId) return undefined;
    const onMove = (e) => {
      const arr = locs.current;
      arr.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
      const cutoff = e.timeStamp - LOC_WINDOW;
      while (arr.length > 2 && arr[0].t < cutoff) arr.shift();
      if (arr.length > 12) arr.shift();
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [openId]);

  // Is the cursor currently moving toward the open panel? (the safe triangle)
  const aimingAtPanel = useCallback(() => {
    const panel = document.getElementById("nav-panel");
    const arr = locs.current;
    if (!panel || arr.length < 2) return false;
    const r = panel.getBoundingClientRect();
    const loc = arr[arr.length - 1];
    const prev = arr[0];
    // A stopped cursor isn't "aiming" — otherwise pausing on a sibling row
    // would pin the panel open forever. (event.timeStamp shares performance's origin.)
    if (performance.now() - loc.t > 150) return false;
    if (loc.x >= r.left) return false; // already at/past the panel's left edge
    const top = { x: r.left, y: r.top - TOLERANCE };
    const bottom = { x: r.left, y: r.bottom + TOLERANCE };
    // Moving toward the panel ⇒ widening cone between the two corners.
    return slope(loc, top) < slope(prev, top) && slope(loc, bottom) > slope(prev, bottom);
  }, []);

  // Switch the open panel to `id`, deferring while the cursor aims at the current panel.
  const possiblyActivate = useCallback((id, el) => {
    clearAim();
    if (openIdRef.current === id) return;
    if (aimingAtPanel()) {
      aimT.current = setTimeout(() => {
        if (lastHovered.current?.id === id) possiblyActivate(id, el);
      }, AIM_DELAY);
    } else {
      doOpen(id, el);
    }
  }, [aimingAtPanel, doOpen]);

  // Hovering a no-panel item should dismiss the panel — unless still aiming at it.
  const possiblyClose = useCallback((id) => {
    clearAim();
    if (aimingAtPanel()) {
      aimT.current = setTimeout(() => {
        if (lastHovered.current?.id === id) possiblyClose(id);
      }, AIM_DELAY);
    } else {
      clearClose();
      closeT.current = setTimeout(close, CLOSE_DELAY);
    }
  }, [aimingAtPanel, close]);

  const onItemEnter = useCallback((section, el) => {
    clearClose();
    lastHovered.current = { id: section.id, el };

    if (!section.panel) {
      if (openIdRef.current) possiblyClose(section.id);
      return;
    }
    if (suppressId.current === section.id) return; // just click-closed; wait for leave
    if (!openIdRef.current) {
      clearOpen();
      openT.current = setTimeout(() => {
        if (lastHovered.current?.id === section.id) doOpen(section.id, el);
      }, OPEN_DELAY);
    } else {
      possiblyActivate(section.id, el);
    }
  }, [doOpen, possiblyActivate, possiblyClose]);

  const onItemLeave = useCallback((section) => {
    clearOpen();
    if (suppressId.current === section?.id) suppressId.current = null;
    if (lastHovered.current?.id === section?.id) lastHovered.current = null;
    if (openIdRef.current) {
      clearClose();
      closeT.current = setTimeout(close, CLOSE_DELAY);
    }
  }, [close]);

  const onPanelEnter = useCallback(() => { clearAll(); }, []);
  const onPanelLeave = useCallback(() => {
    clearClose();
    closeT.current = setTimeout(close, CLOSE_DELAY);
  }, [close]);

  // Click = explicit toggle (touch + keyboard Enter/Space + mouse fallback).
  const onItemClick = useCallback((section, el) => {
    if (openIdRef.current === section.id) {
      suppressId.current = section.id; // don't let hover immediately reopen it
      close();
    } else {
      suppressId.current = null;
      doOpen(section.id, el);
    }
  }, [close, doOpen]);

  const hoverProps = useCallback((section) => ({
    onMouseEnter: (e) => onItemEnter(section, e.currentTarget),
    onMouseLeave: () => onItemLeave(section),
  }), [onItemEnter, onItemLeave]);

  return {
    openId,
    anchorRect,
    close,
    hoverProps,
    onItemClick,
    panelProps: { onMouseEnter: onPanelEnter, onMouseLeave: onPanelLeave },
  };
}
