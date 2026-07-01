import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { hostelApi, studentsApi } from "../services/api";
import { useDebounce } from "./useDebounce";

/**
 * Custom hook to manage hostel lookup data (hostel list, rooms, students).
 *
 * [DK-846] Migrated from hand-rolled useState/useEffect fetching to React Query
 * so the lookups get caching, request deduplication, background refetch and the
 * shared retry/backoff config for free (see lib/queryClient.js). Students are
 * still fetched via a debounced server-side search instead of a bulk limit:500
 * load, to avoid pulling hundreds of records every time the allocation modal
 * opens (MF-24).
 *
 * @param {string} hostelIdForRooms - Load available rooms for this hostel (allocation modal)
 * @param {string} studentSearch    - Search term for async student lookup (debounced 300ms)
 * @param {string} filterHostelId   - Load *all* rooms for this hostel to drive the list's
 *                                     room filter dropdown (PAG-20). Unlike the modal lookup
 *                                     this is not restricted to rooms with free beds, since a
 *                                     full room still has allocations worth filtering by.
 */
const LOOKUPS_KEY = "hostel-lookups";

export function useHostelLookups(hostelIdForRooms, studentSearch = "", filterHostelId = "") {
  const queryClient = useQueryClient();

  // Raw term drives show/hide immediately (so clearing the field hides results
  // at once); the debounced term drives the query so we don't fire a request on
  // every keystroke (MF-24).
  const rawSearch = (studentSearch || "").trim();
  const debouncedSearch = useDebounce(rawSearch, 300);
  const queryEnabled = debouncedSearch.length >= 2;
  const showStudents = rawSearch.length >= 2;

  const hostelsQuery = useQuery({
    queryKey: [LOOKUPS_KEY, "hostels"],
    queryFn: () => hostelApi.getHostels(),
    select: (res) => res?.hostels || [],
  });

  const roomsQuery = useQuery({
    queryKey: [LOOKUPS_KEY, "rooms", hostelIdForRooms || null],
    queryFn: () => hostelApi.getRooms({ hostelId: hostelIdForRooms, available: true }),
    enabled: Boolean(hostelIdForRooms),
    select: (res) => res?.rooms || [],
  });

  // Rooms for the list's room filter (PAG-20): every room in the selected
  // hostel, not just those with free beds, so the filter can target full rooms.
  const filterRoomsQuery = useQuery({
    queryKey: [LOOKUPS_KEY, "filter-rooms", filterHostelId || null],
    queryFn: () => hostelApi.getRooms({ hostelId: filterHostelId }),
    enabled: Boolean(filterHostelId),
    select: (res) => res?.rooms || [],
  });

  const studentsQuery = useQuery({
    queryKey: [LOOKUPS_KEY, "student-search", debouncedSearch],
    queryFn: () => studentsApi.list({ search: debouncedSearch, limit: 30 }),
    enabled: queryEnabled,
    placeholderData: (prev) => prev,
    select: (res) => res?.data || [],
  });

  // Preserve the previous string-message error contract (first error wins).
  const error =
    hostelsQuery.error?.message ||
    roomsQuery.error?.message ||
    filterRoomsQuery.error?.message ||
    studentsQuery.error?.message ||
    null;

  const clearError = useCallback(() => {
    queryClient.resetQueries({ queryKey: [LOOKUPS_KEY] });
  }, [queryClient]);

  return {
    hostels: hostelsQuery.data || [],
    rooms: hostelIdForRooms ? (roomsQuery.data || []) : [],
    filterRooms: filterHostelId ? (filterRoomsQuery.data || []) : [],
    students: showStudents ? (studentsQuery.data || []) : [],
    studentsLoading: showStudents && studentsQuery.isFetching,
    error,
    clearError,
  };
}
