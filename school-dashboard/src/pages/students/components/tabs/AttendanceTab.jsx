import { Card, CardBody, CardHeader, Button, Input, Select, SelectItem, Chip, Progress, Tooltip } from "@heroui/react";
import { Activity, CheckCircle, XCircle, Calendar, BookOpen, AlertTriangle, Mail, Phone, Download, Plus, Clock, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";

/**
 * AttendanceTab - Student attendance overview and management
 */
export default function AttendanceTab({
  student,
  attendanceStats,
  onRegularizeOpen
}) {
  // Mock subject-wise attendance - in real app, this would come from props
  const subjectAttendance = [
    { subject: "Mathematics", present: 18, total: 20, percentage: 90 },
    { subject: "Science", present: 19, total: 20, percentage: 95 },
    { subject: "English", present: 17, total: 20, percentage: 85 },
    { subject: "Social Studies", present: 18, total: 20, percentage: 90 },
    { subject: "Computer Science", present: 20, total: 20, percentage: 100 },
    { subject: "Physical Education", present: 16, total: 20, percentage: 80 }
  ];

  // Mock regularization requests
  const regularizationRequests = [
    { date: "Dec 15, 2024", status: "Pending", reason: "Medical Leave" },
    { date: "Dec 10, 2024", status: "Approved", reason: "Family Emergency" },
    { date: "Dec 5, 2024", status: "Rejected", reason: "No valid reason" }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Attendance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <Activity size={18} className="text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Average Attendance</p>
              <p className="text-lg font-semibold text-gray-900">{attendanceStats?.percentage || 0}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <CheckCircle size={18} className="text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Present Days</p>
              <p className="text-lg font-semibold text-gray-900">{attendanceStats?.present || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <XCircle size={18} className="text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Absent Days</p>
              <p className="text-lg font-semibold text-gray-900">{attendanceStats?.absent || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <Calendar size={18} className="text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Days</p>
              <p className="text-lg font-semibold text-gray-900">{attendanceStats?.total || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mark Today's Attendance */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <CheckCircle size={18} className="text-gray-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Mark Today's Attendance</h3>
            </div>
            <Input
              type="date"
              size="sm"
              variant="bordered"
              defaultValue={new Date().toISOString().split('T')[0]}
              className="w-48"
            />
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="bordered"
              className="border-gray-200 text-gray-700 hover:bg-gray-50"
              startContent={<CheckCircle size={16} />}
              onPress={() => toast.success("Marked as Present")}
            >
              Mark Present
            </Button>
            <Button
              variant="bordered"
              className="border-gray-200 text-gray-700 hover:bg-gray-50"
              startContent={<XCircle size={16} />}
              onPress={() => toast.error("Marked as Absent")}
            >
              Mark Absent
            </Button>
            <Button
              variant="bordered"
              className="border-gray-200 text-gray-700 hover:bg-gray-50"
              startContent={<Clock size={16} />}
              onPress={() => toast("Marked as Half Day", { icon: "⏰" })}
            >
              Mark Half Day
            </Button>
            <Button
              variant="bordered"
              className="border-gray-200 text-gray-700 hover:bg-gray-50"
              startContent={<Calendar size={16} />}
              onPress={() => toast("Marked as Leave", { icon: "📅" })}
            >
              Mark Leave
            </Button>
          </div>
        </div>
      </div>

      {/* Subject-wise Attendance */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <BookOpen size={18} className="text-gray-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Subject-wise Attendance</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {subjectAttendance.map((subject, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{subject.subject}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">
                        {subject.present}/{subject.total} classes
                      </span>
                      <span className={`text-sm font-semibold text-gray-600`}>
                        {subject.percentage}%
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={subject.percentage}
                    className="h-1.5"
                    classNames={{
                      track: "bg-gray-100",
                      indicator: "bg-gray-400"
                    }}
                    size="sm"
                    radius="full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Overview & Regularize */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Calendar */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Calendar size={18} className="text-gray-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">Monthly Overview</h3>
              </div>
              <Select 
                aria-label="Select month"
                size="sm" 
                variant="bordered" 
                defaultSelectedKeys={["december"]} 
                className="w-32"
              >
                <SelectItem key="december">December</SelectItem>
                <SelectItem key="november">November</SelectItem>
                <SelectItem key="october">October</SelectItem>
              </Select>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 31 }, (_, i) => {
                const status = i % 5 === 0 ? 'absent' : i % 7 === 0 ? 'leave' : 'present';
                return (
                  <Tooltip
                    key={i}
                    content={`${i + 1} Dec - ${status === 'present' ? 'Present' : status === 'absent' ? 'Absent' : 'Leave'}`}
                  >
                    <div
                      className={`aspect-square flex items-center justify-center text-xs font-medium rounded-lg cursor-pointer transition-all hover:scale-110 ${
                        status === 'present' ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' :
                        status === 'absent' ? 'bg-gray-200 text-gray-800' :
                        'bg-gray-50 text-gray-600'
                      }`}
                    >
                      {i + 1}
                    </div>
                  </Tooltip>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-400"></div>
                <span className="text-xs text-gray-600">Present</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-600"></div>
                <span className="text-xs text-gray-600">Absent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-300"></div>
                <span className="text-xs text-gray-600">Leave</span>
              </div>
            </div>
          </div>
        </div>

        {/* Regularize Attendance */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <AlertTriangle size={18} className="text-gray-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Regularize Attendance</h3>
            </div>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">
              Request to regularize attendance for days marked as absent or missing.
            </p>
            
            <div className="space-y-3">
              {regularizationRequests.map((request, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{request.date}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      request.status === 'Pending' ? 'bg-gray-200 text-gray-700' :
                      request.status === 'Approved' ? 'bg-gray-100 text-gray-600' :
                      'bg-gray-300 text-gray-800'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{request.reason}</p>
                </div>
              ))}
            </div>

            <Button
              variant="bordered"
              className="mt-4 w-full border-gray-200 text-gray-700 hover:bg-gray-50"
              startContent={<Plus size={16} />}
              onPress={() => onRegularizeOpen?.()}
            >
              New Regularization Request
            </Button>
          </div>
        </div>
      </div>

      {/* Attendance Trends */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <TrendingUp size={18} className="text-gray-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Attendance Trends</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">This Month</p>
              <p className="text-2xl font-bold text-gray-800">92%</p>
              <p className="text-xs text-gray-500 mt-1">+3% from last month</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">This Quarter</p>
              <p className="text-2xl font-bold text-gray-800">89%</p>
              <p className="text-xs text-gray-500 mt-1">-1% from last quarter</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">This Year</p>
              <p className="text-2xl font-bold text-gray-800">90%</p>
              <p className="text-xs text-gray-500 mt-1">+2% from last year</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
