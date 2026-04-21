import { GraduationCap, X, Link } from "lucide-react";

export default function StaffClassTeacherSection({ classTeacherAssignments, onUnassignClass, onAssignClass, canEdit, t, navigate, staff }) {
  return (
    <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
      <div className="p-5 border-b border-gray-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><GraduationCap size={16} className="text-gray-600 dark:text-zinc-400" /></div>
          <div><h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('pages.classTeacherAssignment')}</h3><p className="text-xs text-gray-500 dark:text-zinc-400">{classTeacherAssignments.length > 0 ? 'Class you manage as class teacher' : 'Not assigned to any class'}</p></div>
        </div>
      </div>
      {classTeacherAssignments.length > 0 ? (
        <div className="divide-y divide-gray-50 dark:divide-zinc-800">
          {classTeacherAssignments.map((cls) => {
            const clsAttendance = cls.averageAttendance || cls.attendance || 0;
            return (
              <div
                key={cls.id}
                className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/classes/${cls.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-semibold text-gray-700 dark:text-zinc-300">
                    {cls.name}-{cls.section}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{cls.name} - {cls.section}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{cls.studentCount || 0} students</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${clsAttendance >= 90 ? 'bg-gray-800 dark:bg-zinc-200' : clsAttendance >= 75 ? 'bg-gray-600 dark:bg-zinc-400' : 'bg-gray-400 dark:bg-zinc-500'}`} style={{ width: `${clsAttendance}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100 w-12 text-right">{clsAttendance}%</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnassignClass(cls);
                    }}
                    className="p-1.5 text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-all"
                    title={t('classes.unassign', 'Unassign')}
                  >
                    <X size={14} />
                  </button>
                  <Link size={16} className="text-gray-400 dark:text-zinc-500" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-zinc-900 flex items-center justify-center mb-3">
            <GraduationCap size={20} className="text-gray-300 dark:text-zinc-600" />
          </div>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-1">{t('pages.noClassHasBeenAssignedYet')}</p>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mb-4">{t('pages.thisStaffMemberIsNotAClassTeacherForAnyClass')}</p>
          <button
            onClick={onAssignClass}
            className="text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 px-4 py-2 rounded-lg transition-colors"
          >
            Assign a Class →
          </button>
        </div>
      )}
    </div>
  );
}
