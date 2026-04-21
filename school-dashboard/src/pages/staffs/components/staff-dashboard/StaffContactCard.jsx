import { Phone, Mail, Briefcase } from "lucide-react";

export default function StaffContactCard({ staff, t }) {
  return (
    <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-5">
      <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-4">{t('pages.contactInformation1')}</h3>
      <div className="space-y-4">
        {staff.phone && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><Phone size={14} className="text-gray-600 dark:text-zinc-400" /></div>
            <div><p className="text-xs text-gray-400 dark:text-zinc-500">{t('pages.phone1')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{staff.phone}</p></div>
          </div>
        )}
        {staff.email && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><Mail size={14} className="text-gray-600 dark:text-zinc-400" /></div>
            <div><p className="text-xs text-gray-400 dark:text-zinc-500">{t('pages.email1')}</p><p className="text-sm text-gray-900 dark:text-zinc-100 truncate">{staff.email}</p></div>
          </div>
        )}
        {staff.address && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0"><Briefcase size={14} className="text-gray-600 dark:text-zinc-400" /></div>
            <div><p className="text-xs text-gray-400 dark:text-zinc-500">{t('pages.address2')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{staff.address}</p></div>
          </div>
        )}
      </div>
    </div>
  );
}
