/**
 * appContextHelpers.js
 *
 * Pure helper functions and data-fetching logic for AppContext.
 * Extracted to keep AppContext.jsx focused on React orchestration.
 */

import {
  staffApi,
  studentsApi,
  classesApi,
  settingsApi,
  teacherTimetableApi,
  staffAttendanceApi,
  calendarEventsApi,
} from "../services/api";
import { initialSchoolSettings } from "./SettingsContext";

// ---------------------------------------------------------------------------
// Role constants
// ---------------------------------------------------------------------------

export const ADMIN_LIKE_ROLES = new Set([
  "admin",
  "principal",
  "vice principal",
  "vice-principal",
  "super admin",
  "superadmin",
]);
export const TEACHER_ROLES = new Set(["teacher"]);

// ---------------------------------------------------------------------------
// Role helpers
// ---------------------------------------------------------------------------

export function extractRoleNames(roleValue) {
  if (Array.isArray(roleValue)) {
    return roleValue.flatMap((role) => extractRoleNames(role)).filter(Boolean);
  }
  if (typeof roleValue !== "string") {
    return [];
  }
  return [roleValue.toLowerCase().trim()];
}

export function hasAnyRole(user, allowedRoles) {
  return extractRoleNames(user?.role).some((role) => allowedRoles.has(role));
}

// ---------------------------------------------------------------------------
// Record normalizers
// ---------------------------------------------------------------------------

export function normalizeClassName(name = "") {
  return String(name).replace(/^Class\s+/i, "").trim();
}

function formatClassLabel(className, section) {
  const normalizedName = normalizeClassName(className);
  if (!normalizedName) return null;
  return section ? `${normalizedName}-${section}` : normalizedName;
}

export function normalizeStaffMember(staffMember, fallbackUser = null) {
  const source = staffMember || fallbackUser;
  if (!source) return null;
  return {
    ...source,
    id: String(source.id || source._id || ""),
    role: source.role || fallbackUser?.role || [],
    status: source.status || "active",
    picture: source.picture || source.photo || fallbackUser?.picture || null,
    photo: source.photo || source.picture || fallbackUser?.picture || null,
  };
}

export function normalizeClassRecord(classItem, fallbackClassTeacherId = null) {
  if (!classItem) return null;
  const sourceName = classItem.className || classItem.name || "";
  const normalizedName = normalizeClassName(sourceName);
  const classTeacherId =
    classItem.classTeacherId ||
    (classItem.isClassTeacher ? fallbackClassTeacherId : null);
  const studentCount =
    classItem.studentCount ?? classItem.strength ?? classItem.students ?? 0;
  return {
    ...classItem,
    id: String(classItem.id || classItem._id || ""),
    name: normalizedName,
    section: classItem.section || "",
    classTeacherId: classTeacherId ? String(classTeacherId) : null,
    strength: studentCount,
    studentCount,
    attendance: classItem.attendance ?? 0,
  };
}

export function normalizeStudentRecord(student, classLookup = new Map()) {
  if (!student) return null;
  const classId = String(student.classId?._id || student.classId || "");
  const relatedClass = classLookup.get(classId);
  const classLabel =
    student.class || formatClassLabel(relatedClass?.name, relatedClass?.section);
  const className =
    student.className ||
    (relatedClass
      ? `Class ${relatedClass.name}${relatedClass.section ? ` ${relatedClass.section}` : ""}`
      : null);
  return {
    ...student,
    id: String(student.id || student._id || ""),
    classId,
    class: classLabel,
    className,
    feeStatus: student.feeStatus || "pending",
    status: student.status || "active",
  };
}

export function dedupeById(items = []) {
  const deduped = new Map();
  items.forEach((item) => {
    if (item?.id) deduped.set(String(item.id), item);
  });
  return Array.from(deduped.values());
}

// ---------------------------------------------------------------------------
// Path-based student preloading logic
// ---------------------------------------------------------------------------

const STUDENT_PRELOAD_PATH_PATTERNS = [
  /^\/$/,
  /^\/analytics(?:\/|$)/,
  /^\/classes(?:\/|$)/,
  /^\/messaging(?:\/|$)/,
  /^\/settings\/subscription(?:\/|$)/,
  /^\/students\/.+/,
];

