import React, { useCallback, useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import {
  isPagePinned,
  togglePinnedPage,
  subscribePinnedPages,
} from "../../utils/pinnedPages";

/**
 * PagePin — pin/unpin the current page to the sidebar shortcuts.
 *
 * Lives next to a page heading (Students, Staff, Classes, …). Replaces the pin
 * control that used to sit in the now-removed Topbar. Pinned state is shared
 * storage, so toggling here keeps the sidebar's pinned list in sync.
 *
 * @param {string} label   Human label stored with the pin (e.g. "Students").
 * @param {string} [href]  Page href to pin. Defaults to the current pathname.
 * @param {number} [size]  Icon size in px.
 */
function PagePin({ label, href, size = 15, className = "" }) {
  const location = useLocation();
  const target = href || location.pathname;

  const [pinned, setPinned] = useState(() => isPagePinned(target));
  useEffect(() => {
    setPinned(isPagePinned(target));
    return subscribePinnedPages(() => setPinned(isPagePinned(target)));
  }, [target]);

  const handlePin = useCallback(() => {
    const nowPinned = togglePinnedPage({ href: target, label });
    setPinned(nowPinned);
    toast.success(nowPinned ? `Pinned "${label}"` : `Unpinned "${label}"`);
  }, [target, label]);

  return (
    <button
      type="button"
      onClick={handlePin}
      aria-pressed={pinned}
      aria-label={pinned ? `Unpin ${label}` : `Pin ${label}`}
      title={pinned ? "Unpin from sidebar" : "Pin to sidebar"}
      data-coach="page-pin"
      className={`pagepin${pinned ? " is-pinned" : ""} ${className}`}
    >
      <Star size={size} aria-hidden fill={pinned ? "currentColor" : "none"} />
    </button>
  );
}

export default React.memo(PagePin);
