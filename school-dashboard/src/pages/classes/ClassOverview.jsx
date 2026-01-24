import { useState, useMemo, useEffect } from "react";
import {
  Card, CardBody, CardHeader, Chip, Progress, Button, Divider,
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Avatar, Tabs, Tab, Input, User, Spinner, CircularProgress
} from "@heroui/react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Calendar, IndianRupee, MessageSquare, User as UserIcon, Users, Clock,
  BookOpen, TrendingUp, AlertCircle, CheckCircle, Search, Phone,
  GraduationCap, Award, BarChart3, ArrowLeft, Star, StarHalf,
  Activity, Sparkles, Send, FileText, DollarSign, Settings
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { toast } from "react-hot-toast";
import Attendance from "./Attendance";
import Timetable from "./Timetable";
import ClassSettingsPanel from "./ClassSettingsPanel";

export default function ClassOverview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { classesWithTeachers, students, classesEnhancedApi, classesApi } = useApp();
  
  // Get tab from URL query parameter or default to "overview"
  const searchParams = new URLSearchParams(location.search);
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || "overview");
  
  const [classSettings, setClassSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  const cls = classesWithTeachers.find(c => c.id === id || c.id === String(id)) || classesWithTeachers[0] || {};

  // Update active tab when URL changes
  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

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

  // Calculate strength color based on capacity
  const strengthPercentage = cls?.strengthLimit ? ((cls?.strength || 0) / cls.strengthLimit) * 100 : ((cls?.strength || 0) / 40) * 100;
  const getStrengthColor = () => {
    if (strengthPercentage < 80) return "success";
    if (strengthPercentage < 95) return "warning";
    return "danger";
  };
  const getStrengthBgColor = () => {
    if (strengthPercentage < 80) return "from-success-50 to-background";
    if (strengthPercentage < 95) return "from-warning-50 to-background";
    return "from-danger-50 to-background";
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header with Class Info - Redesigned */}
      <Card className="shadow-sm border border-default-200">
        <CardBody className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => navigate("/classes")}
              >
                <ArrowLeft size={18} />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/25">
                  {cls?.name?.replace("Class ", "")}{cls?.section}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-default-800">
                      Grade {cls?.name || 'N/A'} - Section {cls?.section || 'N/A'}
                    </h2>
                    {!settingsLoading && classSettings?.classTag && (
                      <Chip size="sm" variant="flat" color="primary" className="font-medium">
                        {classSettings.classTag}
                      </Chip>
                    )}
                  </div>
                  <p className="text-sm text-default-500 flex items-center gap-2">
                    <span
                      className="text-primary hover:underline cursor-pointer font-medium"
                      onClick={() => cls?.classTeacherId && navigate(`/staffs/${cls.classTeacherId}`)}
                    >
                      {cls?.teacher || 'No teacher assigned'}
                    </span>
                    <span>•</span>
                    <span>Class Teacher</span>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      className="h-6 w-6 min-w-6 ml-1"
                      onPress={() => cls?.classTeacherId && navigate(`/messages?to=${cls.classTeacherId}`)}
                    >
                      <MessageSquare size={12} className="text-primary" />
                    </Button>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Student Strength with Color Indicator */}
              <div className={`p-3 rounded-xl bg-gradient-to-br ${getStrengthBgColor()} border border-${getStrengthColor()}-200`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-${getStrengthColor()}/10 flex items-center justify-center`}>
                    <Users size={20} className={`text-${getStrengthColor()}`} />
                  </div>
                  <div>
                    <p className="text-xs text-default-500 uppercase tracking-wider font-medium">Strength</p>
                    <p className={`text-lg font-bold text-${getStrengthColor()}`}>
                      {cls?.strength || 0}{cls?.strengthLimit ? `/${cls.strengthLimit}` : '/40'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="flat" color="primary" startContent={<Calendar size={14} />}>
                  Export Report
                </Button>
                <Button size="sm" variant="flat" color="secondary" startContent={<MessageSquare size={14} />}>
                  Send Notice
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-6 flex w-full">
            <Tabs
              aria-label="Class Options"
              color="primary"
              variant="underlined"
              classNames={{
                tabList: "gap-6 w-full relative rounded-none p-0 border-b border-default-200 block",
                cursor: "w-full bg-primary",
                tab: "max-w-fit px-0 h-12",
                tabContent: "group-data-[selected=true]:text-primary group-data-[selected=true]:font-semibold text-default-500 font-medium"
              }}
              selectedKey={activeTab}
              onSelectionChange={setActiveTab}
            >
              <Tab
                key="overview"
                title={
                  <div className="flex items-center gap-2 px-2">
                    <Activity size={18} />
                    <span>Overview</span>
                  </div>
                }
              />
              <Tab
                key="students"
                title={
                  <div className="flex items-center gap-2 px-2">
                    <GraduationCap size={18} />
                    <span>Students</span>
                  </div>
                }
              />
              <Tab
                key="attendance"
                title={
                  <div className="flex items-center gap-2 px-2">
                    <CheckCircle size={18} />
                    <span>Attendance</span>
                  </div>
                }
              />
              <Tab
                key="fees"
                title={
                  <div className="flex items-center gap-2 px-2">
                    <IndianRupee size={18} />
                    <span>Fees</span>
                  </div>
                }
              />
              <Tab
                key="academics"
                title={
                  <div className="flex items-center gap-2 px-2">
                    <Award size={18} />
                    <span>Academics</span>
                  </div>
                }
              />
              <Tab
                key="timetable"
                title={
                  <div className="flex items-center gap-2 px-2">
                    <Clock size={18} />
                    <span>Time Table</span>
                  </div>
                }
              />
              <Tab
                key="settings"
                title={
                  <div className="flex items-center gap-2 px-2">
                    <Settings size={18} />
                    <span>Settings</span>
                  </div>
                }
              />
            </Tabs>
          </div>
        </CardBody>
      </Card>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === "overview" && <OverviewTab id={id} cls={cls} classesEnhancedApi={classesEnhancedApi} />}
        {activeTab === "students" && <StudentsTab id={id} cls={cls} navigate={navigate} />}
        {activeTab === "attendance" && <Attendance classId={id} />}
        {activeTab === "timetable" && <Timetable classId={id} />}
        {activeTab === "fees" && <FeesTab id={id} cls={cls} classesEnhancedApi={classesEnhancedApi} navigate={navigate} />}
        {activeTab === "academics" && <AcademicsTab id={id} cls={cls} classesEnhancedApi={classesEnhancedApi} />}
        {activeTab === "settings" && <ClassSettingsPanel classId={id} />}
      </div>
    </div>
  );
}

// --- Sub-components (could be in separate files) ---

function OverviewTab({ id, cls, classesEnhancedApi }) {
  const { classesApi } = useApp();
  const [todayStatus, setTodayStatus] = useState(null);
  const [todayStatusLoading, setTodayStatusLoading] = useState(false);
  const [academicPerformance, setAcademicPerformance] = useState(null);
  const [academicPerformanceLoading, setAcademicPerformanceLoading] = useState(false);
  const [classRating, setClassRating] = useState(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [classSettings, setClassSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch data
  useEffect(() => {
    if (!id || !classesEnhancedApi) return;

    const fetchData = async () => {
      setTodayStatusLoading(true);
      setAcademicPerformanceLoading(true);
      setRatingLoading(true);
      setSettingsLoading(true);
      setError(null);

      try {
        const status = await classesEnhancedApi.getTodayStatus(id);
        setTodayStatus(status);
      } catch (e) {
        console.error('Error loading today status:', e);
        toast.error('Failed to load today status');
        setError(e.message);
      } finally { setTodayStatusLoading(false); }

      try {
        const perf = await classesEnhancedApi.getAcademicPerformance(id);
        setAcademicPerformance(perf);
      } catch (e) {
        console.error('Error loading academic performance:', e);
        toast.error('Failed to load academic performance');
        setError(e.message);
      } finally { setAcademicPerformanceLoading(false); }

      try {
        const rating = await classesEnhancedApi.getRating(id);
        setClassRating(rating);
      } catch (e) {
        console.error('Error loading class rating:', e);
        toast.error('Failed to load class rating');
        setError(e.message);
      } finally { setRatingLoading(false); }

      try {
        const settings = await classesApi.getSettings(id);
        setClassSettings(settings);
      } catch (e) {
        console.error('Error loading class settings:', e);
        toast.error('Failed to load class settings');
        setError(e.message);
      } finally { setSettingsLoading(false); }
    };

    fetchData();
  }, [id, classesEnhancedApi, classesApi]);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < fullStars; i++) stars.push(<Star key={`full-${i}`} size={16} className="fill-warning text-warning" />);
    if (hasHalfStar) stars.push(<StarHalf key="half" size={16} className="fill-warning text-warning" />);
    for (let i = 0; i < emptyStars; i++) stars.push(<Star key={`empty-${i}`} size={16} className="text-default-300" />);
    return stars;
  };

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Today's Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm border border-default-200">
          <CardBody className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-success-50 flex items-center justify-center">
              <CheckCircle size={24} className="text-success" />
            </div>
            <div>
              <p className="text-xs text-default-500 uppercase font-medium">Attendance</p>
              <p className="text-xl font-bold text-success">{todayStatus?.attendance?.percentage || cls?.attendanceToday || 0}%</p>
            </div>
          </CardBody>
        </Card>
        <Card className="shadow-sm border border-default-200">
          <CardBody className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center">
              <BookOpen size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-default-500 uppercase font-medium">Current Class</p>
              <p className="text-sm font-semibold">{todayStatus?.currentClass?.subject || "Free Period"}</p>
            </div>
          </CardBody>
        </Card>
        <Card className="shadow-sm border border-default-200">
          <CardBody className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-warning-50 flex items-center justify-center">
              <Star size={24} className="text-warning" />
            </div>
            <div>
              <p className="text-xs text-default-500 uppercase font-medium">Rating</p>
              <div className="flex items-center gap-1">
                <span className="text-xl font-bold text-warning">{(classRating?.overallRating || 0).toFixed(1)}</span>
                <span className="text-xs text-default-400">/ 5.0</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Assigned Subjects Card */}
      {!settingsLoading && classSettings?.assignedSubjects && classSettings.assignedSubjects.length > 0 && (
        <Card className="shadow-sm border border-default-200">
          <CardHeader className="flex justify-between px-4 py-3 border-b border-default-100">
            <h3 className="font-semibold text-default-700 flex items-center gap-2">
              <BookOpen size={18} className="text-primary" />
              Assigned Subjects
            </h3>
            <Chip size="sm" variant="flat" color="primary">
              {classSettings.assignedSubjects.length} Subject{classSettings.assignedSubjects.length !== 1 ? 's' : ''}
            </Chip>
          </CardHeader>
          <CardBody className="p-4">
            <div className="flex flex-wrap gap-2">
              {classSettings.assignedSubjects.map((subject, index) => (
                <Chip
                  key={index}
                  size="md"
                  variant="flat"
                  color="secondary"
                  className="font-medium"
                >
                  {subject}
                </Chip>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Academic Overview */}
        <Card className="shadow-sm border border-default-200">
          <CardHeader className="flex justify-between px-4 py-3 border-b border-default-100">
            <h3 className="font-semibold text-default-700">Academic Overview</h3>
          </CardHeader>
          <CardBody className="p-4">
            {academicPerformanceLoading ? <Spinner /> : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-success-600 mb-2">Top Performers</p>
                  {academicPerformance?.topPerformers?.slice(0, 3).map((s, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-default-100 last:border-0">
                      <span className="text-sm">{s.name}</span>
                      <Chip size="sm" color="success" variant="flat">{s.percentage}%</Chip>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-semibold text-danger-600 mb-2">Needs Improvement</p>
                  {academicPerformance?.needsImprovement?.slice(0, 3).map((s, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-default-100 last:border-0">
                      <span className="text-sm">{s.name}</span>
                      <Chip size="sm" color="danger" variant="flat">{s.percentage}%</Chip>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Detailed Ratings */}
        <Card className="shadow-sm border border-default-200">
          <CardHeader className="flex justify-between px-4 py-3 border-b border-default-100">
            <h3 className="font-semibold text-default-700">Class Ratings Breakdown</h3>
          </CardHeader>
          <CardBody className="p-4 space-y-4">
            {classRating?.breakdown && Object.entries(classRating.breakdown).map(([key, val]) => (
              <div key={key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="capitalize text-default-600">{key}</span>
                  <span className="font-medium">{val.toFixed(1)}</span>
                </div>
                <Progress value={val} maxValue={5} color={val > 4 ? "success" : val > 3 ? "warning" : "danger"} size="sm" />
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function StudentsTab({ id, cls, navigate }) {
  const { students } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const classStudents = useMemo(() => students.filter(s => s.classId === cls?.id), [students, cls]);

  const filteredStudents = useMemo(() => {
    return classStudents.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.rollNo.toString().includes(searchQuery);
      const matchesFilter = filter === "all" ? true : s.feeStatus === filter;
      return matchesSearch && matchesFilter;
    });
  }, [classStudents, searchQuery, filter]);

  return (
    <Card className="shadow-sm border border-default-200">
      <CardHeader className="flex flex-wrap justify-between gap-4 p-4 border-b border-default-100">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-default-500" />
          <h3 className="text-lg font-semibold">Class Students</h3>
          <Chip size="sm" variant="flat">{classStudents.length} Students</Chip>
        </div>
        <div className="flex gap-2">
          <Input
            size="sm"
            placeholder="Search students..."
            startContent={<Search size={14} />}
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="w-48"
          />
          <Tabs size="sm" selectedKey={filter} onSelectionChange={setFilter}>
            <Tab key="all" title="All" />
            <Tab key="paid" title="Paid" />
            <Tab key="pending" title="Pending" />
          </Tabs>
        </div>
      </CardHeader>
      <CardBody className="p-0">
        <Table aria-label="Students List" shadow="none" removeWrapper>
          <TableHeader>
            <TableColumn>ROLL NO</TableColumn>
            <TableColumn>STUDENT</TableColumn>
            <TableColumn>FEE STATUS</TableColumn>
            <TableColumn>ATTENDANCE</TableColumn>
            <TableColumn>ACTION</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No students found">
            {filteredStudents.map(student => (
              <TableRow key={student.id} className="cursor-pointer hover:bg-default-50" onClick={() => navigate(`/students/${student.id}`)}>
                <TableCell><span className="font-mono text-xs">{student.rollNo}</span></TableCell>
                <TableCell>
                  <User name={student.name} description={student.parentName} avatarProps={{ src: student.photo, size: "sm" }} />
                </TableCell>
                <TableCell>
                  <Chip size="sm" color={student.feeStatus === 'paid' ? 'success' : 'warning'} variant="flat" className="capitalize">
                    {student.feeStatus}
                  </Chip>
                </TableCell>
                <TableCell>
                  <span className={student.attendanceStatus === 'present' ? "text-success font-medium" : "text-danger font-medium"}>
                    {student.attendanceStatus === 'present' ? 'Present' : 'Absent'}
                  </span>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="light" isIconOnly><ArrowLeft size={16} className="rotate-180" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
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

  const classStudents = students.filter(s => s.classId === cls?.id);
  const pendingStudents = classStudents.filter(s => s.feeStatus !== 'paid');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-success-50 border-success-100">
          <CardBody>
            <p className="text-sm text-success-600 font-medium">Collected</p>
            <p className="text-2xl font-bold text-success">₹ {feesOverview?.collected?.toLocaleString() || "0"}</p>
          </CardBody>
        </Card>
        <Card className="bg-warning-50 border-warning-100">
          <CardBody>
            <p className="text-sm text-warning-600 font-medium">Pending</p>
            <p className="text-2xl font-bold text-warning">₹ {feesOverview?.pending?.toLocaleString() || "0"}</p>
          </CardBody>
        </Card>
        <Card className="bg-danger-50 border-danger-100">
          <CardBody>
            <p className="text-sm text-danger-600 font-medium">Overdue</p>
            <p className="text-2xl font-bold text-danger">₹ {feesOverview?.overdue?.toLocaleString() || "0"}</p>
          </CardBody>
        </Card>
      </div>

      <Card className="border border-default-200 shadow-sm">
        <CardHeader className="px-4 py-3 border-b border-default-100">
          <h3 className="font-semibold">Defaulters List</h3>
        </CardHeader>
        <CardBody className="p-0">
          <Table aria-label="Defaulters" shadow="none" removeWrapper>
            <TableHeader>
              <TableColumn>STUDENT</TableColumn>
              <TableColumn>AMOUNT PENDING</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>ACTION</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No pending fees">
              {pendingStudents.map(student => (
                <TableRow key={student.id}>
                  <TableCell>
                    <User name={student.name} description={`Roll: ${student.rollNo}`} avatarProps={{ src: student.photo, size: "sm" }} />
                  </TableCell>
                  <TableCell>₹ {student.pendingFees || "5,000"}</TableCell>
                  <TableCell>
                    <Chip color="warning" size="sm" variant="flat">Pending</Chip>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" color="primary" variant="flat" onPress={() => navigate(`/fees/collect?student=${student.id}`)}>Collect</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}

function AcademicsTab({ id, cls, classesEnhancedApi }) {
  // Placeholder for detailed academics
  return (
    <div className="space-y-4">
      <Card className="border border-default-200 shadow-sm">
        <CardBody className="p-8 text-center text-default-500">
          <Award size={40} className="mx-auto mb-4 opacity-20" />
          <p>Detailed subject-wise academic performance and grade analysis will appear here.</p>
          <Button className="mt-4" variant="flat" color="primary">Add Exam Results</Button>
        </CardBody>
      </Card>
    </div>
  );
}