import Chip from "../../../components/ui/Chip";
import { Calendar as CalendarIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { EmptyState, Button as DSButton } from "../../../components/ui";
import { getDateLocale } from "../../../i18n/index";
import { daysOfWeekFull, defaultPeriods, formatDateKey, formatTime, eventTypes as defaultEventTypes } from "../constants";

export default function DayView({
  currentDate,
  selectedStaff,
  getEventsForDate,
  getTimetableForDate,
  getClassName,
  onDateClick,
  onEventClick,
  eventTypes = defaultEventTypes,
}) {
  const { t } = useTranslation();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const dateKey = formatDateKey(year, month, currentDate.getDate());

  const events = getEventsForDate(dateKey);
  const timetableClasses = getTimetableForDate(dateKey);

  return (
    <div className="flex justify-center p-6">
      <div className="max-w-2xl w-full bg-surface rounded-xl border border-border-token p-6">
        <div className="flex items-baseline gap-3 border-b border-divider pb-4 mb-4">
          <span className="text-3xl font-bold tracking-tight text-fg">{currentDate.getDate()}</span>
          <div className="text-lg text-fg-faint font-medium">
            {daysOfWeekFull[currentDate.getDay()]}
          </div>
          <div className="ml-auto text-base text-fg-muted">
            {currentDate.toLocaleDateString(getDateLocale(), { month: "long", year: "numeric" })}
          </div>
        </div>

        {selectedStaff && timetableClasses.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-fg-muted uppercase mb-2">
              {t("calendar.dayView.todaysClasses", "Today's Classes")}
            </h4>
            <div className="space-y-2">
              {timetableClasses.map((cls) => {
                const period = defaultPeriods[cls.periodIndex];
                return (
                  <div
                    key={cls.id}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => onEventClick(e, cls)}
                    onKeyDown={(e) => { if (e.key === "Enter") onEventClick(e, cls); }}
                    className="flex items-center gap-3 p-2 rounded-lg border border-border-token bg-surface-2 hover:bg-surface-hover cursor-pointer"
                  >
                    <div className="text-2xs text-fg-faint w-16">
                      {period?.startTime} - {period?.endTime}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-fg">{cls.subject}</div>
                      <div className="text-xs text-fg-faint">{getClassName(cls.classId)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {events.length === 0 ? (
            <EmptyState
              icon={CalendarIcon}
              size="sm"
              title={t("calendar.dayView.noEvents", "No events scheduled")}
              action={
                <DSButton size="sm" variant="secondary" onClick={() => onDateClick(dateKey)}>
                  {t("calendar.toolbar.addEvent", "Add Event")}
                </DSButton>
              }
            />
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                role="button"
                tabIndex={0}
                onClick={(e) => onEventClick(e, event)}
                onKeyDown={(e) => { if (e.key === "Enter") onEventClick(e, event); }}
                className="flex gap-3 p-2 rounded-lg border border-divider hover:border-border-token transition-colors cursor-pointer"
              >
                <div className="w-14 flex flex-col items-center pt-1">
                  <span className="text-2xs font-medium text-fg-muted">
                    {event.allDay ? "ALL DAY" : formatTime(event.startTime)}
                  </span>
                  {event.endTime && (
                    <span className="text-2xs text-fg-faint">{formatTime(event.endTime)}</span>
                  )}
                </div>
                <div className="w-0.5 rounded-full bg-border-token" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-fg">{event.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Chip size="sm" color="neutral" className="h-5 text-2xs">
                      {eventTypes[event.type]?.label || event.type}
                    </Chip>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
