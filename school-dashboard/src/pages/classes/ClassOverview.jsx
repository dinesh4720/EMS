import { useState, useMemo } from "react";
import {
  Card, CardBody, CardHeader, Chip, Progress, Button, Divider,
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Avatar, Tabs, Tab, Input, User
} from "@heroui/react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Calendar, IndianRupee, MessageSquare, User as UserIcon, Users, Clock,
  BookOpen, TrendingUp, AlertCircle, CheckCircle, Search, Phone,
  GraduationCap, Award, BarChart3, ArrowLeft
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function ClassOverview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { classesWithTeachers, students } = useApp();
  const [studentFilter, setStudentFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const cls = classesWithTeachers.find(c => c.id === id || c.id === String(id)) || classesWithTeachers[0];
  const classStudents = students.filter(s => s.classId === cls?.id);

  const presentCount = Math.round(cls.strength * cls.attendanceToday / 100);
  const absentCount = cls.strength - presentCount;

  const feeStats = useMemo(() => {
    const paid = classStudents.filter(s => s.feeStatus === "paid").length;
    const pending = classStudents.filter(s => s.feeStatus === "pending").length;
    const overdue = classStudents.filter(s => s.feeStatus === "overdue").length;
    return { paid, pending, overdue };
  }, [classStudents]);

  const filteredStudents = useMemo(() => {
    let list = classStudents;
    if (studentFilter !== "all") {
      list = list.filter(s => s.feeStatus === studentFilter);
    }
    if (searchQuery) {
      list = list.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rollNo.toString().includes(searchQuery)
      );
    }
    return list;
  }, [classStudents, studentFilter, searchQuery]);

  // Mock data for today's schedule
  const todaySchedule = [
    { period: 1, subject: "Mathematics", time: "08:00 - 08:45", teacher: "Rajesh Kumar" },
    { period: 2, subject: "English", time: "08:45 - 09:30", teacher: "Priya Singh" },
    { period: 3, subject: "Science", time: "09:45 - 10:30", teacher: "Sunita Devi" },
    { period: 4, subject: "Hindi", time: "10:30 - 11:15", teacher: "Vikram Patel" },
    { period: 5, subject: "Social Studies", time: "12:00 - 12:45", teacher: "Amit Verma" },
  ];

  // Mock recent activities
  const recentActivities = [
    { type: "attendance", message: "Attendance marked for today", time: "08:35 AM", icon: CheckCircle, color: "text-success" },
    { type: "fee", message: "Fee collected from 3 students", time: "Yesterday", icon: IndianRupee, color: "text-primary" },
    { type: "alert", message: "2 students absent for 3+ days", time: "2 days ago", icon: AlertCircle, color: "text-warning" },
  ];

  return (
    <div className="space-y-4 animate-fade-in pb-6">
      {/* Header with Class Info */}
      <div className="flex items-center justify-between">
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/25">
              {cls.name?.replace("Class ", "")}{cls.section}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-default-800">{cls.name} - Section {cls.section}</h2>
              <p className="text-sm text-default-500 flex items-center gap-2">
                <span
                  className="text-primary hover:underline cursor-pointer"
                  onClick={() => cls.classTeacherId && navigate(`/staffs/${cls.classTeacherId}`)}
                >
                  {cls.teacher}
                </span>
                <span>•</span>
                <span>Class Teacher</span>
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="flat" color="primary" startContent={<Calendar size={14} />}>
            Mark Attendance
          </Button>
          <Button size="sm" variant="flat" color="secondary" startContent={<MessageSquare size={14} />}>
            Send Notice
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="shadow-sm border border-default-200 bg-gradient-to-br from-primary-50 to-background">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-default-500 uppercase tracking-wider font-medium">Total Students</p>
                <p className="text-3xl font-bold text-primary mt-1">{cls.strength}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users size={20} className="text-primary" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="shadow-sm border border-default-200 bg-gradient-to-br from-success-50 to-background">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-default-500 uppercase tracking-wider font-medium">Present Today</p>
                <p className="text-3xl font-bold text-success mt-1">{presentCount}</p>
                <p className="text-xs text-success-600 mt-0.5">{cls.attendanceToday}% attendance</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle size={20} className="text-success" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="shadow-sm border border-default-200 bg-gradient-to-br from-danger-50 to-background">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-default-500 uppercase tracking-wider font-medium">Absent Today</p>
                <p className="text-3xl font-bold text-danger mt-1">{absentCount}</p>
                <p className="text-xs text-danger-600 mt-0.5">{100 - cls.attendanceToday}% absent</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center">
                <AlertCircle size={20} className="text-danger" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="shadow-sm border border-default-200 bg-gradient-to-br from-warning-50 to-background">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-default-500 uppercase tracking-wider font-medium">Fee Pending</p>
                <p className="text-3xl font-bold text-warning mt-1">{cls.feePending}</p>
                <p className="text-xs text-warning-600 mt-0.5">students</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <IndianRupee size={20} className="text-warning" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column - Today's Schedule & Activities */}
        <div className="space-y-4">
          {/* Today's Schedule */}
          <Card className="shadow-sm border border-default-200">
            <CardHeader className="py-3 px-4 border-b border-default-100 bg-secondary/5">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-secondary" />
                <h3 className="text-sm font-semibold">Today's Schedule</h3>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-default-100">
                {todaySchedule.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 hover:bg-default-50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-xs font-bold text-secondary">
                      P{item.period}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-default-700">{item.subject}</p>
                      <p className="text-xs text-default-400">{item.teacher}</p>
                    </div>
                    <span className="text-xs text-default-500 font-mono">{item.time.split(" - ")[0]}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-sm border border-default-200">
            <CardHeader className="py-3 px-4 border-b border-default-100">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-default-500" />
                <h3 className="text-sm font-semibold">Recent Activity</h3>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-default-100">
                {recentActivities.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3">
                    <div className={`mt-0.5 ${activity.color}`}>
                      <activity.icon size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-default-700">{activity.message}</p>
                      <p className="text-xs text-default-400 mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Column - Students List */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm border border-default-200 h-full">
            <CardHeader className="py-3 px-4 border-b border-default-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
                <div className="flex items-center gap-2">
                  <GraduationCap size={16} className="text-primary" />
                  <h3 className="text-sm font-semibold">Students ({classStudents.length})</h3>
                </div>
                <div className="flex gap-2">
                  <Input
                    size="sm"
                    placeholder="Search students..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                    startContent={<Search size={14} className="text-default-400" />}
                    className="w-40"
                    classNames={{ inputWrapper: "h-8 min-h-8 bg-default-100" }}
                  />
                  <Tabs
                    size="sm"
                    selectedKey={studentFilter}
                    onSelectionChange={setStudentFilter}
                    classNames={{
                      tabList: "bg-default-100 p-0.5 h-8",
                      tab: "h-7 text-xs",
                      cursor: "bg-background shadow-sm"
                    }}
                  >
                    <Tab key="all" title="All" />
                    <Tab key="paid" title={
                      <div className="flex items-center gap-1">
                        <span>Paid</span>
                        <span className="text-success text-[10px]">({feeStats.paid})</span>
                      </div>
                    } />
                    <Tab key="pending" title={
                      <div className="flex items-center gap-1">
                        <span>Pending</span>
                        <span className="text-warning text-[10px]">({feeStats.pending})</span>
                      </div>
                    } />
                    <Tab key="overdue" title={
                      <div className="flex items-center gap-1">
                        <span>Overdue</span>
                        <span className="text-danger text-[10px]">({feeStats.overdue})</span>
                      </div>
                    } />
                  </Tabs>
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-0 overflow-auto">
              <Table
                aria-label="Students"
                removeWrapper
                radius="none"
                isStriped={false}
                classNames={{
                  table: "w-full",
                  th: "bg-transparent text-default-500 font-semibold text-xs uppercase tracking-wider h-12 border-b border-default-200",
                  td: "py-4 border-b border-default-100",
                  tr: "transition-opacity hover:bg-default-50/30 cursor-pointer",
                  wrapper: "p-0"
                }}
              >
                <TableHeader>
                  <TableColumn className="w-[50px]">ROLL</TableColumn>
                  <TableColumn>STUDENT</TableColumn>
                  <TableColumn className="w-[140px]">PARENT CONTACT</TableColumn>
                  <TableColumn className="w-[100px]" align="center">FEE STATUS</TableColumn>
                  <TableColumn className="w-[80px]" align="center">ACTIONS</TableColumn>
                </TableHeader>
                <TableBody emptyContent={
                  <div className="py-8 text-center text-default-400">
                    <Search size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No students found</p>
                  </div>
                }>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id} onClick={() => navigate(`/students/${student.id}`)}>
                      <TableCell>
                        <span className="text-xs font-mono text-default-500">{student.rollNo}</span>
                      </TableCell>
                      <TableCell>
                        <User
                          name={student.name}
                          avatarProps={{
                            src: `https://i.pravatar.cc/150?u=student${student.id}`,
                            size: "sm",
                            radius: "md"
                          }}
                          classNames={{
                            name: "text-sm font-medium text-default-700 hover:text-primary"
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Phone size={12} className="text-default-400" />
                          <span className="text-xs text-default-600 font-mono">{student.parentPhone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <Chip
                            size="sm"
                            variant="flat"
                            color={student.feeStatus === "paid" ? "success" : student.feeStatus === "pending" ? "warning" : "danger"}
                            classNames={{
                              base: "h-6",
                              content: "text-xs font-medium capitalize"
                            }}
                          >
                            {student.feeStatus}
                          </Chip>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            className="h-7 w-7 min-w-7"
                            onPress={(e) => e.stopPropagation()}
                            title="Send Message"
                          >
                            <MessageSquare size={14} className="text-default-500" />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            className="h-7 w-7 min-w-7"
                            as="a"
                            href={`tel:${student.parentPhone}`}
                            onPress={(e) => e.stopPropagation()}
                            title="Call Parent"
                          >
                            <Phone size={14} className="text-default-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Bottom Section - Attendance & Fee Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Attendance Progress */}
        <Card className="shadow-sm border border-default-200">
          <CardHeader className="py-3 px-4 border-b border-default-100 bg-success/5">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-success" />
                <h3 className="text-sm font-semibold">Attendance Overview</h3>
              </div>
              <Chip size="sm" variant="flat" color="success" classNames={{ content: "font-bold" }}>
                {cls.attendanceToday}%
              </Chip>
            </div>
          </CardHeader>
          <CardBody className="p-4">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-default-600">Today's Attendance</span>
                  <span className="font-medium">{presentCount} / {cls.strength}</span>
                </div>
                <Progress
                  value={cls.attendanceToday}
                  color="success"
                  size="md"
                  radius="sm"
                  classNames={{ track: "h-3", indicator: "h-3" }}
                />
              </div>
              <Divider />
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 bg-success-50 rounded-lg">
                  <p className="text-lg font-bold text-success">{presentCount}</p>
                  <p className="text-[10px] text-default-500 uppercase">Present</p>
                </div>
                <div className="p-2 bg-danger-50 rounded-lg">
                  <p className="text-lg font-bold text-danger">{absentCount}</p>
                  <p className="text-[10px] text-default-500 uppercase">Absent</p>
                </div>
                <div className="p-2 bg-warning-50 rounded-lg">
                  <p className="text-lg font-bold text-warning">0</p>
                  <p className="text-[10px] text-default-500 uppercase">Leave</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Fee Collection Summary */}
        <Card className="shadow-sm border border-default-200">
          <CardHeader className="py-3 px-4 border-b border-default-100 bg-primary/5">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <IndianRupee size={16} className="text-primary" />
                <h3 className="text-sm font-semibold">Fee Collection Status</h3>
              </div>
              <Button size="sm" variant="flat" color="primary" className="h-7 text-xs">
                View Details
              </Button>
            </div>
          </CardHeader>
          <CardBody className="p-4">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-default-600">Collection Progress</span>
                  <span className="font-medium">{feeStats.paid} / {classStudents.length} students</span>
                </div>
                <Progress
                  value={(feeStats.paid / classStudents.length) * 100}
                  color="primary"
                  size="md"
                  radius="sm"
                  classNames={{ track: "h-3", indicator: "h-3" }}
                />
              </div>
              <Divider />
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 bg-success-50 rounded-lg">
                  <p className="text-lg font-bold text-success">{feeStats.paid}</p>
                  <p className="text-[10px] text-default-500 uppercase">Paid</p>
                </div>
                <div className="p-2 bg-warning-50 rounded-lg">
                  <p className="text-lg font-bold text-warning">{feeStats.pending}</p>
                  <p className="text-[10px] text-default-500 uppercase">Pending</p>
                </div>
                <div className="p-2 bg-danger-50 rounded-lg">
                  <p className="text-lg font-bold text-danger">{feeStats.overdue}</p>
                  <p className="text-[10px] text-default-500 uppercase">Overdue</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}