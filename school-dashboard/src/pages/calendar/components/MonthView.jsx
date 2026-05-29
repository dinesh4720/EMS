import Tooltip from "../../../components/ui/Tooltip";
import { useTranslation } from "react-i18next";
import { daysOfWeek, formatDateKey } from "../constants";

export default function MonthView({
  year,
  month,
  selectedStaff,
  getEventsForDate,
  getTimetableForDate,
  getClassName,
  onDateClick,
  onEventClick,
}) {
  const { t } = useTranslation();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const visibleEventLimit = selectedStaff ? 4 : 3;
  const dayEventLimit = selectedStaff ? 2 : 3;

  const cells = [];

  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    cells.push(
      <div
        key={`prev-${day}`}
        className="calendar-month__cell is-other-month"
      >
        <span className="calendar-month__date">{day}</span>
      </div>,
    );
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = formatDateKey(year, month, day);
    const dayEvents = getEventsForDate(dateKey);
    const timetableClasses = getTimetableForDate(dateKey);
    const isToday = dateKey === todayKey;
    const isSelectedStaffDay = selectedStaff && timetableClasses.length > 0;
    const totalCount = dayEvents.length + timetableClasses.length;

    cells.push(
      <button
        key={day}
        type="button"
        onClick={() => onDateClick(dateKey)}
        aria-label={`${day} ${isToday ? "(today)" : ""}`}
        className={`calendar-month__cell text-left group relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]
          ${isToday ? "is-today" : ""}
          ${isSelectedStaffDay && !isToday ? "bg-surface-2" : ""}
        `}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span
            className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full transition-all
              ${isToday ? "bg-accent text-accent-fg" : "text-fg group-hover:bg-surface-2"}`}
          >
            {day}
          </span>
          {isSelectedStaffDay && (
            <Tooltip content={`${timetableClasses.length} classes`}>
              <span className="text-2xs px-1.5 py-0.5 bg-surface-2 rounded text-fg-muted">
                {timetableClasses.length}
              </span>
            </Tooltip>
          )}
        </div>

        <div className="space-y-1">
          {selectedStaff && timetableClasses.slice(0, 2).map((cls) => (
            <div
              key={cls.id}
              role="button"
              tabIndex={0}
              onClick={(e) => onEventClick(e, cls)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onEventClick(e, cls); }}
              className="text-2xs px-1.5 py-0.5 rounded border border-border-token bg-surface-2 text-fg-muted truncate cursor-pointer hover:bg-surface-hover"
            >
              {cls.subject} <span className="text-fg-faint">({getClassName(cls.classId)})</span>
            </div>
          ))}

          {dayEvents.slice(0, dayEventLimit).map((event) => (
            <div
              key={event.id}
              role="button"
              tabIndex={0}
              onClick={(e) => onEventClick(e, event)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onEventClick(e, event); }}
              className={`calendar-event cursor-pointer hover:opacity-80
                ${event.type === "holiday" ? "calendar-event--holiday"
                  : event.type === "exam" ? "calendar-event--exam"
                  : event.type === "meeting" ? "calendar-event--meeting"
                  : ""}`}
            >
              {event.title}
            </div>
          ))}

          {totalCount > visibleEventLimit && (
            <div className="text-2xs font-medium text-fg-faint px-1">
              {t("calendar.monthView.more", "+{{count}} more", {
                count: totalCount - visibleEventLimit,
              })}
            </div>
          )}
        </div>
      </button>,
    );
  }

  const remainingDays = 42 - cells.length;
  for (let day = 1; day <= remainingDays; day++) {
    cells.push(
      <div
        key={`next-${day}`}
        className="calendar-month__cell is-other-month"
      >
        <span className="calendar-month__date">{day}</span>
      </div>,
    );
  }

  return (
    <div className="overflow-x-auto p-3">
    <div className="min-w-[700px]">
      <div className="calendar-month">
        {daysOfWeek.map((day) => (
          <div key={day} className="calendar-month__header text-center">
            {day}
          </div>
        ))}
        {cells}
      </div>
    </div>
    </div>
  );
}
