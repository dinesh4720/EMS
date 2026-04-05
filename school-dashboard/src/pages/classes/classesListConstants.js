export const ITEMS_PER_LOAD = 10;
export const SEARCH_DEBOUNCE_MS = 300;
export const CLASS_DETAILS_BATCH_SIZE = 1;
export const CLASS_DETAILS_BATCH_DELAY_MS = 300;

export const hasOwnKey = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

// Available columns configuration
// Bump this version when AVAILABLE_COLUMNS keys/structure change to invalidate stale localStorage
export const COLUMNS_SCHEMA_VERSION = 3;

export const AVAILABLE_COLUMNS = [
  { key: 'class', labelKey: 'classes.columnClassDetails', label: 'CLASS DETAILS', visible: true, fixed: true },
  { key: 'teacher', labelKey: 'classes.columnClassTeacher', label: 'CLASS TEACHER', visible: true },
  { key: 'strength', labelKey: 'classes.columnStrength', label: 'STRENGTH', visible: true },
  { key: 'attendance', labelKey: 'classes.columnAvgAttendance', label: 'AVG ATTENDANCE', visible: true },
  { key: 'subjects', labelKey: 'classes.columnSubjects', label: 'SUBJECTS', visible: false },
  { key: 'academic', labelKey: 'classes.columnAcademicPerformance', label: 'ACADEMIC PERFORMANCE', visible: false },
  { key: 'status', labelKey: 'classes.columnFeeStatus', label: 'FEE STATUS', visible: false },
  { key: 'actions', labelKey: 'classes.columnActions', label: 'ACTIONS', visible: true, fixed: true },
];
