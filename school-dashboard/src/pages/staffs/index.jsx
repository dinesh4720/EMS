import { useState, useRef, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Button, Drawer, DrawerContent, DrawerHeader, DrawerBody, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { Plus, X, Mail, Phone, Send, UserPlus, FileText, CheckCircle2, ChevronDown, Briefcase, CalendarDays, BookOpen } from "lucide-react";
import StaffList from "./StaffList";
import StaffAttendance from "./StaffAttendance";
import StaffAttendanceRegularize from "./StaffAttendanceRegularize";
import StaffPayroll from "./StaffPayroll";
import StaffDashboard from "./StaffDashboard";
import AddStaff from "./AddStaff";
import BulkSubjectAssignment from "./BulkSubjectAssignment";
import FormInput from "../../components/FormInput";
import { useApp } from "../../context/AppContext";
import { intakeFormsApi, classesApi } from "../../services/api";
import toast from "react-hot-toast";
import { PageLayout, MinimalButton } from "../../components/ui";

export default function StaffsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addStaff, updateStaff, staff } = useApp();
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [shouldRenderAddStaff, setShouldRenderAddStaff] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [isFormSelectModalOpen, setIsFormSelectModalOpen] = useState(false);
  const [availableForms, setAvailableForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [isSendingForm, setIsSendingForm] = useState(false);
  const [isFormDropdownOpen, setIsFormDropdownOpen] = useState(false);
  const formDropdownRef = useRef(null);
  const addStaffRef = useRef(null);

  useEffect(() => {
    if (location.state?.editStaffId) {
      const staffId = location.state.editStaffId;
      setEditingStaffId(staffId);
      setShouldRenderAddStaff(true);
      requestAnimationFrame(() => setIsAddStaffOpen(true));
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (formDropdownRef.current && !formDropdownRef.current.contains(event.target)) {
        setIsFormDropdownOpen(false);
      }
    };
    if (isFormDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFormDropdownOpen]);

  const handleOpenStaffProfile = (staffId) => navigate(`/staffs/${staffId}`);

  const handleEditStaff = (staffId) => {
    setEditingStaffId(staffId);
    setShouldRenderAddStaff(true);
    requestAnimationFrame(() => setIsAddStaffOpen(true));
  };

  const getEditingStaff = () => {
    if (!editingStaffId) return null;
    return staff.find(s => s.id === editingStaffId || s._id === editingStaffId);
  };

  const activeTab = location.pathname.includes("/staffs/") && location.pathname !== "/staffs/attendance" && location.pathname !== "/staffs/payroll" && location.pathname !== "/staffs/bulk-subjects" && location.pathname !== "/staffs" && location.pathname !== "/staffs/"
    ? "profile"
    : (location.pathname === "/staffs/attendance" ? "overview" : location.pathname === "/staffs/payroll" ? "payroll" : location.pathname === "/staffs/bulk-subjects" ? "subjects" : "list");

  const isProfileView = location.pathname !== "/staffs" && location.pathname !== "/staffs/" && location.pathname !== "/staffs/attendance" && location.pathname !== "/staffs/payroll" && location.pathname !== "/staffs/bulk-subjects" && !location.pathname.endsWith("/staffs");
  const isRegularizeView = location.pathname.includes("/attendance/regularize");

  const handleSaveStaff = async (staffData) => {
    // Normalize role: send as array to match Mongoose schema [String]
    const roleArray = Array.isArray(staffData.staffType) ? staffData.staffType : (staffData.staffType ? [staffData.staffType] : []);

    const transformedData = {
      name: staffData.fullName,
      role: roleArray,
      department: staffData.department || "General",
      phone: staffData.mobile,
      email: staffData.email,
      status: "active",
      address: staffData.address,
      // Only set joinDate for new staff; preserve original on edit
      ...(editingStaffId ? {} : { joinDate: new Date().toISOString().split('T')[0] }),
      dob: staffData.dob,
      gender: staffData.gender,
      fatherName: staffData.fatherName,
      bloodGroup: staffData.bloodGroup,
      maritalStatus: staffData.maritalStatus,
      employmentType: staffData.employmentType,
      emergencyContacts: staffData.emergencyContacts,
      emergencyContact: staffData.emergencyContacts?.[0]?.name || '',
      emergencyPhone: staffData.emergencyContacts?.[0]?.phone || '',
      isWhatsapp: staffData.isWhatsapp,
      whatsappNumber: staffData.isWhatsapp ? staffData.mobile : staffData.whatsappNumber,
      picture: staffData.picture,
      idDocuments: staffData.idDocuments,
      professionalQualifications: staffData.professionalQualifications,
      totalExperience: staffData.totalExperience,
      previousOrganization: staffData.previousOrganization,
      roleInOrganization: staffData.roleInOrganization,
      qualificationDocs: staffData.qualificationDocs,
      customDocuments: staffData.customDocuments,
      staffNumber: staffData.staffNumber,
      staffType: staffData.staffType,
      assignedClasses: staffData.assignedClasses || [],
      isClassTeacher: staffData.isClassTeacher,
      classTeacherOf: staffData.classTeacherOf,
      accountNumber: staffData.accountNumber,
      ifscCode: staffData.ifscCode,
      bankName: staffData.bankName,
      branchName: staffData.branchName,
      salaryTemplate: staffData.salaryTemplate,
      salaryBreakdown: staffData.salaryBreakdown,
      salary: staffData.salary || 0,
    };

    try {
      const returnPath = location.state?.returnTo;
      let savedStaff;
      if (editingStaffId) {
        savedStaff = await updateStaff(editingStaffId, transformedData);
        toast.success('Staff member updated successfully!');
      } else {
        savedStaff = await addStaff(transformedData);
        toast.success('Staff member added successfully!');
      }

      // Assign class teacher if isClassTeacher is enabled and a class is selected
      if (staffData.isClassTeacher && staffData.classTeacherOf) {
        const staffId = editingStaffId || savedStaff?._id || savedStaff?.id;
        if (staffId) {
          try {
            await classesApi.updateClassTeacher(staffData.classTeacherOf, staffId);
            toast.success('Class teacher assigned successfully!');
          } catch (ctError) {
            console.error('Failed to assign class teacher:', ctError);
            toast.error(ctError.message || 'Failed to assign class teacher. The staff was saved but class assignment failed.');
          }
        }
      }

      // For new staff, return the saved staff so AddStaff can show the timetable modal
      // AddStaff will call onClose when it's done (after timetable modal is dismissed)
      if (!editingStaffId && savedStaff) {
        return savedStaff;
      }

      // For edits, close the drawer immediately
      setIsAddStaffOpen(false);
      setEditingStaffId(null);
      setTimeout(() => setShouldRenderAddStaff(false), 300);
      if (returnPath) navigate(returnPath);
      return savedStaff;
    } catch (err) {
      console.error('Failed to save staff:', err);
      toast.error(editingStaffId ? 'Failed to update staff member' : 'Failed to add staff member');
      throw err;
    }
  };

  const handleOpenAddStaff = () => {
    setEditingStaffId(null);
    setIsMethodModalOpen(true);
  };

  const handleSelectMethod = (method) => {
    setIsMethodModalOpen(false);
    if (method === 'full') {
      setShouldRenderAddStaff(true);
      requestAnimationFrame(() => setIsAddStaffOpen(true));
    } else if (method === 'form') {
      loadAvailableForms();
    }
  };

  const loadAvailableForms = async () => {
    try {
      const forms = await intakeFormsApi.getAll();
      const staffForms = forms.filter(f => f.formType === 'staff' && f.status === 'active');
      setAvailableForms(staffForms);
      setIsFormSelectModalOpen(true);
    } catch (error) {
      toast.error('Failed to load forms');
      console.error(error);
    }
  };

  const handleSendForm = async () => {
    if (!selectedForm) {
      toast.error('Please select a form');
      return;
    }
    if (!recipientEmail && !recipientPhone) {
      toast.error('Please enter email or phone number');
      return;
    }
    setIsSendingForm(true);
    try {
      const emails = recipientEmail ? [recipientEmail] : [];
      const phones = recipientPhone ? [recipientPhone] : [];
      await intakeFormsApi.assign(selectedForm, { emails, phones, expiresInDays: 30, assignedBy: null });
      toast.success('Form sent successfully!');
      setIsFormSelectModalOpen(false);
      setSelectedForm(null);
      setRecipientEmail('');
      setRecipientPhone('');
    } catch (error) {
      console.error('Form send error:', error);
      toast.error(error.message || 'Failed to send form');
    } finally {
      setIsSendingForm(false);
    }
  };

  const handleCloseAddStaff = () => {
    setIsAddStaffOpen(false);
    setEditingStaffId(null);
    setTimeout(() => setShouldRenderAddStaff(false), 300);
    if (location.state?.returnTo) navigate(location.state.returnTo);
  };

  const tabHeaderInfo = {
    list: { title: "All Staff", description: "Manage staff members and roles" },
    overview: { title: "Staff Attendance", description: "Track attendance and statistics" },
    payroll: { title: "Staff Salary & Payroll", description: "Manage salaries and payments" },
    subjects: { title: "Subject Assignments", description: "Assign subjects and classes to teachers" }
  };

  const tabs = [
    { key: "list", title: "All Staff" },
    { key: "subjects", title: "Subjects" },
    { key: "overview", title: "Attendance" },
    { key: "payroll", title: "Payroll" }
  ];

  const handleTabChange = (key) => {
    if (key === "list") navigate("/staffs");
    else if (key === "payroll") navigate("/staffs/payroll");
    else if (key === "overview") navigate("/staffs/attendance");
    else if (key === "subjects") navigate("/staffs/bulk-subjects");
  };

  if (isProfileView || isRegularizeView) {
    return (
      <div className="space-y-6 animate-fade-in pb-8">
        <Routes>
          <Route path=":id" element={<StaffDashboard />} />
          <Route path="attendance/regularize" element={<StaffAttendanceRegularize />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <PageLayout
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        header={tabHeaderInfo[activeTab]}
        actions={
          activeTab === "list" ? (
            <MinimalButton icon={<Plus size={16} />} onClick={handleOpenAddStaff}>Create Staff</MinimalButton>
          ) : activeTab === "overview" ? (
            <MinimalButton icon={<CalendarDays size={16} />} onClick={() => navigate("/staffs/attendance/regularize")}>Regularize</MinimalButton>
          ) : null
        }
      >
        <div className="min-h-[500px]">
          <Routes>
            <Route index element={<StaffList onStaffClick={handleOpenStaffProfile} onStaffEdit={handleEditStaff} />} />
            <Route path="list" element={<StaffList onStaffClick={handleOpenStaffProfile} onStaffEdit={handleEditStaff} />} />
            <Route path="bulk-subjects" element={<BulkSubjectAssignment />} />
            <Route path="attendance" element={<StaffAttendance onStaffClick={handleOpenStaffProfile} />} />
            <Route path="attendance/regularize" element={<StaffAttendanceRegularize />} />
            <Route path="payroll" element={<StaffPayroll onStaffClick={handleOpenStaffProfile} />} />
            <Route path=":id" element={<StaffDashboard />} />
          </Routes>
        </div>
      </PageLayout>

      {/* Add Staff Drawer */}
      {shouldRenderAddStaff && (
        <Drawer
          isOpen={isAddStaffOpen}
          onOpenChange={(open) => {
            if (!open) {
              if (addStaffRef.current) addStaffRef.current.attemptClose();
              else if (window.staffDrawerCloseHandler) {
                const canClose = window.staffDrawerCloseHandler();
                if (!canClose) return;
              }
              handleCloseAddStaff();
            }
          }}
          placement="right"
          hideCloseButton
          classNames={{ wrapper: "justify-end", base: "w-[720px] max-w-[95vw]", backdrop: "bg-black/30" }}
        >
          <DrawerContent>
            {(onClose) => (
              <>
                <DrawerHeader className="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Briefcase size={20} className="text-gray-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">{editingStaffId ? 'Edit Staff Member' : 'Create New Staff'}</h2>
                      <p className="text-xs text-gray-500">{editingStaffId ? 'Update staff details' : 'Fill in the staff details below'}</p>
                    </div>
                  </div>
                  <Button isIconOnly size="sm" variant="light" onPress={() => {
                    if (addStaffRef.current) addStaffRef.current.attemptClose();
                    else if (window.staffDrawerCloseHandler) window.staffDrawerCloseHandler();
                    else handleCloseAddStaff();
                  }}>
                    <X size={20} className="text-gray-400" />
                  </Button>
                </DrawerHeader>
                <DrawerBody className="p-0 overflow-hidden">
                  <AddStaff ref={addStaffRef} onClose={handleCloseAddStaff} onSave={handleSaveStaff} editingStaff={getEditingStaff()} />
                </DrawerBody>
              </>
            )}
          </DrawerContent>
        </Drawer>
      )}

      {/* Method Selection Modal */}
      <Modal isOpen={isMethodModalOpen} onClose={() => setIsMethodModalOpen(false)} size="2xl" classNames={{ backdrop: "bg-black/30", base: "bg-white" }}>
        <ModalContent>
          <ModalHeader className="border-b border-gray-100 py-4">
            <h3 className="text-lg font-medium">Choose Registration Method</h3>
            <p className="text-sm text-gray-500 font-normal mt-1">Select how to add the new staff member</p>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={() => handleSelectMethod('form')} className="p-6 rounded-lg border border-gray-200 hover:border-gray-400 transition-colors text-left">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <Send size={24} className="text-gray-600" />
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-gray-900 mb-2">Send Filling Form</h4>
                    <p className="text-sm text-gray-500">Send an intake form for them to fill out</p>
                  </div>
                </div>
              </button>
              <button onClick={() => handleSelectMethod('full')} className="p-6 rounded-lg border border-gray-200 hover:border-gray-400 transition-colors text-left">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <UserPlus size={24} className="text-gray-600" />
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-gray-900 mb-2">Full Registration</h4>
                    <p className="text-sm text-gray-500">Fill out all staff details directly</p>
                  </div>
                </div>
              </button>
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-gray-100">
            <Button variant="light" onPress={() => setIsMethodModalOpen(false)}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Form Selection Modal */}
      <Modal isOpen={isFormSelectModalOpen} onClose={() => { setIsFormSelectModalOpen(false); setSelectedForm(null); setRecipientEmail(''); setRecipientPhone(''); }} size="2xl" classNames={{ backdrop: "bg-black/30", base: "bg-white" }}>
        <ModalContent>
          <ModalHeader className="border-b border-gray-100 py-4">
            <h3 className="text-lg font-medium">Send Intake Form</h3>
            <p className="text-sm text-gray-500 font-normal mt-1">Select a form and enter recipient details</p>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="space-y-4">
              <div className="relative" ref={formDropdownRef}>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Select Form</label>
                <button type="button" onClick={() => setIsFormDropdownOpen(!isFormDropdownOpen)} className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                  {selectedForm ? (
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-gray-500" />
                      <span className="text-sm">{availableForms.find(f => f.id === selectedForm)?.formName}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Choose an intake form</span>
                  )}
                  <ChevronDown size={18} className={`text-gray-400 transition-transform ${isFormDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isFormDropdownOpen && availableForms.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg max-h-[320px] overflow-y-auto">
                    <div className="p-2">
                      {availableForms.map((form) => (
                        <button key={form.id} type="button" onClick={() => { setSelectedForm(form.id); setIsFormDropdownOpen(false); }} className={`w-full p-3 rounded-lg text-left flex items-center gap-3 ${selectedForm === form.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
                          <FileText size={18} className="text-gray-500" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{form.formName}</p>
                            <p className="text-xs text-gray-500">{form.fields?.length || 0} fields</p>
                          </div>
                          {selectedForm === form.id && <CheckCircle2 size={16} className="text-gray-600" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {availableForms.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No active staff forms available.</p>
                  <Button size="sm" variant="flat" className="mt-2" onPress={() => { setIsFormSelectModalOpen(false); navigate('/settings/intake-forms'); }}>Create a Form</Button>
                </div>
              )}
              <FormInput label="Email" type="email" placeholder="Enter email address" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} startContent={<Mail size={18} />} />
              <FormInput label="Phone Number" type="tel" placeholder="Enter phone number" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} startContent={<Phone size={18} />} />
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">The recipient will receive a link to fill out the form.</p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-gray-100">
            <Button variant="light" onPress={() => { setIsFormSelectModalOpen(false); setSelectedForm(null); setRecipientEmail(''); setRecipientPhone(''); }}>Cancel</Button>
            <Button color="primary" onPress={handleSendForm} isLoading={isSendingForm} isDisabled={!selectedForm || (!recipientEmail && !recipientPhone)} startContent={!isSendingForm && <Send size={16} />}>Send Form</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
