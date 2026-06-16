import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { feesApi } from "../services/api";
import { useApp } from "../context/AppContext";

// Phase 7 — fees data + filter + KPIs
// Pure helpers exported so they can be unit-tested without React.

export const PAYMENT_STATUS = {
  PAID: "paid",
  PENDING: "pending",
  OVERDUE: "overdue",
};

// Derive a single payment's effective status given today's date.
// `payment.status` from the backend is the source of truth when "paid".
// "pending" entries become "overdue" once their dueDate is past.
export function derivePaymentStatus(payment, now = new Date()) {
  if (!payment) return PAYMENT_STATUS.PENDING;
  const raw = String(payment.status || "").toLowerCase();
  if (raw === "paid" || raw === "completed") return PAYMENT_STATUS.PAID;
  if (raw === "overdue") return PAYMENT_STATUS.OVERDUE;
  // Pending — escalate to overdue if past dueDate
  const dueDate = payment.dueDate || payment.due_at;
  if (dueDate) {
    const due = new Date(dueDate);
    if (Number.isFinite(due.getTime()) && due < now) {
      return PAYMENT_STATUS.OVERDUE;
    }
  }
  return PAYMENT_STATUS.PENDING;
}

// Sum money helper — handles undefined/string-encoded numbers.
function num(v) {
  if (v == null || v === "") return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

// Is the given timestamp on the same calendar day as `now`?
export function isSameDay(timestamp, now = new Date()) {
  if (!timestamp) return false;
  const d = new Date(timestamp);
  if (!Number.isFinite(d.getTime())) return false;
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

// Compute the 3 KPI cells from a payments list.
// `now` is injectable for tests.
export function computeKpis(payments, now = new Date()) {
  const list = Array.isArray(payments) ? payments : [];
  let collectedToday = 0;
  let outstandingTotal = 0;
  const overdueStudentIds = new Set();

  for (const p of list) {
    const status = derivePaymentStatus(p, now);
    const amount = num(p.amount);
    if (status === PAYMENT_STATUS.PAID) {
      const paidAt = p.paidAt || p.paymentDate || p.collectedAt || p.createdAt;
      if (isSameDay(paidAt, now)) collectedToday += amount;
    } else {
      // Pending or overdue → counts toward outstanding
      const due = num(p.balanceAmount ?? p.amountDue ?? p.amount);
      outstandingTotal += due;
      if (status === PAYMENT_STATUS.OVERDUE) {
        const sid = p.studentId?._id || p.studentId || p.student?._id;
        if (sid) overdueStudentIds.add(String(sid));
      }
    }
  }
  return {
    collectedToday,
    outstandingTotal,
    overdueCount: overdueStudentIds.size,
  };
}

// Build a fast lookup index of students by id (handles _id / id variants).
export function indexStudentsById(students) {
  const map = new Map();
  for (const s of students || []) {
    const id = String(s?._id || s?.id || "");
    if (id) map.set(id, s);
  }
  return map;
}

// Enrich each payment with `payment.student = { _id, name, admissionNo,
// rollNo, classId, className }`. Three input cases:
//   1. payment.student.name already set    → leave as-is
//   2. payment.studentId is a populated object {_id, name, ...}
//                                         → promote it to payment.student
//   3. payment.studentId is a bare ObjectId → look up in studentsIndex
//
// Preserves the original payment object (non-destructive merge).
export function joinStudentsToPayments(payments, studentsIndex) {
  const list = Array.isArray(payments) ? payments : [];
  return list.map((p) => {
    if (p.student?.name) return p; // (1) already populated client-side
    // (2) studentId is a populated object — promote to payment.student
    if (p.studentId && typeof p.studentId === "object" && p.studentId.name) {
      const sid = p.studentId._id || p.studentId.id;
      // Pick up extra fields (rollNo, className) from index when available.
      const extra =
        studentsIndex && sid ? studentsIndex.get(String(sid)) : null;
      return {
        ...p,
        student: {
          _id: sid,
          name: p.studentId.name,
          admissionNo:
            p.studentId.admissionNo ||
            p.studentId.admissionId ||
            extra?.admissionNo,
          rollNo: p.studentId.rollNo || extra?.rollNo,
          classId: p.studentId.classId || extra?.classId || p.classId,
          className: p.studentId.className || extra?.className,
        },
      };
    }
    // (3) bare ObjectId — full lookup in index
    if (!studentsIndex || studentsIndex.size === 0) return p;
    const sid = String(p.studentId || "");
    if (!sid) return p;
    const s = studentsIndex.get(sid);
    if (!s) return p;
    return {
      ...p,
      student: {
        _id: s._id || s.id,
        name: s.name,
        admissionNo: s.admissionNo,
        rollNo: s.rollNo,
        classId: s.classId,
        className: s.className,
      },
    };
  });
}

// Filter payments by status chip + search query.
// `status` is one of "all" | "paid" | "pending" | "overdue".
// `search` matches student name, admission no, receipt number (case-insensitive).
export function filterPayments(payments, { status = "all", search = "" } = {}, now = new Date()) {
  const list = Array.isArray(payments) ? payments : [];
  const q = String(search || "").trim().toLowerCase();
  return list.filter((p) => {
    if (status !== "all") {
      const s = derivePaymentStatus(p, now);
      if (s !== status) return false;
    }
    if (q) {
      const haystack = [
        p.student?.name,
        p.studentName,
        p.student?.admissionNo,
        p.admissionNo,
        p.receiptNumber,
        p.receiptNo,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

// Build the query params for GET /fees/payments, omitting empty values so we
// never send `academicYear=undefined` or a blank `search`. Page/limit drive
// server-side pagination; search is matched server-side (PAG-01) so payments
// older than the current page are still findable.
export function buildPaymentsParams({ academicYear, page = 1, limit = 25, search = "" } = {}) {
  const params = {};
  if (academicYear) params.academicYear = academicYear;
  if (page) params.page = page;
  if (limit) params.limit = limit;
  const q = String(search || "").trim();
  if (q) params.search = q;
  return params;
}

// Local calendar day as YYYY-MM-DD — sent to the summary endpoint so
// "collected today" is computed for the cashier's timezone, not the server's.
export function localDateISO(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Phase 7 main fees hook. Owns:
 *  - server-paginated payments fetch via TanStack Query (refreshable via `refetch`)
 *  - status derivation per row (paid / pending / overdue)
 *  - KPIs from the backend summary endpoint (correct over the full dataset);
 *    falls back to a client-side compute over the current page until it loads
 *  - status filter on the current page (search is applied server-side)
 *
 * Keep this hook side-effect-free — components can call it freely.
 *
 * Usage:
 *   const { payments, filtered, kpis, pagination, isLoading, refetch } =
 *     useFeesData({ status: "overdue", search: "", page: 1, limit: 25 });
 */
export default function useFeesData({ status = "all", search = "", page = 1, limit = 25 } = {}) {
  const { selectedAcademicYear, currentAcademicYear, students = [] } = useApp();
  // Prefer user override; fall back to school-wide current year.
  const academicYear = selectedAcademicYear || currentAcademicYear;

  const paymentsParams = buildPaymentsParams({ academicYear, page, limit, search });
  const paymentsQuery = useQuery({
    queryKey: ["fees-payments", paymentsParams],
    queryFn: async () => {
      // Returns { payments, pagination } — keep the full shape for the table.
      const res = await feesApi.getPayments(paymentsParams);
      return { payments: res?.payments ?? [], pagination: res?.pagination ?? null };
    },
    placeholderData: (prev) => prev,
  });

  // KPIs come from the backend aggregate so they reflect every payment/due,
  // not just the rows on the current page.
  const today = localDateISO();
  const summaryQuery = useQuery({
    queryKey: ["fees-summary", academicYear || "default", today],
    queryFn: () => feesApi.getPaymentsSummary({ academicYear, date: today }),
    placeholderData: (prev) => prev,
  });

  // Client-join students into payments — backend returns bare studentIds
  // and useApp() already has the full student list.
  const studentsIndex = useMemo(() => indexStudentsById(students), [students]);
  const payments = useMemo(
    () => joinStudentsToPayments(paymentsQuery.data?.payments || [], studentsIndex),
    [paymentsQuery.data, studentsIndex]
  );
  const pagination = paymentsQuery.data?.pagination || null;

  // Search is server-side; only the status chip filters the current page here.
  const filtered = useMemo(
    () => filterPayments(payments, { status, search: "" }),
    [payments, status]
  );

  const kpis = useMemo(() => {
    const s = summaryQuery.data;
    if (s && typeof s === "object" && "collectedToday" in s) {
      return {
        collectedToday: Number(s.collectedToday) || 0,
        outstandingTotal: Number(s.outstandingTotal) || 0,
        overdueCount: Number(s.overdueCount) || 0,
      };
    }
    // Fallback while the summary loads or if it errors — derived from the
    // current page (under-counts, but never blocks the UI).
    return computeKpis(payments);
  }, [summaryQuery.data, payments]);

  const refetch = () => {
    paymentsQuery.refetch();
    summaryQuery.refetch();
  };

  return {
    payments,
    filtered,
    kpis,
    pagination,
    isLoading: paymentsQuery.isPending,
    isFetching: paymentsQuery.isFetching,
    isError: paymentsQuery.isError,
    error: paymentsQuery.error,
    refetch,
  };
}
