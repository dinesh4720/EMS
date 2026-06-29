import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./core.js', () => ({ request: vi.fn() }));
vi.mock('../../utils/authSession', () => ({
  getAuthHeaders: vi.fn(() => ({})),
  saveStoredUser: vi.fn(),
}));
vi.mock('../../config/api.js', () => ({ API_URL: 'http://test' }));

import { request } from './core.js';
import {
  libraryApi,
  transportApi,
  hostelApi,
  parentApi,
  reportsApi,
  expensesApi,
} from './extensions.js';

beforeEach(() => {
  vi.clearAllMocks();
  request.mockResolvedValue({ data: 'ok' });
});

// ─── libraryApi ───────────────────────────────────────────────────────────────

describe('libraryApi', () => {
  it('getBooks without params calls /v1/library/books', () => {
    libraryApi.getBooks();
    expect(request).toHaveBeenCalledWith('/v1/library/books');
  });

  it('getBooks with params appends query string', () => {
    libraryApi.getBooks({ genre: 'fiction' });
    const url = request.mock.calls[0][0];
    expect(url).toContain('/v1/library/books?');
    expect(url).toContain('genre=fiction');
  });

  it('getBooks filters out empty and "all" values', () => {
    libraryApi.getBooks({ genre: 'all', title: '', author: 'Rowling' });
    const url = request.mock.calls[0][0];
    expect(url).not.toContain('genre=all');
    expect(url).not.toContain('title=');
    expect(url).toContain('author=Rowling');
  });

  it('getBook calls correct URL for single book', () => {
    libraryApi.getBook('book123');
    expect(request).toHaveBeenCalledWith('/v1/library/books/book123');
  });

  it('createBook sends POST with data', () => {
    const data = { title: 'Harry Potter', author: 'Rowling', isbn: '123456' };
    libraryApi.createBook(data);
    expect(request).toHaveBeenCalledWith('/v1/library/books', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('issueBook sends POST to /v1/library/issues', () => {
    const data = { bookId: 'book1', studentId: 'stu1', dueDate: '2024-12-31' };
    libraryApi.issueBook(data);
    expect(request).toHaveBeenCalledWith('/v1/library/issues', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('returnBook sends PUT to /v1/library/issues/:id/return', () => {
    const data = { returnDate: '2024-12-01', condition: 'good' };
    libraryApi.returnBook('issue99', data);
    expect(request).toHaveBeenCalledWith('/v1/library/issues/issue99/return', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  });

  it('getStats calls /v1/library/stats', () => {
    libraryApi.getStats();
    expect(request).toHaveBeenCalledWith('/v1/library/stats');
  });
});

// ─── transportApi ─────────────────────────────────────────────────────────────

describe('transportApi', () => {
  it('getRoutes without params calls /transport/routes', () => {
    transportApi.getRoutes();
    expect(request).toHaveBeenCalledWith('/transport/routes');
  });

  it('getRoutes with params appends query string', () => {
    transportApi.getRoutes({ status: 'active' });
    const url = request.mock.calls[0][0];
    expect(url).toContain('/transport/routes?');
    expect(url).toContain('status=active');
  });

  it('getVehicles without params calls /transport/vehicles with default limit', () => {
    transportApi.getVehicles();
    expect(request).toHaveBeenCalledWith('/transport/vehicles?limit=500');
  });

  it('getVehicles filters out empty string values', () => {
    transportApi.getVehicles({ type: 'bus', status: '' });
    const url = request.mock.calls[0][0];
    expect(url).toContain('type=bus');
    expect(url).not.toContain('status=');
    expect(url).toContain('limit=500');
  });

  it('getVehicles forwards an explicit limit', () => {
    transportApi.getVehicles({ limit: 25 });
    expect(request).toHaveBeenCalledWith('/transport/vehicles?limit=25');
  });

  it('createRoute sends POST with data', () => {
    const data = { name: 'Route A', stops: ['Stop 1', 'Stop 2'] };
    transportApi.createRoute(data);
    expect(request).toHaveBeenCalledWith('/transport/routes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('assignStudent sends POST to /transport/routes/:routeId/students', () => {
    const data = { studentId: 'stu1', boardingStop: 'Stop 2' };
    transportApi.assignStudent('route1', data);
    expect(request).toHaveBeenCalledWith('/transport/routes/route1/students', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });
});

// ─── hostelApi ────────────────────────────────────────────────────────────────

describe('hostelApi', () => {
  it('getHostels without params calls /hostel/hostels', () => {
    hostelApi.getHostels();
    expect(request).toHaveBeenCalledWith('/hostel/hostels');
  });

  it('getHostels with params appends query string', () => {
    hostelApi.getHostels({ gender: 'boys' });
    expect(request).toHaveBeenCalledWith('/hostel/hostels?gender=boys');
  });

  it('getRooms without params calls /hostel/rooms', () => {
    hostelApi.getRooms();
    expect(request).toHaveBeenCalledWith('/hostel/rooms');
  });

  it('getRooms with params appends query string', () => {
    hostelApi.getRooms({ hostelId: 'h1', floor: '2' });
    const url = request.mock.calls[0][0];
    expect(url).toContain('/hostel/rooms?');
    expect(url).toContain('hostelId=h1');
  });

  it('createAllocation sends POST with data', () => {
    const data = { studentId: 'stu2', roomId: 'room5', startDate: '2024-06-01' };
    hostelApi.createAllocation(data);
    expect(request).toHaveBeenCalledWith('/hostel/allocations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('vacateAllocation sends PUT to /hostel/allocations/:id/vacate', () => {
    const data = { vacateDate: '2024-12-31', reason: 'Year end' };
    hostelApi.vacateAllocation('alloc1', data);
    expect(request).toHaveBeenCalledWith('/hostel/allocations/alloc1/vacate', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  });

  it('getStats calls /hostel/stats', () => {
    hostelApi.getStats();
    expect(request).toHaveBeenCalledWith('/hostel/stats');
  });
});

// ─── parentApi ────────────────────────────────────────────────────────────────

describe('parentApi', () => {
  it('getAll without params calls /parents', () => {
    parentApi.getAll();
    expect(request).toHaveBeenCalledWith('/parents');
  });

  it('getAll with params appends query string', () => {
    parentApi.getAll({ search: 'Kumar' });
    const url = request.mock.calls[0][0];
    expect(url).toContain('/parents?');
    expect(url).toContain('search=Kumar');
  });

  it('getById calls correct URL', () => {
    parentApi.getById('par123');
    expect(request).toHaveBeenCalledWith('/parents/par123');
  });

  it('resetPassword sends POST to /parents/:id/reset-password', () => {
    parentApi.resetPassword('par456');
    expect(request).toHaveBeenCalledWith('/parents/par456/reset-password', { method: 'POST' });
  });

  it('updateStatus sends PUT with status in body', () => {
    parentApi.updateStatus('par789', 'inactive');
    expect(request).toHaveBeenCalledWith('/parents/par789/status', {
      method: 'PUT',
      body: JSON.stringify({ status: 'inactive' }),
    });
  });
});

// ─── reportsApi ───────────────────────────────────────────────────────────────

describe('reportsApi', () => {
  it('studentAttendance without params calls base URL', () => {
    reportsApi.studentAttendance();
    expect(request).toHaveBeenCalledWith('/reports/attendance/student');
  });

  it('studentAttendance with params appends query string', () => {
    reportsApi.studentAttendance({ classId: 'cls1', month: '06' });
    const url = request.mock.calls[0][0];
    expect(url).toContain('/reports/attendance/student?');
    expect(url).toContain('classId=cls1');
    expect(url).toContain('month=06');
  });

  it('feeCollection calls /reports/financial/fee-collection', () => {
    reportsApi.feeCollection({ year: '2024' });
    const url = request.mock.calls[0][0];
    expect(url).toContain('/reports/financial/fee-collection?');
    expect(url).toContain('year=2024');
  });

  it('outstandingDues calls correct endpoint', () => {
    reportsApi.outstandingDues();
    expect(request).toHaveBeenCalledWith('/reports/financial/outstanding-dues');
  });

  it('classResults calls /reports/academic/class-results', () => {
    reportsApi.classResults({ examId: 'exam1' });
    const url = request.mock.calls[0][0];
    expect(url).toContain('/reports/academic/class-results?');
    expect(url).toContain('examId=exam1');
  });

  it('dashboardMetrics with empty params calls base URL without ?', () => {
    reportsApi.dashboardMetrics({});
    expect(request).toHaveBeenCalledWith('/reports/dashboard/metrics');
  });
});

// ─── expensesApi ────────────────────────────────────────────────────────────

describe('expensesApi', () => {
  it('getSummary without params calls /expenses/summary', () => {
    expensesApi.getSummary();
    expect(request).toHaveBeenCalledWith('/expenses/summary');
  });

  it('getSummary forwards status and category filters', () => {
    expensesApi.getSummary({ status: 'approved', category: 'supplies' });
    const url = request.mock.calls[0][0];
    expect(url).toContain('/expenses/summary?');
    expect(url).toContain('status=approved');
    expect(url).toContain('category=supplies');
  });

  it('getSummary drops undefined/null/empty values (no literal "undefined")', () => {
    expensesApi.getSummary({ status: undefined, category: 'utilities' });
    const url = request.mock.calls[0][0];
    expect(url).not.toContain('status=');
    expect(url).not.toContain('undefined');
    expect(url).toContain('category=utilities');
  });
});
