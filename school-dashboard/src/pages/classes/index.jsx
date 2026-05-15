import { Routes, Route } from "react-router-dom";
import ClassesPage from "./ClassesPage";
import ClassDashboard from "./ClassDashboard";
import Attendance from "./Attendance";
import Timetable from "./Timetable";
import Substitution from "./Substitution";
import Subjects from "./Subjects";
import BulkClassTeacherAssignment from "./BulkClassTeacherAssignment";

// Phase 6 — slim Routes wrapper. The legacy index.jsx orchestrator (with
// PageLayout tabs + Add-Class drawer) is gone; ClassesPage owns the
// `/classes` index now. The other sub-routes survive for direct linking
// (Attendance/Timetable/Substitution/Subjects/Bulk) — Phase 5b will
// re-evaluate whether they collapse into the frosted overlay.
export default function ClassesIndex() {
  return (
    <Routes>
      <Route index element={<ClassesPage />} />
      <Route path=":id" element={<ClassDashboard />} />
      <Route path=":id/attendance" element={<Attendance />} />
      <Route path="bulk-assignment" element={<BulkClassTeacherAssignment />} />
      <Route path="attendance" element={<Attendance />} />
      <Route path="timetable" element={<Timetable />} />
      <Route path="substitution" element={<Substitution />} />
      <Route path="subjects" element={<Subjects />} />
    </Routes>
  );
}
