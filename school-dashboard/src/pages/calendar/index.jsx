import { useState, useEffect, useMemo } from "react";
import {
  Button, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, Select, SelectItem, useDisclosure, ScrollShadow, Avatar, Tooltip,
  Divider, Spinner, Badge, Popover, PopoverTrigger, PopoverContent
} from "@heroui/react";
import {
  ChevronLeft, ChevronRight, Plus, Clock, Users, Calendar as CalendarIcon,
  User, BookOpen, MapPin, X, ChevronDown, Filter, LayoutGrid, List,
  Phone, FileText, CheckCircle2, AlertCircle, Trash2, Edit3, ChevronsLeft, ChevronsRight
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { frontDeskApi, teacherTimetableApi } from "../../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { getDateLocale } from '../../i18n/index';
import { useTranslation } from 'react-i18next';


const eventTypes = {
  holiday: { label: "Holiday", icon: AlertCircle },
  exam: { label: "Exam", icon: FileText },
  event: { label: "Event", icon: CalendarIcon },
  meeting: { label: "Meeting", icon: Users },
  appointment: { label: "Appointment", icon: User },
  class: { label: "Class", icon: BookOpen },
};

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const daysOfWeekFull = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const daysOfWeekForTimetable = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const defaultPeriods = [
  { name: "Period 1", startTime: "09:00", endTime: "09:45", isBreak: false },
  { name: "Period 2", startTime: "09:45", endTime: "10:30", isBreak: false },
  { name: "Break", startTime: "10:30", endTime: "10:45", isBreak: true },
  { name: "Period 3", startTime: "10:45", endTime: "11:30", isBreak: false },
  { name: "Period 4", startTime: "11:30", endTime: "12:15", isBreak: false },
  { name: "Lunch", startTime: "12:15", endTime: "12:45", isBreak: true },
  { name: "Period 5", startTime: "12:45", endTime: "13:30", isBreak: false },
  { name: "Period 6", startTime: "13:30", endTime: "14:15", isBreak: false },
  { name: "Period 7", startTime: "14:15", endTime: "15:00", isBreak: false },
];

export default function CalendarPage() {
  const { t } = useTranslation();
  const { events, addEvent, updateEvent, deleteEvent, staff, classesWithTeachers, schoolSettings } = useApp();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [view, setView] = useState("month");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerView, setPickerView] = useState("month"); // "month" or "year"

  // Staff sidebar state
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffAppointments, setStaffAppointments] = useState([]);
  const [staffTimetable, setStaffTimetable] = useState(null);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [loadingTimetable, setLoadingTimetable] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  // Event detail modal
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Add/Edit event drawer
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const [editingEvent, setEditingEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: "", type: "event", startTime: "", endTime: "", allDay: false
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Filter staff - only teachers
  const teachers = useMemo(() =>
    Array.isArray(staff) ? staff.filter(s => {
      if (s.status !== "active") return false;
      const role = s.role;
      const roleStr = Array.isArray(role)
        ? role.join(' ').toLowerCase()
        : typeof role === 'string' ? role.toLowerCase() : '';
      return (
        roleStr.includes("teacher") ||
        roleStr.includes("faculty") ||
        (Array.isArray(s.subjects) && s.subjects.length > 0)
      );
    }) : [],
    [staff]
  );

  // Load staff data when selection changes
  useEffect(() => {
    if (selectedStaff) {
      loadStaffAppointments(selectedStaff.name);
      loadStaffTimetable(selectedStaff.id);
    } else {
      setStaffAppointments([]);
      setStaffTimetable(null);
    }
  }, [selectedStaff]);

  const loadStaffAppointments = async (staffName) => {
    if (!staffName) return;
    setLoadingAppointments(true);
    try {
      const response = await frontDeskApi.getAppointments();
      const filtered = (Array.isArray(response) ? response : []).filter(
        apt => apt.meetingWith === staffName && apt.status !== 'cancelled'
      );
      setStaffAppointments(filtered);
    } catch (error) {
      console.error('Failed to load appointments:', error);
      setStaffAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const loadStaffTimetable = async (teacherId) => {
    if (!teacherId) return;
    setLoadingTimetable(true);
    try {
      const response = await teacherTimetableApi.get(teacherId, schoolSettings?.academicYear);
      if (response.success) {
        setStaffTimetable(response.timetable);
      } else {
        setStaffTimetable(null);
      }
    } catch (error) {
      console.error('Failed to load timetable:', error);
      setStaffTimetable(null);
    } finally {
      setLoadingTimetable(false);
    }
  };

  const navigate = (direction) => {
    const d = new Date(currentDate);
    if (view === "month" || view === "schedule") {
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
    if (view === "month" || view === "schedule") {
      return currentDate.toLocaleDateString(getDateLocale(), { month: "long", year: "numeric" });
    } else if (view === "week") {
      const weekDates = getWeekDates();
      const start = weekDates[0];
      const end = weekDates[6];
      if (start.getMonth() === end.getMonth()) {
        return `${start.toLocaleDateString(getDateLocale(), { month: "long" })} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
      }
      return `${start.toLocaleDateString(getDateLocale(), { month: "short", day: "numeric" })} - ${end.toLocaleDateString(getDateLocale(), { month: "short", day: "numeric", year: "numeric" })}`;
    } else {
      return currentDate.toLocaleDateString(getDateLocale(), { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    }
  };

  const formatDateKey = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  // Get all appointments as events
  const allAppointmentEvents = useMemo(() => {
    return staffAppointments.map(apt => {
      const aptDate = apt.fromDateTime?.split('T')[0];
      return {
        id: `apt-${apt._id}`,
        title: apt.visitorName,
        type: 'appointment',
        date: aptDate,
        startTime: apt.fromDateTime?.split('T')[1]?.slice(0, 5) || '',
        endTime: apt.toDateTime?.split('T')[1]?.slice(0, 5) || '',
        rawAppointment: apt,
        visitorName: apt.visitorName,
        purpose: apt.purpose,
        status: apt.status,
        phone: apt.phoneNumber,
        notes: apt.notes,
        meetingWith: apt.meetingWith
      };
    });
  }, [staffAppointments]);

  const getEventsForDate = (dateKey) => {
    const baseEvents = events.filter(e => e.date === dateKey);
    if (selectedStaff) {
      const appointmentEvents = allAppointmentEvents.filter(e => e.date === dateKey);
      return [...baseEvents, ...appointmentEvents];
    }
    return baseEvents;
  };

  // Get timetable classes for a specific date
  const getTimetableForDate = (dateKey) => {
    if (!selectedStaff || !staffTimetable?.schedule) return [];
    const date = new Date(dateKey + 'T00:00:00');
    const dayName = daysOfWeekFull[date.getDay()];
    const daySchedule = staffTimetable.schedule[dayName] || [];
    return daySchedule
      .filter(slot => slot.classId && slot.subject)
      .map((slot, idx) => ({
        id: `tt-${dateKey}-${idx}`,
        title: `${slot.subject}`,
        type: 'class',
        date: dateKey,
        classId: slot.classId,
        subject: slot.subject,
        periodIndex: idx,
        rawSlot: slot
      }));
  };

  // Handle event click - show detail modal
  const handleEventClick = (e, event) => {
    e.stopPropagation();
    setSelectedEvent(event);
    onDetailOpen();
  };

  // Handle date click for adding events
  const handleDateClick = (dateKey) => {
    setSelectedDate(dateKey);
    setEditingEvent(null);
    setNewEvent({ title: "", type: "event", startTime: "", endTime: "", allDay: false });
    onAddOpen();
  };

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
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString(getDateLocale(), { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const handleAddEvent = async () => {
    if (!newEvent.title.trim() || !selectedDate) return;

    const eventData = {
      title: newEvent.title,
      date: selectedDate,
      type: newEvent.type,
      startTime: newEvent.allDay ? "" : newEvent.startTime,
      endTime: newEvent.allDay ? "" : newEvent.endTime,
      allDay: newEvent.allDay
    };

    if (editingEvent) {
      await updateEvent(editingEvent.id, eventData);
    } else {
      await addEvent(eventData);
    }

    onAddClose();
    setEditingEvent(null);
    setNewEvent({ title: "", type: "event", startTime: "", endTime: "", allDay: false });
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setSelectedDate(event.date);
    setNewEvent({
      title: event.title || "",
      type: event.type || "event",
      startTime: event.startTime || "",
      endTime: event.endTime || "",
      allDay: event.allDay || false,
    });
    onDetailClose();
    setSelectedEvent(null);
    onAddOpen();
  };

  const handleDeleteEvent = (id) => {
    deleteEvent(id);
    onDetailClose();
    setSelectedEvent(null);
  };

  const getClassName = (classId) => {
    if (!classId) return "";
    const classData = classesWithTeachers.find(c =>
      String(c.id) === String(classId) || String(c._id) === String(classId)
    );
    return classData ? `${classData.name}-${classData.section}` : "";
  };

  // Get schedule view data - all events for the month grouped by date
  const scheduleViewData = useMemo(() => {
    const data = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(year, month, day);
      const date = new Date(dateKey + 'T00:00:00');
      const dayEvents = getEventsForDate(dateKey);
      const timetableClasses = getTimetableForDate(dateKey);
      const isToday = dateKey === formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
      const isPast = date < today && !isToday;

      if (dayEvents.length > 0 || timetableClasses.length > 0) {
        data.push({
          dateKey,
          date,
          day,
          dayName: daysOfWeekFull[date.getDay()],
          dayNameShort: daysOfWeek[date.getDay()],
          isToday,
          isPast,
          events: [...timetableClasses, ...dayEvents].sort((a, b) => {
            if (!a.startTime) return 1;
            if (!b.startTime) return -1;
            return a.startTime.localeCompare(b.startTime);
          })
        });
      }
    }
    return data;
  }, [year, month, events, staffAppointments, staffTimetable, selectedStaff]);

  const renderCalendarDays = () => {
    const days = [];
    const today = new Date();
    const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());

    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      days.push(
        <div key={`prev-${day}`} className="min-h-[100px] p-2 border-r border-b border-default-100 bg-default-50/40">
          <span className="text-xs font-medium text-default-300">{day}</span>
        </div>
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(year, month, day);
      const dayEvents = getEventsForDate(dateKey);
      const timetableClasses = getTimetableForDate(dateKey);
      const isToday = dateKey === todayKey;
      const isSelectedStaffDay = selectedStaff && timetableClasses.length > 0;

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(dateKey)}
          className={`min-h-[100px] p-2 border-r border-b border-default-100 cursor-pointer transition-all group relative
            ${isToday ? 'bg-primary-50/50' : 'bg-background'}
            ${isSelectedStaffDay ? 'bg-secondary-50/50' : ''}
            hover:bg-default-50
          `}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className={`
              text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full transition-all
              ${isToday ? "bg-foreground text-background" : "text-default-700 group-hover:bg-default-100"}
            `}>
              {day}
            </span>
            {isSelectedStaffDay && (
              <Tooltip content={`${timetableClasses.length} classes`}>
                <span className="text-[10px] px-1.5 py-0.5 bg-default-100 rounded text-default-500">
                  {timetableClasses.length}
                </span>
              </Tooltip>
            )}
          </div>
          <div className="space-y-1">
            {selectedStaff && timetableClasses.slice(0, 2).map((cls) => (
              <div
                key={cls.id}
                onClick={(e) => handleEventClick(e, cls)}
                className="text-[10px] px-1.5 py-0.5 rounded border border-default-200 bg-default-50 text-default-600 truncate cursor-pointer hover:bg-default-100"
              >
                {cls.subject} <span className="text-default-400">({getClassName(cls.classId)})</span>
              </div>
            ))}
            {dayEvents.slice(0, selectedStaff ? 2 : 3).map(event => (
              <div
                key={event.id}
                onClick={(e) => handleEventClick(e, event)}
                className={`
                  text-[10px] px-1.5 py-0.5 rounded truncate font-medium border cursor-pointer hover:opacity-80
                  ${event.type === 'holiday' ? 'bg-danger-50/50 text-danger-700 border-danger-100' : ''}
                  ${event.type === 'exam' ? 'bg-warning-50/50 text-warning-700 border-warning-100' : ''}
                  ${event.type === 'event' ? 'bg-primary-50/50 text-primary-700 border-primary-100' : ''}
                  ${event.type === 'meeting' ? 'bg-secondary-50/50 text-secondary-700 border-secondary-100' : ''}
                  ${event.type === 'appointment' ? 'bg-success-50/50 text-success-700 border-success-100' : ''}
                `}
              >
                {event.title}
              </div>
            ))}
            {(dayEvents.length + timetableClasses.length) > (selectedStaff ? 4 : 3) && (
              <div className="text-[10px] font-medium text-default-400 px-1">
                +{dayEvents.length + timetableClasses.length - (selectedStaff ? 4 : 3)} more
              </div>
            )}
          </div>
        </div>
      );
    }

    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push(
        <div key={`next-${day}`} className="min-h-[100px] p-2 border-r border-b border-default-100 bg-default-50/40">
          <span className="text-xs font-medium text-default-300">{day}</span>
        </div>
      );
    }

    return days;
  };

  // Render schedule view (vertical agenda)
  const renderScheduleView = () => {
    const today = formatDateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

    return (
      <div className="p-4 space-y-1">
        {scheduleViewData.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon size={32} className="mx-auto text-default-300 mb-3" />
            {!selectedStaff ? (
              <>
                <p className="text-default-500 font-medium">{t('pages.selectAStaffMember')}</p>
                <p className="text-default-400 text-sm mt-1">{t('pages.chooseAStaffFromTheSidebarToViewTheirScheduleAndAppointments')}</p>
              </>
            ) : (
              <>
                <p className="text-default-400">{t('pages.noEventsScheduledThisMonth')}</p>
                <Button size="sm" variant="flat" className="mt-3" onPress={() => { setEditingEvent(null); setNewEvent({ title: "", type: "event", startTime: "", endTime: "", allDay: false }); onAddOpen(); }}>
                  Add Event
                </Button>
              </>
            )}
          </div>
        ) : (
          scheduleViewData.map((dayData) => (
            <div key={dayData.dateKey} className={`flex border border-default-200 rounded-lg overflow-hidden ${dayData.isToday ? 'bg-foreground/[0.02] border-foreground/20' : 'bg-background'}`}>
              {/* Date column */}
              <div className={`w-16 flex-shrink-0 flex flex-col items-center justify-center py-3 border-r border-default-200 ${dayData.isToday ? 'bg-foreground/[0.03]' : 'bg-default-50'}`}>
                <span className="text-[10px] font-semibold uppercase text-default-400">{dayData.dayNameShort}</span>
                <span className={`text-xl font-bold ${dayData.isToday ? 'text-foreground' : 'text-foreground'}`}>{dayData.day}</span>
                {dayData.isToday && (
                  <span className="text-[9px] font-medium text-foreground mt-0.5">{t('pages.tODAY')}</span>
                )}
              </div>

              {/* Events column */}
              <div className="flex-1 p-2 space-y-1">
                {dayData.events.map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => handleEventClick(e, event)}
                    className="flex items-center gap-3 p-2 rounded-lg border border-default-200 bg-background hover:bg-default-50 cursor-pointer transition-colors"
                  >
                    {/* Time */}
                    <div className="w-14 flex-shrink-0 text-right">
                      {event.startTime ? (
                        <>
                          <span className="text-xs font-medium text-foreground">{formatTime(event.startTime)}</span>
                          {event.endTime && (
                            <span className="text-[10px] text-default-400 block">{formatTime(event.endTime)}</span>
                          )}
                        </>
                      ) : (
                        <span className="text-[10px] text-default-400 uppercase">{t('pages.allDay1')}</span>
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
                        <Chip size="sm" variant="flat" className="h-4 text-[9px]">
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
  };

  // Today's schedule for sidebar
  const todaySchedule = useMemo(() => {
    if (!selectedStaff || !staffTimetable?.schedule) return [];
    const today = daysOfWeekFull[new Date().getDay()];
    return staffTimetable.schedule[today] || [];
  }, [selectedStaff, staffTimetable]);

  // Upcoming appointments for sidebar
  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return staffAppointments
      .filter(apt => new Date(apt.fromDateTime) >= now)
      .sort((a, b) => new Date(a.fromDateTime) - new Date(b.fromDateTime))
      .slice(0, 5);
  }, [staffAppointments]);

  // Render event detail in modal
  const renderEventDetail = () => {
    if (!selectedEvent) return null;

    const eventType = selectedEvent.type;
    const Icon = eventTypes[eventType]?.icon || CalendarIcon;

    return (
      <div className="space-y-4">
        {/* Header with type */}
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            eventType === 'appointment' ? 'bg-success-100/500 text-success-700' :
            eventType === 'class' ? 'bg-default-100 text-default-700' :
            eventType === 'meeting' ? 'bg-secondary-100 text-secondary-700' :
            eventType === 'exam' ? 'bg-warning-100 text-warning-700' :
            eventType === 'holiday' ? 'bg-danger-100 text-danger-700' :
            'bg-primary-100 text-primary-700'
          }`}>
            <Icon size={16} />
          </div>
          <div>
            <Chip size="sm" variant="flat">
              {eventTypes[eventType]?.label || eventType}
            </Chip>
          </div>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-lg font-semibold text-foreground">{selectedEvent.title}</h3>
          <p className="text-sm text-default-500 mt-1">{formatDate(selectedEvent.date)}</p>
        </div>

        {/* Time */}
        {(selectedEvent.startTime || selectedEvent.allDay) && (
          <div className="flex items-center gap-2 text-sm text-default-600">
            <Clock size={14} className="text-default-400" />
            {selectedEvent.allDay ? (
              <span>{t('pages.allDay2')}</span>
            ) : (
              <span>
                {formatTime(selectedEvent.startTime)}
                {selectedEvent.endTime && ` - ${formatTime(selectedEvent.endTime)}`}
              </span>
            )}
          </div>
        )}

        <Divider />

        {/* Type-specific details */}
        {eventType === 'appointment' && selectedEvent.rawAppointment && (
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <User size={14} className="text-default-400 mt-0.5" />
              <div>
                <span className="text-xs text-default-400 block">{t('pages.visitor1')}</span>
                <span className="text-sm font-medium">{selectedEvent.visitorName}</span>
              </div>
            </div>

            {selectedEvent.phone && (
              <div className="flex items-start gap-2">
                <Phone size={14} className="text-default-400 mt-0.5" />
                <div>
                  <span className="text-xs text-default-400 block">{t('pages.phone1')}</span>
                  <span className="text-sm">{selectedEvent.phone}</span>
                </div>
              </div>
            )}

            {selectedEvent.purpose && (
              <div className="flex items-start gap-2">
                <FileText size={14} className="text-default-400 mt-0.5" />
                <div>
                  <span className="text-xs text-default-400 block">{t('pages.purpose1')}</span>
                  <span className="text-sm">{selectedEvent.purpose}</span>
                </div>
              </div>
            )}

            {selectedEvent.meetingWith && (
              <div className="flex items-start gap-2">
                <Users size={14} className="text-default-400 mt-0.5" />
                <div>
                  <span className="text-xs text-default-400 block">{t('pages.meetingWith1')}</span>
                  <span className="text-sm">{selectedEvent.meetingWith}</span>
                </div>
              </div>
            )}

            {selectedEvent.status && (
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-default-400 mt-0.5" />
                <div>
                  <span className="text-xs text-default-400 block">{t('pages.status2')}</span>
                  <Chip size="sm" variant="flat" color={
                    selectedEvent.status === 'completed' ? 'success' :
                    selectedEvent.status === 'cancelled' ? 'danger' : 'primary'
                  }>
                    {selectedEvent.status}
                  </Chip>
                </div>
              </div>
            )}

            {selectedEvent.notes && (
              <div className="p-3 bg-default-50 rounded-lg">
                <span className="text-xs text-default-400 block mb-1">{t('pages.notes1')}</span>
                <span className="text-sm">{selectedEvent.notes}</span>
              </div>
            )}
          </div>
        )}

        {eventType === 'class' && (
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <BookOpen size={14} className="text-default-400 mt-0.5" />
              <div>
                <span className="text-xs text-default-400 block">{t('pages.subject2')}</span>
                <span className="text-sm font-medium">{selectedEvent.subject}</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-default-400 mt-0.5" />
              <div>
                <span className="text-xs text-default-400 block">{t('pages.class1')}</span>
                <span className="text-sm font-medium">{getClassName(selectedEvent.classId)}</span>
              </div>
            </div>

            {selectedEvent.periodIndex !== undefined && defaultPeriods[selectedEvent.periodIndex] && (
              <div className="flex items-start gap-2">
                <Clock size={14} className="text-default-400 mt-0.5" />
                <div>
                  <span className="text-xs text-default-400 block">{t('pages.period2')}</span>
                  <span className="text-sm">{defaultPeriods[selectedEvent.periodIndex].name} ({defaultPeriods[selectedEvent.periodIndex].startTime} - {defaultPeriods[selectedEvent.periodIndex].endTime})</span>
                </div>
              </div>
            )}

            {selectedStaff && (
              <div className="flex items-start gap-2">
                <User size={14} className="text-default-400 mt-0.5" />
                <div>
                  <span className="text-xs text-default-400 block">{t('pages.teacher2')}</span>
                  <span className="text-sm">{selectedStaff.name}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {eventType === 'meeting' && (
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Users size={14} className="text-default-400 mt-0.5" />
              <div>
                <span className="text-xs text-default-400 block">{t('pages.meeting1')}</span>
                <span className="text-sm">{selectedEvent.title}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  const handleMonthSelect = (monthIndex) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(monthIndex);
    setCurrentDate(newDate);
    setShowDatePicker(false);
    setPickerView("month");
  };

  const handleYearSelect = (year) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(year);
    setCurrentDate(newDate);
    setPickerView("month");
  };

  return (
    <div className="flex h-full bg-background min-h-screen -m-3">
      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-background/95 backdrop-blur-sm border-b border-default-100">
          <div className="flex items-center gap-2">
            {/* Quick year navigation */}
            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="text-default-400 hover:bg-default-100"
              onPress={() => {
                const newDate = new Date(currentDate);
                newDate.setFullYear(newDate.getFullYear() - 1);
                setCurrentDate(newDate);
              }}
            >
              <ChevronsLeft size={16} />
            </Button>
            <Button isIconOnly size="sm" variant="light" className="text-default-500 hover:bg-default-100" onPress={() => navigate(-1)}>
              <ChevronLeft size={18} />
            </Button>
            <Button isIconOnly size="sm" variant="light" className="text-default-500 hover:bg-default-100" onPress={() => navigate(1)}>
              <ChevronRight size={18} />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="text-default-400 hover:bg-default-100"
              onPress={() => {
                const newDate = new Date(currentDate);
                newDate.setFullYear(newDate.getFullYear() + 1);
                setCurrentDate(newDate);
              }}
            >
              <ChevronsRight size={16} />
            </Button>

            {/* Date Picker Popover */}
            <Popover
              isOpen={showDatePicker}
              onOpenChange={setShowDatePicker}
              placement="bottom"
              classNames={{
                content: "p-0 bg-background border border-default-200 rounded-xl shadow-lg"
              }}
            >
              <PopoverTrigger>
                <button className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-default-100 transition-colors">
                  <h2 className="text-base font-semibold tracking-tight text-foreground">
                    {getHeaderTitle()}
                  </h2>
                  <ChevronDown size={14} className="text-default-400" />
                </button>
              </PopoverTrigger>
              <PopoverContent>
                <div className="w-72">
                  {/* Picker Header */}
                  <div className="flex items-center justify-between p-3 border-b border-default-100">
                    <button
                      onClick={() => setPickerView("year")}
                      className="flex items-center gap-1 text-sm font-semibold hover:text-default-600 transition-colors"
                    >
                      {year}
                      <ChevronDown size={14} />
                    </button>
                    <Button
                      size="sm"
                      variant="light"
                      className="text-xs h-7"
                      onPress={() => {
                        setCurrentDate(new Date());
                        setShowDatePicker(false);
                      }}
                    >
                      Today
                    </Button>
                  </div>

                  {/* Month Picker */}
                  {pickerView === "month" && (
                    <div className="p-2 grid grid-cols-3 gap-1">
                      {months.map((m, idx) => (
                        <button
                          key={m}
                          onClick={() => handleMonthSelect(idx)}
                          className={`
                            px-2 py-2 text-xs font-medium rounded-lg transition-colors
                            ${idx === month
                              ? "bg-foreground text-background"
                              : "text-default-600 hover:bg-default-100"
                            }
                          `}
                        >
                          {m.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Year Picker */}
                  {pickerView === "year" && (
                    <div className="p-2">
                      <div className="max-h-48 overflow-y-auto grid grid-cols-4 gap-1">
                        {years.map((y) => (
                          <button
                            key={y}
                            onClick={() => handleYearSelect(y)}
                            className={`
                              px-2 py-2 text-xs font-medium rounded-lg transition-colors
                              ${y === year
                                ? "bg-foreground text-background"
                                : "text-default-600 hover:bg-default-100"
                              }
                            `}
                          >
                            {y}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher */}
            <div className="bg-default-50 p-0.5 rounded-lg flex items-center border border-default-100">
              <button
                onClick={() => setView("month")}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${view === "month" ? "bg-background text-foreground shadow-sm" : "text-default-400 hover:text-default-600"}`}
              >
                <LayoutGrid size={12} />
                <span className="hidden sm:inline">{t('pages.month1')}</span>
              </button>
              <button
                onClick={() => setView("week")}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${view === "week" ? "bg-background text-foreground shadow-sm" : "text-default-400 hover:text-default-600"}`}
              >
                Week
              </button>
              <button
                onClick={() => setView("day")}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${view === "day" ? "bg-background text-foreground shadow-sm" : "text-default-400 hover:text-default-600"}`}
              >
                Day
              </button>
              <button
                onClick={() => setView("schedule")}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${view === "schedule" ? "bg-background text-foreground shadow-sm" : "text-default-400 hover:text-default-600"}`}
              >
                <List size={12} />
                <span>{t('pages.schedule1')}</span>
              </button>
            </div>

            <Button size="sm" variant="bordered" className="font-medium text-default-600 border-default-200" onPress={goToToday}>
              Today
            </Button>

            <Button size="sm" className="bg-foreground text-background font-medium" startContent={<Plus size={14} />} onPress={() => { setSelectedDate(formatDateKey(year, month, currentDate.getDate())); setEditingEvent(null); setNewEvent({ title: "", type: "event", startTime: "", endTime: "", allDay: false }); onAddOpen(); }}>
              Add Event
            </Button>
          </div>
        </div>

        {/* Calendar Content */}
        <div className="flex-1 overflow-auto">
          {/* Month View */}
          {view === "month" && (
            <div className="min-w-[700px]">
              <div className="grid grid-cols-7 border-b border-default-100 sticky top-0 bg-background/95 z-10">
                {daysOfWeek.map(day => (
                  <div key={day} className="py-2 text-center text-[10px] font-semibold text-default-400 uppercase tracking-wider border-r border-default-50 last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 border-l border-t border-default-100">
                {renderCalendarDays()}
              </div>
            </div>
          )}

          {/* Week View */}
          {view === "week" && (
            <div className="p-4 grid grid-cols-7 gap-2 min-w-[900px]">
              {getWeekDates().map((date, i) => {
                const dateKey = formatDateKey(date.getFullYear(), date.getMonth(), date.getDate());
                const dayEvents = getEventsForDate(dateKey);
                const timetableClasses = getTimetableForDate(dateKey);
                const isToday = dateKey === formatDateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

                return (
                  <div key={`day-${dateKey}`} className={`flex flex-col rounded-lg border ${isToday ? 'border-foreground/20 bg-foreground/[0.02]' : 'border-default-200 bg-background'} min-h-[400px] hover:border-default-300 transition-colors`}>
                    <div className={`p-2 border-b border-default-100 text-center ${isToday ? 'bg-foreground/[0.03]' : ''}`}>
                      <div className={`text-[10px] font-semibold uppercase ${isToday ? 'text-foreground' : 'text-default-400'}`}>{daysOfWeek[i]}</div>
                      <div className={`text-lg font-bold mt-0.5`}>{date.getDate()}</div>
                    </div>
                    <div className="flex-1 p-1.5 space-y-1 cursor-pointer overflow-auto" onClick={() => handleDateClick(dateKey)}>
                      {selectedStaff && timetableClasses.map((cls) => (
                        <div key={cls.id} onClick={(e) => handleEventClick(e, cls)} className="p-1.5 rounded text-[10px] border border-default-200 bg-default-50 hover:bg-default-100 cursor-pointer">
                          <div className="font-medium text-default-700">{cls.subject}</div>
                          <div className="text-default-400">{getClassName(cls.classId)}</div>
                        </div>
                      ))}
                      {dayEvents.map(event => (
                        <div key={event.id} onClick={(e) => handleEventClick(e, event)} className={`p-1.5 rounded text-[10px] border cursor-pointer hover:opacity-80 ${event.type === 'appointment' ? 'border-success-200 bg-success-50/50 text-success-700' : 'border-primary-200 bg-primary-50/50 text-primary-700'}`}>
                          <div className="font-medium">{event.title}</div>
                          {event.startTime && <div className="opacity-70 mt-0.5 flex items-center gap-1"><Clock size={8} /> {formatTime(event.startTime)}</div>}
                        </div>
                      ))}
                      {(dayEvents.length + timetableClasses.length) === 0 && (
                        <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="flat" className="h-6 w-6 min-w-0 p-0 rounded-full"><Plus size={12} /></Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Day View */}
          {view === "day" && (
            <div className="flex justify-center p-6">
              <div className="max-w-2xl w-full bg-background rounded-xl border border-default-200 p-6">
                <div className="flex items-baseline gap-3 border-b border-default-100 pb-4 mb-4">
                  <span className="text-3xl font-bold tracking-tight">{currentDate.getDate()}</span>
                  <div className="text-lg text-default-400 font-medium">{daysOfWeekFull[currentDate.getDay()]}</div>
                  <div className="ml-auto text-base text-default-500">{currentDate.toLocaleDateString(getDateLocale(), { month: 'long', year: 'numeric' })}</div>
                </div>

                {selectedStaff && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-default-500 uppercase mb-2">{t('pages.todaySClasses')}</h4>
                    <div className="space-y-2">
                      {getTimetableForDate(formatDateKey(year, month, currentDate.getDate())).map((cls) => {
                        const period = defaultPeriods[cls.periodIndex];
                        return (
                          <div key={cls.id} onClick={(e) => handleEventClick(e, cls)} className="flex items-center gap-3 p-2 rounded-lg border border-default-200 bg-default-50 hover:bg-default-100 cursor-pointer">
                            <div className="text-[10px] text-default-400 w-16">{period?.startTime} - {period?.endTime}</div>
                            <div>
                              <div className="text-sm font-medium">{cls.subject}</div>
                              <div className="text-xs text-default-400">{getClassName(cls.classId)}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {getEventsForDate(formatDateKey(year, month, currentDate.getDate())).length === 0 ? (
                    <div className="py-8 text-center">
                      <CalendarIcon size={24} className="mx-auto text-default-300 mb-2" />
                      <p className="text-sm text-default-400">{t('pages.noEventsScheduled')}</p>
                      <Button size="sm" variant="flat" className="mt-2" onPress={() => handleDateClick(formatDateKey(year, month, currentDate.getDate()))}>{t('pages.addEvent1')}</Button>
                    </div>
                  ) : (
                    getEventsForDate(formatDateKey(year, month, currentDate.getDate())).map(event => (
                      <div key={event.id} onClick={(e) => handleEventClick(e, event)} className="flex gap-3 p-2 rounded-lg border border-default-100 hover:border-default-200 transition-colors cursor-pointer">
                        <div className="w-14 flex flex-col items-center pt-1">
                          <span className="text-[10px] font-medium text-default-500">{event.allDay ? "ALL DAY" : formatTime(event.startTime)}</span>
                          {event.endTime && <span className="text-[10px] text-default-300">{formatTime(event.endTime)}</span>}
                        </div>
                        <div className="w-0.5 rounded-full bg-default-200" />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium">{event.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Chip size="sm" variant="flat" className="h-5 text-[10px]">{eventTypes[event.type]?.label || event.type}</Chip>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Schedule View (Vertical Agenda) */}
          {view === "schedule" && renderScheduleView()}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className={`border-l border-default-200 bg-background transition-all duration-300 ${sidebarExpanded ? 'w-80' : 'w-12'}`}>
        {sidebarExpanded ? (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-3 border-b border-default-100">
              <h3 className="text-sm font-semibold text-foreground">{t('pages.staffSchedule')}</h3>
              <Button isIconOnly size="sm" variant="light" className="text-default-400" onPress={() => setSidebarExpanded(false)}>
                <ChevronRight size={16} />
              </Button>
            </div>

            <div className="p-3 border-b border-default-100">
              <Select
                size="sm"
                placeholder={t('pages.selectStaffMember')}
                selectedKeys={selectedStaff ? [String(selectedStaff.id)] : []}
                onChange={(e) => {
                  const staffId = e.target.value;
                  const member = teachers.find(t => String(t.id) === staffId);
                  setSelectedStaff(member || null);
                }}
                variant="bordered"
                classNames={{ trigger: "h-9" }}
                startContent={<User size={14} className="text-default-400" />}
                isClearable
                onClear={() => setSelectedStaff(null)}
              >
                {teachers.map((teacher) => (
                  <SelectItem key={String(teacher.id)} textValue={teacher.name}>
                    <div className="flex items-center gap-2">
                      <Avatar size="sm" name={teacher.name} className="w-6 h-6 text-[10px]" />
                      <span>{teacher.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </Select>
            </div>

            <ScrollShadow className="flex-1">
              {selectedStaff ? (
                <div className="p-3 space-y-4">
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-default-50">
                    <Avatar name={selectedStaff.name} className="w-10 h-10" />
                    <div>
                      <div className="font-medium text-sm">{selectedStaff.name}</div>
                      <div className="text-xs text-default-400">{Array.isArray(selectedStaff.role) ? selectedStaff.role.join(', ') : selectedStaff.role}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-default-500 uppercase mb-2 flex items-center gap-1.5">
                      <BookOpen size={12} /> Today's Classes
                    </h4>
                    {loadingTimetable ? (
                      <div className="animate-pulse space-y-1.5">
                        {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-gray-100 dark:bg-zinc-800 rounded-lg" />)}
                      </div>
                    ) : todaySchedule.filter(s => s.classId && s.subject).length > 0 ? (
                      <div className="space-y-1.5">
                        {todaySchedule.map((slot, idx) => {
                          if (!slot.classId || !slot.subject) return null;
                          const period = defaultPeriods[idx];
                          return (
                            <div
                              key={`slot-${idx}`}
                              onClick={() => {
                                const event = {
                                  id: `tt-today-${idx}`,
                                  type: 'class',
                                  subject: slot.subject,
                                  classId: slot.classId,
                                  periodIndex: idx,
                                  date: formatDateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()),
                                  title: slot.subject
                                };
                                setSelectedEvent(event);
                                onDetailOpen();
                              }}
                              className="flex items-center gap-2 p-2 rounded-lg border border-default-200 bg-background hover:bg-default-50 cursor-pointer"
                            >
                              <div className="text-[10px] text-default-400 w-14 flex-shrink-0">{period?.startTime}</div>
                              <div className="w-1 h-8 rounded-full bg-default-200" />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium truncate">{slot.subject}</div>
                                <div className="text-[10px] text-default-400">{getClassName(slot.classId)}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-default-400 py-3 text-center border border-dashed border-default-200 rounded-lg">{t('pages.noClassesToday1')}</div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-default-500 uppercase mb-2 flex items-center gap-1.5">
                      <Users size={12} /> Upcoming Appointments
                    </h4>
                    {loadingAppointments ? (
                      <div className="animate-pulse space-y-1.5">
                        {[...Array(2)].map((_, i) => <div key={i} className="h-10 bg-gray-100 dark:bg-zinc-800 rounded-lg" />)}
                      </div>
                    ) : upcomingAppointments.length > 0 ? (
                      <div className="space-y-1.5">
                        {upcomingAppointments.map((apt) => (
                          <div
                            key={apt._id}
                            onClick={() => {
                              const event = {
                                id: `apt-${apt._id}`,
                                type: 'appointment',
                                title: apt.visitorName,
                                date: apt.fromDateTime?.split('T')[0],
                                startTime: apt.fromDateTime?.split('T')[1]?.slice(0, 5),
                                endTime: apt.toDateTime?.split('T')[1]?.slice(0, 5),
                                rawAppointment: apt,
                                visitorName: apt.visitorName,
                                purpose: apt.purpose,
                                status: apt.status,
                                phone: apt.phoneNumber,
                                notes: apt.notes,
                                meetingWith: apt.meetingWith
                              };
                              setSelectedEvent(event);
                              onDetailOpen();
                            }}
                            className="p-2 rounded-lg border border-success-200 bg-success-50/50 hover:bg-success-100/50 cursor-pointer"
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-xs font-medium text-success-700">{apt.visitorName}</div>
                              <Chip size="sm" variant="flat" className="h-4 text-[9px]">{apt.status}</Chip>
                            </div>
                            <div className="text-[10px] text-success-600 mt-1 flex items-center gap-1">
                              <Clock size={10} />
                              {new Date(apt.fromDateTime).toLocaleDateString(getDateLocale(), { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </div>
                            {apt.purpose && <div className="text-[10px] text-success-500 mt-0.5 truncate">{apt.purpose}</div>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-default-400 py-3 text-center border border-dashed border-default-200 rounded-lg">{t('pages.noUpcomingAppointments1')}</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-default-50 flex items-center justify-center mb-3">
                    <User size={20} className="text-default-300" />
                  </div>
                  <p className="text-sm text-default-500 font-medium">{t('pages.noStaffSelected1')}</p>
                  <p className="text-xs text-default-400 mt-1">{t('pages.selectAStaffMemberToViewTheirSchedule')}</p>
                </div>
              )}
            </ScrollShadow>
          </div>
        ) : (
          <div className="flex flex-col items-center py-3">
            <Button isIconOnly size="sm" variant="light" className="text-default-400" onPress={() => setSidebarExpanded(true)}>
              <ChevronLeft size={16} />
            </Button>
            <div className="mt-2 writing-mode-vertical text-[10px] text-default-400 font-medium">{t('pages.staff1')}</div>
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="md" backdrop="blur" classNames={{ base: "bg-background border border-default-200 rounded-xl" }}>
        <ModalContent>
          <ModalHeader className="border-b border-default-100 pb-3">
            <span className="text-base font-semibold">{t('pages.eventDetails')}</span>
          </ModalHeader>
          <ModalBody className="py-4">
            {renderEventDetail()}
          </ModalBody>
          <ModalFooter className="border-t border-default-100 pt-3">
            {!selectedEvent?.id?.toString().startsWith('apt-') && !selectedEvent?.id?.toString().startsWith('tt-') && (
              <>
                <Button size="sm" variant="flat" color="danger" startContent={<Trash2 size={14} />} onPress={() => handleDeleteEvent(selectedEvent?.id)}>
                  Delete
                </Button>
                <Button size="sm" variant="flat" startContent={<Edit3 size={14} />} onPress={() => handleEditEvent(selectedEvent)}>
                  Edit
                </Button>
              </>
            )}
            <div className="flex-1" />
            <Button size="sm" variant="light" onPress={onDetailClose}>{t('pages.close2')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add Event Drawer */}
      <AnimatePresence>
        {isAddOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-[480px] bg-background border-l border-default-200 z-[100] flex flex-col"
          >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-default-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-default-100 flex items-center justify-center">
                    {editingEvent ? <Edit3 size={18} className="text-default-600" /> : <Plus size={18} className="text-default-600" />}
                  </div>
                  <div>
                    <span className="text-base font-semibold block">{editingEvent ? t('pages.editEvent', 'Edit Event') : t('pages.newEvent')}</span>
                    {selectedDate && (
                      <span className="text-xs text-default-400">{formatDate(selectedDate)}</span>
                    )}
                  </div>
                </div>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={onAddClose}
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
                    <label className="text-xs font-medium text-default-500 mb-1.5 block">{t('pages.eventTitle')}</label>
                    <Input
                      placeholder="e.g., Staff Meeting, Annual Day..."
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
                    <label className="text-xs font-medium text-default-500 mb-2 block">{t('pages.eventType')}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(eventTypes)
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
                              <Icon size={14} />
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
                      <span className="text-sm text-default-600">{t('pages.allDayEvent1')}</span>
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
                        <label className="text-xs font-medium text-default-500 mb-1.5 block">{t('pages.startTime1')}</label>
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
                        <label className="text-xs font-medium text-default-500 mb-1.5 block">{t('pages.endTime1')}</label>
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
                    <label className="text-xs font-medium text-default-500 mb-2 block">{t('pages.preview1')}</label>
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
                              {newEvent.title || 'Event Title'}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 text-xs text-default-500">
                              <CalendarIcon size={12} />
                              <span>
                                {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString(getDateLocale(), { weekday: 'short', month: 'short', day: 'numeric' }) : 'Select date'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-default-500">
                              <Clock size={12} />
                              {newEvent.allDay ? (
                                <span>{t('pages.allDay2')}</span>
                              ) : (
                                <span>
                                  {newEvent.startTime ? formatTime(newEvent.startTime) : '--:--'}
                                  {newEvent.endTime ? ` - ${formatTime(newEvent.endTime)}` : ''}
                                </span>
                              )}
                            </div>
                            <div className="mt-2">
                              <span className="text-[10px] px-2 py-0.5 rounded bg-default-100 text-default-600">
                                {eventTypes[newEvent.type]?.label || 'Event'}
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
                <Button variant="light" size="sm" onPress={() => { onAddClose(); setEditingEvent(null); }} className="text-default-500">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-foreground text-background font-medium"
                  onPress={handleAddEvent}
                  isDisabled={!newEvent.title.trim()}
                  startContent={editingEvent ? <Edit3 size={14} /> : <Plus size={14} />}
                >
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </Button>
              </div>
            </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .writing-mode-vertical { writing-mode: vertical-rl; text-orientation: mixed; }
        .bg-primary-50/50 { background-color: rgb(var(--heroui-primary-5)); }
        .bg-secondary-50/50 { background-color: rgb(var(--heroui-secondary-5)); }
        .bg-success-50/50 { background-color: rgb(var(--heroui-success-5)); }
        .bg-success-100/50 { background-color: rgb(var(--heroui-success-10)); }
        .bg-danger-50/50 { background-color: rgb(var(--heroui-danger-5)); }
        .bg-warning-50/50 { background-color: rgb(var(--heroui-warning-5)); }
        .bg-default-50/40 { background-color: rgba(var(--heroui-default-50), 0.3); }
      `}</style>
    </div>
  );
}
