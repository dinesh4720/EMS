export default function StaffMonthlySummary({ monthlyStats, t }) {
  return (
    <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 p-5">
      <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-4">{t('pages.monthlySummary')}</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-zinc-900">
          <p className="text-xl font-bold text-gray-900 dark:text-zinc-100">{monthlyStats.total}</p>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{t('pages.workingDays')}</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-zinc-900">
          <p className="text-xl font-bold text-gray-900 dark:text-zinc-100">{monthlyStats.present}</p>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{t('pages.present2')}</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-zinc-900">
          <p className="text-xl font-bold text-gray-900 dark:text-zinc-100">{monthlyStats.absent}</p>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{t('pages.absent2')}</p>
        </div>
      </div>
    </div>
  );
}
