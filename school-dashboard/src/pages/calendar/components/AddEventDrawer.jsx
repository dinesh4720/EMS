import { useEffect, useState } from "react";
import Button from "../../../components/ui/Button";
import IconButton from "../../../components/ui/IconButton";
import { Input, Textarea } from "../../../components/ui";
import {
  Plus, Clock, Calendar as CalendarIcon, X, Edit3, Repeat
} from "lucide-react";
import { useTranslation } from 'react-i18next';
import { formatDateWithWeekday, formatDateShortWeekday } from "../../../utils/dateFormatter";

// Must match backend enum: ['event', 'meeting', 'exam', 'holiday']
const eventTypes = {
  event: { label: 'Event', icon: null },
  meeting: { label: 'Meeting', icon: null },
  exam: { label: 'Exam', icon: null },
  holiday: { label: 'Holiday', icon: null },
};

export default function AddEventDrawer({ isOpen, onClose, selectedDate, onAddEvent, eventTypesConfig, editingEvent }) {
  const { t } = useTranslation();

  const defaultState = {
    title: "", type: "event", startTime: "", endTime: "", allDay: false,
    description: "", holidayType: "", recurrence: ""
  };

  const [newEvent, setNewEvent] = useState(defaultState);

  // Pre-fill form when editing
  useEffect(() => {
    if (editingEvent && isOpen) {
      setNewEvent({
        title: editingEvent.title || "",
        type: editingEvent.type || "event",
        startTime: editingEvent.startTime || "",
        endTime: editingEvent.endTime || "",
        allDay: editingEvent.allDay || false,
        description: editingEvent.description || "",
        holidayType: editingEvent.holidayType || "",
        recurrence: editingEvent.recurrence?.freq || "",
      });
    } else if (!editingEvent && isOpen) {
      setNewEvent(defaultState);
    }
  }, [editingEvent, isOpen]);

  const types = eventTypesConfig || eventTypes;

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

  const handleAddEvent = async () => {
    if (!newEvent.title.trim() || !selectedDate) return;

    const payload = {
      title: newEvent.title,
      date: selectedDate,
      type: newEvent.type,
      startTime: newEvent.allDay ? "" : newEvent.startTime,
      endTime: newEvent.allDay ? "" : newEvent.endTime,
      allDay: newEvent.allDay,
      description: newEvent.description || undefined,
    };

    // Include holidayType only for holiday events
    if (newEvent.type === 'holiday' && newEvent.holidayType) {
      payload.holidayType = newEvent.holidayType;
    }

    // Include recurrence if set
    if (newEvent.recurrence) {
      payload.recurrence = { freq: newEvent.recurrence };
    }

    await onAddEvent(payload);

    onClose();
    // Reset form
    setNewEvent(defaultState);
  };

  // Esc to close + body scroll lock
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="frosted-overlay__backdrop frosted-overlay__backdrop--side"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        className="frosted-overlay frosted-overlay--side"
        role="dialog"
        aria-modal="true"
        aria-label={editingEvent ? "Edit event" : "Add event"}
      >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-divider">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center">
                  {editingEvent ? <Edit3 size={18} className="text-fg-muted" /> : <Plus size={18} className="text-fg-muted" />}
                </div>
                <div>
                  <span className="text-base font-semibold block text-fg">{editingEvent ? t('calendar.editEvent.title', 'Edit Event') : t('calendar.addEvent.title', 'New Event')}</span>
                  {selectedDate && (
                    <span className="text-xs text-fg-faint">{formatDate(selectedDate)}</span>
                  )}
                </div>
              </div>
              <IconButton
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="text-fg-faint hover:text-fg"
                aria-label="Close"
              >
                <X size={18} />
              </IconButton>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="text-xs font-medium text-fg-muted mb-1.5 block">{t('calendar.addEvent.eventTitleLabel', 'Event Title')}</label>
                  <Input
                    placeholder={t('calendar.addEvent.eventTitlePlaceholder', 'e.g., Staff Meeting, Annual Day...')}
                    size="lg"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="border-border-token hover:border-border-strong focus-within:border-border-strong"
                  />
                </div>

                {/* Event Type Selection */}
                <div>
                  <label className="text-xs font-medium text-fg-muted mb-2 block">{t('calendar.addEvent.eventTypeLabel', 'Event Type')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(types)
                      .map(([key, { label, icon: Icon }]) => (
                        <button
                          key={key}
                          onClick={() => setNewEvent({ ...newEvent, type: key })}
                          className={`flex items-center gap-2.5 p-3 rounded-lg border transition-all text-left ${
                            newEvent.type === key
                              ? 'border-foreground bg-foreground/[0.03]'
                              : 'border-border-token hover:border-border-strong bg-background'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                            newEvent.type === key ? 'bg-foreground text-background' : 'bg-surface-2 text-fg-muted'
                          }`}>
                            {Icon && <Icon size={14} />}
                          </div>
                          <span className={`text-sm font-medium ${newEvent.type === key ? 'text-foreground' : 'text-fg-muted'}`}>
                            {label}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-medium text-fg-muted mb-1.5 block">{t('calendar.addEvent.descriptionLabel', 'Description')}</label>
                  <Textarea
                    placeholder={t('calendar.addEvent.descriptionPlaceholder', 'Add event details or notes...')}
                    rows={2}
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="border-border-token hover:border-border-strong focus-within:border-border-strong"
                  />
                </div>

                {/* Holiday Type - only shown for holiday events */}
                {newEvent.type === 'holiday' && (
                  <div>
                    <label className="text-xs font-medium text-fg-muted mb-2 block">{t('calendar.addEvent.holidayTypeLabel', 'Holiday Type')}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['National', 'Regional', 'School'].map((ht) => (
                        <button
                          key={ht}
                          onClick={() => setNewEvent({ ...newEvent, holidayType: ht })}
                          className={`p-2.5 rounded-lg border transition-all text-center text-sm font-medium ${
                            newEvent.holidayType === ht
                              ? 'border-foreground bg-foreground/[0.03] text-foreground'
                              : 'border-border-token hover:border-border-strong bg-background text-fg-muted'
                          }`}
                        >
                          {ht}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recurrence */}
                <div>
                  <label className="text-xs font-medium text-fg-muted mb-2 block">
                    <span className="flex items-center gap-1.5">
                      <Repeat size={12} />
                      {t('calendar.addEvent.recurrenceLabel', 'Recurrence')}
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: '', label: t('calendar.addEvent.noRepeat', 'No Repeat') },
                      { key: 'daily', label: t('calendar.addEvent.daily', 'Daily') },
                      { key: 'weekly', label: t('calendar.addEvent.weekly', 'Weekly') },
                      { key: 'monthly', label: t('calendar.addEvent.monthly', 'Monthly') },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setNewEvent({ ...newEvent, recurrence: key })}
                        className={`p-2.5 rounded-lg border transition-all text-center text-sm font-medium ${
                          newEvent.recurrence === key
                            ? 'border-foreground bg-foreground/[0.03] text-foreground'
                            : 'border-border-token hover:border-border-strong bg-background text-fg-muted'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* All Day Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-border-token">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-fg-faint" />
                    <span className="text-sm text-fg-muted">{t('calendar.addEvent.allDayEvent', 'All Day Event')}</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={newEvent.allDay}
                    aria-label={t('calendar.addEvent.allDayEvent', 'All Day Event')}
                    onClick={() => setNewEvent({ ...newEvent, allDay: !newEvent.allDay })}
                    className={`w-10 h-6 rounded-full transition-colors relative ${
                      newEvent.allDay ? 'bg-foreground' : 'bg-surface-2'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-background absolute top-1 transition-transform shadow-sm ${
                      newEvent.allDay ? 'translate-x-5' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Time Selection */}
                {!newEvent.allDay && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-fg-muted mb-1.5 block">{t('calendar.addEvent.startTime', 'Start Time')}</label>
                      <Input
                        type="time"
                        size="lg"
                        value={newEvent.startTime}
                        onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                        className="border-border-token hover:border-border-strong focus-within:border-border-strong"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-fg-muted mb-1.5 block">{t('calendar.addEvent.endTime', 'End Time')}</label>
                      <Input
                        type="time"
                        size="lg"
                        value={newEvent.endTime}
                        onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                        className="border-border-token hover:border-border-strong focus-within:border-border-strong"
                      />
                    </div>
                  </div>
                )}

                {/* Preview Section */}
                <div>
                  <label className="text-xs font-medium text-fg-muted mb-2 block">{t('calendar.addEvent.preview', 'Preview')}</label>
                  <div className="border border-border-token rounded-lg p-4 bg-surface">
                    {/* Event Preview Card */}
                    <div className="bg-background rounded-lg border border-border-token p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-3 h-3 rounded-full mt-0.5 ${
                          newEvent.type === 'holiday' ? 'bg-danger-token' :
                          newEvent.type === 'exam' ? 'bg-warn' :
                          newEvent.type === 'meeting' ? 'bg-accent' :
                          'bg-accent'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground">
                            {newEvent.title || t('calendar.addEvent.eventTitleFallback', 'Event Title')}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-fg-muted">
                            <CalendarIcon size={12} />
                            <span>
                              {selectedDate ? formatDateShortWeekday(selectedDate) : t('calendar.addEvent.selectDate', 'Select date')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-fg-muted">
                            <Clock size={12} />
                            {newEvent.allDay ? (
                              <span>{t('calendar.addEvent.allDay', 'All Day')}</span>
                            ) : (
                              <span>
                                {newEvent.startTime ? formatTime(newEvent.startTime) : '--:--'}
                                {newEvent.endTime ? ` - ${formatTime(newEvent.endTime)}` : ''}
                              </span>
                            )}
                          </div>
                          <div className="mt-2">
                            <span className="text-2xs px-2 py-0.5 rounded bg-surface-2 text-fg-muted">
                              {types[newEvent.type]?.label || 'Event'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-divider bg-surface">
              <Button variant="ghost" size="sm" onClick={onClose} className="text-fg-muted">
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleAddEvent}
                disabled={!newEvent.title.trim()}
                icon={editingEvent ? <Edit3 size={14} /> : <Plus size={14} />}
              >
                {editingEvent ? t('calendar.editEvent.updateEvent', 'Update Event') : t('calendar.addEvent.createEvent', 'Create Event')}
              </Button>
            </div>
      </div>
    </div>
  );
}
