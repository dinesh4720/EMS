import { Edit, Phone, Mail, Users } from "lucide-react";

export default function StaffQuickActions({ staff, onEdit, onMessage, navigate, t }) {
  return (
    <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-5">
      <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-4">{t('pages.quickActions1')}</h3>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={onEdit} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-700"><Edit size={18} className="text-gray-600 dark:text-zinc-400" /><span className="text-xs text-gray-600 dark:text-zinc-400">{t('pages.edit1')}</span></button>
        <button onClick={() => staff?.phone && (window.location.href = `tel:${staff.phone.replace(/[^\d+]/g, '')}`)} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-700"><Phone size={18} className="text-gray-600 dark:text-zinc-400" /><span className="text-xs text-gray-600 dark:text-zinc-400">{t('pages.call')}</span></button>
        <button onClick={onMessage} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-700"><Mail size={18} className="text-gray-600 dark:text-zinc-400" /><span className="text-xs text-gray-600 dark:text-zinc-400">{t('pages.message1')}</span></button>
        <button onClick={() => navigate('/staffs')} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-700"><Users size={18} className="text-gray-600 dark:text-zinc-400" /><span className="text-xs text-gray-600 dark:text-zinc-400">{t('pages.allStaff1')}</span></button>
      </div>
    </div>
  );
}
