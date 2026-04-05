import { useState, useEffect } from "react";
import logger from "../../utils/logger";
import {
  IndianRupee, Users, Clock,
  BookOpen, CheckCircle2, Star,
  ArrowLeft, AlertCircle, MessageSquare,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useValidatedParams } from "../../hooks/useValidatedParams";
import { useApp } from "../../context/AppContext";
import { toast } from "react-hot-toast";
import Attendance from "./Attendance";
import Timetable from "./Timetable";
import ClassSettingsPanel from "./ClassSettingsPanel";
import ClassTeacherAssignmentModal from "./components/ClassTeacherAssignmentModal";
import { toTodayDateString } from '../../utils/dateFormatter';
import { useTranslation } from 'react-i18next';
import { DetailPageSkeleton } from '../../components/skeletons/PageSkeletons';
import ErrorBoundary from '../../components/ui/ErrorBoundary';

// Extracted components
import { ClassDashboardHeader } from './components/ClassDashboardHeader';
import { SidebarSchedule } from './components/SidebarSchedule';
import { SidebarAnnouncements } from './components/SidebarAnnouncements';
import { OverviewTab } from './components/OverviewTab';
import { StudentsTab } from './components/StudentsTab';
import { FeesTab } from './components/FeesTab';
import { AcademicsTab } from './components/AcademicsTab';

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
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [refreshError, setRefreshError] = useState(false);

  const cls = classesWithTeachers.find(c => String(c.id) === String(id) || String(c._id) === String(id)) || null;

  // Sync tab state from URL (e.g. browser back/forward) — use setActiveTabState
  // directly to avoid calling navigate() again (URL is already correct)
  useEffect(() => {
    setActiveTabState(tabFromUrl || 'overview');
  }, [tabFromUrl]);

  // Refresh class data on mount
  useEffect(() => {
    if (id && refetch && !isRefreshing) {
      setIsRefreshing(true);
      setRefreshError(false);
      refetch(true)
        .catch(e => {
          logger.error('Error refreshing class data:', e);
          setRefreshError(true);
        })
        .finally(() => setIsRefreshing(false));
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

    setSidebarLoading(true);
    Promise.allSettled([
      classesEnhancedApi.getTodayStatus(id).then(d => { if (!aborted()) setTodayStatus(d); }),
      classesEnhancedApi.getRating(id).then(d => { if (!aborted()) setClassRating(d); }),
      classesEnhancedApi.getAnnouncements(id, 3).then(d => { if (!aborted()) setAnnouncements(d || []); }),
    ]).catch(e => { if (!aborted()) logger.error('sidebar fetch:', e); })
      .finally(() => { if (!aborted()) setSidebarLoading(false); });

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
    a.download = `${cls?.name || 'class'}-${cls?.section || ''}-report-${toTodayDateString()}.csv`;
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

        <ClassDashboardHeader
          cls={cls}
          headerStats={headerStats}
          navigate={navigate}
          handleExportReport={handleExportReport}
          handleSendNotice={handleSendNotice}
          setActiveTab={setActiveTab}
          setIsAssignTeacherModalOpen={setIsAssignTeacherModalOpen}
        />
      </div>

      {/* Refresh error banner */}
      {refreshError && (
        <div className="mb-4 flex items-center justify-between gap-3 px-4 py-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <span className="text-sm text-red-700 dark:text-red-300">{t('classes.refreshError', 'Failed to load latest data. Showing cached information.')}</span>
          </div>
          <button
            onClick={() => {
              setRefreshError(false);
              setIsRefreshing(true);
              refetch(true)
                .catch(e => { logger.error('Retry refresh:', e); setRefreshError(true); })
                .finally(() => setIsRefreshing(false));
            }}
            className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 whitespace-nowrap"
          >
            {t('common.retry', 'Retry')}
          </button>
        </div>
      )}

      {/* TABS */}
      <div className="mb-5">
        <div role="tablist" aria-label={t('classes.classDashboardTabs', 'Class dashboard tabs')} className="flex items-center gap-1 border-b border-gray-200 dark:border-zinc-800 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.key} role="tab" aria-selected={activeTab === tab.key} aria-controls={`tabpanel-${tab.key}`} id={`tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              onKeyDown={(e) => {
                const idx = tabs.findIndex(t => t.key === tab.key);
                if (e.key === 'ArrowRight' && idx < tabs.length - 1) { e.preventDefault(); setActiveTab(tabs[idx + 1].key); }
                if (e.key === 'ArrowLeft' && idx > 0) { e.preventDefault(); setActiveTab(tabs[idx - 1].key); }
              }}
              tabIndex={activeTab === tab.key ? 0 : -1}
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
      {activeTab === "timetable" && <ErrorBoundary key="timetable"><Timetable classId={id} /></ErrorBoundary>}
      {activeTab === "settings" && <ErrorBoundary key="settings"><ClassSettingsPanel classId={id} /></ErrorBoundary>}
      {activeTab === "overview" && (
        <ErrorBoundary key="overview"><OverviewTab id={id} cls={cls} classesEnhancedApi={classesEnhancedApi} todayStatus={todayStatus} classRating={classRating} /></ErrorBoundary>
      )}

      {/* Grid layout tabs (with sidebar) */}
      {!fullWidthTabs.includes(activeTab) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {activeTab === "students" && (
              <ErrorBoundary key="students"><StudentsTab id={id} cls={cls} navigate={navigate} classesEnhancedApi={classesEnhancedApi} /></ErrorBoundary>
            )}
            {activeTab === "fees" && (
              <ErrorBoundary key="fees"><FeesTab id={id} cls={cls} classesEnhancedApi={classesEnhancedApi} navigate={navigate} /></ErrorBoundary>
            )}
            {activeTab === "attendance" && <ErrorBoundary key="attendance"><Attendance classId={id} /></ErrorBoundary>}
            {activeTab === "academics" && (
              <ErrorBoundary key="academics"><AcademicsTab id={id} cls={cls} classesEnhancedApi={classesEnhancedApi} /></ErrorBoundary>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="lg:col-span-1 space-y-4">
            {/* Today's Schedule */}
            <SidebarSchedule todayStatus={todayStatus} onViewTimetable={() => setActiveTab("timetable")} loading={sidebarLoading} />

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
            <SidebarAnnouncements announcements={announcements} onSend={handleSendNotice} loading={sidebarLoading} />

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
