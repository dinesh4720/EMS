import { useTranslation } from 'react-i18next';

export default function Invoices() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
      <div className="text-5xl mb-4">🏗️</div>
      <h2 className="text-xl font-semibold text-gray-700 dark:text-zinc-300 mb-2">{t('pages.comingSoon1')}</h2>
      <p className="text-gray-500 dark:text-zinc-400">The accounts module is under development and will be available in a future update.</p>
    </div>
  );
}
