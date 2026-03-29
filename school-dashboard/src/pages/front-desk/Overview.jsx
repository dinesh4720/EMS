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
        <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <AlertCircle size={16} className="text-gray-600 dark:text-zinc-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('pages.attentionRequired1')}</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.itemsThatNeedYourAttention')}</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
              role="button"
              tabIndex={0}
              onClick={() => onTabChange && onTabChange('feedbacks')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTabChange && onTabChange('feedbacks'); } }}
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <MessageSquare size={16} className="text-gray-600 dark:text-zinc-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.openFeedbacks')}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">{stats.openFeedbacks} {STRINGS.pendingResponse}</p>
              </div>
              <div className="text-xs px-2 py-1 rounded-md bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-medium">
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
            className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 transition-colors cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={() => onTabChange && onTabChange(stat.tab)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTabChange && onTabChange(stat.tab); } }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <stat.icon size={16} className="text-gray-600 dark:text-zinc-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-zinc-100">{stat.value}</h3>
            <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mt-0.5">{stat.title}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-2">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Quick Access Section */}
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <TrendingUp size={16} className="text-gray-600 dark:text-zinc-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('pages.quickAccess')}</h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.navigateToModulesQuickly')}</p>
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
                className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                onClick={() => onTabChange && onTabChange(action.tab)}
              >
                <action.icon size={20} className="text-gray-600 dark:text-zinc-400 mb-2" />
                <span className="text-xs text-gray-600 dark:text-zinc-400 font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
