import { useState, useEffect, useRef } from "react";
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
  const debounceRef = useRef(null);

  // Load hostel list once on mount
  useEffect(() => {
    hostelApi.getHostels().then((d) => setHostels(d.hostels || [])).catch(() => {});
  }, []);

  // Load available rooms when selected hostel changes
  useEffect(() => {
    if (hostelIdForRooms) {
      hostelApi.getRooms({ hostelId: hostelIdForRooms, available: true })
        .then((d) => setRooms(d.rooms || []))
        .catch(() => {});
    } else {
      setRooms([]);
    }
  }, [hostelIdForRooms]);

  // Debounced server-side search — only fires after 300ms idle, min 2 chars
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!studentSearch || studentSearch.trim().length < 2) {
      setStudents([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setStudentsLoading(true);
      try {
        const data = await studentsApi.list({ search: studentSearch.trim(), limit: 30 });
        setStudents(data.data || []);
      } catch {
        setStudents([]);
      } finally {
        setStudentsLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [studentSearch]);

  return { hostels, rooms, students, studentsLoading };
}
