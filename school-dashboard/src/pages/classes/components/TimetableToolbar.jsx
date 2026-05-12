import { Settings, Save, Wand2, AlertTriangle, CheckCircle2, Loader2, Printer } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { TIMETABLE_DAYS } from '../../../utils/constants';

/**
 * Toolbar for the Timetable page — class selector, view switcher (Week/Day),
 * sync status, and action buttons. Uses .toolbar + .seg primitives from
 * shell.css for density parity with StaffList.
 */
export function TimetableToolbar({
  classId,
  selectedClass,
  setSelectedClass,
  classesWithTeachers,
  selectedClassData,
  currentAcademicYear,
  syncStatus,
  hasChanges,
  loading,
  view = 'week',
  onViewChange,
  activeDay,
  onActiveDayChange,
  onWizardClick,
  onPeriodsOpen,
  onSaveTimetable,
  onPrint,
}) {
  const { t } = useTranslation();
  const days = TIMETABLE_DAYS;

  return (
    <div className="tt-toolbar">
      <div className="tt-toolbar__left">
        {!classId && (
          <select
            className="tt-class-select"
            value={selectedClass || ''}
            onChange={(e) => setSelectedClass(e.target.value)}
            aria-label={t('aria.inputs.selectClass')}
          >
            {classesWithTeachers.map((c) => (
              <option key={c.id} value={c.id}>
                Class {c.name}-{c.section}
              </option>
            ))}
          </select>
        )}
        {selectedClassData && (
          <span className="status" title="Academic year">
            <span className="mono tnum">{currentAcademicYear}</span>
          </span>
        )}

        <div className="seg" role="tablist" aria-label="View mode">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'week'}
            className={`seg__btn ${view === 'week' ? 'is-active' : ''}`}
            onClick={() => onViewChange?.('week')}
          >
            Week
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'day'}
            className={`seg__btn ${view === 'day' ? 'is-active' : ''}`}
            onClick={() => onViewChange?.('day')}
          >
            Day
          </button>
        </div>

        {view === 'day' && (
          <div className="seg" role="tablist" aria-label="Day selector">
            {days.map((d) => (
              <button
                key={d}
                type="button"
                role="tab"
                aria-selected={activeDay === d}
                className={`seg__btn ${activeDay === d ? 'is-active' : ''}`}
                onClick={() => onActiveDayChange?.(d)}
              >
                {d.slice(0, 3)}
              </button>
            ))}
          </div>
        )}

        {syncStatus === 'syncing' && (
          <span className="status status--info">
            <Loader2 size={11} className="animate-spin" aria-hidden /> Syncing
          </span>
        )}
        {syncStatus === 'success' && (
          <span className="status status--ok">
            <CheckCircle2 size={11} aria-hidden /> Synced
          </span>
        )}
        {syncStatus === 'error' && (
          <span className="status status--danger">
            <AlertTriangle size={11} aria-hidden /> Sync failed
          </span>
        )}
      </div>

      <div className="tt-toolbar__right">
        <button type="button" className="btn btn--ghost btn--sm" onClick={onPrint} title="Print timetable">
          <Printer size={13} aria-hidden /> Print
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onPeriodsOpen}>
          <Settings size={13} aria-hidden /> Periods
        </button>
        <button type="button" className="btn btn--sm" onClick={onWizardClick}>
          <Wand2 size={13} aria-hidden /> Wizard
        </button>
        {hasChanges && (
          <button
            type="button"
            className="btn btn--accent btn--sm"
            onClick={onSaveTimetable}
            disabled={loading}
          >
            <Save size={13} aria-hidden /> Save
          </button>
        )}
      </div>
    </div>
  );
}
