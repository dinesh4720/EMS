import { Button } from "@heroui/react";
import Chip from "../../../components/ui/Chip";
import Divider from "../../../components/ui/Divider";
import {
  Clock, Users, Calendar as CalendarIcon,
  User, BookOpen, MapPin, Phone, FileText, CheckCircle2, Trash2, Edit3
} from "lucide-react";
import { useTranslation } from 'react-i18next';
import { formatDateWithWeekday } from "../../../utils/dateFormatter";
import Modal from "../../../components/ui/Modal";

export default function EventDetailModal({ isOpen, onClose, event, eventTypes, onDelete, onEdit, getClassName, defaultPeriods, selectedStaff, getTranslatedPeriodName }) {
  const { t } = useTranslation();

  const formatTime = (time) => {
    if (!time) return "";
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return formatDateWithWeekday(dateStr, '');
  };

  const renderEventDetail = () => {
    if (!event) return null;

    const eventType = event.type;
    const Icon = eventTypes[eventType]?.icon || CalendarIcon;

    return (
      <div className="space-y-4">
        {/* Header with type */}
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            eventType === 'appointment' ? 'bg-ok-bg text-ok' :
            eventType === 'class' ? 'bg-surface-2 text-fg' :
            eventType === 'meeting' ? 'bg-warn-bg text-warn' :
            eventType === 'exam' ? 'bg-danger-bg text-danger-token' :
            eventType === 'holiday' ? 'bg-danger-bg text-danger-token' :
            'bg-accent-bg text-accent'
          }`}>
            <Icon size={16} />
          </div>
          <div>
            <Chip size="sm" color="neutral">
              {eventTypes[eventType]?.label || eventType}
            </Chip>
          </div>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-lg font-semibold text-fg">{event.title}</h3>
          <p className="text-sm text-fg-muted mt-1">{formatDate(event.date)}</p>
        </div>

        {/* Time */}
        {(event.startTime || event.allDay) && (
          <div className="flex items-center gap-2 text-sm text-fg-muted">
            <Clock size={14} className="text-fg-faint" />
            {event.allDay ? (
              <span>{t('calendar.eventDetail.allDay', 'All Day')}</span>
            ) : (
              <span>
                {formatTime(event.startTime)}
                {event.endTime && ` - ${formatTime(event.endTime)}`}
              </span>
            )}
          </div>
        )}

        <Divider />

        {/* Type-specific details */}
        {eventType === 'appointment' && event.rawAppointment && (
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <User size={14} className="text-fg-faint mt-0.5" />
              <div>
                <span className="text-xs text-fg-faint block">{t('calendar.eventDetail.visitor', 'Visitor')}</span>
                <span className="text-sm font-medium text-fg">{event.visitorName}</span>
              </div>
            </div>

            {event.phone && (
              <div className="flex items-start gap-2">
                <Phone size={14} className="text-fg-faint mt-0.5" />
                <div>
                  <span className="text-xs text-fg-faint block">{t('calendar.eventDetail.phone', 'Phone')}</span>
                  <span className="text-sm text-fg">{event.phone}</span>
                </div>
              </div>
            )}

            {event.purpose && (
              <div className="flex items-start gap-2">
                <FileText size={14} className="text-fg-faint mt-0.5" />
                <div>
                  <span className="text-xs text-fg-faint block">{t('calendar.eventDetail.purpose', 'Purpose')}</span>
                  <span className="text-sm text-fg">{event.purpose}</span>
                </div>
              </div>
            )}

            {event.meetingWith && (
              <div className="flex items-start gap-2">
                <Users size={14} className="text-fg-faint mt-0.5" />
                <div>
                  <span className="text-xs text-fg-faint block">{t('calendar.eventDetail.meetingWith', 'Meeting With')}</span>
                  <span className="text-sm text-fg">{event.meetingWith}</span>
                </div>
              </div>
            )}

            {event.status && (
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-fg-faint mt-0.5" />
                <div>
                  <span className="text-xs text-fg-faint block">{t('calendar.eventDetail.status', 'Status')}</span>
                  <Chip size="sm" color={
                    event.status === 'completed' ? 'success' :
                    event.status === 'cancelled' ? 'danger' : 'primary'
                  }>
                    {event.status}
                  </Chip>
                </div>
              </div>
            )}

            {event.notes && (
              <div className="p-3 bg-surface-2 rounded-lg">
                <span className="text-xs text-fg-faint block mb-1">{t('calendar.eventDetail.notes', 'Notes')}</span>
                <span className="text-sm text-fg">{event.notes}</span>
              </div>
            )}
          </div>
        )}

        {eventType === 'class' && (
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <BookOpen size={14} className="text-fg-faint mt-0.5" />
              <div>
                <span className="text-xs text-fg-faint block">{t('calendar.eventDetail.subject', 'Subject')}</span>
                <span className="text-sm font-medium text-fg">{event.subject}</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-fg-faint mt-0.5" />
              <div>
                <span className="text-xs text-fg-faint block">{t('calendar.eventDetail.class', 'Class')}</span>
                <span className="text-sm font-medium text-fg">{getClassName(event.classId)}</span>
              </div>
            </div>

            {event.periodIndex !== undefined && defaultPeriods[event.periodIndex] && (
              <div className="flex items-start gap-2">
                <Clock size={14} className="text-fg-faint mt-0.5" />
                <div>
                  <span className="text-xs text-fg-faint block">{t('calendar.eventDetail.period', 'Period')}</span>
                  <span className="text-sm text-fg">{getTranslatedPeriodName(defaultPeriods[event.periodIndex])} ({defaultPeriods[event.periodIndex].startTime} - {defaultPeriods[event.periodIndex].endTime})</span>
                </div>
              </div>
            )}

            {selectedStaff && (
              <div className="flex items-start gap-2">
                <User size={14} className="text-fg-faint mt-0.5" />
                <div>
                  <span className="text-xs text-fg-faint block">{t('calendar.eventDetail.teacher', 'Teacher')}</span>
                  <span className="text-sm text-fg">{selectedStaff.name}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {eventType === 'meeting' && (
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Users size={14} className="text-fg-faint mt-0.5" />
              <div>
                <span className="text-xs text-fg-faint block">{t('calendar.eventDetail.meeting', 'Meeting')}</span>
                <span className="text-sm text-fg">{event.title}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const footer = (
    <div className="flex items-center gap-2 w-full">
      {!event?.id?.toString().startsWith('apt-') && !event?.id?.toString().startsWith('tt-') && (
        <>
          <Button size="sm" variant="flat" color="danger" startContent={<Trash2 size={14} />} onPress={() => onDelete(event?.id)}>
            {t('common.delete', 'Delete')}
          </Button>
          {onEdit && (
            <Button size="sm" variant="flat" startContent={<Edit3 size={14} />} onPress={() => onEdit(event)}>
              {t('common.edit', 'Edit')}
            </Button>
          )}
        </>
      )}
      <div className="flex-1" />
      <Button size="sm" variant="light" onPress={onClose}>{t('common.close', 'Close')}</Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={t('calendar.eventDetail.title', 'Event Details')}
      footer={footer}
    >
      {renderEventDetail()}
    </Modal>
  );
}
