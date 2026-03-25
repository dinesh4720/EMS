import { useEffect, useCallback, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Tracks dirty form state and warns users before they lose unsaved changes.
 *
 * Handles two scenarios:
 *  1. Browser close / refresh → native `beforeunload` dialog
 *  2. In-app route navigation → intercepts via `popstate` + custom modal
 *
 * NOTE: Uses a BrowserRouter-compatible approach (no useBlocker / data router).
 *
 * @param {boolean} isDirty - Whether the form has unsaved changes
 * @returns {{ isBlocked: boolean, proceed: () => void, reset: () => void }}
 *
 * Usage:
 *   const { isBlocked, proceed, reset } = useUnsavedChanges(dirty);
 *   // Render <UnsavedChangesModal isOpen={isBlocked} onDiscard={proceed} onCancel={reset} />
 */
export function useUnsavedChanges(isDirty) {
  const [isBlocked, setIsBlocked] = useState(false);
  const pendingNavigationRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  // ── Browser close / refresh ────────────────────────────────────
  useEffect(() => {
    if (!isDirty) return;

    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // ── Browser back/forward button ────────────────────────────────
  useEffect(() => {
    if (!isDirty) return;

    const handlePopState = () => {
      if (isDirtyRef.current) {
        // Push current location back to stay on this page
        window.history.pushState(null, '', location.pathname + location.search);
        // Store that user wants to go back
        pendingNavigationRef.current = { type: 'back' };
        setIsBlocked(true);
      }
    };

    // Push an extra entry so we can intercept back navigation
    window.history.pushState(null, '', location.pathname + location.search);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isDirty, location.pathname, location.search]);

  const proceed = useCallback(() => {
    setIsBlocked(false);
    const pending = pendingNavigationRef.current;
    pendingNavigationRef.current = null;

    if (pending?.type === 'back') {
      // Go back two entries: the extra one we pushed + the real back
      window.history.go(-2);
    } else if (pending?.path) {
      navigate(pending.path);
    }
  }, [navigate]);

  const reset = useCallback(() => {
    setIsBlocked(false);
    pendingNavigationRef.current = null;
  }, []);

  return { isBlocked, proceed, reset };
}

/**
 * Lightweight version for components rendered outside the router
 * (e.g. modals, drawers) that only need beforeunload protection.
 *
 * @param {boolean} isDirty
 */
export function useBeforeUnloadWarning(isDirty) {
  useEffect(() => {
    if (!isDirty) return;

    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);
}
