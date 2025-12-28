import { Card, CardBody, Button, Chip } from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, DoorOpen, Calendar, MessageSquare, Phone, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function FrontDeskDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todayVisitors: 0,
    activeAdmissions: 0,
    todayGatePasses: 0,
    upcomingAppointments: 0,
    openFeedbacks: 0,
    todayCalls: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [visitors, admissions, gatePasses, appointments, feedbacks, callLogs] = await Promise.all([
        api.get('/front-desk/visitors/today'),
        api.get('/front-desk/admissions?status=inquiry-logged'),
        api.get('/front-desk/gate-passes/today'),
        api.get('/front-desk/appointments?status=scheduled'),
        api.get('/front-desk/feedbacks?status=open'),
        api.get('/front-desk/call-logs'),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const todayCalls = callLogs.data.filter(log => log.dateTime.startsWith(today));

      setStats({
        todayVisitors: visitors.data.length,
        activeAdmissions: admissions.data.length,
        todayGatePasses: gatePasses.data.length,
        upcomingAppointments: appointments.data.length,
        openFeedbacks: feedbacks.data.length,
        todayCalls: todayCalls.length,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const modules = [
    {
      title: 'Visitor Log',
      description: 'Track visitors checking in and out',
      icon: <Users size={24} />,
      color: 'primary',
      count: stats.todayVisitors,
      label: 'Today',
      path: '/front-desk/visitors',
    },
    {
      title: 'Admissions',
      description: 'Manage admission inquiries and applications',
      icon: <UserPlus size={24} />,
      color: 'secondary',
      count: stats.activeAdmissions,
      label: 'Active',
      path: '/front-desk/admissions',
    },
    {
      title: 'Gate Pass',
      description: 'Issue gate passes for students and staff',
      icon: <DoorOpen size={24} />,
      color: 'success',
      count: stats.todayGatePasses,
      label: 'Today',
      path: '/front-desk/gate-passes',
    },
    {
      title: 'Appointments',
      description: 'Schedule and manage appointments',
      icon: <Calendar size={24} />,
      color: 'warning',
      count: stats.upcomingAppointments,
      label: 'Upcoming',
      path: '/front-desk/appointments',
    },
    {
      title: 'Feedbacks',
      description: 'Collect and manage feedback',
      icon: <MessageSquare size={24} />,
      color: 'danger',
      count: stats.openFeedbacks,
      label: 'Open',
      path: '/front-desk/feedbacks',
    },
    {
      title: 'Call Logs',
      description: 'Track and manage call records',
      icon: <Phone size={24} />,
      color: 'default',
      count: stats.todayCalls,
      label: 'Today',
      path: '/front-desk/call-logs',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Front Desk</h1>
          <p className="text-sm text-default-500 mt-1">Manage visitors, admissions, and front desk operations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((module, index) => (
          <Card
            key={index}
            isPressable
            onPress={() => navigate(module.path)}
            className="hover:scale-[1.02] transition-transform"
          >
            <CardBody className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${module.color}/10`}>
                  <div className={`text-${module.color}`}>{module.icon}</div>
                </div>
                <Chip size="sm" variant="flat" color={module.color}>
                  {module.count} {module.label}
                </Chip>
              </div>
              <h3 className="text-lg font-semibold mb-1">{module.title}</h3>
              <p className="text-sm text-default-500">{module.description}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardBody className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Button color="primary" variant="flat" onPress={() => navigate('/front-desk/visitors')}>
              New Visitor
            </Button>
            <Button color="secondary" variant="flat" onPress={() => navigate('/front-desk/admissions')}>
              New Admission
            </Button>
            <Button color="success" variant="flat" onPress={() => navigate('/front-desk/gate-passes')}>
              Issue Gate Pass
            </Button>
            <Button color="warning" variant="flat" onPress={() => navigate('/front-desk/appointments')}>
              New Appointment
            </Button>
            <Button color="danger" variant="flat" onPress={() => navigate('/front-desk/feedbacks')}>
              New Feedback
            </Button>
            <Button color="default" variant="flat" onPress={() => navigate('/front-desk/call-logs')}>
              Log Call
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
