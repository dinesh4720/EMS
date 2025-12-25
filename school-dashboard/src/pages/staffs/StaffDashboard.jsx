import { useState } from "react";
import {
  Card, CardBody, CardHeader, Chip, Progress, Button, Divider,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure,
  Textarea, Avatar, Tabs, Tab, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Tooltip,
  Input, Select, SelectItem
} from "@heroui/react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Calendar, CheckSquare, MessageSquare, Clock, Mail, Phone, MapPin, Briefcase,
  Edit, User, FileText, Download, Upload, Plus, AlertCircle, BookOpen, GraduationCap,
  DollarSign, FileCheck, Layers, Settings, ChevronRight
} from "lucide-react";
import PageHeader from "../../components/PageHeader";
import { useApp } from "../../context/AppContext";

export default function StaffDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    getStaffById, getMonthlyAttendance, markStaffAttendance: markAttendance, staffAttendance: attendance,
    staffSalaries, salarySettings, classes, updateClass, students, updateStaff, deleteStaff,
    lessonPlans: allLessonPlans, documents: allDocuments, remarks: allRemarks,
    addLessonPlan, addDocument, addRemark, addEvent, payrollHistory
  } = useApp();

  const { isOpen, onOpen, onClose } = useDisclosure(); // Message Modal
  const { isOpen: isRemarkOpen, onOpen: onRemarkOpen, onClose: onRemarkClose } = useDisclosure(); // Remark Modal
  const { isOpen: isTestModalOpen, onOpen: onTestOpen, onClose: onTestClose } = useDisclosure(); // Test Modal

  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const [newRemark, setNewRemark] = useState({ studentId: "", remark: "" });

  const [selectedClassId, setSelectedClassId] = useState("");
  const [newTest, setNewTest] = useState({ title: "", classId: "", subject: "", date: "", time: "09:00" });

  const staff = getStaffById(id);
  const today = new Date();
  const monthlyStats = getMonthlyAttendance(id, today.getFullYear(), today.getMonth());
  const attendanceRate = monthlyStats.total > 0 ? Math.round((monthlyStats.present / monthlyStats.total) * 100) : 0;
  const staffSalary = staffSalaries?.[id] || {};

  // Calculate totals
  const calculateTotals = (salaryData) => {
    if (!salaryData) return { totalEarnings: 0, totalDeductions: 0, netSalary: 0 };
    let totalEarnings = 0;
    salarySettings?.earnings?.forEach(item => {
      totalEarnings += Number(salaryData[item.id] || 0);
    });
    let totalDeductions = 0;
    salarySettings?.deductions?.forEach(item => {
      totalDeductions += Number(salaryData[item.id] || 0);
    });
    return { totalEarnings, totalDeductions, netSalary: totalEarnings - totalDeductions };
  };

  const { totalEarnings, totalDeductions, netSalary } = calculateTotals(staffSalary);

  if (!staff) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <User size={64} className="text-default-300" />
        <h3 className="text-xl font-medium text-default-700">Staff member not found</h3>
        <Button size="sm" variant="flat" color="primary" onPress={() => navigate("/staffs")} startContent={<ArrowLeft size={16} />}>Back to Staff List</Button>
      </div>
    );
  }

  // Filter data for current staff
  const lessonPlans = allLessonPlans.filter(p => p.staffId == id);
  const documents = allDocuments.filter(d => d.staffId == id);
  const remarks = allRemarks.filter(r => r.staffId == id);

  // Logic for payroll history can be improved if data available
  const payRecords = payrollHistory.map(ph => ({
    id: ph.id,
    month: ph.month,
    amount: staffSalary ? (calculateTotals(staffSalary).netSalary) : 0,
    status: "Paid",
    paidDate: ph.date
  }));

  const assignedClasses = staff.role === "Teacher" ? [
    { class: staff.classes?.[0] || "10-A", subject: staff.department, time: "08:00 - 08:45", period: 1, type: "Lecture" },
    { class: staff.classes?.[1] || staff.classes?.[0] || "10-B", subject: staff.department, time: "09:45 - 10:30", period: 3, type: "Lab" },
    { class: staff.classes?.[0] || "10-A", subject: staff.department, time: "12:00 - 12:45", period: 5, type: "Lecture" },
  ] : [];

  const pendingTasks = [
    { id: 1, task: `Mark attendance for ${staff.classes?.[0] || "assigned class"}`, type: "attendance", urgent: true },
    { id: 2, task: "Submit monthly report", type: "report", urgent: false },
    { id: 3, task: "Review student assignments", type: "task", urgent: false },
  ];

  const todayAttendance = attendance[staff.id]?.[today.toISOString().split('T')[0]];

  const handleAddRemark = () => {
    if (!newRemark.studentId || !newRemark.remark) return;

    // Find student details
    const student = students.find(s => s.id.toString() === newRemark.studentId.toString());
    const studentClass = classes.find(c => c.id === student?.classId);

    const remarkEntry = {
      id: Date.now(),
      staffId: id,
      studentId: newRemark.studentId,
      student: student ? student.name : "Unknown",
      class: studentClass ? studentClass.name : "Unknown",
      remark: newRemark.remark,
      date: new Date().toISOString().split('T')[0]
    };

    addRemark(remarkEntry);
    setNewRemark({ studentId: "", remark: "" });
    onRemarkClose();
  };

  const handleAssignClass = async () => {
    if (!selectedClassId) return;
    try {
      await updateClass(selectedClassId, { classTeacherId: staff.id });
      // Show success notification or toast here if available
      console.log(`Assigned ${staff.name} as Class Teacher for class ID ${selectedClassId}`);
    } catch (error) {
      console.error("Failed to assign class teacher:", error);
    }
  };

  const handleCreateTest = () => {
    // Determine class name
    const cls = classes.find(c => c.id.toString() === newTest.classId.toString());
    const className = cls ? cls.name : "Unknown Class";

    const newEvent = {
      title: `${newTest.title} (${newTest.subject}) - ${className}`,
      date: newTest.date,
      startTime: newTest.time,
      endTime: "",
      type: "exam",
      allDay: false
    };
    addEvent(newEvent);

    console.log("Creating test:", { ...newTest, className });
    onTestClose();
    setNewTest({ title: "", classId: "", subject: "", date: "", time: "09:00" });
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await updateStaff(staff.id, { ...staff, status: newStatus });
      console.log("Status updated to:", newStatus);
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm("Are you sure you want to delete this staff account? This action cannot be undone.")) {
      try {
        await deleteStaff(staff.id);
        navigate("/staffs");
      } catch (error) {
        console.error("Failed to delete staff:", error);
      }
    }
  };

  const handleMarkTodayAttendance = (status) => {
    const todayStr = today.toISOString().split('T')[0];
    markAttendance(staff.id, todayStr, status, status === "present" ? "08:30" : "-", "-");
  };

  const handleSendMessage = () => {
    console.log("Sending message to", staff.name, ":", message);
    setMessage("");
    onClose();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <PageHeader
        title="Staff Profile"
        breadcrumbs={[{ label: "Staffs", href: "/staffs" }, { label: staff.name }]}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="light" startContent={<ArrowLeft size={16} />} onPress={() => navigate("/staffs")}>Back</Button>
          </div>
        }
      />

      {/* Pending Actions Info Bar */}
      {pendingTasks.length > 0 && (
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning-100 rounded-full text-warning-700">
              <AlertCircle size={18} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-warning-800">Pending Actions Required</h4>
              <p className="text-xs text-warning-700">You have {pendingTasks.length} pending tasks to complete.</p>
            </div>
          </div>
          <Button size="sm" color="warning" variant="flat" endContent={<ChevronRight size={14} />}>View All</Button>
        </div>
      )}

      {/* Profile Header Card */}
      <Card className="shadow-sm border border-default-200 bg-background rounded-md">
        <CardBody className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar name={staff.name} size="lg" isBordered color="primary" className="w-24 h-24 text-3xl" />
            <div className="flex-1 w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-default-900">{staff.name}</h2>
                    <p className="text-sm text-default-500">{staff.role} • {staff.department}</p>
                  </div>
                  <Chip size="sm" color={staff.status === "active" ? "success" : "default"} variant="flat" className="capitalize px-4">{staff.status}</Chip>
                </div>
                <div className="flex gap-2 mt-4 md:mt-0">
                  <Button size="sm" variant="flat" color="primary" startContent={<MessageSquare size={16} />} onPress={onOpen}>Message</Button>
                  <Button size="sm" variant="bordered" startContent={<Edit size={16} />}>Edit Profile</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-default-600">
                <div className="flex items-center gap-2 p-2 bg-default-50 rounded border border-default-100">
                  <Mail size={14} className="text-default-400" />
                  <span>{staff.email}</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-default-50 rounded border border-default-100">
                  <Phone size={14} className="text-default-400" />
                  <span>{staff.phone}</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-default-50 rounded border border-default-100">
                  <Briefcase size={14} className="text-default-400" />
                  <span>Joined {staff.joinDate}</span>
                </div>
                {staff.classes?.length > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-default-50 rounded border border-default-100">
                    <GraduationCap size={14} className="text-default-400" />
                    <span className="truncate">Active Classes: {staff.classes.join(", ")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Main Content Tabs */}
      <div className="flex flex-col gap-4">
        <Tabs
          aria-label="Staff Dashboard Options"
          color="primary"
          variant="underlined"
          classNames={{
            tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
            cursor: "w-full bg-primary",
            tab: "max-w-fit px-0 h-12",
            tabContent: "group-data-[selected=true]:text-primary font-medium"
          }}
          selectedKey={activeTab}
          onSelectionChange={setActiveTab}
        >
          <Tab key="overview" title="Overview" />
          <Tab key="academics" title="Academics & Timetable" />
          <Tab key="performance" title="Performance & Remarks" />
          <Tab key="payroll" title="Payroll" />
          <Tab key="documents" title="Documents" />
          <Tab key="settings" title="Settings" />
        </Tabs>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
            {/* Today's Status */}
            <Card className="md:col-span-1 shadow-sm border border-default-200">
              <CardHeader className="pb-0 pt-4 px-4 flex-col items-start">
                <p className="text-tiny uppercase font-bold text-default-500">Today's Status</p>
                <h4 className="font-bold text-large">Daily Attendance</h4>
              </CardHeader>
              <CardBody className="overflow-visible py-4 items-center justify-center flex flex-col gap-4">
                {todayAttendance ? (
                  <div className="text-center">
                    <Chip size="lg" color={todayAttendance.status === "present" ? "success" : "danger"} variant="flat" className="mb-2 uppercase font-bold px-6">
                      {todayAttendance.status}
                    </Chip>
                    <p className="text-xs text-default-500">In: {todayAttendance.inTime} | Out: {todayAttendance.outTime}</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 w-full px-4">
                    <Button className="w-full" color="success" variant="flat" onPress={() => handleMarkTodayAttendance("present")}>Mark Present</Button>
                    <div className="flex gap-2">
                      <Button className="flex-1" color="warning" variant="flat" onPress={() => handleMarkTodayAttendance("leave")}>Leave</Button>
                      <Button className="flex-1" color="danger" variant="flat" onPress={() => handleMarkTodayAttendance("absent")}>Absent</Button>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Monthly Stats */}
            <Card className="md:col-span-2 shadow-sm border border-default-200">
              <CardHeader className="pb-0 pt-4 px-4 flex justify-between">
                <div>
                  <p className="text-tiny uppercase font-bold text-default-500">Attendance Metrics</p>
                  <h4 className="font-bold text-large">Monthly Overview</h4>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-bold ${attendanceRate >= 90 ? "text-success" : "text-warning"}`}>{attendanceRate}%</span>
                  <p className="text-tiny text-default-500">Attendance Rate</p>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-3 gap-4 text-center mt-2">
                  <div className="p-3 bg-success-50 rounded-lg">
                    <p className="text-xl font-bold text-success">{monthlyStats.present}</p>
                    <p className="text-xs text-default-500">Present Days</p>
                  </div>
                  <div className="p-3 bg-danger-50 rounded-lg">
                    <p className="text-xl font-bold text-danger">{monthlyStats.absent}</p>
                    <p className="text-xs text-default-500">Absent Days</p>
                  </div>
                  <div className="p-3 bg-warning-50 rounded-lg">
                    <p className="text-xl font-bold text-warning">{monthlyStats.leave}</p>
                    <p className="text-xs text-default-500">Leaves Taken</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Quick Tasks */}
            <Card className="md:col-span-3 shadow-sm border border-default-200">
              <CardHeader className="pb-2 pt-4 px-4">
                <h4 className="font-bold text-medium">Pending Tasks</h4>
              </CardHeader>
              <CardBody className="pt-0">
                <div className="flex flex-col gap-2">
                  {pendingTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-default-50 rounded-lg border border-default-100">
                      <div className="flex items-center gap-3">
                        {task.urgent && <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />}
                        <span className="text-sm text-default-700">{task.task}</span>
                      </div>
                      <Button size="sm" variant="light" color="primary">Action</Button>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {activeTab === "academics" && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Timetable */}
              <Card className="shadow-sm border border-default-200">
                <CardHeader className="flex justify-between px-4 pt-4">
                  <h4 className="font-bold text-medium flex items-center gap-2"><Calendar size={18} /> Class Timetable</h4>
                  <Button size="sm" variant="flat">Full Schedule</Button>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {assignedClasses.map((cls, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border border-default-100 rounded-lg hover:bg-default-50 transition-colors">
                        <div>
                          <p className="font-medium text-sm">{cls.class} - {cls.subject}</p>
                          <p className="text-xs text-default-500">{cls.time} • Period {cls.period}</p>
                        </div>
                        <Chip size="sm" variant="flat" color="secondary">{cls.type}</Chip>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>

              {/* Assigned Subjects & Lesson Plans */}
              <div className="space-y-6">
                <Card className="shadow-sm border border-default-200">
                  <CardHeader className="flex justify-between px-4 pt-4">
                    <h4 className="font-bold text-medium flex items-center gap-2"><BookOpen size={18} /> Lesson Plans</h4>
                    <Button size="sm" color="primary" variant="flat" startContent={<Plus size={14} />}>New Plan</Button>
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-2">
                      {lessonPlans.map((plan) => (
                        <div key={plan.id} className="flex items-center justify-between p-2 border-b border-default-100 last:border-0">
                          <div>
                            <p className="text-sm font-medium">{plan.topic}</p>
                            <p className="text-xs text-default-500">{plan.subject} ({plan.class})</p>
                          </div>
                          <Chip size="sm" color={plan.status === "Completed" ? "success" : "warning"} variant="dot">{plan.status}</Chip>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>

                <Card className="shadow-sm border border-default-200">
                  <CardHeader className="flex justify-between px-4 pt-4">
                    <h4 className="font-bold text-medium flex items-center gap-2"><FileCheck size={18} /> Assessments & Tests</h4>
                    <Button size="sm" color="primary" variant="flat" startContent={<Plus size={14} />} onPress={onTestOpen}>Create Test</Button>
                  </CardHeader>
                  <CardBody className="py-2">
                    <div className="flex flex-col gap-2 items-center justify-center text-center p-4 text-default-400">
                      <FileCheck size={32} className="opacity-20 mb-2" />
                      <p className="text-xs">No active tests created. Create a new test to assign to students.</p>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>
        )}

        {activeTab === "performance" && (
          <div className="space-y-6 animate-fade-in">
            <Card className="shadow-sm border border-default-200">
              <CardHeader className="flex justify-between px-4 pt-4">
                <h4 className="font-bold text-medium">Student Remarks History</h4>
                <Button size="sm" color="primary" variant="solid" startContent={<Plus size={14} />} onPress={onRemarkOpen}>Add Remark</Button>
              </CardHeader>
              <CardBody>
                <Table aria-label="Remarks table" removeWrapper>
                  <TableHeader>
                    <TableColumn>STUDENT</TableColumn>
                    <TableColumn>CLASS</TableColumn>
                    <TableColumn>REMARK</TableColumn>
                    <TableColumn>DATE</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {remarks.map((remark) => (
                      <TableRow key={remark.id}>
                        <TableCell>{remark.student}</TableCell>
                        <TableCell>{remark.class}</TableCell>
                        <TableCell className="max-w-xs truncate">{remark.remark}</TableCell>
                        <TableCell>{remark.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          </div>
        )}

        {activeTab === "payroll" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
            <Card className="md:col-span-1 shadow-sm border border-default-200 bg-primary-50/50">
              <CardHeader className="pb-0 pt-4 px-4">
                <h4 className="font-bold text-medium text-primary-700">Salary Information</h4>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {salarySettings?.earnings?.map(earning => (
                    <div key={earning.id} className="flex justify-between items-center py-2 border-b border-primary-100 last:border-0">
                      <span className="text-sm text-default-600">{earning.name}</span>
                      <span className="font-semibold">₹{(staffSalary[earning.id] || 0).toLocaleString()}</span>
                    </div>
                  ))}
                  {salarySettings?.deductions?.map(deduction => (
                    <div key={deduction.id} className="flex justify-between items-center py-2 border-b border-primary-100 last:border-0">
                      <span className="text-sm text-default-600 text-danger">{deduction.name}</span>
                      <span className="font-semibold text-danger">-₹{(staffSalary[deduction.id] || 0).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center py-2 pt-4 border-t border-primary-200">
                    <span className="text-base font-bold text-primary-700">Net Salary</span>
                    <span className="text-xl font-bold text-primary-700">₹{netSalary.toLocaleString()}</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="md:col-span-2 shadow-sm border border-default-200">
              <CardHeader className="flex justify-between px-4 pt-4">
                <h4 className="font-bold text-medium">Recent Pay Records</h4>
                <Button size="sm" variant="flat" startContent={<Download size={14} />}>Export All</Button>
              </CardHeader>
              <CardBody>
                <Table aria-label="Payroll History" removeWrapper>
                  <TableHeader>
                    <TableColumn>MONTH</TableColumn>
                    <TableColumn>AMOUNT</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                    <TableColumn>DATE PAID</TableColumn>
                    <TableColumn>ACTION</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {payRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.month}</TableCell>
                        <TableCell>₹{record.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip size="sm" color="success" variant="flat">Paid</Chip>
                        </TableCell>
                        <TableCell>{record.paidDate}</TableCell>
                        <TableCell>
                          <Button size="sm" isIconOnly variant="light" color="primary"><Download size={16} /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          </div>
        )}

        {activeTab === "documents" && (
          <Card className="shadow-sm border border-default-200 animate-fade-in">
            <CardHeader className="flex justify-between px-4 pt-4">
              <h4 className="font-bold text-medium">Staff Documents</h4>
              <Button size="sm" color="primary" startContent={<Upload size={14} />}>Upload New</Button>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="group p-4 rounded-lg border border-default-200 hover:border-primary transition-colors cursor-pointer bg-default-50 hover:bg-default-100">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
                        <FileText size={20} />
                      </div>
                      <Button size="sm" isIconOnly variant="light" className="opacity-0 group-hover:opacity-100"><Download size={16} /></Button>
                    </div>
                    <h5 className="font-medium text-sm truncate" title={doc.name}>{doc.name}</h5>
                    <div className="flex justify-between mt-2 text-xs text-default-500">
                      <span>{doc.type}</span>
                      <span>{doc.size}</span>
                    </div>
                  </div>
                ))}
                <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-dashed border-default-300 text-default-400 hover:border-primary hover:text-primary transition-colors cursor-pointer min-h-[120px]">
                  <Upload size={24} className="mb-2" />
                  <span className="text-sm font-medium">Upload Document</span>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {activeTab === "settings" && (
          <div className="max-w-3xl space-y-6 animate-fade-in">
            <Card className="shadow-sm border border-default-200">
              <CardHeader className="pb-0 pt-4 px-4">
                <h4 className="font-bold text-medium">Staff Assignment</h4>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Class Teacher For</label>
                  <p className="text-xs text-default-500">Assign this staff member as the class teacher for a specific class.</p>
                  <div className="flex gap-4 w-full max-w-sm items-center">
                    <Select
                      aria-label="Select Class"
                      placeholder="Select Class"
                      size="sm"
                      selectedKeys={selectedClassId ? [selectedClassId] : []}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="flex-1"
                    >
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id} textValue={cls.name}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </Select>
                    <Button size="sm" color="primary" onPress={handleAssignClass}>Update</Button>
                  </div>
                </div>
                <Divider />
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Reset Status</label>
                  <p className="text-xs text-default-500 mb-2">Reset the staff status if they are returning from leave or suspension.</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="flat" color="success" onPress={() => handleStatusChange("active")}>Set Active</Button>
                    <Button size="sm" variant="flat" color="warning" onPress={() => handleStatusChange("on leave")}>Set On Leave</Button>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="shadow-sm border border-danger-100">
              <CardHeader className="pb-0 pt-4 px-4">
                <h4 className="font-bold text-medium text-danger">Danger Zone</h4>
              </CardHeader>
              <CardBody className="space-y-4">
                <p className="text-sm text-default-600">Once you delete a staff account, there is no going back. Please be certain.</p>
                <Button size="sm" color="danger" variant="flat" startContent={<AlertCircle size={16} />} onPress={handleDeleteAccount}>Delete Staff Account</Button>
              </CardBody>
            </Card>
          </div>
        )}
      </div>

      {/* Add Remark Modal */}
      <Modal isOpen={isRemarkOpen} onClose={onRemarkClose} backdrop="blur">
        <ModalContent>
          <ModalHeader>Add Student Remark</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Select
                label="Student"
                placeholder="Select Student"
                variant="bordered"
                selectedKeys={newRemark.studentId ? [newRemark.studentId] : []}
                onChange={(e) => setNewRemark({ ...newRemark, studentId: e.target.value })}
              >
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id} textValue={student.name}>
                    {student.name} ({classes.find(c => c.id === student.classId)?.name})
                  </SelectItem>
                ))}
              </Select>
              <Textarea
                label="Remark"
                placeholder="Enter remark details..."
                minRows={3}
                variant="bordered"
                value={newRemark.remark}
                onChange={(e) => setNewRemark({ ...newRemark, remark: e.target.value })}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onRemarkClose}>Cancel</Button>
            <Button color="primary" onPress={handleAddRemark}>Save Remark</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Test Modal */}
      <Modal isOpen={isTestModalOpen} onClose={onTestClose} backdrop="blur">
        <ModalContent>
          <ModalHeader>Create New Test</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Test Title"
                placeholder="e.g. Mid-Term Physics"
                variant="bordered"
                value={newTest.title}
                onChange={(e) => setNewTest({ ...newTest, title: e.target.value })}
              />
              <Select
                label="Class"
                placeholder="Select Class"
                variant="bordered"
                selectedKeys={newTest.classId ? [newTest.classId] : []}
                onChange={(e) => setNewTest({ ...newTest, classId: e.target.value })}
              >
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id} textValue={cls.name}>
                    {cls.name}
                  </SelectItem>
                ))}
              </Select>
              <Input
                label="Subject"
                placeholder="e.g. Physics"
                variant="bordered"
                value={newTest.subject}
                onChange={(e) => setNewTest({ ...newTest, subject: e.target.value })}
              />
              <div className="flex gap-4">
                <Input
                  type="date"
                  label="Date"
                  variant="bordered"
                  value={newTest.date}
                  onChange={(e) => setNewTest({ ...newTest, date: e.target.value })}
                />
                <Input
                  type="time"
                  label="Time"
                  variant="bordered"
                  value={newTest.time}
                  onChange={(e) => setNewTest({ ...newTest, time: e.target.value })}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onTestClose}>Cancel</Button>
            <Button color="primary" onPress={handleCreateTest}>Schedule Test</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Send Message Modal */}
      <Modal isOpen={isOpen} onClose={onClose} backdrop="blur">
        <ModalContent>
          <ModalHeader>Send Message to {staff.name}</ModalHeader>
          <ModalBody>
            <Textarea
              label="Message"
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              minRows={3}
              variant="bordered"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>Cancel</Button>
            <Button color="primary" onPress={handleSendMessage} isDisabled={!message.trim()}>Send</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
