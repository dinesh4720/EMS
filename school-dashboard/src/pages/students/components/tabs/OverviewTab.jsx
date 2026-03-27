import React from "react";
import { Card, CardBody, CardHeader, Chip } from "@heroui/react";
import {
  Award,
  Clock,
  IndianRupee,
  Download,
  AlertTriangle,
  ChevronRight,
  CheckCircle,
  TrendingUp,
  BarChart3,
  LineChart as LineChartIcon,
} from "lucide-react";
import {
  LineChart as RechartsLineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import StudentStatCard from "../shared/StudentStatCard";
import { CHART_COLORS } from "../../../../utils/chartTheme";
import { useTranslation } from 'react-i18next';

/**
 * OverviewTab - Main overview tab for student dashboard
 *
 * Displays KPI cards, action alerts, performance charts, and analytics
 *
 * @param {object} student - Student data
 * @param {array} results - Academic results array
 * @param {object} attendanceStats - Attendance statistics
 * @param {object} studentFeeStructure - Fee structure data
 * @param {function} onTabChange - Function to switch tabs
 * @param {function} onDownloadReport - Function to download reports
 * @param {function} onSendReminder - Function to send fee reminder
 * @param {object} classTeacher - Class teacher information
 */
function OverviewTab({
  student,
  results = [],
  attendanceStats = { present: 0, absent: 0, percentage: 0 },
  studentFeeStructure = {},
  onTabChange,
  onDownloadReport,
  onSendReminder,
  classTeacher,
}) {
  const { t } = useTranslation();
  // Calculate average percentage for academics
  const avgPercentage =
    results.length > 0
      ? results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length
      : 0;

  // Determine academic status
  const getAcademicStatus = () => {
    if (results.length === 0) return { label: "No Data", color: "default" };
    if (avgPercentage >= 90) return { label: "Very Good", color: "success" };
    if (avgPercentage >= 75) return { label: "Good", color: "primary" };
    if (avgPercentage >= 60) return { label: "Needs Improvement", color: "warning" };
    if (avgPercentage >= 40) return { label: "Poor", color: "danger" };
    return { label: "Supervision Needed", color: "danger" };
  };

  const academicStatus = getAcademicStatus();

  // Determine fee status
  const totalBalance = studentFeeStructure?.totalBalance || 0;
  const feeStatus = totalBalance <= 0 ? "Paid" : studentFeeStructure?.overallStatus || "Pending";

  // Handle downloads
  const handleDownload = (type) => {
    if (onDownloadReport) {
      onDownloadReport(type);
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // Handle send reminder
  const handleSendReminderClick = () => {
    if (onSendReminder) {
      onSendReminder();
    }
  };

  // Generate chart data
  // Backend populates examId with { name, type, ... } so exam name is at r.examId?.name
  const performanceChartData = results.map((r, i) => ({
    name: r.examId?.name || r.examName || `Exam ${i + 1}`,
    percentage: r.percentage || 0,
  }));

  // Backend returns multi-subject data in r.marks[] with subjectName / marksObtained
  const latestResult = results.length > 0 ? results[0] : null;
  const subjectChartData =
    latestResult?.marks?.length > 0
      ? latestResult.marks.map((s) => ({
          name: s.subjectName || s.name || 'Unknown',
          marks: s.marksObtained ?? s.marks ?? 0,
        }))
      : [];

  // Use real attendance data if provided, otherwise show placeholder
  // The parent component should pass monthlyAttendanceData derived from real API data
  const attendanceTrendData = attendanceStats.monthlyTrend || [
    { name: "Jan", attendance: 0 },
    { name: "Feb", attendance: 0 },
    { name: "Mar", attendance: 0 },
    { name: "Apr", attendance: 0 },
    { name: "May", attendance: 0 },
    { name: "Jun", attendance: 0 },
    { name: "Jul", attendance: 0 },
    { name: "Aug", attendance: 0 },
    { name: "Sep", attendance: 0 },
    { name: "Oct", attendance: 0 },
    { name: "Nov", attendance: 0 },
    { name: "Dec", attendance: 0 },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* KPI Cards Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-default-900">{t('pages.overview1')}</h3>
          <span className="text-sm text-default-500">{t('pages.lastUpdatedToday')}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Academic Performance Card */}
          <Card
            isPressable
            onPress={() => handleTabChange("academics")}
            className="border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 transition-colors"
          >
            <CardBody className="p-6">
              <div className="flex items-start justify-between mb-4 w-full">
                <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                  <Award size={18} className="text-gray-600 dark:text-zinc-400" />
                </div>
                <Chip
                  size="sm"
                  color={academicStatus.color}
                  variant="flat"
                  className="text-xs font-semibold"
                >
                  {academicStatus.label}
                </Chip>
              </div>
              <div className="space-y-1 text-left">
                <h4 className="text-2xl font-semibold text-default-900">
                  {results.length > 0 ? `${Math.round(avgPercentage)}%` : "N/A"}
                </h4>
                <p className="text-sm font-medium text-default-500">
                  Average Academic Percentage
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800 space-y-2">
                <div className="flex items-center gap-3 text-xs text-default-500">
                  <span className="font-medium">{t('pages.examsTaken')}</span>
                  <span className="font-bold text-default-700">{results.length}</span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-default-400">{t('pages.clickToViewDetails')}</span>
                <span
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700 cursor-pointer transition-colors flex items-center gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload("academic");
                  }}
                >
                  <Download size={14} />
                  Download
                </span>
              </div>
            </CardBody>
          </Card>

          {/* Attendance Card */}
          <Card
            isPressable
            onPress={() => handleTabChange("attendance")}
            className="border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 transition-colors"
          >
            <CardBody className="p-6">
              <div className="flex items-start justify-between mb-4 w-full">
                <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                  <Clock size={18} className="text-gray-600 dark:text-zinc-400" />
                </div>
                <Chip
                  size="sm"
                  color={
                    attendanceStats.percentage >= 90
                      ? "success"
                      : attendanceStats.percentage >= 75
                      ? "primary"
                      : "warning"
                  }
                  variant="flat"
                  className="text-xs font-semibold"
                >
                  Expected: 90%
                </Chip>
              </div>
              <div className="space-y-1 text-left">
                <h4 className="text-2xl font-semibold text-default-900">
                  {attendanceStats.percentage}%
                </h4>
                <p className="text-sm font-medium text-default-500">{t('pages.averageAttendance')}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800 space-y-2">
                <div className="flex items-center gap-3 text-xs text-default-500">
                  <span className="font-medium">{t('pages.presentDays1')}</span>
                  <span className="font-bold text-default-700">{attendanceStats.present}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-red-500">
                  <span className="font-medium">{t('pages.absentDays')}</span>
                  <span className="font-bold">{attendanceStats.absent}</span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-default-400">{t('pages.clickToViewDetails')}</span>
                <span
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700 cursor-pointer transition-colors flex items-center gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload("attendance");
                  }}
                >
                  <Download size={14} />
                  Download
                </span>
              </div>
            </CardBody>
          </Card>

          {/* Fee Status Card */}
          <Card
            isPressable
            onPress={() => handleTabChange("fees")}
            className="border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 transition-colors"
          >
            <CardBody className="p-6">
              <div className="flex items-start justify-between mb-4 w-full">
                <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                  <IndianRupee size={18} className="text-gray-600 dark:text-zinc-400" />
                </div>
                <Chip
                  size="sm"
                  color={totalBalance <= 0 ? "success" : "warning"}
                  variant="flat"
                  className="capitalize text-xs font-semibold"
                >
                  {feeStatus}
                </Chip>
              </div>
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <h4 className="text-2xl font-semibold text-default-900">
                    ₹
                    {totalBalance <= 0
                      ? (studentFeeStructure?.totalPaid || 0).toLocaleString()
                      : (studentFeeStructure?.totalBalance || 0).toLocaleString()}
                  </h4>
                </div>
                <p className="text-sm font-medium text-default-500">
                  {totalBalance <= 0 ? "Total Fees Paid" : "Outstanding Amount"}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between w-full">
                <div className="flex items-center gap-3 text-xs text-default-500">
                  {totalBalance > 0 && (
                    <>
                      <span className="font-medium text-default-600">{t('pages.totalFee2')}</span>
                      <span className="font-bold text-default-700">
                        ₹{(studentFeeStructure?.totalFee || 0).toLocaleString()}
                      </span>
                    </>
                  )}
                  {totalBalance <= 0 && (
                    <span className="font-medium text-success-600">All fees paid ✓</span>
                  )}
                </div>
                {totalBalance > 0 && (
                  <span
                    className="text-xs font-semibold text-gray-600 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200 cursor-pointer transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSendReminderClick();
                    }}
                  >
                    Send Reminder
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-default-400">{t('pages.clickToViewDetails')}</span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Action Needed Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-default-900">{t('pages.actionNeeded1')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Low Attendance Alert */}
          {attendanceStats.percentage < 75 && (
            <Card
              isPressable
              onPress={() => handleTabChange("attendance")}
              className="border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 transition-colors"
            >
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                    <AlertTriangle size={18} className="text-gray-600 dark:text-zinc-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-default-900">{t('pages.lowAttendance1')}</p>
                    <p className="text-xs text-default-500">
                      Attendance is {attendanceStats.percentage}% (below 75%)
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 dark:text-zinc-600" />
                </div>
              </CardBody>
            </Card>
          )}

          {/* Pending Fees Alert */}
          {totalBalance > 0 && (
            <Card
              isPressable
              onPress={() => handleTabChange("fees")}
              className="border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 transition-colors"
            >
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                    <IndianRupee size={18} className="text-gray-600 dark:text-zinc-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-default-900">{t('pages.pendingFees1')}</p>
                    <p className="text-xs text-default-500">
                      ₹{totalBalance.toLocaleString()} outstanding
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 dark:text-zinc-600" />
                </div>
              </CardBody>
            </Card>
          )}

          {/* Poor Performance Alert */}
          {results.length > 0 && avgPercentage < 60 && (
            <Card
              isPressable
              onPress={() => handleTabChange("academics")}
              className="border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 transition-colors"
            >
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                    <AlertTriangle size={18} className="text-gray-600 dark:text-zinc-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-default-900">{t('pages.poorPerformance')}</p>
                    <p className="text-xs text-default-500">
                      Average is {Math.round(avgPercentage)}% - needs attention
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 dark:text-zinc-600" />
                </div>
              </CardBody>
            </Card>
          )}

          {/* If no actions needed, show positive message */}
          {attendanceStats.percentage >= 75 &&
            totalBalance <= 0 &&
            (results.length === 0 || avgPercentage >= 60) && (
              <Card className="border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <CardBody className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                      <CheckCircle size={18} className="text-gray-600 dark:text-zinc-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-default-900">{t('pages.allGood1')}</p>
                      <p className="text-xs text-default-500">
                        No immediate actions required
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}
        </div>
      </div>

      {/* Analytics Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-default-900">{t('pages.analytics')}</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Trend Chart */}
          <Card className="border border-gray-200 dark:border-zinc-800">
            <CardHeader className="pb-0 pt-6 px-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                  <TrendingUp size={18} className="text-gray-600 dark:text-zinc-400" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-default-900">{t('pages.performanceTrend1')}</h4>
                  <p className="text-xs text-default-500">{t('pages.academicPerformanceOverTime')}</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="px-6 py-6">
              {results.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsLineChart data={performanceChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(value) => [`${value}%`, "Percentage"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="percentage"
                      stroke="#6b7280"
                      strokeWidth={2}
                      dot={{ fill: "#6b7280", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-default-400 text-sm">
                  No exam data available
                </div>
              )}
            </CardBody>
          </Card>

          {/* Subject-wise Performance Chart */}
          <Card className="border border-gray-200 dark:border-zinc-800">
            <CardHeader className="pb-0 pt-6 px-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                  <BarChart3 size={18} className="text-gray-600 dark:text-zinc-400" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-default-900">{t('pages.subjectWisePerformance1')}</h4>
                  <p className="text-xs text-default-500">{t('pages.latestExamResultsBySubject')}</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="px-6 py-6">
              {subjectChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={subjectChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(value) => [`${value}`, "Marks"]}
                    />
                    <Bar dataKey="marks" fill={CHART_COLORS.neutral} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-default-400 text-sm">
                  No subject data available
                </div>
              )}
            </CardBody>
          </Card>

          {/* Attendance Trend Chart */}
          <Card className="border border-gray-200 dark:border-zinc-800 lg:col-span-2">
            <CardHeader className="pb-0 pt-6 px-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                  <LineChartIcon size={18} className="text-gray-600 dark:text-zinc-400" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-default-900">{t('pages.attendanceTrend')}</h4>
                  <p className="text-xs text-default-500">{t('pages.monthlyAttendanceOverview')}</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="px-6 py-6">
              {attendanceStats.total > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <RechartsLineChart data={attendanceTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(value) => [`${value}%`, "Attendance"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="attendance"
                    stroke="#6b7280"
                    strokeWidth={2}
                    dot={{ fill: "#6b7280", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-default-400 text-sm">
                  No attendance data available. Data will appear when teachers mark attendance through the Staff App.
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default React.memo(OverviewTab);
