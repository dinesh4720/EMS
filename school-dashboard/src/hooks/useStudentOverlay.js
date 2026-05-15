import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

// Mobile cut-off — below this we navigate to /students/:id full route
// instead of opening the overlay.
export const OVERLAY_MIN_WIDTH = 768;

// Pure helpers — kept exported so they can be unit-tested without React.
export function getStudentIdFromSearch(search) {
  const params =
    search instanceof URLSearchParams
      ? search
      : new URLSearchParams(search || "");
  return params.get("student") || null;
}

export function withStudentId(search, id) {
  const params =
    search instanceof URLSearchParams
      ? new URLSearchParams(search)
      : new URLSearchParams(search || "");
  if (id) params.set("student", String(id));
  else params.delete("student");
  return params;
}

// Index helpers for ↑/↓ row navigation. Wrap-around is intentional —
// matches the staff-list pattern from Phase 3 where you can keep
// pressing down to cycle.
export function nextRowIndex(currentIdx, total) {
  if (!Number.isFinite(total) || total <= 0) return null;
  if (currentIdx == null || currentIdx < 0) return 0;
  return (currentIdx + 1) % total;
}

export function prevRowIndex(currentIdx, total) {
  if (!Number.isFinite(total) || total <= 0) return null;
  if (currentIdx == null || currentIdx < 0) return total - 1;
  return (currentIdx - 1 + total) % total;
}

export function isOverlayViewport(width) {
  return Number.isFinite(width) && width >= OVERLAY_MIN_WIDTH;
}

/**
 * Phase 5b — drives the frosted student overlay.
 *
 * Returns:
 *   studentId  — current ?student=… value (null when closed)
 *   open(id)   — open overlay for given studentId
 *   close()    — clear ?student=
 *   navigate(direction, rows) — call with 'next' | 'prev' and the ordered
 *                               list of student ids in the underlying
 *                               surface; updates ?student= to neighbour.
 *
 * Esc binding is wired here so callers don't need their own keydown
 * handler. ↑/↓ are NOT auto-bound — callers attach them to the row
 * list (so keystrokes inside form inputs don't trigger nav).
 */
export default function useStudentOverlay() {
  const [searchParams, setSearchParams] = useSearchParams();
  const studentId = getStudentIdFromSearch(searchParams);

  const open = useCallback(
    (id) => {
      if (!id) return;
      setSearchParams(
        (prev) => withStudentId(prev, id),
        { replace: false }
      );
    },
    [setSearchParams]
  );

  const close = useCallback(() => {
    setSearchParams(
      (prev) => withStudentId(prev, null),
      { replace: false }
    );
  }, [setSearchParams]);

  const navigate = useCallback(
    (direction, rows) => {
      if (!Array.isArray(rows) || rows.length === 0) return;
      const idx = rows.indexOf(studentId);
      const nextIdx =
        direction === "next"
          ? nextRowIndex(idx, rows.length)
          : prevRowIndex(idx, rows.length);
      if (nextIdx == null) return;
      const nextId = rows[nextIdx];
      if (nextId) open(nextId);
    },
    [studentId, open]
  );

  // Esc closes the overlay globally — but only when one is open.
  useEffect(() => {
    if (!studentId) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [studentId, close]);

  return useMemo(
    () => ({ studentId, isOpen: !!studentId, open, close, navigate }),
    [studentId, open, close, navigate]
  );
}
