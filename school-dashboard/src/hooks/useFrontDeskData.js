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
};

export function summarizeKpis({
  visitors = [],
  gatePasses = [],
  appointments = [],
  feedbacks = [],
  calls = [],
} = {}) {
  return {
    visitorsToday: (visitors || []).length,
    visitorsCheckedIn: (visitors || []).filter(
      (v) => !v.checkOutTime
    ).length,
    gatePassesToday: (gatePasses || []).length,
    gatePassesPending: (gatePasses || []).filter(
      (g) => String(g.approvalStatus || g.status || "").toLowerCase() === "pending"
    ).length,
    appointmentsCount: (appointments || []).length,
    feedbacksOpen: (feedbacks || []).filter(
      (f) => String(f.status || "open").toLowerCase() === "open"
    ).length,
    callsCount: (calls || []).length,
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
      time: entity.callTime || entity.createdAt,
      status: String(entity.status || "logged").toLowerCase(),
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
} = {}) {
  const rows = [
    ...visitors.map((v) => toActivityRow(v, ACTIVITY_TYPES.VISITOR)),
    ...gatePasses.map((g) => toActivityRow(g, ACTIVITY_TYPES.GATE_PASS)),
    ...appointments.map((a) => toActivityRow(a, ACTIVITY_TYPES.APPOINTMENT)),
    ...feedbacks.map((f) => toActivityRow(f, ACTIVITY_TYPES.FEEDBACK)),
    ...calls.map((c) => toActivityRow(c, ACTIVITY_TYPES.CALL)),
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
  const visitorsQuery = useQuery({
    queryKey: ["fd-visitors-today"],
    queryFn: () => frontDeskApi.getVisitorsToday(),
  });
  const gatePassesQuery = useQuery({
    queryKey: ["fd-gate-passes-today"],
    queryFn: () => frontDeskApi.getGatePassesToday(),
  });
  const appointmentsQuery = useQuery({
    queryKey: ["fd-appointments"],
    queryFn: () => frontDeskApi.getAppointments(),
  });
  const feedbacksQuery = useQuery({
    queryKey: ["fd-feedbacks"],
    queryFn: () => frontDeskApi.getFeedbacks(),
  });
  const callsQuery = useQuery({
    queryKey: ["fd-call-logs"],
    queryFn: () => frontDeskApi.getCallLogs(),
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
    }),
    [
      visitorsQuery.data,
      gatePassesQuery.data,
      appointmentsQuery.data,
      feedbacksQuery.data,
      callsQuery.data,
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
    },
  };
}
