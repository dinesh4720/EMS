import { useTranslation } from 'react-i18next';

// ── Reusable Section header matching student drawer pattern ──
function SectionHeader({ icon: Icon, title, subtitle, optional = false }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-md bg-gray-900/8 flex items-center justify-center">
        <Icon size={13} className="text-gray-700" />
      </div>
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      {optional && (
        <span className="text-2xs font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{t('common.optional', 'Optional')}</span>
      )}
      {subtitle && <span className="text-xs text-gray-400 ml-auto">{subtitle}</span>}
    </div>
  );
}

export default SectionHeader;
