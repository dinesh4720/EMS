import { Edit, Phone, Mail, Users } from "lucide-react";

export default function StaffQuickActions({ staff, onEdit, onMessage, navigate, t }) {
  return (
    <div className="bg-surface rounded-lg border border-divider p-5">
      <h3 className="text-sm font-medium text-fg mb-4">{t('pages.quickActions1')}</h3>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={onEdit} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-surface-2 hover:bg-surface-2"><Edit size={18} className="text-fg-muted" /><span className="text-xs text-fg-muted">{t('pages.edit1')}</span></button>
        <button onClick={() => staff?.phone && (window.location.href = `tel:${staff.phone.replace(/[^\d+]/g, '')}`)} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-surface-2 hover:bg-surface-2"><Phone size={18} className="text-fg-muted" /><span className="text-xs text-fg-muted">{t('pages.call')}</span></button>
        <button onClick={onMessage} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-surface-2 hover:bg-surface-2"><Mail size={18} className="text-fg-muted" /><span className="text-xs text-fg-muted">{t('pages.message1')}</span></button>
        <button onClick={() => navigate('/staffs')} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-surface-2 hover:bg-surface-2"><Users size={18} className="text-fg-muted" /><span className="text-xs text-fg-muted">{t('pages.allStaff1')}</span></button>
      </div>
    </div>
  );
}
