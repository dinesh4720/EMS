import { useState, useRef, useEffect } from "react";
import logger from "../../utils/logger";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { Mail, Phone, Send, UserPlus, FileText, CheckCircle2, ChevronDown } from "lucide-react";
import StaffList from "./StaffList";
import StaffAttendanceRegularize from "./StaffAttendanceRegularize";
import LeaveManagement from "./LeaveManagement";
import StaffPayroll from "./StaffPayroll";
import StaffDashboard from "./StaffDashboard";
import AddStaffComposer from "./AddStaffComposer";
import BulkSubjectAssignment from "./BulkSubjectAssignment";
import FormInput from "../../components/FormInput";
import { useApp } from "../../context/AppContext";
import { intakeFormsApi, classesApi } from "../../services/api";
import toast from "react-hot-toast";
import { PageLayout } from "../../components/ui";
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
    // `handleCloseAddStaff` is recreated each render; binding on open/close
    // is the intended signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const activeTab = location.pathname.includes("/staffs/") && location.pathname !== "/staffs/payroll" && location.pathname !== "/staffs/bulk-subjects" && location.pathname !== "/staffs" && location.pathname !== "/staffs/"
    ? "profile"
    : (location.pathname === "/staffs/payroll" ? "payroll" : location.pathname === "/staffs/bulk-subjects" ? "subjects" : "list");

  const isProfileView = location.pathname !== "/staffs" && location.pathname !== "/staffs/" && location.pathname !== "/staffs/payroll" && location.pathname !== "/staffs/bulk-subjects" && !location.pathname.endsWith("/staffs");
  const isRegularizeView = location.pathname.includes("/attendance/regularize");
  const isLeaveView = location.pathname.includes("/attendance/leave");

  const handleSaveStaff = async (staffData) => {
    // Normalize role: send as array to match Mongoose schema [String]
    const roleArray = Array.isArray(staffData.staffType) ? staffData.staffType : (staffData.staffType ? [staffData.staffType] : []);

    const transformedData = {
      name: staffData.name,
      role: roleArray,
      department: staffData.department || "General",
      phone: staffData.phone,
      email: staffData.email,
      status: editingStaffId ? (staffData.status || undefined) : "active",
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

      // For new staff, return the saved staff so the composer can show the
      // class/subject management modal. The composer will call onClose itself.
      if (!editingStaffId && savedStaff) {
        return savedStaff;
      }

      // For edits, close the composer immediately
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

  // Header copy used by the Subjects/Payroll routes (rendered via PageLayout
  // below). The list view owns its own header inside the StaffList card.
  const tabHeaderInfo = {
    payroll: { title: t('staff.tabs.payroll', 'Staff Salary & Payroll'), description: t('staff.tabs.payrollDesc', 'Manage salaries and payments') },
    subjects: { title: t('staff.tabs.subjects', 'Subject Assignments'), description: t('staff.tabs.subjectsDesc', 'Assign subjects and classes to teachers') }
  };

  if (isProfileView || isRegularizeView || isLeaveView) {
    return (
      <div className="space-y-6 animate-fade-in pb-8">
        <Routes>
          <Route path=":id" element={<StaffDashboard />} />
          <Route path="attendance/regularize" element={<StaffAttendanceRegularize />} />
          <Route path="attendance/leave" element={<LeaveManagement />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="staffs-page animate-fade-in">
      {activeTab === "list" ? (
        <div className="staffs-page__listframe">
          <Routes>
            <Route index element={<StaffList onStaffClick={handleOpenStaffProfile} onAddStaff={handleOpenAddStaff} />} />
            <Route path="list" element={<StaffList onStaffClick={handleOpenStaffProfile} onAddStaff={handleOpenAddStaff} />} />
          </Routes>
        </div>
      ) : (
        <PageLayout
          header={tabHeaderInfo[activeTab]}
        >
          <div className="min-h-[500px]">
            <Routes>
              <Route path="bulk-subjects" element={<BulkSubjectAssignment />} />
              <Route path="payroll" element={<StaffPayroll onStaffClick={handleOpenStaffProfile} />} />
            </Routes>
          </div>
        </PageLayout>
      )}

      {/* Add / Edit Staff — single composer surface for both create and edit. */}
      {shouldRenderAddStaff && isAddStaffOpen && (
        <AddStaffComposer
          ref={addStaffRef}
          onClose={handleCloseAddStaff}
          onSave={handleSaveStaff}
          editingStaff={editingStaffId ? getEditingStaff() : null}
        />
      )}

      {/* Method Selection Modal */}
      <Modal isOpen={isMethodModalOpen} onClose={() => setIsMethodModalOpen(false)} size="2xl" classNames={{ backdrop: "bg-overlay-bg", base: "bg-surface" }}>
        <ModalContent>
          <ModalHeader className="border-b border-border-token py-4">
            <h3 className="text-lg font-medium">{t('pages.chooseRegistrationMethod')}</h3>
            <p className="text-sm text-fg-muted font-normal mt-1">{t('pages.selectHowToAddTheNewStaffMember')}</p>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={() => handleSelectMethod('form')} className="p-6 rounded-lg border border-border-token hover:border-border-strong transition-colors text-left">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center">
                    <Send size={24} className="text-fg-muted" />
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-fg mb-2">{t('pages.sendFillingForm')}</h4>
                    <p className="text-sm text-fg-muted">{t('pages.sendAnIntakeFormForThemToFillOut')}</p>
                  </div>
                </div>
              </button>
              <button onClick={() => handleSelectMethod('full')} className="p-6 rounded-lg border border-border-token hover:border-border-strong transition-colors text-left">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center">
                    <UserPlus size={24} className="text-fg-muted" />
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-fg mb-2">{t('pages.fullRegistration')}</h4>
                    <p className="text-sm text-fg-muted">{t('pages.fillOutAllStaffDetailsDirectly')}</p>
                  </div>
                </div>
              </button>
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-border-token">
            <Button variant="light" onPress={() => setIsMethodModalOpen(false)}>{t('pages.cancel2')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Form Selection Modal */}
      <Modal isOpen={isFormSelectModalOpen} onClose={() => { setIsFormSelectModalOpen(false); setSelectedForm(null); setRecipientEmail(''); setRecipientPhone(''); }} size="2xl" classNames={{ backdrop: "bg-overlay-bg", base: "bg-surface" }}>
        <ModalContent>
          <ModalHeader className="border-b border-border-token py-4">
            <h3 className="text-lg font-medium">{t('pages.sendIntakeForm')}</h3>
            <p className="text-sm text-fg-muted font-normal mt-1">{t('pages.selectAFormAndEnterRecipientDetails')}</p>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="space-y-4">
              <div className="relative" ref={formDropdownRef}>
                <label className="text-sm font-medium text-fg mb-2 block">{t('pages.selectForm')}</label>
                <button type="button" onClick={() => setIsFormDropdownOpen(!isFormDropdownOpen)} className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-surface-2 rounded-lg border border-border-token hover:border-border-strong transition-colors">
                  {selectedForm ? (
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-fg-muted" />
                      <span className="text-sm">{availableForms.find(f => f.id === selectedForm)?.formName}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-fg-muted">{t('pages.chooseAnIntakeForm')}</span>
                  )}
                  <ChevronDown size={18} className={`text-fg-subtle transition-transform ${isFormDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isFormDropdownOpen && availableForms.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-surface border border-border-token rounded-lg max-h-[320px] overflow-y-auto">
                    <div className="p-2">
                      {availableForms.map((form) => (
                        <button key={form.id} type="button" onClick={() => { setSelectedForm(form.id); setIsFormDropdownOpen(false); }} className={`w-full p-3 rounded-lg text-left flex items-center gap-3 ${selectedForm === form.id ? 'bg-surface-2' : 'hover:bg-surface-hover'}`}>
                          <FileText size={18} className="text-fg-muted" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{form.formName}</p>
                            <p className="text-xs text-fg-muted">{form.fields?.length || 0} fields</p>
                          </div>
                          {selectedForm === form.id && <CheckCircle2 size={16} className="text-fg-muted" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {availableForms.length === 0 && (
                <div className="text-center py-8 text-fg-muted">
                  <p>{t('pages.noActiveStaffFormsAvailable')}</p>
                  <Button size="sm" variant="flat" className="mt-2" onPress={() => { setIsFormSelectModalOpen(false); navigate('/settings/intake-forms'); }}>{t('pages.createAForm')}</Button>
                </div>
              )}
              <FormInput label={t('pages.email1')} type="email" placeholder={t('pages.enterEmailAddress')} value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} startContent={<Mail size={18} />} />
              <FormInput label={t('pages.phoneNumber')} type="tel" placeholder={t('pages.enterPhoneNumber')} value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} startContent={<Phone size={18} />} />
              <div className="bg-surface-2 border border-border-token rounded-lg p-4">
                <p className="text-sm text-fg-muted">{t('pages.theRecipientWillReceiveALinkToFillOutTheForm')}</p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-border-token">
            <Button variant="light" onPress={() => { setIsFormSelectModalOpen(false); setSelectedForm(null); setRecipientEmail(''); setRecipientPhone(''); }}>{t('pages.cancel2')}</Button>
            <Button color="primary" onPress={handleSendForm} isLoading={isSendingForm} isDisabled={!selectedForm || (!recipientEmail && !recipientPhone)} startContent={!isSendingForm && <Send size={16} />}>{t('pages.sendForm')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
