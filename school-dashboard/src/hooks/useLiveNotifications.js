import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../services/api';

/**
 * Polls for the unread notification count at a fixed interval.
 *
 * [DK-846] Migrated from a hand-rolled setInterval + fetch to React Query's
 * `refetchInterval`. This dedupes the request with any other consumer of the
 * same query key, picks up the shared retry/backoff config (lib/queryClient.js),
 * and surfaces the query in React Query Devtools. Polling pauses while the
 * notification panel is open (it fetches its own data) via `enabled: !paused`.
 *
 * [MEM-12] Long-session stability: `refetchIntervalInBackground: false` skips
 * the poll while the tab is hidden, and the query's AbortSignal is threaded
 * into the fetch so the in-flight request is cancelled on unmount or when the
 * query is otherwise dropped — no dangling request after the bell goes away.
 *
 * @param {object} options
 * @param {(count: number) => void} options.onCountChange - Called with the latest unread count
 * @param {boolean} [options.paused=false] - Stop polling while true (e.g. panel is open)
 * @param {number} [options.intervalMs=60000] - Poll interval in milliseconds
 */
export function useLiveNotifications({ onCountChange, paused = false, intervalMs = 60000 }) {
    const onCountChangeRef = useRef(onCountChange);
    onCountChangeRef.current = onCountChange;

    const { data, isError } = useQuery({
        queryKey: ['notifications', 'unread-count'],
        // Forward React Query's AbortSignal so the in-flight request is
        // cancelled when the query is dropped (unmount / cache eviction).
        queryFn: ({ signal }) => notificationsApi.getUnreadCount({ signal }),
        enabled: !paused,
        refetchInterval: paused ? false : intervalMs,
        // Keep the poll lightweight: don't refetch a hidden tab on its interval.
        refetchIntervalInBackground: false,
        select: (res) => res?.count ?? 0,
    });

    // Mirror the query result into the caller's setter. While paused we leave the
    // count untouched — the open panel owns it. On error fall back to 0, matching
    // the previous hand-rolled behaviour.
    useEffect(() => {
        if (paused) return;
        if (isError) {
            onCountChangeRef.current(0);
            return;
        }
        if (data !== undefined) {
            onCountChangeRef.current(data);
        }
    }, [data, isError, paused]);
}
