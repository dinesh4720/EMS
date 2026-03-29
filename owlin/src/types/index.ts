// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  loginTime: string;
  avatar?: string;
}

// Event Types
export type EventType =
  | 'click'
  | 'hover'
  | 'scroll'
  | 'navigation'
  | 'form_submit'
  | 'form_focus'
  | 'api_call'
  | 'error'
  | 'custom';

export interface Event {
  id: string;
  type: EventType;
  timestamp: Date;
  userId: string;
  sessionId: string;
  elementType?: string;
  elementId?: string;
  elementText?: string;
  page: string;
  action: string;
  data?: Record<string, unknown>;
  metadata?: {
    viewport?: {
      width: number;
      height: number;
    };
    userAgent?: string;
    referrer?: string;
  };
}

// Session Types
export interface Session {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  events: Event[];
  duration?: number; // in seconds
  pageViews?: number;
  isActive: boolean;
}

// Analytics Types
export interface AnalyticsFilter {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  eventType?: EventType;
  page?: string;
  action?: string;
}

export interface AnalyticsData {
  totalEvents: number;
  totalSessions: number;
  uniqueUsers: number;
  averageSessionDuration: number;
  topPages: Array<{
    page: string;
    views: number;
  }>;
  topEvents: Array<{
    type: EventType;
    count: number;
  }>;
  hourlyActivity: Array<{
    hour: number;
    count: number;
  }>;
}

// Real-time Types
export interface LiveEvent extends Event {
  userName: string;
  userRole: string;
}

export interface LiveSession {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  startTime: Date;
  currentPage: string;
  eventCount: number;
}

// Dashboard Types
export interface DashboardStats {
  totalUsers: number;
  activeSessions: number;
  eventsToday: number;
  eventsThisHour: number;
}

export interface UserActivity {
  userId: string;
  userName: string;
  sessionsCount: number;
  eventsCount: number;
  lastActivity: Date;
}

// ── Project Management Types ────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  description: string | null;
  apiKeyPrefix: string;
  status: 'active' | 'suspended' | 'archived';
  rateLimitPerMinute: number;
  quotaEventsPerDay: number;
  retentionDays: number;
  totalEvents: number;
  lastEventAt: string | null;
  ownerEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectCreateResponse {
  project: Project;
  rawApiKey: string;
}

// ── Access Log Types ────────────────────────────────────────────────────────

export interface AccessLog {
  id: string;
  projectId: string | null;
  projectName: string | null;
  timestamp: string;
  method: string;
  endpoint: string;
  statusCode: number;
  responseTimeMs: number;
  ip: string;
  userAgent: string;
  eventCount: number | null;
  errorMessage: string | null;
}

export interface AccessLogStats {
  totalRequests: number;
  errorRate: number;
  avgResponseTime: number;
  requestsLastHour: number;
  byProject: Array<{ projectId: string; name: string; count: number }>;
  byEndpoint: Array<{ endpoint: string; count: number }>;
}

// ── Error Tracking Types ────────────────────────────────────────────────────

export interface ErrorGroup {
  id: string;
  projectId: string;
  fingerprint: string;
  message: string;
  file: string | null;
  line: number | null;
  col: number | null;
  module: string;
  count: number;
  userCount: number;
  status: 'unresolved' | 'resolved' | 'ignored';
  firstSeen: string;
  lastSeen: string;
  lastPage: string | null;
  lastUserAction: string | null;
}

export interface ErrorIncident {
  id: string;
  source: 'frontend' | 'backend' | 'network';
  severity: string;
  message: string;
  stackTrace: string | null;
  file: string | null;
  line: number | null;
  module: string | null;
  page: string | null;
  action: string | null;
  apiError: Record<string, unknown> | null;
  consoleErrors: Array<Record<string, unknown>> | null;
  breadcrumbs: Array<{ time: string; type: string; detail: string }> | null;
  userId: string | null;
  userName: string | null;
  userRole: string | null;
  browser: string | null;
  os: string | null;
  viewport: { width: number; height: number } | null;
  screenshotUrl: string | null;
  timestamp: string;
}

export interface ErrorStats {
  totalGroups: number;
  unresolved: number;
  incidentsToday: number;
  byModule: Array<{ module: string; count: number }>;
  byPage: Array<{ page: string; count: number }>;
}
