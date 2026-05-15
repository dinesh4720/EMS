import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { TablePageSkeleton } from "../../components/skeletons/PageSkeletons";

// Phase 11 — slim Routes wrapper.
// AcademicsPage is the new canonical landing (KPI strip + filterable exam
// list). Deep CBSE/CCE/schedule pages still mounted at sub-paths.
//
// Old PerformanceDashboard + ExamManagement are superseded by AcademicsPage;
// kept reachable temporarily via redirects from their old URLs.
const AcademicsPage = lazy(() => import("./AcademicsPage"));
const ExamManagement = lazy(() => import("./ExamManagement"));
const ExamScheduleConflict = lazy(() => import("./ExamScheduleConflict"));
const SubjectAssignment = lazy(() => import("../../components/SubjectAssignment"));
const CBSEReportCardPage = lazy(() => import("./CBSEReportCardPage"));
const CCEGradingPage = lazy(() => import("./CCEGradingPage"));

export default function AcademicsIndex() {
  return (
    <Suspense fallback={<TablePageSkeleton kpiCards={3} columns={6} rows={8} />}>
      <Routes>
        <Route index element={<AcademicsPage />} />
        <Route path="exams" element={<ExamManagement />} />
        <Route path="schedules" element={<ExamScheduleConflict />} />
        <Route path="subjects" element={<SubjectAssignment />} />
        <Route path="cbse-report-card" element={<CBSEReportCardPage />} />
        <Route path="cce-grading" element={<CCEGradingPage />} />
        <Route path="dashboard" element={<Navigate to="/academics" replace />} />
        <Route path="*" element={<Navigate to="/academics" replace />} />
      </Routes>
    </Suspense>
  );
}
