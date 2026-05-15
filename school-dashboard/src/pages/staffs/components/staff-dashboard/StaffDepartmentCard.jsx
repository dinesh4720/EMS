export default function StaffDepartmentCard({ staff, t }) {
  return (
    <div className="bg-surface rounded-lg border border-divider p-5">
      <h3 className="text-sm font-medium text-fg mb-4">{t('pages.departmentDetails')}</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-fg-muted">{t('pages.department1')}</span>
          <span className="text-sm font-medium text-fg">{staff.department || "—"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-fg-muted">{t('pages.role1')}</span>
          <span className="text-sm font-medium text-fg">{Array.isArray(staff.role) ? staff.role.join(', ') : staff.role || "—"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-fg-muted">{t('pages.status2')}</span>
          <span className="text-sm font-medium text-fg">{staff.status || "Active"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-fg-muted">{t('pages.joinDate1')}</span>
          <span className="text-sm font-medium text-fg">{staff.joinDate || "—"}</span>
        </div>
      </div>
    </div>
  );
}
