/**
 * Attendance — class attendance marking page.
 *
 * Composition root only: all state, data-fetching, and action logic live in the
 * `useAttendance` hook; each visual section is its own presentational component
 * under `components/attendance/`. Behaviour is identical to the former 958-line
 * monolith — this is a pure structural refactor.
 */
import { useAttendance } from "./hooks/useAttendance";
import AttendanceToolbar from "./components/attendance/AttendanceToolbar";
import AttendanceAlerts from "./components/attendance/AttendanceAlerts";
import AttendanceMetrics from "./components/attendance/AttendanceMetrics";
import AttendanceHeatmapStrip from "./components/attendance/AttendanceHeatmapStrip";
import AttendanceMarkGrid from "./components/attendance/AttendanceMarkGrid";
import AttendanceSaveBar from "./components/attendance/AttendanceSaveBar";
import RegularizeDrawer from "./components/attendance/RegularizeDrawer";
import AttendanceDialogs from "./components/attendance/AttendanceDialogs";
import AbsenteesAlert from "./components/attendance/AbsenteesAlert";

export default function Attendance({ classId }) {
  const a = useAttendance(classId);

  return (
    <div className="attn-page">
      <AttendanceToolbar
        classId={classId}
        classesWithTeachers={a.classesWithTeachers}
        selectedClass={a.selectedClass}
        setSelectedClass={a.setSelectedClass}
        date={a.date}
        shiftDate={a.shiftDate}
        setDate={a.setDate}
        handleDateInputChange={a.handleDateInputChange}
        view={a.view}
        setView={a.setView}
        isLoadingAttendance={a.isLoadingAttendance}
        markAllPresent={a.markAllPresent}
        isReadOnly={a.isReadOnly}
        onRegOpen={a.onRegOpen}
        isLocked={a.isLocked}
        classStudentsLength={a.classStudents.length}
        absentCount={a.absentCount}
        handleNotifyParents={a.handleNotifyParents}
        isNotifying={a.isNotifying}
      />

      <AttendanceAlerts
        isLocked={a.isLocked}
        invalidDateReason={a.invalidDateReason}
        isOnline={a.isOnline}
        offlinePendingCount={a.offlinePendingCount}
        offlineSyncing={a.offlineSyncing}
        syncNow={a.syncNow}
      />

      <AttendanceMetrics
        totalCount={a.classStudents.length}
        presentCount={a.presentCount}
        absentCount={a.absentCount}
        lateCount={a.lateCount}
        halfdayCount={a.halfdayCount}
        unmarkedCount={a.unmarkedCount}
        markedCount={a.markedCount}
        attendancePercent={a.attendancePercent}
        pctClass={a.pctClass}
      />

      <AttendanceHeatmapStrip
        heatmapDates={a.heatmapDates}
        heatmap={a.heatmap}
        heatmapLevel={a.heatmapLevel}
        isNonWorkingDate={a.isNonWorkingDate}
        date={a.date}
        setDate={a.setDate}
      />

      <AttendanceMarkGrid
        view={a.view}
        classStudents={a.classStudents}
        attendance={a.attendance}
        activeStudentId={a.activeStudentId}
        setActiveStudentId={a.setActiveStudentId}
        markAttendance={a.markAttendance}
        isReadOnly={a.isReadOnly}
      />

      <AttendanceSaveBar
        saveMessage={a.saveMessage}
        markedCount={a.markedCount}
        classStudentsLength={a.classStudents.length}
        markAllPresent={a.markAllPresent}
        isReadOnly={a.isReadOnly}
        handleSaveAttendance={a.handleSaveAttendance}
        isSaving={a.isSaving}
        isOnline={a.isOnline}
      />

      <RegularizeDrawer
        isRegOpen={a.isRegOpen}
        onRegClose={a.onRegClose}
        date={a.date}
        classStudents={a.classStudents}
        attendance={a.attendance}
        markAttendance={a.markAttendance}
        isLocked={a.isLocked}
        handleSaveAttendance={a.handleSaveAttendance}
      />

      <AttendanceDialogs
        isMarkAllOpen={a.isMarkAllOpen}
        onMarkAllClose={a.onMarkAllClose}
        handleConfirmMarkAllPresent={a.handleConfirmMarkAllPresent}
        classStudentsLength={a.classStudents.length}
        isOverwriteOpen={a.isOverwriteOpen}
        onOverwriteClose={a.onOverwriteClose}
        handleConfirmOverwrite={a.handleConfirmOverwrite}
        date={a.date}
      />

      <AbsenteesAlert
        absentCount={a.absentCount}
        classStudents={a.classStudents}
        attendance={a.attendance}
      />
    </div>
  );
}
