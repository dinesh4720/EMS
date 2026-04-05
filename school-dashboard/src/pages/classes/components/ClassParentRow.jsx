import { TableRow, TableCell, Progress } from "@heroui/react";
import { ChevronRight, ChevronDown, ChevronUp } from "lucide-react";

/**
 * Plain render function (NOT a React component) so that HeroUI's
 * collection system sees the returned <TableRow> directly.
 * Must not contain hooks – receive `t` from the caller.
 *
 * IMPORTANT: cells are rendered by iterating visibleColumns to guarantee
 * the cell count always matches the column count. Never use conditional
 * `{visible && <TableCell>}` patterns – HeroUI's collection builder
 * crashes on falsy children.
 */
export function renderClassParentRow({ group, isExpanded, pendingCount, visibleColumns, onToggleExpansion, t }) {

  const renderCell = (col) => {
    switch (col.key) {
      case 'class':
        return (
          <TableCell key="class">
            <div className="flex items-center gap-3 py-5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (group?.classNum) onToggleExpansion(group.classNum);
                }}
                className="p-1 hover:bg-default-200 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown size={16} className="text-default-500" />
                ) : (
                  <ChevronRight size={16} className="text-default-500" />
                )}
              </button>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-semibold text-sm">{group?.classNum || '-'}</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-default-900 font-semibold text-base truncate">
                  {t('classes.classNumber', 'Class {{num}}', { num: group?.classNum || '-' })}
                </span>
                <span className="text-default-500 text-xs truncate">
                  {t('classes.sectionCount', '{{count}} section', { count: group?.sections?.length || 0 })}{(group?.sections?.length || 0) > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </TableCell>
        );

      case 'teacher':
        return (
          <TableCell key="teacher">
            <div className="flex items-center gap-2 py-5">
              {group?.sections?.length > 0 && group.sections[0]?.teacher ? (
                <>
                  <span className="text-default-600 text-sm">
                    {group.sections[0].teacher}
                  </span>
                  {group.sections.length > 1 && (
                    <span className="text-default-400 text-xs">
                      {t('classes.moreTeachers', '+{{count}} more', { count: group.sections.length - 1 })}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-default-400 text-sm">{t('pages.unassigned1')}</span>
              )}
            </div>
          </TableCell>
        );

      case 'subjects':
        return (
          <TableCell key="subjects">
            <div className="py-5">
              <span className="text-default-600 text-sm">
                {group?.sections?.[0]?.subjects?.length || 0}
              </span>
            </div>
          </TableCell>
        );

      case 'strength':
        return (
          <TableCell key="strength">
            <div className="py-5">
              <span className="text-default-900 font-semibold text-lg">{group?.totalStudents || 0}</span>
              <span className="text-default-500 text-xs"> {t('classes.students', 'students')}</span>
            </div>
          </TableCell>
        );

      case 'academic':
        return (
          <TableCell key="academic">
            <div className="flex items-center gap-2 py-5">
              <Progress
                aria-label={t('aria.charts.academicPerformance')}
                value={group?.averageAcademic || 0}
                size="sm"
                className="max-w-[100px]"
                color={(group?.averageAcademic || 0) >= 80 ? "success" : (group?.averageAcademic || 0) >= 60 ? "warning" : "danger"}
                classNames={{
                  indicator: (group?.averageAcademic || 0) >= 80
                    ? "bg-success-300"
                    : (group?.averageAcademic || 0) >= 60
                      ? "bg-warning-300"
                      : "bg-danger-300",
                  track: "bg-default-100"
                }}
              />
              <span className="text-xs font-semibold text-default-700 min-w-[32px]">{group?.averageAcademic || 0}%</span>
            </div>
          </TableCell>
        );

      case 'attendance':
        return (
          <TableCell key="attendance">
            <div className="flex items-center gap-2 py-5">
              {group?.averageAttendance != null ? (
                <>
                  <Progress
                    aria-label={t('aria.charts.attendance')}
                    value={group?.averageAttendance || 0}
                    size="sm"
                    className="max-w-[100px]"
                    classNames={{
                      indicator: (group?.averageAttendance || 0) >= 90
                        ? "bg-emerald-300"
                        : (group?.averageAttendance || 0) >= 75
                          ? "bg-amber-300"
                          : "bg-rose-300",
                      track: "bg-default-100"
                    }}
                  />
                  <span className="text-xs font-semibold text-default-700 min-w-[32px]">{group?.averageAttendance || 0}%</span>
                </>
              ) : (
                <span className="text-xs text-default-400">—</span>
              )}
            </div>
          </TableCell>
        );

      case 'status':
        return (
          <TableCell key="status">
            <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-xs font-medium ${pendingCount > 5
                ? "bg-danger-50 border-danger-200 text-danger-700"
                : pendingCount > 0
                  ? "bg-warning-50 border-warning-200 text-warning-700"
                  : "bg-success-50 border-success-200 text-success-700"
              }`}>
              {pendingCount > 0 ? `${pendingCount} ${t('classes.feePending', 'Pending')}` : t('classes.feeAllClear', 'All Clear')}
            </div>
          </TableCell>
        );

      case 'actions':
        return (
          <TableCell key="actions">
            <div className="flex justify-end py-5">
              <button
                className="p-2 hover:bg-default-100 rounded-lg transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  if (group?.classNum) onToggleExpansion(group.classNum);
                }}
              >
                {isExpanded ? (
                  <ChevronUp size={18} className="text-default-500" />
                ) : (
                  <ChevronDown size={18} className="text-default-500" />
                )}
              </button>
            </div>
          </TableCell>
        );

      default:
        return <TableCell key={col.key}>{' '}</TableCell>;
    }
  };

  return (
    <TableRow
      key={`parent-${group.classNum}`}
      className="cursor-pointer"
      onClick={(e) => {
        if (e.target.closest("button") || e.target.closest("a")) return;
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) return;
        onToggleExpansion(group.classNum);
      }}
    >
      {visibleColumns.map(renderCell)}
    </TableRow>
  );
}
