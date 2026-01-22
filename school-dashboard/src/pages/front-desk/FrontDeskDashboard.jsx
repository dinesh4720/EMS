import { Card, Breadcrumbs, BreadcrumbItem, Tabs, Tab, Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import { Home, Users, UserPlus, DoorOpen, Calendar, MessageSquare, Phone, Plus, ChevronDown, LayoutDashboard } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { frontDeskApi } from '../../services/api';
import Overview from './Overview';
import VisitorLog from './VisitorLog';
import AdmissionsList from './AdmissionsList';
import GatePassLog from './GatePassLog';
import AppointmentsList from './AppointmentsList';
import FeedbacksList from './FeedbacksList';
import CallLogsList from './CallLogsList';

export default function FrontDeskDashboard() {
  // Create refs for each component
  const visitorLogRef = useRef(null);
  const admissionsListRef = useRef(null);
  const gatePassLogRef = useRef(null);
  const appointmentsListRef = useRef(null);
  const feedbacksListRef = useRef(null);
  const callLogsListRef = useRef(null);
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('overview');
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
      // Load stats sequentially with small delays to avoid rate limiting
      const visitors = await frontDeskApi.getVisitorsToday();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const admissions = await frontDeskApi.getAdmissions({ status: 'inquiry-logged' });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const gatePasses = await frontDeskApi.getGatePassesToday();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const appointments = await frontDeskApi.getAppointments({ status: 'scheduled' });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const feedbacks = await frontDeskApi.getFeedbacks({ status: 'open' });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const callLogs = await frontDeskApi.getCallLogs();

      const today = new Date().toISOString().split('T')[0];
      const todayCalls = callLogs.filter(log => log.dateTime.startsWith(today));

      setStats({
        todayVisitors: visitors.length,
        activeAdmissions: admissions.length,
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
    { key: 'overview', label: 'Overview', icon: <LayoutDashboard size={14} /> },
    { key: 'visitors', label: 'Visitor Log', count: stats.todayVisitors },
    { key: 'admissions', label: 'Admissions', count: stats.activeAdmissions },
    { key: 'gate-passes', label: 'Gate Pass', count: stats.todayGatePasses },
    { key: 'appointments', label: 'Appointments', count: stats.upcomingAppointments },
    { key: 'feedbacks', label: 'Feedbacks', count: stats.openFeedbacks },
    { key: 'call-logs', label: 'Call Logs', count: stats.todayCalls },
  ];

  const newActions = [
    { key: 'visitor', label: 'New Visitor', icon: <Users size={14} /> },
    { key: 'admission', label: 'New Admission', icon: <UserPlus size={14} /> },
    { key: 'gate-pass', label: 'Issue Gate Pass', icon: <DoorOpen size={14} /> },
    { key: 'appointment', label: 'New Appointment', icon: <Calendar size={14} /> },
    { key: 'feedback', label: 'New Feedback', icon: <MessageSquare size={14} /> },
    { key: 'call-log', label: 'Log Call', icon: <Phone size={14} /> },
  ];

  const handleNewAction = (key) => {
    // Map action keys to tabs and refs
    const actionMap = {
      'visitor': { tab: 'visitors', ref: visitorLogRef },
      'admission': { tab: 'admissions', ref: admissionsListRef },
      'gate-pass': { tab: 'gate-passes', ref: gatePassLogRef },
      'appointment': { tab: 'appointments', ref: appointmentsListRef },
      'feedback': { tab: 'feedbacks', ref: feedbacksListRef },
      'call-log': { tab: 'call-logs', ref: callLogsListRef },
    };

    const action = actionMap[key];
    if (action) {
      // Switch to the appropriate tab
      setSelectedTab(action.tab);
      // Call the openModal function on the component after a small delay to allow the tab to switch
      setTimeout(() => {
        if (action.ref.current?.openModal) {
          action.ref.current.openModal();
        }
      }, 100);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <Card className="shadow-sm border border-default-200 bg-background rounded-md">
        {/* Breadcrumbs Section */}
        <div className="px-6 py-3 border-b border-default-200 flex items-center justify-between">
          <Breadcrumbs size="sm">
            <BreadcrumbItem startContent={<Home size={14} />} onPress={() => navigate("/")}>
              Home
            </BreadcrumbItem>
            <BreadcrumbItem>Front Desk</BreadcrumbItem>
          </Breadcrumbs>
        </div>

        {/* Tabs Section */}
        <div className="px-6 py-3 border-b border-default-200">
          <Tabs
            selectedKey={selectedTab}
            onSelectionChange={setSelectedTab}
            size="md"
            color="default"
            variant="light"
            classNames={{
              tabList: "gap-0 p-1.5 bg-gradient-to-r from-default-100 via-default-200/50 to-default-100 rounded-xl",
              cursor: "bg-white dark:bg-default-50 rounded-lg shadow-lg ring-1 ring-black/5",
              tab: "px-6 h-10 cursor-pointer",
              tabContent: "group-data-[selected=true]:text-default-900 group-data-[selected=true]:font-semibold text-default-500 font-medium"
            }}
          >
            {tabs.map((tab) => (
              <Tab
                key={tab.key}
                title={
                  <div className="flex items-center gap-2">
                    {tab.icon && <span className="text-default-500">{tab.icon}</span>}
                    <span>{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <Chip size="sm" variant="flat" color="primary">
                        {tab.count}
                      </Chip>
                    )}
                  </div>
                }
              />
            ))}
          </Tabs>
        </div>

        {/* Header Section with Gradient */}
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-6 border-b border-default-200 overflow-hidden">
          {/* Gradient background - cyan for Front Desk */}
          <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-cyan-200/80 to-transparent blur-3xl pointer-events-none" />
          
          <div className="pl-2 relative z-10">
            <h1 className="text-2xl font-medium text-default-900">Front Desk</h1>
            <p className="text-sm text-default-500 mt-1">Manage visitors, admissions, and front desk operations</p>
          </div>
          
          {/* Primary action button */}
          <Dropdown>
            <DropdownTrigger>
              <button className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg border border-primary hover:bg-primary-600 transition-all duration-200 text-sm cursor-pointer whitespace-nowrap relative z-10">
                <Plus size={16} />
                <span>New</span>
                <ChevronDown size={14} />
              </button>
            </DropdownTrigger>
            <DropdownMenu aria-label="New actions" onAction={handleNewAction}>
              {newActions.map((action) => (
                <DropdownItem key={action.key} startContent={action.icon}>
                  {action.label}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>

        {/* Content Area */}
        <div className="min-h-[500px] px-6 py-6">
          {selectedTab === 'overview' && <Overview stats={stats} onTabChange={setSelectedTab} />}
          {selectedTab === 'visitors' && <VisitorLog ref={visitorLogRef} />}
          {selectedTab === 'admissions' && <AdmissionsList ref={admissionsListRef} />}
          {selectedTab === 'gate-passes' && <GatePassLog ref={gatePassLogRef} />}
          {selectedTab === 'appointments' && <AppointmentsList ref={appointmentsListRef} />}
          {selectedTab === 'feedbacks' && <FeedbacksList ref={feedbacksListRef} />}
          {selectedTab === 'call-logs' && <CallLogsList ref={callLogsListRef} />}
        </div>
      </Card>
    </div>
  );
}
