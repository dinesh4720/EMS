import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./core.js', () => ({ request: vi.fn() }));
vi.mock('../../utils/requestQueue.js', () => ({ retryRequest: vi.fn() }));
vi.mock('../../utils/authSession', () => ({
  getAuthHeaders: vi.fn(() => ({})),
  clearStoredUser: vi.fn(),
}));
vi.mock('../../config/api.js', () => ({ API_URL: 'http://test' }));

import { request } from './core.js';
import {
  announcementsApi,
  communicationLogsApi,
  remindersApi,
  callsApi,
  visitorsApi,
  frontDeskApi,
} from './operations.js';

beforeEach(() => {
  vi.clearAllMocks();
  request.mockResolvedValue({ data: 'ok' });
});

// ─── announcementsApi ─────────────────────────────────────────────────────────

describe('announcementsApi', () => {
  it('getAll calls /announcements without params', () => {
    announcementsApi.getAll();
    expect(request).toHaveBeenCalledWith('/announcements');
  });

  it('getAll appends query string when params provided', () => {
    announcementsApi.getAll({ page: '1', limit: '10' });
    const url = request.mock.calls[0][0];
    expect(url).toContain('/announcements?');
    expect(url).toContain('page=1');
    expect(url).toContain('limit=10');
  });

  it('getById calls correct URL', () => {
    announcementsApi.getById('ann123');
    expect(request).toHaveBeenCalledWith('/announcements/ann123');
  });

  it('create sends POST with body', () => {
    const payload = { title: 'Test', body: 'Content' };
    announcementsApi.create(payload);
    expect(request).toHaveBeenCalledWith('/announcements', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  });

  it('update sends PUT with id and body', () => {
    const payload = { title: 'Updated' };
    announcementsApi.update('ann456', payload);
    expect(request).toHaveBeenCalledWith('/announcements/ann456', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  });

  it('delete sends DELETE request', () => {
    announcementsApi.delete('ann789');
    expect(request).toHaveBeenCalledWith('/announcements/ann789', { method: 'DELETE' });
  });

  it('send calls /send endpoint with POST', () => {
    announcementsApi.send('ann001');
    expect(request).toHaveBeenCalledWith('/announcements/ann001/send', { method: 'POST' });
  });

  it('resend calls /resend endpoint with empty object when no data', () => {
    announcementsApi.resend('ann001');
    expect(request).toHaveBeenCalledWith('/announcements/ann001/resend', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  });

  it('resend passes provided data', () => {
    const data = { recipients: ['parent'] };
    announcementsApi.resend('ann001', data);
    expect(request).toHaveBeenCalledWith('/announcements/ann001/resend', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('getAnalytics calls /analytics endpoint', () => {
    announcementsApi.getAnalytics('ann002');
    expect(request).toHaveBeenCalledWith('/announcements/ann002/analytics');
  });
});

// ─── communicationLogsApi ─────────────────────────────────────────────────────

describe('communicationLogsApi', () => {
  it('getAll calls /communication-logs without params', () => {
    communicationLogsApi.getAll();
    expect(request).toHaveBeenCalledWith('/communication-logs');
  });

  it('getAll appends query string when params provided', () => {
    communicationLogsApi.getAll({ channel: 'email', page: '1', limit: '20' });
    const url = request.mock.calls[0][0];
    expect(url).toContain('/communication-logs?');
    expect(url).toContain('channel=email');
    expect(url).toContain('page=1');
    expect(url).toContain('limit=20');
  });

  it('getStats calls /communication-logs/stats', () => {
    communicationLogsApi.getStats();
    expect(request).toHaveBeenCalledWith('/communication-logs/stats');
  });
});

// ─── remindersApi ─────────────────────────────────────────────────────────────

describe('remindersApi', () => {
  it('getAll calls /reminders without query when no params', () => {
    remindersApi.getAll();
    expect(request).toHaveBeenCalledWith('/reminders');
  });

  it('getAll appends query string when params provided', () => {
    remindersApi.getAll({ status: 'active' });
    const url = request.mock.calls[0][0];
    expect(url).toContain('/reminders?');
    expect(url).toContain('status=active');
  });

  it('getById calls correct URL', () => {
    remindersApi.getById('rem99');
    expect(request).toHaveBeenCalledWith('/reminders/rem99');
  });

  it('create sends POST', () => {
    const data = { message: 'Pay fees' };
    remindersApi.create(data);
    expect(request).toHaveBeenCalledWith('/reminders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('delete sends DELETE', () => {
    remindersApi.delete('rem11');
    expect(request).toHaveBeenCalledWith('/reminders/rem11', { method: 'DELETE' });
  });

  it('toggle sends active state', () => {
    remindersApi.toggle('rem22', true);
    expect(request).toHaveBeenCalledWith('/reminders/rem22/toggle', {
      method: 'POST',
      body: JSON.stringify({ active: true }),
    });
  });

  it('duplicate calls /duplicate endpoint', () => {
    remindersApi.duplicate('rem33');
    expect(request).toHaveBeenCalledWith('/reminders/rem33/duplicate', { method: 'POST' });
  });

  it('getTemplates without type calls /reminders/templates/all', () => {
    remindersApi.getTemplates();
    expect(request).toHaveBeenCalledWith('/reminders/templates/all');
  });

  it('getTemplates with type appends query param', () => {
    remindersApi.getTemplates('fee');
    expect(request).toHaveBeenCalledWith('/reminders/templates/all?type=fee');
  });
});

// ─── callsApi ─────────────────────────────────────────────────────────────────

describe('callsApi', () => {
  it('initiate sends POST to /calls/initiate', () => {
    const data = { targetUserId: 'user1' };
    callsApi.initiate(data);
    expect(request).toHaveBeenCalledWith('/calls/initiate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('accept sends POST to /calls/:id/accept', () => {
    callsApi.accept('call1');
    expect(request).toHaveBeenCalledWith('/calls/call1/accept', { method: 'POST' });
  });

  it('reject sends POST to /calls/:id/reject', () => {
    callsApi.reject('call2');
    expect(request).toHaveBeenCalledWith('/calls/call2/reject', { method: 'POST' });
  });

  it('end sends reason in body', () => {
    callsApi.end('call3', 'completed');
    expect(request).toHaveBeenCalledWith('/calls/call3/end', {
      method: 'POST',
      body: JSON.stringify({ reason: 'completed' }),
    });
  });

  it('getHistory without limit calls /calls/history/me', () => {
    callsApi.getHistory();
    expect(request).toHaveBeenCalledWith('/calls/history/me');
  });

  it('getHistory with limit appends query param', () => {
    callsApi.getHistory(20);
    expect(request).toHaveBeenCalledWith('/calls/history/me?limit=20');
  });

  it('getMissed calls /calls/missed/me', () => {
    callsApi.getMissed();
    expect(request).toHaveBeenCalledWith('/calls/missed/me');
  });
});

// ─── visitorsApi ──────────────────────────────────────────────────────────────

describe('visitorsApi', () => {
  it('getAll without params calls /visitors', () => {
    visitorsApi.getAll({});
    expect(request).toHaveBeenCalledWith('/visitors');
  });

  it('getAll with params appends query string', () => {
    visitorsApi.getAll({ date: '2024-01-01' });
    const url = request.mock.calls[0][0];
    expect(url).toContain('/visitors?');
    expect(url).toContain('date=2024-01-01');
  });

  it('create sends POST with data', () => {
    const data = { name: 'John Doe', purpose: 'Meeting' };
    visitorsApi.create(data);
    expect(request).toHaveBeenCalledWith('/visitors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('updateStatus sends PUT to /:id', () => {
    visitorsApi.update('vis1', { status: 'checked-out' });
    expect(request).toHaveBeenCalledWith('/visitors/vis1', {
      method: 'PUT',
      body: JSON.stringify({ status: 'checked-out' }),
    });
  });
});

// ─── frontDeskApi ─────────────────────────────────────────────────────────────

describe('frontDeskApi', () => {
  it('getVisitorsToday calls dedicated visitors endpoint', () => {
    frontDeskApi.getVisitorsToday();
    expect(request).toHaveBeenCalledWith('/visitors/today');
  });

  it('createAppointment sends POST with data', () => {
    const data = { visitorName: 'Jane', scheduledAt: '2024-06-01T10:00' };
    frontDeskApi.createAppointment(data);
    expect(request).toHaveBeenCalledWith('/front-desk/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  it('getAdmissions without params calls base URL', () => {
    frontDeskApi.getAdmissions();
    expect(request).toHaveBeenCalledWith('/front-desk/admissions');
  });

  it('getAdmissions with params appends query string', () => {
    frontDeskApi.getAdmissions({ status: 'pending' });
    const url = request.mock.calls[0][0];
    expect(url).toContain('/front-desk/admissions?');
    expect(url).toContain('status=pending');
  });

  it('getCallLogs calls /front-desk/call-logs', () => {
    frontDeskApi.getCallLogs();
    expect(request).toHaveBeenCalledWith('/front-desk/call-logs');
  });
});
