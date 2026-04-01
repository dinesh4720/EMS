import { createContext, useContext, useState, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { settingsApi, calendarEventsApi } from "../services/api";
import { useLeaveTypes } from "./hooks/useLeaveTypes";
import { useFeeHeads } from "./hooks/useFeeHeads";
import { useThemeSettings } from "./hooks/useThemeSettings";
import toast from "react-hot-toast";
import { CURRENT_ACADEMIC_YEAR } from "../utils/constants";
import { syncSchoolLanguage } from "../i18n";
import logger from "../utils/logger";

// NOTE: These are minimal fallback values only.
// The application fetches actual data from the API on mount.
// These defaults prevent errors before data is loaded.
export const initialSchoolSettings = {
  name: "",
  address: "",
  phone: "",
  email: "",
  udiseNo: "",
  affiliationNo: "",
  logo: null,
  boardOfEducation: "",
  principalSignature: null,
  correspondentSignature: null,
  academicYear: "",
  academicYearStart: "",
  academicYearEnd: "",
  schoolStartTime: "",
  schoolEndTime: "",
  periodDuration: 45,
  periodsPerDay: 8,
  workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  subjects: [],
};

export const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const queryClient = useQueryClient();
  const [schoolSettings, setSchoolSettings] = useState(initialSchoolSettings);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [feePayments, setFeePayments] = useState([]);

  // ID counter for local subject fallback (kept for backward compat)
  const [nextSubjectId, setNextSubjectId] = useState(1);

  const invalidateSettingsData = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["app-settings-data"] }),
    [queryClient]
  );

  const { leaveTypes, setLeaveTypes, addLeaveType, updateLeaveType, deleteLeaveType } =
    useLeaveTypes(invalidateSettingsData);
  const { feeHeads, setFeeHeads, addFeeHead, updateFeeHead, deleteFeeHead } =
    useFeeHeads(invalidateSettingsData);
  const { themeSettings, updateThemeSettings, resetThemeSettings } = useThemeSettings();

  const currentAcademicYear = schoolSettings?.academicYear || CURRENT_ACADEMIC_YEAR;

  // Called by AppContextCore when settings query data arrives
  const setSettingsFromQuery = useCallback(
    (data) => {
      const settings = data.schoolSettings || initialSchoolSettings;
      setSchoolSettings(settings);
      syncSchoolLanguage(settings.language?.defaultLanguage);
      setEvents(data.events || []);

      if ((data.leaveTypes || []).length > 0) {
        setLeaveTypes(data.leaveTypes);
      }

      if ((data.feeHeads || []).length > 0) {
        setFeeHeads(data.feeHeads);
      }
    },
    [setLeaveTypes, setFeeHeads]
  );

  // [AUDIT-162] Guard against empty/invalid schoolStartTime which causes NaN dates
  const isBeforeSchoolHours = useMemo(() => {
    if (!schoolSettings.schoolStartTime || !schoolSettings.schoolStartTime.includes(':')) {
      return false; // No valid start time configured — assume school hours
    }
    const now = new Date();
    const parts = schoolSettings.schoolStartTime.split(":").map(Number);
    const startHour = parts[0];
    const startMin = parts[1] ?? 0;
    if (!Number.isFinite(startHour) || !Number.isFinite(startMin)) {
      return false; // Invalid time format — assume school hours
    }
    const schoolStart = new Date();
    schoolStart.setHours(startHour, startMin, 0, 0);
    return now < schoolStart;
  }, [schoolSettings.schoolStartTime]);

  // School Settings functions
  const updateSchoolSettings = async (updates) => {
    try {
      const updated = await settingsApi.updateSchoolSettings(updates);
      setSchoolSettings((prev) => ({ ...prev, ...updated }));
      void invalidateSettingsData();
      toast.success("School settings updated successfully");
      return updated;
    } catch (err) {
      logger.error("Failed to update school settings:", err);
      toast.error("Failed to update school settings");
      throw err;
    }
  };

  const addSubject = async (subject) => {
    try {
      const result = await settingsApi.createSubject(subject);
      // Backend now returns { subjects, classesUpdated }
      const subjects = Array.isArray(result) ? result : result.subjects || result;
      const classesUpdated = result.classesUpdated || 0;
      setSchoolSettings((prev) => ({ ...prev, subjects }));
      void invalidateSettingsData();
      const msg = classesUpdated > 0
        ? `Subject added and synced to ${classesUpdated} class${classesUpdated > 1 ? 'es' : ''}`
        : "Subject added successfully";
      toast.success(msg);
      return subjects;
    } catch (err) {
      logger.error("Failed to add subject:", err);
      toast.error("Failed to add subject");
      // Fallback to local state
      const subjectWithId = { ...subject, id: nextSubjectId };
      setSchoolSettings((prev) => ({
        ...prev,
        subjects: [...prev.subjects, subjectWithId],
      }));
      setNextSubjectId((prev) => prev + 1);
      return subjectWithId;
    }
  };

  const updateSubject = async (id, updates) => {
    try {
      const result = await settingsApi.updateSubject(id, updates);
      const subjects = Array.isArray(result) ? result : result.subjects || result;
      const classesUpdated = result.classesUpdated || 0;
      setSchoolSettings((prev) => ({ ...prev, subjects }));
      void invalidateSettingsData();
      const msg = classesUpdated > 0
        ? `Subject updated and synced to ${classesUpdated} class${classesUpdated > 1 ? 'es' : ''}`
        : "Subject updated successfully";
      toast.success(msg);
      return subjects;
    } catch (err) {
      logger.error("Failed to update subject:", err);
      toast.error("Failed to update subject");
      // Fallback to local state
      setSchoolSettings((prev) => ({
        ...prev,
        subjects: prev.subjects.map((s) => {
          const subjectId = s.id || s._id;
          return String(subjectId) === String(id) ? { ...s, ...updates } : s;
        }),
      }));
    }
  };

  const deleteSubject = async (id) => {
    try {
      const result = await settingsApi.deleteSubject(id);
      const subjects = Array.isArray(result) ? result : result.subjects || result;
      const classesUpdated = result.classesUpdated || 0;
      setSchoolSettings((prev) => ({ ...prev, subjects }));
      void invalidateSettingsData();
      const msg = classesUpdated > 0
        ? `Subject deleted and removed from ${classesUpdated} class${classesUpdated > 1 ? 'es' : ''}`
        : "Subject deleted successfully";
      toast.success(msg);
    } catch (err) {
      logger.error("Failed to delete subject:", err);
      toast.error("Failed to delete subject");
      throw err;
    }
  };

  // Event functions
  const addEvent = async (newEvent) => {
    if (newEvent.type === "holiday") {
      try {
        const holidayData = {
          name: newEvent.title,
          date: newEvent.date,
          type: newEvent.holidayType || "National",
        };
        const created = await settingsApi.createHoliday(holidayData);
        const eventWithId = {
          id: created.id,
          title: created.name,
          date: created.date,
          type: "holiday",
          startTime: "",
          endTime: "",
          allDay: true,
          holidayType: created.type,
        };
        setEvents((prev) => [...prev, eventWithId]);
        void invalidateSettingsData();
        toast.success("Holiday added successfully");
        return eventWithId;
      } catch (err) {
        logger.error("Failed to add holiday:", err);
        toast.error("Failed to add holiday");
        throw err;
      }
    } else {
      // Optimistically add to local state
      const localEvent = {
        id: `temp-${Date.now()}`,
        title: newEvent.title,
        date: newEvent.date,
        type: newEvent.type || "event",
        startTime: newEvent.startTime || "",
        endTime: newEvent.endTime || "",
        allDay: newEvent.allDay || false,
      };
      setEvents((prev) => [...prev, localEvent]);

      try {
        const created = await calendarEventsApi.create({
          title: newEvent.title,
          date: newEvent.date,
          type: newEvent.type || "event",
          startTime: newEvent.startTime || "",
          endTime: newEvent.endTime || "",
          allDay: newEvent.allDay || false,
        });
        // Replace temp event with the real one from API
        setEvents((prev) => prev.map((e) => (e.id === localEvent.id ? created : e)));
        void invalidateSettingsData();
        toast.success("Event added successfully");
        return created;
      } catch (err) {
        logger.error("Failed to save event to server:", err);
        toast.error("Event saved locally (server unavailable)");
        return localEvent;
      }
    }
  };

  const updateEvent = async (id, updates) => {
    const event = events.find((e) => e.id === id);
    if (event && event.type === "holiday") {
      try {
        const holidayData = {
          name: updates.title || event.title,
          date: updates.date || event.date,
          type: updates.holidayType || event.holidayType,
        };
        await settingsApi.updateHoliday(id, holidayData);
        setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
        void invalidateSettingsData();
        toast.success("Holiday updated successfully");
      } catch (err) {
        logger.error("Failed to update holiday:", err);
        toast.error("Failed to update holiday");
        throw err;
      }
    } else {
      try {
        await calendarEventsApi.update(id, updates);
        setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
        void invalidateSettingsData();
        toast.success("Event updated successfully");
      } catch (err) {
        logger.error("Failed to update event:", err);
        toast.error("Failed to update event");
        throw err;
      }
    }
  };

  const deleteEvent = async (id) => {
    const event = events.find((e) => e.id === id);
    if (event && event.type === "holiday") {
      try {
        await settingsApi.deleteHoliday(id);
        setEvents((prev) => prev.filter((e) => e.id !== id));
        void invalidateSettingsData();
        toast.success("Holiday deleted successfully");
      } catch (err) {
        logger.error("Failed to delete holiday:", err);
        toast.error("Failed to delete holiday");
        throw err;
      }
    } else {
      try {
        await calendarEventsApi.delete(id);
        setEvents((prev) => prev.filter((e) => e.id !== id));
        void invalidateSettingsData();
        toast.success("Event deleted successfully");
      } catch (err) {
        logger.error("Failed to delete event:", err);
        toast.error("Failed to delete event");
        throw err;
      }
    }
  };

  const getEventsForDate = (date) =>
    Array.isArray(events) ? events.filter((e) => e.date === date) : [];

  // Fee functions
  const addFeePayment = (payment) => {
    const paymentWithId = { ...payment, id: payment.id || Date.now() };
    setFeePayments((prev) => [...prev, paymentWithId]);
    return paymentWithId;
  };

  const getStudentFeeHistory = (studentId) =>
    Array.isArray(feePayments)
      ? feePayments.filter((p) => p.studentId === studentId)
      : [];

  // Announcement functions
  const addAnnouncement = (announcement) => {
    const announcementWithId = { ...announcement, id: Date.now() };
    setAnnouncements((prev) => [...prev, announcementWithId]);
    return announcementWithId;
  };

  const value = {
    schoolSettings,
    currentAcademicYear,
    events,
    feePayments,
    announcements,
    leaveTypes,
    feeHeads,
    isBeforeSchoolHours,
    setSchoolSettings,
    setEvents,
    setFeePayments,
    setSettingsFromQuery,
    // School settings actions
    updateSchoolSettings,
    addSubject,
    updateSubject,
    deleteSubject,
    // Event actions
    addEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
    // Fee actions
    addFeePayment,
    getStudentFeeHistory,
    // Announcement actions
    addAnnouncement,
    // Leave Types actions
    addLeaveType,
    updateLeaveType,
    deleteLeaveType,
    // Fee Heads actions
    addFeeHead,
    updateFeeHead,
    deleteFeeHead,
    // Theme
    themeSettings,
    updateThemeSettings,
    resetThemeSettings,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
};
