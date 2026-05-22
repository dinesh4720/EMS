import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CURRENT_ACADEMIC_YEAR } from '../../utils/constants';

// Mock core.js before importing the module under test.
vi.mock('./core.js', () => ({
  request: vi.fn(),
}));

import { request } from './core.js';
import {
  classesApi,
  classesEnhancedApi,
  attendanceApi,
  staffAttendanceApi,
  timetableApi,
  teacherAssignmentsApi,
  teacherTimetableApi,
} from './classes.js';

beforeEach(() => {
  request.mockReset();
  request.mockResolvedValue({});
});

// ---------------------------------------------------------------------------
// classesApi — CRUD
// ---------------------------------------------------------------------------
describe('classesApi — basic CRUD', () => {
  it('getAll calls GET /classes with default skipCache=false', () => {
    classesApi.getAll();
    expect(request).toHaveBeenCalledWith('/classes', { skipCache: false });
  });

  it('getAll passes skipCache=true when explicitly set', () => {
    classesApi.getAll(true);
    expect(request).toHaveBeenCalledWith('/classes', { skipCache: true });
  });

  it('getPublic calls GET /classes/public', () => {
    classesApi.getPublic();
    expect(request).toHaveBeenCalledWith('/classes/public');
  });

  it('getById calls GET /classes/:id', () => {
    classesApi.getById('cls001');
    expect(request).toHaveBeenCalledWith('/classes/cls001', undefined);
  });

  it('create calls POST /classes with serialised body', () => {
    const data = { name: 'Grade 1 A', capacity: 40 };
    classesApi.create(data);
    expect(request).toHaveBeenCalledWith('/classes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('update calls PUT /classes/:id with serialised body', () => {
    const data = { capacity: 45 };
    classesApi.update('cls001', data);
    expect(request).toHaveBeenCalledWith('/classes/cls001', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  });

  it('delete calls DELETE /classes/:id', () => {
    classesApi.delete('cls002');
    expect(request).toHaveBeenCalledWith('/classes/cls002', { method: 'DELETE' });
  });
});

describe('classesApi — helper endpoints', () => {
  it('getStudents calls GET /classes/:id/students', () => {
    classesApi.getStudents('cls003');
    expect(request).toHaveBeenCalledWith('/classes/cls003/students', undefined);
  });

  it('getNextRollNumber calls GET /classes/:id/next-roll-number', () => {
    classesApi.getNextRollNumber('cls004');
    expect(request).toHaveBeenCalledWith('/classes/cls004/next-roll-number');
  });

  it('checkCapacity calls GET /classes/:id/capacity', () => {
    classesApi.checkCapacity('cls005');
    expect(request).toHaveBeenCalledWith('/classes/cls005/capacity');
  });
});

describe('classesApi — class settings', () => {
  it('getSettings calls GET /classes/:id/settings', () => {
    classesApi.getSettings('cls006');
    expect(request).toHaveBeenCalledWith('/classes/cls006/settings');
  });

  it('updateTag calls PUT /classes/:id/tag with classTag in body', async () => {
    await classesApi.updateTag('cls007', 'Science');
    expect(request).toHaveBeenCalledWith('/classes/cls007/tag', {
      method: 'PUT',
      body: JSON.stringify({ classTag: 'Science' }),
    });
  });

  it('updateSubjects calls PUT /classes/:id/subjects with assignedSubjects array', async () => {
    const subjects = ['Math', 'English'];
    await classesApi.updateSubjects('cls008', subjects);
    expect(request).toHaveBeenCalledWith('/classes/cls008/subjects', {
      method: 'PUT',
      body: JSON.stringify({ assignedSubjects: subjects }),
    });
  });

  it('updateClassTeacher calls PUT /classes/:id/class-teacher with classTeacherId', () => {
    classesApi.updateClassTeacher('cls009', 'teacher99');
    expect(request).toHaveBeenCalledWith('/classes/cls009/class-teacher', {
      method: 'PUT',
      body: JSON.stringify({ classTeacherId: 'teacher99' }),
    });
  });

  it('updateTag re-throws 400 errors as ValidationError', async () => {
    const apiError = { status: 400, message: 'Invalid tag' };
    request.mockRejectedValueOnce(apiError);

    await expect(classesApi.updateTag('cls010', 'bad-tag')).rejects.toMatchObject({
      type: 'ValidationError',
    });
  });
});

// ---------------------------------------------------------------------------
// classesEnhancedApi
// ---------------------------------------------------------------------------
describe('classesEnhancedApi — academic performance', () => {
  it('getAcademicPerformance without academicYear calls correct endpoint', () => {
    classesEnhancedApi.getAcademicPerformance('cls011');
    expect(request).toHaveBeenCalledWith('/classes-enhanced/cls011/academic-performance');
  });

  it('getAcademicPerformance with academicYear appends query param', () => {
    classesEnhancedApi.getAcademicPerformance('cls011', CURRENT_ACADEMIC_YEAR);
    expect(request).toHaveBeenCalledWith(
      `/classes-enhanced/cls011/academic-performance?academicYear=${CURRENT_ACADEMIC_YEAR}`
    );
  });

  it('recalculateAcademicPerformance calls POST endpoint', () => {
    classesEnhancedApi.recalculateAcademicPerformance('cls012');
    expect(request).toHaveBeenCalledWith(
      '/classes-enhanced/cls012/academic-performance/recalculate',
      { method: 'POST' }
    );
  });
});

describe('classesEnhancedApi — activity log', () => {
  it('getActivityLog without params calls correct endpoint', () => {
    classesEnhancedApi.getActivityLog('cls013');
    expect(request).toHaveBeenCalledWith('/classes-enhanced/cls013/activity-log');
  });

  it('getActivityLog with params appends query string', () => {
    classesEnhancedApi.getActivityLog('cls013', { page: 1, limit: 20 });
    expect(request).toHaveBeenCalledWith(
      '/classes-enhanced/cls013/activity-log?page=1&limit=20'
    );
  });

  it('createActivityLog calls POST /classes-enhanced/:id/activity-log', () => {
    const data = { action: 'note', content: 'Field trip planned' };
    classesEnhancedApi.createActivityLog('cls014', data);
    expect(request).toHaveBeenCalledWith('/classes-enhanced/cls014/activity-log', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });
});

describe('classesEnhancedApi — rating & attendance', () => {
  it('getRating without academicYear calls correct endpoint', () => {
    classesEnhancedApi.getRating('cls015');
    expect(request).toHaveBeenCalledWith('/classes-enhanced/cls015/rating');
  });

  it('getAttendanceAnalytics with a period appends query param', () => {
    classesEnhancedApi.getAttendanceAnalytics('cls016', 'week');
    expect(request).toHaveBeenCalledWith(
      '/classes-enhanced/cls016/attendance-analytics?period=week'
    );
  });

  it('getChronicAbsentees with threshold appends query param', () => {
    classesEnhancedApi.getChronicAbsentees('cls017', 5);
    expect(request).toHaveBeenCalledWith(
      '/classes-enhanced/cls017/chronic-absentees?threshold=5'
    );
  });

  it('getTodayStatus calls GET /classes-enhanced/:id/today-status', () => {
    classesEnhancedApi.getTodayStatus('cls018');
    expect(request).toHaveBeenCalledWith('/classes-enhanced/cls018/today-status');
  });
});

describe('classesEnhancedApi — promotion, subjects, announcements', () => {
  it('promoteClass calls POST /classes-enhanced/:id/promote', () => {
    const data = { targetYear: '2025-26' };
    classesEnhancedApi.promoteClass('cls019', data);
    expect(request).toHaveBeenCalledWith('/classes-enhanced/cls019/promote', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('addSubject calls POST /classes-enhanced/:id/subjects', () => {
    const data = { name: 'Physics' };
    classesEnhancedApi.addSubject('cls020', data);
    expect(request).toHaveBeenCalledWith('/classes-enhanced/cls020/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('updateChapter calls PUT /classes-enhanced/chapters/:chapterId', () => {
    const data = { title: 'Kinematics' };
    classesEnhancedApi.updateChapter('ch001', data);
    expect(request).toHaveBeenCalledWith('/classes-enhanced/chapters/ch001', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  });

  it('sendAnnouncement calls POST /classes-enhanced/:id/announcements', () => {
    const data = { message: 'School closed tomorrow.' };
    classesEnhancedApi.sendAnnouncement('cls021', data);
    expect(request).toHaveBeenCalledWith('/classes-enhanced/cls021/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('getMissingSubjects calls GET /classes-enhanced/missing-subjects', () => {
    classesEnhancedApi.getMissingSubjects();
    expect(request).toHaveBeenCalledWith('/classes-enhanced/missing-subjects');
  });
});

// ---------------------------------------------------------------------------
// attendanceApi
// ---------------------------------------------------------------------------
describe('attendanceApi', () => {
  it('mark calls POST /attendance', () => {
    const data = { classId: 'cls001', date: '2025-06-01', records: [] };
    attendanceApi.mark(data);
    expect(request).toHaveBeenCalledWith('/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('markBulk calls POST /attendance/bulk', () => {
    const data = [{ classId: 'cls001', date: '2025-06-01' }];
    attendanceApi.markBulk(data);
    expect(request).toHaveBeenCalledWith('/attendance/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('getTodaySnapshot calls GET /attendance/today-snapshot', () => {
    attendanceApi.getTodaySnapshot();
    expect(request).toHaveBeenCalledWith('/attendance/today-snapshot');
  });

  it('getByClassDate calls GET /attendance/:classId/:date', () => {
    attendanceApi.getByClassDate('cls001', '2025-06-01');
    expect(request).toHaveBeenCalledWith('/attendance/cls001/2025-06-01');
  });

  it('getStudentAttendance with date range appends query params', () => {
    attendanceApi.getStudentAttendance('stu001', '2025-06-01', '2025-06-30');
    expect(request).toHaveBeenCalledWith(
      '/attendance/student/stu001?start=2025-06-01&end=2025-06-30'
    );
  });

  it('getStudentAttendance without dates omits query string', () => {
    attendanceApi.getStudentAttendance('stu002');
    expect(request).toHaveBeenCalledWith('/attendance/student/stu002');
  });
});

// ---------------------------------------------------------------------------
// timetableApi
// ---------------------------------------------------------------------------
describe('timetableApi', () => {
  it('getAll without academicYear calls GET /timetable', () => {
    timetableApi.getAll();
    expect(request).toHaveBeenCalledWith('/timetable');
  });

  it('getAll with academicYear appends query param', () => {
    timetableApi.getAll('2025-26');
    expect(request).toHaveBeenCalledWith('/timetable?academicYear=2025-26');
  });

  it('getByClass calls GET /timetable/:classId', () => {
    timetableApi.getByClass('cls001');
    expect(request).toHaveBeenCalledWith('/timetable/cls001');
  });

  it('create calls POST /timetable', () => {
    const data = { classId: 'cls001', slots: [] };
    timetableApi.create(data);
    expect(request).toHaveBeenCalledWith('/timetable', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('update calls PUT /timetable/:classId', () => {
    const data = { slots: [{ day: 'Monday' }] };
    timetableApi.update('cls001', data);
    expect(request).toHaveBeenCalledWith('/timetable/cls001', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  });

  it('delete without academicYear calls DELETE /timetable/:classId', () => {
    timetableApi.delete('cls001');
    expect(request).toHaveBeenCalledWith('/timetable/cls001', { method: 'DELETE' });
  });

  it('generateAll calls POST /timetable/generate-all', () => {
    const data = { overwrite: true };
    timetableApi.generateAll(data);
    expect(request).toHaveBeenCalledWith('/timetable/generate-all', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });
});

// ---------------------------------------------------------------------------
// teacherAssignmentsApi
// ---------------------------------------------------------------------------
describe('teacherAssignmentsApi', () => {
  it('getAll calls GET /teacher-assignments/:teacherId', () => {
    teacherAssignmentsApi.getAll('t001');
    expect(request).toHaveBeenCalledWith('/teacher-assignments/t001');
  });

  it('create calls POST /teacher-assignments', async () => {
    const data = { teacherId: 't001', classId: 'cls001' };
    await teacherAssignmentsApi.create(data);
    expect(request).toHaveBeenCalledWith('/teacher-assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('update calls PUT /teacher-assignments/:id', async () => {
    const data = { classId: 'cls002' };
    await teacherAssignmentsApi.update('ta001', data);
    expect(request).toHaveBeenCalledWith('/teacher-assignments/ta001', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  });

  it('delete calls DELETE /teacher-assignments/:id?teacherId=...', () => {
    teacherAssignmentsApi.delete('ta002', 't001');
    expect(request).toHaveBeenCalledWith(
      '/teacher-assignments/ta002?teacherId=t001',
      { method: 'DELETE' }
    );
  });

  it('create re-throws 400 errors as ValidationError', async () => {
    request.mockRejectedValueOnce({ status: 400, message: 'Bad input' });
    await expect(teacherAssignmentsApi.create({})).rejects.toMatchObject({
      type: 'ValidationError',
    });
  });
});

// ---------------------------------------------------------------------------
// teacherTimetableApi
// ---------------------------------------------------------------------------
describe('teacherTimetableApi', () => {
  it('get calls GET /teacher-timetable/:teacherId', () => {
    teacherTimetableApi.get('t001');
    expect(request).toHaveBeenCalledWith('/teacher-timetable/t001');
  });

  it('get with academicYear appends query param', () => {
    teacherTimetableApi.get('t001', '2025-26');
    expect(request).toHaveBeenCalledWith('/teacher-timetable/t001?academicYear=2025-26');
  });

  it('create calls POST /teacher-timetable/:teacherId', () => {
    const data = { slots: [] };
    teacherTimetableApi.create('t001', data);
    expect(request).toHaveBeenCalledWith('/teacher-timetable/t001', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('getConflicts calls GET /teacher-timetable/:teacherId/conflicts', () => {
    teacherTimetableApi.getConflicts('t001');
    expect(request).toHaveBeenCalledWith('/teacher-timetable/t001/conflicts');
  });
});
