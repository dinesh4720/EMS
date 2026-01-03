import { useState } from "react";
import { Button, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Select, SelectItem, useDisclosure } from "@heroui/react";
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { motion } from "framer-motion";

const eventTypes = {
  holiday: { label: "Holiday", color: "danger" },
  exam: { label: "Exam", color: "warning" },
  event: { label: "Event", color: "primary" },
  meeting: { label: "Meeting", color: "secondary" },
};

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const daysOfWeekFull = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function CalendarPage() {
  const { events, addEvent, deleteEvent } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [view, setView] = useState("month");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newEvent, setNewEvent] = useState({ title: "", type: "event", startTime: "", endTime: "", allDay: false });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const navigate = (direction) => {
    const d = new Date(currentDate);
    if (view === "month") {
      d.setMonth(d.getMonth() + direction);
    } else if (view === "week") {
      d.setDate(d.getDate() + (direction * 7));
    } else {
      d.setDate(d.getDate() + direction);
    }
    setCurrentDate(d);
  };

  const goToToday = () => setCurrentDate(new Date());

  const getWeekDates = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const getHeaderTitle = () => {
    if (view === "month") {
      return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } else if (view === "week") {
      const weekDates = getWeekDates();
      const start = weekDates[0];
      const end = weekDates[6];
      if (start.getMonth() === end.getMonth()) {
        return `${start.toLocaleDateString("en-US", { month: "long" })} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
      }
      return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    } else {
      return currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    }
  };

  const formatDateKey = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const getEventsForDate = (dateKey) => events.filter(e => e.date === dateKey);

  const handleDateClick = (dateKey) => {
    setSelectedDate(dateKey);
    setNewEvent({ title: "", type: "event", startTime: "", endTime: "", allDay: false });
    onOpen();
  };

  const formatTime = (time) => {
    if (!time) return "";
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  const handleAddEvent = () => {
    if (!newEvent.title.trim() || !selectedDate) return;
    addEvent({
      title: newEvent.title,
      date: selectedDate,
      type: newEvent.type,
      startTime: newEvent.allDay ? "" : newEvent.startTime,
      endTime: newEvent.allDay ? "" : newEvent.endTime,
      allDay: newEvent.allDay
    });
    onClose();
  };

  const handleDeleteEvent = (id) => {
    deleteEvent(id);
  };

  const renderCalendarDays = () => {
    const days = [];
    const today = new Date();
    const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());

    // Previous month days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      days.push(
        <div key={`prev-${day}`} className="min-h-[120px] p-2 border-r border-b border-default-100 dark:border-default-50/10 bg-default-50/20 text-default-300">
          <span className="text-sm font-medium">{day}</span>
        </div>
      );
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(year, month, day);
      const dayEvents = getEventsForDate(dateKey);
      const isToday = dateKey === todayKey;

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(dateKey)}
          className={`min-h-[120px] p-2 border-r border-b border-default-100 dark:border-default-50/10 cursor-pointer transition-colors group relative
            bg-background hover:bg-default-50
          `}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`
               text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full transition-all
               ${isToday ? "bg-primary text-white shadow-md shadow-primary/20" : "text-default-700 group-hover:bg-default-200/50"}
            `}>
              {day}
            </span>
          </div>
          <div className="space-y-1.5">
            {dayEvents.slice(0, 3).map(event => (
              <motion.div
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                key={event.id}
                className={`
                    text-[10px] px-1.5 py-1 rounded-md truncate font-medium border border-transparent
                    ${event.type === 'holiday' ? 'bg-danger-50 text-danger-700 border-danger-100' : ''}
                    ${event.type === 'exam' ? 'bg-warning-50 text-warning-700 border-warning-100' : ''}
                    ${event.type === 'event' ? 'bg-primary-50 text-primary-700 border-primary-100' : ''}
                    ${event.type === 'meeting' ? 'bg-secondary-50 text-secondary-700 border-secondary-100' : ''}
                 `}
              >
                {event.title}
              </motion.div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-[10px] font-medium text-default-400 px-1">+{dayEvents.length - 3} more</div>
            )}
          </div>
        </div>
      );
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push(
        <div key={`next-${day}`} className="min-h-[120px] p-2 border-r border-b border-default-100 dark:border-default-50/10 bg-default-50/20 text-default-300">
          <span className="text-sm font-medium">{day}</span>
        </div>
      );
    }

    return days;
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="flex flex-col h-full bg-background min-h-screen -m-3"> {/* Clean Background, Negative Margin to fill container */}
      {/* Sleek Toolbar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-md border-b border-default-200">
        <div className="flex items-center gap-1">
          <Button isIconOnly size="sm" variant="light" className="text-default-500 hover:text-foreground" onPress={() => navigate(-1)}>
            <ChevronLeft size={20} />
          </Button>
          <Button isIconOnly size="sm" variant="light" className="text-default-500 hover:text-foreground" onPress={() => navigate(1)}>
            <ChevronRight size={20} />
          </Button>
          <h2 className="text-lg font-semibold ml-2 min-w-40 tracking-tight text-foreground">
            {getHeaderTitle()}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-default-100 p-1 rounded-lg flex items-center">
            {["Month", "Week", "Day"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v.toLowerCase())}
                className={`
                           px-3 py-1.5 text-xs font-semibold rounded-md transition-all
                           ${view === v.toLowerCase()
                    ? "bg-white dark:bg-zinc-800 text-foreground shadow-sm"
                    : "text-default-500 hover:text-default-700"}
                        `}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-default-300 mx-1"></div>

          <Button
            size="sm"
            variant="ghost"
            className="font-medium text-default-600 border border-default-200 hover:bg-default-100"
            onPress={goToToday}
          >
            Today
          </Button>

          <Button
            size="sm"
            className="bg-primary text-white font-medium shadow-md shadow-primary/20"
            startContent={<Plus size={16} />}
            onPress={() => { setSelectedDate(formatDateKey(year, month, currentDate.getDate())); onOpen(); }}
          >
            Add Event
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Grid */}
        <div className="flex-1 overflow-y-auto">
          {view === "month" && (
            <div className="flex flex-col min-w-[800px]">
              <div className="grid grid-cols-7 border-b border-default-200 sticky top-0 bg-background/95 z-10">
                {daysOfWeek.map(day => (
                  <div key={day} className="py-2 text-center text-xs font-semibold text-default-400 uppercase tracking-wider">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 border-l border-t border-default-100 dark:border-default-50/10">
                {renderCalendarDays()}
              </div>
            </div>
          )}

          {view === "week" && (
            <div className="p-4 grid grid-cols-7 gap-3 min-w-[1000px]">
              {getWeekDates().map((date, i) => {
                const dateKey = formatDateKey(date.getFullYear(), date.getMonth(), date.getDate());
                const dayEvents = getEventsForDate(dateKey);
                const isToday = dateKey === formatDateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

                return (
                  <div key={i} className={`flex flex-col rounded-xl border ${isToday ? 'border-primary/30 bg-primary/5' : 'border-default-200 bg-white dark:bg-zinc-900'} min-h-[500px] hover:shadow-sm transition-shadow`}>
                    <div className="p-3 border-b border-default-100 text-center">
                      <div className={`text-xs font-semibold uppercase ${isToday ? 'text-primary' : 'text-default-400'}`}>{daysOfWeek[i]}</div>
                      <div className={`text-xl font-bold mt-1 ${isToday ? 'text-primary' : 'text-foreground'}`}>{date.getDate()}</div>
                    </div>
                    <div className="flex-1 p-2 space-y-2 cursor-pointer" onClick={() => handleDateClick(dateKey)}>
                      {dayEvents.map(event => (
                        <div key={event.id} className={`p-2 rounded-lg text-xs border ${event.type === 'event' ? 'border-primary-100 bg-primary-50 text-primary-800' : 'border-default-200 bg-white shadow-sm'}`}>
                          <div className="font-semibold">{event.title}</div>
                          {event.startTime && <div className="text-[10px] opacity-70 mt-1 flex items-center gap-1"><Clock size={10} /> {formatTime(event.startTime)}</div>}
                        </div>
                      ))}
                      {dayEvents.length === 0 && (
                        <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="flat" className="h-6 w-6 min-w-0 p-0 rounded-full"><Plus size={14} /></Button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {view === "day" && (
            <div className="flex justify-center p-8">
              <div className="max-w-2xl w-full bg-white dark:bg-zinc-900 rounded-2xl border border-default-200 shadow-sm p-6">
                <div className="flex items-baseline gap-4 border-b border-default-100 pb-6 mb-6">
                  <h1 className="text-4xl font-bold tracking-tight text-foreground">{currentDate.getDate()}</h1>
                  <div className="text-xl text-default-400 font-medium">{daysOfWeekFull[currentDate.getDay()]}</div>
                  <div className="ml-auto text-lg text-default-500 font-medium">{currentDate.toLocaleDateString("en-US", { month: 'long', year: 'numeric' })}</div>
                </div>

                <div className="space-y-4">
                  {getEventsForDate(formatDateKey(year, month, currentDate.getDate())).length === 0 ? (
                    <div className="py-12 text-center flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-default-50 flex items-center justify-center text-default-300">
                        <Calendar size={32} />
                      </div>
                      <p className="text-default-400">No events scheduled regarding this day.</p>
                      <Button size="sm" color="primary" variant="flat" onPress={() => handleDateClick(formatDateKey(year, month, currentDate.getDate()))}>Create Event</Button>
                    </div>
                  ) : (
                    getEventsForDate(formatDateKey(year, month, currentDate.getDate())).map(event => (
                      <div key={event.id} className="flex gap-4 group p-3 rounded-xl hover:bg-default-50 border border-default-100 hover:border-default-200 transition-all">
                        <div className="w-16 flex flex-col items-center pt-1">
                          <span className="text-xs font-semibold text-default-500">
                            {event.allDay ? "ALL DAY" : formatTime(event.startTime)}
                          </span>
                          {event.endTime && <span className="text-[10px] text-default-300 mt-1">{formatTime(event.endTime)}</span>}
                        </div>
                        <div className={`w-1 rounded-full bg-${eventTypes[event.type].color}`}></div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{event.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Chip size="sm" variant="flat" color={eventTypes[event.type].color} className="h-5 text-[10px] rounded-md px-1">{eventTypes[event.type].label}</Chip>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={onClose} size="md" backdrop="blur" classNames={{
        base: "bg-background border border-default-200 rounded-xl shadow-xl",
        header: "border-b border-default-100",
        footer: "border-t border-default-100"
      }}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">
              {selectedDate ? new Date(selectedDate).toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' }) : "New Event"}
            </h2>
          </ModalHeader>
          <ModalBody className="py-6 space-y-4">
            {selectedDateEvents.length > 0 && (
              <div className="space-y-3 pb-4 border-b border-default-100">
                <p className="text-xs font-semibold text-default-400 uppercase tracking-wider">Scheduled Events</p>
                {selectedDateEvents.map(event => (
                  <div key={event.id} className="flex items-center justify-between p-2 rounded-lg bg-default-50 border border-default-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full bg-${eventTypes[event.type].color}`}></div>
                      <div>
                        <div className="text-sm font-medium">{event.title}</div>
                        <div className="text-[11px] text-default-400">{event.allDay ? "All Day" : formatTime(event.startTime)}</div>
                      </div>
                    </div>
                    <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => handleDeleteEvent(event.id)}><Plus size={16} className="rotate-45" /></Button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <p className="text-xs font-semibold text-default-400 uppercase tracking-wider">Create New Event</p>
              <Input
                label="Title"
                placeholder="Review Meeting"
                variant="bordered"
                size="sm"
                labelPlacement="outside"
                value={newEvent.title}
                onValueChange={(v) => setNewEvent({ ...newEvent, title: v })}
                classNames={{ inputWrapper: "border-default-200 hover:border-default-400 focus-within:border-primary" }}
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Type"
                  variant="bordered"
                  size="sm"
                  labelPlacement="outside"
                  selectedKeys={new Set([newEvent.type])}
                  onSelectionChange={(keys) => setNewEvent({ ...newEvent, type: Array.from(keys)[0] })}
                >
                  {Object.entries(eventTypes).map(([key, { label }]) => (
                    <SelectItem key={key}>{label}</SelectItem>
                  ))}
                </Select>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${newEvent.allDay ? 'bg-primary border-primary text-white' : 'border-default-300 bg-transparent'}`}>
                      {newEvent.allDay && <Plus size={14} className="rotate-45" />}
                      <input type="checkbox" className="hidden" checked={newEvent.allDay} onChange={(e) => setNewEvent({ ...newEvent, allDay: e.target.checked })} />
                    </div>
                    <span className="text-sm text-default-600 group-hover:text-default-900">All Day Event</span>
                  </label>
                </div>
              </div>

              {!newEvent.allDay && (
                <div className="grid grid-cols-2 gap-4">
                  <Input type="time" label="From" variant="bordered" size="sm" labelPlacement="outside" value={newEvent.startTime} onValueChange={(v) => setNewEvent({ ...newEvent, startTime: v })} />
                  <Input type="time" label="To" variant="bordered" size="sm" labelPlacement="outside" value={newEvent.endTime} onValueChange={(v) => setNewEvent({ ...newEvent, endTime: v })} />
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose} className="text-default-500 font-medium">Cancel</Button>
            <Button className="bg-primary text-white font-medium shadow-md shadow-primary/20" onPress={handleAddEvent} isDisabled={!newEvent.title.trim()}>Save Event</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
