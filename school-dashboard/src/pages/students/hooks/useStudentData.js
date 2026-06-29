import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { attendanceApi, examsApi, studentsApi } from "../../../services/api";
import { buildUpcoming } from "../components/dashboard/utils";

function normalizeAttendanceStatus(status = "") {
  const s = status.toLowerCase().trim();
  if (s === "p" || s === "present") return "present";
  if (s === "a" || s === "absent") return "absent";
  return s;
}

function calculateAttendanceStats(records = []) {
  const normalized = records.map((r) => normalizeAttendanceStatus(r.status));
  const present = normalized.filter((s) => s === "present").length;
  const absent = normalized.filter((s) => s === "absent").length;
  const total = records.length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  return { present, absent, total, percentage };
}

export function useStudentData(studentId, options = {}) {
  const { autoFetch = true } = options;
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ["students", "detail", studentId], [studentId]);

  const studentQuery = useQuery({
    queryKey,
    enabled: Boolean(studentId) && autoFetch,
    queryFn: () => studentsApi.getById(studentId),
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  const updateMutation = useMutation({
    mutationFn: (updates) => studentsApi.update(studentId, updates),
    onSuccess: (updatedStudent) => {
      queryClient.setQueryData(queryKey, (currentStudent) => ({
        ...(currentStudent || {}),
        ...(updatedStudent || {}),
      }));
      void queryClient.invalidateQueries({ queryKey: ["app-context-data"] });
    },
  });

  return {
    student: studentQuery.data || null,
    loading: studentQuery.isPending || updateMutation.isPending,
    error: studentQuery.error?.message || updateMutation.error?.message || null,
    refetch: studentQuery.refetch,
    updateStudent: updateMutation.mutateAsync,
  };
}

export function useStudentAttendance(studentId, options = {}) {
  const { autoFetch = true, startDate, endDate } = options;
  const attendanceQuery = useQuery({
    queryKey: ["students", "attendance", studentId, startDate || null, endDate || null],
    enabled: Boolean(studentId) && autoFetch,
    queryFn: () => attendanceApi.getStudentAttendance(studentId, startDate, endDate),
  });

  const attendanceData = attendanceQuery.data || [];
  const attendanceStats = useMemo(() => calculateAttendanceStats(attendanceData), [attendanceData]);

  return {
    attendanceData,
    attendanceStats,
    loading: attendanceQuery.isPending,
    error: attendanceQuery.error?.message || null,
    refetch: attendanceQuery.refetch,
  };
}

export function useStudentResults(studentId, options = {}) {
  const { autoFetch = true, academicYear } = options;
  const resultsQuery = useQuery({
    queryKey: ["students", "results", studentId, academicYear || null],
    enabled: Boolean(studentId) && autoFetch,
    queryFn: () => studentsApi.getResults(studentId, academicYear),
  });

  return {
    results: resultsQuery.data || [],
    loading: resultsQuery.isPending,
    error: resultsQuery.error?.message || null,
    refetch: resultsQuery.refetch,
  };
}

export function useStudentRemarks(studentId, options = {}) {
  const { autoFetch = true, category = "all" } = options;
  const remarksQuery = useQuery({
    queryKey: ["students", "remarks", studentId, category],
    enabled: Boolean(studentId) && autoFetch,
    queryFn: () => studentsApi.getRemarks(studentId, category),
  });

  return {
    remarks: remarksQuery.data || [],
    loading: remarksQuery.isPending,
    error: remarksQuery.error?.message || null,
    refetch: remarksQuery.refetch,
  };
}

// MOCK-09 · Upcoming-card feed.
// Fetches the student's class exams and derives the { date, title, meta }
// items the Overview panel's UpcomingCard renders. Returns an empty list on
// fetch failure or while the student record (and thus classId) is loading.
export function useStudentUpcoming(classId, options = {}) {
  const { autoFetch = true } = options;
  const examsQuery = useQuery({
    queryKey: ["students", "upcoming-exams", classId || null],
    enabled: Boolean(classId) && autoFetch,
    queryFn: async () => {
      const res = await examsApi.getByClass(classId);
      return Array.isArray(res) ? res : res?.data || res?.exams || [];
    },
    retry: 1,
  });

  const upcoming = useMemo(
    () => buildUpcoming(examsQuery.data || []),
    [examsQuery.data]
  );

  return {
    upcoming,
    loading: examsQuery.isPending,
    error: examsQuery.error?.message || null,
  };
}

export default useStudentData;
