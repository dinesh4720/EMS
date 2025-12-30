import { useState, useMemo, useRef } from "react";
import {
  Card, CardBody, CardHeader, Chip, Progress, Button, Divider, Avatar,
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Tabs, Tab, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure,
  Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter, Input, Select, SelectItem, Textarea,
  RadioGroup, Radio, Checkbox, cn, Tooltip
} from "@heroui/react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar, IndianRupee, User, Users,
  GraduationCap, FileText, Download, Edit, MessageSquare, Clock,
  CheckCircle, AlertCircle, BookOpen, Award, Upload, TrendingUp, CreditCard, Camera, Save,
  FileCheck, AlertTriangle, Printer, Eye, Plus, X, Check, Heart, Bus, ArrowRight,
  Globe, Twitter, Linkedin, Github, MoreHorizontal, FolderPlus, CalendarCheck, XCircle
} from "lucide-react";
import { useApp } from "../../context/AppContext";

const genderOptions = ["Male", "Female", "Other"];
const bloodGroupOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const feeStatusOptions = ["paid", "pending", "overdue"];
const academicYears = ["2024-25", "2025-26", "2023-24"];

export default function StudentOverview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getStudentById, getStudentFeeHistory, classesWithTeachers, staff, updateStudent, addFeePayment, loading } = useApp();
  const [activeTab, setActiveTab] = useState("overview");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isFeeStatusOpen, setIsFeeStatusOpen] = useState(false);
  const [isParentAppOpen, setIsParentAppOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const student = getStudentById(id);
  const feeHistory = getStudentFeeHistory(id);

  const [editForm, setEditForm] = useState({});
  const [paymentForm, setPaymentForm] = useState({ amount: "7000", month: "", date: new Date().toISOString().split('T')[0] });
  const [complaintForm, setComplaintForm] = useState({ subject: "", description: "" });

  // New States
  const [isRemarkOpen, setIsRemarkOpen] = useState(false);
  const [isExamConfigOpen, setIsExamConfigOpen] = useState(false);
  const [isRegularizeOpen, setIsRegularizeOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  const openEditDrawer = () => {
    if (student) {
      setEditForm({
        // Personal Information
        fullName: student.name || "",
        admissionId: student.admissionId || "",
        academicYear: student.academicYear || "2024-25",
        dateOfBirth: student.dateOfBirth || "",
        gender: student.gender || "Male",
        picture: student.photo || null,
        aadhaarNumber: student.aadhaarNumber || "",
        bloodGroup: student.bloodGroup || "",
        nationality: student.nationality || "",
        religion: student.religion || "",
        category: student.category || "",
        motherTongue: student.motherTongue || "",
        previousSchool: student.previousSchool || "",
        tcNumber: student.tcNumber || "",
        // Class Info
        class: student.class || "",
        rollNumber: student.rollNo?.toString() || "",
        mediumOfInstruction: student.mediumOfInstruction || "",
        house: student.house || "",
        // Contact
        mobile: student.phone || "",
        email: student.email || "",
        address: student.address || "",
        // Parents
        parentName: student.parentName || "",
        parentPhone: student.parentPhone || "",
        parentEmail: student.parentEmail || "",
        parents: student.parents || [],
        // Status
        feeStatus: student.feeStatus || "pending",
        status: student.status || "active"
      });
      setPhotoPreview(student.photo || null);
      setIsEditOpen(true);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setPhotoPreview(reader.result); setEditForm({ ...editForm, picture: reader.result }); };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEdit = () => {
    const selectedClass = (classesWithTeachers || []).find(c => `${c.name}-${c.section}` === editForm.class);

    const updatedData = {
      ...student,
      name: editForm.fullName,
      admissionId: editForm.admissionId,
      classId: selectedClass?.id,
      rollNo: editForm.rollNumber ? parseInt(editForm.rollNumber) : null,
      gender: editForm.gender,
      dateOfBirth: editForm.dateOfBirth,
      bloodGroup: editForm.bloodGroup,
      email: editForm.email,
      phone: editForm.mobile,
      address: editForm.address,
      parentName: editForm.parentName,
      parentPhone: editForm.parentPhone,
      parentEmail: editForm.parentEmail,
      photo: editForm.picture,
      status: editForm.status
    };
    updateStudent(id, updatedData);
    setIsEditOpen(false);
  };

  const handleRecordPayment = () => {
    if (!paymentForm.month || !paymentForm.amount) return;
    addFeePayment({ studentId: id, amount: parseInt(paymentForm.amount), month: paymentForm.month, date: paymentForm.date, status: "paid" });
    setIsPaymentOpen(false);
    setPaymentForm({ amount: "7000", month: "", date: new Date().toISOString().split('T')[0] });
  };

  const classOptions = (classesWithTeachers || []).map(c => `${c.name}-${c.section}`);

  const classInfo = useMemo(() => {
    if (!student || !student.class) return null;
    const parts = student.class.split("-");
    const className = parts[0];
    const section = parts[1]; // might be undefined logic check
    return (classesWithTeachers || []).find(c => c.name === className && c.section === section);
  }, [student, classesWithTeachers]);

  const classTeacher = useMemo(() => {
    if (!classInfo) return null;
    return (staff || []).find(s => s.id === classInfo.classTeacherId);
  }, [classInfo, staff]);

  const attendanceStats = useMemo(() => {
    const workingDays = 22;
    const present = Math.floor(workingDays * 0.9);
    return { present, absent: workingDays - present, total: workingDays, percentage: Math.round((present / workingDays) * 100) };
  }, []);

  if (loading) return <div className="p-8 text-center text-default-500">Loading profile...</div>;
  if (!student) return <div className="p-8 text-center text-default-500">Student not found</div>;

  const awardIcon = Award;

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in p-6 lg:p-8 pb-12">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

        {/* Main Content - Left Side */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header with Back Icon and Title - Moved Inside */}
          <div className="mb-6">
            <Button
              variant="light"
              onPress={() => navigate('/students')}
              className="text-default-500 hover:text-default-900 pl-0 mb-2"
              size="sm"
              startContent={<ArrowLeft size={18} />}
            >
              Back to Students
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-default-900">Student Profile</h1>
            </div>
          </div>
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={setActiveTab}
            size="lg"
            color="primary"
            variant="solid"
            classNames={{
              tabList: "gap-1 p-1.5 bg-default-100/50 rounded-2xl border border-default-200 mb-6",
              cursor: "bg-background rounded-xl shadow-sm ring-1 ring-black/5",
              tab: "px-6 h-10 transition-all",
              tabContent: "group-data-[selected=true]:text-default-900 group-data-[selected=true]:font-semibold text-default-500 font-medium"
            }}
          >
            <Tab key="overview" title="Overview" />
            <Tab key="student_info" title="Student Info" />
            <Tab key="academics" title="Academics" />
            <Tab key="fees" title="Fees" />
            <Tab key="remarks" title="Remarks" />
          </Tabs>

          {activeTab === "overview" && (
            <div className="space-y-8 animate-fade-in">
              {/* Reports Section with Premium Cards */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-default-900">Performance Overview</h3>
                  <span className="text-sm text-default-500">Last updated today</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Attendance Card */}
                  <Card isPressable onPress={() => setIsAttendanceOpen(true)} shadow="sm" className="border border-default-200 bg-background/60 backdrop-blur-md">
                    <CardBody className="p-6">
                      <div className="flex items-start justify-between mb-4 w-full">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                          <Clock size={24} />
                        </div>
                        <Chip size="sm" color="primary" variant="flat" className="text-xs font-semibold">92% Target</Chip>
                      </div>
                      <div className="space-y-1 text-left">
                        <h4 className="text-2xl font-semibold text-default-900">{attendanceStats.percentage}%</h4>
                        <p className="text-sm font-medium text-default-500">Monthly Attendance</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-default-100 flex items-center justify-between text-xs text-default-400 w-full">
                        <span>24 Days Present</span>
                        <span>2 Days Leave</span>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Fee Status Card */}
                  <Card isPressable onPress={() => setIsFeeStatusOpen(true)} shadow="sm" className="border border-default-200 bg-background/60 backdrop-blur-md">
                    <CardBody className="p-6">
                      <div className="flex items-start justify-between mb-4 w-full">
                        <div className={`p-3 rounded-xl ${student.feeStatus === "paid" ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}>
                          <IndianRupee size={24} />
                        </div>
                        <Chip size="sm" color={student.feeStatus === "paid" ? "success" : "warning"} variant="flat" className="capitalize text-xs font-semibold">
                          {student.feeStatus}
                        </Chip>
                      </div>
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2">
                          <h4 className="text-2xl font-semibold text-default-900 capitalize">{student.feeStatus}</h4>
                        </div>
                        <p className="text-sm font-medium text-default-500">Fee Payment Status</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-default-100 flex items-center justify-between text-xs text-default-400 w-full">
                        <span>Next Due: 5th Oct</span>
                        <span className="text-primary hover:underline">Pay Now</span>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Parent App Card */}
                  <Card isPressable onPress={() => setIsParentAppOpen(true)} shadow="sm" className="border border-default-200 bg-background/60 backdrop-blur-md">
                    <CardBody className="p-6">
                      <div className="flex items-start justify-between mb-4 w-full">
                        <div className="p-3 bg-fuchsia-50 text-fuchsia-600 rounded-xl">
                          <Phone size={24} />
                        </div>
                        <Chip size="sm" color="success" variant="flat" className="text-xs font-semibold">Active</Chip>
                      </div>
                      <div className="space-y-1 text-left">
                        <h4 className="text-2xl font-bold text-default-900">Connected</h4>
                        <p className="text-sm font-medium text-default-500">Parent App Status</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-default-100 flex items-center justify-between text-xs text-default-400 w-full">
                        <span>Last Login: Today</span>
                        <span>iOS Device</span>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {activeTab === "student_info" && (
            <div className="space-y-6 animate-fade-in">
              {/* Personal Information */}
              <Card shadow="none" className="border border-default-200">
                <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-default-900">Personal Information</h3>
                  <Button isIconOnly size="sm" variant="light" onPress={() => openEditDrawer("personal")}><Edit size={16} className="text-default-500" /></Button>
                </CardHeader>
                <CardBody className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6">
                  <InfoItem label="Full Name" value={student.name} />
                  <InfoItem label="Admission ID" value={student.admissionId} />
                  <InfoItem label="Date of Birth" value={student.dateOfBirth} />
                  <InfoItem label="Gender" value={student.gender} />
                  <InfoItem label="Blood Group" value={student.bloodGroup} />
                  <InfoItem label="Religion" value={student.religion} />
                  <InfoItem label="Category" value={student.category} />
                  <InfoItem label="Mother Tongue" value={student.motherTongue} />
                  <InfoItem label="Aadhaar Number" value={student.aadhaarNumber} />
                  <InfoItem label="Nationality" value={student.nationality} />
                </CardBody>
              </Card>

              <Card shadow="none" className="border border-default-200">
                <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-default-900">Contact Details</h3>
                  <Button isIconOnly size="sm" variant="light" onPress={() => openEditDrawer("contact")}><Edit size={16} className="text-default-500" /></Button>
                </CardHeader>
                <CardBody className="p-8 grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-6">
                  <InfoItem label="Address" value={student.address} className="col-span-full" />
                  <InfoItem label="City" value={student.city} />
                  <InfoItem label="State" value={student.state} />
                  <InfoItem label="ZIP Code" value={student.zipCode} />
                  <InfoItem label="Phone" value={student.phone} />
                  <InfoItem label="Email" value={student.email} />
                </CardBody>
              </Card>

              <Card shadow="none" className="border border-default-200">
                <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-default-900">Parent / Guardian</h3>
                  <Button isIconOnly size="sm" variant="light" onPress={() => openEditDrawer("parents")}><Edit size={16} className="text-default-500" /></Button>
                </CardHeader>
                <CardBody className="p-8 grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-6">
                  <InfoItem label="Father's Name" value={student.parentName} />
                  <InfoItem label="Father's Occupation" value={student.parentOccupation} />
                  <InfoItem label="Mother's Name" value={student.motherName} />
                  <InfoItem label="Mother's Occupation" value={student.motherOccupation} />
                  <InfoItem label="Primary Phone" value={student.parentPhone} />
                  <InfoItem label="Primary Email" value={student.parentEmail} />
                </CardBody>
              </Card>

              <Card shadow="none" className="border border-default-200">
                <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-default-900">Previous Education</h3>
                  <Button isIconOnly size="sm" variant="light" onPress={() => openEditDrawer("education")}><Edit size={16} className="text-default-500" /></Button>
                </CardHeader>
                <CardBody className="p-8 grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-6">
                  <InfoItem label="School Name" value={student.previousSchool} />
                  <InfoItem label="TC Number" value={student.tcNumber} />
                </CardBody>
              </Card>

              <Card shadow="none" className="border border-default-200">
                <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-default-900">Additional Information</h3>
                  <Button isIconOnly size="sm" variant="light" onPress={() => openEditDrawer("additional")}><Edit size={16} className="text-default-500" /></Button>
                </CardHeader>
                <CardBody className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6">
                  <InfoItem label="Academic Year" value={student.academicYear || "2024-25"} />
                  <InfoItem label="Medium of Instruction" value={student.mediumOfInstruction || "English"} />
                  <InfoItem label="House" value={student.house || "Not Assigned"} />
                  <InfoItem label="Transport Required" value={student.transportRequired ? "Yes" : "No"} />
                  <InfoItem label="Hostel Required" value={student.hostelRequired ? "Yes" : "No"} />
                  <InfoItem label="Medical Conditions" value={student.medicalConditions || "None"} className="col-span-full" />
                  <InfoItem label="Emergency Contact Name" value={student.emergencyContactName || "-"} />
                  <InfoItem label="Emergency Contact Phone" value={student.emergencyContactPhone || "-"} />
                </CardBody>
              </Card>

              {/* Documents Section */}
              <Card shadow="none" className="border border-default-200">
                <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-default-900">Documents</h3>
                  <div className="flex gap-2">
                    <span className="text-sm text-default-500 self-center">0 documents</span>
                    <Button size="sm" color="primary" variant="flat" startContent={<Upload size={16} />}>Upload New</Button>
                  </div>
                </CardHeader>
                <CardBody className="p-6">
                  {/* If no documents, show empty state, else show list */}
                  <div className="text-center py-12 border-2 border-dashed border-default-200 rounded-xl bg-default-50/50 hover:bg-default-100/50 transition-colors cursor-pointer group">
                    <div className="inline-flex p-4 bg-white rounded-full mb-4 ring-1 ring-default-200 shadow-sm group-hover:scale-110 transition-transform">
                      <FolderPlus size={32} className="text-primary" />
                    </div>
                    <h4 className="font-semibold text-default-900 mb-1">No documents uploaded yet</h4>
                    <p className="text-sm text-default-500 max-w-xs mx-auto">Upload birth certificate, transfer certificate, or other essential documents.</p>
                    <Button className="mt-4" size="sm" color="primary" variant="ghost">Browse Files</Button>
                  </div>
                </CardBody>
              </Card>

            </div>
          )}

          {activeTab === "fees" && (
            <div className="space-y-6 animate-fade-in">
              {/* Fee Hero Section */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-primary-900 to-primary-800 text-white shadow-lg relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="space-y-2 text-center md:text-left">
                    <p className="text-primary-100 font-medium">Total Outstanding</p>
                    <h2 className="text-4xl font-bold">₹19,666</h2>
                    <p className="text-xs text-primary-200 bg-primary-700/50 px-3 py-1 rounded-full inline-block">Next Due: 5th Oct 2024</p>
                  </div>
                  <div className="flex gap-3">
                    <Button color="success" className="font-semibold shadow-xl" size="lg" onPress={() => setIsPaymentOpen(true)} startContent={<CreditCard size={20} />}>Pay Now</Button>
                    <Button variant="bordered" className="text-white border-white/30 hover:bg-white/10" size="lg" startContent={<Download size={20} />}>Invoice</Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Fee Heads Status */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-default-900">Fee Breakdown</h3>
                  <div className="space-y-4">
                    {[{ head: "Tuition Fee", total: 45000, paid: 25000, color: "primary" }, { head: "Transport Fee", total: 12000, paid: 4000, color: "warning" }, { head: "Library Fee", total: 2000, paid: 2000, color: "success" }].map((fee, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-default-200 bg-white shadow-none">
                        <div className="flex justify-between mb-2">
                          <span className="font-semibold text-default-700">{fee.head}</span>
                          <span className="text-sm font-medium text-default-500">₹{fee.paid} / ₹{fee.total}</span>
                        </div>
                        <Progress value={(fee.paid / fee.total) * 100} color={fee.color} size="sm" radius="full" />
                        <div className="mt-2 text-xs text-default-400 text-right">
                          {(fee.paid / fee.total) * 100}% Paid
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-default-900">Recent Transactions</h3>
                    <Button size="sm" variant="light" color="primary">View All</Button>
                  </div>
                  <div className="space-y-0 border border-default-200 rounded-xl divide-y divide-default-100 bg-white shadow-none h-fit">
                    {feeHistory.slice(0, 4).map((fee) => (
                      <div key={fee.id} className="flex justify-between items-center p-4 hover:bg-default-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-success-50 text-success rounded-lg"><CheckCircle size={16} /></div>
                          <div>
                            <p className="font-semibold text-sm text-default-900">Payment for {fee.month}</p>
                            <p className="text-xs text-default-500">{fee.date}</p>
                          </div>
                        </div>
                        <span className="font-semibold text-default-900">₹{fee.amount}</span>
                      </div>
                    ))}
                    <div className="p-2 text-center">
                      <Button size="sm" variant="light" className="text-default-400">No more recent history</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "remarks" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-default-900">Recent Remarks & Notes</h3>
                <Button size="sm" color="primary" variant="flat" startContent={<Plus size={16} />} onPress={() => setIsRemarkOpen(true)}>Add Note</Button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="group flex flex-col sm:flex-row gap-4 p-5 rounded-2xl border border-default-200 bg-white hover:border-primary/30 hover:shadow-sm transition-all hover:bg-default-50/50">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <MessageSquare size={20} />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-default-900">Excellent participation in class</h4>
                        <p className="text-sm text-default-500 mt-0.5">Academic • Teacher A</p>
                      </div>
                      <Chip size="sm" variant="flat" className="bg-default-100 text-default-600">Dec 20</Chip>
                    </div>
                    <p className="text-sm text-default-600 leading-relaxed">
                      Student shows great enthusiasm and actively participates in discussions. Consistently asks insightful questions.
                    </p>
                  </div>
                </div>

                <div className="group flex flex-col sm:flex-row gap-4 p-5 rounded-2xl border border-default-200 bg-white hover:border-warning/30 hover:shadow-sm transition-all hover:bg-default-50/50">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                      <AlertCircle size={20} />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-default-900">Needs improvement in homework</h4>
                        <p className="text-sm text-default-500 mt-0.5">Behavioral • Teacher B</p>
                      </div>
                      <Chip size="sm" variant="flat" className="bg-default-100 text-default-600">Dec 18</Chip>
                    </div>
                    <p className="text-sm text-default-600 leading-relaxed">
                      Homework submission has been irregular this week. Please ensure daily monitoring.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}



          {activeTab === "academics" && (
            <div className="space-y-6 animate-fade-in">
              <Card shadow="none" className="border border-default-200">
                <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100"><h3 className="text-lg font-semibold text-default-900">Current Academic Status</h3></CardHeader>
                <CardBody className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6">
                  <InfoItem label="Class" value={student.class || "N/A"} />
                  <InfoItem label="Roll Number" value={student.rollNo || "N/A"} />
                  <InfoItem label="Academic Year" value={student.academicYear || "2024-25"} />
                  <InfoItem label="Class Teacher" value={classTeacher?.name || "Not Assigned"} />
                  <InfoItem label="Medium" value={student.mediumOfInstruction || "English"} />
                  <InfoItem label="House" value={student.house || "Not Assigned"} />
                </CardBody>
              </Card>

              {/* Exam Performance - Cards Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-default-900">Exam Overview</h3>
                  <Select size="sm" placeholder="Select Term" className="w-32" variant="bordered" defaultSelectedKeys={["term1"]}>
                    <SelectItem key="term1">Term 1</SelectItem>
                    <SelectItem key="term2">Term 2</SelectItem>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Exam Cards */}
                  {[{ name: "Unit Test 1", date: "Aug 2024", status: "Published", score: "88%" }, { name: "Half Yearly", date: "Sept 2024", status: "Pending", score: "-" }, { name: "Unit Test 2", date: "Nov 2024", status: "Scheduled", score: "-" }].map((exam, i) => (
                    <Card key={i} isPressable onPress={() => { setSelectedExam(exam); setIsExamConfigOpen(true); }} shadow="none" className="border border-default-200 hover:border-primary hover:bg-primary-50/10 transition-colors">
                      <CardBody className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-2.5 bg-default-100 rounded-lg text-default-600">
                            <FileText size={20} />
                          </div>
                          <Chip size="sm" color={exam.status === "Published" ? "success" : exam.status === "Pending" ? "warning" : "default"} variant="flat">{exam.status}</Chip>
                        </div>
                        <h4 className="text-lg font-semibold text-default-900 mb-1">{exam.name}</h4>
                        <p className="text-xs text-default-500 mb-4">{exam.date}</p>
                        <div className="flex items-center justify-between text-sm pt-4 border-t border-default-100">
                          <span className="text-default-500">Score</span>
                          <span className="font-bold text-default-900">{exam.score}</span>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Attendance Summary */}
              <Card shadow="none" className="border border-default-200">
                <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-default-900">Attendance Summary</h3>
                  <Button size="sm" variant="flat" color="warning" startContent={<Clock size={16} />} onPress={() => setIsRegularizeOpen(true)}>Regularize Attendance</Button>
                </CardHeader>
                <CardBody className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="text-center p-6 bg-primary-50/50 rounded-2xl border border-primary-100">
                      <div className="text-4xl font-semibold text-primary mb-2">{attendanceStats.percentage}%</div>
                      <div className="text-sm font-medium text-default-600 uppercase tracking-wider">Overall</div>
                    </div>
                    {/* ... other stats same styling ... */}
                    <div className="text-center p-6 bg-success-50/50 rounded-2xl border border-success-100">
                      <div className="text-4xl font-semibold text-success-600 mb-2">{attendanceStats.present}</div>
                      <div className="text-sm font-medium text-default-600 uppercase tracking-wider">Present</div>
                    </div>
                    <div className="text-center p-6 bg-danger-50/50 rounded-2xl border border-danger-100">
                      <div className="text-4xl font-semibold text-danger-600 mb-2">{attendanceStats.absent}</div>
                      <div className="text-sm font-medium text-default-600 uppercase tracking-wider">Absent</div>
                    </div>
                    <div className="text-center p-6 bg-default-100/50 rounded-2xl border border-default-200">
                      <div className="text-4xl font-semibold text-default-700 mb-2">{attendanceStats.total}</div>
                      <div className="text-sm font-medium text-default-600 uppercase tracking-wider">Total Days</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Attendance Progress</span>
                      <span className="text-primary">{attendanceStats.percentage}%</span>
                    </div>
                    <Progress value={attendanceStats.percentage} color="primary" size="md" radius="lg" classNames={{ track: "bg-default-100", indicator: "bg-primary" }} />
                    <p className="text-xs text-default-400 text-center pt-2">Based on current academic session records</p>
                  </div>
                </CardBody>
              </Card>


              {/* Progress Reports */}
              <Card shadow="sm" className="border border-default-200">
                <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100"><h3 className="text-lg font-semibold text-default-900">Progress Reports & Remarks</h3></CardHeader>
                <CardBody className="p-8 space-y-6">
                  <div className="p-6 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={18} className="text-blue-600" />
                      <h4 className="font-semibold text-blue-900">Teacher Comments</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-blue-800/80 list-disc list-inside pl-2">
                      <li>Shows excellent understanding of concepts</li>
                      <li>Active participation in class discussions</li>
                      <li>Needs to improve time management for assignments</li>
                    </ul>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-success-50/50 rounded-xl border border-success-100 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-success-100 rounded-full"><Plus size={14} className="text-success-700" /></div>
                        <h4 className="font-semibold text-success-900">Strengths</h4>
                      </div>
                      <p className="text-sm text-success-800/80 leading-relaxed">Problem-solving, Analytical thinking, Team collaboration in science projects.</p>
                    </div>
                    <div className="p-6 bg-warning-50/50 rounded-xl border border-warning-100 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-warning-100 rounded-full"><AlertCircle size={14} className="text-warning-700" /></div>
                        <h4 className="font-semibold text-warning-900">Areas to Improve</h4>
                      </div>
                      <p className="text-sm text-warning-800/80 leading-relaxed">Handwriting legibility, Consistent homework completion, Time management during exams.</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          )
          }
        </div >

        <div className="lg:col-span-1 space-y-6 sticky top-0 lg:h-screen lg:overflow-y-auto no-scrollbar lg:pl-8 lg:border-l lg:border-default-200 animate-fade-in pt-2">
          <div className="space-y-6">

            {/* Profile Header */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-4">
              <div className="relative group">
                <Avatar
                  src={student.photo || `https://i.pravatar.cc/150?u=student${student.id}`}
                  className="w-32 h-32 text-4xl ring-4 ring-white shadow-lg cursor-pointer transition-transform group-hover:scale-105"
                />
                <div className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md cursor-pointer hover:bg-default-50 border border-default-100 transition-colors" onClick={openEditDrawer}>
                  <Edit size={16} className="text-default-700" />
                </div>
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-default-900">{student.name}</h1>
                <p className="text-default-500 font-medium">@{student.admissionId || "Student"}</p>
              </div>

              <div className="flex flex-wrap justify-center lg:justify-start gap-2 w-full">
                <Chip variant="flat" size="sm" startContent={<GraduationCap size={14} />}>Class {student.class || "N/A"}</Chip>
                <Chip variant="flat" size="sm" startContent={<User size={14} />}>Roll No. {student.rollNo || "N/A"}</Chip>
              </div>
            </div>

            <Divider className="opacity-50" />

            {/* Personal Details - Added Extra Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-default-900 uppercase tracking-wider">Student Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-default-50 rounded-xl border border-default-100">
                  <span className="text-xs text-default-500 block mb-1">Date of Birth</span>
                  <span className="font-medium text-default-900 text-sm">{student.dateOfBirth || "-"}</span>
                </div>
                <div className="p-3 bg-default-50 rounded-xl border border-default-100">
                  <span className="text-xs text-default-500 block mb-1">Blood Group</span>
                  <span className="font-medium text-default-900 text-sm">{student.bloodGroup || "-"}</span>
                </div>
                <div className="p-3 bg-default-50 rounded-xl border border-default-100">
                  <span className="text-xs text-default-500 block mb-1">House</span>
                  <span className="font-medium text-default-900 text-sm">{student.house || "-"}</span>
                </div>
                <div className="p-3 bg-default-50 rounded-xl border border-default-100">
                  <span className="text-xs text-default-500 block mb-1">Gender</span>
                  <span className="font-medium text-default-900 text-sm">{student.gender || "-"}</span>
                </div>
              </div>
            </div>

            <Divider className="opacity-50" />

            {/* Contact Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-default-900 uppercase tracking-wider">Contact Info</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm text-default-600">
                  <MapPin size={18} className="text-default-400 mt-0.5 shrink-0" />
                  <span className="leading-snug">{student.address || "No Address Provided"}</span>
                </div>
                {student.email && (
                  <div className="flex items-center gap-3 text-sm text-default-600 group cursor-pointer hover:text-primary transition-colors">
                    <Mail size={18} className="text-default-400 group-hover:text-primary mt-0.5 shrink-0" />
                    <span className="truncate">{student.email}</span>
                  </div>
                )}
                {student.phone && (
                  <div className="flex items-center gap-3 text-sm text-default-600 group cursor-pointer hover:text-primary transition-colors">
                    <Phone size={18} className="text-default-400 group-hover:text-primary mt-0.5 shrink-0" />
                    <span className="truncate">{student.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <Divider className="opacity-50" />

            {/* Guardians */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-default-900 uppercase tracking-wider">Guardians</h4>
              <div className="space-y-3">
                {student.parentName && (
                  <div className="flex items-center gap-3 p-2 bg-default-50 rounded-xl border border-default-100">
                    <Avatar className="w-10 h-10" showFallback src={`https://i.pravatar.cc/150?u=${student.parentName}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-default-900 truncate">{student.parentName}</div>
                      <div className="text-xs text-default-500">{student.parentRelationship || "Guardian"}</div>
                    </div>
                    <div className="flex gap-1">
                      <Button isIconOnly size="sm" variant="light" radius="full" as="a" href={`tel:${student.parentPhone}`}><Phone size={16} className="text-default-500" /></Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-4">
              <Button fullWidth color="primary" variant="shadow" className="font-semibold" onPress={openEditDrawer} startContent={<Edit size={16} />}>
                Edit Profile
              </Button>
            </div>

          </div>
        </div>
      </div >

      {/* Edit Drawer */}
      < Drawer isOpen={isEditOpen} onOpenChange={setIsEditOpen} placement="right" size="md" classNames={{ base: "m-2 rounded-xl shadow-xl h-[calc(100%-1rem)]", backdrop: "bg-black/40 backdrop-blur-sm" }}>
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="flex flex-col gap-1 border-b border-default-100 pb-4">
                <div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-xl"><Edit size={20} className="text-primary" /></div><div><h3 className="text-lg font-semibold">Edit Student</h3><p className="text-xs text-default-500">Update student information</p></div></div>
              </DrawerHeader>
              <DrawerBody className="py-6">
                {/* ... Edit Fields ... */}
                <div className="space-y-4">
                  <Input size="sm" label="Full Name" value={editForm.fullName} onValueChange={(v) => setEditForm({ ...editForm, fullName: v })} variant="bordered" radius="lg" />
                  <Input size="sm" label="Phone" value={editForm.mobile} onValueChange={(v) => setEditForm({ ...editForm, mobile: v })} variant="bordered" radius="lg" />
                  {/* Add other fields as needed */}
                </div>
              </DrawerBody>
              <DrawerFooter>
                <Button variant="flat" onPress={onClose}>Cancel</Button>
                <Button color="primary" onPress={handleSaveEdit}>Save Changes</Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer >

      {/* Payment Modal */}
      {/* Side Drawers for Detail Cards */}
      <Drawer isOpen={isAttendanceOpen} onOpenChange={setIsAttendanceOpen} placement="right" size="sm" classNames={{ base: "m-2 rounded-xl shadow-xl h-[calc(100%-1rem)]" }}>
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="border-b border-default-100"><h3 className="text-lg font-semibold">Attendance Details</h3></DrawerHeader>
              <DrawerBody className="p-6">
                <div className="space-y-6">
                  <div className="text-center p-6 bg-primary-50 rounded-2xl"><div className="text-4xl font-bold text-primary">{attendanceStats.percentage}%</div><div className="text-sm text-primary-600">Overall Attendance</div></div>
                  <div><h4 className="font-medium mb-3">Attendance History</h4><p className="text-sm text-default-500">Detailed calendar view and log will be here.</p></div>
                </div>
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>

      <Drawer isOpen={isFeeStatusOpen} onOpenChange={setIsFeeStatusOpen} placement="right" size="sm" classNames={{ base: "m-2 rounded-xl shadow-xl h-[calc(100%-1rem)]" }}>
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="border-b border-default-100"><h3 className="text-lg font-semibold">Fee Details</h3></DrawerHeader>
              <DrawerBody className="p-6">
                <div className="space-y-6">
                  <div className="p-4 border border-warning-200 bg-warning-50 rounded-xl"><h4 className="text-warning-700 font-semibold mb-1">Payment Due</h4><p className="text-2xl font-bold text-warning-800">₹19,666</p><p className="text-xs text-warning-600">Due Date: Oct 5, 2024</p></div>
                  <Button color="primary" fullWidth onPress={() => { onClose(); setActiveTab("fees"); }}>View Full Fee Structure</Button>
                </div>
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>

      <Drawer isOpen={isParentAppOpen} onOpenChange={setIsParentAppOpen} placement="right" size="sm" classNames={{ base: "m-2 rounded-xl shadow-xl h-[calc(100%-1rem)]" }}>
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="border-b border-default-100"><h3 className="text-lg font-semibold">Parent App</h3></DrawerHeader>
              <DrawerBody className="p-6">
                <div className="flex items-center gap-4 mb-6"><div className="p-3 bg-success-50 rounded-full text-success"><Phone size={24} /></div><div><h4 className="font-bold">Connected</h4><p className="text-sm text-default-500">Active since Aug 2024</p></div></div>
                <div className="space-y-4"><div className="flex justify-between border-b border-default-100 pb-2"><span className="text-default-500">Last Login</span><span>Today, 10:30 AM</span></div><div className="flex justify-between border-b border-default-100 pb-2"><span className="text-default-500">Device</span><span>iPhone 14 Pro</span></div></div>
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>

    </Modal >

  {/* Add Remark Drawer */ }
  < Drawer isOpen={isRemarkOpen} onOpenChange={setIsRemarkOpen} placement="right" size="sm" classNames={{ base: "m-2 rounded-xl shadow-xl h-[calc(100%-1rem)]" }}>
    <DrawerContent>
      {(onClose) => (
        <>
          <DrawerHeader className="border-b border-default-100"><h3 className="text-lg font-semibold">Add Remark</h3></DrawerHeader>
          <DrawerBody className="p-6 space-y-6">
            <Select label="Remark Type" placeholder="Select type" variant="bordered">
              <SelectItem key="academic">Academic</SelectItem>
              <SelectItem key="behavioral">Behavioral</SelectItem>
              <SelectItem key="achievement">Achievement</SelectItem>
            </Select>
            <Input label="Title" placeholder="e.g. Excellent Performance" variant="bordered" />
            <Textarea label="Description" placeholder="Enter detailed remark..." minRows={4} variant="bordered" />
            <Checkbox defaultSelected>Visible to Parent</Checkbox>
          </DrawerBody>
          <DrawerFooter>
            <Button variant="flat" onPress={onClose}>Cancel</Button>
            <Button color="primary" onPress={onClose}>Save Remark</Button>
          </DrawerFooter>
        </>
      )}
    </DrawerContent>
  </Drawer >

  {/* Regularize Attendance Drawer */ }
  < Drawer isOpen={isRegularizeOpen} onOpenChange={setIsRegularizeOpen} placement="right" size="md" classNames={{ base: "m-2 rounded-xl shadow-xl h-[calc(100%-1rem)]" }}>
    <DrawerContent>
      {(onClose) => (
        <>
          <DrawerHeader className="border-b border-default-100"><h3 className="text-lg font-semibold">Regularize Attendance</h3></DrawerHeader>
          <DrawerBody className="p-0">
            <div className="p-6 bg-warning-50/50 border-b border-warning-100">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-warning-600" size={24} />
                <div>
                  <h4 className="font-semibold text-warning-900">Unaccounted Absences</h4>
                  <p className="text-sm text-warning-700">Select days to mark as present or add reason.</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {["Oct 12, 2024", "Oct 15, 2024", "Oct 18, 2024"].map((date, i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-default-200 rounded-xl">
                  <div className="flex items-center gap-4">
                    <Checkbox />
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-default-100 rounded-lg text-default-500"><CalendarCheck size={20} /></div>
                      <span className="font-medium text-default-900">{date}</span>
                    </div>
                  </div>
                  <Select size="sm" placeholder="Select Reason" className="w-40" variant="bordered">
                    <SelectItem key="sick">Sick Leave</SelectItem>
                    <SelectItem key="personal">Personal</SelectItem>
                    <SelectItem key="official">Official Duty</SelectItem>
                  </Select>
                </div>
              ))}
            </div>
          </DrawerBody>
          <DrawerFooter>
            <Button variant="flat" onPress={onClose}>Cancel</Button>
            <Button color="primary" onPress={onClose}>Update Attendance</Button>
          </DrawerFooter>
        </>
      )}
    </DrawerContent>
  </Drawer >

  {/* Exam Details Drawer */ }
  < Drawer isOpen={isExamConfigOpen} onOpenChange={setIsExamConfigOpen} placement="right" size="md" classNames={{ base: "m-2 rounded-xl shadow-xl h-[calc(100%-1rem)]" }}>
    <DrawerContent>
      {(onClose) => (
        <>
          <DrawerHeader className="border-b border-default-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary"><FileText size={20} /></div>
              <div>
                <h3 className="text-lg font-semibold">{selectedExam?.name || "Exam Details"}</h3>
                <p className="text-xs text-default-500">{selectedExam?.date}</p>
              </div>
            </div>
          </DrawerHeader>
          <DrawerBody className="p-0">
            <div className="p-6 grid grid-cols-2 gap-4 bg-default-50 border-b border-default-200">
              <div className="p-4 bg-white rounded-xl border border-default-200 text-center">
                <span className="text-xs text-default-500 uppercase">Total Score</span>
                <div className="text-2xl font-bold text-default-900 mt-1">{selectedExam?.score || "-"}</div>
              </div>
              <div className="p-4 bg-white rounded-xl border border-default-200 text-center">
                <span className="text-xs text-default-500 uppercase">Rank</span>
                <div className="text-2xl font-bold text-primary mt-1">#5</div>
              </div>
            </div>
            <div className="p-6">
              <h4 className="font-semibold text-default-900 mb-4">Subject-wise Performance</h4>
              <div className="space-y-4">
                {[{ sub: "Mathematics", score: 88 }, { sub: "Science", score: 92 }, { sub: "English", score: 85 }].map((s, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-32 font-medium text-sm">{s.sub}</div>
                    <Progress value={s.score} color={s.score > 90 ? "success" : "primary"} size="sm" className="max-w-xs" />
                    <div className="font-semibold text-sm">{s.score}/100</div>
                  </div>
                ))}
              </div>
            </div>
          </DrawerBody>
          <DrawerFooter>
            <Button variant="light" onPress={onClose}>Close</Button>
            <Button color="primary" startContent={<Download size={16} />}>Download Report</Button>
          </DrawerFooter>
        </>
      )}
    </DrawerContent>
  </Drawer >

    </div >
  );
}


function AtomIcon({ size, ...props }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="1" />
      <path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z" />
      <path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z" />
    </svg>
  )
}

function InfoItem({ label, value, className }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">{label}</span>
      <span className="text-base font-medium text-default-900">{value || "-"}</span>
    </div>
  );
}

