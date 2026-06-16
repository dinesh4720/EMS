import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  feesApi,
  studentFeesApi,
  payrollApi,
  notificationsApi,
} from './fees.js';

vi.mock('./core.js', () => ({ request: vi.fn() }));

// API_URL is used only in payrollApi.exportPayroll which touches window.location —
// stub the config module so the import doesn't fail in a test environment.
vi.mock('../../config/api.js', () => ({ API_URL: 'http://localhost:3002/api' }));

import { request } from './core.js';

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// feesApi — Payments
// ---------------------------------------------------------------------------
describe('feesApi — payments', () => {
  it('getPayments — calls /fees/payments with no query string when filters are empty', async () => {
    request.mockResolvedValue({ payments: [], pagination: {} });
    await feesApi.getPayments({});
    expect(request).toHaveBeenCalledWith('/fees/payments');
  });

  it('getPayments — appends filters as query string', async () => {
    request.mockResolvedValue({ payments: [], pagination: {} });
    await feesApi.getPayments({ classId: 'cls1', academicYear: '2025-26' });
    const [url] = request.mock.calls[0];
    expect(url).toMatch(/^\/fees\/payments\?/);
    expect(url).toContain('classId=cls1');
    expect(url).toContain('academicYear=2025-26');
  });

  it('getPayments — preserves pagination metadata from paginated response', async () => {
    const mockPayments = [{ _id: 'p1', amount: 100 }];
    const mockPagination = { total: 1, page: 1, limit: 20 };
    request.mockResolvedValue({ payments: mockPayments, pagination: mockPagination });
    const result = await feesApi.getPayments({});
    expect(result).toEqual({ payments: mockPayments, pagination: mockPagination });
  });

  it('getPayments — normalizes raw array into { payments, pagination } shape', async () => {
    const mockPayments = [{ _id: 'p1', amount: 100 }];
    request.mockResolvedValue(mockPayments);
    const result = await feesApi.getPayments({});
    expect(result).toEqual({ payments: mockPayments, pagination: null });
  });

  it('getPaymentById — calls /fees/payments/:id', () => {
    feesApi.getPaymentById('pay1');
    expect(request).toHaveBeenCalledWith('/fees/payments/pay1');
  });

  it('getStudentTotalPaid — calls /fees/payments/total-paid with studentId', async () => {
    request.mockResolvedValue({ totalPaid: 12500, paymentCount: 7 });
    const result = await feesApi.getStudentTotalPaid('stu1');
    expect(request).toHaveBeenCalledWith('/fees/payments/total-paid?studentId=stu1');
    expect(result).toEqual({ totalPaid: 12500, paymentCount: 7 });
  });

  it('getStudentTotalPaid — short-circuits to a zero total when no studentId is provided', async () => {
    const result = await feesApi.getStudentTotalPaid('');
    expect(request).not.toHaveBeenCalled();
    expect(result).toEqual({ totalPaid: 0, paymentCount: 0 });
  });

  it('createPayment — POSTs to /fees/payments with serialised body', () => {
    const data = { studentId: 'stu1', amount: 5000 };
    feesApi.createPayment(data);
    expect(request).toHaveBeenCalledWith('/fees/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('updatePayment — PUTs to /fees/payments/:id with serialised body', () => {
    const data = { amount: 6000 };
    feesApi.updatePayment('pay1', data);
    expect(request).toHaveBeenCalledWith('/fees/payments/pay1', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  });

  it('deletePayment — sends DELETE to /fees/payments/:id', () => {
    feesApi.deletePayment('pay1');
    expect(request).toHaveBeenCalledWith('/fees/payments/pay1', { method: 'DELETE' });
  });
});

// ---------------------------------------------------------------------------
// feesApi — Defaulters, Summary, Refunds, Structure
// ---------------------------------------------------------------------------
describe('feesApi — defaulters, summary, refunds, structure', () => {
  it('getDefaulters — calls /student-fees/defaulters with no query string when filters empty', () => {
    feesApi.getDefaulters({});
    expect(request).toHaveBeenCalledWith('/student-fees/defaulters');
  });

  it('getDefaulters — appends filters as query string', () => {
    feesApi.getDefaulters({ classId: 'cls1' });
    const [url] = request.mock.calls[0];
    expect(url).toMatch(/^\/student-fees\/defaulters\?/);
    expect(url).toContain('classId=cls1');
  });

  it('getStudentSummary — calls /students/:id/fee-summary with academicYear', () => {
    feesApi.getStudentSummary('stu1', '2025-26');
    expect(request).toHaveBeenCalledWith('/students/stu1/fee-summary?academicYear=2025-26');
  });

  it('getStudentSummary — omits query param when academicYear is not provided', () => {
    feesApi.getStudentSummary('stu1');
    expect(request).toHaveBeenCalledWith('/students/stu1/fee-summary');
  });

  it('getRefunds — calls /fees/refunds with filters', () => {
    feesApi.getRefunds({ status: 'pending' });
    const [url] = request.mock.calls[0];
    expect(url).toContain('/fees/refunds?');
    expect(url).toContain('status=pending');
  });

  it('createRefund — POSTs to /fees/refunds with serialised body', () => {
    const data = { paymentId: 'pay1', reason: 'duplicate' };
    feesApi.createRefund(data);
    expect(request).toHaveBeenCalledWith('/fees/refunds', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('approveRefund — PUTs to /fees/refunds/:id/approve', () => {
    feesApi.approveRefund('ref1', { approvedBy: 'admin' });
    expect(request).toHaveBeenCalledWith('/fees/refunds/ref1/approve', {
      method: 'PUT',
      body: JSON.stringify({ approvedBy: 'admin' }),
    });
  });

  it('rejectRefund — PUTs to /fees/refunds/:id/reject', () => {
    feesApi.rejectRefund('ref1', { reason: 'invalid' });
    expect(request).toHaveBeenCalledWith('/fees/refunds/ref1/reject', {
      method: 'PUT',
      body: JSON.stringify({ reason: 'invalid' }),
    });
  });

  it('deleteRefund — sends DELETE to /fees/refunds/:id', () => {
    feesApi.deleteRefund('ref1');
    expect(request).toHaveBeenCalledWith('/fees/refunds/ref1', { method: 'DELETE' });
  });

  it('getFeeStructure — calls /fee-structure/class/:classId with academicYear', () => {
    feesApi.getFeeStructure('cls1', '2025-26');
    expect(request).toHaveBeenCalledWith('/fee-structure/class/cls1?academicYear=2025-26');
  });

  it('getFeeStructure — calls /fee-structure/class/:classId without query when academicYear omitted', () => {
    feesApi.getFeeStructure('cls1');
    expect(request).toHaveBeenCalledWith('/fee-structure/class/cls1');
  });

  it('saveFeeStructure — POSTs to /fee-structure with serialised body', () => {
    const data = { classId: 'cls1', heads: [] };
    feesApi.saveFeeStructure(data);
    expect(request).toHaveBeenCalledWith('/fee-structure', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });
});

// ---------------------------------------------------------------------------
// studentFeesApi
// ---------------------------------------------------------------------------
describe('studentFeesApi', () => {
  it('getByStudent — calls /student-fees/student/:id with academicYear', () => {
    studentFeesApi.getByStudent('stu1', '2025-26');
    expect(request).toHaveBeenCalledWith('/student-fees/student/stu1?academicYear=2025-26');
  });

  it('getByStudent — calls /student-fees/student/:id without query when academicYear omitted', () => {
    studentFeesApi.getByStudent('stu1');
    expect(request).toHaveBeenCalledWith('/student-fees/student/stu1');
  });

  it('getBatch — POSTs to /student-fees/batch with studentIds and academicYear', () => {
    const ids = ['stu1', 'stu2'];
    studentFeesApi.getBatch(ids, '2025-26');
    expect(request).toHaveBeenCalledWith('/student-fees/batch', {
      method: 'POST',
      body: JSON.stringify({ studentIds: ids, academicYear: '2025-26' }),
    });
  });

  it('initialize — POSTs to /student-fees/initialize/:id with academicYear', () => {
    studentFeesApi.initialize('stu1', '2025-26');
    expect(request).toHaveBeenCalledWith('/student-fees/initialize/stu1', {
      method: 'POST',
      body: JSON.stringify({ academicYear: '2025-26' }),
    });
  });

  it('recordPayment — POSTs to /student-fees/student/:id/payment with serialised body', () => {
    const data = { amount: 2000, mode: 'cash' };
    studentFeesApi.recordPayment('stu1', data);
    expect(request).toHaveBeenCalledWith('/student-fees/student/stu1/payment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });
});

// ---------------------------------------------------------------------------
// payrollApi
// ---------------------------------------------------------------------------
describe('payrollApi', () => {
  it('getDashboard — calls /payroll/dashboard/:month/:year', () => {
    payrollApi.getDashboard(3, 2026);
    expect(request).toHaveBeenCalledWith('/payroll/dashboard/3/2026');
  });

  it('getRecords — calls /payroll/records with query string', () => {
    payrollApi.getRecords({ month: 3, year: 2026 });
    const [url] = request.mock.calls[0];
    expect(url).toMatch(/^\/payroll\/records\?/);
    expect(url).toContain('month=3');
    expect(url).toContain('year=2026');
  });

  it('getRecords — calls /payroll/records without query string when params are empty', () => {
    payrollApi.getRecords({});
    expect(request).toHaveBeenCalledWith('/payroll/records');
  });

  it('validatePayroll — POSTs to /payroll/validate with serialised body', () => {
    const data = { month: 3, year: 2026 };
    payrollApi.validatePayroll(data);
    expect(request).toHaveBeenCalledWith('/payroll/validate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('runPayroll — POSTs to /payroll/run with serialised body', () => {
    const data = { month: 3, year: 2026, staffIds: ['stf1'] };
    payrollApi.runPayroll(data);
    expect(request).toHaveBeenCalledWith('/payroll/run', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('markAsPaid — PUTs to /payroll/records/:id/pay with serialised body', () => {
    payrollApi.markAsPaid('rec1', { paidOn: '2026-03-01' });
    expect(request).toHaveBeenCalledWith('/payroll/records/rec1/pay', {
      method: 'PUT',
      body: JSON.stringify({ paidOn: '2026-03-01' }),
    });
  });

  it('reversePayment — PUTs to /payroll/records/:id/reverse with serialised body', () => {
    payrollApi.reversePayment('rec1', { reason: 'error' });
    expect(request).toHaveBeenCalledWith('/payroll/records/rec1/reverse', {
      method: 'PUT',
      body: JSON.stringify({ reason: 'error' }),
    });
  });

  it('bulkPay — POSTs to /payroll/records/bulk-pay with serialised body', () => {
    const data = { recordIds: ['r1', 'r2'] };
    payrollApi.bulkPay(data);
    expect(request).toHaveBeenCalledWith('/payroll/records/bulk-pay', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('getAuditLogs — calls /payroll/audit-logs with query string', () => {
    payrollApi.getAuditLogs({ month: 3 });
    const [url] = request.mock.calls[0];
    expect(url).toMatch(/^\/payroll\/audit-logs\?/);
    expect(url).toContain('month=3');
  });
});

// ---------------------------------------------------------------------------
// notificationsApi
// ---------------------------------------------------------------------------
describe('notificationsApi', () => {
  it('getAll — calls /notifications with no query string when no params', () => {
    notificationsApi.getAll();
    expect(request).toHaveBeenCalledWith('/notifications');
  });

  it('getAll — appends query params when provided', () => {
    notificationsApi.getAll({ unreadOnly: 'true', type: 'fee_due' });
    const [url] = request.mock.calls[0];
    expect(url).toContain('/notifications?');
    expect(url).toContain('unreadOnly=true');
    expect(url).toContain('type=fee_due');
  });

  it('getUnreadCount — calls /notifications/unread-count', () => {
    notificationsApi.getUnreadCount();
    expect(request).toHaveBeenCalledWith('/notifications/unread-count');
  });

  it('markAsRead — PUTs to /notifications/:id/read', () => {
    notificationsApi.markAsRead('notif1');
    expect(request).toHaveBeenCalledWith('/notifications/notif1/read', { method: 'PUT' });
  });

  it('markAllAsRead — PUTs to /notifications/read-all', () => {
    notificationsApi.markAllAsRead();
    expect(request).toHaveBeenCalledWith('/notifications/read-all', { method: 'PUT' });
  });

  it('delete — sends DELETE to /notifications/:id', () => {
    notificationsApi.delete('notif1');
    expect(request).toHaveBeenCalledWith('/notifications/notif1', { method: 'DELETE' });
  });

  it('clearAll — sends DELETE to /notifications/clear-all', () => {
    notificationsApi.clearAll();
    expect(request).toHaveBeenCalledWith('/notifications/clear-all', { method: 'DELETE' });
  });

  it('getPreferences — calls /notifications/preferences/me', () => {
    notificationsApi.getPreferences();
    expect(request).toHaveBeenCalledWith('/notifications/preferences/me');
  });

  it('updatePreferences — PUTs to /notifications/preferences/me with serialised body', () => {
    const data = { email: true, sms: false };
    notificationsApi.updatePreferences(data);
    expect(request).toHaveBeenCalledWith('/notifications/preferences/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  });

  it('resetPreferences — POSTs to /notifications/preferences/reset', () => {
    notificationsApi.resetPreferences();
    expect(request).toHaveBeenCalledWith('/notifications/preferences/reset', { method: 'POST' });
  });
});
