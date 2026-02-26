import { useState, useMemo, useEffect } from "react";
import {
  Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
  Input, Chip
} from "@heroui/react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Calendar, IndianRupee, MessageSquare, Users, Clock,
  BookOpen, TrendingUp, AlertCircle, CheckCircle2, Search, Phone,
  GraduationCap, Award, ArrowLeft, Star, StarHalf,
  Activity, FileText, Settings, AlertTriangle, Download,
  Edit, MoreVertical, Send, Mail
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { toast } from "react-hot-toast";
import Attendance from "./Attendance";
import Timetable from "./Timetable";
import ClassSettingsPanel from "./ClassSettingsPanel";
import ClassTeacherAssignmentModal from "./components/ClassTeacherAssignmentModal";

export default function ClassDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { classesWithTeachers, students, classesEnhancedApi, classesApi, refetch } = useApp();

  // Get tab from URL query parameter or default to "overview"
  const searchParams = new URLSearchParams(location.search);
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || "overview");

  const [classSettings, setClassSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAssignTeacherModalOpen, setIsAssignTeacherModalOpen] = useState(false);

  const cls = classesWithTeachers.find(c => c.id === id || c.id === String(id)) || classesWithTeachers[0] || {};

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
          try {
            const { clearApiCache } = await import('../../services/api');
            clearApiCache();
          } catch (cacheError) {
            console.warn('Failed to clear API cache:', cacheError);
          }
          await refetch();
        } catch (error) {
          console.error('Error refreshing class data:', error);
        } finally {
          setIsRefreshing(false);
        }
      }
    };

    refreshClassData();

    const intervalId = setInterval(() => {
      refreshClassData();
    }, 30000);

    const handleFocus = () => {
      refreshClassData();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [id, refetch]);

  // Load class settings
  useEffect(() => {
    if (id && classesApi) {
      loadClassSettings();
    }
  }, [id, classesApi]);

  const loadClassSettings = async () => {
    try {
      setSettingsLoading(true);
      const settings = await classesApi.getSettings(id);
      setClassSettings(settings);
    } catch (error) {
      console.error("Error loading class settings:", error);
    } finally {
      setSettingsLoading(false);
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

  return (
    <div className="w-full flex-1 bg-gray-50 p-6 min-h-screen">
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="mb-6">
        <button onClick={() => navigate('/classes')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2">
          <ArrowLeft size={16} /><span>Back to Classes</span>
        </button>

        <div className="bg-white rounded-lg border border-gray-100 p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                <span className="text-xl font-semibold text-gray-600">
                  {cls?.name?.replace("Class ", "")}{cls?.section}
                </span>
              </div>

              {/* Info */}
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Grade {cls?.name || 'N/A'} - Section {cls?.section || 'N/A'}
                </h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span>{cls?.strength || 0} Students</span>
                  <span className="text-gray-300">|</span>
                  <span>{cls?.strengthLimit || 40} Capacity</span>
                </div>
                {cls?.classTeacherId ? (
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <Users size={12} />
                    <span
                      className="text-gray-500 hover:text-gray-700 cursor-pointer"
                      onClick={() => navigate(`/staffs/${cls.classTeacherId}`)}
                    >
                      {cls?.teacher || 'Class Teacher'}
                    </span>
                    <span className="text-gray-300">|</span>
                    <span>Class Teacher</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <AlertCircle size={12} />
                    <span>No class teacher assigned</span>
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
              <Button variant="flat" className="bg-gray-100 text-gray-700" startContent={<MessageSquare size={16} />}
                onPress={() => toast.success("Opening messages...")}>Message</Button>
              <Button className="bg-gray-900 text-white hover:bg-gray-800" startContent={<Edit size={16} />}
                onPress={() => setActiveTab("settings")}>Settings</Button>
              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly variant="light" className="text-gray-400"><MoreVertical size={20} /></Button>
                </DropdownTrigger>
                <DropdownMenu className="min-w-[180px]">
                  <DropdownItem key="export" startContent={<Download size={14} className="text-gray-400" />}>Export Report</DropdownItem>
                  <DropdownItem key="notice" startContent={<Send size={14} className="text-gray-400" />}>Send Notice</DropdownItem>
                  <DropdownItem key="timetable" startContent={<Clock size={14} className="text-gray-400" />} onPress={() => setActiveTab("timetable")}>View Timetable</DropdownItem>
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
        <div className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                activeTab === tab.key ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
              }`}>
              {tab.label}
              {activeTab === tab.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />}
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
          <div className="bg-white rounded-lg border border-gray-100 p-5">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setActiveTab("students")} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 hover:bg-gray-100">
                <Users size={18} className="text-gray-600" />
                <span className="text-xs text-gray-600">Students</span>
              </button>
              <button onClick={() => setActiveTab("attendance")} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 hover:bg-gray-100">
                <CheckCircle2 size={18} className="text-gray-600" />
                <span className="text-xs text-gray-600">Attendance</span>
              </button>
              <button onClick={() => setActiveTab("fees")} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 hover:bg-gray-100">
                <IndianRupee size={18} className="text-gray-600" />
                <span className="text-xs text-gray-600">Fees</span>
              </button>
              <button onClick={() => setActiveTab("timetable")} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 hover:bg-gray-100">
                <Clock size={18} className="text-gray-600" />
                <span className="text-xs text-gray-600">Timetable</span>
              </button>
            </div>
          </div>

          {/* Class Teacher Card */}
          {cls?.classTeacherId && (
            <div className="bg-white rounded-lg border border-gray-100 p-5">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Class Teacher</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {cls?.teacher?.charAt(0) || 'T'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{cls?.teacher || 'Teacher'}</p>
                  <p className="text-xs text-gray-500">Class Teacher</p>
                </div>
                <button
                  onClick={() => navigate(`/messages?to=${cls.classTeacherId}`)}
                  className="p-2 hover:bg-gray-50 rounded-lg"
                >
                  <MessageSquare size={16} className="text-gray-400" />
                </button>
              </div>
            </div>
          )}

          {/* Assigned Subjects */}
          {!settingsLoading && classSettings?.assignedSubjects && classSettings.assignedSubjects.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-100 p-5">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Assigned Subjects</h3>
              <div className="flex flex-wrap gap-2">
                {classSettings.assignedSubjects.map((subject, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-md"
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

    const fetchData = async () => {
      setTodayStatusLoading(true);
      setAcademicPerformanceLoading(true);
      setRatingLoading(true);

      try {
        const status = await classesEnhancedApi.getTodayStatus(id);
        setTodayStatus(status);
      } catch (e) {
        console.error('Error loading today status:', e);
      } finally { setTodayStatusLoading(false); }

      try {
        const perf = await classesEnhancedApi.getAcademicPerformance(id);
        setAcademicPerformance(perf);
      } catch (e) {
        console.error('Error loading academic performance:', e);
      } finally { setAcademicPerformanceLoading(false); }

      try {
        const rating = await classesEnhancedApi.getRating(id);
        setClassRating(rating);
      } catch (e) {
        console.error('Error loading class rating:', e);
      } finally { setRatingLoading(false); }
    };

    fetchData();
  }, [id, classesEnhancedApi]);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < fullStars; i++) stars.push(<Star key={`full-${i}`} size={14} className="fill-gray-400 text-gray-400" />);
    if (hasHalfStar) stars.push(<StarHalf key="half" size={14} className="fill-gray-400 text-gray-400" />);
    for (let i = 0; i < emptyStars; i++) stars.push(<Star key={`empty-${i}`} size={14} className="text-gray-300" />);
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
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-lg p-4 border border-gray-100 hover:border-gray-200 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <stat.icon size={16} className="text-gray-600" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800">{stat.value}</h3>
            <p className="text-xs font-medium text-gray-500 mt-0.5">{stat.label}</p>
            {stat.subtext && <p className="text-xs text-gray-400 mt-2">{stat.subtext}</p>}
          </div>
        ))}
      </div>

      {/* Action Needed */}
      {needsAttention && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <AlertTriangle size={16} className="text-gray-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">Action Needed</h3>
                <p className="text-xs text-gray-500">Attendance is below 75%</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <AlertCircle size={18} className="text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Low Attendance Alert</p>
                <p className="text-xs text-gray-500">Current: {attendancePercentage}% (target: 75%)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Academic Overview */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <Award size={16} className="text-gray-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">Academic Overview</h3>
                <p className="text-xs text-gray-500">Top performers & improvements</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            {academicPerformanceLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">Top Performers</p>
                  {academicPerformance?.topPerformers?.slice(0, 3).map((s, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-700">{s.name}</span>
                      <span className="text-sm font-medium text-gray-900">{s.percentage}%</span>
                    </div>
                  ))}
                  {(!academicPerformance?.topPerformers || academicPerformance.topPerformers.length === 0) && (
                    <p className="text-xs text-gray-400">No data available</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">Needs Improvement</p>
                  {academicPerformance?.needsImprovement?.slice(0, 3).map((s, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-700">{s.name}</span>
                      <span className="text-sm font-medium text-gray-900">{s.percentage}%</span>
                    </div>
                  ))}
                  {(!academicPerformance?.needsImprovement || academicPerformance.needsImprovement.length === 0) && (
                    <p className="text-xs text-gray-400">No data available</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ratings Breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <Star size={16} className="text-gray-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">Class Ratings</h3>
                <p className="text-xs text-gray-500">Detailed breakdown</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            {ratingLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full" />
              </div>
            ) : (
              <div className="space-y-3">
                {classRating?.breakdown && Object.entries(classRating.breakdown).map(([key, val]) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize text-gray-600">{key}</span>
                      <span className="font-medium text-gray-900">{val.toFixed(1)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-800 rounded-full"
                        style={{ width: `${(val / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                {(!classRating?.breakdown || Object.keys(classRating.breakdown).length === 0) && (
                  <p className="text-xs text-gray-400 text-center py-4">No ratings available</p>
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
      <div className="bg-white rounded-lg border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
            />
          </div>
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            {["all", "paid", "pending"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Class Students</h3>
            <p className="text-xs text-gray-500 mt-0.5">{filteredStudents.length} students</p>
          </div>
        </div>

        {filteredStudents.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {filteredStudents.map(student => (
              <div
                key={student.id}
                className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/students/${student.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {student.photo ? (
                      <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-medium text-gray-600">{student.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{student.name}</p>
                    <p className="text-xs text-gray-500">Roll {student.rollNo} • {student.parentName || 'Parent'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${student.attendanceStatus === 'present' ? "bg-gray-600" : "bg-gray-300"}`} />
                    <span className="text-xs text-gray-500">
                      {student.attendanceStatus === 'present' ? 'Present' : 'Absent'}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-md ${
                    student.feeStatus === 'paid' ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 text-gray-500'
                  }`}>
                    {student.feeStatus || 'Pending'}
                  </span>
                  <ArrowLeft size={16} className="text-gray-300 rotate-180" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <Users size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-500">No students found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FeesTab({ id, cls, classesEnhancedApi, navigate }) {
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
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-lg p-4 border border-gray-100 hover:border-gray-200 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <stat.icon size={16} className="text-gray-600" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800">{stat.value}</h3>
            <p className="text-xs font-medium text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Defaulters List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Defaulters List</h3>
            <p className="text-xs text-gray-500 mt-0.5">{pendingStudents.length} pending payments</p>
          </div>
        </div>

        {pendingStudents.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {pendingStudents.map(student => (
              <div key={student.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {student.photo ? (
                      <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-medium text-gray-600">{student.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{student.name}</p>
                    <p className="text-xs text-gray-500">Roll {student.rollNo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-900">₹{student.pendingFees || "5,000"}</span>
                  <Button size="sm" variant="flat" className="bg-gray-100 text-gray-700" onPress={() => navigate(`/fees/collect?student=${student.id}`)}>Collect</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <IndianRupee size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-500">No pending fees</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AcademicsTab({ id, cls, classesEnhancedApi }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
            <Award size={16} className="text-gray-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 text-sm">Academic Performance</h3>
            <p className="text-xs text-gray-500">Subject-wise analysis</p>
          </div>
        </div>
      </div>
      <div className="p-8 text-center">
        <Award size={40} className="mx-auto text-gray-200 mb-4" />
        <p className="text-sm text-gray-500">Detailed subject-wise academic performance and grade analysis will appear here.</p>
        <Button className="mt-4 bg-gray-900 text-white" startContent={<FileText size={16} />}>Add Exam Results</Button>
      </div>
    </div>
  );
}