export function shouldHydrateStudentsForPath(pathname = "") {
  if (/^\/students\/?$/.test(pathname)) return false;
  return STUDENT_PRELOAD_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
}

// ---------------------------------------------------------------------------
// Data-fetching helpers
// ---------------------------------------------------------------------------

async function fetchStaffAttendanceData() {
  try {
    const attendanceData = await staffAttendanceApi.getAll();
    const transformedData = {};
    if (Array.isArray(attendanceData)) {
      attendanceData.forEach((record) => {
        const { staffId, date, status, checkInTime, checkOutTime, reason } = record;
        if (!transformedData[staffId]) transformedData[staffId] = {};
        transformedData[staffId][date] = {
          status,
          inTime: checkInTime || "-",
          outTime: checkOutTime || "-",
          reason: reason || "",
        };
      });
    }
    return transformedData;
  } catch (error) {
    console.error("Failed to fetch staff attendance:", error);
    return {};
  }
}

async function loadAllStudentsForContext(skipCache = false) {
  const firstPage = await studentsApi.list({ page: 1, limit: 100 }, { skipCache });
  const allStudents = [...(firstPage.data || [])];
  const totalPages = firstPage.pagination?.totalPages || 1;
  if (totalPages > 1) {
    const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
    const results = await Promise.all(
      remainingPages.map((page) => studentsApi.list({ page, limit: 100 }, { skipCache }))
    );
    results.forEach((pageResult) => {
      allStudents.push(...(pageResult.data || []));
    });
  }
  return allStudents;
}

async function fetchTeacherScopedAppData(
  user,
  teacherTimetableYear,
  skipCache = false,
  options = {}
) {
  const includeStudents = options.includeStudents ?? true;
  const [staffProfile, assignedClassRefs] = await Promise.all([
    staffApi.getById(user.id).catch(() => user),
    staffApi.getClasses(user.id).catch(() => []),
    teacherTimetableApi.get(user.id, teacherTimetableYear).catch(() => null),
  ]);

  const normalizedStaffProfile = normalizeStaffMember(staffProfile, user);
  const classMap = new Map();

  (user.classes || []).forEach((classItem) => {
    const normalizedClass = normalizeClassRecord(classItem, user.id);
    if (normalizedClass?.id) classMap.set(normalizedClass.id, normalizedClass);
  });

  (assignedClassRefs || []).forEach((classItem) => {
    const normalizedClass = normalizeClassRecord(classItem, user.id);
    if (normalizedClass?.id) {
      classMap.set(normalizedClass.id, {
        ...(classMap.get(normalizedClass.id) || {}),
        ...normalizedClass,
      });
    }
  });

  const classIds = Array.from(classMap.keys());
  const detailedClasses = await Promise.all(
    classIds.map((classId) => classesApi.getById(classId).catch(() => null))
  );

  detailedClasses.forEach((classItem) => {
    const normalizedClass = normalizeClassRecord(classItem);
    if (normalizedClass?.id) {
      classMap.set(normalizedClass.id, {
        ...(classMap.get(normalizedClass.id) || {}),
        ...normalizedClass,
      });
    }
  });

  const normalizedClasses = Array.from(classMap.values());
  let normalizedStudents = [];

  if (includeStudents) {
    const classLookup = new Map(
      normalizedClasses.map((classItem) => [String(classItem.id), classItem])
    );
    const studentsByClass = await Promise.all(
      normalizedClasses.map((classItem) =>
        classesApi.getStudents(classItem.id).catch(() => [])
      )
    );
    normalizedStudents = dedupeById(
      studentsByClass
        .flat()
        .map((student) => normalizeStudentRecord(student, classLookup))
        .filter(Boolean)
    );
  }

  return {
    staff: normalizedStaffProfile ? [normalizedStaffProfile] : [],
    students: normalizedStudents,
    classes: normalizedClasses,
    staffAttendance: {},
    includeStudents,
  };
}

