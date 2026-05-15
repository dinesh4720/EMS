import { Calendar, Wand2, Settings } from "lucide-react";
import { useTranslation } from 'react-i18next';

/**
 * Empty state shown when no timetable exists for the selected class.
 */
export function TimetableEmptyState({ onWizardClick, onPeriodsOpen }) {
  const { t } = useTranslation();

  return (
    <div className="tt-empty-state">
      <div className="tt-empty-state__icon">
        <Calendar size={20} aria-hidden />
      </div>
      <h3 className="tt-empty-state__title">{t('pages.noTimetableSet')}</h3>
      <p className="tt-empty-state__sub">
        No periods are scheduled for this class yet. Run the wizard to generate one
        from your subjects and teacher availability, or configure periods manually first.
      </p>
      <div className="tt-empty-state__actions">
        <button type="button" className="btn btn--accent btn--sm" onClick={onWizardClick}>
          <Wand2 size={13} aria-hidden /> Generate timetable
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onPeriodsOpen}>
          <Settings size={13} aria-hidden /> Manage periods
        </button>
      </div>
    </div>
  );
}
