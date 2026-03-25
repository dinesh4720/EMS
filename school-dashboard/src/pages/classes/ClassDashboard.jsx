import { useState, useMemo, useEffect } from "react";
import {
  Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
  Input, Chip
} from "@heroui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { useValidatedParams } from "../../hooks/useValidatedParams";
import {
  Calendar, IndianRupee, MessageSquare, Users, Clock,
  BookOpen, TrendingUp, AlertCircle, CheckCircle2, Search, Phone,
  GraduationCap, Award, ArrowLeft, Star, StarHalf,
  Activity, FileText, Settings, AlertTriangle, Download,
  Edit, MoreVertical, Send, Mail
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { toast } from "react-hot-toast";
import { examsApi } from "../../services/api";
import Attendance from "./Attendance";
import Timetable from "./Timetable";
import ClassSettingsPanel from "./ClassSettingsPanel";
import ClassTeacherAssignmentModal from "./components/ClassTeacherAssignmentModal";
import { useTranslation } from 'react-i18next';

export default function ClassDashboard() {
  const { t } = useTranslation();
  const { params: { id }, isValid } = useValidatedParams({ id: 'objectId' }, { redirectTo: '/classes' });
  const navigate = useNavigate();
  const location = useLocation();
  const { classesWithTeachers, students, classesEnhancedApi, classesApi, refetch, loading } = useApp();

  // Get tab from URL query parameter or default to "overview"
  const searchParams = new URLSearchParams(location.search);
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || "overview");

  const [classSettings, setClassSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAssignTeacherModalOpen, setIsAssignTeacherModalOpen] = useState(false);

  const cls = classesWithTeachers.find(c => String(c.id) === String(id) || String(c._id) === String(id)) || null;

  // Update active tab when URL changes
  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Refresh class data when component mounts or when focusing on window
  useEffect(() => {
    const refreshClassData = async () => {
      if (id && refetch && !isRefreshing) {
        try {
          setIsRefreshing(true);
          await refetch(true);
        } catch (error) {
          console.error('Error refreshing class data:', error);
        } finally {
          setIsRefreshing(false);
        }
      }
    };

    refreshClassData();
  }, [id, refetch]);

  // Load class settings
  useEffect(() => {
    if (!id || !classesApi) return;
    const controller = new AbortController();
    loadClassSettings(controller.signal);
    return () => controller.abort();
  }, [id, classesApi]);

  const loadClassSettings = async (signal) => {
    try {
      setSettingsLoading(true);
      const settings = await classesApi.getSettings(id);
      if (!signal?.aborted) setClassSettings(settings);
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error("Error loading class settings:", error);
    } finally {
      if (!signal?.aborted) setSettingsLoading(false);
    }
  };


  // Tabs configuration
  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "students", label: "Students" },
    { key: "attendance", label: "Attendance" },
    { key: "fees", label: "Fees" },
    { key: "academics", label: "Academics" },
    { key: "timetable", label: "Time Table" },
    { key: "settings", label: "Settings" },
  ];

  if (!isValid) return null;

  if (loading && !cls) return (
    <div className="w-full flex-1 bg-gray-50 dark:bg-zinc-950 p-6 min-h-screen flex items-center justify-center">
      <div className="text-gray-400 dark:text-zinc-500 text-sm">{t('pages.loadingClassData')}</div>
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
            View All Classes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 bg-gray-50 dark:bg-zinc-950 p-6 min-h-screen">
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="mb-6">
        <button onClick={() => navigate('/classes')} className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300 transition-colors mb-2">
          <ArrowLeft size={16} /><span>{t('pages.backToClasses')}</span>
        </button>

        <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <span className="text-xl font-semibold text-gray-600 dark:text-zinc-400">
                  {cls?.name?.replace("Class ", "")}{cls?.section}
                </span>
              </div>

              {/* Info */}
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">
                  Grade {cls?.name || 'N/A'} - Section {cls?.section || 'N/A'}
                </h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-zinc-400">
                  <span>{cls?.strength || 0} Students</span>
                  <span className="text-gray-300 dark:text-zinc-600">|</span>
                  <span>{cls?.strengthLimit || 40} Capacity</span>
                </div>
                {cls?.classTeacherId ? (
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 dark:text-zinc-500">
                    <Users size={12} />
                    <span
                      className="text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300 cursor-pointer"
                      onClick={() => navigate(`/staffs/${cls.classTeacherId}`)}
                    >
                      {cls?.teacher || 'Class Teacher'}
                    </span>
                    <span className="text-gray-300 dark:text-zinc-600">|</span>
                    <span>{t('pages.classTeacher2')}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 dark:text-zinc-500">
                    <AlertCircle size={12} />
                    <span>{t('pages.noClassTeacherAssigned')}</span>
                    <button
                      onClick={() => setIsAssignTeacherModalOpen(true)}
                      className="ml-2 text-xs font-medium text-blue-600 hover:text-blue-800 underline"
                    >
                      Assign class teacher
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="flat" className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300" startContent={<MessageSquare size={16} />}
                onPress={() => navigate('/messaging')}>{t('pages.message1')}</Button>
              <Button className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-gray-800 dark:hover:bg-zinc-200" startContent={<Edit size={16} />}
                onPress={() => setActiveTab("settings")}>{t('pages.settings2')}</Button>
              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly variant="light" className="text-gray-400 dark:text-zinc-500"><MoreVertical size={20} /></Button>
                </DropdownTrigger>
                <DropdownMenu className="min-w-[180px]">
                  <DropdownItem key="export" startContent={<Download size={14} className="text-gray-400 dark:text-zinc-500" />}>{t('pages.exportReport')}</DropdownItem>
                  <DropdownItem key="notice" startContent={<Send size={14} className="text-gray-400 dark:text-zinc-500" />}>{t('pages.sendNotice')}</DropdownItem>
                  <DropdownItem key="timetable" startContent={<Clock size={14} className="text-gray-400 dark:text-zinc-500" />} onPress={() => setActiveTab("timetable")}>{t('pages.viewTimetable')}</DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          TABS
      ═══════════════════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════════════════
          CONTENT AREA
      ═══════════════════════════════════════════════════════════════════ */}

      {/* ─── FULL-WIDTH TABS (Timetable, Settings) ─── */}
      {activeTab === "timetable" && (
        <Timetable classId={id} />
      )}

      {activeTab === "settings" && (
        <ClassSettingsPanel classId={id} />
      )}

      {/* ─── GRID LAYOUT TABS (Overview, Students, Fees, Academics) ─── */}
      {!["timetable", "settings"].includes(activeTab) && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* MAIN CONTENT - 2/3 */}
        <div className="lg:col-span-2 space-y-4">

          {/* ─── OVERVIEW TAB ─── */}
          {activeTab === "overview" && (
            <OverviewTab id={id} cls={cls} classesEnhancedApi={classesEnhancedApi} />
          )}

          {/* ─── STUDENTS TAB ─── */}
          {activeTab === "students" && (
            <StudentsTab id={id} cls={cls} navigate={navigate} />
          )}

          {/* ─── FEES TAB ─── */}
          {activeTab === "fees" && (
            <FeesTab id={id} cls={cls} classesEnhancedApi={classesEnhancedApi} navigate={navigate} />
          )}

          {/* ─── ATTENDANCE TAB ─── */}
          {activeTab === "attendance" && <Attendance classId={id} />}

          {/* ─── ACADEMICS TAB ─── */}
          {activeTab === "academics" && (
            <AcademicsTab id={id} cls={cls} classesEnhancedApi={classesEnhancedApi} />
          )}
        </div>

        {/* RIGHT SIDEBAR - 1/3 */}
        <div className="lg:col-span-1 space-y-4">

          {/* Quick Actions */}
          <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-5">
            <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-4">{t('pages.quickActions1')}</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setActiveTab("students")} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800">
                <Users size={18} className="text-gray-600 dark:text-zinc-400" />
                <span className="text-xs text-gray-600 dark:text-zinc-400">{t('pages.students1')}</span>
              </button>
              <button onClick={() => setActiveTab("attendance")} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800">
                <CheckCircle2 size={18} className="text-gray-600 dark:text-zinc-400" />
                <span className="text-xs text-gray-600 dark:text-zinc-400">{t('pages.attendance2')}</span>
              </button>
              <button onClick={() => setActiveTab("fees")} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800">
                <IndianRupee size={18} className="text-gray-600 dark:text-zinc-400" />
                <span className="text-xs text-gray-600 dark:text-zinc-400">{t('pages.fees1')}</span>
              </button>
              <button onClick={() => setActiveTab("timetable")} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800">
                <Clock size={18} className="text-gray-600 dark:text-zinc-400" />
                <span className="text-xs text-gray-600 dark:text-zinc-400">{t('pages.timetable2')}</span>
              </button>
            </div>
          </div>

          {/* Class Teacher Card */}
          {cls?.classTeacherId && (
            <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-5">
              <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-4">{t('pages.classTeacher2')}</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                    {cls?.teacher?.charAt(0) || 'T'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{cls?.teacher || 'Teacher'}</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.classTeacher2')}</p>
                </div>
                <button
                  onClick={() => navigate(`/messages?to=${cls.classTeacherId}`)}
                  className="p-2 hover:bg-gray-50 dark:hover:bg-zinc-900 rounded-lg"
                >
                  <MessageSquare size={16} className="text-gray-400 dark:text-zinc-500" />
                </button>
              </div>
            </div>
          )}

          {/* Assigned Subjects */}
          {!settingsLoading && classSettings?.assignedSubjects && classSettings.assignedSubjects.length > 0 && (
            <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-5">
              <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-4">{t('pages.assignedSubjects')}</h3>
              <div className="flex flex-wrap gap-2">
                {classSettings.assignedSubjects.map((subject) => (
                  <span
                    key={subject}
                    className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded-md"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Assign Class Teacher Modal */}
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

// --- Sub-components ---

function OverviewTab({ id, cls, classesEnhancedApi }) {
  const { t } = useTranslation();
  const { classesApi } = useApp();
  const [todayStatus, setTodayStatus] = useState(null);
  const [todayStatusLoading, setTodayStatusLoading] = useState(false);
  const [academicPerformance, setAcademicPerformance] = useState(null);
  const [academicPerformanceLoading, setAcademicPerformanceLoading] = useState(false);
  const [classRating, setClassRating] = useState(null);
  const [ratingLoading, setRatingLoading] = useState(false);

  // Fetch data
  useEffect(() => {
    if (!id || !classesEnhancedApi) return;
    const controller = new AbortController();

    const fetchData = async () => {
      setTodayStatusLoading(true);
      setAcademicPerformanceLoading(true);
      setRatingLoading(true);

      try {
        const status = await classesEnhancedApi.getTodayStatus(id);
        if (!controller.signal.aborted) setTodayStatus(status);
      } catch (e) {
        if (!controller.signal.aborted) console.error('Error loading today status:', e);
      } finally { if (!controller.signal.aborted) setTodayStatusLoading(false); }

      try {
        const perf = await classesEnhancedApi.getAcademicPerformance(id);
        if (!controller.signal.aborted) setAcademicPerformance(perf);
      } catch (e) {
        if (!controller.signal.aborted) console.error('Error loading academic performance:', e);
      } finally { if (!controller.signal.aborted) setAcademicPerformanceLoading(false); }

      try {
        const rating = await classesEnhancedApi.getRating(id);
        if (!controller.signal.aborted) setClassRating(rating);
      } catch (e) {
        if (!controller.signal.aborted) console.error('Error loading class rating:', e);
      } finally { if (!controller.signal.aborted) setRatingLoading(false); }
    };

    fetchData();
    return () => controller.abort();
  }, [id, classesEnhancedApi]);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < fullStars; i++) stars.push(<Star key={`full-${i}`} size={14} className="fill-gray-400 dark:fill-zinc-500 text-gray-400 dark:text-zinc-500" />);
    if (hasHalfStar) stars.push(<StarHalf key="half" size={14} className="fill-gray-400 dark:fill-zinc-500 text-gray-400 dark:text-zinc-500" />);
    for (let i = 0; i < emptyStars; i++) stars.push(<Star key={`empty-${i}`} size={14} className="text-gray-300 dark:text-zinc-600" />);
    return stars;
  };

  const attendancePercentage = todayStatus?.attendance?.percentage || cls?.attendanceToday || 0;
  const needsAttention = attendancePercentage < 75;

  // Stats
  const stats = [
    { label: "Attendance", value: `${attendancePercentage}%`, subtext: `${todayStatus?.attendance?.present || 0} present`, icon: CheckCircle2 },
    { label: "Current Class", value: todayStatus?.currentClass?.subject || "Free", subtext: todayStatus?.currentClass?.teacher || "—", icon: BookOpen },
    { label: "Class Rating", value: (classRating?.overallRating || 0).toFixed(1), subtext: "out of 5.0", icon: Star },
    { label: "Students", value: cls?.strength || 0, subtext: `${cls?.strengthLimit || 40} capacity`, icon: Users },
  ];

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <stat.icon size={16} className="text-gray-600 dark:text-zinc-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-zinc-200">{stat.value}</h3>
            <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mt-0.5">{stat.label}</p>
            {stat.subtext && <p className="text-xs text-gray-400 dark:text-zinc-500 mt-2">{stat.subtext}</p>}
          </div>
        ))}
      </div>

      {/* Action Needed */}
      {needsAttention && (
        <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <AlertTriangle size={16} className="text-gray-600 dark:text-zinc-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('pages.actionNeeded1')}</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Attendance is below 75%</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-zinc-900">
              <AlertCircle size={18} className="text-gray-500 dark:text-zinc-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.lowAttendanceAlert')}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Current: {attendancePercentage}% (target: 75%)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Academic Overview */}
        <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <Award size={16} className="text-gray-600 dark:text-zinc-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('pages.academicOverview')}</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.topPerformersImprovements')}</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            {academicPerformanceLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-gray-300 dark:border-zinc-600 border-t-gray-600 dark:border-t-zinc-400 rounded-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-2">{t('pages.topPerformers')}</p>
                  {academicPerformance?.topPerformers?.slice(0, 3).map((s) => (
                    <div key={s._id || s.name} className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-zinc-800 last:border-0">
                      <span className="text-sm text-gray-700 dark:text-zinc-300">{s.name}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{s.percentage}%</span>
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
                      <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{s.percentage}%</span>
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
        <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <Star size={16} className="text-gray-600 dark:text-zinc-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('pages.classRatings')}</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.detailedBreakdown')}</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            {ratingLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-gray-300 dark:border-zinc-600 border-t-gray-600 dark:border-t-zinc-400 rounded-full" />
              </div>
            ) : (
              <div className="space-y-3">
                {classRating?.breakdown && Object.entries(classRating.breakdown).map(([key, val]) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize text-gray-600 dark:text-zinc-400">{key}</span>
                      <span className="font-medium text-gray-900 dark:text-zinc-100">{val.toFixed(1)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-800 dark:bg-zinc-200 rounded-full"
                        style={{ width: `${(val / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                {(!classRating?.breakdown || Object.keys(classRating.breakdown).length === 0) && (
                  <p className="text-xs text-gray-400 dark:text-zinc-500 text-center py-4">{t('pages.noRatingsAvailable')}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentsTab({ id, cls, navigate }) {
  const { t } = useTranslation();
  const { students } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");

  // Use String() comparison for ObjectId matching
  const classStudents = useMemo(() => students.filter(s =>
    String(s.classId) === String(cls?.id) &&
    (s.status || 'active') === 'active' &&
    s.isDeleted !== true
  ), [students, cls]);

  const filteredStudents = useMemo(() => {
    return classStudents.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.rollNo.toString().includes(searchQuery);
      const matchesFilter = filter === "all" ? true : s.feeStatus === filter;
      return matchesSearch && matchesFilter;
    });
  }, [classStudents, searchQuery, filter]);

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder={t('pages.searchStudents')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-gray-400 dark:focus:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </div>
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg">
            {["all", "paid", "pending"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  filter === f ? 'bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 shadow-sm' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{t('pages.classStudents')}</h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{filteredStudents.length} students</p>
          </div>
        </div>

        {filteredStudents.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-zinc-800">
            {filteredStudents.map(student => (
              <div
                key={student.id}
                className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                onClick={() => navigate(`/students/${student.id}`)}
              >
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
                    <p className="text-xs text-gray-500 dark:text-zinc-400">Roll {student.rollNo} • {student.parentName || 'Parent'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${student.attendanceStatus === 'present' ? "bg-gray-600 dark:bg-zinc-400" : "bg-gray-300 dark:bg-zinc-600"}`} />
                    <span className="text-xs text-gray-500 dark:text-zinc-400">
                      {student.attendanceStatus === 'present' ? 'Present' : 'Absent'}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-md ${
                    student.feeStatus === 'paid' ? 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400' : 'bg-gray-50 dark:bg-zinc-900 text-gray-500 dark:text-zinc-400'
                  }`}>
                    {student.feeStatus || 'Pending'}
                  </span>
                  <ArrowLeft size={16} className="text-gray-300 dark:text-zinc-600 rotate-180" />
                </div>
              </div>
            ))}
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

function FeesTab({ id, cls, classesEnhancedApi, navigate }) {
  const { t } = useTranslation();
  const [feesOverview, setFeesOverview] = useState(null);
  const { students } = useApp();

  useEffect(() => {
    if (classesEnhancedApi && id) {
      classesEnhancedApi.getFeesOverview(id).then(setFeesOverview).catch(console.error);
    }
  }, [id, classesEnhancedApi]);

  // Use String() comparison for ObjectId matching
  const classStudents = students.filter(s =>
    String(s.classId) === String(cls?.id) &&
    (s.status || 'active') === 'active' &&
    s.isDeleted !== true
  );
  const pendingStudents = classStudents.filter(s => s.feeStatus !== 'paid');

  // Stats
  const stats = [
    { label: "Collected", value: `₹${feesOverview?.collected?.toLocaleString() || "0"}`, icon: CheckCircle2 },
    { label: "Pending", value: `₹${feesOverview?.pending?.toLocaleString() || "0"}`, icon: AlertCircle },
    { label: "Overdue", value: `₹${feesOverview?.overdue?.toLocaleString() || "0"}`, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-4">
      {/* Fee Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <stat.icon size={16} className="text-gray-600 dark:text-zinc-400" />
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
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{pendingStudents.length} pending payments</p>
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
                    <p className="text-xs text-gray-500 dark:text-zinc-400">Roll {student.rollNo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">₹{student.pendingFees || "5,000"}</span>
                  <Button size="sm" variant="flat" className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300" onPress={() => navigate(`/fees/collect?student=${student.id}`)}>{t('pages.collect')}</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <IndianRupee size={32} className="mx-auto text-gray-200 dark:text-zinc-700 mb-3" />
            <p className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.noPendingFees')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AcademicsTab({ id, cls, classesEnhancedApi }) {
  const { t } = useTranslation();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch exams for this class
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    const fetchExams = async () => {
      setLoading(true);
      try {
        const data = await examsApi.getByClass(id);
        if (!controller.signal.aborted) setExams(data || []);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Error fetching exams:', error);
          toast.error(t('toast.error.failedToLoadExams'));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchExams();
    return () => controller.abort();
  }, [id]);

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'ongoing': return 'warning';
      case 'completed': return 'success';
      case 'results_published': return 'success';
      default: return 'default';
    }
  };

  // Group exams by status
  const examsByStatus = useMemo(() => {
    return {
      scheduled: exams.filter(e => e.status === 'scheduled'),
      ongoing: exams.filter(e => e.status === 'ongoing'),
      completed: exams.filter(e => e.status === 'completed' || e.status === 'results_published'),
    };
  }, [exams]);

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-gray-100 dark:border-zinc-800">
          <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.totalExams')}</p>
          <p className="text-xl font-semibold text-gray-900 dark:text-zinc-100">{exams.length}</p>
        </div>
        <div className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-gray-100 dark:border-zinc-800">
          <p className="text-xs text-blue-600">{t('pages.scheduled')}</p>
          <p className="text-xl font-semibold text-blue-700">{examsByStatus.scheduled.length}</p>
        </div>
        <div className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-gray-100 dark:border-zinc-800">
          <p className="text-xs text-amber-600">{t('pages.ongoing')}</p>
          <p className="text-xl font-semibold text-amber-700">{examsByStatus.ongoing.length}</p>
        </div>
        <div className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-gray-100 dark:border-zinc-800">
          <p className="text-xs text-green-600">{t('pages.completed')}</p>
          <p className="text-xl font-semibold text-green-700">{examsByStatus.completed.length}</p>
        </div>
      </div>

      {/* Exams List */}
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <FileText size={16} className="text-gray-600 dark:text-zinc-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('pages.classExams')}</h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.allScheduledAndCompletedExams')}</p>
            </div>
          </div>
          <Button
            size="sm"
            className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
            startContent={<FileText size={14} />}
            onPress={() => navigate('/academics/exams')}
          >
            Manage Exams
          </Button>
        </div>

        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-gray-300 dark:border-zinc-600 border-t-gray-600 dark:border-t-zinc-400 rounded-full" />
          </div>
        ) : exams.length === 0 ? (
          <div className="p-8 text-center">
            <FileText size={40} className="mx-auto text-gray-200 dark:text-zinc-700 mb-4" />
            <p className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.noExamsScheduledForThisClassYet')}</p>
            <Button
              className="mt-4 bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
              startContent={<FileText size={16} />}
              onPress={() => navigate('/academics/exams')}
            >
              Create Exam
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-zinc-800">
            {exams.map((exam) => (
              <div
                key={exam._id || exam.id}
                className="px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                onClick={() => navigate(`/academics/exams/${exam._id || exam.id}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                    <FileText size={18} className="text-gray-600 dark:text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{exam.name}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">
                      {exam.subjectName || 'General'} • {exam.type?.replace('_', ' ') || 'Exam'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-zinc-400">
                      {exam.startDate ? new Date(exam.startDate).toLocaleDateString() : 'Not scheduled'}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">
                      Max: {exam.maxMarks || 100} | Pass: {exam.passingMarks || 35}
                    </p>
                  </div>
                  <Chip
                    size="sm"
                    color={getStatusColor(exam.status)}
                    variant="flat"
                  >
                    {exam.status?.replace('_', ' ') || 'scheduled'}
                  </Chip>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
