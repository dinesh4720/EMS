export const ITEMS_PER_LOAD = 10;
export const SEARCH_DEBOUNCE_MS = 300;
export const CLASS_DETAILS_BATCH_SIZE = 1;
export const CLASS_DETAILS_BATCH_DELAY_MS = 300;

export const hasOwnKey = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

// Available columns configuration
// Bump this version when AVAILABLE_COLUMNS keys/structure change to invalidate stale localStorage
export const COLUMNS_SCHEMA_VERSION = 2;

export const AVAILABLE_COLUMNS = [
  { key: 'class', labelKey: 'classes.columnClassDetails', label: 'CLASS DETAILS', width: 180, visible: true, fixed: true },
  { key: 'teacher', labelKey: 'classes.columnClassTeacher', label: 'CLASS TEACHER', width: 200, visible: true },
  { key: 'subjects', labelKey: 'classes.columnSubjects', label: 'SUBJECTS', width: 100, visible: true },
  { key: 'strength', labelKey: 'classes.columnStrength', label: 'STRENGTH', width: 120, visible: true },
  { key: 'academic', labelKey: 'classes.columnAcademicPerformance', label: 'ACADEMIC PERFORMANCE', width: 160, visible: true },
  { key: 'attendance', labelKey: 'classes.columnAvgAttendance', label: 'AVG ATTENDANCE', width: 150, visible: true },
  { key: 'status', labelKey: 'classes.columnFeeStatus', label: 'FEE STATUS', width: 140, visible: true },
  { key: 'actions', labelKey: 'classes.columnActions', label: 'ACTIONS', width: 80, visible: true, fixed: true },
];