async function fetchOperationalAppData(user, skipCache = false, options = {}) {
  const includeStudents = options.includeStudents ?? true;
  const [staffProfile, studentsData, classesData] = await Promise.all([
    staffApi.getById(user.id).catch(() => user),
    includeStudents ? loadAllStudentsForContext(skipCache) : Promise.resolve([]),
    classesApi.getAll(skipCache),
  ]);

  const normalizedClasses = (Array.isArray(classesData) ? classesData : [])
    .map((classItem) => normalizeClassRecord(classItem))
    .filter(Boolean);
  const classLookup = new Map(
    normalizedClasses.map((classItem) => [String(classItem.id), classItem])
  );
  const normalizedStudents = (Array.isArray(studentsData) ? studentsData : [])
    .map((student) => normalizeStudentRecord(student, classLookup))
    .filter(Boolean);
  const normalizedStaffProfile = normalizeStaffMember(staffProfile, user);

  return {
    staff: normalizedStaffProfile ? [normalizedStaffProfile] : [],
    students: normalizedStudents,
    classes: normalizedClasses,
    staffAttendance: {},
    includeStudents,
  };
}

async function fetchAdministrativeAppData(skipCache = false, options = {}) {
  const includeStudents = options.includeStudents ?? true;
  const [staffData, studentsData, classesData, nextStaffAttendance] = await Promise.all([
    staffApi.getAll(skipCache),
    includeStudents ? loadAllStudentsForContext(skipCache) : Promise.resolve([]),
    classesApi.getAll(skipCache),
    fetchStaffAttendanceData(),
  ]);

  const normalizedClasses = (Array.isArray(classesData) ? classesData : [])
    .map((classItem) => normalizeClassRecord(classItem))
    .filter(Boolean);
  const classLookup = new Map(
    normalizedClasses.map((classItem) => [String(classItem.id), classItem])
  );
  const normalizedStudents = (Array.isArray(studentsData) ? studentsData : [])
    .map((student) => normalizeStudentRecord(student, classLookup))
    .filter(Boolean);
  const normalizedStaff = (Array.isArray(staffData) ? staffData : [])
    .map((staffMember) => normalizeStaffMember(staffMember))
    .filter(Boolean);

  return {
    staff: normalizedStaff,
    students: normalizedStudents,
    classes: normalizedClasses,
    staffAttendance: nextStaffAttendance,
    includeStudents,
  };
}

export async function fetchRoleAwareAppData({
  user,
  teacherTimetableYear,
  skipCache = false,
  includeStudents = true,
}) {
  if (hasAnyRole(user, ADMIN_LIKE_ROLES)) {
    return fetchAdministrativeAppData(skipCache, { includeStudents });
  }
  if (hasAnyRole(user, TEACHER_ROLES)) {
    return fetchTeacherScopedAppData(user, teacherTimetableYear, skipCache, {
      includeStudents,
    });
  }
  return fetchOperationalAppData(user, skipCache, { includeStudents });
}

export async function fetchAppSettingsData() {
  const [
    schoolData,
    holidaysData,
    leaveTypesData,
    feeHeadsData,
    subjectsData,
    calendarEventsData,
  ] = await Promise.all([
    settingsApi.getSchoolSettings().catch(() => null),
    settingsApi.getHolidays().catch(() => []),
    settingsApi.getLeaveTypes().catch(() => []),
    settingsApi.getFeeHeads().catch(() => []),
    settingsApi.getSubjects().catch(() => []),
    calendarEventsApi.getAll().catch(() => []),
  ]);

  const holidayEvents = (holidaysData || []).map((holiday) => ({
    id: holiday.id,
    title: holiday.name,
    date: holiday.date,
    type: "holiday",
    startTime: "",
    endTime: "",
    allDay: true,
    holidayType: holiday.type || "National",
  }));

  const calendarEvents = (calendarEventsData || []).map((event) => ({
    id: event.id,
    title: event.title,
    date: event.date,
    type: event.type || "event",
    startTime: event.startTime || "",
    endTime: event.endTime || "",
    allDay: event.allDay || false,
  }));

  return {
    schoolSettings: {
      ...initialSchoolSettings,
      ...(schoolData || {}),
      subjects:
        subjectsData.length > 0
          ? subjectsData
          : schoolData?.subjects || initialSchoolSettings.subjects,
    },
    events: [...holidayEvents, ...calendarEvents],
    leaveTypes: leaveTypesData || [],
    feeHeads: feeHeadsData || [],
  };
}
