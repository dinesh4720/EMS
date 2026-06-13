import { GraduationCap, X, Link } from "lucide-react";

export default function StaffClassTeacherSection({ classTeacherAssignments, onUnassignClass, onAssignClass, canEdit, t, navigate, staff }) {
  return (
    <div className="bg-surface rounded-lg border border-border-token overflow-hidden">
      <div className="p-5 border-b border-border-token">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center"><GraduationCap size={16} className="text-fg-muted" /></div>
          <div><h3 className="font-medium text-fg text-sm">{t('pages.classTeacherAssignment')}</h3><p className="text-xs text-fg-muted">{classTeacherAssignments.length > 0 ? 'Class you manage as class teacher' : 'Not assigned to any class'}</p></div>
        </div>
      </div>
      {classTeacherAssignments.length > 0 ? (
        <div className="divide-y divide-divider">
          {classTeacherAssignments.map((cls) => {
            const clsAttendance = cls.averageAttendance || cls.attendance || 0;
            return (
              <div
                key={cls.id}
                className="px-5 py-3 flex items-center justify-between hover:bg-surface-2/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/classes/${cls.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center text-sm font-semibold text-fg">
                    {cls.name}-{cls.section}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-fg">{cls.name} - {cls.section}</p>
                    <p className="text-xs text-fg-muted">{cls.studentCount || 0} students</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${clsAttendance >= 90 ? 'bg-ok' : clsAttendance >= 75 ? 'bg-warn' : 'bg-danger-token'}`} style={{ width: `${clsAttendance}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-fg w-12 text-right">{clsAttendance}%</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnassignClass(cls);
                    }}
                    className="p-1.5 text-fg-faint hover:text-danger-token hover:bg-surface-2 rounded transition-all"
                    title={t('classes.unassign', 'Unassign')}
                  >
                    <X size={14} />
                  </button>
                  <Link size={16} className="text-fg-faint" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center mb-3">
            <GraduationCap size={20} className="text-fg-faint" />
          </div>
          <p className="text-sm text-fg-muted mb-1">{t('pages.noClassHasBeenAssignedYet')}</p>
          <p className="text-xs text-fg-faint mb-4">{t('pages.thisStaffMemberIsNotAClassTeacherForAnyClass')}</p>
          <button
            onClick={onAssignClass}
            className="text-xs font-medium text-fg-muted hover:text-fg bg-surface-2 hover:bg-surface-hover px-4 py-2 rounded-lg transition-colors"
          >
            Assign a Class →
          </button>
        </div>
      )}
    </div>
  );
}
