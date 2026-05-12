import { Phone, Mail, Briefcase } from "lucide-react";

export default function StaffContactCard({ staff, t }) {
  return (
    <div className="bg-surface rounded-lg border border-divider p-5">
      <h3 className="text-sm font-medium text-fg mb-4">{t('pages.contactInformation1')}</h3>
      <div className="space-y-4">
        {staff.phone && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center"><Phone size={14} className="text-fg-muted" /></div>
            <div><p className="text-xs text-fg-faint">{t('pages.phone1')}</p><p className="text-sm text-fg">{staff.phone}</p></div>
          </div>
        )}
        {staff.email && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center"><Mail size={14} className="text-fg-muted" /></div>
            <div><p className="text-xs text-fg-faint">{t('pages.email1')}</p><p className="text-sm text-fg truncate">{staff.email}</p></div>
          </div>
        )}
        {staff.address && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center flex-shrink-0"><Briefcase size={14} className="text-fg-muted" /></div>
            <div><p className="text-xs text-fg-faint">{t('pages.address2')}</p><p className="text-sm text-fg">{staff.address}</p></div>
          </div>
        )}
      </div>
    </div>
  );
}
