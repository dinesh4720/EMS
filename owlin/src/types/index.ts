// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  loginTime: Date;
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
