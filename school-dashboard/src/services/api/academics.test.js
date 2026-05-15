import { describe, it, expect, vi, beforeEach } from 'vitest';
import { examsApi, homeworkApi, resultsApi, subjectsApi, academicPerformanceApi } from './academics.js';

vi.mock('./core.js', () => ({ request: vi.fn() }));

import { request } from './core.js';

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// examsApi
// ---------------------------------------------------------------------------
describe('examsApi', () => {
  it('getAll — calls /exams with no query string when no params given', () => {
    examsApi.getAll();
    expect(request).toHaveBeenCalledWith('/exams');
  });

  it('getAll — appends query string when params are provided', () => {
    examsApi.getAll({ classId: 'cls1', academicYear: '2025-26' });
    const [url] = request.mock.calls[0];
    expect(url).toMatch(/^\/exams\?/);
    expect(url).toContain('classId=cls1');
    expect(url).toContain('academicYear=2025-26');
  });

  it('getById — calls /exams/:id', () => {
    examsApi.getById('exam123');
    // The implementation forwards the optional `options` arg, so undefined
    // is passed as the second arg when caller omits it.
    expect(request).toHaveBeenCalledWith('/exams/exam123', undefined);
  });

  it('create — POSTs to /exams with serialised body', () => {
    const data = { name: 'Mid-Term', classId: 'cls1' };
    examsApi.create(data);
    expect(request).toHaveBeenCalledWith('/exams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('update — PUTs to /exams/:id with serialised body', () => {
    const data = { name: 'Final' };
    examsApi.update('exam123', data);
    expect(request).toHaveBeenCalledWith('/exams/exam123', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  });

  it('delete — sends DELETE to /exams/:id', () => {
    examsApi.delete('exam123');
    expect(request).toHaveBeenCalledWith('/exams/exam123', { method: 'DELETE' });
  });

  it('getByClass — calls /exams/class/:classId', () => {
    examsApi.getByClass('cls1');
    expect(request).toHaveBeenCalledWith('/exams/class/cls1');
  });

  it('getByStaff — calls /exams/staff/:staffId', () => {
    examsApi.getByStaff('stf1');
    expect(request).toHaveBeenCalledWith('/exams/staff/stf1');
  });

  it('publish — POSTs to /exams/:id/publish', () => {
    examsApi.publish('exam123');
    expect(request).toHaveBeenCalledWith('/exams/exam123/publish', { method: 'POST' });
  });

  it('getResults — GETs /exams/:id/results', () => {
    examsApi.getResults('exam123');
    expect(request).toHaveBeenCalledWith('/exams/exam123/results');
  });

});

// ---------------------------------------------------------------------------
// homeworkApi
// ---------------------------------------------------------------------------
describe('homeworkApi', () => {
  it('getAll — calls /homework with no query string when no params given', () => {
    homeworkApi.getAll();
    expect(request).toHaveBeenCalledWith('/homework');
  });

  it('getAll — appends query string when params are provided', () => {
    homeworkApi.getAll({ classId: 'cls1', subjectId: 'sub1' });
    const [url] = request.mock.calls[0];
    expect(url).toMatch(/^\/homework\?/);
    expect(url).toContain('classId=cls1');
    expect(url).toContain('subjectId=sub1');
  });

  it('getById — calls /homework/:id', () => {
    homeworkApi.getById('hw1');
    expect(request).toHaveBeenCalledWith('/homework/hw1');
  });

  it('create — POSTs to /homework with serialised body', () => {
    const data = { title: 'Chapter 3 exercises' };
    homeworkApi.create(data);
    expect(request).toHaveBeenCalledWith('/homework', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('update — PUTs to /homework/:id with serialised body', () => {
    const data = { title: 'Updated task' };
    homeworkApi.update('hw1', data);
    expect(request).toHaveBeenCalledWith('/homework/hw1', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  });

  it('delete — sends DELETE to /homework/:id', () => {
    homeworkApi.delete('hw1');
    expect(request).toHaveBeenCalledWith('/homework/hw1', { method: 'DELETE' });
  });
});

// ---------------------------------------------------------------------------
// resultsApi
// ---------------------------------------------------------------------------
describe('resultsApi', () => {
  it('create — POSTs to /results with serialised body', () => {
    const data = { studentId: 'stu1', marks: 85 };
    resultsApi.create(data);
    expect(request).toHaveBeenCalledWith('/results', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('bulkCreate — POSTs to /results/bulk with results, examId, classId', () => {
    const results = [{ studentId: 'stu1', marks: 90 }];
    resultsApi.bulkCreate(results, 'exam1', 'cls1');
    expect(request).toHaveBeenCalledWith('/results/bulk', {
      method: 'POST',
      body: JSON.stringify({ results, examId: 'exam1', classId: 'cls1' }),
    });
  });

  it('update — PUTs to /results/:id with serialised body', () => {
    const data = { marks: 92 };
    resultsApi.update('res1', data);
    expect(request).toHaveBeenCalledWith('/results/res1', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  });

  it('getByStudent — calls /students/:studentId/results', () => {
    resultsApi.getByStudent('stu1');
    expect(request).toHaveBeenCalledWith('/students/stu1/results');
  });

  it('getByClassExam — calls /results/class/:classId/exam/:examId', () => {
    resultsApi.getByClassExam('cls1', 'exam1');
    // Implementation forwards optional `options` arg as undefined.
    expect(request).toHaveBeenCalledWith('/results/class/cls1/exam/exam1', undefined);
  });
});

// ---------------------------------------------------------------------------
// subjectsApi
// ---------------------------------------------------------------------------
describe('subjectsApi', () => {
  // Subjects live under /settings/subjects on the backend (school-wide
  // settings), not a top-level /subjects route. The frontend API mirrors this.
  it('getAll — calls /settings/subjects', () => {
    subjectsApi.getAll();
    expect(request).toHaveBeenCalledWith('/settings/subjects');
  });

  it('create — POSTs to /settings/subjects with serialised body', () => {
    const data = { name: 'Mathematics', code: 'MATH' };
    subjectsApi.create(data);
    expect(request).toHaveBeenCalledWith('/settings/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });
});

// ---------------------------------------------------------------------------
// academicPerformanceApi
// ---------------------------------------------------------------------------
describe('academicPerformanceApi', () => {
  it('getStudent — calls /academic-performance/student/:id without query when no params', () => {
    academicPerformanceApi.getStudent('stu1');
    expect(request).toHaveBeenCalledWith('/academic-performance/student/stu1');
  });

  it('getStudent — appends query string when params are provided', () => {
    academicPerformanceApi.getStudent('stu1', { academicYear: '2025-26' });
    const [url] = request.mock.calls[0];
    expect(url).toContain('/academic-performance/student/stu1?');
    expect(url).toContain('academicYear=2025-26');
  });

  it('getReportCard — calls /academic-performance/report-card/:id', () => {
    academicPerformanceApi.getReportCard('stu1');
    expect(request).toHaveBeenCalledWith('/academic-performance/report-card/stu1');
  });

  it('getTrends — calls /academic-performance/trends/:id', () => {
    academicPerformanceApi.getTrends('stu1');
    expect(request).toHaveBeenCalledWith('/academic-performance/trends/stu1');
  });

  it('recalculate — POSTs to /academic-performance/recalculate/:id with serialised body', () => {
    const data = { force: true };
    academicPerformanceApi.recalculate('stu1', data);
    expect(request).toHaveBeenCalledWith('/academic-performance/recalculate/stu1', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });
});
