import Button from "../../../components/ui/Button";
import Chip from "../../../components/ui/Chip";
import { Clock, Calendar as CalendarIcon } from "lucide-react";
import { useTranslation } from 'react-i18next';
import EmptyState from "../../../components/ui/EmptyState";

export default function ScheduleView({ scheduleViewData = [], eventTypes, onEventClick, getClassName, onAddEvent, selectedStaff }) {
  const { t } = useTranslation();

  const formatTime = (time) => {
    if (!time) return "";
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  const handleEventKeyDown = (e, event) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onEventClick(e, event);
    }
  };

  return (
    <div className="p-4 space-y-1">
      {scheduleViewData.length === 0 ? (
        <EmptyState
          icon={CalendarIcon}
          title={!selectedStaff
            ? t('calendar.scheduleView.selectStaffPrompt', 'Select a staff member')
            : t('calendar.scheduleView.noEventsThisMonth', 'No events scheduled this month')
          }
          description={!selectedStaff
            ? t('calendar.scheduleView.selectStaffDesc', 'Choose a staff from the sidebar to view their schedule and appointments')
            : undefined
          }
          action={selectedStaff && (
            <Button size="sm" variant="ghost" onClick={onAddEvent}>
              {t('calendar.toolbar.addEvent', 'Add Event')}
            </Button>
          )}
        />
      ) : (
        scheduleViewData.map((dayData) => (
          <div key={dayData.dateKey} className={`flex border border-border-token rounded-lg overflow-hidden ${dayData.isToday ? 'bg-accent-bg border-accent-border' : 'bg-surface'}`}>
            {/* Date column */}
            <div className={`w-16 flex-shrink-0 flex flex-col items-center justify-center py-3 border-r border-border-token ${dayData.isToday ? 'bg-accent-bg' : 'bg-surface-2'}`}>
              <span className="text-2xs font-semibold uppercase text-fg-faint">{dayData.dayNameShort}</span>
              <span className={`text-xl font-bold ${dayData.isToday ? 'text-accent' : 'text-fg'}`}>{dayData.day}</span>
              {dayData.isToday && (
                <span className="text-3xs font-medium text-accent mt-0.5">{t('calendar.scheduleView.today', 'TODAY')}</span>
              )}
            </div>

            {/* Events column */}
            <div className="flex-1 p-2 space-y-1">
              {dayData.events.map((event) => (
                <div
                  key={event.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${event.title}, ${eventTypes[event.type]?.label || event.type}`}
                  onClick={(e) => onEventClick(e, event)}
                  onKeyDown={(e) => handleEventKeyDown(e, event)}
                  className="flex items-center gap-3 p-2 rounded-lg border border-border-token bg-surface hover:bg-surface-2 cursor-pointer transition-colors"
                >
                  {/* Time */}
                  <div className="w-14 flex-shrink-0 text-right">
                    {event.startTime ? (
                      <>
                        <span className="text-xs font-medium text-fg">{formatTime(event.startTime)}</span>
                        {event.endTime && (
                          <span className="text-2xs text-fg-faint block">{formatTime(event.endTime)}</span>
                        )}
                      </>
                    ) : (
                      <span className="text-2xs text-fg-faint uppercase">{t('calendar.scheduleView.allDay', 'All day')}</span>
                    )}
                  </div>

                  {/* Indicator */}
                  <div className={`w-1 h-8 rounded-full ${
                    event.type === 'appointment' ? 'bg-[color:var(--ok)]' :
                    event.type === 'class' ? 'bg-fg-faint' :
                    event.type === 'meeting' ? 'bg-[color:var(--warn)]' :
                    event.type === 'exam' ? 'bg-[color:var(--danger)]' :
                    event.type === 'holiday' ? 'bg-[color:var(--danger)]' :
                    'bg-accent'
                  }`} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-fg truncate">{event.title}</span>
                      <Chip size="sm" color="neutral" className="h-4 text-3xs">
                        {eventTypes[event.type]?.label || event.type}
                      </Chip>
                    </div>
                    {event.type === 'class' && event.classId && (
                      <span className="text-xs text-fg-faint">{getClassName(event.classId)}</span>
                    )}
                    {event.type === 'appointment' && event.purpose && (
                      <span className="text-xs text-fg-faint truncate block">{event.purpose}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
