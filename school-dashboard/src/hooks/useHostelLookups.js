import { useState, useEffect, useRef, useCallback } from "react";
import { hostelApi, studentsApi } from "../services/api";

/**
 * Custom hook to manage hostel lookup data (hostel list, rooms, students).
 * Students are fetched via debounced server-side search instead of bulk limit:500
 * to avoid loading hundreds of student records per allocation modal open (MF-24).
 *
 * @param {string} hostelIdForRooms - Load available rooms for this hostel
 * @param {string} studentSearch    - Search term for async student lookup (debounced 300ms)
 */
export function useHostelLookups(hostelIdForRooms, studentSearch = "") {
  const [hostels, setHostels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  const clearError = useCallback(() => setError(null), []);

  // Load hostel list once on mount
  useEffect(() => {
    let cancelled = false;
    hostelApi.getHostels()
      .then((d) => { if (!cancelled) setHostels(d.hostels || []); })
      .catch((err) => { if (!cancelled) setError(err.message || "Failed to load hostels"); });
    return () => { cancelled = true; };
  }, []);

  // Load available rooms when selected hostel changes
  useEffect(() => {
    let cancelled = false;
    if (hostelIdForRooms) {
      hostelApi.getRooms({ hostelId: hostelIdForRooms, available: true })
        .then((d) => { if (!cancelled) setRooms(d.rooms || []); })
        .catch((err) => { if (!cancelled) setError(err.message || "Failed to load rooms"); });
    } else {
      setRooms([]);
    }
    return () => { cancelled = true; };
  }, [hostelIdForRooms]);

  // Debounced server-side search — only fires after 300ms idle, min 2 chars
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!studentSearch || studentSearch.trim().length < 2) {
      setStudents([]);
      return;
    }

    let cancelled = false;

    debounceRef.current = setTimeout(async () => {
      if (!cancelled) setStudentsLoading(true);
      try {
        const data = await studentsApi.list({ search: studentSearch.trim(), limit: 30 });
        if (!cancelled) setStudents(data.data || []);
      } catch (err) {
        if (!cancelled) {
          setStudents([]);
          setError(err.message || "Failed to search students");
        }
      } finally {
        if (!cancelled) setStudentsLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(debounceRef.current);
    };
  }, [studentSearch]);

  return { hostels, rooms, students, studentsLoading, error, clearError };
}
