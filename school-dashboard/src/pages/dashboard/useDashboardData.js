import { useEffect, useMemo, useRef, useState } from "react";
import {
  announcementsApi,
  attendanceApi,
  feesApi,
  studentFeesApi,
} from "../../services/api";
import {
  createEmptyAttendanceSnapshot,
  createFeeCollectionSeries,
  isSameDay,
  isSameMonth,
  isSuccessfulPayment,
  normalizeAnnouncements,
  normalizePayments,
  toValidDate,
} from "./dashboardHelpers";

export default function useDashboardData({
  classes,
  students,
  staff,
  staffAttendance,
  currentAcademicYear,
}) {
  const [recentPayments, setRecentPayments] = useState([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [feeCollectionData, setFeeCollectionData] = useState([]);
  const [paymentSnapshot, setPaymentSnapshot] = useState({
    totalPending: null,
    totalCollected: null,
    today: null,
    month: null,
  });
  const [attendanceSnapshot, setAttendanceSnapshot] = useState(() =>
    createEmptyAttendanceSnapshot()
  );
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);
  const [paymentsLoaded, setPaymentsLoaded] = useState(false);
  const [feeDefaultersCount, setFeeDefaultersCount] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  const studentsRef = useRef(students);
  studentsRef.current = students;

  useEffect(() => {
    let cancelled = false;

    const loadDashboardFeed = async () => {
      setDashboardLoading(true);
      setDashboardError(null);
      setPaymentsLoaded(false);

      try {
        const [paymentsResult, announcementsResult, feeStructuresResult] =
          await Promise.allSettled([
            feesApi.getPayments({ academicYear: currentAcademicYear }),
            announcementsApi.getAll({}),
            studentFeesApi.getAll(currentAcademicYear),
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

    return () => {
      cancelled = true;
    };
  }, [currentAcademicYear, reloadKey]);

  useEffect(() => {
    let cancelled = false;

    const loadStudentAttendanceSnapshot = async () => {
      const activeStudents = (students || []).filter(
        (student) => (student.status || "active") === "active"
      );
      const classesWithStudents = (classes || []).filter((classItem) =>
        activeStudents.some(
          (student) => String(student.classId) === String(classItem.id)
        )
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

        classesWithStudents.forEach((classItem) => {
          const classData = classSummaries[String(classItem.id)];
          if (classData && classData.total > 0) {
            markedClassCount += 1;
            const classStudentCount = activeStudents.filter(
              (student) => String(student.classId) === String(classItem.id)
            ).length;
            totalStudentsInMarkedClasses += classStudentCount;
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
  }, [classes, students, reloadKey]);

  const todayKey = useMemo(
    () => new Date().toISOString().split("T")[0],
    // `staffAttendance` is intentionally captured to invalidate the memo when
    // attendance data changes; the `useMemo` body doesn't read it directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return {
    recentPayments,
    recentAnnouncements,
    feeCollectionData,
    paymentSnapshot,
    attendanceSnapshot,
    feeDefaultersCount,
    dashboardLoading,
    dashboardError,
    paymentsLoaded,
    reload,
  };
}
