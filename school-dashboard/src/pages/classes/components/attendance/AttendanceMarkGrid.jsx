import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import EmptyState from "../../../../components/ui/EmptyState";
import { ATTENDANCE_STATUSES, STATUS_MAP, sid } from "../../utils/attendanceConstants";

/** Daily mark grid (one row per student) plus the monthly-view placeholder. */
export default function AttendanceMarkGrid({
  view,
  classStudents,
  attendance,
  activeStudentId,
  setActiveStudentId,
  markAttendance,
  isReadOnly,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (view === 'monthly') {
    return (
      <div className="attn-heatmap" style={{ marginTop: 0 }}>
        <div className="attn-heatmap__head">
          <span className="attn-heatmap__title">{t('attendance.monthlyView', 'Monthly view')}</span>
          <span className="attn-heatmap__legend">{t('attendance.monthlyHint', 'Tap a day to mark its attendance')}</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--fg-subtle)', margin: '8px 0 0' }}>
          {t('attendance.useHeatmap', 'Use the calendar above to jump between dates.')}
        </p>
      </div>
    );
  }

  return (
    <div className="attn-grid" role="table" aria-label={t('aria.misc.studentAttendanceProgress')}>
      <div className="attn-grid__head" role="row">
        <span role="columnheader">{t('pages.rOLL')}</span>
        <span role="columnheader">{t('pages.nAME')}</span>
        <span role="columnheader">{t('pages.sTATUS')}</span>
        <span role="columnheader">{t('pages.aCTIONS')}</span>
      </div>
      {classStudents.length === 0 ? (
        <div style={{ padding: 24 }}>
          <EmptyState
            size="sm"
            title={t('attendance.noStudentsInClass', 'No students found in this class')}
          />
        </div>
      ) : (
        classStudents.map((student) => {
          const studentId = sid(student);
          const currentStatus = attendance[studentId];
          const cfg = STATUS_MAP[currentStatus];
          const isActive = activeStudentId === studentId;
          return (
            <div
              key={studentId}
              className={`attn-grid__row ${isActive ? 'is-active' : ''}`}
              role="row"
              onMouseEnter={() => setActiveStudentId(studentId)}
              onFocus={() => setActiveStudentId(studentId)}
            >
              <span className="attn-grid__roll" role="cell">#{student.rollNo}</span>
              <button
                type="button"
                className="attn-grid__name"
                role="cell"
                onClick={() => navigate(`/students/${studentId}`)}
              >
                {student.name}
              </button>
              <span role="cell">
                {cfg ? (
                  <span className={`status status--${cfg.key === 'present' ? 'ok' : cfg.key === 'absent' ? 'danger' : cfg.key === 'late' ? 'warn' : cfg.key === 'halfday' ? 'info' : 'info'}`}>
                    <span className="dot" />
                    {t(cfg.labelKey, cfg.label)}
                  </span>
                ) : (
                  <span className="status">
                    <span className="dot" />
                    {t('attendance.notMarked', 'Not Marked')}
                  </span>
                )}
              </span>
              <span className="attn-pillrow" role="cell">
                {ATTENDANCE_STATUSES.map(({ key, label, labelKey, icon: Icon, shortcut }) => {
                  const active = currentStatus === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`attn-pill ${active ? `is-active is-${key}` : ''}`}
                      onClick={() => markAttendance(studentId, key)}
                      disabled={isReadOnly}
                      aria-pressed={active}
                      aria-label={t(labelKey, label)}
                      title={`${t(labelKey, label)} (${shortcut})`}
                    >
                      <Icon size={12} />
                      <span>{t(labelKey, label)}</span>
                      {isActive && !isReadOnly && <span className="kbd">{shortcut}</span>}
                    </button>
                  );
                })}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}
