import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../context/AppContext";
import { frontDeskApi, teacherTimetableApi } from "../../services/api";
import logger from "../../utils/logger";
import ConfirmDialog from "../../components/ConfirmDialog";
import { PageShell } from "../../components/ui";
import Drawer from "../../components/ui/Drawer";

import CalendarToolbar from "./components/CalendarToolbar";
import AddEventDrawer from "./components/AddEventDrawer";
import EventDetailModal from "./components/EventDetailModal";
import ScheduleView from "./components/ScheduleView";
import StaffSidebar from "./components/StaffSidebar";
import MonthView from "./components/MonthView";
import WeekView from "./components/WeekView";
import DayView from "./components/DayView";

import {
  eventTypes,
  daysOfWeek,
  daysOfWeekFull,
  defaultPeriods,
  formatDateKey,
} from "./constants";

// Mobile breakpoint — below this the sidebar collapses to a Drawer
const MOBILE_MAX = 1099;

const isReadOnlyEventId = (id) =>
  typeof id === "string" && (id.startsWith("apt-") || id.startsWith("tt-"));

export default function CalendarPage() {
  const { t } = useTranslation();
  const {
    events, addEvent, updateEvent, deleteEvent,
    staff, classesWithTeachers, schoolSettings,
  } = useApp();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [view, setView] = useState("month");

  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffAppointments, setStaffAppointments] = useState([]);
  const [staffTimetable, setStaffTimetable] = useState(null);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [loadingTimetable, setLoadingTimetable] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= MOBILE_MAX : false
  );

  useEffect(() => {
    const onResize = () => setIsMobileViewport(window.innerWidth <= MOBILE_MAX);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const teachers = useMemo(() => (
    Array.isArray(staff) ? staff.filter((s) => {
      if (s.status !== "active") return false;
      const role = s.role;
      const roleStr = Array.isArray(role)
        ? role.join(" ").toLowerCase()
        : typeof role === "string" ? role.toLowerCase() : "";
      return (
        roleStr.includes("teacher") ||
        roleStr.includes("faculty") ||
        (Array.isArray(s.subjects) && s.subjects.length > 0)
      );
    }) : []
  ), [staff]);

  useEffect(() => {
    let cancelled = false;
    if (!selectedStaff) {
      setStaffAppointments([]);
      setStaffTimetable(null);
      return undefined;
    }

    setLoadingAppointments(true);
    setLoadingTimetable(true);

    frontDeskApi.getAppointments()
      .then((response) => {
        if (cancelled) return;
        const filtered = (Array.isArray(response) ? response : []).filter(
          (apt) => apt.meetingWith === selectedStaff.name && apt.status !== "cancelled",
        );
        setStaffAppointments(filtered);
      })
      .catch((error) => {
        logger.error("Failed to load appointments:", error);
        if (!cancelled) setStaffAppointments([]);
      })
      .finally(() => { if (!cancelled) setLoadingAppointments(false); });

    teacherTimetableApi.get(selectedStaff.id, schoolSettings?.academicYear)
      .then((response) => {
        if (cancelled) return;
        setStaffTimetable(response?.success ? response.timetable : null);
      })
      .catch((error) => {
        logger.error("Failed to load timetable:", error);
        if (!cancelled) setStaffTimetable(null);
      })
      .finally(() => { if (!cancelled) setLoadingTimetable(false); });

    return () => { cancelled = true; };
  }, [selectedStaff, schoolSettings?.academicYear]);

  const allAppointmentEvents = useMemo(() => (
    staffAppointments.map((apt) => {
      const aptDate = apt.fromDateTime?.split("T")[0];
      return {
        id: `apt-${apt._id}`,
        title: apt.visitorName,
        type: "appointment",
        date: aptDate,
        startTime: apt.fromDateTime?.split("T")[1]?.slice(0, 5) || "",
        endTime: apt.toDateTime?.split("T")[1]?.slice(0, 5) || "",
        rawAppointment: apt,
        visitorName: apt.visitorName,
        purpose: apt.purpose,
        status: apt.status,
        phone: apt.phoneNumber,
        notes: apt.notes,
        meetingWith: apt.meetingWith,
      };
    })
  ), [staffAppointments]);

  const getEventsForDate = (dateKey) => {
    const baseEvents = (events || []).filter((e) => e.date === dateKey);
    if (selectedStaff) {
      const appointmentEvents = allAppointmentEvents.filter((e) => e.date === dateKey);
      return [...baseEvents, ...appointmentEvents];
    }
    return baseEvents;
  };

  const getTimetableForDate = (dateKey) => {
    if (!selectedStaff || !staffTimetable?.schedule) return [];
    const date = new Date(`${dateKey}T00:00:00`);
    const dayName = daysOfWeekFull[date.getDay()];
    const daySchedule = staffTimetable.schedule[dayName] || [];
    return daySchedule
      .filter((slot) => slot.classId && slot.subject)
      .map((slot, idx) => ({
        id: `tt-${dateKey}-${idx}`,
        title: slot.subject,
        type: "class",
        date: dateKey,
        classId: slot.classId,
        subject: slot.subject,
        periodIndex: idx,
        rawSlot: slot,
      }));
  };

  const getClassName = (classId) => {
    if (!classId) return "";
    const classData = (classesWithTeachers || []).find((c) =>
      String(c.id) === String(classId) || String(c._id) === String(classId),
    );
    return classData ? `${classData.name}-${classData.section}` : "";
  };

  const getTranslatedPeriodName = (period) => {
    if (!period) return "";
    if (period.isBreak) return t(`calendar.periods.${period.name.toLowerCase()}`, period.name);
    return period.name;
  };

  const scheduleViewData = useMemo(() => {
    const data = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(year, month, day);
      const date = new Date(`${dateKey}T00:00:00`);
      const dayEvents = getEventsForDate(dateKey);
      const timetableClasses = getTimetableForDate(dateKey);
      const isToday = dateKey === formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
      const isPast = date < today && !isToday;

      if (dayEvents.length > 0 || timetableClasses.length > 0) {
        data.push({
          dateKey, date, day,
          dayName: daysOfWeekFull[date.getDay()],
          dayNameShort: daysOfWeek[date.getDay()],
          isToday, isPast,
          events: [...timetableClasses, ...dayEvents].sort((a, b) => {
            if (!a.startTime) return 1;
            if (!b.startTime) return -1;
            return a.startTime.localeCompare(b.startTime);
          }),
        });
      }
    }
    return data;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, events, staffAppointments, staffTimetable, selectedStaff]);

  const todaySchedule = useMemo(() => {
    if (!selectedStaff || !staffTimetable?.schedule) return [];
    const today = daysOfWeekFull[new Date().getDay()];
    return staffTimetable.schedule[today] || [];
  }, [selectedStaff, staffTimetable]);

  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return staffAppointments
      .filter((apt) => new Date(apt.fromDateTime) >= now)
      .sort((a, b) => new Date(a.fromDateTime) - new Date(b.fromDateTime))
      .slice(0, 5);
  }, [staffAppointments]);

  const navigate = (direction) => {
    const d = new Date(currentDate);
    if (view === "month" || view === "schedule") d.setMonth(d.getMonth() + direction);
    else if (view === "week") d.setDate(d.getDate() + direction * 7);
    else d.setDate(d.getDate() + direction);
    setCurrentDate(d);
  };

  const goToToday = () => setCurrentDate(new Date());

  const openAddDrawer = (dateKey) => {
    setSelectedDate(dateKey || formatDateKey(year, month, currentDate.getDate()));
    setEditingEvent(null);
    setIsAddOpen(true);
  };

  const openEventDetail = (e, event) => {
    if (e?.stopPropagation) e.stopPropagation();
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };

  const openEventFromSidebar = (event) => {
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };

  const handleSaveEvent = async (payload) => {
    if (editingEvent) await updateEvent(editingEvent.id, payload);
    else await addEvent(payload);
    setEditingEvent(null);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setSelectedDate(event.date);
    setIsDetailOpen(false);
    setSelectedEvent(null);
    setIsAddOpen(true);
  };

  const handleDeleteEvent = (id) => {
    setEventToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteEvent = () => {
    if (eventToDelete) {
      deleteEvent(eventToDelete);
      setIsDetailOpen(false);
      setSelectedEvent(null);
    }
    setDeleteConfirmOpen(false);
    setEventToDelete(null);
  };

  const viewProps = {
    selectedStaff,
    getEventsForDate,
    getTimetableForDate,
    getClassName,
    onDateClick: openAddDrawer,
    onEventClick: openEventDetail,
    eventTypes,
  };

  const sidebarContent = (
    <StaffSidebar
      selectedStaff={selectedStaff}
      teachers={teachers}
      todaySchedule={todaySchedule}
      upcomingAppointments={upcomingAppointments}
      loadingTimetable={loadingTimetable}
      loadingAppointments={loadingAppointments}
      onStaffChange={setSelectedStaff}
      onEventClick={openEventFromSidebar}
      defaultPeriods={defaultPeriods}
      getClassName={getClassName}
      sidebarExpanded={sidebarExpanded}
      onToggleSidebar={setSidebarExpanded}
      formatDateKey={formatDateKey}
    />
  );

  const mobileSidebarContent = (
    <StaffSidebar
      selectedStaff={selectedStaff}
      teachers={teachers}
      todaySchedule={todaySchedule}
      upcomingAppointments={upcomingAppointments}
      loadingTimetable={loadingTimetable}
      loadingAppointments={loadingAppointments}
      onStaffChange={setSelectedStaff}
      onEventClick={openEventFromSidebar}
      defaultPeriods={defaultPeriods}
      getClassName={getClassName}
      sidebarExpanded={true}
      onToggleSidebar={() => {}}
      formatDateKey={formatDateKey}
    />
  );

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h1 className="page__title">{t('calendar.title', 'Calendar')}</h1>
          <p className="page__sub">{t('calendar.subtitle', 'Manage events, schedules, and appointments')}</p>
        </div>
      </div>

      <PageShell
        scrollable={false}
        bodyPadding="none"
        className="flex-1 min-h-0"
      >
        <div className="flex flex-1 min-h-0">
        {/* Main Calendar Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <CalendarToolbar
            currentDate={currentDate}
            view={view}
            onViewChange={setView}
            onNavigate={navigate}
            onToday={goToToday}
            onAddEvent={openAddDrawer}
            onDateChange={setCurrentDate}
            year={year}
            month={month}
            isMobileViewport={isMobileViewport}
            onOpenSidebar={() => setMobileSidebarOpen(true)}
          />

          <div className="flex-1 overflow-auto">
            {view === "month" && (
              <MonthView year={year} month={month} {...viewProps} />
            )}
            {view === "week" && (
              <WeekView currentDate={currentDate} {...viewProps} />
            )}
            {view === "day" && (
              <DayView currentDate={currentDate} {...viewProps} />
            )}
            {view === "schedule" && (
              <ScheduleView
                scheduleViewData={scheduleViewData}
                eventTypes={eventTypes}
                onEventClick={openEventDetail}
                getClassName={getClassName}
                onAddEvent={() => openAddDrawer()}
                selectedStaff={selectedStaff}
              />
            )}
          </div>
        </div>

        {/* Desktop sidebar */}
        {!isMobileViewport && sidebarContent}

        {/* Mobile: sidebar rendered as a Drawer */}
        {isMobileViewport && (
          <Drawer
            isOpen={mobileSidebarOpen}
            onClose={() => setMobileSidebarOpen(false)}
            title={t('calendar.sidebar.title', 'Staff Schedule')}
            size="md"
          >
            {mobileSidebarContent}
          </Drawer>
        )}

        <EventDetailModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          event={selectedEvent}
          eventTypes={eventTypes}
          onDelete={handleDeleteEvent}
          onEdit={selectedEvent && !isReadOnlyEventId(selectedEvent.id) ? handleEditEvent : null}
          getClassName={getClassName}
          defaultPeriods={defaultPeriods}
          selectedStaff={selectedStaff}
          getTranslatedPeriodName={getTranslatedPeriodName}
        />

        <AddEventDrawer
          isOpen={isAddOpen}
          onClose={() => { setIsAddOpen(false); setEditingEvent(null); }}
          selectedDate={selectedDate}
          onAddEvent={handleSaveEvent}
          editingEvent={editingEvent}
        />

        <ConfirmDialog
          isOpen={deleteConfirmOpen}
          onClose={() => { setDeleteConfirmOpen(false); setEventToDelete(null); }}
          onConfirm={confirmDeleteEvent}
          title={t("calendar.deleteConfirm.title", "Delete Event")}
          message={t("calendar.deleteConfirm.message", "Are you sure you want to delete this event? This action cannot be undone.")}
          confirmText={t("common.delete", "Delete")}
          cancelText={t("common.cancel", "Cancel")}
          variant="danger"
        />
        </div>
      </PageShell>
    </div>
  );
}
