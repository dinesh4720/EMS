import { useState, useRef, useEffect } from "react";
import logger from "../../utils/logger";
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
import { useTranslation } from 'react-i18next';

export default function StaffsPage() {
  const { t } = useTranslation();
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

  // Handle backdrop click for unsaved changes check
  useEffect(() => {
    if (!isAddStaffOpen) return;
    const handleBackdropClick = (e) => {
      const backdrop = e.target.closest('[data-slot="backdrop"]') || (e.target.getAttribute?.('data-slot') === 'backdrop' ? e.target : null);
      if (backdrop) {
        if (addStaffRef.current) addStaffRef.current.attemptClose();
        else handleCloseAddStaff();
      }
    };
    document.addEventListener('click', handleBackdropClick, true);
    return () => document.removeEventListener('click', handleBackdropClick, true);
  }, [isAddStaffOpen]);

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
      name: staffData.name,
      role: roleArray,
      department: staffData.department || "General",
      phone: staffData.phone,
      email: staffData.email,
      status: "active",
      address: staffData.address,
      // Use form joinDate if provided, otherwise auto-set for new staff
      joinDate: staffData.joinDate || (editingStaffId ? undefined : new Date().toISOString().split('T')[0]),
      shift: staffData.shift || undefined,
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
      whatsappNumber: staffData.isWhatsapp ? staffData.phone : staffData.whatsappNumber,
      picture: staffData.picture,
      idDocuments: staffData.idDocuments,
      professionalQualifications: staffData.professionalQualifications,
      totalExperience: staffData.totalExperience,
      previousOrganization: staffData.previousOrganization,
      roleInOrganization: staffData.roleInOrganization,
      qualificationDocs: staffData.qualificationDocs,
      customDocuments: staffData.customDocuments,
      staffNumber: staffData.staffNumber,
      staffType: roleArray, // Keep in sync with `role` to prevent stale deprecated field
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
        toast.success(t('toast.success.staffMemberUpdatedSuccessfully'));
      } else {
        savedStaff = await addStaff(transformedData);
        toast.success(t('toast.success.staffMemberAddedSuccessfully'));
      }

      // Assign class teacher if isClassTeacher is enabled and a class is selected
      if (staffData.isClassTeacher && staffData.classTeacherOf) {
        const staffId = editingStaffId || savedStaff?._id || savedStaff?.id;
        if (staffId) {
          try {
            await classesApi.updateClassTeacher(staffData.classTeacherOf, staffId);
            toast.success(t('toast.success.classTeacherAssignedSuccessfully'));
          } catch (ctError) {
            logger.error('Failed to assign class teacher:', ctError);
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
      logger.error('Failed to save staff:', err);
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
      toast.error(t('toast.error.failedToLoadForms'));
      logger.error(error);
    }
  };

  const handleSendForm = async () => {
    if (!selectedForm) {
      toast.error(t('toast.error.pleaseSelectAForm'));
      return;
    }
    if (!recipientEmail && !recipientPhone) {
      toast.error(t('toast.error.pleaseEnterEmailOrPhoneNumber'));
      return;
    }
    setIsSendingForm(true);
    try {
      const emails = recipientEmail ? [recipientEmail] : [];
      const phones = recipientPhone ? [recipientPhone] : [];
      await intakeFormsApi.assign(selectedForm, { emails, phones, expiresInDays: 30, assignedBy: null });
      toast.success(t('toast.success.formSentSuccessfully'));
      setIsFormSelectModalOpen(false);
      setSelectedForm(null);
      setRecipientEmail('');
      setRecipientPhone('');
    } catch (error) {
      logger.error('Form send error:', error);
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
            <MinimalButton icon={<Plus size={16} />} onClick={handleOpenAddStaff}>{t('pages.createStaff')}</MinimalButton>
          ) : activeTab === "overview" ? (
            <MinimalButton icon={<CalendarDays size={16} />} onClick={() => navigate("/staffs/attendance/regularize")}>{t('pages.regularize')}</MinimalButton>
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
          onOpenChange={(open) => { if (!open) handleCloseAddStaff(); }}
          isDismissable={false}
          placement="right"
          hideCloseButton
          classNames={{ wrapper: "justify-end", base: "w-[720px] max-w-[95vw]", backdrop: "bg-black/30" }}
        >
          <DrawerContent>
            {(onClose) => (
              <>
                <DrawerHeader className="border-b border-gray-100 dark:border-zinc-800 px-6 py-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                      <Briefcase size={20} className="text-gray-600 dark:text-zinc-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900 dark:text-zinc-100">{editingStaffId ? 'Edit Staff Member' : 'Create New Staff'}</h2>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">{editingStaffId ? 'Update staff details' : 'Fill in the staff details below'}</p>
                    </div>
                  </div>
                  <Button isIconOnly size="sm" variant="light" onPress={() => {
                    if (addStaffRef.current) addStaffRef.current.attemptClose();
                    else if (window.staffDrawerCloseHandler) window.staffDrawerCloseHandler();
                    else handleCloseAddStaff();
                  }}>
                    <X size={20} className="text-gray-400 dark:text-zinc-500" />
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
      <Modal isOpen={isMethodModalOpen} onClose={() => setIsMethodModalOpen(false)} size="2xl" classNames={{ backdrop: "bg-black/30", base: "bg-white dark:bg-zinc-950" }}>
        <ModalContent>
          <ModalHeader className="border-b border-gray-100 dark:border-zinc-800 py-4">
            <h3 className="text-lg font-medium">{t('pages.chooseRegistrationMethod')}</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 font-normal mt-1">{t('pages.selectHowToAddTheNewStaffMember')}</p>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={() => handleSelectMethod('form')} className="p-6 rounded-lg border border-gray-200 dark:border-zinc-800 hover:border-gray-400 dark:hover:border-zinc-600 transition-colors text-left">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                    <Send size={24} className="text-gray-600 dark:text-zinc-400" />
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-gray-900 dark:text-zinc-100 mb-2">{t('pages.sendFillingForm')}</h4>
                    <p className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.sendAnIntakeFormForThemToFillOut')}</p>
                  </div>
                </div>
              </button>
              <button onClick={() => handleSelectMethod('full')} className="p-6 rounded-lg border border-gray-200 dark:border-zinc-800 hover:border-gray-400 dark:hover:border-zinc-600 transition-colors text-left">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                    <UserPlus size={24} className="text-gray-600 dark:text-zinc-400" />
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-gray-900 dark:text-zinc-100 mb-2">{t('pages.fullRegistration')}</h4>
                    <p className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.fillOutAllStaffDetailsDirectly')}</p>
                  </div>
                </div>
              </button>
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-gray-100 dark:border-zinc-800">
            <Button variant="light" onPress={() => setIsMethodModalOpen(false)}>{t('pages.cancel2')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Form Selection Modal */}
      <Modal isOpen={isFormSelectModalOpen} onClose={() => { setIsFormSelectModalOpen(false); setSelectedForm(null); setRecipientEmail(''); setRecipientPhone(''); }} size="2xl" classNames={{ backdrop: "bg-black/30", base: "bg-white dark:bg-zinc-950" }}>
        <ModalContent>
          <ModalHeader className="border-b border-gray-100 dark:border-zinc-800 py-4">
            <h3 className="text-lg font-medium">{t('pages.sendIntakeForm')}</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 font-normal mt-1">{t('pages.selectAFormAndEnterRecipientDetails')}</p>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="space-y-4">
              <div className="relative" ref={formDropdownRef}>
                <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2 block">{t('pages.selectForm')}</label>
                <button type="button" onClick={() => setIsFormDropdownOpen(!isFormDropdownOpen)} className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 transition-colors">
                  {selectedForm ? (
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-gray-500 dark:text-zinc-400" />
                      <span className="text-sm">{availableForms.find(f => f.id === selectedForm)?.formName}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.chooseAnIntakeForm')}</span>
                  )}
                  <ChevronDown size={18} className={`text-gray-400 dark:text-zinc-500 transition-transform ${isFormDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isFormDropdownOpen && availableForms.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg max-h-[320px] overflow-y-auto">
                    <div className="p-2">
                      {availableForms.map((form) => (
                        <button key={form.id} type="button" onClick={() => { setSelectedForm(form.id); setIsFormDropdownOpen(false); }} className={`w-full p-3 rounded-lg text-left flex items-center gap-3 ${selectedForm === form.id ? 'bg-gray-100 dark:bg-zinc-800' : 'hover:bg-gray-50 dark:hover:bg-zinc-900'}`}>
                          <FileText size={18} className="text-gray-500 dark:text-zinc-400" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{form.formName}</p>
                            <p className="text-xs text-gray-500 dark:text-zinc-400">{form.fields?.length || 0} fields</p>
                          </div>
                          {selectedForm === form.id && <CheckCircle2 size={16} className="text-gray-600 dark:text-zinc-400" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {availableForms.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-zinc-400">
                  <p>{t('pages.noActiveStaffFormsAvailable')}</p>
                  <Button size="sm" variant="flat" className="mt-2" onPress={() => { setIsFormSelectModalOpen(false); navigate('/settings/intake-forms'); }}>{t('pages.createAForm')}</Button>
                </div>
              )}
              <FormInput label={t('pages.email1')} type="email" placeholder={t('pages.enterEmailAddress')} value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} startContent={<Mail size={18} />} />
              <FormInput label={t('pages.phoneNumber')} type="tel" placeholder={t('pages.enterPhoneNumber')} value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} startContent={<Phone size={18} />} />
              <div className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-zinc-400">{t('pages.theRecipientWillReceiveALinkToFillOutTheForm')}</p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-gray-100 dark:border-zinc-800">
            <Button variant="light" onPress={() => { setIsFormSelectModalOpen(false); setSelectedForm(null); setRecipientEmail(''); setRecipientPhone(''); }}>{t('pages.cancel2')}</Button>
            <Button color="primary" onPress={handleSendForm} isLoading={isSendingForm} isDisabled={!selectedForm || (!recipientEmail && !recipientPhone)} startContent={!isSendingForm && <Send size={16} />}>{t('pages.sendForm')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
