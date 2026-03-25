import { Users, DoorOpen, Calendar, MessageSquare, Phone, TrendingUp, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Overview({ stats, onTabChange }) {
  const { t } = useTranslation();
  const statCards = [
    {
      title: 'Visitors Today',
      value: stats.todayVisitors,
      icon: Users,
      description: 'Total visitors checked in today',
      tab: 'visitors'
    },
    {
      title: 'Gate Passes',
      value: stats.todayGatePasses,
      icon: DoorOpen,
      description: 'Gate passes issued today',
      tab: 'gate-passes'
    },
    {
      title: 'Appointments',
      value: stats.upcomingAppointments,
      icon: Calendar,
      description: 'Scheduled appointments today',
      tab: 'appointments'
    },
    {
      title: 'Calls Today',
      value: stats.todayCalls,
      icon: Phone,
      description: 'Call logs recorded today',
      tab: 'call-logs'
    },
    {
      title: 'Open Feedbacks',
      value: stats.openFeedbacks,
      icon: MessageSquare,
      description: 'Pending feedback responses',
      tab: 'feedbacks'
    },
  ];

  return (
    <div className="space-y-4">
      {/* Attention Required - at top */}
      {stats.openFeedbacks > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <AlertCircle size={16} className="text-gray-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">{t('pages.attentionRequired1')}</h3>
                <p className="text-xs text-gray-500">{t('pages.itemsThatNeedYourAttention')}</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => onTabChange && onTabChange('feedbacks')}
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <MessageSquare size={16} className="text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{t('pages.openFeedbacks')}</p>
                <p className="text-xs text-gray-500">{stats.openFeedbacks} pending response</p>
              </div>
              <div className="text-xs px-2 py-1 rounded-md bg-gray-200 text-gray-700 font-medium">
                Action needed
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
            className="bg-white rounded-lg p-4 border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer"
            onClick={() => onTabChange && onTabChange(stat.tab)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <stat.icon size={16} className="text-gray-600" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800">{stat.value}</h3>
            <p className="text-xs font-medium text-gray-500 mt-0.5">{stat.title}</p>
            <p className="text-xs text-gray-400 mt-2">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Quick Access Section */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <TrendingUp size={16} className="text-gray-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 text-sm">{t('pages.quickAccess')}</h3>
              <p className="text-xs text-gray-500">{t('pages.navigateToModulesQuickly')}</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { label: 'Visitors', icon: Users, tab: 'visitors' },
              { label: 'Gate Pass', icon: DoorOpen, tab: 'gate-passes' },
              { label: 'Appointments', icon: Calendar, tab: 'appointments' },
              { label: 'Feedbacks', icon: MessageSquare, tab: 'feedbacks' },
              { label: 'Call Logs', icon: Phone, tab: 'call-logs' }
            ].map((action) => (
              <button
                key={action.tab}
                className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => onTabChange && onTabChange(action.tab)}
              >
                <action.icon size={20} className="text-gray-600 mb-2" />
                <span className="text-xs text-gray-600 font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
