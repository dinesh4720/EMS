import { useState, useMemo, useRef } from "react";
import {
  Card, CardBody, CardHeader, Chip, Progress, Button, Divider, Avatar,
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Tabs, Tab, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Tooltip,
  Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter, Input, Select, SelectItem, Textarea,
  RadioGroup, Radio, Checkbox, cn
} from "@heroui/react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar, IndianRupee, User, Users,
  GraduationCap, FileText, Download, Edit, MessageSquare, Clock,
  CheckCircle, AlertCircle, BookOpen, Award, Upload, TrendingUp, CreditCard, Camera, Save,
  FileCheck, AlertTriangle, Printer, Eye, Plus, X, Check, Heart, Bus, ArrowRight
} from "lucide-react";
import { useApp } from "../../context/AppContext";

const genderOptions = ["Male", "Female", "Other"];
const bloodGroupOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const feeStatusOptions = ["paid", "pending", "overdue"];
const relationships = ["Father", "Mother", "Guardian", "Grandparent", "Uncle", "Aunt", "Other"];
const academicYears = ["2024-25", "2025-26", "2023-24"];
const mediumOptions = ["English", "Hindi", "Regional"];
const houseOptions = ["Red House", "Blue House", "Green House", "Yellow House"];

export default function StudentOverview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getStudentById, getStudentFeeHistory, classesWithTeachers, staff, updateStudent, addFeePayment, loading } = useApp();
  const [activeTab, setActiveTab] = useState("overview");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const [editStep, setEditStep] = useState(1);
  const fileInputRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const student = getStudentById(id);
  const feeHistory = getStudentFeeHistory(id);

  const [editForm, setEditForm] = useState({});
  const [paymentForm, setPaymentForm] = useState({ amount: "7000", month: "", date: new Date().toISOString().split('T')[0] });
  const [complaintForm, setComplaintForm] = useState({ subject: "", description: "" });

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
        parents: student.parents && student.parents.length > 0 ? student.parents.map(p => ({
          name: p.name || "",
          relationship: p.relationship || "Father",
          phone: p.phone || "",
          email: p.email || "",
          occupation: p.occupation || "",
          isWhatsapp: true
        })) : [{
          name: student.parentName || "",
          relationship: student.parentRelationship || "Father",
          phone: student.parentPhone || "",
          email: student.parentEmail || "",
          occupation: student.parentOccupation || "",
          isWhatsapp: true
        }],
        alternatePhone: student.alternatePhone || "",
        // Health & Safety
        medicalConditions: student.medicalConditions || "",
        emergencyContactName: student.emergencyContactName || "",
        emergencyContactPhone: student.emergencyContactPhone || "",
        // Transport & Hostel
        transportRequired: student.transportRequired || false,
        hostelRequired: student.hostelRequired || false,
        // Status
        feeStatus: student.feeStatus || "pending",
        status: student.status || "active"
      });
      setPhotoPreview(student.photo || null);
      setEditStep(1);
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

  const updateEditField = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const updateEditParent = (index, field, value) => {
    const updated = [...editForm.parents];
    updated[index] = { ...updated[index], [field]: value };
    updateEditField("parents", updated);
  };

  const addEditParent = () => {
    if (editForm.parents.length < 3) {
      updateEditField("parents", [...editForm.parents, { name: "", relationship: "Mother", phone: "", email: "", occupation: "", isWhatsapp: true }]);
    }
  };

  const removeEditParent = (index) => {
    if (editForm.parents.length > 1) {
      updateEditField("parents", editForm.parents.filter((_, i) => i !== index));
    }
  };

  const handleSaveEdit = () => {
    // Find the classId from the selected class
    const selectedClass = classesWithTeachers.find(c => `${c.name}-${c.section}` === editForm.class);
    
    const updatedData = {
      name: editForm.fullName,
      admissionId: editForm.admissionId,
      academicYear: editForm.academicYear,
      classId: selectedClass?.id,
      rollNo: editForm.rollNumber ? parseInt(editForm.rollNumber) : null,
      gender: editForm.gender,
      dateOfBirth: editForm.dateOfBirth,
      bloodGroup: editForm.bloodGroup,
      email: editForm.email,
      phone: editForm.mobile,
      address: editForm.address,
      parentName: editForm.parents[0]?.name,
      parentPhone: editForm.parents[0]?.phone,
      parentEmail: editForm.parents[0]?.email,
      parentRelationship: editForm.parents[0]?.relationship,
      parentOccupation: editForm.parents[0]?.occupation,
      parents: editForm.parents,
      aadhaarNumber: editForm.aadhaarNumber,
      nationality: editForm.nationality,
      religion: editForm.religion,
      category: editForm.category,
      motherTongue: editForm.motherTongue,
      previousSchool: editForm.previousSchool,
      tcNumber: editForm.tcNumber,
      mediumOfInstruction: editForm.mediumOfInstruction,
      house: editForm.house,
      transportRequired: editForm.transportRequired,
      hostelRequired: editForm.hostelRequired,
      medicalConditions: editForm.medicalConditions,
      emergencyContactName: editForm.emergencyContactName,
      emergencyContactPhone: editForm.emergencyContactPhone,
      alternatePhone: editForm.alternatePhone,
      photo: editForm.picture,
      feeStatus: editForm.feeStatus,
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

  const classOptions = classesWithTeachers.map(c => `${c.name}-${c.section}`);

  const classInfo = useMemo(() => {
    if (!student || !student.class) return null;
    const [className, section] = student.class.split("-");
    return classesWithTeachers.find(c => c.name === className && c.section === section);
  }, [student, classesWithTeachers]);

  const classTeacher = useMemo(() => {
    if (!classInfo) return null;
    return staff.find(s => s.id === classInfo.classTeacherId);
  }, [classInfo, staff]);

  const attendanceStats = useMemo(() => {
    const workingDays = 22;
    const present = Math.floor(workingDays * 0.9);
    return { present, absent: workingDays - present, total: workingDays, percentage: Math.round((present / workingDays) * 100) };
  }, []);

  // Mock data for dashboard
  const documents = [
    { id: 1, name: "Birth Certificate", type: "pdf", uploadDate: "2024-04-15", status: "verified" },
    { id: 2, name: "Previous School TC", type: "pdf", uploadDate: "2024-04-15", status: "verified" },
    { id: 3, name: "Aadhar Card", type: "pdf", uploadDate: "2024-04-16", status: "pending" },
    { id: 4, name: "Passport Photo", type: "image", uploadDate: "2024-04-15", status: "verified" },
  ];

  const feeStructure = [
    { head: "Tuition Fee", amount: 5000, frequency: "Monthly" },
    { head: "Transport Fee", amount: 2000, frequency: "Monthly" },
    { head: "Lab Fee", amount: 1000, frequency: "Quarterly" },
    { head: "Library Fee", amount: 500, frequency: "Yearly" },
  ];

  const reportCards = [
    { id: 1, exam: "Mid-Term Exam", date: "Oct 2024", percentage: 85, rank: 5, status: "Published" },
    { id: 2, exam: "Unit Test 2", date: "Sep 2024", percentage: 78, rank: 8, status: "Published" },
    { id: 3, exam: "Unit Test 1", date: "Aug 2024", percentage: 82, rank: 6, status: "Published" },
  ];

  const certificates = [
    { id: 1, name: "Character Certificate", status: "Available", date: "2024-04-15" },
    { id: 2, name: "Bonafide Certificate", status: "Available", date: "2024-04-15" },
    { id: 3, name: "Transfer Certificate", status: "Not Issued", date: null },
  ];

  const complaints = [
    { id: 1, subject: "Bus timing issue", date: "2024-12-10", status: "Resolved" },
    { id: 2, subject: "Uniform query", date: "2024-11-25", status: "Pending" },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <div className="w-20 h-20 rounded-full bg-default-100 flex items-center justify-center animate-pulse">
          <GraduationCap size={40} className="text-default-300" />
        </div>
        <h3 className="text-xl font-semibold text-default-700">Loading student data...</h3>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <div className="w-20 h-20 rounded-full bg-default-100 flex items-center justify-center">
          <GraduationCap size={40} className="text-default-300" />
        </div>
        <h3 className="text-xl font-semibold text-default-700">Student not found</h3>
        <p className="text-sm text-default-500">The student you're looking for doesn't exist</p>
        <Button size="sm" variant="flat" color="primary" onPress={() => navigate("/students")} startContent={<ArrowLeft size={16} />} radius="lg">Back to Students</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in pb-8">
      {/* Hero Header */}
      <Card className="shadow-sm border border-default-200 bg-gradient-to-r from-primary-50/50 via-background to-secondary-50/50 overflow-hidden">
        <CardBody className="p-0">
          <div className="relative">
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary rounded-full blur-3xl" />
            </div>
            <div className="relative p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-5">
                  <Button isIconOnly size="sm" variant="flat" onPress={() => navigate("/students")} radius="lg" className="bg-white/80 backdrop-blur"><ArrowLeft size={18} /></Button>
                  <div className="relative">
                    <Avatar src={`https://i.pravatar.cc/150?u=student${student.id}`} className="w-20 h-20 text-2xl ring-4 ring-white shadow-xl" isBordered color="primary" />
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${student.feeStatus === "paid" ? "bg-success" : student.feeStatus === "pending" ? "bg-warning" : "bg-danger"}`}>
                      {student.feeStatus === "paid" ? <CheckCircle size={12} className="text-white" /> : <AlertCircle size={12} className="text-white" />}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-default-800">{student.name}</h2>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Chip size="sm" variant="flat" classNames={{ base: "bg-default-100", content: "font-mono text-xs" }}>{student.admissionId || `ADM${String(student.id).padStart(4, '0')}`}</Chip>
                      <Chip size="sm" variant="flat" color="primary" classNames={{ base: "bg-primary/10", content: "font-semibold" }}>Class {student.class}</Chip>
                      <Chip size="sm" variant="flat" color={student.feeStatus === "paid" ? "success" : student.feeStatus === "pending" ? "warning" : "danger"} startContent={student.feeStatus === "paid" ? <CheckCircle size={12} /> : <Clock size={12} />}>Fee {student.feeStatus}</Chip>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-auto md:ml-0">
                  <Button size="sm" variant="flat" startContent={<Edit size={14} />} radius="lg" className="bg-white/80 backdrop-blur" onPress={openEditDrawer}>Edit</Button>
                  <Button size="sm" color="primary" startContent={<MessageSquare size={14} />} radius="lg" className="shadow-md shadow-primary/25" as="a" href={`tel:${student.parentPhone}`}>Message Parent</Button>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tabs - No Add Student button here */}
      <Tabs selectedKey={activeTab} onSelectionChange={setActiveTab} size="md" variant="underlined" color="primary"
        classNames={{ tabList: "gap-6 border-b border-default-200 px-1", tab: "h-12 px-0", tabContent: "group-data-[selected=true]:font-semibold" }}>
        <Tab key="overview" title={<div className="flex items-center gap-2"><User size={16} />Overview</div>} />
        <Tab key="academics" title={<div className="flex items-center gap-2"><BookOpen size={16} />Academics</div>} />
        <Tab key="fees" title={<div className="flex items-center gap-2"><CreditCard size={16} />Fees</div>} />
        <Tab key="documents" title={<div className="flex items-center gap-2"><FileText size={16} />Documents</div>} />
        <Tab key="complaints" title={<div className="flex items-center gap-2"><AlertTriangle size={16} />Complaints</div>} />
      </Tabs>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <Card className="shadow-sm border border-default-200 overflow-hidden">
              <CardHeader className="py-4 px-5 bg-gradient-to-r from-primary/5 to-transparent border-b border-default-100">
                <div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-xl"><User size={18} className="text-primary" /></div><h3 className="font-semibold">Student Information</h3></div>
              </CardHeader>
              <CardBody className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {[
                    { label: "Full Name", value: student.name },
                    { label: "Admission ID", value: student.admissionId || `ADM${String(student.id).padStart(4, '0')}` },
                    { label: "Class & Section", value: `Class ${student.class}` },
                    { label: "Roll Number", value: student.rollNo ? `#${student.rollNo}` : "Not assigned" },
                    { label: "Gender", value: student.gender || "Not specified" },
                    { label: "Blood Group", value: student.bloodGroup || "Not specified" },
                    { label: "Date of Birth", value: student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : "Not provided" },
                    { label: "Email", value: student.email || "Not provided" },
                    { label: "Address", value: student.address || "Not provided" },
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className="text-[10px] text-default-400 uppercase tracking-wider font-semibold">{item.label}</p>
                      <p className="text-sm font-medium text-default-700">{item.value}</p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card className="shadow-sm border border-default-200 overflow-hidden">
              <CardHeader className="py-4 px-5 bg-gradient-to-r from-secondary/5 to-transparent border-b border-default-100">
                <div className="flex items-center gap-3"><div className="p-2 bg-secondary/10 rounded-xl"><Users size={18} className="text-secondary" /></div><h3 className="font-semibold">Parent / Guardian</h3></div>
              </CardHeader>
              <CardBody className="p-5">
                <div className="flex items-start gap-5">
                  <Avatar name={student.parentName || "P"} size="lg" color="secondary" className="ring-2 ring-secondary/20" />
                  <div className="flex-1 grid grid-cols-2 gap-5">
                    <div className="space-y-1"><p className="text-[10px] text-default-400 uppercase tracking-wider font-semibold">Name</p><p className="text-sm font-medium">{student.parentName || "N/A"}</p></div>
                    <div className="space-y-1"><p className="text-[10px] text-default-400 uppercase tracking-wider font-semibold">Relationship</p><p className="text-sm font-medium">{student.parentRelationship || "Father/Mother"}</p></div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-default-400 uppercase tracking-wider font-semibold">Phone</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium font-mono">{student.parentPhone}</p>
                        <Tooltip content="Call"><Button isIconOnly size="sm" variant="flat" color="success" radius="full" as="a" href={`tel:${student.parentPhone}`}><Phone size={12} /></Button></Tooltip>
                      </div>
                    </div>
                    <div className="space-y-1"><p className="text-[10px] text-default-400 uppercase tracking-wider font-semibold">Email</p><p className="text-sm font-medium">{student.parentEmail || "Not provided"}</p></div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {classTeacher && (
              <Card className="shadow-sm border border-default-200 overflow-hidden">
                <CardHeader className="py-4 px-5 bg-gradient-to-r from-warning/5 to-transparent border-b border-default-100">
                  <div className="flex items-center gap-3"><div className="p-2 bg-warning/10 rounded-xl"><BookOpen size={18} className="text-warning" /></div><h3 className="font-semibold">Class Teacher</h3></div>
                </CardHeader>
                <CardBody className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar src={`https://i.pravatar.cc/150?u=${classTeacher.id}`} size="md" className="ring-2 ring-warning/20" />
                      <div>
                        <p className="font-semibold text-primary hover:underline cursor-pointer" onClick={() => navigate(`/staffs/${classTeacher.id}`)}>{classTeacher.name}</p>
                        <p className="text-xs text-default-500">{classTeacher.department} • {classTeacher.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="flat" startContent={<Phone size={14} />} radius="lg" as="a" href={`tel:${classTeacher.phone}`}>Call</Button>
                      <Button size="sm" variant="flat" startContent={<Mail size={14} />} radius="lg" as="a" href={`mailto:${classTeacher.email}`}>Email</Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>

          <div className="space-y-5">
            <Card className="shadow-sm border border-default-200">
              <CardHeader className="py-3 px-4 border-b border-default-100"><h3 className="font-semibold text-sm">Quick Stats</h3></CardHeader>
              <CardBody className="p-4 space-y-3">
                {[
                  { label: "Attendance", value: `${attendanceStats.percentage}%`, icon: TrendingUp, color: "success", bg: "bg-success-50" },
                  { label: "Class Rank", value: "#5", icon: Award, color: "primary", bg: "bg-primary-50" },
                  { label: "Fee Status", value: student.feeStatus, icon: IndianRupee, color: student.feeStatus === "paid" ? "success" : student.feeStatus === "pending" ? "warning" : "danger", bg: student.feeStatus === "paid" ? "bg-success-50" : student.feeStatus === "pending" ? "bg-warning-50" : "bg-danger-50" },
                ].map((stat, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-3 ${stat.bg} rounded-xl`}>
                    <div><p className="text-[10px] text-default-500 uppercase tracking-wider">{stat.label}</p><p className={`text-xl font-bold text-${stat.color} capitalize`}>{stat.value}</p></div>
                    <stat.icon size={22} className={`text-${stat.color}`} />
                  </div>
                ))}
              </CardBody>
            </Card>

            <Card className="shadow-sm border border-default-200">
              <CardHeader className="py-3 px-4 border-b border-default-100"><h3 className="font-semibold text-sm">Attendance This Month</h3></CardHeader>
              <CardBody className="p-4">
                <div className="text-center p-4 bg-gradient-to-br from-success-100 to-success-50 rounded-2xl mb-4">
                  <p className="text-4xl font-bold text-success">{attendanceStats.percentage}%</p>
                  <p className="text-xs text-default-600 mt-1">Attendance Rate</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-success-50 rounded-xl text-center"><p className="text-xl font-bold text-success">{attendanceStats.present}</p><p className="text-[10px] text-default-500 uppercase">Present</p></div>
                  <div className="p-3 bg-danger-50 rounded-xl text-center"><p className="text-xl font-bold text-danger">{attendanceStats.absent}</p><p className="text-[10px] text-default-500 uppercase">Absent</p></div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* Academics Tab - Report Card, Certificates */}
      {activeTab === "academics" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <Card className="shadow-sm border border-default-200 overflow-hidden">
              <CardHeader className="py-4 px-5 border-b border-default-100">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-xl"><FileCheck size={18} className="text-primary" /></div><h3 className="font-semibold">Report Cards</h3></div>
                  <Chip size="sm" variant="flat" color="primary">2024-25</Chip>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                <Table aria-label="Report cards" removeWrapper radius="none" classNames={{ th: "bg-transparent text-default-500 font-semibold text-xs uppercase tracking-wider h-12 border-b border-default-200", td: "py-4 border-b border-default-100", tr: "hover:bg-default-50/30" }}>
                  <TableHeader>
                    <TableColumn>EXAM</TableColumn>
                    <TableColumn>DATE</TableColumn>
                    <TableColumn>PERCENTAGE</TableColumn>
                    <TableColumn>RANK</TableColumn>
                    <TableColumn>ACTION</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {reportCards.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.exam}</TableCell>
                        <TableCell className="text-default-500">{report.date}</TableCell>
                        <TableCell><Chip size="sm" color={report.percentage >= 80 ? "success" : report.percentage >= 60 ? "warning" : "danger"} variant="flat">{report.percentage}%</Chip></TableCell>
                        <TableCell><span className="font-semibold text-primary">#{report.rank}</span></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Tooltip content="View Report"><Button isIconOnly size="sm" variant="light"><Eye size={14} /></Button></Tooltip>
                            <Tooltip content="Download"><Button isIconOnly size="sm" variant="light"><Download size={14} /></Button></Tooltip>
                            <Tooltip content="Print"><Button isIconOnly size="sm" variant="light"><Printer size={14} /></Button></Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          </div>

          <div className="space-y-5">
            <Card className="shadow-sm border border-default-200">
              <CardHeader className="py-3 px-4 border-b border-default-100"><h3 className="font-semibold text-sm">Certificates</h3></CardHeader>
              <CardBody className="p-4 space-y-3">
                {certificates.map((cert) => (
                  <div key={cert.id} className="flex items-center justify-between p-3 bg-default-50 rounded-xl border border-default-100">
                    <div>
                      <p className="text-sm font-medium">{cert.name}</p>
                      <p className="text-xs text-default-500">{cert.status === "Available" ? `Issued: ${cert.date}` : "Not yet issued"}</p>
                    </div>
                    {cert.status === "Available" ? (
                      <Button size="sm" variant="flat" color="primary" startContent={<Download size={12} />}>Download</Button>
                    ) : (
                      <Chip size="sm" variant="flat" color="default">Not Issued</Chip>
                    )}
                  </div>
                ))}
              </CardBody>
            </Card>

            <Card className="shadow-sm border border-default-200">
              <CardHeader className="py-3 px-4 border-b border-default-100"><h3 className="font-semibold text-sm">Academic Summary</h3></CardHeader>
              <CardBody className="p-4 space-y-3">
                <div className="flex justify-between text-sm"><span className="text-default-500">Overall Percentage</span><span className="font-semibold text-success">82%</span></div>
                <Divider />
                <div className="flex justify-between text-sm"><span className="text-default-500">Class Rank</span><span className="font-semibold text-primary">#5 of 35</span></div>
                <Divider />
                <div className="flex justify-between text-sm"><span className="text-default-500">Best Subject</span><span className="font-semibold">Mathematics</span></div>
                <Divider />
                <div className="flex justify-between text-sm"><span className="text-default-500">Needs Improvement</span><span className="font-semibold text-warning">Hindi</span></div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* Fees Tab */}
      {activeTab === "fees" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <Card className="shadow-sm border border-default-200 overflow-hidden">
              <CardHeader className="py-4 px-5 border-b border-default-100">
                <div className="flex items-center justify-between w-full"><h3 className="font-semibold">Fee Structure</h3><Chip size="sm" variant="flat" color="primary">2024-25</Chip></div>
              </CardHeader>
              <CardBody className="p-0">
                <Table aria-label="Fee structure" removeWrapper radius="none" classNames={{ th: "bg-transparent text-default-500 font-semibold text-xs uppercase tracking-wider h-12 border-b border-default-200", td: "py-4 border-b border-default-100", tr: "hover:bg-default-50/30" }}>
                  <TableHeader>
                    <TableColumn>FEE HEAD</TableColumn>
                    <TableColumn>AMOUNT</TableColumn>
                    <TableColumn>FREQUENCY</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {feeStructure.map((fee, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{fee.head}</TableCell>
                        <TableCell className="font-semibold text-primary">₹{fee.amount.toLocaleString()}</TableCell>
                        <TableCell><Chip size="sm" variant="flat" classNames={{ base: "bg-default-100" }}>{fee.frequency}</Chip></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="p-4 border-t border-default-100 bg-gradient-to-r from-primary-50/50 to-transparent flex justify-between items-center">
                  <span className="font-semibold">Total Monthly</span><span className="text-xl font-bold text-primary">₹7,000</span>
                </div>
              </CardBody>
            </Card>

            <Card className="shadow-sm border border-default-200 overflow-hidden">
              <CardHeader className="py-4 px-5 border-b border-default-100">
                <div className="flex items-center justify-between w-full"><h3 className="font-semibold">Payment History</h3><Button size="sm" variant="flat" startContent={<Download size={14} />} radius="lg">Download</Button></div>
              </CardHeader>
              <CardBody className="p-0">
                {feeHistory.length > 0 ? (
                  <Table aria-label="Payments" removeWrapper radius="none" classNames={{ th: "bg-transparent text-default-500 font-semibold text-xs uppercase tracking-wider h-12 border-b border-default-200", td: "py-4 border-b border-default-100", tr: "hover:bg-default-50/30" }}>
                    <TableHeader>
                      <TableColumn>DATE</TableColumn>
                      <TableColumn>MONTH</TableColumn>
                      <TableColumn>AMOUNT</TableColumn>
                      <TableColumn>STATUS</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {feeHistory.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{new Date(p.date).toLocaleDateString()}</TableCell>
                          <TableCell>{p.month}</TableCell>
                          <TableCell className="font-semibold">₹{p.amount.toLocaleString()}</TableCell>
                          <TableCell><Chip size="sm" color="success" variant="flat" startContent={<CheckCircle size={12} />}>Paid</Chip></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-12 text-center"><IndianRupee size={40} className="mx-auto mb-3 text-default-200" /><p className="text-default-500">No payment records</p></div>
                )}
              </CardBody>
            </Card>
          </div>

          <Card className="shadow-sm border border-default-200 h-fit">
            <CardHeader className="py-3 px-4 border-b border-default-100"><h3 className="font-semibold text-sm">Fee Summary</h3></CardHeader>
            <CardBody className="p-4 space-y-4">
              <div className={`p-5 rounded-2xl text-center ${student.feeStatus === "paid" ? "bg-gradient-to-br from-success-100 to-success-50" : student.feeStatus === "pending" ? "bg-gradient-to-br from-warning-100 to-warning-50" : "bg-gradient-to-br from-danger-100 to-danger-50"}`}>
                <p className="text-xs text-default-600 mb-1">Current Status</p>
                <p className={`text-3xl font-bold capitalize ${student.feeStatus === "paid" ? "text-success" : student.feeStatus === "pending" ? "text-warning" : "text-danger"}`}>{student.feeStatus}</p>
              </div>
              <Divider />
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-default-500">Total Paid</span><span className="font-semibold text-success">₹{feeHistory.reduce((a, p) => a + p.amount, 0).toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-default-500">Pending</span><span className="font-semibold text-danger">₹{student.feeStatus !== "paid" ? "7,000" : "0"}</span></div>
              </div>
              {student.feeStatus !== "paid" && <Button color="primary" className="w-full shadow-md shadow-primary/25" startContent={<IndianRupee size={16} />} radius="lg" onPress={() => setIsPaymentOpen(true)}>Record Payment</Button>}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === "documents" && (
        <Card className="shadow-sm border border-default-200">
          <CardHeader className="py-4 px-5 border-b border-default-100">
            <div className="flex items-center justify-between w-full"><h3 className="font-semibold">Student Documents</h3><Button size="sm" color="primary" startContent={<Upload size={14} />}>Upload New</Button></div>
          </CardHeader>
          <CardBody className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="group p-4 rounded-lg border border-default-200 hover:border-primary transition-colors cursor-pointer bg-default-50 hover:bg-default-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-primary-100 rounded-lg text-primary-600"><FileText size={20} /></div>
                    <Chip size="sm" variant="flat" color={doc.status === "verified" ? "success" : "warning"}>{doc.status}</Chip>
                  </div>
                  <h5 className="font-medium text-sm truncate" title={doc.name}>{doc.name}</h5>
                  <p className="text-xs text-default-500 mt-1">Uploaded: {doc.uploadDate}</p>
                  <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="flat" className="flex-1"><Eye size={12} /> View</Button>
                    <Button size="sm" variant="flat" className="flex-1"><Download size={12} /> Download</Button>
                  </div>
                </div>
              ))}
              <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-dashed border-default-300 text-default-400 hover:border-primary hover:text-primary transition-colors cursor-pointer min-h-[150px]">
                <Upload size={24} className="mb-2" /><span className="text-sm font-medium">Upload Document</span>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Complaints Tab */}
      {activeTab === "complaints" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <Card className="shadow-sm border border-default-200">
              <CardHeader className="py-4 px-5 border-b border-default-100">
                <div className="flex items-center justify-between w-full"><h3 className="font-semibold">Complaints & Queries</h3><Button size="sm" color="primary" startContent={<AlertTriangle size={14} />} onPress={() => setIsComplaintOpen(true)}>Raise Complaint</Button></div>
              </CardHeader>
              <CardBody className="p-0">
                {complaints.length > 0 ? (
                  <Table aria-label="Complaints" removeWrapper radius="none" classNames={{ th: "bg-transparent text-default-500 font-semibold text-xs uppercase tracking-wider h-12 border-b border-default-200", td: "py-4 border-b border-default-100", tr: "hover:bg-default-50/30" }}>
                    <TableHeader>
                      <TableColumn>SUBJECT</TableColumn>
                      <TableColumn>DATE</TableColumn>
                      <TableColumn>STATUS</TableColumn>
                      <TableColumn>ACTION</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {complaints.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.subject}</TableCell>
                          <TableCell className="text-default-500">{c.date}</TableCell>
                          <TableCell><Chip size="sm" color={c.status === "Resolved" ? "success" : "warning"} variant="flat">{c.status}</Chip></TableCell>
                          <TableCell><Button size="sm" variant="light">View Details</Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-12 text-center"><AlertTriangle size={40} className="mx-auto mb-3 text-default-200" /><p className="text-default-500">No complaints raised</p></div>
                )}
              </CardBody>
            </Card>
          </div>
          <Card className="shadow-sm border border-default-200 h-fit">
            <CardHeader className="py-3 px-4 border-b border-default-100"><h3 className="font-semibold text-sm">Quick Actions</h3></CardHeader>
            <CardBody className="p-4 space-y-2">
              <Button variant="flat" className="w-full justify-start" startContent={<MessageSquare size={14} />}>Contact Class Teacher</Button>
              <Button variant="flat" className="w-full justify-start" startContent={<Phone size={14} />}>Call School Office</Button>
              <Button variant="flat" className="w-full justify-start" startContent={<Mail size={14} />}>Email Administration</Button>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Edit Drawer */}
      <Drawer isOpen={isEditOpen} onOpenChange={setIsEditOpen} placement="right" size="md" classNames={{ base: "m-2 rounded-xl shadow-xl h-[calc(100%-1rem)]", backdrop: "bg-black/40 backdrop-blur-sm" }}>
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="flex flex-col gap-1 border-b border-default-100 pb-4">
                <div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-xl"><Edit size={20} className="text-primary" /></div><div><h3 className="text-lg font-semibold">Edit Student</h3><p className="text-xs text-default-500">Update student information</p></div></div>
              </DrawerHeader>
              <DrawerBody className="py-6">
                <div className="space-y-6">
                  <div className="flex flex-col items-center">
                    <div className="relative group">
                      <Avatar src={photoPreview || `https://i.pravatar.cc/150?u=student${student.id}`} className="w-24 h-24 text-2xl ring-4 ring-primary/20" isBordered color="primary" showFallback fallback={<Camera size={32} className="text-default-400" />} />
                      <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" className="hidden" />
                      <Button isIconOnly size="sm" color="primary" radius="full" className="absolute -bottom-1 -right-1 shadow-md" onPress={() => fileInputRef.current?.click()}><Camera size={14} /></Button>
                    </div>
                  </div>
                  <Divider />
                  <div className="space-y-4">
                    <Input size="sm" label="Full Name" value={editForm.name} onValueChange={(v) => setEditForm({ ...editForm, name: v })} variant="bordered" radius="lg" />
                    <Input size="sm" label="Admission ID" value={editForm.admissionId} onValueChange={(v) => setEditForm({ ...editForm, admissionId: v })} variant="bordered" radius="lg" />
                    <div className="grid grid-cols-2 gap-3">
                      <Select size="sm" label="Class" selectedKeys={editForm.class ? new Set([editForm.class]) : new Set()} onSelectionChange={(keys) => setEditForm({ ...editForm, class: Array.from(keys)[0] || "" })} variant="bordered" radius="lg">
                        {classOptions.map(c => <SelectItem key={c}>Class {c}</SelectItem>)}
                      </Select>
                      <Input size="sm" type="number" label="Roll No" value={editForm.rollNo} onValueChange={(v) => setEditForm({ ...editForm, rollNo: v })} variant="bordered" radius="lg" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Select size="sm" label="Gender" selectedKeys={editForm.gender ? new Set([editForm.gender]) : new Set()} onSelectionChange={(keys) => setEditForm({ ...editForm, gender: Array.from(keys)[0] || "" })} variant="bordered" radius="lg">
                        {genderOptions.map(g => <SelectItem key={g}>{g}</SelectItem>)}
                      </Select>
                      <Select size="sm" label="Blood Group" selectedKeys={editForm.bloodGroup ? new Set([editForm.bloodGroup]) : new Set()} onSelectionChange={(keys) => setEditForm({ ...editForm, bloodGroup: Array.from(keys)[0] || "" })} variant="bordered" radius="lg">
                        {bloodGroupOptions.map(b => <SelectItem key={b}>{b}</SelectItem>)}
                      </Select>
                    </div>
                    <Input size="sm" type="date" label="Date of Birth" value={editForm.dateOfBirth} onValueChange={(v) => setEditForm({ ...editForm, dateOfBirth: v })} variant="bordered" radius="lg" />
                    <Input size="sm" label="Email" value={editForm.email} onValueChange={(v) => setEditForm({ ...editForm, email: v })} variant="bordered" radius="lg" />
                    <Input size="sm" label="Address" value={editForm.address} onValueChange={(v) => setEditForm({ ...editForm, address: v })} variant="bordered" radius="lg" />
                    <Divider />
                    <Input size="sm" label="Parent Name" value={editForm.parentName} onValueChange={(v) => setEditForm({ ...editForm, parentName: v })} variant="bordered" radius="lg" />
                    <Input size="sm" label="Parent Phone" value={editForm.parentPhone} onValueChange={(v) => setEditForm({ ...editForm, parentPhone: v })} variant="bordered" radius="lg" />
                    <Input size="sm" label="Parent Email" value={editForm.parentEmail} onValueChange={(v) => setEditForm({ ...editForm, parentEmail: v })} variant="bordered" radius="lg" />
                  </div>
                </div>
              </DrawerBody>
              <DrawerFooter className="border-t border-default-100 pt-4">
                <Button variant="flat" onPress={() => setIsEditOpen(false)} radius="lg">Cancel</Button>
                <Button color="primary" onPress={handleSaveEdit} radius="lg" startContent={<Save size={14} />}>Save Changes</Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>

      {/* Payment Modal */}
      <Modal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)}>
        <ModalContent>
          <ModalHeader>Record Fee Payment</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input label="Amount" type="number" value={paymentForm.amount} onValueChange={(v) => setPaymentForm({ ...paymentForm, amount: v })} startContent="₹" variant="bordered" />
              <Select label="Month" placeholder="Select month" selectedKeys={paymentForm.month ? [paymentForm.month] : []} onSelectionChange={(keys) => setPaymentForm({ ...paymentForm, month: Array.from(keys)[0] })} variant="bordered">
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => <SelectItem key={m}>{m}</SelectItem>)}
              </Select>
              <Input label="Date" type="date" value={paymentForm.date} onValueChange={(v) => setPaymentForm({ ...paymentForm, date: v })} variant="bordered" />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setIsPaymentOpen(false)}>Cancel</Button>
            <Button color="primary" onPress={handleRecordPayment}>Record Payment</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Complaint Modal */}
      <Modal isOpen={isComplaintOpen} onClose={() => setIsComplaintOpen(false)}>
        <ModalContent>
          <ModalHeader>Raise a Complaint</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input label="Subject" placeholder="Brief subject of complaint" value={complaintForm.subject} onValueChange={(v) => setComplaintForm({ ...complaintForm, subject: v })} variant="bordered" />
              <Textarea label="Description" placeholder="Describe your complaint in detail" value={complaintForm.description} onValueChange={(v) => setComplaintForm({ ...complaintForm, description: v })} variant="bordered" minRows={4} />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setIsComplaintOpen(false)}>Cancel</Button>
            <Button color="primary" onPress={() => { setIsComplaintOpen(false); setComplaintForm({ subject: "", description: "" }); }}>Submit Complaint</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
