import {
  AlertCircle, FileText, Calendar as CalendarIcon, Users, User, BookOpen,
} from "lucide-react";

// Display config for every event type the calendar surfaces.
// Backend create-enum is just ['event', 'meeting', 'exam', 'holiday'];
// 'appointment' and 'class' are read-only overlays sourced from other modules.
export const eventTypes = {
  holiday: { label: "Holiday", icon: AlertCircle },
  exam: { label: "Exam", icon: FileText },
  event: { label: "Event", icon: CalendarIcon },
  meeting: { label: "Meeting", icon: Users },
  appointment: { label: "Appointment", icon: User },
  class: { label: "Class", icon: BookOpen },
};

export const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const daysOfWeekFull = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

export const defaultPeriods = [
  { name: "Period 1", startTime: "09:00", endTime: "09:45", isBreak: false },
  { name: "Period 2", startTime: "09:45", endTime: "10:30", isBreak: false },
  { name: "Break",    startTime: "10:30", endTime: "10:45", isBreak: true  },
  { name: "Period 3", startTime: "10:45", endTime: "11:30", isBreak: false },
  { name: "Period 4", startTime: "11:30", endTime: "12:15", isBreak: false },
  { name: "Lunch",    startTime: "12:15", endTime: "12:45", isBreak: true  },
  { name: "Period 5", startTime: "12:45", endTime: "13:30", isBreak: false },
  { name: "Period 6", startTime: "13:30", endTime: "14:15", isBreak: false },
  { name: "Period 7", startTime: "14:15", endTime: "15:00", isBreak: false },
];

export const formatDateKey = (y, m, d) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export const formatTime = (time) => {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
};
