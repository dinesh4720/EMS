import { useEffect, useRef } from 'react';
import { notificationsApi } from '../services/api';

/**
 * Polls for unread notification count at a fixed interval.
 * Pauses polling while the notification panel is open (it fetches its own data).
 * Clears the interval whenever paused changes or the component unmounts.
 *
 * @param {object} options
 * @param {(count: number) => void} options.onCountChange - Called with the latest unread count
 * @param {boolean} [options.paused=false] - Stop polling while true (e.g. panel is open)
 * @param {number} [options.intervalMs=60000] - Poll interval in milliseconds
 */
export function useLiveNotifications({ onCountChange, paused = false, intervalMs = 60000 }) {
    const onCountChangeRef = useRef(onCountChange);
    onCountChangeRef.current = onCountChange;

    useEffect(() => {
        if (paused) return;

        const fetchUnreadCount = () => {
            notificationsApi.getUnreadCount()
                .then((data) => {
                    onCountChangeRef.current(data?.count ?? 0);
                })
                .catch(() => {
                    onCountChangeRef.current(0);
                });
        };

        fetchUnreadCount();

        const interval = setInterval(fetchUnreadCount, intervalMs);
        return () => clearInterval(interval);
    }, [paused, intervalMs]);
}
