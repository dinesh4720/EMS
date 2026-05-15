import { Button } from "@heroui/react";
import { Clock, Plus } from "lucide-react";
import { daysOfWeek, formatDateKey, formatTime } from "../constants";

export default function WeekView({
  currentDate,
  selectedStaff,
  getEventsForDate,
  getTimetableForDate,
  getClassName,
  onDateClick,
  onEventClick,
}) {
  const start = new Date(currentDate);
  start.setDate(start.getDate() - start.getDay());
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  const today = new Date();
  const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="overflow-x-auto">
    <div className="p-4 grid grid-cols-7 gap-2 min-w-[900px]">
      {weekDates.map((date, i) => {
        const dateKey = formatDateKey(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEvents = getEventsForDate(dateKey);
        const timetableClasses = getTimetableForDate(dateKey);
        const isToday = dateKey === todayKey;

        return (
          <div
            key={`day-${dateKey}`}
            className={`flex flex-col rounded-lg border min-h-[400px] hover:border-border-strong transition-colors
              ${isToday
                ? "border-accent-border bg-accent-bg"
                : "border-border-token bg-surface"}`}
          >
            <div className={`p-2 border-b border-divider text-center ${isToday ? "bg-accent-bg" : ""}`}>
              <div className={`text-2xs font-semibold uppercase ${isToday ? "text-accent" : "text-fg-faint"}`}>
                {daysOfWeek[i]}
              </div>
              <div className="text-lg font-bold mt-0.5 text-fg">{date.getDate()}</div>
            </div>
            <div
              className="flex-1 p-1.5 space-y-1 cursor-pointer overflow-auto"
              onClick={() => onDateClick(dateKey)}
              onKeyDown={(e) => { if (e.key === "Enter") onDateClick(dateKey); }}
              role="button"
              tabIndex={0}
            >
              {selectedStaff && timetableClasses.map((cls) => (
                <div
                  key={cls.id}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => onEventClick(e, cls)}
                  onKeyDown={(e) => { if (e.key === "Enter") onEventClick(e, cls); }}
                  className="p-1.5 rounded text-2xs border border-border-token bg-surface-2 hover:bg-surface-hover cursor-pointer"
                >
                  <div className="font-medium text-fg">{cls.subject}</div>
                  <div className="text-fg-faint">{getClassName(cls.classId)}</div>
                </div>
              ))}
              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => onEventClick(e, event)}
                  onKeyDown={(e) => { if (e.key === "Enter") onEventClick(e, event); }}
                  className={`calendar-event !block !whitespace-normal cursor-pointer hover:opacity-80
                    ${event.type === "holiday" ? "calendar-event--holiday"
                      : event.type === "exam" ? "calendar-event--exam"
                      : event.type === "meeting" ? "calendar-event--meeting"
                      : ""}`}
                >
                  <div className="font-medium">{event.title}</div>
                  {event.startTime && (
                    <div className="opacity-70 mt-0.5 flex items-center gap-1">
                      <Clock size={8} /> {formatTime(event.startTime)}
                    </div>
                  )}
                </div>
              ))}
              {(dayEvents.length + timetableClasses.length) === 0 && (
                <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="flat" className="h-6 w-6 min-w-0 p-0 rounded-full">
                    <Plus size={12} />
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
    </div>
  );
}
