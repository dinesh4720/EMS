export default function StaffDepartmentCard({ staff, t }) {
  return (
    <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-5">
      <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-4">{t('pages.departmentDetails')}</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.department1')}</span>
          <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{staff.department || "—"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.role1')}</span>
          <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{Array.isArray(staff.role) ? staff.role.join(', ') : staff.role || "—"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.status2')}</span>
          <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{staff.status || "Active"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.joinDate1')}</span>
          <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{staff.joinDate || "—"}</span>
        </div>
      </div>
    </div>
  );
}
