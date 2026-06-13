import { describe, it, expect } from 'vitest';
import { queryKeys } from './queryKeys';

describe('queryKeys — context queries', () => {
  it('builds app-context keys whose detail extends the base prefix', () => {
    expect(queryKeys.appContext.all).toEqual(['app-context-data']);
    const key = queryKeys.appContext.data(3, 'usr_1', 'admin', true, '2025-26');
    expect(key).toEqual(['app-context-data', 3, 'usr_1', 'admin', true, '2025-26']);
    // Parent prefix must match the detail key for broad invalidation.
    expect(key.slice(0, queryKeys.appContext.all.length)).toEqual(queryKeys.appContext.all);
  });

  it('builds school-settings, calendar and fee-settings keys', () => {
    expect(queryKeys.schoolSettings.data(1, 'u')).toEqual(['school-settings-data', 1, 'u']);
    expect(queryKeys.calendar.data(1, 'u')).toEqual(['calendar-data', 1, 'u']);
    expect(queryKeys.feeSettings.data(1, 'u')).toEqual(['fee-settings-data', 1, 'u']);
  });
});

describe('queryKeys.students', () => {
  it('exposes a base prefix that all child keys start with', () => {
    expect(queryKeys.students.all).toEqual(['students']);
    for (const key of [
      queryKeys.students.list('classA'),
      queryKeys.students.detail('s1'),
      queryKeys.students.attendance('s1'),
      queryKeys.students.results('s1'),
      queryKeys.students.remarks('s1'),
      queryKeys.students.feeHistory('s1'),
    ]) {
      expect(key[0]).toBe('students');
    }
  });

  it('spreads list filters and tags the segment', () => {
    expect(queryKeys.students.list('classA', 'active')).toEqual([
      'students', 'list', 'classA', 'active',
    ]);
  });

  it('coalesces optional attendance/results params to null', () => {
    expect(queryKeys.students.attendance('s1')).toEqual([
      'students', 'attendance', 's1', null, null,
    ]);
    expect(queryKeys.students.attendance('s1', '2026-01-01', '2026-01-31')).toEqual([
      'students', 'attendance', 's1', '2026-01-01', '2026-01-31',
    ]);
    expect(queryKeys.students.results('s1')).toEqual([
      'students', 'results', 's1', null,
    ]);
  });

  it('only appends the remarks category when provided', () => {
    expect(queryKeys.students.remarks('s1')).toEqual(['students', 'remarks', 's1']);
    expect(queryKeys.students.remarks('s1', 'behaviour')).toEqual([
      'students', 'remarks', 's1', 'behaviour',
    ]);
  });
});

describe('queryKeys — fees, dashboard, attendance', () => {
  it('builds studentFees detail and batch keys', () => {
    expect(queryKeys.studentFees.detail('s1', '2025-26', true)).toEqual([
      'studentFees', 's1', '2025-26', true,
    ]);
    expect(queryKeys.studentFees.batch('2025-26', 'ids-hash')).toEqual([
      'studentFees', 'batch', '2025-26', 'ids-hash',
    ]);
  });

  it('builds dashboard feed and attendance snapshot keys', () => {
    expect(queryKeys.dashboard.feed('2025-26')).toEqual(['dashboard', 'feed', '2025-26']);
    expect(queryKeys.attendance.classSnapshot('c1', '2026-06-13')).toEqual([
      'attendance', 'class-snapshot', 'c1', '2026-06-13',
    ]);
  });
});
