import { Check, CalendarDays, Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toTodayDateString } from "../../../../utils/dateFormatter";
import Button from "../../../../components/ui/Button";
import Skeleton from "../../../../components/ui/Skeleton";

/** Top toolbar: class picker, date navigation, daily/monthly toggle, bulk actions. */
export default function AttendanceToolbar({
  classId,
  classesWithTeachers,
  selectedClass,
  setSelectedClass,
  date,
  shiftDate,
  setDate,
  handleDateInputChange,
  view,
  setView,
  isLoadingAttendance,
  markAllPresent,
  isReadOnly,
  onRegOpen,
  isLocked,
  classStudentsLength,
  absentCount,
  handleNotifyParents,
  isNotifying,
}) {
  const { t } = useTranslation();
  return (
    <div className="attn-toolbar">
      <div className="attn-toolbar__left">
        {!classId && (
          <select
            className="attn-class-select"
            value={selectedClass || ''}
            onChange={(e) => setSelectedClass(e.target.value)}
            aria-label={t('pages.class1')}
          >
            {classesWithTeachers.map(c => (
              <option key={c.id || c._id || `${c.name}-${c.section}`} value={c.id || c._id || `${c.name}-${c.section}`}>
                {c.name} - {c.section}
              </option>
            ))}
          </select>
        )}
        <div className="attn-toolbar__date">
          <button type="button" className="iconbtn" onClick={() => shiftDate(-1)} aria-label={t('common.previous', 'Previous day')}>
            <ChevronLeft size={14} />
          </button>
          <input
            type="date"
            className="attn-date-input"
            value={date}
            max={toTodayDateString()}
            onChange={(e) => handleDateInputChange(e.target.value)}
            aria-label={t('pages.date', 'Date')}
          />
          <button type="button" className="iconbtn" onClick={() => shiftDate(1)} aria-label={t('common.next', 'Next day')} disabled={date >= toTodayDateString()}>
            <ChevronRight size={14} />
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--sm mono tnum"
            onClick={() => setDate(toTodayDateString())}
            disabled={date === toTodayDateString()}
          >
            {t('common.today', 'Today')}
          </button>
        </div>
        <div className="seg" role="tablist" aria-label={t('attendance.view', 'View')}>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'daily'}
            className={`seg__btn ${view === 'daily' ? 'is-active' : ''}`}
            onClick={() => setView('daily')}
          >
            {t('attendance.daily', 'Daily')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'monthly'}
            className={`seg__btn ${view === 'monthly' ? 'is-active' : ''}`}
            onClick={() => setView('monthly')}
          >
            {t('attendance.monthly', 'Monthly')}
          </button>
        </div>
        {isLoadingAttendance && (
          <Skeleton variant="rect" className="h-5 w-16 shrink-0" />
        )}
      </div>

      <div className="attn-toolbar__right">
        <Button
          size="sm"
          variant="outline"
          icon={<Check size={14} />}
          onClick={markAllPresent}
          disabled={isReadOnly}
        >
          {t('pages.markAllPresent')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          icon={<CalendarDays size={14} />}
          onClick={onRegOpen}
          disabled={isLocked || !classStudentsLength}
        >
          {t('attendance.regularize', 'Regularize')}
        </Button>
        {absentCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            icon={<Bell size={14} />}
            onClick={handleNotifyParents}
            loading={isNotifying}
          >
            {t('attendance.notifyParents', 'Notify Parents')} ({absentCount})
          </Button>
        )}
      </div>
    </div>
  );
}
