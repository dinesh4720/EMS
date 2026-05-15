import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { frontDeskApi } from "../services/api";

// Phase 9 — Front Desk data + KPIs.
// Pure helpers exported for testing without React.

export const ACTIVITY_TYPES = {
  VISITOR: "visitors",
  GATE_PASS: "gate-passes",
  APPOINTMENT: "appointments",
  FEEDBACK: "feedbacks",
  CALL: "calls",
  ADMISSION: "admissions",
};

// Local-time "is today" — fixes timezone miscounts where toISOString()
// would treat late-evening local timestamps as the next UTC day.
function isToday(value) {
  if (!value) return false;
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function summarizeKpis({
  visitors = [],
  gatePasses = [],
  appointments = [],
  feedbacks = [],
  calls = [],
  admissions = [],
} = {}) {
  const appts = appointments || [];
  const apptToday = appts.filter((a) =>
    isToday(a.fromDateTime || a.appointmentDate || a.createdAt)
  );
  const callsArr = calls || [];
  const callsToday = callsArr.filter((c) =>
    isToday(c.callTime || c.dateTime || c.createdAt)
  );
  const admArr = admissions || [];
  return {
    visitorsToday: (visitors || []).length,
    visitorsCheckedIn: (visitors || []).filter((v) => !v.checkOutTime).length,
    gatePassesToday: (gatePasses || []).length,
    gatePassesPending: (gatePasses || []).filter(
      (g) => String(g.approvalStatus || g.status || "").toLowerCase() === "pending"
    ).length,
    appointmentsToday: apptToday.length,
    appointmentsCount: appts.length,
    feedbacksOpen: (feedbacks || []).filter(
      (f) => String(f.status || "open").toLowerCase() === "open"
    ).length,
    callsToday: callsToday.length,
    callsCount: callsArr.length,
    admissionsToday: admArr.filter((a) =>
      isToday(a.applicationDate || a.createdAt)
    ).length,
    admissionsPending: admArr.filter(
      (a) => String(a.status || "").toLowerCase() === "pending"
    ).length,
  };
}

// Normalize an entity from any source into a unified "activity row".
// Each row has: id, type, name, sub, time, status, raw (original).
export function toActivityRow(entity, type) {
  if (!entity) return null;
  if (type === ACTIVITY_TYPES.VISITOR) {
    return {
      id: entity._id || entity.id,
      type,
      name: entity.name || "—",
      sub: entity.purpose || entity.whomToMeet || "",
      time: entity.checkInTime || entity.createdAt,
      status: entity.checkOutTime ? "checked-out" : "in",
      raw: entity,
    };
  }
  if (type === ACTIVITY_TYPES.GATE_PASS) {
    return {
      id: entity._id || entity.id,
      type,
      name: entity.studentName || entity.student?.name || "—",
      sub: entity.reason || "",
      time: entity.leavingDateTime || entity.createdAt,
      status:
        String(entity.approvalStatus || entity.status || "pending").toLowerCase(),
      raw: entity,
    };
  }
  if (type === ACTIVITY_TYPES.APPOINTMENT) {
    return {
      id: entity._id || entity.id,
      type,
      name: entity.visitorName || "—",
      sub: entity.purpose || entity.meetingWith || "",
      time: entity.fromDateTime || entity.createdAt,
      status: String(entity.status || "scheduled").toLowerCase(),
      raw: entity,
    };
  }
  if (type === ACTIVITY_TYPES.FEEDBACK) {
    return {
      id: entity._id || entity.id,
      type,
      name: entity.name || "—",
      sub: entity.message?.slice(0, 60) || entity.subject || "",
      time: entity.createdAt,
      status: String(entity.status || "open").toLowerCase(),
      raw: entity,
    };
  }
  if (type === ACTIVITY_TYPES.CALL) {
    return {
      id: entity._id || entity.id,
      type,
      name: entity.callerName || "—",
      sub: entity.purpose || "",
      time: entity.callTime || entity.dateTime || entity.createdAt,
      status: String(entity.status || "logged").toLowerCase(),
      raw: entity,
    };
  }
  if (type === ACTIVITY_TYPES.ADMISSION) {
    return {
      id: entity._id || entity.id,
      type,
      name: entity.studentName || entity.applicantName || "—",
      sub: entity.classApplied || entity.grade || "",
      time: entity.applicationDate || entity.createdAt,
      status: String(entity.status || "pending").toLowerCase(),
      raw: entity,
    };
  }
  return null;
}

// Combine all activity into a single sorted list (most recent first).
export function combineActivity({
  visitors = [],
  gatePasses = [],
  appointments = [],
  feedbacks = [],
  calls = [],
  admissions = [],
} = {}) {
  const rows = [
    ...visitors.map((v) => toActivityRow(v, ACTIVITY_TYPES.VISITOR)),
    ...gatePasses.map((g) => toActivityRow(g, ACTIVITY_TYPES.GATE_PASS)),
    ...appointments.map((a) => toActivityRow(a, ACTIVITY_TYPES.APPOINTMENT)),
    ...feedbacks.map((f) => toActivityRow(f, ACTIVITY_TYPES.FEEDBACK)),
    ...calls.map((c) => toActivityRow(c, ACTIVITY_TYPES.CALL)),
    ...admissions.map((a) => toActivityRow(a, ACTIVITY_TYPES.ADMISSION)),
  ].filter(Boolean);
  rows.sort((a, b) => {
    const ta = a.time ? new Date(a.time).getTime() : 0;
    const tb = b.time ? new Date(b.time).getTime() : 0;
    return tb - ta;
  });
  return rows;
}

export function filterActivity(rows, { type = "all", search = "" } = {}) {
  const list = Array.isArray(rows) ? rows : [];
  const q = String(search || "").trim().toLowerCase();
  return list.filter((r) => {
    if (type !== "all" && r.type !== type) return false;
    if (q) {
      const haystack = [r.name, r.sub].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

/**
 * Phase 9 main data hook. Fans out to 5 endpoints in parallel via TanStack
 * Query, then combines + summarizes. KPI cells are derived from raw data.
 */
export default function useFrontDeskData({ type = "all", search = "" } = {}) {
  // refetchOnWindowFocus keeps "today" counts fresh when the receptionist
  // tabs back to the dashboard after using another surface.
  const queryOpts = { refetchOnWindowFocus: true, staleTime: 30_000 };
  const visitorsQuery = useQuery({
    queryKey: ["fd-visitors-today"],
    queryFn: () => frontDeskApi.getVisitorsToday(),
    ...queryOpts,
  });
  const gatePassesQuery = useQuery({
    queryKey: ["fd-gate-passes-today"],
    queryFn: () => frontDeskApi.getGatePassesToday(),
    ...queryOpts,
  });
  const appointmentsQuery = useQuery({
    queryKey: ["fd-appointments"],
    queryFn: () => frontDeskApi.getAppointments(),
    ...queryOpts,
  });
  const feedbacksQuery = useQuery({
    queryKey: ["fd-feedbacks"],
    queryFn: () => frontDeskApi.getFeedbacks(),
    ...queryOpts,
  });
  const callsQuery = useQuery({
    queryKey: ["fd-call-logs"],
    queryFn: () => frontDeskApi.getCallLogs(),
    ...queryOpts,
  });
  const admissionsQuery = useQuery({
    queryKey: ["fd-admissions"],
    queryFn: () => frontDeskApi.getAdmissions(),
    ...queryOpts,
  });

  const buckets = useMemo(
    () => ({
      visitors: visitorsQuery.data || [],
      gatePasses: gatePassesQuery.data || [],
      appointments:
        appointmentsQuery.data?.data ||
        appointmentsQuery.data ||
        [],
      feedbacks:
        feedbacksQuery.data?.data || feedbacksQuery.data || [],
      calls: callsQuery.data?.data || callsQuery.data || [],
      admissions:
        admissionsQuery.data?.data || admissionsQuery.data || [],
    }),
    [
      visitorsQuery.data,
      gatePassesQuery.data,
      appointmentsQuery.data,
      feedbacksQuery.data,
      callsQuery.data,
      admissionsQuery.data,
    ]
  );

  const kpis = useMemo(() => summarizeKpis(buckets), [buckets]);
  const all = useMemo(() => combineActivity(buckets), [buckets]);
  const filtered = useMemo(
    () => filterActivity(all, { type, search }),
    [all, type, search]
  );

  return {
    kpis,
    all,
    filtered,
    isLoading:
      visitorsQuery.isPending ||
      gatePassesQuery.isPending ||
      appointmentsQuery.isPending,
    refetch: () => {
      visitorsQuery.refetch();
      gatePassesQuery.refetch();
      appointmentsQuery.refetch();
      feedbacksQuery.refetch();
      callsQuery.refetch();
      admissionsQuery.refetch();
    },
  };
}
