import { useTranslation } from "react-i18next";
import { Phone, Mail } from "lucide-react";

/**
 * StudentContactCard - Right sidebar contact information card
 * Displays parent phone, parent email, and address
 *
 * Props:
 * - student: { parentPhone, parentEmail, address }
 */
export default function StudentContactCard({ student }) {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-100 dark:border-zinc-700 p-5">
      <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-4">
        {t('students.sidebar.contactInformation', 'Contact Information')}
      </h3>
      <div className="space-y-4">
        {student.parentPhone && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <Phone size={14} className="text-gray-600 dark:text-zinc-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-zinc-500">{t('students.parentPhone', 'Parent Phone')}</p>
              <p className="text-sm text-gray-900 dark:text-zinc-100">{student.parentPhone}</p>
            </div>
          </div>
        )}
        {student.parentEmail && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <Mail size={14} className="text-gray-600 dark:text-zinc-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-zinc-500">{t('students.parentEmail', 'Parent Email')}</p>
              <p className="text-sm text-gray-900 dark:text-zinc-100 truncate">{student.parentEmail}</p>
            </div>
          </div>
        )}
        {student.address && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <Mail size={14} className="text-gray-600 dark:text-zinc-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-zinc-500">{t('common.address', 'Address')}</p>
              <p className="text-sm text-gray-900 dark:text-zinc-100">{student.address}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
