import { useEffect, useCallback } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * Tracks dirty form state and warns users before they lose unsaved changes.
 *
 * Handles two scenarios:
 *  1. Browser close / refresh → native `beforeunload` dialog
 *  2. In-app route navigation → React Router `useBlocker` + custom modal
 *
 * @param {boolean} isDirty - Whether the form has unsaved changes
 * @returns {{ blocker: import('react-router-dom').Blocker, isBlocked: boolean, proceed: () => void, reset: () => void }}
 *
 * Usage:
 *   const { isBlocked, proceed, reset } = useUnsavedChanges(dirty);
 *   // Render <UnsavedChangesModal isOpen={isBlocked} onDiscard={proceed} onCancel={reset} />
 */
export function useUnsavedChanges(isDirty) {
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

  // ── In-app navigation ─────────────────────────────────────────
  const blocker = useBlocker(isDirty);

  const isBlocked = blocker.state === 'blocked';

  const proceed = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
  }, [blocker]);

  const reset = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  }, [blocker]);

  return { blocker, isBlocked, proceed, reset };
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
