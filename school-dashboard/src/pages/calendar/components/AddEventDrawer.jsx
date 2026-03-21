import { useState } from "react";
import { Button, Input } from "@heroui/react";
import {
  Plus, Clock, Calendar as CalendarIcon, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from 'react-i18next';
import { formatDateWithWeekday, formatDateShortWeekday } from "../../../utils/dateFormatter";

const eventTypes = {
  holiday: { label: 'Holiday', icon: null },
  exam: { label: 'Exam', icon: null },
  event: { label: 'Event', icon: null },
  meeting: { label: 'Meeting', icon: null },
  appointment: { label: 'Appointment', icon: null },
  class: { label: 'Class', icon: null },
};

export default function AddEventDrawer({ isOpen, onClose, selectedDate, onAddEvent, eventTypesConfig }) {
  const { t } = useTranslation();

  const [newEvent, setNewEvent] = useState({
    title: "", type: "event", startTime: "", endTime: "", allDay: false
  });

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

    await onAddEvent({
      title: newEvent.title,
      date: selectedDate,
      type: newEvent.type,
      startTime: newEvent.allDay ? "" : newEvent.startTime,
      endTime: newEvent.allDay ? "" : newEvent.endTime,
      allDay: newEvent.allDay
    });

    onClose();
    // Reset form
    setNewEvent({ title: "", type: "event", startTime: "", endTime: "", allDay: false });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed right-0 top-0 h-full w-[480px] bg-background border-l border-default-200 z-panel flex flex-col"
        >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-default-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-default-100 flex items-center justify-center">
                  <Plus size={18} className="text-default-600" />
                </div>
                <div>
                  <span className="text-base font-semibold block">{t('calendar.addEvent.title', 'New Event')}</span>
                  {selectedDate && (
                    <span className="text-xs text-default-400">{formatDate(selectedDate)}</span>
                  )}
                </div>
              </div>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={onClose}
                className="text-default-400 hover:text-foreground"
              >
                <X size={18} />
              </Button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="text-xs font-medium text-default-500 mb-1.5 block">{t('calendar.addEvent.eventTitleLabel', 'Event Title')}</label>
                  <Input
                    placeholder={t('calendar.addEvent.eventTitlePlaceholder', 'e.g., Staff Meeting, Annual Day...')}
                    variant="bordered"
                    size="lg"
                    value={newEvent.title}
                    onValueChange={(v) => setNewEvent({ ...newEvent, title: v })}
                    classNames={{
                      inputWrapper: "border-default-200 hover:border-default-400 focus-within:border-default-400",
                      input: "text-sm"
                    }}
                  />
                </div>

                {/* Event Type Selection */}
                <div>
                  <label className="text-xs font-medium text-default-500 mb-2 block">{t('calendar.addEvent.eventTypeLabel', 'Event Type')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(types)
                      .filter(([k]) => k !== 'appointment' && k !== 'class')
                      .map(([key, { label, icon: Icon }]) => (
                        <button
                          key={key}
                          onClick={() => setNewEvent({ ...newEvent, type: key })}
                          className={`flex items-center gap-2.5 p-3 rounded-lg border transition-all text-left ${
                            newEvent.type === key
                              ? 'border-foreground bg-foreground/[0.03]'
                              : 'border-default-200 hover:border-default-300 bg-background'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                            newEvent.type === key ? 'bg-foreground text-background' : 'bg-default-100 text-default-500'
                          }`}>
                            {Icon && <Icon size={14} />}
                          </div>
                          <span className={`text-sm font-medium ${newEvent.type === key ? 'text-foreground' : 'text-default-600'}`}>
                            {label}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>

                {/* All Day Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-default-200">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-default-400" />
                    <span className="text-sm text-default-600">{t('calendar.addEvent.allDayEvent', 'All Day Event')}</span>
                  </div>
                  <button
                    onClick={() => setNewEvent({ ...newEvent, allDay: !newEvent.allDay })}
                    className={`w-10 h-6 rounded-full transition-colors relative ${
                      newEvent.allDay ? 'bg-foreground' : 'bg-default-200'
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
                      <label className="text-xs font-medium text-default-500 mb-1.5 block">{t('calendar.addEvent.startTime', 'Start Time')}</label>
                      <Input
                        type="time"
                        variant="bordered"
                        size="lg"
                        value={newEvent.startTime}
                        onValueChange={(v) => setNewEvent({ ...newEvent, startTime: v })}
                        classNames={{
                          inputWrapper: "border-default-200 hover:border-default-400",
                          input: "text-sm"
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-default-500 mb-1.5 block">{t('calendar.addEvent.endTime', 'End Time')}</label>
                      <Input
                        type="time"
                        variant="bordered"
                        size="lg"
                        value={newEvent.endTime}
                        onValueChange={(v) => setNewEvent({ ...newEvent, endTime: v })}
                        classNames={{
                          inputWrapper: "border-default-200 hover:border-default-400",
                          input: "text-sm"
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Preview Section */}
                <div>
                  <label className="text-xs font-medium text-default-500 mb-2 block">{t('calendar.addEvent.preview', 'Preview')}</label>
                  <div className="border border-default-200 rounded-lg p-4 bg-default-50/50">
                    {/* Event Preview Card */}
                    <div className="bg-background rounded-lg border border-default-200 p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-3 h-3 rounded-full mt-0.5 ${
                          newEvent.type === 'holiday' ? 'bg-danger-400' :
                          newEvent.type === 'exam' ? 'bg-warning-400' :
                          newEvent.type === 'meeting' ? 'bg-secondary-400' :
                          'bg-primary-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground">
                            {newEvent.title || t('calendar.addEvent.eventTitleFallback', 'Event Title')}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-default-500">
                            <CalendarIcon size={12} />
                            <span>
                              {selectedDate ? formatDateShortWeekday(selectedDate) : t('calendar.addEvent.selectDate', 'Select date')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-default-500">
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
                            <span className="text-2xs px-2 py-0.5 rounded bg-default-100 text-default-600">
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
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-default-100 bg-background">
              <Button variant="light" size="sm" onPress={onClose} className="text-default-500">
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                size="sm"
                className="bg-foreground text-background font-medium"
                onPress={handleAddEvent}
                isDisabled={!newEvent.title.trim()}
                startContent={<Plus size={14} />}
              >
                {t('calendar.addEvent.createEvent', 'Create Event')}
              </Button>
            </div>
          </motion.div>
      )}
    </AnimatePresence>
  );
}
