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
  DollarSign, FileCheck, Layers, Settings, ChevronRight, Globe, TrendingUp, IndianRupee
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

  if (!staff) return <div className="p-8 text-center text-default-500">Staff member not found</div>;

  const handleSendMessage = () => {
    console.log("Sending message to", staff.name, ":", message);
    setMessage("");
    onClose();
  };

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in p-4 lg:p-6 pb-8">
      {/* Header with Back Icon and Title */}
      <div className="max-w-[1600px] mx-auto mb-6">
        <div className="flex items-center gap-3">
          <Button
            isIconOnly
            variant="light"
            onPress={() => navigate('/staffs')}
            className="text-default-600 hover:text-default-900"
            size="sm"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold text-default-900">Staff Profile</h1>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

        {/* Main Content - Now on Left */}
        <div className="lg:col-span-3 space-y-4">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={setActiveTab}
            variant="underlined"
            classNames={{
              tabList: "gap-4 border-b border-default-200 w-full p-0",
              cursor: "w-full bg-primary",
              tab: "max-w-fit px-0 h-10 pb-2",
              tabContent: "group-data-[selected=true]:text-primary group-data-[selected=true]:font-semibold font-medium text-default-500"
            }}
          >
            <Tab key="overview" title="Overview" />
            <Tab key="about" title="About" />
            <Tab key="academics" title="Timetable & Plans" />
            <Tab key="payroll" title="Payroll" />
            <Tab key="documents" title="Documents" />
            <Tab key="settings" title="Settings" />
          </Tabs>

          {activeTab === "overview" && (
            <div className="space-y-4 animate-fade-in">
              {/* Stats Grid - "Reports" style */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-default-900">Reports</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Attendance Report */}
                  <Card shadow="none" className="border border-default-200 hover:border-primary/50 transition-colors group">
                    <CardBody className="p-0 overflow-hidden flex flex-row h-32">
                      <div className="w-1/3 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
                        <div className="text-center">
                          <span className="text-3xl font-bold text-blue-600 block">{attendanceRate}%</span>
                          <span className="text-xs text-blue-500 font-bold uppercase">Attendance</span>
                        </div>
                      </div>
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                          <h4 className="font-semibold text-default-900 group-hover:text-primary transition-colors">Monthly Attendance</h4>
                          <p className="text-xs text-default-500 mt-1">Present: {monthlyStats.present} | Absent: {monthlyStats.absent}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-default-400">
                          <TrendingUp size={12} />
                          <span>Regular</span>
                          <span className="ml-auto">Last sync: Today</span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Salary Report */}
                  <Card shadow="none" className="border border-default-200 hover:border-success/50 transition-colors group">
                    <CardBody className="p-0 overflow-hidden flex flex-row h-32">
                      <div className="w-1/3 flex items-center justify-center p-4 bg-gradient-to-br from-success-50 to-success-100">
                        <div className="text-center">
                          <span className="text-xl font-bold text-success-600 block">₹{(netSalary / 1000).toFixed(1)}k</span>
                          <span className="text-xs text-success-500 font-bold uppercase">Net Pay</span>
                        </div>
                      </div>
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                          <h4 className="font-semibold text-default-900 group-hover:text-primary transition-colors">Current Earnings</h4>
                          <p className="text-xs text-default-500 mt-1">Based on current month's payroll structure.</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-default-400">
                          <IndianRupee size={12} />
                          <span>Processed</span>
                          <span className="ml-auto">1st of Month</span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {activeTab === "about" && (
            <div className="space-y-4 animate-fade-in">
              <Card shadow="none" className="border border-default-200">
                <CardHeader className="px-4 pt-4 pb-0"><h3 className="text-lg font-bold">Personal Information</h3></CardHeader>
                <CardBody className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                  <InfoItem label="Full Name" value={staff.name} />
                  <InfoItem label="Staff ID" value={staff.id} />
                  <InfoItem label="Date of Birth" value={staff.dateOfBirth} />
                  <InfoItem label="Gender" value={staff.gender} />
                  <InfoItem label="Marital Status" value={staff.maritalStatus} />
                  <InfoItem label="Blood Group" value={staff.bloodGroup} />
                  <InfoItem label="Nationality" value={staff.nationality} />
                  <InfoItem label="Qualification" value={staff.qualification} />
                  <InfoItem label="Experience" value={`${staff.experience || 0} Years`} />
                </CardBody>
              </Card>

              <Card shadow="none" className="border border-default-200">
                <CardHeader className="px-4 pt-4 pb-0"><h3 className="text-lg font-bold">Employment Details</h3></CardHeader>
                <CardBody className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                  <InfoItem label="Role" value={staff.role} />
                  <InfoItem label="Department" value={staff.department} />
                  <InfoItem label="Designation" value={staff.designation} />
                  <InfoItem label="Joining Date" value={staff.joinDate} />
                  <InfoItem label="Employment Status" value={staff.status} />
                  <InfoItem label="Shift" value={staff.shift || "General"} />
                </CardBody>
              </Card>

              <Card shadow="none" className="border border-default-200">
                <CardHeader className="px-4 pt-4 pb-0"><h3 className="text-lg font-bold">Contact Details</h3></CardHeader>
                <CardBody className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                  <InfoItem label="Email" value={staff.email} />
                  <InfoItem label="Phone" value={staff.phone} />
                  <InfoItem label="Address" value={staff.address} className="col-span-full" />
                  <InfoItem label="Emergency Contact" value={staff.emergencyContact} />
                  <InfoItem label="Emergency Phone" value={staff.emergencyPhone} />
                </CardBody>
              </Card>

              <Card shadow="none" className="border border-default-200">
                <CardHeader className="px-4 pt-4 pb-0"><h3 className="text-lg font-bold">Bank Account Details</h3></CardHeader>
                <CardBody className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                  <InfoItem label="Account Holder" value={staff.accountHolder} />
                  <InfoItem label="Account Number" value={staff.accountNumber} />
                  <InfoItem label="Bank Name" value={staff.bankName} />
                  <InfoItem label="IFSC Code" value={staff.ifscCode} />
                  <InfoItem label="PAN Number" value={staff.panNumber} />
                </CardBody>
              </Card>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-4 animate-fade-in">
              <Card shadow="none" className="border border-default-200">
                <CardHeader className="px-6 pt-6 pb-2"><h3 className="text-lg font-bold">Documents</h3></CardHeader>
                <CardBody>
                  <p className="text-default-500 text-sm">No documents uploaded yet.</p>
                </CardBody>
              </Card>
            </div>
          )}

          {activeTab === "payroll" && (
            <div className="space-y-4 animate-fade-in">
              <Card shadow="none" className="border border-default-200">
                <CardHeader className="flex justify-between px-4 pt-4">
                  <h4 className="font-bold text-medium">Payroll History</h4>
                </CardHeader>
                <CardBody>
                  {/* Reuse existing payroll table logic here or simplified view */}
                  <Table aria-label="Payroll History" removeWrapper>
                    <TableHeader>
                      <TableColumn>MONTH</TableColumn>
                      <TableColumn>AMOUNT</TableColumn>
                      <TableColumn>STATUS</TableColumn>
                      <TableColumn>DATE PAID</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {payrollHistory.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{record.month}</TableCell>
                          <TableCell>₹{staffSalary ? (calculateTotals(staffSalary).netSalary).toLocaleString() : 0}</TableCell>
                          <TableCell><Chip size="sm" color="success" variant="flat">Paid</Chip></TableCell>
                          <TableCell>{record.date}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardBody>
              </Card>
            </div>
          )}

        </div>

        {/* Profile Card - Now on Right */}
        <div className="lg:col-span-1 lg:pl-6 lg:border-l-2 lg:border-default-200 space-y-4 sticky top-8">
          <div className="flex flex-col items-start space-y-4">
            <div className="relative group">
              <Avatar
                name={staff.name}
                className="w-32 h-32 text-3xl ring-4 ring-offset-2 ring-default-100 cursor-pointer transition-transform group-hover:scale-105"
                isBordered
                color="primary"
              />
              <div className="absolute bottom-0 right-0 bg-background rounded-full p-1 border border-default-200 shadow-sm cursor-pointer hover:bg-default-100">
                <Edit size={14} className="text-default-600" />
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-default-900 to-default-600">
                {staff?.name || "Staff Member"}
              </h1>
              <p className="text-default-500 font-medium">@{staff?.role?.toLowerCase()?.replace(" ", "_") || "staff"} • {staff?.department || "General"}</p>
            </div>

            <div className="text-sm text-default-600 flex flex-col gap-2 w-full">
              <div className="flex items-center gap-2">
                <Briefcase size={16} className="text-default-400" />
                <span>Joined {staff?.joinDate || "2024"}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-default-400" />
                <span className="truncate">{staff?.address || "No Address"}</span>
              </div>
              {staff?.email && (
                <div className="flex items-center gap-2 group cursor-pointer hover:text-primary transition-colors">
                  <Mail size={16} className="text-default-400 group-hover:text-primary" />
                  <span className="truncate">{staff.email}</span>
                </div>
              )}
            </div>

            <Divider className="my-2" />

            <div className="w-full space-y-3">
              <h3 className="font-semibold text-default-900 text-sm">Teams & Dept</h3>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-default-600 hover:bg-default-100 p-1.5 rounded-lg transition-colors cursor-pointer">
                  <div className="w-6 h-6 rounded-md bg-purple-100 text-purple-600 flex items-center justify-center">
                    <Briefcase size={14} />
                  </div>
                  <span className="font-medium">{staff?.department || "General"} Dept</span>
                </div>
                {staff?.classes && staff.classes.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-default-600 hover:bg-default-100 p-1.5 rounded-lg transition-colors cursor-pointer">
                    <div className="w-6 h-6 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center">
                      <GraduationCap size={14} />
                    </div>
                    <span className="font-medium">Class Teacher: {staff.classes[0]}</span>
                  </div>
                )}
              </div>
            </div>

            <Divider className="my-2" />

            <div className="w-full">
              <Button fullWidth color="primary" variant="flat" startContent={<MessageSquare size={16} />} onPress={onOpen}>Send Message</Button>
            </div>

          </div>
        </div>
      </div>

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

function InfoItem({ label, value, className }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">{label}</span>
      <span className="text-base font-medium text-default-900">{value || "-"}</span>
    </div>
  );
}
