import { useState } from "react";
import { Button, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Select, SelectItem, useDisclosure, ButtonGroup } from "@heroui/react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useApp } from "../../context/AppContext";

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
        <div key={`prev-${day}`} className="p-2 flex-1 min-h-28 text-default-300">
          <span className="text-sm">{day}</span>
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
          className={`p-2 flex-1 min-h-28 cursor-pointer hover:bg-default-100/50 transition-colors rounded ${isToday ? "bg-primary/5" : ""}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? "bg-primary text-white" : ""}`}>
              {day}
            </span>
            {dayEvents.length > 0 && <span className="text-xs text-default-400">{dayEvents.length}</span>}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map(event => (
              <div key={event.id} className={`text-xs px-1.5 py-0.5 rounded truncate bg-${eventTypes[event.type].color}/10 text-${eventTypes[event.type].color}`}>
                {event.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-default-400 px-1">+{dayEvents.length - 3} more</div>
            )}
          </div>
        </div>
      );
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push(
        <div key={`next-${day}`} className="p-2 flex-1 min-h-28 text-default-300">
          <span className="text-sm">{day}</span>
        </div>
      );
    }

    return days;
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)] -m-6">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Button isIconOnly size="sm" variant="light" onPress={() => navigate(-1)}><ChevronLeft size={18} /></Button>
            <h2 className="text-xl font-semibold min-w-64 text-center">
              {getHeaderTitle()}
            </h2>
            <Button isIconOnly size="sm" variant="light" onPress={() => navigate(1)}><ChevronRight size={18} /></Button>
          </div>
          <div className="flex items-center gap-3">
            <ButtonGroup size="sm" variant="flat">
              <Button color={view === "month" ? "primary" : "default"} onPress={() => setView("month")}>Month</Button>
              <Button color={view === "week" ? "primary" : "default"} onPress={() => setView("week")}>Week</Button>
              <Button color={view === "day" ? "primary" : "default"} onPress={() => setView("day")}>Day</Button>
            </ButtonGroup>
            <Button size="sm" variant="flat" onPress={goToToday}>Today</Button>
            <Button size="sm" color="primary" startContent={<Plus size={16} />} onPress={() => { setSelectedDate(formatDateKey(year, month, currentDate.getDate())); onOpen(); }}>
              Add Event
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 flex flex-col px-6 pb-6 overflow-auto">
          {view === "month" && (
            <>
              <div className="grid grid-cols-7">
                {daysOfWeek.map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-default-500">{day}</div>
                ))}
              </div>
              <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-1">
                {renderCalendarDays()}
              </div>
            </>
          )}

          {view === "week" && (
            <>
              <div className="grid grid-cols-7 gap-1">
                {getWeekDates().map((date, i) => {
                  const dateKey = formatDateKey(date.getFullYear(), date.getMonth(), date.getDate());
                  const isToday = dateKey === formatDateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
                  return (
                    <div key={i} className={`p-2 text-center ${isToday ? "bg-primary/10 rounded-t" : ""}`}>
                      <div className="text-sm font-medium text-default-500">{daysOfWeek[i]}</div>
                      <div className={`text-lg font-semibold ${isToday ? "text-primary" : ""}`}>{date.getDate()}</div>
                    </div>
                  );
                })}
              </div>
              <div className="flex-1 grid grid-cols-7 gap-1">
                {getWeekDates().map((date, i) => {
                  const dateKey = formatDateKey(date.getFullYear(), date.getMonth(), date.getDate());
                  const dayEvents = getEventsForDate(dateKey);
                  const isToday = dateKey === formatDateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
                  return (
                    <div
                      key={i}
                      onClick={() => handleDateClick(dateKey)}
                      className={`p-2 min-h-[400px] cursor-pointer hover:bg-default-100/50 transition-colors rounded-b ${isToday ? "bg-primary/5" : ""}`}
                    >
                      <div className="space-y-1">
                        {dayEvents.map(event => (
                          <div key={event.id} className={`text-xs px-2 py-1 rounded bg-${eventTypes[event.type].color}/10 text-${eventTypes[event.type].color}`}>
                            {!event.allDay && event.startTime && <span className="font-medium">{formatTime(event.startTime)} </span>}
                            {event.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {view === "day" && (
            <div className="flex-1">
              <div className="text-center mb-4">
                <div className="text-default-500">{daysOfWeekFull[currentDate.getDay()]}</div>
                <div className="text-4xl font-bold">{currentDate.getDate()}</div>
              </div>
              <div
                onClick={() => handleDateClick(formatDateKey(year, month, currentDate.getDate()))}
                className="min-h-[400px] p-4 rounded hover:bg-default-100/50 cursor-pointer transition-colors"
              >
                {getEventsForDate(formatDateKey(year, month, currentDate.getDate())).length === 0 ? (
                  <div className="text-center text-default-400 py-8">No events scheduled. Click to add one.</div>
                ) : (
                  <div className="space-y-2">
                    {getEventsForDate(formatDateKey(year, month, currentDate.getDate())).map(event => (
                      <div key={event.id} className={`p-3 rounded bg-${eventTypes[event.type].color}/10 border-l-4 border-${eventTypes[event.type].color}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{event.title}</span>
                            <div className="text-xs text-default-500 mt-0.5">
                              {event.allDay ? "All day" : event.startTime ? `${formatTime(event.startTime)}${event.endTime ? ` - ${formatTime(event.endTime)}` : ""}` : "All day"}
                            </div>
                          </div>
                          <Chip size="sm" color={eventTypes[event.type].color} variant="flat">{eventTypes[event.type].label}</Chip>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalContent>
          <ModalHeader>{selectedDate}</ModalHeader>
          <ModalBody>
            {selectedDateEvents.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Events on this day:</p>
                <div className="space-y-2">
                  {selectedDateEvents.map(event => (
                    <div key={event.id} className="flex items-center justify-between p-3 bg-default-50 rounded border border-default-100">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Chip size="sm" color={eventTypes[event.type].color} variant="dot" classNames={{ base: "border-1 border-default-200 pl-2" }}>{eventTypes[event.type].label}</Chip>
                          <span className="text-sm font-medium text-default-700">{event.title}</span>
                        </div>
                        <span className="text-xs text-default-400">
                          {event.allDay ? "All day" : event.startTime ? `${formatTime(event.startTime)}${event.endTime ? ` - ${formatTime(event.endTime)}` : ""}` : "All day"}
                        </span>
                      </div>
                      <Button size="sm" color="danger" variant="light" isIconOnly onPress={() => handleDeleteEvent(event.id)}><ChevronRight size={16} className="rotate-45" /></Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-3">
              <p className="text-sm font-medium">Add new event:</p>
              <Input size="sm" label="Event Title" placeholder="Enter event title" value={newEvent.title} onValueChange={(v) => setNewEvent({ ...newEvent, title: v })} />
              <Select size="sm" label="Event Type" selectedKeys={new Set([newEvent.type])} onSelectionChange={(keys) => setNewEvent({ ...newEvent, type: Array.from(keys)[0] })} aria-label="Event Type">
                {Object.entries(eventTypes).map(([key, { label }]) => (
                  <SelectItem key={key} textValue={label}>{label}</SelectItem>
                ))}
              </Select>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={newEvent.allDay}
                  onChange={(e) => setNewEvent({ ...newEvent, allDay: e.target.checked })}
                  className="w-4 h-4 rounded border-default-300"
                />
                <label htmlFor="allDay" className="text-sm">All day event</label>
              </div>
              {!newEvent.allDay && (
                <div className="grid grid-cols-2 gap-3">
                  <Input size="sm" type="time" label="Start Time" value={newEvent.startTime} onValueChange={(v) => setNewEvent({ ...newEvent, startTime: v })} />
                  <Input size="sm" type="time" label="End Time" value={newEvent.endTime} onValueChange={(v) => setNewEvent({ ...newEvent, endTime: v })} />
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>Cancel</Button>
            <Button color="primary" onPress={handleAddEvent} isDisabled={!newEvent.title.trim()}>Add Event</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
