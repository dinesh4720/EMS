import { describe, it, expect, vi, beforeEach } from 'vitest';
import { staffApi, studentsApi, trashApi } from './staff.js';

vi.mock('./core.js', () => ({ request: vi.fn() }));

import { request } from './core.js';

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// staffApi
// ---------------------------------------------------------------------------
describe('staffApi', () => {
  it('getAll — calls /staff with skipCache false by default', () => {
    staffApi.getAll();
    expect(request).toHaveBeenCalledWith('/staff', { skipCache: false });
  });

  it('getAll — passes skipCache: true when requested', () => {
    staffApi.getAll(true);
    expect(request).toHaveBeenCalledWith('/staff', { skipCache: true });
  });

  it('getById — calls /staff/:id', () => {
    staffApi.getById('stf1');
    expect(request).toHaveBeenCalledWith('/staff/stf1', undefined);
  });

  it('getClasses — calls /staff/:id/classes', () => {
    staffApi.getClasses('stf1');
    expect(request).toHaveBeenCalledWith('/staff/stf1/classes', undefined);
  });

  it('create — POSTs to /staff with serialised body', () => {
    const data = { name: 'Jane Doe', email: 'jane@school.com' };
    staffApi.create(data);
    expect(request).toHaveBeenCalledWith('/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('update — PUTs to /staff/:id with serialised body', () => {
    const data = { phone: '9999999999' };
    staffApi.update('stf1', data);
    expect(request).toHaveBeenCalledWith('/staff/stf1', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  });

  it('updateCredentials — PUTs to /staff/:id/credentials with serialised body', () => {
    const data = { password: 'newpass' };
    staffApi.updateCredentials('stf1', data);
    expect(request).toHaveBeenCalledWith('/staff/stf1/credentials', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  });

  it('delete — sends DELETE to /staff/:id', () => {
    staffApi.delete('stf1');
    expect(request).toHaveBeenCalledWith('/staff/stf1', { method: 'DELETE' });
  });
});

// ---------------------------------------------------------------------------
// studentsApi
// ---------------------------------------------------------------------------
describe('studentsApi', () => {
  it('list — calls /students with no query string when all params are empty', async () => {
    request.mockResolvedValueOnce({ data: [], pagination: {} });
    await studentsApi.list({});
    expect(request).toHaveBeenCalledWith('/students', { skipCache: false });
  });

  it('list — strips null, undefined, empty string, and "all" params', async () => {
    request.mockResolvedValueOnce({ data: [], pagination: {} });
    await studentsApi.list({ classId: null, status: '', grade: 'all', page: undefined });
    const [url] = request.mock.calls[0];
    expect(url).toBe('/students');
  });

  it('list — includes valid params in query string', async () => {
    request.mockResolvedValueOnce({ data: [], pagination: {} });
    await studentsApi.list({ classId: 'cls1', page: 2, limit: 20 });
    const [url] = request.mock.calls[0];
    expect(url).toMatch(/^\/students\?/);
    expect(url).toContain('classId=cls1');
    expect(url).toContain('page=2');
    expect(url).toContain('limit=20');
  });

  it('list — returns { data, pagination } shaped response', async () => {
    const mockStudents = [{ _id: 'stu1' }];
    const mockPagination = { currentPage: 1, totalPages: 1 };
    request.mockResolvedValueOnce({ data: mockStudents, pagination: mockPagination });
    const result = await studentsApi.list({});
    expect(result.data).toEqual(mockStudents);
    expect(result.pagination).toEqual(mockPagination);
  });

  it('list — provides default pagination when backend omits it', async () => {
    request.mockResolvedValueOnce({ data: [{ _id: 's1' }, { _id: 's2' }] });
    const result = await studentsApi.list({ page: 3, limit: 10 });
    expect(result.pagination.currentPage).toBe(3);
    expect(result.pagination.itemsPerPage).toBe(10);
    expect(result.pagination.totalItems).toBe(2);
    expect(result.pagination.hasNextPage).toBe(false);
  });

  it('list — passes skipCache option through to request', async () => {
    request.mockResolvedValueOnce({ data: [], pagination: {} });
    await studentsApi.list({}, { skipCache: true });
    expect(request).toHaveBeenCalledWith('/students', { skipCache: true });
  });

  it('getById — calls /students/:id', () => {
    studentsApi.getById('stu1');
    expect(request).toHaveBeenCalledWith('/students/stu1');
  });

  it('create — POSTs to /students with serialised body', () => {
    const data = { name: 'Ali', classId: 'cls1' };
    studentsApi.create(data);
    expect(request).toHaveBeenCalledWith('/students', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('update — PUTs to /students/:id with serialised body', () => {
    const data = { phone: '8888888888' };
    studentsApi.update('stu1', data);
    expect(request).toHaveBeenCalledWith('/students/stu1', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  });

  it('delete — sends DELETE to /students/:id', () => {
    studentsApi.delete('stu1');
    expect(request).toHaveBeenCalledWith('/students/stu1', { method: 'DELETE' });
  });

  it('pin — PUTs to /students/:id/pin', () => {
    studentsApi.pin('stu1');
    expect(request).toHaveBeenCalledWith('/students/stu1/pin', { method: 'PUT' });
  });

  it('unpin — PUTs to /students/:id/unpin', () => {
    studentsApi.unpin('stu1');
    expect(request).toHaveBeenCalledWith('/students/stu1/unpin', { method: 'PUT' });
  });

  it('getNextAdmissionId — calls /students/next-admission-id', () => {
    studentsApi.getNextAdmissionId();
    expect(request).toHaveBeenCalledWith('/students/next-admission-id');
  });

  it('getResults — calls /students/:id/results with academicYear query param', () => {
    studentsApi.getResults('stu1', '2025-26');
    expect(request).toHaveBeenCalledWith('/students/stu1/results?academicYear=2025-26');
  });

  it('getResults — calls /students/:id/results without query param when academicYear omitted', () => {
    studentsApi.getResults('stu1');
    expect(request).toHaveBeenCalledWith('/students/stu1/results');
  });

  it('getRemarks — appends category param when category is not "all"', () => {
    studentsApi.getRemarks('stu1', 'behaviour');
    expect(request).toHaveBeenCalledWith('/students/stu1/remarks?category=behaviour');
  });

  it('getRemarks — omits category param when category is "all"', () => {
    studentsApi.getRemarks('stu1', 'all');
    expect(request).toHaveBeenCalledWith('/students/stu1/remarks');
  });
});

// ---------------------------------------------------------------------------
// trashApi
// ---------------------------------------------------------------------------
describe('trashApi', () => {
  it('getAll — calls /trash with no query string when params are empty', async () => {
    await trashApi.getAll({});
    expect(request).toHaveBeenCalledWith('/trash');
  });

  it('getAll — appends query string when params are provided', async () => {
    await trashApi.getAll({ type: 'student' });
    const [url] = request.mock.calls[0];
    expect(url).toContain('/trash?');
    expect(url).toContain('type=student');
  });

  it('getStats — calls /trash/stats', async () => {
    await trashApi.getStats();
    expect(request).toHaveBeenCalledWith('/trash/stats');
  });

  it('restore — POSTs to /trash/:id/restore', () => {
    trashApi.restore('trash1');
    expect(request).toHaveBeenCalledWith('/trash/trash1/restore', { method: 'POST' });
  });

  it('permanentDelete — sends DELETE to /trash/:id', () => {
    trashApi.permanentDelete('trash1');
    expect(request).toHaveBeenCalledWith('/trash/trash1', { method: 'DELETE' });
  });

  it('bulkRestore — POSTs to /trash/bulk-restore with trashItemIds', () => {
    const ids = ['t1', 't2'];
    trashApi.bulkRestore(ids);
    expect(request).toHaveBeenCalledWith('/trash/bulk-restore', {
      method: 'POST',
      body: JSON.stringify({ trashItemIds: ids }),
    });
  });

  it('bulkDelete — POSTs to /trash/bulk-delete with trashItemIds', () => {
    // Backend accepts POST for bulk operations (DELETE with body is unreliable
    // across HTTP clients). Implementation uses POST.
    const ids = ['t1', 't2'];
    trashApi.bulkDelete(ids);
    expect(request).toHaveBeenCalledWith('/trash/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ trashItemIds: ids }),
    });
  });
});
