import { useTranslation } from 'react-i18next';

// ── Reusable Section header matching student drawer pattern ──
function SectionHeader({ icon: Icon, title, subtitle, optional = false }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-md bg-surface-2 flex items-center justify-center">
        <Icon size={13} className="text-fg-muted" />
      </div>
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      {optional && (
        <span className="text-2xs font-medium text-fg-subtle bg-surface-2 px-1.5 py-0.5 rounded">{t('common.optional', 'Optional')}</span>
      )}
      {subtitle && <span className="text-xs text-fg-subtle ml-auto">{subtitle}</span>}
    </div>
  );
}

export default SectionHeader;
