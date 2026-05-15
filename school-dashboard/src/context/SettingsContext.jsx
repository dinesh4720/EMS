import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { settingsApi, calendarEventsApi, feesApi, announcementsApi } from "../services/api";
import { useLeaveTypes } from "./hooks/useLeaveTypes";
import { useFeeHeads } from "./hooks/useFeeHeads";
import { useThemeSettings } from "./hooks/useThemeSettings";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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

      if (Array.isArray(data.leaveTypes)) {
        setLeaveTypes(data.leaveTypes);
      }

      if (Array.isArray(data.feeHeads)) {
        setFeeHeads(data.feeHeads);
      }
    },
    [setLeaveTypes, setFeeHeads]
  );

  // [AUDIT-162] Guard against empty/invalid schoolStartTime which causes NaN dates
  // [AUDIT-568] Convert to a function so it always checks current time (useMemo was stale)
  const getIsBeforeSchoolHours = useCallback(() => {
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

  // Keep backward-compatible property that auto-refreshes every minute
  const [isBeforeSchoolHours, setIsBeforeSchoolHours] = useState(() => getIsBeforeSchoolHours());

  useEffect(() => {
    setIsBeforeSchoolHours(getIsBeforeSchoolHours());
    const interval = setInterval(() => {
      setIsBeforeSchoolHours(getIsBeforeSchoolHours());
    }, 60_000); // Re-check every minute
    return () => clearInterval(interval);
  }, [getIsBeforeSchoolHours]);

  // School Settings functions
  const updateSchoolSettings = useCallback(async (updates) => {
    try {
      const updated = await settingsApi.updateSchoolSettings(updates);
      setSchoolSettings((prev) => ({ ...prev, ...updated }));
      void invalidateSettingsData();
      toast.success(t('toast.success.schoolSettingsUpdatedSuccessfully', 'School settings updated successfully'));
      return updated;
    } catch (err) {
      logger.error("Failed to update school settings:", err);
      toast.error(t('toast.error.failedToUpdateSchoolSettings', 'Failed to update school settings'));
      throw err;
    }
  }, [t, invalidateSettingsData]);

  const addSubject = useCallback(async (subject) => {
    try {
      const result = await settingsApi.createSubject(subject);
      // Backend now returns { subjects, classesUpdated }
      const subjects = Array.isArray(result) ? result : result.subjects || result;
      const classesUpdated = result.classesUpdated || 0;
      setSchoolSettings((prev) => ({ ...prev, subjects }));
      void invalidateSettingsData();
      const msg = classesUpdated > 0
        ? t('toast.success.subjectSyncedToClasses', { action: t('toast.success.subjectAddedSuccessfully', 'Subject added'), count: classesUpdated, defaultValue: `Subject added and synced to ${classesUpdated} class(es)` })
        : t('toast.success.subjectAddedSuccessfully', 'Subject added successfully');
      toast.success(msg);
      return subjects;
    } catch (err) {
      logger.error("Failed to add subject:", err);
      toast.error(t('toast.error.failedToAddSubject', 'Failed to add subject'));
      // Fallback to local state
      const subjectWithId = { ...subject, id: nextSubjectId };
      setSchoolSettings((prev) => ({
        ...prev,
        subjects: [...prev.subjects, subjectWithId],
      }));
      setNextSubjectId((prev) => prev + 1);
      return subjectWithId;
    }
  }, [t, invalidateSettingsData, nextSubjectId]);

  const updateSubject = useCallback(async (id, updates) => {
    try {
      const result = await settingsApi.updateSubject(id, updates);
      const subjects = Array.isArray(result) ? result : result.subjects || result;
      const classesUpdated = result.classesUpdated || 0;
      setSchoolSettings((prev) => ({ ...prev, subjects }));
      void invalidateSettingsData();
      const msg = classesUpdated > 0
        ? t('toast.success.subjectSyncedToClasses', { action: t('toast.success.subjectUpdatedSuccessfully', 'Subject updated'), count: classesUpdated, defaultValue: `Subject updated and synced to ${classesUpdated} class(es)` })
        : t('toast.success.subjectUpdatedSuccessfully', 'Subject updated successfully');
      toast.success(msg);
      return subjects;
    } catch (err) {
      logger.error("Failed to update subject:", err);
      toast.error(t('toast.error.failedToUpdateSubject', 'Failed to update subject'));
      // Fallback to local state
      setSchoolSettings((prev) => ({
        ...prev,
        subjects: prev.subjects.map((s) => {
          const subjectId = s.id || s._id;
          return String(subjectId) === String(id) ? { ...s, ...updates } : s;
        }),
      }));
    }
  }, [t, invalidateSettingsData]);

  const deleteSubject = useCallback(async (id) => {
    try {
      const result = await settingsApi.deleteSubject(id);
      const subjects = Array.isArray(result) ? result : result.subjects || result;
      const classesUpdated = result.classesUpdated || 0;
      setSchoolSettings((prev) => ({ ...prev, subjects }));
      void invalidateSettingsData();
      const msg = classesUpdated > 0
        ? t('toast.success.subjectSyncedToClasses', { action: t('toast.success.subjectDeletedSuccessfully', 'Subject deleted'), count: classesUpdated, defaultValue: `Subject deleted and removed from ${classesUpdated} class(es)` })
        : t('toast.success.subjectDeletedSuccessfully', 'Subject deleted successfully');
      toast.success(msg);
    } catch (err) {
      logger.error("Failed to delete subject:", err);
      toast.error(t('toast.error.failedToDeleteSubject', 'Failed to delete subject'));
      throw err;
    }
  }, [t, invalidateSettingsData]);

  // Event functions
  const addEvent = useCallback(async (newEvent) => {
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
        toast.success(t('toast.success.holidayAddedSuccessfully', 'Holiday added successfully'));
        return eventWithId;
      } catch (err) {
        logger.error("Failed to add holiday:", err);
        toast.error(t('toast.error.failedToAddHoliday', 'Failed to add holiday'));
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
        toast.success(t('toast.success.eventAddedSuccessfully', 'Event added successfully'));
        return created;
      } catch (err) {
        logger.error("Failed to save event to server:", err);
        toast.error(t('toast.error.eventSavedLocally', 'Event saved locally (server unavailable)'));
        return localEvent;
      }
    }
  }, [t, invalidateSettingsData]);

  const updateEvent = useCallback(async (id, updates) => {
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
        toast.success(t('toast.success.holidayUpdatedSuccessfully', 'Holiday updated successfully'));
      } catch (err) {
        logger.error("Failed to update holiday:", err);
        toast.error(t('toast.error.failedToUpdateHoliday', 'Failed to update holiday'));
        throw err;
      }
    } else {
      try {
        await calendarEventsApi.update(id, updates);
        setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
        void invalidateSettingsData();
        toast.success(t('toast.success.eventUpdatedSuccessfully', 'Event updated successfully'));
      } catch (err) {
        logger.error("Failed to update event:", err);
        toast.error(t('toast.error.failedToUpdateEvent', 'Failed to update event'));
        throw err;
      }
    }
  }, [events, t, invalidateSettingsData]);

  const deleteEvent = useCallback(async (id) => {
    const event = events.find((e) => e.id === id);
    if (event && event.type === "holiday") {
      try {
        await settingsApi.deleteHoliday(id);
        setEvents((prev) => prev.filter((e) => e.id !== id));
        void invalidateSettingsData();
        toast.success(t('toast.success.holidayDeletedSuccessfully', 'Holiday deleted successfully'));
      } catch (err) {
        logger.error("Failed to delete holiday:", err);
        toast.error(t('toast.error.failedToDeleteHoliday', 'Failed to delete holiday'));
        throw err;
      }
    } else {
      try {
        await calendarEventsApi.delete(id);
        setEvents((prev) => prev.filter((e) => e.id !== id));
        void invalidateSettingsData();
        toast.success(t('toast.success.eventDeletedSuccessfully', 'Event deleted successfully'));
      } catch (err) {
        logger.error("Failed to delete event:", err);
        toast.error(t('toast.error.failedToDeleteEvent', 'Failed to delete event'));
        throw err;
      }
    }
  }, [events, t, invalidateSettingsData]);

  const getEventsForDate = useCallback(
    (date) => (Array.isArray(events) ? events.filter((e) => e.date === date) : []),
    [events]
  );

  // Fee functions
  const addFeePayment = useCallback(async (payment) => {
    const localPayment = { ...payment, id: payment.id || `temp-${Date.now()}` };
    setFeePayments((prev) => [...prev, localPayment]);
    try {
      const created = await feesApi.createPayment(payment);
      setFeePayments((prev) => prev.map((p) => (p.id === localPayment.id ? created : p)));
      void invalidateSettingsData();
      return created;
    } catch (err) {
      logger.error("Failed to save fee payment:", err);
      toast.error(t('toast.error.feePaymentSavedLocally', 'Fee payment saved locally (server unavailable)'));
      return localPayment;
    }
  }, [t, invalidateSettingsData]);

  // Local-only fee sync for socket events (payment already exists on server)
  const syncFeePaymentLocal = useCallback((payment) => {
    setFeePayments((prev) => [...prev, payment]);
  }, []);

  const getStudentFeeHistory = useCallback(
    (studentId) =>
      Array.isArray(feePayments)
        ? feePayments.filter((p) => p.studentId === studentId)
        : [],
    [feePayments]
  );

  // Announcement functions
  const addAnnouncement = useCallback(async (announcement) => {
    const localAnnouncement = { ...announcement, id: `temp-${Date.now()}` };
    setAnnouncements((prev) => [...prev, localAnnouncement]);
    try {
      const created = await announcementsApi.create(announcement);
      setAnnouncements((prev) => prev.map((a) => (a.id === localAnnouncement.id ? created : a)));
      void invalidateSettingsData();
      return created;
    } catch (err) {
      logger.error("Failed to save announcement:", err);
      toast.error(t('toast.error.announcementSavedLocally', 'Announcement saved locally (server unavailable)'));
      return localAnnouncement;
    }
  }, [t, invalidateSettingsData]);

  const value = useMemo(
    () => ({
      schoolSettings,
      currentAcademicYear,
      events,
      feePayments,
      announcements,
      leaveTypes,
      feeHeads,
      isBeforeSchoolHours,
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
      syncFeePaymentLocal,
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
    }),
    [
      schoolSettings,
      currentAcademicYear,
      events,
      feePayments,
      announcements,
      leaveTypes,
      feeHeads,
      isBeforeSchoolHours,
      setSettingsFromQuery,
      updateSchoolSettings,
      addSubject,
      updateSubject,
      deleteSubject,
      addEvent,
      updateEvent,
      deleteEvent,
      getEventsForDate,
      addFeePayment,
      syncFeePaymentLocal,
      getStudentFeeHistory,
      addAnnouncement,
      addLeaveType,
      updateLeaveType,
      deleteLeaveType,
      addFeeHead,
      updateFeeHead,
      deleteFeeHead,
      themeSettings,
      updateThemeSettings,
      resetThemeSettings,
    ]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
};
