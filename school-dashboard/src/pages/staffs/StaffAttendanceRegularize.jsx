


import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card, CardBody, CardHeader,
  Select, SelectItem, Button, Chip,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Textarea, Input, Divider
} from "@heroui/react";
import { ArrowLeft, Calendar as CalendarIcon, Check, X, AlertCircle, Clock } from "lucide-react";
import { useApp } from "../../context/AppContext";
import toast from "react-hot-toast";

export default function StaffAttendanceRegularize() {
  const navigate = useNavigate();
  const { staff, staffAttendance, markStaffAttendance } = useApp();
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [regularizeModalOpen, setRegularizeModalOpen] = useState(false);
  const [regularizeData, setRegularizeData] = useState({
    status: "present",
    inTime: "",
    outTime: "",
    reason: ""
  });

  const selectedStaff = useMemo(() => {
    return staff.find(s => s.id === selectedStaffId);
  }, [staff, selectedStaffId]);

  // Debug logging
  useEffect(() => {
    if (selectedStaffId) {
      console.log('Selected Staff ID:', selectedStaffId);
      console.log('Staff Attendance Data:', staffAttendance);
      console.log('Attendance for selected staff:', staffAttendance[selectedStaffId]);
    }
  }, [selectedStaffId, staffAttendance]);

  // Get calendar data for selected month
  const calendarData = useMemo(() => {
    if (!selectedStaffId) return [];

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ isEmpty: true });
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const attendance = staffAttendance[selectedStaffId]?.[dateStr];
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      const isFuture = new Date(dateStr) > new Date();

      days.push({
        day,
        dateStr,
        attendance,
        isToday,
        isFuture
      });
    }

    return days;
  }, [selectedStaffId, currentMonth, currentYear, staffAttendance]);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDayClick = (dayData) => {
    if (dayData.isEmpty || dayData.isFuture) return;
    
    setSelectedDate(dayData);
    setRegularizeData({
      status: dayData.attendance?.status || "present",
      inTime: dayData.attendance?.inTime || "09:00",
      outTime: dayData.attendance?.outTime || "17:00",
      reason: dayData.attendance?.reason || ""
    });
    setRegularizeModalOpen(true);
  };

  const handleRegularize = () => {
    if (!selectedDate || !selectedStaffId) return;

    markStaffAttendance(
      selectedStaffId,
      selectedDate.dateStr,
      regularizeData.status,
      regularizeData.inTime,
      regularizeData.outTime,
      regularizeData.reason
    );

    toast.success("Attendance regularized successfully");
    setRegularizeModalOpen(false);
    setSelectedDate(null);
  };

  const getDayStyle = (dayData) => {
    if (dayData.isEmpty) return "";
    if (dayData.isFuture) return "opacity-30 cursor-not-allowed";
    
    const status = dayData.attendance?.status;
    
    if (dayData.isToday) {
      return "ring-2 ring-primary ring-offset-2";
    }

    switch (status) {
      case "present":
        return "bg-success-50 border-success-300 text-success-700";
      case "absent":
        return "bg-danger-50 border-danger-300 text-danger-700";
      case "leave":
        return "bg-warning-50 border-warning-300 text-warning-700";
      case "halfday":
        return "bg-secondary-50 border-secondary-300 text-secondary-700";
      default:
        return "bg-default-50 border-default-200 text-default-500";
    }
  };

  const getDayIndicator = (dayData) => {
    if (dayData.isEmpty || dayData.isFuture) return null;
    
    const status = dayData.attendance?.status;
    
    switch (status) {
      case "present":
        return <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-success-500" />;
      case "absent":
        return <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-danger-500" />;
      case "leave":
        return <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-warning-500" />;
      case "halfday":
        return <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-secondary-500" />;
      default:
        return <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-default-300" />;
    }
  };

  const getMonthStats = useMemo(() => {
    if (!selectedStaffId) return { present: 0, absent: 0, leave: 0, halfday: 0, unmarked: 0 };

    const stats = { present: 0, absent: 0, leave: 0, halfday: 0, unmarked: 0 };
    
    calendarData.forEach(day => {
      if (!day.isEmpty && !day.isFuture) {
        const status = day.attendance?.status || "unmarked";
        stats[status]++;
      }
    });

    return stats;
  }, [selectedStaffId, calendarData]);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            isIconOnly
            variant="light"
            onPress={() => navigate("/staffs/attendance")}
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-default-900">Regularize Attendance</h1>
            <p className="text-sm text-default-500 mt-1">View and regularize staff attendance records</p>
          </div>
        </div>
      </div>

      {/* Staff Selection */}
      <Card shadow="none" className="border border-default-200 mb-6">
        <CardBody className="p-6">
          <Select
            label="Select Staff Member"
            placeholder="Choose a staff member to view attendance"
            selectedKeys={selectedStaffId ? [selectedStaffId] : []}
            onSelectionChange={(keys) => setSelectedStaffId(Array.from(keys)[0])}
            variant="bordered"
            size="lg"
            classNames={{
              trigger: "h-14"
            }}
          >
            {staff.filter(s => s.status === "active").map(s => (
              <SelectItem key={s.id} value={s.id}>
                {s.name} - {s.department}
              </SelectItem>
            ))}
          </Select>
        </CardBody>
      </Card>

      {!selectedStaffId && (
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center">
                <CalendarIcon size={40} className="text-primary-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-default-900 mb-2">Select a Staff Member</h3>
                <p className="text-sm text-default-500 max-w-md">
                  Choose a staff member from the dropdown above to view their attendance calendar and regularize any records.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 mt-4 text-xs text-default-500">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success-500" />
                  <span>Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-danger-500" />
                  <span>Absent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-warning-500" />
                  <span>On Leave</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-secondary-500" />
                  <span>Half Day</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-default-300" />
                  <span>Unmarked</span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {selectedStaffId && (
        <>
          {/* Staff Info Banner */}
          <Card shadow="none" className="border border-primary-200 bg-primary-50 mb-6">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary-700">
                    {selectedStaff?.name?.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-primary-900">{selectedStaff?.name}</h3>
                  <p className="text-sm text-primary-700">{selectedStaff?.department} • {selectedStaff?.role}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
            <Card shadow="none" className="border border-success-200 bg-success-50">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Check size={16} className="text-success-600" />
                  <span className="text-xs text-success-700 uppercase tracking-wider">Present</span>
                </div>
                <p className="text-2xl font-semibold text-success-700">{getMonthStats.present}</p>
              </CardBody>
            </Card>
            <Card shadow="none" className="border border-danger-200 bg-danger-50">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <X size={16} className="text-danger-600" />
                  <span className="text-xs text-danger-700 uppercase tracking-wider">Absent</span>
                </div>
                <p className="text-2xl font-semibold text-danger-700">{getMonthStats.absent}</p>
              </CardBody>
            </Card>
            <Card shadow="none" className="border border-warning-200 bg-warning-50">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={16} className="text-warning-600" />
                  <span className="text-xs text-warning-700 uppercase tracking-wider">Leave</span>
                </div>
                <p className="text-2xl font-semibold text-warning-700">{getMonthStats.leave}</p>
              </CardBody>
            </Card>
            <Card shadow="none" className="border border-secondary-200 bg-secondary-50">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle size={16} className="text-secondary-600" />
                  <span className="text-xs text-secondary-700 uppercase tracking-wider">Half Day</span>
                </div>
                <p className="text-2xl font-semibold text-secondary-700">{getMonthStats.halfday}</p>
              </CardBody>
            </Card>
            <Card shadow="none" className="border border-default-200 bg-default-50">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={16} className="text-default-500" />
                  <span className="text-xs text-default-600 uppercase tracking-wider">Unmarked</span>
                </div>
                <p className="text-2xl font-semibold text-default-700">{getMonthStats.unmarked}</p>
              </CardBody>
            </Card>
          </div>

          {/* Calendar */}
          <Card shadow="none" className="border border-default-200">
            <CardHeader className="flex justify-between items-center px-6 py-4 border-b border-default-200">
              <div className="flex items-center gap-3">
                <CalendarIcon size={20} className="text-default-500" />
                <h3 className="text-lg font-semibold text-default-900">
                  {monthNames[currentMonth]} {currentYear}
                </h3>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="flat"
                  onPress={handlePreviousMonth}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  onPress={handleNextMonth}
                  isDisabled={currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear()}
                >
                  Next
                </Button>
              </div>
            </CardHeader>
            <CardBody className="p-6">
              {/* Legend */}
              <div className="flex flex-wrap gap-4 mb-6 pb-4 border-b border-default-200">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success-500" />
                  <span className="text-xs text-default-600">Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-danger-500" />
                  <span className="text-xs text-default-600">Absent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-warning-500" />
                  <span className="text-xs text-default-600">On Leave</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-secondary-500" />
                  <span className="text-xs text-default-600">Half Day</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-default-300" />
                  <span className="text-xs text-default-600">Unmarked</span>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Day headers */}
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <div key={day} className="text-center text-xs font-semibold text-default-500 uppercase py-2">
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {calendarData.map((dayData, index) => (
                  <button
                    key={index}
                    onClick={() => handleDayClick(dayData)}
                    disabled={dayData.isEmpty || dayData.isFuture}
                    className={`
                      relative aspect-square rounded-lg border-2 transition-all
                      ${dayData.isEmpty ? "invisible" : ""}
                      ${dayData.isFuture ? "cursor-not-allowed" : "cursor-pointer hover:scale-105"}
                      ${getDayStyle(dayData)}
                    `}
                  >
                    {!dayData.isEmpty && (
                      <>
                        <span className="text-sm font-medium">{dayData.day}</span>
                        {getDayIndicator(dayData)}
                      </>
                    )}
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>
        </>
      )}

      {/* Regularize Modal */}
      <Modal isOpen={regularizeModalOpen} onOpenChange={setRegularizeModalOpen} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold">Regularize Attendance</h3>
                <p className="text-sm text-default-500 font-normal">
                  {selectedStaff?.name} - {selectedDate?.dateStr}
                </p>
              </ModalHeader>
              <Divider />
              <ModalBody className="py-6">
                <div className="space-y-4">
                  <Select
                    label="Status"
                    selectedKeys={[regularizeData.status]}
                    onSelectionChange={(keys) => setRegularizeData({ ...regularizeData, status: Array.from(keys)[0] })}
                    variant="bordered"
                  >
                    <SelectItem key="present" textValue="Present" startContent={<Check size={16} className="text-success" />}>
                      Present
                    </SelectItem>
                    <SelectItem key="halfday" textValue="Half Day" startContent={<AlertCircle size={16} className="text-secondary" />}>
                      Half Day
                    </SelectItem>
                    <SelectItem key="absent" textValue="Absent" startContent={<X size={16} className="text-danger" />}>
                      Absent
                    </SelectItem>
                    <SelectItem key="leave" textValue="On Leave" startContent={<Clock size={16} className="text-warning" />}>
                      On Leave
                    </SelectItem>
                  </Select>

                  {(regularizeData.status === "present" || regularizeData.status === "halfday") && (
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="time"
                        label="Check In Time"
                        value={regularizeData.inTime}
                        onValueChange={(value) => setRegularizeData({ ...regularizeData, inTime: value })}
                        variant="bordered"
                      />
                      <Input
                        type="time"
                        label="Check Out Time"
                        value={regularizeData.outTime}
                        onValueChange={(value) => setRegularizeData({ ...regularizeData, outTime: value })}
                        variant="bordered"
                      />
                    </div>
                  )}

                  <Textarea
                    label="Reason / Notes"
                    placeholder="Enter reason for regularization..."
                    value={regularizeData.reason}
                    onValueChange={(value) => setRegularizeData({ ...regularizeData, reason: value })}
                    variant="bordered"
                    minRows={3}
                  />

                  {selectedDate?.attendance && (
                    <div className="p-4 bg-default-50 rounded-lg border border-default-200">
                      <p className="text-xs text-default-500 mb-2">Current Record:</p>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Status:</span> {selectedDate.attendance.status}</p>
                        <p><span className="font-medium">In:</span> {selectedDate.attendance.inTime}</p>
                        <p><span className="font-medium">Out:</span> {selectedDate.attendance.outTime}</p>
                        {selectedDate.attendance.reason && (
                          <p><span className="font-medium">Reason:</span> {selectedDate.attendance.reason}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </ModalBody>
              <Divider />
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onPress={handleRegularize}>
                  Regularize
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
