import { useEffect, useMemo, useRef, useState } from "react";
import { usePermissions } from "../../context/PermissionContext";
import {
  announcementsApi,
  attendanceApi,
  dashboardApi,
  feesApi,
  ptmApi,
  studentFeesApi,
  substitutionAlertsApi,
} from "../../services/api";
import {
  createEmptyAttendanceSnapshot,
  createFeeCollectionSeries,
  createWeeklyFeeSeries,
  isSameDay,
  isSameMonth,
  isSuccessfulPayment,
  normalizeAnnouncements,
  normalizePayments,
  pickMostUrgentSubstitution,
  pickUpcomingPtmSession,
  toValidDate,
} from "./dashboardHelpers";

export default function useDashboardData({
  students,
  staff,
  staffAttendance,
  currentAcademicYear,
}) {
  // Fees / messaging endpoints are 403 MODULE_DISABLED when the school has those
  // modules turned off — skip those calls instead of letting them error.
  const permissions = usePermissions();
  const permissionsReady = permissions?.ready ?? false;
  const feesEnabled = permissionsReady && (permissions?.isModuleEnabled ? permissions.isModuleEnabled("fees") : true);
  const messagingEnabled = permissionsReady && (permissions?.isModuleEnabled ? permissions.isModuleEnabled("messaging") : true);

  const [recentPayments, setRecentPayments] = useState([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [feeCollectionData, setFeeCollectionData] = useState([]);
  const [weeklyFeeSeries, setWeeklyFeeSeries] = useState({
    days: [],
    totals: { thisWeekTotal: 0, lastWeekTotal: 0 },
  });
  const [paymentSnapshot, setPaymentSnapshot] = useState({
    totalPending: null,
    totalCollected: null,
    today: null,
    month: null,
  });
  const [attendanceSnapshot, setAttendanceSnapshot] = useState(() =>
    createEmptyAttendanceSnapshot()
  );
  // [SCH-211] Student KPIs are server-computed. PAG-05 removed the global student
  // roster from AppContext, so the dashboard reads totals + per-class distribution
  // from /dashboard/analytics-summary instead of counting an (always empty) roster.
  const [studentStats, setStudentStats] = useState({ total: 0, active: 0 });
  const [classDistribution, setClassDistribution] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);
  const [paymentsLoaded, setPaymentsLoaded] = useState(false);
  const [feeDefaultersCount, setFeeDefaultersCount] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [urgentSubstitution, setUrgentSubstitution] = useState(null);
  const [upcomingPtm, setUpcomingPtm] = useState(null);

  const studentsRef = useRef(students);
  studentsRef.current = students;

  useEffect(() => {
    let cancelled = false;

    const loadDashboardFeed = async () => {
      setDashboardLoading(true);
      setDashboardError(null);
      setPaymentsLoaded(false);

      try {
        const skip = () => Promise.resolve(null);
        const [paymentsResult, announcementsResult, feeStructuresResult] =
          await Promise.allSettled([
            feesEnabled ? feesApi.getPayments({ academicYear: currentAcademicYear }) : skip(),
            messagingEnabled ? announcementsApi.getAll({}) : skip(),
            feesEnabled ? studentFeesApi.getAll(currentAcademicYear) : skip(),
          ]);

        if (cancelled) return;

        const normalizedPayments =
          paymentsResult.status === "fulfilled"
            ? normalizePayments(
                paymentsResult.value?.payments ?? [],
                studentsRef.current
              )
            : [];
        const normalizedAnnouncements =
          announcementsResult.status === "fulfilled"
            ? normalizeAnnouncements(announcementsResult.value)
            : [];
        const now = new Date();
        const settledPayments = normalizedPayments.filter(isSuccessfulPayment);
        const liveAnnouncements = normalizedAnnouncements.filter(
          (announcement) => announcement.status !== "draft"
        );

        const feeStructures =
          feeStructuresResult.status === "fulfilled"
            ? Array.isArray(feeStructuresResult.value)
              ? feeStructuresResult.value
              : []
            : [];
        const totalPending = feeStructures.reduce(
          (sum, fs) => sum + (fs.totalBalance || 0),
          0
        );
        const totalCollected = feeStructures.reduce(
          (sum, fs) => sum + (fs.totalPaid || 0),
          0
        );
        const defaulters = feeStructures.filter(
          (fs) => (fs.totalBalance || 0) > 0
        ).length;
        setFeeDefaultersCount(defaulters);

        setRecentPayments(settledPayments.slice(0, 6));
        setRecentAnnouncements(
          (liveAnnouncements.length > 0
            ? liveAnnouncements
            : normalizedAnnouncements
          ).slice(0, 6)
        );
        setFeeCollectionData(createFeeCollectionSeries(settledPayments));
        setWeeklyFeeSeries(createWeeklyFeeSeries(settledPayments));
        setPaymentSnapshot({
          totalPending:
            feeStructuresResult.status === "fulfilled" ? totalPending : null,
          totalCollected:
            feeStructuresResult.status === "fulfilled" ? totalCollected : null,
          today:
            paymentsResult.status === "fulfilled"
              ? settledPayments.reduce((sum, payment) => {
                  const paymentDate = toValidDate(payment.date);
                  return paymentDate && isSameDay(paymentDate, now)
                    ? sum + payment.amount
                    : sum;
                }, 0)
              : null,
          month:
            paymentsResult.status === "fulfilled"
              ? settledPayments.reduce((sum, payment) => {
                  const paymentDate = toValidDate(payment.date);
                  return paymentDate && isSameMonth(paymentDate, now)
                    ? sum + payment.amount
                    : sum;
                }, 0)
              : null,
        });
        setPaymentsLoaded(
          paymentsResult.status === "fulfilled" ||
            feeStructuresResult.status === "fulfilled"
        );

        if (
          paymentsResult.status === "rejected" &&
          announcementsResult.status === "rejected" &&
          feeStructuresResult.status === "rejected"
        ) {
          setDashboardError(
            paymentsResult.reason ||
              announcementsResult.reason ||
              feeStructuresResult.reason ||
              new Error("Failed to load dashboard data")
          );
        }
      } catch (error) {
        if (!cancelled) setDashboardError(error);
      } finally {
        if (!cancelled) setDashboardLoading(false);
      }
    };

    loadDashboardFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps

    return () => {
      cancelled = true;
    };
  }, [currentAcademicYear, reloadKey, feesEnabled, messagingEnabled]);

  // [SCH-211] Server-computed student totals + per-class distribution. Feeds the
  // active-student count and the per-class attendance snapshot below, neither of
  // which can be derived client-side anymore (PAG-05 emptied the roster). Failure
  // degrades to zero counts rather than erroring the whole dashboard.
  useEffect(() => {
    let cancelled = false;

    const loadAnalyticsSummary = async () => {
      try {
        const data = await dashboardApi.getAnalyticsSummary();
        if (cancelled) return;
        setStudentStats({
          total: data?.students?.total || 0,
          active: data?.students?.active || 0,
        });
        setClassDistribution(
          Array.isArray(data?.classDistribution) ? data.classDistribution : []
        );
      } catch {
        if (!cancelled) {
          setStudentStats({ total: 0, active: 0 });
          setClassDistribution([]);
        }
      }
    };

    loadAnalyticsSummary();

    return () => {
      cancelled = true;
    };
  }, [currentAcademicYear, reloadKey]);

  useEffect(() => {
    let cancelled = false;

    const loadStudentAttendanceSnapshot = async () => {
      // classDistribution is `[{ classId, name, count }]` of active students per
      // class (server-computed). It replaces the old client-side roster grouping,
      // which returned empty under PAG-05 and zeroed every student attendance KPI.
      const classesWithStudents = (classDistribution || []).filter(
        (entry) => entry.classId && (entry.count || 0) > 0
      );

      if (!classesWithStudents.length) {
        setAttendanceSnapshot((current) => ({
          ...current,
          studentRate: null,
          studentPresent: 0,
          studentTotal: 0,
          markedClasses: 0,
          totalClasses: 0,
        }));
        return;
      }

      try {
        const snapshot = await attendanceApi.getTodaySnapshot();
        if (cancelled) return;

        const classSummaries = snapshot?.classes || {};
        let totalPresent = 0;
        let totalStudentsInMarkedClasses = 0;
        let markedClassCount = 0;

        classesWithStudents.forEach((entry) => {
          const classData = classSummaries[String(entry.classId)];
          if (classData && classData.total > 0) {
            markedClassCount += 1;
            totalStudentsInMarkedClasses += entry.count || 0;
            totalPresent += classData.present || 0;
          }
        });

        setAttendanceSnapshot((current) => ({
          ...current,
          studentRate:
            totalStudentsInMarkedClasses > 0
              ? Math.round(
                  (totalPresent / totalStudentsInMarkedClasses) * 100
                )
              : null,
          studentPresent: totalPresent,
          studentTotal: totalStudentsInMarkedClasses,
          markedClasses: markedClassCount,
          totalClasses: classesWithStudents.length,
        }));
      } catch {
        if (!cancelled) {
          setAttendanceSnapshot((current) => ({
            ...current,
            studentRate: null,
            studentPresent: 0,
            studentTotal: 0,
            markedClasses: 0,
            totalClasses: classesWithStudents.length,
          }));
        }
      }
    };

    loadStudentAttendanceSnapshot();

    return () => {
      cancelled = true;
    };
  }, [classDistribution, reloadKey]);

  const todayKey = useMemo(
    () => new Date().toISOString().split("T")[0],
    [staffAttendance]
  );

  const staffSnapshot = useMemo(() => {
    const activeStaff = (staff || []).filter(
      (staffMember) => (staffMember.status || "active") === "active"
    );
    const markedStaff = activeStaff.filter(
      (staffMember) => staffAttendance?.[staffMember.id]?.[todayKey]?.status
    );
    const presentStaff = markedStaff.filter((staffMember) => {
      const status = String(
        staffAttendance?.[staffMember.id]?.[todayKey]?.status || ""
      ).toLowerCase();
      return status === "present";
    });

    return {
      staffRate:
        markedStaff.length > 0
          ? Math.round((presentStaff.length / markedStaff.length) * 100)
          : null,
      staffPresent: presentStaff.length,
      staffMarked: markedStaff.length,
      staffTotal: activeStaff.length,
    };
  }, [staff, staffAttendance, todayKey]);

  useEffect(() => {
    setAttendanceSnapshot((current) => ({ ...current, ...staffSnapshot }));
  }, [staffSnapshot]);

  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;
    const todayDateKey = new Date().toISOString().split("T")[0];

    const loadActionsFeed = async () => {
      const [subsResult, ptmResult] = await Promise.allSettled([
        substitutionAlertsApi.getAlerts(todayDateKey),
        ptmApi.getAll({ from: todayDateKey, limit: 20 }),
      ]);

      if (cancelled) return;

      const subsBody =
        subsResult.status === "fulfilled" ? subsResult.value : null;
      const subsAlerts = Array.isArray(subsBody?.alerts)
        ? subsBody.alerts
        : Array.isArray(subsBody)
          ? subsBody
          : [];
      const topSubs = pickMostUrgentSubstitution(subsAlerts);
      setUrgentSubstitution(
        topSubs ? { alert: topSubs.alert, unassigned: topSubs.unassigned } : null
      );

      const ptmBody = ptmResult.status === "fulfilled" ? ptmResult.value : null;
      const ptmSessions = Array.isArray(ptmBody)
        ? ptmBody
        : Array.isArray(ptmBody?.data)
          ? ptmBody.data
          : [];
      setUpcomingPtm(pickUpcomingPtmSession(ptmSessions));
    };

    loadActionsFeed();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return {
    recentPayments,
    recentAnnouncements,
    feeCollectionData,
    weeklyFeeSeries,
    paymentSnapshot,
    attendanceSnapshot,
    studentStats,
    feeDefaultersCount,
    dashboardLoading,
    dashboardError,
    paymentsLoaded,
    urgentSubstitution,
    upcomingPtm,
    reload,
  };
}
