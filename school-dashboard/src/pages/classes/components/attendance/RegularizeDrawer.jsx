import { useTranslation } from "react-i18next";
import Button from "../../../../components/ui/Button";
import Drawer from "../../../../components/ui/Drawer";
import EmptyState from "../../../../components/ui/EmptyState";
import { ATTENDANCE_STATUSES, sid } from "../../utils/attendanceConstants";

/** Side drawer for quickly correcting (regularizing) statuses then saving. */
export default function RegularizeDrawer({
  isRegOpen,
  onRegClose,
  date,
  classStudents,
  attendance,
  markAttendance,
  isLocked,
  handleSaveAttendance,
}) {
  const { t } = useTranslation();
  return (
    <Drawer
      isOpen={isRegOpen}
      onClose={onRegClose}
      size="md"
      title={t('attendance.regularize', 'Regularize attendance')}
      description={`${date} · ${classStudents.length} ${t('pages.students', 'students')}`}
    >
      <div style={{ padding: 16 }}>
        {classStudents.length === 0 ? (
          <EmptyState size="sm" title={t('attendance.noStudentsInClass', 'No students found in this class')} />
        ) : (
          classStudents.map((student) => {
            const studentId = sid(student);
            const currentStatus = attendance[studentId] || 'unmarked';
            return (
              <div key={studentId} className="attn-regdrawer__row">
                <div className="attn-regdrawer__meta">
                  <span className="attn-regdrawer__name">{student.name}</span>
                  <span className="attn-regdrawer__sub">#{student.rollNo}</span>
                </div>
                <div className="attn-pillrow">
                  {ATTENDANCE_STATUSES.map(({ key, label, labelKey, icon: Icon }) => {
                    const active = currentStatus === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`attn-pill ${active ? `is-active is-${key}` : ''}`}
                        onClick={() => markAttendance(studentId, key)}
                        disabled={isLocked}
                        aria-pressed={active}
                        aria-label={t(labelKey, label)}
                      >
                        <Icon size={12} />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button size="sm" variant="ghost" onClick={onRegClose}>
            {t('common.close', 'Close')}
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => { onRegClose(); handleSaveAttendance(); }}
            disabled={isLocked}
          >
            {t('common.applyAndSave', 'Apply & Save')}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
