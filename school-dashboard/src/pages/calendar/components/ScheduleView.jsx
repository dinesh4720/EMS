import { Button, Chip } from "@heroui/react";
import { Clock, Calendar as CalendarIcon } from "lucide-react";
import { useTranslation } from 'react-i18next';

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

  return (
    <div className="p-4 space-y-1">
      {scheduleViewData.length === 0 ? (
        <div className="text-center py-12">
          <CalendarIcon size={32} className="mx-auto text-default-300 mb-3" />
          {!selectedStaff ? (
            <>
              <p className="text-default-500 font-medium">{t('calendar.scheduleView.selectStaffPrompt', 'Select a staff member')}</p>
              <p className="text-default-400 text-sm mt-1">{t('calendar.scheduleView.selectStaffDesc', 'Choose a staff from the sidebar to view their schedule and appointments')}</p>
            </>
          ) : (
            <>
              <p className="text-default-400">{t('calendar.scheduleView.noEventsThisMonth', 'No events scheduled this month')}</p>
              <Button size="sm" variant="flat" className="mt-3" onPress={onAddEvent}>
                {t('calendar.toolbar.addEvent', 'Add Event')}
              </Button>
            </>
          )}
        </div>
      ) : (
        scheduleViewData.map((dayData) => (
          <div key={dayData.dateKey} className={`flex border border-default-200 rounded-lg overflow-hidden ${dayData.isToday ? 'bg-foreground/[0.02] border-foreground/20' : 'bg-background'}`}>
            {/* Date column */}
            <div className={`w-16 flex-shrink-0 flex flex-col items-center justify-center py-3 border-r border-default-200 ${dayData.isToday ? 'bg-foreground/[0.03]' : 'bg-default-50'}`}>
              <span className="text-2xs font-semibold uppercase text-default-400">{dayData.dayNameShort}</span>
              <span className={`text-xl font-bold ${dayData.isToday ? 'text-foreground' : 'text-foreground'}`}>{dayData.day}</span>
              {dayData.isToday && (
                <span className="text-3xs font-medium text-foreground mt-0.5">{t('calendar.scheduleView.today', 'TODAY')}</span>
              )}
            </div>

            {/* Events column */}
            <div className="flex-1 p-2 space-y-1">
              {dayData.events.map((event) => (
                <div
                  key={event.id}
                  onClick={(e) => onEventClick(e, event)}
                  className="flex items-center gap-3 p-2 rounded-lg border border-default-200 bg-background hover:bg-default-50 cursor-pointer transition-colors"
                >
                  {/* Time */}
                  <div className="w-14 flex-shrink-0 text-right">
                    {event.startTime ? (
                      <>
                        <span className="text-xs font-medium text-foreground">{formatTime(event.startTime)}</span>
                        {event.endTime && (
                          <span className="text-2xs text-default-400 block">{formatTime(event.endTime)}</span>
                        )}
                      </>
                    ) : (
                      <span className="text-2xs text-default-400 uppercase">{t('calendar.scheduleView.allDay', 'All day')}</span>
                    )}
                  </div>

                  {/* Indicator */}
                  <div className={`w-1 h-8 rounded-full ${
                    event.type === 'appointment' ? 'bg-success-400' :
                    event.type === 'class' ? 'bg-default-400' :
                    event.type === 'meeting' ? 'bg-secondary-400' :
                    event.type === 'exam' ? 'bg-warning-400' :
                    event.type === 'holiday' ? 'bg-danger-400' :
                    'bg-primary-400'
                  }`} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{event.title}</span>
                      <Chip size="sm" variant="flat" className="h-4 text-3xs">
                        {eventTypes[event.type]?.label || event.type}
                      </Chip>
                    </div>
                    {event.type === 'class' && event.classId && (
                      <span className="text-xs text-default-400">{getClassName(event.classId)}</span>
                    )}
                    {event.type === 'appointment' && event.purpose && (
                      <span className="text-xs text-default-400 truncate block">{event.purpose}</span>
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
