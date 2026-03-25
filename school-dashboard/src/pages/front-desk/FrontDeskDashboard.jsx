import { useState, useEffect, useRef } from 'react';
import {
  Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem
} from '@heroui/react';
import {
  Users, DoorOpen, Calendar, MessageSquare, Phone, Plus, ChevronDown, Download
} from 'lucide-react';
import { frontDeskApi } from '../../services/api';
import Overview from './Overview';
import VisitorLog from './VisitorLog';
import GatePassLog from './GatePassLog';
import AppointmentsList from './AppointmentsList';
import FeedbacksList from './FeedbacksList';
import CallLogsList from './CallLogsList';
import { useTranslation } from 'react-i18next';

export default function FrontDeskDashboard() {
  const { t } = useTranslation();
  // Create refs for each component
  const visitorLogRef = useRef(null);
  const gatePassLogRef = useRef(null);
  const appointmentsListRef = useRef(null);
  const feedbacksListRef = useRef(null);
  const callLogsListRef = useRef(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [stats, setStats] = useState({
    todayVisitors: 0,
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
      const [visitors, gatePasses, appointments, feedbacks, callLogs] = await Promise.all([
        frontDeskApi.getVisitorsToday(),
        frontDeskApi.getGatePassesToday(),
        frontDeskApi.getAppointments({ status: 'scheduled' }),
        frontDeskApi.getFeedbacks({ status: 'open' }),
        frontDeskApi.getCallLogs(),
      ]);

      const today = new Date().toLocaleDateString('en-CA');
      const todayCalls = callLogs.filter(log => log.dateTime?.startsWith(today));

      setStats({
        todayVisitors: visitors.length,
        todayGatePasses: gatePasses.length,
        upcomingAppointments: appointments.length,
        openFeedbacks: feedbacks.length,
        todayCalls: todayCalls.length,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'visitors', label: `Visitors${stats.todayVisitors > 0 ? ` (${stats.todayVisitors})` : ''}` },
    { key: 'gate-passes', label: `Gate Pass${stats.todayGatePasses > 0 ? ` (${stats.todayGatePasses})` : ''}` },
    { key: 'appointments', label: `Appointments${stats.upcomingAppointments > 0 ? ` (${stats.upcomingAppointments})` : ''}` },
    { key: 'feedbacks', label: `Feedbacks${stats.openFeedbacks > 0 ? ` (${stats.openFeedbacks})` : ''}` },
    { key: 'call-logs', label: `Calls${stats.todayCalls > 0 ? ` (${stats.todayCalls})` : ''}` },
  ];

  const newActions = [
    { key: 'visitor', label: 'New Visitor', icon: Users },
    { key: 'gate-pass', label: 'Issue Gate Pass', icon: DoorOpen },
    { key: 'appointment', label: 'New Appointment', icon: Calendar },
    { key: 'feedback', label: 'New Feedback', icon: MessageSquare },
    { key: 'call-log', label: 'Log Call', icon: Phone },
  ];

  const handleTabChange = (tabKey) => {
    setSelectedTab(tabKey);
    // Refresh counts when returning to overview
    if (tabKey === 'overview') {
      loadStats();
    }
  };

  const handleNewAction = (key) => {
    const actionMap = {
      'visitor': { tab: 'visitors', ref: visitorLogRef },
      'gate-pass': { tab: 'gate-passes', ref: gatePassLogRef },
      'appointment': { tab: 'appointments', ref: appointmentsListRef },
      'feedback': { tab: 'feedbacks', ref: feedbacksListRef },
      'call-log': { tab: 'call-logs', ref: callLogsListRef },
    };

    const action = actionMap[key];
    if (action) {
      setSelectedTab(action.tab);
      setTimeout(() => {
        if (action.ref.current?.openModal) {
          action.ref.current.openModal();
        }
      }, 100);
    }
  };

  return (
    <div className="w-full flex-1 bg-gray-50 dark:bg-zinc-950 p-6 min-h-screen">
      {/* Tabs Row with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        {/* Enclosed Tabs */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-zinc-900 rounded-lg overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                selectedTab === tab.key
                  ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 shadow-sm'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Dropdown>
            <DropdownTrigger>
              <Button className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-gray-800 dark:hover:bg-zinc-200" startContent={<Plus size={16} />}>
                New
                <ChevronDown size={14} className="ml-1" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu className="min-w-[180px]" onAction={handleNewAction}>
              {newActions.map((action) => (
                <DropdownItem key={action.key} startContent={<action.icon size={14} className="text-gray-400 dark:text-zinc-500" />}>
                  {action.label}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
          <Button variant="flat" className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300" startContent={<Download size={16} />}>
            Export
          </Button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          CONTENT AREA
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* MAIN CONTENT - 2/3 */}
        <div className="lg:col-span-2 space-y-4">
          {selectedTab === 'overview' && <Overview stats={stats} onTabChange={handleTabChange} />}
          {selectedTab === 'visitors' && <VisitorLog ref={visitorLogRef} onSave={loadStats} />}
          {selectedTab === 'gate-passes' && <GatePassLog ref={gatePassLogRef} onSave={loadStats} />}
          {selectedTab === 'appointments' && <AppointmentsList ref={appointmentsListRef} onSave={loadStats} />}
          {selectedTab === 'feedbacks' && <FeedbacksList ref={feedbacksListRef} onSave={loadStats} />}
          {selectedTab === 'call-logs' && <CallLogsList ref={callLogsListRef} onSave={loadStats} />}
        </div>

        {/* RIGHT SIDEBAR - 1/3 */}
        <div className="lg:col-span-1 space-y-4">
          {/* Recent Activity */}
          <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-zinc-800">
              <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.recentActivity1')}</h3>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-zinc-800">
              {[
                { type: 'visitor', text: 'John Doe checked in', time: '10 min ago' },
                { type: 'appointment', text: 'Meeting with parent', time: '25 min ago' },
                { type: 'call', text: 'Incoming call logged', time: '1 hour ago' },
                { type: 'gatepass', text: 'Gate pass issued', time: '2 hours ago' },
              ].map((activity) => (
                <div key={activity.text} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                      {activity.type === 'visitor' && <Users size={12} className="text-gray-500 dark:text-zinc-400" />}
                      {activity.type === 'appointment' && <Calendar size={12} className="text-gray-500 dark:text-zinc-400" />}
                      {activity.type === 'call' && <Phone size={12} className="text-gray-500 dark:text-zinc-400" />}
                      {activity.type === 'gatepass' && <DoorOpen size={12} className="text-gray-500 dark:text-zinc-400" />}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-zinc-300">{activity.text}</p>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-zinc-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
