import { useEffect, useRef } from 'react';
import socketServiceEnhanced from '../services/socketServiceEnhanced';

/**
 * useRealtimeUpdates
 *
 * Subscribes to socket events from the singleton socketServiceEnhanced and
 * guarantees exactly one listener per event per hook invocation. Fixes the
 * memory-leak pattern where repeated mounts/unmounts cause stale callbacks to
 * accumulate in the module-level listeners Map.
 *
 * How it works
 * ------------
 * • One stable wrapper function is created per event at mount time.
 * • Each wrapper reads the latest handler via a ref, so callers can pass new
 *   inline functions each render without ever registering duplicate listeners.
 * • On unmount the exact wrapper references are passed to off(), ensuring
 *   indexOf() finds and removes them (undefined references are never passed).
 *
 * Usage
 * -----
 *   useRealtimeUpdates({
 *     student_updated: (data) => handleStudentUpdate(data),
 *     fee_payment_created: (data) => handleFeePayment(data),
 *   });
 *
 * @param {Record<string, Function>} eventHandlers  Map of socket event → handler
 */
export function useRealtimeUpdates(eventHandlers) {
  // Always reflects the latest handlers without triggering re-subscriptions
  const handlersRef = useRef(eventHandlers);
  handlersRef.current = eventHandlers;

  // Capture the event names once at definition time so the effect closure and
  // cleanup both reference the same fixed set.
  const eventNamesRef = useRef(null);
  if (eventNamesRef.current === null) {
    eventNamesRef.current = Object.keys(eventHandlers);
  }

  useEffect(() => {
    const events = eventNamesRef.current;
    if (events.length === 0) return;

    // Create one stable wrapper per event — registered exactly once per mount.
    // The wrapper delegates to handlersRef.current so no re-subscription is
    // needed when the caller's handler identity changes across renders.
    const wrappers = {};
    events.forEach((event) => {
      wrappers[event] = (data) => handlersRef.current[event]?.(data);
      socketServiceEnhanced.on(event, wrappers[event]);
    });

    return () => {
      // Pass exact wrapper references so the singleton's indexOf() call
      // always finds and removes the correct entry (never receives undefined).
      events.forEach((event) => {
        socketServiceEnhanced.off(event, wrappers[event]);
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // ^ Empty deps: event set is fixed at mount; latest handlers are read via ref.
}
