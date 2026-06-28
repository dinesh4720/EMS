import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock core.js before importing the module under test.
vi.mock('./core.js', () => ({
  request: vi.fn(),
}));

import { request } from './core.js';
import {
  settingsApi,
  billingApi,
  superAdminApi,
  changelogAdminApi,
  featureFlagsAdminApi,
} from './settings.js';

beforeEach(() => {
  request.mockReset();
  request.mockResolvedValue({});
});

// ---------------------------------------------------------------------------
// settingsApi
// ---------------------------------------------------------------------------
describe('settingsApi — School Settings', () => {
  it('getSchoolSettings calls GET /settings/school', () => {
    settingsApi.getSchoolSettings();
    expect(request).toHaveBeenCalledWith('/settings/school');
  });

  it('updateSchoolSettings calls PUT /settings/school with serialised body', () => {
    const data = { name: 'Springfield Elementary' };
    settingsApi.updateSchoolSettings(data);
    expect(request).toHaveBeenCalledWith('/settings/school', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  });
});

describe('settingsApi — Holidays', () => {
  it('getHolidays calls GET /settings/holidays', () => {
    settingsApi.getHolidays();
    expect(request).toHaveBeenCalledWith('/settings/holidays');
  });

  it('createHoliday calls POST /settings/holidays', () => {
    const data = { name: 'Diwali', date: '2025-10-20' };
    settingsApi.createHoliday(data);
    expect(request).toHaveBeenCalledWith('/settings/holidays', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('updateHoliday calls PUT /settings/holidays/:id', () => {
    const data = { name: 'Updated Holiday' };
    settingsApi.updateHoliday('hol123', data);
    expect(request).toHaveBeenCalledWith('/settings/holidays/hol123', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  });

  it('deleteHoliday calls DELETE /settings/holidays/:id', () => {
    settingsApi.deleteHoliday('hol456');
    expect(request).toHaveBeenCalledWith('/settings/holidays/hol456', {
      method: 'DELETE',
    });
  });
});

describe('settingsApi — Leave Types', () => {
  it('getLeaveTypes calls GET /settings/leave-types', () => {
    settingsApi.getLeaveTypes();
    expect(request).toHaveBeenCalledWith('/settings/leave-types');
  });

  it('createLeaveType calls POST /settings/leave-types', () => {
    const data = { name: 'Sick Leave', days: 10 };
    settingsApi.createLeaveType(data);
    expect(request).toHaveBeenCalledWith('/settings/leave-types', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('updateLeaveType calls PUT /settings/leave-types/:id', () => {
    const data = { days: 12 };
    settingsApi.updateLeaveType('lt789', data);
    expect(request).toHaveBeenCalledWith('/settings/leave-types/lt789', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  });

  it('deleteLeaveType calls DELETE /settings/leave-types/:id', () => {
    settingsApi.deleteLeaveType('lt000');
    expect(request).toHaveBeenCalledWith('/settings/leave-types/lt000', {
      method: 'DELETE',
    });
  });
});

describe('settingsApi — Fee Heads', () => {
  it('getFeeHeads calls GET /settings/fee-heads', () => {
    settingsApi.getFeeHeads();
    expect(request).toHaveBeenCalledWith('/settings/fee-heads');
  });

  it('createFeeHead calls POST /settings/fee-heads', () => {
    const data = { name: 'Tuition', amount: 5000 };
    settingsApi.createFeeHead(data);
    expect(request).toHaveBeenCalledWith('/settings/fee-heads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('updateFeeHead calls PUT /settings/fee-heads/:id', () => {
    const data = { amount: 6000 };
    settingsApi.updateFeeHead('fh001', data);
    expect(request).toHaveBeenCalledWith('/settings/fee-heads/fh001', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  });

  it('deleteFeeHead calls DELETE /settings/fee-heads/:id', () => {
    settingsApi.deleteFeeHead('fh002');
    expect(request).toHaveBeenCalledWith('/settings/fee-heads/fh002', {
      method: 'DELETE',
    });
  });
});

describe('settingsApi — Payroll Settings', () => {
  it('getPayrollSettings calls GET /settings/payroll', () => {
    settingsApi.getPayrollSettings();
    expect(request).toHaveBeenCalledWith('/settings/payroll');
  });

  it('updatePayrollSettings calls PUT /settings/payroll with serialised body', () => {
    const data = { currency: 'INR' };
    settingsApi.updatePayrollSettings(data);
    expect(request).toHaveBeenCalledWith('/settings/payroll', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  });

  it('getPayrollReminder calls GET /settings/payroll/reminder', () => {
    settingsApi.getPayrollReminder();
    expect(request).toHaveBeenCalledWith('/settings/payroll/reminder');
  });
});

describe('settingsApi — Admission Form Config', () => {
  it('getAdmissionFormConfig with no fieldType calls /settings/admission-form-config', () => {
    settingsApi.getAdmissionFormConfig();
    expect(request).toHaveBeenCalledWith('/settings/admission-form-config');
  });

  it('getAdmissionFormConfig with a fieldType appends query string', () => {
    settingsApi.getAdmissionFormConfig('text');
    expect(request).toHaveBeenCalledWith('/settings/admission-form-config?fieldType=text');
  });

  it('bulkUpdateAdmissionFormConfig calls PUT /settings/admission-form-config/bulk', () => {
    const configs = [{ id: '1', label: 'Name' }];
    settingsApi.bulkUpdateAdmissionFormConfig(configs);
    expect(request).toHaveBeenCalledWith('/settings/admission-form-config/bulk', {
      method: 'PUT',
      body: JSON.stringify({ configs }),
    });
  });
});

describe('settingsApi — Document Config', () => {
  it('saveDocumentConfigAtomic calls PUT /settings/document-config/atomic', () => {
    const configs = [{ documentName: 'Birth Certificate', isRequired: true }];
    settingsApi.saveDocumentConfigAtomic(configs);
    expect(request).toHaveBeenCalledWith('/settings/document-config/atomic', {
      method: 'PUT',
      body: JSON.stringify({ configs }),
    });
  });
});

describe('settingsApi — Communication Settings', () => {
  it('getCommunicationSettings calls GET /settings/communication', () => {
    settingsApi.getCommunicationSettings();
    expect(request).toHaveBeenCalledWith('/settings/communication');
  });

  it('updateCommunicationSettings calls PUT /settings/communication', () => {
    const data = { smsEnabled: true };
    settingsApi.updateCommunicationSettings(data);
    expect(request).toHaveBeenCalledWith('/settings/communication', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  });
});

describe('settingsApi — Email Templates', () => {
  it('getEmailTemplates calls GET /settings/email-templates', () => {
    settingsApi.getEmailTemplates();
    expect(request).toHaveBeenCalledWith('/settings/email-templates');
  });

  it('getEmailTemplate calls GET /settings/email-templates/:id', () => {
    settingsApi.getEmailTemplate('et-123');
    expect(request).toHaveBeenCalledWith('/settings/email-templates/et-123');
  });

  it('createEmailTemplate calls POST /settings/email-templates', () => {
    const data = { name: 'Welcome', type: 'welcome', subject: 'Hi', htmlBody: '<p>Hi</p>' };
    settingsApi.createEmailTemplate(data);
    expect(request).toHaveBeenCalledWith('/settings/email-templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('updateEmailTemplate calls PUT /settings/email-templates/:id', () => {
    const data = { subject: 'Updated subject' };
    settingsApi.updateEmailTemplate('et-456', data);
    expect(request).toHaveBeenCalledWith('/settings/email-templates/et-456', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  });

  it('deleteEmailTemplate calls DELETE /settings/email-templates/:id', () => {
    settingsApi.deleteEmailTemplate('et-789');
    expect(request).toHaveBeenCalledWith('/settings/email-templates/et-789', {
      method: 'DELETE',
    });
  });

  it('previewEmailTemplate calls POST /settings/email-templates/:id/preview', () => {
    const data = { sampleData: { student: 'John' } };
    settingsApi.previewEmailTemplate('et-123', data);
    expect(request).toHaveBeenCalledWith('/settings/email-templates/et-123/preview', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });
});

describe('settingsApi — SMS Templates', () => {
  it('getSmsTemplates calls GET /settings/sms-templates', () => {
    settingsApi.getSmsTemplates();
    expect(request).toHaveBeenCalledWith('/settings/sms-templates');
  });

  it('getSmsTemplate calls GET /settings/sms-templates/:id', () => {
    settingsApi.getSmsTemplate('st-123');
    expect(request).toHaveBeenCalledWith('/settings/sms-templates/st-123');
  });

  it('createSmsTemplate calls POST /settings/sms-templates', () => {
    const data = { name: 'Absence Alert', type: 'attendance_alert', body: 'Absent' };
    settingsApi.createSmsTemplate(data);
    expect(request).toHaveBeenCalledWith('/settings/sms-templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('updateSmsTemplate calls PUT /settings/sms-templates/:id', () => {
    const data = { body: 'Updated body' };
    settingsApi.updateSmsTemplate('st-456', data);
    expect(request).toHaveBeenCalledWith('/settings/sms-templates/st-456', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  });

  it('deleteSmsTemplate calls DELETE /settings/sms-templates/:id', () => {
    settingsApi.deleteSmsTemplate('st-789');
    expect(request).toHaveBeenCalledWith('/settings/sms-templates/st-789', {
      method: 'DELETE',
    });
  });
});

// ---------------------------------------------------------------------------
// billingApi
// ---------------------------------------------------------------------------
describe('billingApi', () => {
  it('getSummary calls GET /billing/summary with skipCache true by default', () => {
    billingApi.getSummary();
    expect(request).toHaveBeenCalledWith('/billing/summary', { skipCache: true });
  });

  it('getSummary passes skipCache=false when explicitly set', () => {
    billingApi.getSummary(false);
    expect(request).toHaveBeenCalledWith('/billing/summary', { skipCache: false });
  });

  it('updateAccount calls PUT /billing/account', () => {
    const data = { companyName: 'Acme School' };
    billingApi.updateAccount(data);
    expect(request).toHaveBeenCalledWith('/billing/account', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  });

  it('updateAutoRenew calls POST /billing/auto-renew with autoRenew flag', () => {
    billingApi.updateAutoRenew(true);
    expect(request).toHaveBeenCalledWith('/billing/auto-renew', {
      method: 'POST',
      body: JSON.stringify({ autoRenew: true }),
    });
  });

  it('validateCoupon calls POST /coupons/validate with code', () => {
    billingApi.validateCoupon('SAVE20');
    expect(request).toHaveBeenCalledWith('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code: 'SAVE20' }),
    });
  });

  it('getInvoices with no params calls GET /billing/invoices', () => {
    billingApi.getInvoices();
    expect(request).toHaveBeenCalledWith('/billing/invoices');
  });

  it('getInvoices with params appends query string', () => {
    billingApi.getInvoices({ page: 1, limit: 10 });
    expect(request).toHaveBeenCalledWith('/billing/invoices?page=1&limit=10');
  });

  it('markInvoicePaid calls POST /billing/invoices/:number/mark-paid', () => {
    billingApi.markInvoicePaid('INV-001');
    expect(request).toHaveBeenCalledWith('/billing/invoices/INV-001/mark-paid', {
      method: 'POST',
    });
  });
});

// ---------------------------------------------------------------------------
// superAdminApi
// ---------------------------------------------------------------------------
describe('superAdminApi', () => {
  it('getOverview calls GET /super-admin/overview', () => {
    superAdminApi.getOverview();
    expect(request).toHaveBeenCalledWith('/super-admin/overview');
  });

  it('getSchools calls GET /super-admin/schools with default limit', () => {
    superAdminApi.getSchools();
    expect(request).toHaveBeenCalledWith('/super-admin/schools?limit=500');
  });

  it('getSchools forwards an explicit limit', () => {
    superAdminApi.getSchools({ limit: 50 });
    expect(request).toHaveBeenCalledWith('/super-admin/schools?limit=50');
  });

  it('getSchools merges filters with the default limit', () => {
    superAdminApi.getSchools({ status: 'active' });
    const url = request.mock.calls[0][0];
    expect(url).toContain('/super-admin/schools?');
    expect(url).toContain('status=active');
    expect(url).toContain('limit=500');
  });

  it('createSchool calls POST /super-admin/schools', () => {
    const data = { name: 'New School' };
    superAdminApi.createSchool(data);
    expect(request).toHaveBeenCalledWith('/super-admin/schools', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('updateSchool calls PATCH /super-admin/schools/:id', () => {
    const data = { name: 'Updated School' };
    superAdminApi.updateSchool('sc001', data);
    expect(request).toHaveBeenCalledWith('/super-admin/schools/sc001', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  });

  it('retryJob calls POST /super-admin/jobs/:id/retry', () => {
    superAdminApi.retryJob('job42');
    expect(request).toHaveBeenCalledWith('/super-admin/jobs/job42/retry', {
      method: 'POST',
    });
  });

  it('getGrowthAnalytics calls GET /super-admin/growth-analytics', () => {
    superAdminApi.getGrowthAnalytics();
    expect(request).toHaveBeenCalledWith('/super-admin/growth-analytics');
  });
});

// ---------------------------------------------------------------------------
// changelogAdminApi
// ---------------------------------------------------------------------------
describe('changelogAdminApi', () => {
  it('getAll with no params calls GET /changelog/admin', () => {
    changelogAdminApi.getAll();
    expect(request).toHaveBeenCalledWith('/changelog/admin');
  });

  it('getAll with params appends query string', () => {
    changelogAdminApi.getAll({ page: 2 });
    expect(request).toHaveBeenCalledWith('/changelog/admin?page=2');
  });

  it('create calls POST /changelog/admin', () => {
    const data = { title: 'v2.0 release', body: 'New features.' };
    changelogAdminApi.create(data);
    expect(request).toHaveBeenCalledWith('/changelog/admin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('update calls PUT /changelog/admin/:id', () => {
    const data = { title: 'Updated title' };
    changelogAdminApi.update('cl99', data);
    expect(request).toHaveBeenCalledWith('/changelog/admin/cl99', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  });

  it('delete calls DELETE /changelog/admin/:id', () => {
    changelogAdminApi.delete('cl88');
    expect(request).toHaveBeenCalledWith('/changelog/admin/cl88', {
      method: 'DELETE',
    });
  });
});

// ---------------------------------------------------------------------------
// featureFlagsAdminApi
// ---------------------------------------------------------------------------
describe('featureFlagsAdminApi', () => {
  it('getAll calls GET /feature-flags/admin/all', () => {
    featureFlagsAdminApi.getAll();
    expect(request).toHaveBeenCalledWith('/feature-flags/admin/all');
  });

  it('create calls POST /feature-flags/admin', () => {
    const data = { key: 'new-ui', enabled: false };
    featureFlagsAdminApi.create(data);
    expect(request).toHaveBeenCalledWith('/feature-flags/admin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('update calls PUT /feature-flags/admin/:key', () => {
    const data = { enabled: true };
    featureFlagsAdminApi.update('new-ui', data);
    expect(request).toHaveBeenCalledWith('/feature-flags/admin/new-ui', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  });

  it('delete calls DELETE /feature-flags/admin/:key', () => {
    featureFlagsAdminApi.delete('old-feature');
    expect(request).toHaveBeenCalledWith('/feature-flags/admin/old-feature', {
      method: 'DELETE',
    });
  });

  it('setOverride calls POST /feature-flags/admin/:key/override', () => {
    const data = { schoolId: 'sch001', enabled: true };
    featureFlagsAdminApi.setOverride('beta', data);
    expect(request).toHaveBeenCalledWith('/feature-flags/admin/beta/override', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('removeOverride calls DELETE /feature-flags/admin/:key/override/:schoolId', () => {
    featureFlagsAdminApi.removeOverride('beta', 'sch001');
    expect(request).toHaveBeenCalledWith(
      '/feature-flags/admin/beta/override/sch001',
      { method: 'DELETE' }
    );
  });
});
