import React, { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useApp } from "../../context/AppContext";
import { useSchool } from "../../context/SchoolContext";
import { useValidatedParams } from "../../hooks/useValidatedParams";
import { DetailPageSkeleton } from "../../components/skeletons/PageSkeletons";
import {
  useStudentData,
  useStudentAttendance,
  useStudentResults,
  useStudentFees,
  useStudentUpcoming,
} from "./hooks";

import DashboardTabs from "./components/dashboard/DashboardTabs";
import {
  buildMonthAttendance,
  buildSubjects,
  deriveGpa,
  pickParent,
} from "./components/dashboard/utils";

// REVAMP-12 · Student detail dashboard — route shell.
// Data fetching, derived values, and the empty/loading state live here.
// The tabbed detail view (hero, KPI strip, tab panels, lazy admin modals)
// lives in `components/dashboard/DashboardTabs.jsx` and is mounted below.

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    params: { id: pathId },
    isValid,
  } = useValidatedParams({ id: "objectId" }, { redirectTo: "/students" });
  // Support both /students/:id and /students/dashboard?id=...
  const id = pathId || searchParams.get("id");

  useEffect(() => {
    if (!id) {
      navigate("/students", { replace: true });
    }
  }, [id, navigate]);

  const { classes, students, updateStudent, refetch: refetchAppData } =
    useApp();
  const { schoolSettings } = useSchool();

  const { student, loading: studentLoading, refetch: refetchStudent } =
    useStudentData(id);

  // Last 30 days for the heatmap — also drives the Attendance tab
  const today = useMemo(() => new Date(), []);
  const startOf30 = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 29);
    return d.toISOString().slice(0, 10);
  }, [today]);
  const endOf30 = useMemo(() => today.toISOString().slice(0, 10), [today]);
  const {
    attendanceData,
    attendanceStats,
    loading: attendanceLoading,
    error: attendanceError,
    refetch: refetchAttendance,
  } = useStudentAttendance(id, {
    startDate: startOf30,
    endDate: endOf30,
  });

  const {
    results,
    loading: resultsLoading,
    error: resultsError,
    refetch: refetchResults,
  } = useStudentResults(id);

  const {
    feeStructure,
    loading: feesLoading,
    error: feesError,
    refetch: refetchFees,
  } = useStudentFees(id, { autoInitialize: true });

  // ── Derived values ───────────────────────────────────────────────────
  const cls = (classes || []).find((c) =>
    student
      ? String(c.id) === String(student.classId) ||
        String(c._id) === String(student.classId)
      : false
  );
  const className = cls?.name || cls?.section || "";
  const classSize = student
    ? (students || []).filter(
        (s) => String(s.classId) === String(student.classId)
      ).length || null
    : null;
  const parent = pickParent(student);
  const subjects = buildSubjects(results);
  const monthAttendance = buildMonthAttendance(attendanceData);
  const gpa = student?.gpa != null ? student.gpa : deriveGpa(subjects);

  // MOCK-09 · Upcoming card — feeds the student's class exams. The hook is
  // gated on classId so it stays dormant until the student record resolves.
  const classId = student?.classId || "";
  const { upcoming } = useStudentUpcoming(classId, {
    autoFetch: Boolean(classId),
  });

  const timelineDays = useMemo(() => {
    const items = [];
    const lastAttendance = (attendanceData || []).slice(-1)[0];
    if (lastAttendance) {
      const t = lastAttendance.checkInTime || "—";
      items.push({
        day: "Today",
        items: [
          {
            time: t,
            kind: "att",
            text:
              String(lastAttendance.status || "").toLowerCase() === "present"
                ? "Marked present"
                : "Marked absent",
            meta: lastAttendance.classPeriod || "",
          },
        ],
      });
    }
    return items;
  }, [attendanceData]);

  const onAdminMutation = () => {
    refetchStudent?.();
    refetchAppData?.();
  };

  if (!isValid) return null;
  if (studentLoading || !student) {
    return <DetailPageSkeleton title avatar fields={6} />;
  }

  const attendancePct = attendanceStats?.percentage ?? null;
  const feeBalance =
    feeStructure?.balanceAmount ??
    student.feeBalance ??
    null;
  const feeStatus =
    feeStructure?.feeStatus || student.feeStatus || null;

  return (
    <DashboardTabs
      student={student}
      studentId={id}
      className={className}
      classSize={classSize}
      parent={parent}
      subjects={subjects}
      monthAttendance={monthAttendance}
      timelineDays={timelineDays}
      upcoming={upcoming}
      attendanceData={attendanceData}
      attendanceStats={attendanceStats}
      attendanceLoading={attendanceLoading}
      attendanceError={attendanceError}
      refetchAttendance={refetchAttendance}
      results={results}
      resultsLoading={resultsLoading}
      resultsError={resultsError}
      refetchResults={refetchResults}
      feeStructure={feeStructure}
      feesLoading={feesLoading}
      feesError={feesError}
      refetchFees={refetchFees}
      attendancePct={attendancePct}
      gpa={gpa}
      feeBalance={feeBalance}
      feeStatus={feeStatus}
      schoolSettings={schoolSettings}
      classes={classes}
      updateStudent={updateStudent}
      onAdminMutation={onAdminMutation}
      navigate={navigate}
    />
  );
}
