import { useState, useEffect, useMemo } from "react";
import { Card, CardBody, CardHeader, Button, Input, Select, SelectItem, Chip, Progress, Tooltip } from "@heroui/react";
import { Activity, CheckCircle, XCircle, Calendar, BookOpen, AlertTriangle, Mail, Phone, Download, Plus, Clock, TrendingUp, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { attendanceApi, studentsApi } from "../../../../services/api.js";
import { useTranslation } from 'react-i18next';

/**
 * AttendanceTab - Student attendance overview and management
 */
export default function AttendanceTab({
  student,
  attendanceStats,
  onRegularizeOpen
}) {
  const { t } = useTranslation();
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('default', { month: 'long' }).toLowerCase());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch attendance data on component mount and when student changes
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!student?.id) return;

      setLoading(true);
      try {
        // Get attendance for current year
        const startDate = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
        const endDate = new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0];

        const data = await attendanceApi.getStudentAttendance(student.id, startDate, endDate);
        setAttendanceData(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching attendance:', error);
        toast.error(t('toast.error.failedToLoadAttendanceData'));
        setAttendanceData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [student?.id]);

  // Set initial month to current month
  useEffect(() => {
    setSelectedMonth(new Date().toLocaleString('default', { month: 'long' }).toLowerCase());
  }, []);

  // Calculate statistics from real attendance data
  const calculatedStats = useMemo(() => {
    if (!attendanceData.length) {
      return { total: 0, present: 0, absent: 0, percentage: 0 };
    }

    const total = attendanceData.length;
    const present = attendanceData.filter(a => a.status === 'present').length;
    const late = attendanceData.filter(a => a.status === 'late').length;
    const absent = attendanceData.filter(a => a.status === 'absent').length;
    // Align with backend: late counts as present for percentage calculation
    const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return { total, present, absent, late, percentage };
  }, [attendanceData]);

  // Calculate monthly attendance
  const monthlyAttendance = useMemo(() => {
    const monthNum = new Date(Date.parse(selectedMonth + ' 1, 2024')).getMonth();
    const year = new Date().getFullYear();
    
    return attendanceData.filter(att => {
      const attDate = new Date(att.date);
      return attDate.getMonth() === monthNum && attDate.getFullYear() === year;
    });
  }, [attendanceData, selectedMonth]);

  // Calculate monthly statistics
  const monthlyStats = useMemo(() => {
    if (!monthlyAttendance.length) {
      return { total: 0, present: 0, absent: 0, percentage: 0 };
    }

    const total = monthlyAttendance.length;
    const present = monthlyAttendance.filter(a => a.status === 'present').length;
    const late = monthlyAttendance.filter(a => a.status === 'late').length;
    const absent = monthlyAttendance.filter(a => a.status === 'absent').length;
    // Align with backend: late counts as present for percentage calculation
    const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return { total, present, absent, late, percentage };
  }, [monthlyAttendance]);

  // Generate calendar days for selected month
  const calendarDays = useMemo(() => {
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                        'july', 'august', 'september', 'october', 'november', 'december'];
    const monthNum = monthNames.indexOf(selectedMonth.toLowerCase());
    
    if (monthNum === -1) return [];
    
    const year = new Date().getFullYear();
    const daysInMonth = new Date(year, monthNum + 1, 0).getDate();

    // Calculate what weekday the 1st falls on (0=Sun, 6=Sat)
    const firstDayOfWeek = new Date(year, monthNum, 1).getDay();

    // Add empty placeholder cells so day 1 aligns to the correct column
    const emptyCells = Array.from({ length: firstDayOfWeek }, (_, i) => ({
      day: null, date: null, status: null, isEmpty: true
    }));

    const dayCells = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${String(monthNum + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const attendanceRecord = attendanceData.find(a => a.date === dateStr);
      const status = attendanceRecord?.status || null;

      return { day, date: dateStr, status, isEmpty: false };
    });

    return [...emptyCells, ...dayCells];
  }, [attendanceData, selectedMonth]);

  // Available months for selection
  const availableMonths = [
    { key: 'january', label: 'January' },
    { key: 'february', label: 'February' },
    { key: 'march', label: 'March' },
    { key: 'april', label: 'April' },
    { key: 'may', label: 'May' },
    { key: 'june', label: 'June' },
    { key: 'july', label: 'July' },
    { key: 'august', label: 'August' },
    { key: 'september', label: 'September' },
    { key: 'october', label: 'October' },
    { key: 'november', label: 'November' },
    { key: 'december', label: 'December' }
  ];

  // Calculate attendance trends
  const trends = useMemo(() => {
    const now = new Date();
    const thisMonth = attendanceData.filter(a => {
      const d = new Date(a.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const thisQuarter = attendanceData.filter(a => {
      const d = new Date(a.date);
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      return d >= quarterStart;
    });
    const thisYear = attendanceData.filter(a => {
      const d = new Date(a.date);
      return d.getFullYear() === now.getFullYear();
    });

    const calcPercentage = (arr) => {
      if (!arr.length) return 0;
      const present = arr.filter(a => a.status === 'present').length;
      const late = arr.filter(a => a.status === 'late').length;
      // Align with backend: late counts as present for percentage
      return Math.round(((present + late) / arr.length) * 100);
    };

    return {
      thisMonth: calcPercentage(thisMonth),
      thisQuarter: calcPercentage(thisQuarter),
      thisYear: calcPercentage(thisYear)
    };
  }, [attendanceData]);

  // Handle marking attendance
  const handleMarkAttendance = async (status) => {
    if (!student?.id || !selectedDate) return;

    try {
      await attendanceApi.mark({
        studentId: student.id,
        classId: student.classId?._id || student.classId,
        date: selectedDate,
        status,
        clientTimestamp: new Date().toISOString()
      });
      toast.success(`Marked as ${status.charAt(0).toUpperCase() + status.slice(1)}`);

      // Refresh attendance data
      const startDate = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
      const endDate = new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0];
      const data = await attendanceApi.getStudentAttendance(student.id, startDate, endDate);
      setAttendanceData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error(t('toast.error.failedToMarkAttendance'));
    }
  };

  // Download attendance report as CSV (MF-17)
  const handleDownloadReport = () => {
    if (!attendanceData.length) {
      toast.error('No attendance data to download');
      return;
    }
    const rows = [
      ['Date', 'Status', 'In Time', 'Out Time'],
      ...attendanceData.map(a => [
        a.date,
        a.status || 'unknown',
        a.inTime || '-',
        a.outTime || '-'
      ])
    ];
    const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${student?.name?.replace(/\s+/g, '-') || 'student'}-${new Date().getFullYear()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Attendance report downloaded');
  };

  // Send attendance report to parent (MF-18)
  const handleSendToParent = async (channel) => {
    if (!student?.id) return;
    const loadingToast = toast.loading(`Sending via ${channel === 'email' ? 'Email' : 'SMS'}...`);
    try {
      const message = `Attendance Report for ${student.name}: ${calculatedStats.percentage}% attendance (${calculatedStats.present} present, ${calculatedStats.absent} absent out of ${calculatedStats.total} days this year).`;
      await studentsApi.sendReminder(student.id, {
        type: 'attendance',
        message,
        channel,
        parentPhone: student.parentPhone,
        parentEmail: student.parentEmail,
        studentName: student.name,
      });
      toast.success(`Report sent via ${channel === 'email' ? 'Email' : 'SMS'}`, { id: loadingToast });
    } catch (error) {
      toast.error(`Failed to send: ${error.message || 'Unknown error'}`, { id: loadingToast });
    }
  };

  // Note: Subject-wise attendance is not currently supported by the backend
  // This feature would require tracking attendance per subject
  const subjectAttendance = [];
  const regularizationRequests = [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Attendance Overview Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={`skeleton-${i}`} className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                  <Loader2 size={18} className="text-gray-400 dark:text-zinc-500 animate-spin" />
                </div>
                <div className="flex-1">
                  <div className="h-4 w-20 bg-gray-200 dark:bg-zinc-700 rounded mb-2"></div>
                  <div className="h-6 w-24 bg-gray-200 dark:bg-zinc-700 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <Activity size={18} className="text-gray-600 dark:text-zinc-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.averageAttendance')}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{calculatedStats.percentage}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <CheckCircle size={18} className="text-gray-600 dark:text-zinc-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.presentDays')}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{calculatedStats.present}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <XCircle size={18} className="text-gray-600 dark:text-zinc-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.absentDays1')}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{calculatedStats.absent}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <Calendar size={18} className="text-gray-600 dark:text-zinc-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.totalDays2')}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{calculatedStats.total}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mark Today's Attendance */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <CheckCircle size={18} className="text-gray-600 dark:text-zinc-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">{t('pages.markTodaySAttendance')}</h3>
            </div>
            <Input
              type="date"
              size="sm"
              variant="bordered"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-48"
            />
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="bordered"
              className="border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              startContent={<CheckCircle size={16} />}
              onPress={() => handleMarkAttendance('present')}
            >
              Mark Present
            </Button>
            <Button
              variant="bordered"
              className="border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              startContent={<XCircle size={16} />}
              onPress={() => handleMarkAttendance('absent')}
            >
              Mark Absent
            </Button>
            <Button
              variant="bordered"
              className="border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              startContent={<Clock size={16} />}
              onPress={() => handleMarkAttendance('late')}
            >
              Mark Late
            </Button>
          </div>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-3">
            Note: Attendance is typically marked by teachers through the Staff Mobile App.
          </p>
        </div>
      </div>

      {/* Subject-wise Attendance */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <BookOpen size={18} className="text-gray-600 dark:text-zinc-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">{t('pages.subjectWiseAttendance')}</h3>
          </div>
        </div>
        <div className="p-6">
          {subjectAttendance.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <BookOpen size={22} className="text-gray-400 dark:text-zinc-500" />
              </div>
              <div className="text-center max-w-xs">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">{t('pages.subjectWiseAttendanceTrackingIsNotCurrentlyAvailable')}</p>
                  <span className="text-xs font-medium px-1.5 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded">{t('pages.comingSoon')}</span>
                </div>
                <p className="text-xs text-gray-400 dark:text-zinc-500">{t('pages.subjectWiseAttendanceComingSoonDesc')}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {subjectAttendance.map((subject) => (
                <div key={subject.subject} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{subject.subject}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 dark:text-zinc-400">
                          {subject.present}/{subject.total} classes
                        </span>
                        <span className={`text-sm font-semibold text-gray-600 dark:text-zinc-400`}>
                          {subject.percentage}%
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={subject.percentage}
                      className="h-1.5"
                      classNames={{
                        track: "bg-gray-100 dark:bg-zinc-800",
                        indicator: "bg-gray-400"
                      }}
                      size="sm"
                      radius="full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Monthly Overview & Regularize */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Calendar */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
          <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                  <Calendar size={18} className="text-gray-600 dark:text-zinc-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">{t('pages.monthlyOverview')}</h3>
              </div>
              <Select 
                aria-label={t('aria.inputs.selectMonth')}
                size="sm" 
                variant="bordered" 
                selectedKeys={selectedMonth ? [selectedMonth] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0];
                  setSelectedMonth(selectedKey);
                }}
                className="w-36"
              >
                {availableMonths.map(month => (
                  <SelectItem key={month.key}>{month.label}</SelectItem>
                ))}
              </Select>
            </div>
          </div>
        <div className="p-6">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-zinc-400 py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, idx) => (
              day.isEmpty ? (
                <div key={`empty-${idx}`} className="aspect-square" />
              ) : (
              <Tooltip
                key={day.day}
                content={`${day.day} ${selectedMonth.charAt(0).toUpperCase() + selectedMonth.slice(1)} - ${day.status ? day.status.charAt(0).toUpperCase() + day.status.slice(1) : 'No data'}`}
              >
                <div
                  role="gridcell"
                  aria-label={`${day.day} ${selectedMonth} - ${day.status ? day.status.charAt(0).toUpperCase() + day.status.slice(1) : 'No data'}`}
                  className={`aspect-square flex items-center justify-center text-xs font-medium rounded-lg cursor-pointer transition-all hover:scale-110 ${
                    day.status === 'present' ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600' :
                    day.status === 'absent' ? 'bg-gray-200 text-gray-800 dark:bg-zinc-600 dark:text-zinc-200' :
                    day.status === 'late' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-gray-50 text-gray-300 dark:bg-zinc-800/50 dark:text-zinc-600'
                  }`}
                >
                  {day.day}
                </div>
              </Tooltip>
              )
            ))}
          </div>
            <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-400"></div>
                <span className="text-xs text-gray-600 dark:text-zinc-400">{t('pages.present2')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-600"></div>
                <span className="text-xs text-gray-600 dark:text-zinc-400">{t('pages.absent2')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-300"></div>
                <span className="text-xs text-gray-600 dark:text-zinc-400">{t('pages.leave')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Regularize Attendance */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
          <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <AlertTriangle size={18} className="text-gray-600 dark:text-zinc-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">{t('pages.regularizeAttendance1')}</h3>
            </div>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-600 dark:text-zinc-400 mb-4">
              Request to regularize attendance for days marked as absent or missing.
            </p>

            {regularizationRequests.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle size={32} className="mx-auto text-gray-200 dark:text-zinc-700 mb-3" />
                <p className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.noRegularizationRequests')}</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">{t('pages.regularizationRequestsWillAppearHereOnceSubmitted')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {regularizationRequests.map((request) => (
                  <div key={request._id || request.date} className="p-3 rounded-lg border border-gray-200 bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{request.date}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        request.status === 'Pending' ? 'bg-gray-200 text-gray-700 dark:bg-zinc-700 dark:text-zinc-300' :
                        request.status === 'Approved' ? 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400' :
                        'bg-gray-300 text-gray-800 dark:bg-zinc-600 dark:text-zinc-200'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{request.reason}</p>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="bordered"
              className="mt-4 w-full border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              startContent={<Plus size={16} />}
              onPress={() => onRegularizeOpen?.()}
            >
              New Regularization Request
            </Button>
          </div>
        </div>
      </div>

      {/* Attendance Trends */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <TrendingUp size={18} className="text-gray-600 dark:text-zinc-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">{t('pages.attendanceTrends1')}</h3>
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={`skeleton-${i}`} className="p-4 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-800 animate-pulse">
                  <div className="h-6 w-16 bg-gray-200 dark:bg-zinc-700 rounded mb-2"></div>
                  <div className="h-8 w-24 bg-gray-200 dark:bg-zinc-700 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-800">
                <p className="text-xs text-gray-600 dark:text-zinc-400 mb-1">{t('pages.thisMonth')}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-zinc-200">{trends.thisMonth}%</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">{t('pages.basedOnActualAttendanceData')}</p>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-800">
                <p className="text-xs text-gray-600 dark:text-zinc-400 mb-1">{t('pages.thisQuarter')}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-zinc-200">{trends.thisQuarter}%</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">{t('pages.basedOnActualAttendanceData')}</p>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-800">
                <p className="text-xs text-gray-600 dark:text-zinc-400 mb-1">{t('pages.thisYear')}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-zinc-200">{trends.thisYear}%</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">{t('pages.basedOnActualAttendanceData')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Download & Send Report Actions (MF-17, MF-18) */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.attendanceReport') || 'Attendance Report'}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Download or share this student's attendance summary</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="flat"
              className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300"
              startContent={<Download size={14} />}
              onPress={handleDownloadReport}
              isDisabled={loading || !attendanceData.length}
            >
              Download CSV
            </Button>
            <Button
              size="sm"
              variant="flat"
              className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300"
              startContent={<Mail size={14} />}
              onPress={() => handleSendToParent('email')}
              isDisabled={!student?.parentEmail}
            >
              Email to Parent
            </Button>
            <Button
              size="sm"
              variant="flat"
              className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300"
              startContent={<Phone size={14} />}
              onPress={() => handleSendToParent('sms')}
              isDisabled={!student?.parentPhone}
            >
              SMS to Parent
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
