import { Users, DoorOpen, Calendar, MessageSquare, Phone, TrendingUp, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Hardcoded UI strings — centralised here for future i18n migration
const STRINGS = {
  visitorsToday: 'Visitors Today',
  gatePasses: 'Gate Passes',
  appointments: 'Appointments',
  callsToday: 'Calls Today',
  openFeedbacksTitle: 'Open Feedbacks',
  visitorsDesc: 'Total visitors checked in today',
  gatePassesDesc: 'Gate passes issued today',
  appointmentsDesc: 'Scheduled appointments today',
  callsDesc: 'Call logs recorded today',
  feedbacksDesc: 'Pending feedback responses',
  pendingResponse: 'pending response',
  actionNeeded: 'Action needed',
  visitors: 'Visitors',
  gatePass: 'Gate Pass',
  feedbacks: 'Feedbacks',
  callLogs: 'Call Logs',
};

export default function Overview({ stats, onTabChange }) {
  const { t } = useTranslation();
  const statCards = [
    {
      title: STRINGS.visitorsToday,
      value: stats.todayVisitors,
      icon: Users,
      description: STRINGS.visitorsDesc,
      tab: 'visitors'
    },
    {
      title: STRINGS.gatePasses,
      value: stats.todayGatePasses,
      icon: DoorOpen,
      description: STRINGS.gatePassesDesc,
      tab: 'gate-passes'
    },
    {
      title: STRINGS.appointments,
      value: stats.upcomingAppointments,
      icon: Calendar,
      description: STRINGS.appointmentsDesc,
      tab: 'appointments'
    },
    {
      title: STRINGS.callsToday,
      value: stats.todayCalls,
      icon: Phone,
      description: STRINGS.callsDesc,
      tab: 'call-logs'
    },
    {
      title: STRINGS.openFeedbacksTitle,
      value: stats.openFeedbacks,
      icon: MessageSquare,
      description: STRINGS.feedbacksDesc,
      tab: 'feedbacks'
    },
  ];

  return (
    <div className="space-y-4">
      {/* Attention Required - at top */}
      {stats.openFeedbacks > 0 && (
        <div className="bg-surface rounded-lg border border-border-token overflow-hidden">
          <div className="p-5 border-b border-border-token">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center">
                <AlertCircle size={16} className="text-fg-muted" />
              </div>
              <div>
                <h3 className="font-medium text-fg text-sm">{t('pages.attentionRequired1')}</h3>
                <p className="text-xs text-fg-muted">{t('pages.itemsThatNeedYourAttention')}</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div
              className="flex items-center gap-3 p-3 rounded-lg bg-surface-2 hover:bg-surface-hover cursor-pointer transition-colors"
              role="button"
              tabIndex={0}
              onClick={() => onTabChange && onTabChange('feedbacks')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTabChange && onTabChange('feedbacks'); } }}
            >
              <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center">
                <MessageSquare size={16} className="text-fg-muted" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-fg">{t('pages.openFeedbacks')}</p>
                <p className="text-xs text-fg-muted">{stats.openFeedbacks} {STRINGS.pendingResponse}</p>
              </div>
              <div className="text-xs px-2 py-1 rounded-md bg-surface-2 text-fg font-medium">
                {STRINGS.actionNeeded}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.tab}
            className="bg-surface rounded-lg p-4 border border-divider hover:border-border-token transition-colors cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={() => onTabChange && onTabChange(stat.tab)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTabChange && onTabChange(stat.tab); } }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center">
                <stat.icon size={16} className="text-fg-muted" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-fg">{stat.value}</h3>
            <p className="text-xs font-medium text-fg-muted mt-0.5">{stat.title}</p>
            <p className="text-xs text-fg-faint mt-2">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Quick Access Section */}
      <div className="bg-surface rounded-lg border border-border-token overflow-hidden">
        <div className="p-5 border-b border-border-token">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center">
              <TrendingUp size={16} className="text-fg-muted" />
            </div>
            <div>
              <h3 className="font-medium text-fg text-sm">{t('pages.quickAccess')}</h3>
              <p className="text-xs text-fg-muted">{t('pages.navigateToModulesQuickly')}</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { label: STRINGS.visitors, icon: Users, tab: 'visitors' },
              { label: STRINGS.gatePass, icon: DoorOpen, tab: 'gate-passes' },
              { label: STRINGS.appointments, icon: Calendar, tab: 'appointments' },
              { label: STRINGS.feedbacks, icon: MessageSquare, tab: 'feedbacks' },
              { label: STRINGS.callLogs, icon: Phone, tab: 'call-logs' }
            ].map((action) => (
              <button
                key={action.tab}
                className="flex flex-col items-center justify-center p-4 bg-surface-2 rounded-lg hover:bg-surface-hover transition-colors"
                onClick={() => onTabChange && onTabChange(action.tab)}
              >
                <action.icon size={20} className="text-fg-muted mb-2" />
                <span className="text-xs text-fg-muted font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
