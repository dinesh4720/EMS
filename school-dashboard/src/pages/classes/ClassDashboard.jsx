import { useState, useEffect, useTransition, Suspense, useMemo } from "react";
import logger from "../../utils/logger";
import {
  IndianRupee, Users, Clock,
  CheckCircle2,
  ArrowLeft, MessageSquare,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useValidatedParams } from "../../hooks/useValidatedParams";
import { useApp } from "../../context/AppContext";
import { toast } from "react-hot-toast";
import lazyWithRetry from "../../utils/lazyWithRetry";
import ClassTeacherAssignmentModal from "./components/ClassTeacherAssignmentModal";
import { toTodayDateString } from '../../utils/dateFormatter';
import { useTranslation } from 'react-i18next';
import { DetailPageSkeleton } from '../../components/skeletons/PageSkeletons';
import SkeletonTable from '../../components/skeletons/SkeletonTable';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import Alert from '../../components/ui/Alert';
import ErrorState from '../../components/ui/ErrorState';
import Chip from '../../components/ui/Chip';
import Drawer from '../../components/ui/Drawer';
import MinimalTabs from '../../components/ui/MinimalTabs';

// Extracted components (always-visible sidebar/header — static imports)
import { ClassDashboardHeader } from './components/ClassDashboardHeader';
import { SidebarSchedule } from './components/SidebarSchedule';
import { SidebarAnnouncements } from './components/SidebarAnnouncements';
import StudentOverlay from '../../components/students/StudentOverlay';
import useStudentOverlay from '../../hooks/useStudentOverlay';

// Tab content — lazy-loaded to avoid synchronous render jank on tab switch
const Attendance = lazyWithRetry(() => import("./Attendance"));
const Timetable = lazyWithRetry(() => import("./Timetable"));
const ClassSettingsPanel = lazyWithRetry(() => import("./ClassSettingsPanel"));
const OverviewTab = lazyWithRetry(() => import('./components/OverviewTab').then(m => ({ default: m.OverviewTab })));
const StudentsTab = lazyWithRetry(() => import('./components/StudentsTab').then(m => ({ default: m.StudentsTab })));
const FeesTab = lazyWithRetry(() => import('./components/FeesTab').then(m => ({ default: m.FeesTab })));
const AcademicsTab = lazyWithRetry(() => import('./components/AcademicsTab').then(m => ({ default: m.AcademicsTab })));
const HomeworkTab = lazyWithRetry(() => import('./components/HomeworkTab'));

