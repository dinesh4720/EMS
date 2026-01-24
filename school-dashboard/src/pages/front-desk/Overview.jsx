import { Card, CardBody } from '@heroui/react';
import { Users, UserPlus, DoorOpen, Calendar, MessageSquare, Phone, TrendingUp, Activity } from 'lucide-react';

export default function Overview({ stats, onTabChange }) {
  const statCards = [
    {
      title: 'Visitors Today',
      value: stats.todayVisitors,
      icon: <Users size={24} />,
      color: 'primary',
      bgColor: 'bg-primary-50',
      iconColor: 'text-primary',
      description: 'Total visitors checked in today'
    },
    {
      title: 'Gate Passes Today',
      value: stats.todayGatePasses,
      icon: <DoorOpen size={24} />,
      color: 'warning',
      bgColor: 'bg-warning-50',
      iconColor: 'text-warning',
      description: 'Gate passes issued today'
    },
    {
      title: 'Appointments Today',
      value: stats.upcomingAppointments,
      icon: <Calendar size={24} />,
      color: 'success',
      bgColor: 'bg-success-50',
      iconColor: 'text-success',
      description: 'Scheduled appointments today'
    },
    {
      title: 'Active Admissions',
      value: stats.activeAdmissions,
      icon: <UserPlus size={24} />,
      color: 'secondary',
      bgColor: 'bg-secondary-50',
      iconColor: 'text-secondary',
      description: 'Admission inquiries in progress'
    },
    {
      title: 'Open Feedbacks',
      value: stats.openFeedbacks,
      icon: <MessageSquare size={24} />,
      color: 'danger',
      bgColor: 'bg-danger-50',
      iconColor: 'text-danger',
      description: 'Pending feedback responses'
    },
    {
      title: 'Calls Today',
      value: stats.todayCalls,
      icon: <Phone size={24} />,
      color: 'default',
      bgColor: 'bg-default-100',
      iconColor: 'text-default-700',
      description: 'Call logs recorded today'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <Card
            key={index}
            className="border border-default-200 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <CardBody className="gap-3">
              <div className="flex items-start justify-between">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <div className={stat.iconColor}>{stat.icon}</div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-default-900">{stat.value}</p>
                  <p className="text-sm text-default-500 mt-1">{stat.title}</p>
                </div>
              </div>
              <p className="text-xs text-default-400 mt-2">{stat.description}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Quick Actions Card */}
      <Card className="border border-default-200 shadow-sm">
        <CardBody className="gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary-400 to-primary-600 p-3 rounded-lg">
              <Activity className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-default-900">Quick Actions</h3>
              <p className="text-sm text-default-500">Use the "New" button above to create new entries</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-4">
            {[
              { label: 'Visitor', icon: Users, color: 'text-primary', tab: 'visitors' },
              { label: 'Admission', icon: UserPlus, color: 'text-secondary', tab: 'admissions' },
              { label: 'Gate Pass', icon: DoorOpen, color: 'text-warning', tab: 'gate-passes' },
              { label: 'Appointment', icon: Calendar, color: 'text-success', tab: 'appointments' },
              { label: 'Feedback', icon: MessageSquare, color: 'text-danger', tab: 'feedbacks' },
              { label: 'Call Log', icon: Phone, color: 'text-default-700', tab: 'call-logs' }
            ].map((action, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-center p-4 bg-default-50 rounded-lg hover:bg-default-100 transition-colors cursor-pointer"
                onClick={() => onTabChange && onTabChange(action.tab)}
              >
                <action.icon size={20} className={`${action.color} mb-2`} />
                <span className="text-xs text-default-600">{action.label}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
