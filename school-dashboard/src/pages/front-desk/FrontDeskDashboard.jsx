import { useState, useEffect, useRef } from 'react';
import {
  Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem
} from '@heroui/react';
import {
  Users, DoorOpen, Calendar, MessageSquare, Phone, Plus, ChevronDown, Download
} from 'lucide-react';
import { frontDeskApi } from '../../services/api';
import ActivityFeed from '../../components/ui/ActivityFeed';
import Overview from './Overview';
import VisitorLog from './VisitorLog';
import GatePassLog from './GatePassLog';
import AppointmentsList from './AppointmentsList';
import FeedbacksList from './FeedbacksList';
import CallLogsList from './CallLogsList';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import logger from '../../utils/logger';


// Hardcoded UI strings — centralised here for future i18n migration
const STRINGS = {
  overview: 'Overview',
  newVisitor: 'New Visitor',
  issueGatePass: 'Issue Gate Pass',
  newAppointment: 'New Appointment',
  newFeedback: 'New Feedback',
  logCall: 'Log Call',
  new: 'New',
  export: 'Export',
  noRecentActivity: 'No recent activity',
};

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
  const [recentActivity, setRecentActivity] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

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

      // Build recent activity from real data
      const activities = [];
      const timeAgo = (dateStr) => {
        if (!dateStr) return '';
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins} min ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
      };
      visitors.slice(0, 3).forEach(v => activities.push({ _id: v._id, type: 'visitor', text: `${v.name || 'Visitor'} checked in`, time: timeAgo(v.checkInTime || v.createdAt), date: v.checkInTime || v.createdAt }));
      gatePasses.slice(0, 3).forEach(g => activities.push({ _id: g._id, type: 'gatepass', text: `Gate pass for ${g.studentName || 'student'}`, time: timeAgo(g.createdAt), date: g.createdAt }));
      todayCalls.slice(0, 2).forEach(c => activities.push({ _id: c._id, type: 'call', text: `Call: ${c.callerName || c.purpose || 'logged'}`, time: timeAgo(c.dateTime || c.createdAt), date: c.dateTime || c.createdAt }));
      activities.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setRecentActivity(activities);
    } catch (error) {
      logger.error('Error loading stats:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const tabs = [
    { key: 'overview', label: STRINGS.overview },
    { key: 'visitors', label: `Visitors${stats.todayVisitors > 0 ? ` (${stats.todayVisitors})` : ''}` },
    { key: 'gate-passes', label: `Gate Pass${stats.todayGatePasses > 0 ? ` (${stats.todayGatePasses})` : ''}` },
    { key: 'appointments', label: `Appointments${stats.upcomingAppointments > 0 ? ` (${stats.upcomingAppointments})` : ''}` },
    { key: 'feedbacks', label: `Feedbacks${stats.openFeedbacks > 0 ? ` (${stats.openFeedbacks})` : ''}` },
    { key: 'call-logs', label: `Calls${stats.todayCalls > 0 ? ` (${stats.todayCalls})` : ''}` },
  ];

  const newActions = [
    { key: 'visitor', label: STRINGS.newVisitor, icon: Users },
    { key: 'gate-pass', label: STRINGS.issueGatePass, icon: DoorOpen },
    { key: 'appointment', label: STRINGS.newAppointment, icon: Calendar },
    { key: 'feedback', label: STRINGS.newFeedback, icon: MessageSquare },
    { key: 'call-log', label: STRINGS.logCall, icon: Phone },
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

  const handleExport = async () => {
    const sanitize = (value) => {
      const str = String(value ?? '');
      return (/^[=+\-@\t\r]/.test(str) ? "'" : '') + str.replace(/"/g, '""');
    };
    const toCSV = (headers, rows, title) =>
      [title, '', headers.join(','), ...rows.map(r => r.map(c => `"${sanitize(c)}"`).join(','))].join('\n');
    const triggerDownload = (content, filename) => {
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    setIsExporting(true);
    try {
      const date = new Date().toISOString().split('T')[0];
      if (selectedTab === 'overview') {
        const content = toCSV(
          ['Metric', 'Value'],
          [
            ['Today Visitors', stats.todayVisitors],
            ['Today Gate Passes', stats.todayGatePasses],
            ['Upcoming Appointments', stats.upcomingAppointments],
            ['Open Feedbacks', stats.openFeedbacks],
            ['Today Calls', stats.todayCalls],
          ],
          'Front Desk Overview'
        );
        triggerDownload(content, `front-desk-overview-${date}.csv`);
      } else if (selectedTab === 'visitors') {
        const data = await frontDeskApi.getVisitorsToday();
        const content = toCSV(
          ['Name', 'Phone', 'Email', 'Purpose', 'Whom To Meet', 'Check In', 'Check Out', 'Status'],
          data.map(v => [v.name, v.phone || v.phoneNumber, v.email, v.purpose, v.whomToMeet, v.checkInTime, v.checkOutTime, v.status]),
          `Visitors - ${date}`
        );
        triggerDownload(content, `visitors-${date}.csv`);
      } else if (selectedTab === 'gate-passes') {
        const data = await frontDeskApi.getGatePassesToday();
        const content = toCSV(
          ['Student Name', 'Class', 'Reason', 'Out Time', 'In Time', 'Status'],
          data.map(g => [g.studentName, g.className, g.reason, g.outTime, g.inTime, g.status]),
          `Gate Passes - ${date}`
        );
        triggerDownload(content, `gate-passes-${date}.csv`);
      } else if (selectedTab === 'appointments') {
        const raw = await frontDeskApi.getAppointments({});
        const list = Array.isArray(raw) ? raw : (raw?.data || []);
        const content = toCSV(
          ['Visitor Name', 'Phone', 'Purpose', 'Host', 'Date', 'Time', 'Status'],
          list.map(a => [a.visitorName || a.name, a.phone || a.phoneNumber, a.purpose, a.hostName || a.host, a.appointmentDate || a.date, a.time, a.status]),
          `Appointments - ${date}`
        );
        triggerDownload(content, `appointments-${date}.csv`);
      } else if (selectedTab === 'feedbacks') {
        const raw = await frontDeskApi.getFeedbacks({});
        const list = Array.isArray(raw) ? raw : (raw?.data || []);
        const content = toCSV(
          ['Name', 'Phone', 'Category', 'Message', 'Status', 'Date'],
          list.map(f => [f.name, f.phone, f.category, f.message || f.feedback, f.status, f.createdAt]),
          `Feedbacks - ${date}`
        );
        triggerDownload(content, `feedbacks-${date}.csv`);
      } else if (selectedTab === 'call-logs') {
        const raw = await frontDeskApi.getCallLogs();
        const list = Array.isArray(raw) ? raw : (raw?.data || []);
        const content = toCSV(
          ['Caller Name', 'Phone', 'Purpose', 'Date/Time', 'Summary', 'Status'],
          list.map(c => [c.callerName, c.phoneNumber || c.phone, c.purpose, c.dateTime, c.summary || c.keyNotes, c.status]),
          `Call Logs - ${date}`
        );
        triggerDownload(content, `call-logs-${date}.csv`);
      }
    } catch (error) {
      logger.error('Export failed:', error);
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full flex-1 bg-surface-2 p-6 min-h-screen">
      {/* Tabs Row with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        {/* Enclosed Tabs */}
        <div className="flex items-center gap-1 p-1 bg-surface-2 rounded-lg overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                selectedTab === tab.key
                  ? 'bg-surface text-fg shadow-sm'
                  : 'text-fg-muted hover:text-fg'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Dropdown>
            <DropdownTrigger>
              <Button color="primary" startContent={<Plus size={16} />}>
                {STRINGS.new}
                <ChevronDown size={14} className="ml-1" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu className="min-w-[180px]" onAction={handleNewAction}>
              {newActions.map((action) => (
                <DropdownItem key={action.key} startContent={<action.icon size={14} className="text-fg-faint" />}>
                  {action.label}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
          <Button variant="flat" className="bg-surface-2 text-fg" startContent={<Download size={16} />} onClick={handleExport} isLoading={isExporting}>
            {STRINGS.export}
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
          <div className="bg-surface rounded-lg border border-divider overflow-hidden">
            <div className="p-4 border-b border-divider">
              <h3 className="text-sm font-medium text-fg">{t('pages.recentActivity1')}</h3>
            </div>
            <div className="p-4">
              <ActivityFeed
                events={recentActivity.slice(0, 6).map((activity, idx) => ({
                  id: activity._id || idx,
                  timestamp: activity.date,
                  title: activity.text,
                  icon:
                    activity.type === 'visitor'
                      ? Users
                      : activity.type === 'appointment'
                      ? Calendar
                      : activity.type === 'call'
                      ? Phone
                      : activity.type === 'gatepass'
                      ? DoorOpen
                      : undefined,
                  tone: 'neutral',
                }))}
                emptyTitle={STRINGS.noRecentActivity}
                groupByDay={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