export default function ClassDashboard() {
  const { t } = useTranslation();
  const { params: { id }, isValid } = useValidatedParams({ id: 'objectId' }, { redirectTo: '/classes' });
  const navigate = useNavigate();
  const location = useLocation();
  const { classesWithTeachers, students, classesEnhancedApi, classesApi, refetch, loading } = useApp();
  const studentOverlay = useStudentOverlay();
  const classRowIds = useMemo(
    () =>
      (students || [])
        .filter(
          (s) =>
            String(s.classId?._id || s.classId) === String(id) &&
            (s.status || "active") === "active" &&
            s.isDeleted !== true
        )
        .map((s) => String(s.id || s._id)),
    [students, id]
  );

  const searchParams = new URLSearchParams(location.search);
  const tabFromUrl = searchParams.get('tab');
  // 'settings' is no longer a tab — it opens as a drawer; fall back to overview.
  const initialTab = tabFromUrl && tabFromUrl !== 'settings' ? tabFromUrl : 'overview';
  const [activeTab, setActiveTabState] = useState(initialTab);
  const [isTabPending, startTabTransition] = useTransition();

  // Sync tab state to URL so back/forward navigation restores correct tab.
  // startTransition defers the heavy tab render so the UI stays responsive.
  const setActiveTab = (tab) => {
    const newParams = new URLSearchParams(location.search);
    if (tab === 'overview') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', tab);
    }
    const newSearch = newParams.toString();
    navigate(`${location.pathname}${newSearch ? `?${newSearch}` : ''}`, { replace: true });
    startTabTransition(() => {
      setActiveTabState(tab);
    });
  };

  const [classSettings, setClassSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAssignTeacherModalOpen, setIsAssignTeacherModalOpen] = useState(false);
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);

  // Lifted state: todayStatus + classRating fetched at parent level for header + sidebar + overview
  const [todayStatus, setTodayStatus] = useState(null);
  const [classRating, setClassRating] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [refreshError, setRefreshError] = useState(false);

  const cls = classesWithTeachers.find(c => String(c.id) === String(id) || String(c._id) === String(id)) || null;

  // Derive student count live from students array so it stays accurate after add/remove
  const liveStudentCount = useMemo(
    () => students.filter(s =>
      String(s.classId?._id || s.classId) === String(id) &&
      (s.status || 'active') === 'active' &&
      s.isDeleted !== true
    ).length,
    [students, id]
  );

  // Sync tab state from URL (e.g. browser back/forward) — use setActiveTabState
  // directly to avoid calling navigate() again (URL is already correct)
  useEffect(() => {
    if (tabFromUrl === 'settings') {
      setIsSettingsDrawerOpen(true);
      setActiveTabState('overview');
      return;
    }
    setActiveTabState(tabFromUrl || 'overview');
  }, [tabFromUrl]);

  // Refresh class data on mount
  useEffect(() => {
    if (!id || !refetch) return;
    setIsRefreshing(true);
    setRefreshError(false);
    refetch(true)
      .catch(e => {
        logger.error('Error refreshing class data:', e);
        setRefreshError(true);
      })
      .finally(() => setIsRefreshing(false));
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

    // Refresh todayStatus every 5 minutes so the "Current Period" KPI and
    // sidebar schedule stay accurate as class periods change throughout the day.
    const clockInterval = setInterval(() => {
      if (!aborted()) {
        classesEnhancedApi.getTodayStatus(id)
          .then(d => { if (!aborted()) setTodayStatus(d); })
          .catch(e => { if (!aborted()) logger.error('todayStatus refresh:', e); });
      }
    }, 5 * 60 * 1000);

    return () => {
      controller.abort();
      clearInterval(clockInterval);
    };
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
    { key: "overview", title: t('classes.overview', 'Overview') },
    { key: "students", title: t('classes.students', 'Students') },
    { key: "academics", title: t('classes.academics', 'Academics') },
    { key: "fees", title: t('classes.fees', 'Fees') },
    { key: "homework", title: t('classes.homework', 'Homework') },
    { key: "attendance", title: t('classes.attendance', 'Attendance') },
    { key: "timetable", title: t('classes.timeTable', 'Time Table') },
  ];

  const openSettings = () => setIsSettingsDrawerOpen(true);

  if (!isValid) return null;

  if (loading && !cls) return (
    <div className="w-full flex-1 bg-bg p-6 min-h-screen">
      <DetailPageSkeleton avatar={false} fields={8} />
    </div>
  );

  if (!cls && classesWithTeachers.length > 0) {
    return (
      <div className="w-full flex-1 bg-bg p-6 min-h-screen">
        <button onClick={() => navigate('/classes')} className="flex items-center gap-2 text-sm text-fg-muted hover:text-fg transition-colors mb-4">
          <ArrowLeft size={16} /><span>{t('pages.backToClasses')}</span>
        </button>
        <div className="bg-surface rounded-lg border border-divider">
          <ErrorState
            title={t('pages.classNotFound1')}
            description={t('pages.theClassYouReLookingForDoesnTExistOrHasBeenRemoved')}
            onRetry={() => navigate('/classes')}
            retryLabel={t('classes.viewAllClasses', 'View All Classes')}
            size="lg"
          />
        </div>
      </div>
    );
  }

  const attendancePercentage = todayStatus?.attendance?.percentage || cls?.attendanceToday || 0;

  // Header KPI stats (always visible) — dp-metric atoms
  const headerStats = [
    {
      label: t('classes.attendance', 'Attendance'),
      value: `${attendancePercentage}%`,
      subtext: t('classes.presentToday', '{{count}} present today', { count: todayStatus?.attendance?.present || 0 }),
    },
    {
      label: t('classes.currentPeriod', 'Current Period'),
      value: todayStatus?.currentClass?.subject || t('classes.free', 'Free'),
      subtext: todayStatus?.currentClass?.teacher || t('classes.noClassNow', 'No class now'),
    },
    {
      label: t('classes.classRating', 'Rating'),
      value: (classRating?.overallRating || classRating?.rating || 0).toFixed(1),
      subtext: t('classes.outOf5', 'out of 5.0'),
    },
    {
      label: t('classes.students', 'Students'),
      value: `${liveStudentCount}`,
      subtext: t('classes.ofCapacity', 'of {{count}} capacity', { count: cls?.strengthLimit?.current || 40 }),
    },
  ];

  const fullWidthTabs = ["timetable", "overview"];

  return (
    <div className="page class-dashboard">
      {/* Breadcrumb */}
      <div className="row gap-2" style={{ padding: '12px 24px 0', alignItems: 'center', fontSize: 12 }}>
        <button
          type="button"
          onClick={() => navigate('/classes')}
          className="row gap-1 subtle"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={13} aria-hidden />
          <span>{t('pages.backToClasses')}</span>
        </button>
      </div>

      {/* Hero + dp-metric strip */}
      <ClassDashboardHeader
        cls={cls}
        headerStats={headerStats}
        studentCount={liveStudentCount}
        navigate={navigate}
        handleExportReport={handleExportReport}
        handleSendNotice={handleSendNotice}
        setActiveTab={setActiveTab}
        setIsAssignTeacherModalOpen={setIsAssignTeacherModalOpen}
        openSettings={openSettings}
      />

      {/* Refresh error banner */}
      {refreshError && (
        <div style={{ padding: '12px 24px 0' }}>
          <Alert
            variant="danger"
            action={
              <button
                onClick={() => {
                  setRefreshError(false);
                  setIsRefreshing(true);
                  refetch(true)
                    .catch(e => { logger.error('Retry refresh:', e); setRefreshError(true); })
                    .finally(() => setIsRefreshing(false));
                }}
                className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 rounded"
              >
                {t('common.retry', 'Retry')}
              </button>
            }
          >
            {t('classes.refreshError', 'Failed to load latest data. Showing cached information.')}
          </Alert>
        </div>
      )}

      {/* Tabs — segmented underline (MinimalTabs) */}
      <div className={`class-dashboard__tabs ${isTabPending ? 'opacity-70' : ''}`}>
        <MinimalTabs
          tabs={tabs}
          activeKey={activeTab}
          onChange={setActiveTab}
          variant="underline"
          size="md"
          ariaLabel={t('classes.classDashboardTabs', 'Class dashboard tabs')}
        />
      </div>

      {/* Tab panel */}
      <div
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="class-dashboard__panel"
      >
        {/* Full-width tabs */}
        {activeTab === "timetable" && <ErrorBoundary key="timetable"><Suspense fallback={<SkeletonTable rows={6} />}><Timetable classId={id} /></Suspense></ErrorBoundary>}
        {activeTab === "overview" && (
          <ErrorBoundary key="overview"><Suspense fallback={<SkeletonTable rows={4} />}><OverviewTab id={id} cls={cls} classesEnhancedApi={classesEnhancedApi} todayStatus={todayStatus} classRating={classRating} /></Suspense></ErrorBoundary>
        )}

        {/* Grid layout tabs (with sticky sidebar) */}
        {!fullWidthTabs.includes(activeTab) && (
          <div className="class-dashboard__grid">
            <div className="col gap-4" style={{ minWidth: 0 }}>
              {activeTab === "students" && (
                <ErrorBoundary key="students"><Suspense fallback={<SkeletonTable rows={8} />}><StudentsTab id={id} cls={cls} navigate={navigate} classesEnhancedApi={classesEnhancedApi} openStudent={studentOverlay.open} activeStudentId={studentOverlay.studentId} /></Suspense></ErrorBoundary>
              )}
              {activeTab === "fees" && (
                <ErrorBoundary key="fees"><Suspense fallback={<SkeletonTable rows={6} />}><FeesTab id={id} cls={cls} classesEnhancedApi={classesEnhancedApi} navigate={navigate} /></Suspense></ErrorBoundary>
              )}
              {activeTab === "attendance" && <ErrorBoundary key="attendance"><Suspense fallback={<SkeletonTable rows={8} />}><Attendance classId={id} /></Suspense></ErrorBoundary>}
              {activeTab === "academics" && (
                <ErrorBoundary key="academics"><Suspense fallback={<SkeletonTable rows={6} />}><AcademicsTab id={id} cls={cls} classesEnhancedApi={classesEnhancedApi} /></Suspense></ErrorBoundary>
              )}
              {activeTab === "homework" && (
                <ErrorBoundary key="homework"><Suspense fallback={<SkeletonTable rows={5} />}><HomeworkTab id={id} cls={cls} /></Suspense></ErrorBoundary>
              )}
            </div>

            {/* RIGHT SIDEBAR — frosted glass */}
            <aside className="class-dashboard__sidebar glass" style={{ padding: 16, borderRadius: 12 }}>
              <SidebarSchedule todayStatus={todayStatus} onViewTimetable={() => setActiveTab("timetable")} loading={sidebarLoading} />

              {/* Quick Actions */}
              <div className="card">
                <div className="card__head">
                  <span className="card__title">{t('pages.quickActions1')}</span>
                </div>
                <div className="card__body">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'students', icon: Users, label: t('pages.students1') },
                      { key: 'attendance', icon: CheckCircle2, label: t('pages.attendance2') },
                      { key: 'fees', icon: IndianRupee, label: t('pages.fees1') },
                      { key: 'timetable', icon: Clock, label: t('pages.timetable2') },
                    ].map(action => (
                      <button key={action.key} onClick={() => setActiveTab(action.key)} className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-surface-2 hover:bg-surface-hover transition-colors">
                        <action.icon size={16} className="text-fg-muted" />
                        <span className="text-[11px] text-fg-muted">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Class Teacher Card */}
              {cls?.classTeacherId && (
                <div className="card">
                  <div className="card__head">
                    <span className="card__title">{t('pages.classTeacher2')}</span>
                  </div>
                  <div className="card__body">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center">
                        <span className="text-sm font-medium text-fg-muted">{cls?.teacher?.charAt(0) || 'T'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-fg truncate">{cls?.teacher || t('classes.teacher', 'Teacher')}</p>
                        <p className="text-xs text-fg-muted">{t('pages.classTeacher2')}</p>
                      </div>
                      <button onClick={() => navigate(`/messaging`, { state: { recipientId: cls.classTeacherId } })} className="iconbtn" aria-label="Message teacher">
                        <MessageSquare size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <SidebarAnnouncements announcements={announcements} onSend={handleSendNotice} loading={sidebarLoading} />

              {/* Assigned Subjects */}
              {!settingsLoading && classSettings?.assignedSubjects?.length > 0 && (
                <div className="card">
                  <div className="card__head">
                    <span className="card__title">{t('pages.assignedSubjects')} ({classSettings.assignedSubjects.length})</span>
                  </div>
                  <div className="card__body">
                    <div className="flex flex-wrap gap-1.5">
                      {classSettings.assignedSubjects.map((subject) => (
                        <Chip key={subject} size="sm" color="neutral">{subject}</Chip>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>

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

      {/* Settings opens as drawer */}
      <Drawer
        isOpen={isSettingsDrawerOpen}
        onClose={() => setIsSettingsDrawerOpen(false)}
        title={t('classes.classSettings', 'Class Settings')}
        size="lg"
        ariaLabel="Class settings"
      >
        <ErrorBoundary key="settings-drawer">
          <Suspense fallback={<SkeletonTable rows={4} />}>
            <ClassSettingsPanel classId={id} />
          </Suspense>
        </ErrorBoundary>
      </Drawer>

      <StudentOverlay
        studentId={studentOverlay.studentId}
        rowIds={classRowIds}
        onClose={studentOverlay.close}
        onNavigate={studentOverlay.navigate}
      />
    </div>
  );
}
