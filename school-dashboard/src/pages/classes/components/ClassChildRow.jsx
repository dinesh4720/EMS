import { TableRow, TableCell, Chip, Progress } from "@heroui/react";
import { Eye, UserPlus, RefreshCw, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import PhotoAvatar from "../../../components/PhotoAvatar";

/**
 * Plain render function (NOT a React component) so that HeroUI's
 * collection system sees the returned <TableRow> directly.
 * Must not contain hooks – receive `t` and `navigate` from the caller.
 */
export function renderClassChildRow({
  cls,
  pendingCount,
  attendanceValue,
  academicAverage,
  classSettings,
  visibleColumns,
  onAssignTeacher,
  onEditClass,
  onDeleteClass,
  onRowClick,
  t,
  navigate,
}) {

  return (
    <TableRow
      key={cls?.id || 'child-unknown'}
      className="cursor-pointer hover:bg-default-50 bg-default-50/50"
      onClick={(e) => {
        // Don't navigate if clicking on interactive elements
        if (e.target.closest("button") || e.target.closest("label") || e.target.closest("input") || e.target.closest("a")) return;

        // Don't navigate if text is being selected
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) return;

        onRowClick();
      }}
    >
      {/* Class Details - Child */}
      <TableCell>
        <div className="flex items-center gap-3 py-3 pl-8">
          <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center ml-6">
            <span className="text-secondary font-semibold text-xs">{cls?.section || '-'}</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Link
                to={cls?.id ? `/classes/${cls.id}` : '#'}
                className="text-default-700 font-medium text-sm hover:text-primary transition-colors cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                {t('classes.sectionLabel', 'Section {{section}}', { section: cls?.section || '-' })}
              </Link>
              {classSettings?.classTag && (
                <Chip size="sm" variant="flat" color="primary" className="text-xs">
                  {classSettings.classTag}
                </Chip>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-default-500 text-xs">
                {t('classes.studentCount', '{{count}} students', { count: cls?.studentCount || cls?.strength || 0 })}
              </span>
              {/* Health indicator dots */}
              {(attendanceValue != null && attendanceValue < 75) && (
                <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" title={t('classes.lowAttendance', 'Low attendance')} />
              )}
              {!cls?.classTeacherId && (
                <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" title={t('classes.noClassTeacher', 'No class teacher')} />
              )}
              {pendingCount > 0 && pendingCount > (cls?.studentCount || 0) * 0.3 && (
                <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" title={t('classes.highFeeDefaulters', 'High fee defaulters')} />
              )}
            </div>
          </div>
        </div>
      </TableCell>

      {/* Class Teacher - Child */}
      {visibleColumns.find(c => c?.key === 'teacher')?.visible && (
        <TableCell>
          <div className="flex items-center gap-3 py-3">
            {cls?.classTeacherId ? (
              <PhotoAvatar
                src={cls?.teacherPhoto}
                alt={cls?.teacher || t('classes.teacher', 'Teacher')}
                name={cls?.teacher || t('classes.unassigned', 'Unassigned')}
                size="sm"
                type="staff"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-default-200 flex items-center justify-center">
                <UserPlus size={14} className="text-default-400" />
              </div>
            )}
            <div className="flex flex-col">
              {cls?.classTeacherId ? (
                <div className="flex items-center gap-2">
                  <Link
                    to={`/staffs/${cls.classTeacherId}`}
                    className="text-default-700 font-medium text-sm hover:text-primary transition-colors cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {cls?.teacher || t('classes.unassigned', 'Unassigned')}
                  </Link>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (cls) onAssignTeacher(cls); }}
                    className="text-default-400 hover:text-primary transition-colors"
                    title={t('pages.changeClassTeacher')}
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); if (cls) onAssignTeacher(cls); }}
                  className="text-primary font-medium text-xs hover:underline flex items-center gap-1"
                >
                  <UserPlus size={10} />
                  {t('classes.assign', 'Assign')}
                </button>
              )}
              <span className="text-default-500 text-xs">{t('pages.classTeacher2')}</span>
            </div>
          </div>
        </TableCell>
      )}

      {/* Subjects - Child */}
      {visibleColumns.find(c => c?.key === 'subjects')?.visible && (
        <TableCell>
          <div className="py-3">
            <span className="text-default-700 text-sm">{cls?.subjects?.length || 0}</span>
          </div>
        </TableCell>
      )}

      {/* Strength - Child */}
      {visibleColumns.find(c => c?.key === 'strength')?.visible && (
        <TableCell>
          <div className="py-3">
            <span className="text-default-700 font-semibold text-base">{cls?.studentCount || cls?.strength || 0}</span>
            <span className="text-default-500 text-xs">
              {cls?.strengthLimit?.current ? `/${cls.strengthLimit.current}` : ''}
            </span>
          </div>
        </TableCell>
      )}

      {/* Academic Performance - Child */}
      {visibleColumns.find(c => c?.key === 'academic')?.visible && (
        <TableCell>
          <div className="flex items-center gap-2 py-3">
            <Progress
              aria-label={t('aria.charts.academicPerformance')}
              value={academicAverage || 0}
              size="sm"
              className="max-w-[100px]"
              color={(academicAverage || 0) >= 80 ? "success" : (academicAverage || 0) >= 60 ? "warning" : "danger"}
              classNames={{
                indicator: (academicAverage || 0) >= 80
                  ? "bg-success-300"
                  : (academicAverage || 0) >= 60
                    ? "bg-warning-300"
                    : "bg-danger-300",
                track: "bg-default-100"
              }}
            />
            <span className="text-xs font-semibold text-default-700 min-w-[32px]">{academicAverage || 0}%</span>
          </div>
        </TableCell>
      )}

      {/* Attendance - Child */}
      {visibleColumns.find(c => c?.key === 'attendance')?.visible && (
        <TableCell>
          <div className="flex items-center gap-2 py-3">
            {attendanceValue != null ? (
              <>
                <Progress
                  aria-label={t('aria.charts.attendance')}
                  value={attendanceValue || 0}
                  size="sm"
                  className="max-w-[100px]"
                  classNames={{
                    indicator: (attendanceValue || 0) >= 90
                      ? "bg-emerald-300"
                      : (attendanceValue || 0) >= 75
                        ? "bg-amber-300"
                        : "bg-rose-300",
                    track: "bg-default-100"
                  }}
                />
                <span className="text-xs font-semibold text-default-700 min-w-[32px]">{attendanceValue || 0}%</span>
              </>
            ) : (
              <span className="text-xs text-default-400">—</span>
            )}
          </div>
        </TableCell>
      )}

      {/* Fee Status - Child */}
      {visibleColumns.find(c => c?.key === 'status')?.visible && (
        <TableCell>
          <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-xs font-medium ${pendingCount > 2
              ? "bg-danger-50 border-danger-200 text-danger-700"
              : pendingCount > 0
                ? "bg-warning-50 border-warning-200 text-warning-700"
                : "bg-success-50 border-success-200 text-success-700"
            }`}>
            {pendingCount > 0 ? `${pendingCount}` : "0"}
          </div>
        </TableCell>
      )}

      {/* Actions - Child (Quick action buttons) */}
      <TableCell>
        <div className="flex items-center justify-end gap-1 py-3" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => cls?.id && navigate(`/classes/${cls.id}`)}
            className="p-1.5 hover:bg-default-100 rounded-lg transition-colors"
            title={t('classes.viewClass', 'View class')}
          >
            <Eye size={14} className="text-default-400" />
          </button>
          <button
            onClick={() => cls && onEditClass(cls)}
            className="p-1.5 hover:bg-default-100 rounded-lg transition-colors"
            title={t('classes.editClass', 'Edit class')}
          >
            <Pencil size={14} className="text-default-400" />
          </button>
          <button
            onClick={() => cls && onDeleteClass(cls)}
            className="p-1.5 hover:bg-danger-100 rounded-lg transition-colors"
            title={t('classes.deleteClass', 'Delete class')}
          >
            <Trash2 size={14} className="text-danger-400" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
}
