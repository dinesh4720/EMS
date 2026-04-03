import { useState, useMemo, useEffect } from "react";
import logger from "../../utils/logger";
import {
  Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
  Chip, Progress
} from "@heroui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { useValidatedParams } from "../../hooks/useValidatedParams";
import {
  IndianRupee, MessageSquare, Users, Clock,
  BookOpen, AlertCircle, CheckCircle2, Search,
  GraduationCap, Award, ArrowLeft, Star, StarHalf,
  Activity, FileText, AlertTriangle, Download,
  MoreVertical, Send, ChevronRight, ArrowUpDown,
  Megaphone
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { toast } from "react-hot-toast";
import { examsApi } from "../../services/api";
import Attendance from "./Attendance";
import Timetable from "./Timetable";
import ClassSettingsPanel from "./ClassSettingsPanel";
import ClassTeacherAssignmentModal from "./components/ClassTeacherAssignmentModal";
import { useTranslation } from 'react-i18next';
import { DetailPageSkeleton } from '../../components/skeletons/PageSkeletons';
import { formatShortDate } from '../../utils/dateFormatter';

const Bone = ({ className = "" }) => (
  <div className={`bg-gray-200 dark:bg-zinc-700 rounded animate-pulse ${className}`} />
);

export default function ClassDashboard() {
  const { t } = useTranslation();
  const { params: { id }, isValid } = useValidatedParams({ id: 'objectId' }, { redirectTo: '/classes' });
  const navigate = useNavigate();
  const location = useLocation();
  const { classesWithTeachers, students, classesEnhancedApi, classesApi, refetch, loading } = useApp();

  const searchParams = new URLSearchParams(location.search);
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTabState] = useState(tabFromUrl || "overview");

  // Sync tab state to URL so back/forward navigation restores correct tab
  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    const newParams = new URLSearchParams(location.search);
    if (tab === 'overview') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', tab);
    }
    const newSearch = newParams.toString();
    navigate(`${location.pathname}${newSearch ? `?${newSearch}` : ''}`, { replace: true });
  };

  const [classSettings, setClassSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAssignTeacherModalOpen, setIsAssignTeacherModalOpen] = useState(false);

  // Lifted state: todayStatus + classRating fetched at parent level for header + sidebar + overview
  const [todayStatus, setTodayStatus] = useState(null);
  const [classRating, setClassRating] = useState(null);
  const [announcements, setAnnouncements] = useState([]);

  const cls = classesWithTeachers.find(c => String(c.id) === String(id) || String(c._id) === String(id)) || null;

  useEffect(() => {
    if (tabFromUrl) setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  // Refresh class data on mount
  useEffect(() => {
    if (id && refetch && !isRefreshing) {
      setIsRefreshing(true);
      refetch(true).catch(e => logger.error('Error refreshing class data:', e)).finally(() => setIsRefreshing(false));
    }
  }, [id, refetch]);

  // Load class settings
  useEffect(() => {
    if (!id || !classesApi) return;
    const controller = new AbortController();
    (async () => {
      try {
        setSettingsLoading(true);
        const settings = await classesApi.getSettings(id);
        if (!controller.signal.aborted) setClassSettings(settings);
      } catch (error) {
        if (error.name !== 'AbortError') logger.error("Error loading class settings:", error);
      } finally {
        if (!controller.signal.aborted) setSettingsLoading(false);
      }
    })();
    return () => controller.abort();
  }, [id, classesApi]);

  // Lifted fetches: todayStatus, classRating, announcements (used by header + sidebar + overview)
  useEffect(() => {
    if (!id || !classesEnhancedApi) return;
    const controller = new AbortController();
    const aborted = () => controller.signal.aborted;

    classesEnhancedApi.getTodayStatus(id).then(d => { if (!aborted()) setTodayStatus(d); }).catch(e => { if (!aborted()) logger.error('todayStatus:', e); });
    classesEnhancedApi.getRating(id).then(d => { if (!aborted()) setClassRating(d); }).catch(e => { if (!aborted()) logger.error('rating:', e); });
    classesEnhancedApi.getAnnouncements(id, 3).then(d => { if (!aborted()) setAnnouncements(d || []); }).catch(e => { if (!aborted()) logger.error('announcements:', e); });

    return () => controller.abort();
  }, [id, classesEnhancedApi]);

  const handleExportReport = () => {
    const classStudents = students.filter(s => String(s.classId?._id || s.classId) === String(id));
    if (classStudents.length === 0) { toast.error(t('toast.error.noStudentsToExport', 'No students to export')); return; }
    const headers = [t('common.name', 'Name'), t('classes.rollNo', 'Roll No'), t('classes.admissionNo', 'Admission No'), t('common.gender', 'Gender'), t('classes.parentName', 'Parent Name'), t('classes.parentPhone', 'Parent Phone')];
    const rows = classStudents.map(s => [s.name || '', s.rollNo || '', s.admissionNo || '', s.gender || '', s.parentName || s.fatherName || '', s.parentPhone || '']);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cls?.name || 'class'}-${cls?.section || ''}-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success(t('toast.success.reportExported', 'Report exported'));
  };

  const handleSendNotice = () => {
    navigate('/messaging', { state: { prefillClass: id, className: cls ? `${cls.name}-${cls.section}` : '' } });
  };

  const tabs = [
    { key: "overview", label: t('classes.overview', 'Overview') },
    { key: "students", label: t('classes.students', 'Students') },
    { key: "attendance", label: t('classes.attendance', 'Attendance') },
    { key: "fees", label: t('classes.fees', 'Fees') },
    { key: "academics", label: t('classes.academics', 'Academics') },
    { key: "timetable", label: t('classes.timeTable', 'Time Table') },
    { key: "settings", label: t('common.settings', 'Settings') },
  ];

  if (!isValid) return null;

  if (loading && !cls) return (
    <div className="w-full flex-1 bg-gray-50 dark:bg-zinc-950 p-6 min-h-screen">
      <DetailPageSkeleton avatar={false} fields={8} />
    </div>
  );

  if (!cls && classesWithTeachers.length > 0) {
    return (
      <div className="w-full flex-1 bg-gray-50 dark:bg-zinc-950 p-6 min-h-screen">
        <button onClick={() => navigate('/classes')} className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300 transition-colors mb-4">
          <ArrowLeft size={16} /><span>{t('pages.backToClasses')}</span>
        </button>
        <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-8 text-center">
          <AlertCircle size={40} className="mx-auto text-red-400 mb-3" />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-zinc-200 mb-1">{t('pages.classNotFound1')}</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.theClassYouReLookingForDoesnTExistOrHasBeenRemoved')}</p>
          <button onClick={() => navigate('/classes')} className="mt-4 px-4 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg text-sm text-gray-700 dark:text-zinc-300 transition-colors">
            {t('classes.viewAllClasses', 'View All Classes')}
          </button>
        </div>
      </div>
    );
  }

  const attendancePercentage = todayStatus?.attendance?.percentage || cls?.attendanceToday || 0;

  // Header KPI stats (always visible)
  const headerStats = [
    {
      label: t('classes.attendance', 'Attendance'),
      value: `${attendancePercentage}%`,
      subtext: t('classes.presentToday', '{{count}} present today', { count: todayStatus?.attendance?.present || 0 }),
      icon: CheckCircle2,
      color: attendancePercentage >= 75 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400',
    },
    {
      label: t('classes.currentPeriod', 'Current Period'),
      value: todayStatus?.currentClass?.subject || t('classes.free', 'Free'),
      subtext: todayStatus?.currentClass?.teacher || t('classes.noClassNow', 'No class now'),
      icon: BookOpen,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: t('classes.classRating', 'Class Rating'),
      value: (classRating?.overallRating || classRating?.rating || 0).toFixed(1),
      subtext: t('classes.outOf5', 'out of 5.0'),
      icon: Star,
      color: 'text-amber-500 dark:text-amber-400',
    },
    {
      label: t('classes.students', 'Students'),
      value: `${cls?.studentCount || 0}`,
      subtext: t('classes.ofCapacity', 'of {{count}} capacity', { count: cls?.strengthLimit?.current || 40 }),
      icon: Users,
      color: 'text-gray-600 dark:text-zinc-400',
    },
  ];

  const fullWidthTabs = ["timetable", "settings", "overview"];

  return (
    <div className="w-full flex-1 bg-gray-50 dark:bg-zinc-950 p-6 min-h-screen">
      {/* HEADER */}
      <div className="mb-6 space-y-4">
        <button onClick={() => navigate('/classes')} className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300 transition-colors">
          <ArrowLeft size={16} /><span>{t('pages.backToClasses')}</span>
        </button>

        <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-5">
          {/* Top row: class info + actions */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-gray-600 dark:text-zinc-400">
                  {cls?.name?.replace("Class ", "")}{cls?.section}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">
                  {cls?.name || 'N/A'} - {t('classes.section', 'Section')} {cls?.section || 'N/A'}
                </h1>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-zinc-400 flex-wrap">
                  <span>{cls?.studentCount || 0} {t('classes.students', 'Students')}</span>
                  <span className="text-gray-300 dark:text-zinc-600">·</span>
                  <span>{cls?.strengthLimit?.current || 40} {t('classes.capacity', 'Capacity')}</span>
                  {cls?.room && (<><span className="text-gray-300 dark:text-zinc-600">·</span><span>{t('classes.room', 'Room')} {cls.room}</span></>)}
                </div>
                {cls?.classTeacherId ? (
                  <div className="flex items-center gap-2 mt-1.5">
                    <Users size={12} className="text-gray-400 dark:text-zinc-500" />
                    <span
                      className="text-xs text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300 cursor-pointer"
                      onClick={() => navigate(`/staffs/${cls.classTeacherId}`)}
                    >
                      {cls?.teacher || t('classes.classTeacher', 'Class Teacher')}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1.5">
                    <AlertCircle size={12} className="text-amber-500" />
                    <span className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.noClassTeacherAssigned')}</span>
                    <button onClick={() => setIsAssignTeacherModalOpen(true)} className="text-xs font-medium text-blue-600 hover:text-blue-800 underline">
                      {t('classes.assign', 'Assign')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button size="sm" variant="flat" className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300" startContent={<MessageSquare size={14} />}
                onPress={() => navigate('/messaging')}>{t('pages.message1')}</Button>
              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly size="sm" variant="flat" className="bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400"><MoreVertical size={16} /></Button>
                </DropdownTrigger>
                <DropdownMenu className="min-w-[180px]">
                  <DropdownItem key="export" startContent={<Download size={14} className="text-gray-400" />} onPress={handleExportReport}>{t('pages.exportReport')}</DropdownItem>
                  <DropdownItem key="notice" startContent={<Send size={14} className="text-gray-400" />} onPress={handleSendNotice}>{t('pages.sendNotice')}</DropdownItem>
                  <DropdownItem key="timetable" startContent={<Clock size={14} className="text-gray-400" />} onPress={() => setActiveTab("timetable")}>{t('pages.viewTimetable')}</DropdownItem>
                  <DropdownItem key="settings" startContent={<GraduationCap size={14} className="text-gray-400" />} onPress={() => setActiveTab("settings")}>{t('common.settings', 'Settings')}</DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>

          {/* KPI stat cards row — always visible */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {headerStats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800">
                <div className={`w-9 h-9 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center flex-shrink-0`}>
                  <stat.icon size={16} className={stat.color} />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-gray-900 dark:text-zinc-100 leading-tight">{stat.value}</p>
                  <p className="text-[11px] text-gray-500 dark:text-zinc-400 truncate">{stat.subtext}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="mb-5">
        <div className="flex items-center gap-1 border-b border-gray-200 dark:border-zinc-800 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                activeTab === tab.key ? 'text-gray-900 dark:text-zinc-100' : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-400'
              }`}>
              {tab.label}
              {activeTab === tab.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-zinc-100" />}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT AREA */}

      {/* Full-width tabs */}
      {activeTab === "timetable" && <Timetable classId={id} />}
      {activeTab === "settings" && <ClassSettingsPanel classId={id} />}
      {activeTab === "overview" && (
        <OverviewTab id={id} cls={cls} classesEnhancedApi={classesEnhancedApi} todayStatus={todayStatus} classRating={classRating} />
      )}

      {/* Grid layout tabs (with sidebar) */}
      {!fullWidthTabs.includes(activeTab) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {activeTab === "students" && (
              <StudentsTab id={id} cls={cls} navigate={navigate} classesEnhancedApi={classesEnhancedApi} />
            )}
            {activeTab === "fees" && (
              <FeesTab id={id} cls={cls} classesEnhancedApi={classesEnhancedApi} navigate={navigate} />
            )}
            {activeTab === "attendance" && <Attendance classId={id} />}
            {activeTab === "academics" && (
              <AcademicsTab id={id} cls={cls} classesEnhancedApi={classesEnhancedApi} />
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="lg:col-span-1 space-y-4">
            {/* Today's Schedule */}
            <SidebarSchedule todayStatus={todayStatus} onViewTimetable={() => setActiveTab("timetable")} />

            {/* Quick Actions */}
            <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-5">
              <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-3">{t('pages.quickActions1')}</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'students', icon: Users, label: t('pages.students1') },
                  { key: 'attendance', icon: CheckCircle2, label: t('pages.attendance2') },
                  { key: 'fees', icon: IndianRupee, label: t('pages.fees1') },
                  { key: 'timetable', icon: Clock, label: t('pages.timetable2') },
                ].map(action => (
                  <button key={action.key} onClick={() => setActiveTab(action.key)} className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                    <action.icon size={16} className="text-gray-600 dark:text-zinc-400" />
                    <span className="text-[11px] text-gray-600 dark:text-zinc-400">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Class Teacher Card */}
            {cls?.classTeacherId && (
              <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-5">
                <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-3">{t('pages.classTeacher2')}</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-zinc-400">{cls?.teacher?.charAt(0) || 'T'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{cls?.teacher || t('classes.teacher', 'Teacher')}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.classTeacher2')}</p>
                  </div>
                  <button onClick={() => navigate(`/messaging`, { state: { recipientId: cls.classTeacherId } })} className="p-2 hover:bg-gray-50 dark:hover:bg-zinc-900 rounded-lg">
                    <MessageSquare size={14} className="text-gray-400 dark:text-zinc-500" />
                  </button>
                </div>
              </div>
            )}

            {/* Announcements */}
            <SidebarAnnouncements announcements={announcements} onSend={handleSendNotice} />

            {/* Assigned Subjects */}
            {!settingsLoading && classSettings?.assignedSubjects?.length > 0 && (
              <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-5">
                <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-3">{t('pages.assignedSubjects')} ({classSettings.assignedSubjects.length})</h3>
                <div className="flex flex-wrap gap-1.5">
                  {classSettings.assignedSubjects.map((subject) => (
                    <span key={subject} className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded-md">
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {cls && (
        <ClassTeacherAssignmentModal
          isOpen={isAssignTeacherModalOpen}
          onClose={() => setIsAssignTeacherModalOpen(false)}
          classId={id}
          className={cls.name}
          section={cls.section}
          currentTeacherId={cls.classTeacherId || null}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SIDEBAR COMPONENTS
// ═══════════════════════════════════════════════════════════════════

function SidebarSchedule({ todayStatus, onViewTimetable }) {
  const { t } = useTranslation();
  const periods = [];
  if (todayStatus?.currentClass) periods.push({ ...todayStatus.currentClass, isCurrent: true });
  if (todayStatus?.upcomingClass) periods.push({ ...todayStatus.upcomingClass, isCurrent: false });

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('classes.todaysSchedule', "Today's Schedule")}</h3>
        <button onClick={onViewTimetable} className="text-xs text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300 flex items-center gap-1">
          {t('classes.full', 'Full')} <ChevronRight size={12} />
        </button>
      </div>
      {periods.length > 0 ? (
        <div className="space-y-2">
          {periods.map((p, i) => (
            <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${p.isCurrent ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-zinc-900'}`}>
              <div className={`w-1 h-8 rounded-full flex-shrink-0 ${p.isCurrent ? 'bg-blue-500' : 'bg-gray-200 dark:bg-zinc-700'}`} />
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium truncate ${p.isCurrent ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-zinc-300'}`}>
                  {p.subject || t('classes.freePeriod', 'Free Period')}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 truncate">
                  {p.isCurrent ? t('classes.now', 'Now') : p.time || t('classes.next', 'Next')}{p.teacher ? ` · ${p.teacher}` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 dark:text-zinc-500 text-center py-3">{t('classes.noScheduleData', 'No schedule data available')}</p>
      )}
    </div>
  );
}

function SidebarAnnouncements({ announcements, onSend }) {
  const { t } = useTranslation();
  if (!announcements || announcements.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-5">
        <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-3">{t('classes.announcements', 'Announcements')}</h3>
        <div className="text-center py-3">
          <Megaphone size={24} className="mx-auto text-gray-200 dark:text-zinc-700 mb-2" />
          <p className="text-xs text-gray-400 dark:text-zinc-500 mb-3">{t('classes.noAnnouncementsYet', 'No announcements yet')}</p>
          <button onClick={onSend} className="text-xs font-medium text-blue-600 hover:text-blue-800">{t('classes.sendAnnouncement', 'Send Announcement')}</button>
        </div>
      </div>
    );
  }

  const priorityColors = { urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', normal: 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400', low: 'bg-gray-50 text-gray-500 dark:bg-zinc-900 dark:text-zinc-500' };

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('classes.announcements', 'Announcements')}</h3>
        <button onClick={onSend} className="text-xs text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300">{t('common.send', 'Send')}</button>
      </div>
      <div className="space-y-2">
        {announcements.slice(0, 3).map((a, i) => (
          <div key={a._id || i} className="p-2.5 rounded-lg bg-gray-50 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-gray-700 dark:text-zinc-300 line-clamp-1">{a.title}</p>
              {a.priority && a.priority !== 'normal' && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium ${priorityColors[a.priority] || priorityColors.normal}`}>
                  {a.priority}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">
              {a.createdAt ? formatShortDate(a.createdAt) : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// OVERVIEW TAB (Full Width)
// ═══════════════════════════════════════════════════════════════════

function OverviewTab({ id, cls, classesEnhancedApi, todayStatus, classRating }) {
  const { t } = useTranslation();
  const [academicPerformance, setAcademicPerformance] = useState(null);
  const [academicLoading, setAcademicLoading] = useState(true);
  const [chronicAbsentees, setChronicAbsentees] = useState([]);
  const [chronicAbsenteesLoading, setChronicAbsenteesLoading] = useState(true);
  const [activityLog, setActivityLog] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    if (!id || !classesEnhancedApi) return;
    const controller = new AbortController();
    const aborted = () => controller.signal.aborted;

    setAcademicLoading(true);
    setActivityLoading(true);

    classesEnhancedApi.getAcademicPerformance(id)
      .then(d => { if (!aborted()) setAcademicPerformance(d); })
      .catch(e => { if (!aborted()) logger.error('academic:', e); })
      .finally(() => { if (!aborted()) setAcademicLoading(false); });

    setChronicAbsenteesLoading(true);
    classesEnhancedApi.getChronicAbsentees(id)
      .then(d => { if (!aborted()) setChronicAbsentees(d || []); })
      .catch(e => { if (!aborted()) logger.error('chronic:', e); })
      .finally(() => { if (!aborted()) setChronicAbsenteesLoading(false); });

    classesEnhancedApi.getActivityLog(id, { limit: 5 })
      .then(d => { if (!aborted()) setActivityLog(d || []); })
      .catch(e => { if (!aborted()) logger.error('activity:', e); })
      .finally(() => { if (!aborted()) setActivityLoading(false); });

    return () => controller.abort();
  }, [id, classesEnhancedApi]);

  const attendancePercentage = todayStatus?.attendance?.percentage || cls?.attendanceToday || 0;
  const needsAttention = attendancePercentage < 75 || chronicAbsentees.length > 0;

  return (
    <div className="space-y-4">
      {/* Alerts Banner */}
      {needsAttention && (
        <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800/50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              {attendancePercentage < 75 && (
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  {t('classes.attendanceIsAt', 'Attendance is at')} <strong>{attendancePercentage}%</strong> {t('classes.belowTarget', 'today — below the 75% target')}
                </p>
              )}
              {chronicAbsentees.length > 0 && (
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  <strong>{chronicAbsentees.length} {chronicAbsentees.length > 1 ? t('classes.students', 'Students') : t('classes.studentSingular', 'student')}</strong> {t('classes.attendanceBelow60', 'with attendance below 60% this month')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Today's Schedule Strip */}
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-3">{t('classes.todaysSchedule', "Today's Schedule")}</h3>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {todayStatus?.currentClass && (
            <div className="flex-shrink-0 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">{t('classes.now', 'Now')}</p>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">{todayStatus.currentClass.subject}</p>
              {todayStatus.currentClass.teacher && <p className="text-[11px] text-blue-600 dark:text-blue-400">{todayStatus.currentClass.teacher}</p>}
            </div>
          )}
          {todayStatus?.upcomingClass && (
            <div className="flex-shrink-0 px-3 py-2 rounded-lg bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800">
              <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400">{t('classes.next', 'Next')}{todayStatus.upcomingClass.time ? ` · ${todayStatus.upcomingClass.time}` : ''}</p>
              <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">{todayStatus.upcomingClass.subject}</p>
              {todayStatus.upcomingClass.teacher && <p className="text-[11px] text-gray-500 dark:text-zinc-400">{todayStatus.upcomingClass.teacher}</p>}
            </div>
          )}
          {!todayStatus?.currentClass && !todayStatus?.upcomingClass && (
            <p className="text-xs text-gray-400 dark:text-zinc-500 py-2">{t('classes.noScheduleDataToday', 'No schedule data for today')}</p>
          )}
        </div>
      </div>

      {/* Academic Overview + Ratings Breakdown (2-col) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Academic Overview */}
        <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <Award size={14} className="text-gray-600 dark:text-zinc-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('pages.academicOverview')}</h3>
              <p className="text-[11px] text-gray-500 dark:text-zinc-400">{t('pages.topPerformersImprovements')}</p>
            </div>
          </div>
          <div className="p-4">
            {academicLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Bone key={i} className="h-8 w-full" />)}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-2">{t('pages.topPerformers')}</p>
                  {academicPerformance?.topPerformers?.slice(0, 3).map((s) => (
                    <div key={s._id || s.name} className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-zinc-800 last:border-0">
                      <span className="text-sm text-gray-700 dark:text-zinc-300">{s.name}</span>
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">{s.percentage}%</span>
                    </div>
                  ))}
                  {(!academicPerformance?.topPerformers || academicPerformance.topPerformers.length === 0) && (
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{t('pages.noDataAvailable')}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-2">{t('pages.needsImprovement')}</p>
                  {academicPerformance?.needsImprovement?.slice(0, 3).map((s) => (
                    <div key={s._id || s.name} className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-zinc-800 last:border-0">
                      <span className="text-sm text-gray-700 dark:text-zinc-300">{s.name}</span>
                      <span className="text-sm font-semibold text-red-500 dark:text-red-400">{s.percentage}%</span>
                    </div>
                  ))}
                  {(!academicPerformance?.needsImprovement || academicPerformance.needsImprovement.length === 0) && (
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{t('pages.noDataAvailable')}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ratings Breakdown */}
        <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <Star size={14} className="text-gray-600 dark:text-zinc-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('pages.classRatings')}</h3>
              <p className="text-[11px] text-gray-500 dark:text-zinc-400">{t('classes.overall', 'Overall')}: {(classRating?.overallRating || classRating?.rating || 0).toFixed(1)} / 5.0</p>
            </div>
          </div>
          <div className="p-4">
            {!classRating ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => <Bone key={i} className="h-6 w-full" />)}
              </div>
            ) : classRating?.breakdown && Object.keys(classRating.breakdown).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(classRating.breakdown).map(([key, val]) => {
                  const pct = ((val || 0) / 5) * 100;
                  const colors = { attendance: 'bg-blue-500', academic: 'bg-green-500', behavior: 'bg-purple-500', fee: 'bg-amber-500' };
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="capitalize text-gray-600 dark:text-zinc-400">{key}</span>
                        <span className="font-medium text-gray-900 dark:text-zinc-100">{(val || 0).toFixed(1)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${colors[key] || 'bg-gray-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-400 dark:text-zinc-500 text-center py-4">{t('pages.noRatingsAvailable')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Chronic Absentees */}
      {chronicAbsentees.length > 0 && (
        <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
              <AlertCircle size={14} className="text-red-500 dark:text-red-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('classes.chronicAbsentees', 'Chronic Absentees')}</h3>
              <p className="text-[11px] text-gray-500 dark:text-zinc-400">{t('classes.studentsBelow60', 'Students below 60% attendance this month')}</p>
            </div>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-zinc-800">
            {chronicAbsentees.slice(0, 5).map((s, i) => (
              <div key={s.studentId || i} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-zinc-400">
                    {s.studentName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{s.studentName}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{t('classes.roll', 'Roll')} {s.rollNo || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-500 dark:text-red-400">{s.percentage?.toFixed(0) || 0}%</p>
                    <p className="text-[11px] text-gray-400 dark:text-zinc-500">{t('classes.attendance', 'Attendance').toLowerCase()}</p>
                  </div>
                  {s.hasParentContact && (
                    <div className="w-6 h-6 rounded-full bg-green-50 dark:bg-green-950/30 flex items-center justify-center" title={t('classes.parentContactAvailable', 'Parent contact available')}>
                      <CheckCircle2 size={12} className="text-green-500" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
            <Activity size={14} className="text-gray-600 dark:text-zinc-400" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('classes.recentActivity', 'Recent Activity')}</h3>
            <p className="text-[11px] text-gray-500 dark:text-zinc-400">{t('classes.latestActions', 'Latest actions on this class')}</p>
          </div>
        </div>
        <div className="p-4">
          {activityLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Bone key={i} className="h-10 w-full" />)}
            </div>
          ) : activityLog.length > 0 ? (
            <div className="relative pl-6">
              <div className="absolute left-2 top-2 bottom-2 w-px bg-gray-200 dark:bg-zinc-700" />
              <div className="space-y-4">
                {activityLog.slice(0, 5).map((entry, i) => (
                  <div key={entry._id || i} className="relative">
                    <div className="absolute -left-[18px] top-1 w-2.5 h-2.5 rounded-full bg-gray-400 dark:bg-zinc-500 border-2 border-white dark:border-zinc-950" />
                    <p className="text-sm text-gray-700 dark:text-zinc-300">{entry.description || entry.activityType?.replace(/_/g, ' ')}</p>
                    <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                      {entry.performedBy?.name || t('classes.system', 'System')}{entry.createdAt ? ` · ${formatShortDate(entry.createdAt)}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 dark:text-zinc-500 text-center py-4">{t('classes.noActivityYet', 'No activity recorded yet')}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STUDENTS TAB (Enhanced)
// ═══════════════════════════════════════════════════════════════════

function StudentsTab({ id, cls, navigate, classesEnhancedApi }) {
  const { t } = useTranslation();
  const { students } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("rollNo");
  const [sortDir, setSortDir] = useState("asc");
  const [performanceMap, setPerformanceMap] = useState({});

  // Fetch academic performance for student lookup
  useEffect(() => {
    if (!id || !classesEnhancedApi) return;
    classesEnhancedApi.getAcademicPerformance(id).then(perf => {
      const map = {};
      (perf?.topPerformers || []).concat(perf?.needsImprovement || []).forEach(s => {
        const key = s.studentId || s._id;
        if (key) map[String(key)] = s.percentage || s.averagePercentage || 0;
      });
      setPerformanceMap(map);
    }).catch(e => logger.error('student performance:', e));
  }, [id, classesEnhancedApi]);

  const classStudents = useMemo(() => students.filter(s =>
    String(s.classId?._id || s.classId) === String(cls?.id) &&
    (s.status || 'active') === 'active' &&
    s.isDeleted !== true
  ), [students, cls]);

  const filteredStudents = useMemo(() => {
    let list = classStudents.filter(s => {
      const matchesSearch = s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || String(s.rollNo).includes(searchQuery);
      const matchesFilter = filter === "all" ? true : s.feeStatus === filter;
      return matchesSearch && matchesFilter;
    });

    list.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'name': aVal = a.name || ''; bVal = b.name || ''; break;
        case 'feeStatus': aVal = a.feeStatus || 'pending'; bVal = b.feeStatus || 'pending'; break;
        case 'academic':
          aVal = performanceMap[String(a.id || a._id)] || 0;
          bVal = performanceMap[String(b.id || b._id)] || 0;
          return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        default: aVal = a.rollNo || 0; bVal = b.rollNo || 0; return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      if (typeof aVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return list;
  }, [classStudents, searchQuery, filter, sortBy, sortDir, performanceMap]);

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const paidCount = classStudents.filter(s => s.feeStatus === 'paid').length;
  const pendingCount = classStudents.filter(s => s.feeStatus !== 'paid').length;

  return (
    <div className="space-y-4">
      {/* Summary chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-lg">
          {classStudents.length} {t('classes.students', 'Students')}
        </span>
        <span className="px-3 py-1.5 text-xs font-medium bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-lg">
          {paidCount} {t('classes.paid', 'Paid')}
        </span>
        <span className="px-3 py-1.5 text-xs font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-lg">
          {pendingCount} {t('classes.pending', 'Pending')}
        </span>
      </div>

      {/* Search + Filter */}
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
            <input type="text" placeholder={t('pages.searchStudents')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-gray-400 dark:focus:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500" />
          </div>
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg">
            {["all", "paid", "pending"].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === f ? 'bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 shadow-sm' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'}`}>
                {f === 'all' ? t('common.all', 'All') : f === 'paid' ? t('classes.paid', 'Paid') : t('classes.pending', 'Pending')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-12 gap-2 px-5 py-3 bg-gray-50 dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 text-xs font-medium text-gray-500 dark:text-zinc-400">
          <div className="col-span-1 cursor-pointer flex items-center gap-1" onClick={() => handleSort('rollNo')}>
            {t('classes.roll', 'Roll')} {sortBy === 'rollNo' && <ArrowUpDown size={10} />}
          </div>
          <div className="col-span-4 cursor-pointer flex items-center gap-1" onClick={() => handleSort('name')}>
            {t('classes.student', 'Student')} {sortBy === 'name' && <ArrowUpDown size={10} />}
          </div>
          <div className="col-span-2 cursor-pointer flex items-center gap-1" onClick={() => handleSort('academic')}>
            {t('classes.academic', 'Academic')} {sortBy === 'academic' && <ArrowUpDown size={10} />}
          </div>
          <div className="col-span-2">{t('classes.attendance', 'Attendance')}</div>
          <div className="col-span-2 cursor-pointer flex items-center gap-1" onClick={() => handleSort('feeStatus')}>
            {t('classes.fee', 'Fee')} {sortBy === 'feeStatus' && <ArrowUpDown size={10} />}
          </div>
          <div className="col-span-1"></div>
        </div>

        {filteredStudents.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-zinc-800">
            {filteredStudents.map(student => {
              const academicPct = performanceMap[String(student.id || student._id)] || null;
              return (
                <div key={student.id} className="sm:grid grid-cols-12 gap-2 px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                  onClick={() => navigate(`/students/${student.id}`)}>
                  {/* Roll */}
                  <div className="col-span-1 text-xs font-mono text-gray-500 dark:text-zinc-400 hidden sm:block">
                    {student.rollNo || '-'}
                  </div>
                  {/* Student */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {student.photo ? (
                        <img src={student.photo} alt={student.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                      ) : (
                        <span className="text-xs font-medium text-gray-600 dark:text-zinc-400">{student.name?.charAt(0)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{student.name}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 truncate sm:hidden">{t('classes.roll', 'Roll')} {student.rollNo} · {student.parentName || t('classes.parent', 'Parent')}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 truncate hidden sm:block">{student.parentName || t('classes.parent', 'Parent')}</p>
                    </div>
                  </div>
                  {/* Academic */}
                  <div className="col-span-2 hidden sm:block">
                    {academicPct !== null ? (
                      <span className={`text-sm font-medium ${academicPct >= 75 ? 'text-green-600 dark:text-green-400' : academicPct >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400'}`}>
                        {academicPct}%
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300 dark:text-zinc-600">—</span>
                    )}
                  </div>
                  {/* Attendance */}
                  <div className="col-span-2 hidden sm:flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${student.attendanceStatus === 'present' ? "bg-green-500" : student.attendanceStatus === 'absent' ? "bg-red-400" : "bg-gray-300 dark:bg-zinc-600"}`} />
                    <span className="text-xs text-gray-500 dark:text-zinc-400">
                      {student.attendanceStatus === 'present' ? t('classes.present', 'Present') : student.attendanceStatus === 'absent' ? t('classes.absent', 'Absent') : '—'}
                    </span>
                  </div>
                  {/* Fee */}
                  <div className="col-span-2 hidden sm:block">
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                      student.feeStatus === 'paid' ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'
                    }`}>
                      {student.feeStatus === 'paid' ? t('classes.paid', 'Paid') : t('classes.pending', 'Pending')}
                    </span>
                  </div>
                  {/* Arrow */}
                  <div className="col-span-1 text-right hidden sm:block">
                    <ChevronRight size={14} className="text-gray-300 dark:text-zinc-600 inline" />
                  </div>
                  {/* Mobile badges */}
                  <div className="flex items-center gap-2 sm:hidden">
                    <span className={`text-xs px-2 py-0.5 rounded-md ${student.feeStatus === 'paid' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                      {student.feeStatus === 'paid' ? t('classes.paid', 'Paid') : t('classes.pending', 'Pending')}
                    </span>
                    <ChevronRight size={14} className="text-gray-300" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <Users size={32} className="mx-auto text-gray-200 dark:text-zinc-700 mb-3" />
            <p className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.noStudentsFound')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FEES TAB
// ═══════════════════════════════════════════════════════════════════

function FeesTab({ id, cls, classesEnhancedApi, navigate }) {
  const { t } = useTranslation();
  const [feesOverview, setFeesOverview] = useState(null);
  const [feesLoading, setFeesLoading] = useState(true);
  const { students } = useApp();

  useEffect(() => {
    if (classesEnhancedApi && id) {
      setFeesLoading(true);
      classesEnhancedApi.getFeesOverview(id).then(setFeesOverview).catch(logger.error).finally(() => setFeesLoading(false));
    }
  }, [id, classesEnhancedApi]);

  const classStudents = students.filter(s =>
    String(s.classId?._id || s.classId) === String(cls?.id) && (s.status || 'active') === 'active' && s.isDeleted !== true
  );
  const pendingStudents = classStudents.filter(s => s.feeStatus !== 'paid');

  const stats = [
    { label: t('classes.collected', 'Collected'), value: `₹${feesOverview?.collected?.toLocaleString('en-IN') || "0"}`, icon: CheckCircle2, bg: 'bg-green-50 dark:bg-green-950/30', iconColor: 'text-green-600 dark:text-green-400' },
    { label: t('classes.pending', 'Pending'), value: `₹${feesOverview?.pending?.toLocaleString('en-IN') || "0"}`, icon: AlertCircle, bg: 'bg-amber-50 dark:bg-amber-950/30', iconColor: 'text-amber-600 dark:text-amber-400' },
    { label: t('classes.overdue', 'Overdue'), value: `₹${feesOverview?.overdue?.toLocaleString('en-IN') || "0"}`, icon: AlertTriangle, bg: 'bg-red-50 dark:bg-red-950/30', iconColor: 'text-red-500 dark:text-red-400' },
  ];

  return (
    <div className="space-y-4">
      {/* Fee Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {feesLoading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-gray-100 dark:border-zinc-800 space-y-2">
              <Bone className="h-3 w-20" /><Bone className="h-6 w-16" />
            </div>
          ))
        ) : stats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon size={16} className={stat.iconColor} />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-zinc-200">{stat.value}</h3>
            <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Defaulters List */}
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{t('pages.defaultersList')}</h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{t('classes.pendingPaymentsCount', '{{count}} pending payments', { count: pendingStudents.length })}</p>
          </div>
        </div>

        {pendingStudents.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-zinc-800">
            {pendingStudents.map(student => (
              <div key={student.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-zinc-900 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {student.photo ? (
                      <img src={student.photo} alt={student.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    ) : (
                      <span className="text-xs font-medium text-gray-600 dark:text-zinc-400">{student.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{student.name}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{t('classes.roll', 'Roll')} {student.rollNo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">₹{student.pendingFees ? Number(student.pendingFees).toLocaleString('en-IN') : "0"}</span>
                  <Button size="sm" variant="flat" className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300" onPress={() => navigate(`/fees/collect?student=${student.id}`)}>{t('pages.collect')}</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <IndianRupee size={32} className="mx-auto text-gray-200 dark:text-zinc-700 mb-3" />
            <p className="text-sm font-medium text-gray-600 dark:text-zinc-300 mb-1">{t('classes.allFeesCollected', 'All fees collected!')}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">{t('pages.noPendingFees')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ACADEMICS TAB
// ═══════════════════════════════════════════════════════════════════

function AcademicsTab({ id, cls, classesEnhancedApi }) {
  const { t } = useTranslation();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setLoading(true);
    examsApi.getByClass(id)
      .then(data => { if (!controller.signal.aborted) setExams(data || []); })
      .catch(error => { if (!controller.signal.aborted) { logger.error('Error fetching exams:', error); toast.error(t('toast.error.failedToLoadExams')); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'ongoing': return 'warning';
      case 'completed': case 'results_published': return 'success';
      default: return 'default';
    }
  };

  const examsByStatus = useMemo(() => ({
    scheduled: exams.filter(e => e.status === 'scheduled'),
    ongoing: exams.filter(e => e.status === 'ongoing'),
    completed: exams.filter(e => e.status === 'completed' || e.status === 'results_published'),
  }), [exams]);

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t('pages.totalExams'), value: exams.length, color: 'text-gray-900 dark:text-zinc-100' },
          { label: t('pages.scheduled'), value: examsByStatus.scheduled.length, color: 'text-blue-600' },
          { label: t('pages.ongoing'), value: examsByStatus.ongoing.length, color: 'text-amber-600' },
          { label: t('pages.completed'), value: examsByStatus.completed.length, color: 'text-green-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-gray-100 dark:border-zinc-800">
            <p className="text-xs text-gray-500 dark:text-zinc-400">{stat.label}</p>
            <p className={`text-xl font-semibold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Exams List */}
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <FileText size={14} className="text-gray-600 dark:text-zinc-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('pages.classExams')}</h3>
              <p className="text-[11px] text-gray-500 dark:text-zinc-400">{t('pages.allScheduledAndCompletedExams')}</p>
            </div>
          </div>
          <Button size="sm" className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900" startContent={<FileText size={14} />}
            onPress={() => navigate('/academics/exams')}>{t('classes.manageExams', 'Manage Exams')}</Button>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => <Bone key={i} className="h-14 w-full" />)}
          </div>
        ) : exams.length === 0 ? (
          <div className="p-8 text-center">
            <FileText size={40} className="mx-auto text-gray-200 dark:text-zinc-700 mb-4" />
            <p className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.noExamsScheduledForThisClassYet')}</p>
            <Button className="mt-4 bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900" startContent={<FileText size={16} />}
              onPress={() => navigate('/academics/exams')}>{t('classes.createExam', 'Create Exam')}</Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-zinc-800">
            {exams.map((exam) => (
              <div key={exam._id || exam.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                onClick={() => navigate(`/academics/exams/${exam._id || exam.id}`)}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                    <FileText size={18} className="text-gray-600 dark:text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{exam.name}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{exam.subjectName || t('classes.general', 'General')} · {exam.type?.replace('_', ' ') || t('classes.exam', 'Exam')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{exam.startDate ? formatShortDate(exam.startDate) : t('classes.notScheduled', 'Not scheduled')}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{t('classes.max', 'Max')}: {exam.maxMarks || 100} | {t('classes.pass', 'Pass')}: {exam.passingMarks || 35}</p>
                  </div>
                  <Chip size="sm" color={getStatusColor(exam.status)} variant="flat">{t(`classes.examStatus.${exam.status || 'scheduled'}`, exam.status?.replace('_', ' ') || 'scheduled')}</Chip>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
