import { useRef, useEffect, useState, Suspense, useTransition } from "react";
import logger from "../../utils/logger";
import lazyWithRetry from "../../utils/lazyWithRetry";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter as ModalFooterUI, Chip } from "@heroui/react";
import { Plus, X, UserPlus, Send, FileText, CheckCircle2, ChevronDown, Mail, Phone, Eye, Check, GraduationCap } from "lucide-react";
import StudentsList from "./StudentsList";
import StudentDashboard from "./StudentDashboard";
import StudentAttendance from "./StudentAttendance";
import StudentFormSubmissions from "./StudentFormSubmissions";
const AddStudent = lazyWithRetry(() => import("./AddStudent"));
import FormInput from "../../components/FormInput";
import { useApp } from "../../context/AppContext";
import { intakeFormsApi } from "../../services/api";
import toast from "react-hot-toast";
import { PageLayout, MinimalButton } from "../../components/ui";
import ErrorBoundary from "../../components/ui/ErrorBoundary";
import { useTranslation } from 'react-i18next';

const ModalFooter = ModalFooterUI;

export default function StudentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { classesWithTeachers, addStudent } = useApp();
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [isFormSelectModalOpen, setIsFormSelectModalOpen] = useState(false);
  const [formModalKey, setFormModalKey] = useState(0);
  const [availableForms, setAvailableForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [recipientEmails, setRecipientEmails] = useState([]);
  const [recipientPhones, setRecipientPhones] = useState([]);
  const [isSendingForm, setIsSendingForm] = useState(false);
  const [isFormDropdownOpen, setIsFormDropdownOpen] = useState(false);
  // isPreviewModalOpen and previewForm state removed - were unused
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const formDropdownRef = useRef(null);
  const addStudentRef = useRef(null);

  // Handle backdrop click for unsaved changes check
  useEffect(() => {
    if (!isAddStudentOpen) return;
    const handleBackdropClick = (e) => {
      const backdrop = e.target.closest?.('[data-slot="backdrop"]') || (e.target.getAttribute?.('data-slot') === 'backdrop' ? e.target : null);
      if (backdrop) {
        if (addStudentRef.current) addStudentRef.current.attemptClose();
        else handleCloseAddStudent();
      }
    };
    document.addEventListener('click', handleBackdropClick, true);
    return () => document.removeEventListener('click', handleBackdropClick, true);
  }, [isAddStudentOpen]);

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

  const handleOpenAddStudent = () => setIsMethodModalOpen(true);

  const handleAddEmail = () => {
    if (!newEmail || newEmail.trim() === '') {
      toast.error(t('toast.error.pleaseEnterAnEmailAddress'));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error(t('toast.error.pleaseEnterAValidEmailAddress'));
      return;
    }
    if (recipientEmails.includes(newEmail)) {
      toast.error(t('toast.error.thisEmailHasAlreadyBeenAdded'));
      return;
    }
    setRecipientEmails([...recipientEmails, newEmail]);
    setNewEmail('');
  };

  const handleRemoveEmail = (email) => setRecipientEmails(recipientEmails.filter(e => e !== email));

  const handleAddPhone = () => {
    if (!newPhone || newPhone.trim() === '') {
      toast.error(t('toast.error.pleaseEnterAPhoneNumber'));
      return;
    }
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(newPhone)) {
      toast.error(t('toast.error.pleaseEnterAValid10DigitMobileNumberStartingWith69'));
      return;
    }
    if (recipientPhones.includes(newPhone)) {
      toast.error(t('toast.error.thisPhoneNumberHasAlreadyBeenAdded'));
      return;
    }
    setRecipientPhones([...recipientPhones, newPhone]);
    setNewPhone('');
  };

  const handleRemovePhone = (phone) => setRecipientPhones(recipientPhones.filter(p => p !== phone));

  const [isPending, startTransition] = useTransition();

  const handleSelectMethod = (method) => {
    setIsMethodModalOpen(false);
    if (method === 'full') {
      startTransition(() => {
        setIsAddStudentOpen(true);
      });
    }
    else if (method === 'form') loadAvailableForms();
  };

  const loadAvailableForms = async () => {
    try {
      const forms = await intakeFormsApi.getAll();
      const admissionForms = forms
        .filter(f => f.formType === 'student' && f.status === 'active')
        .map(f => ({ ...f, id: f._id || f.id }));
      setAvailableForms(admissionForms);
      setSelectedForm(null);
      setRecipientEmails([]);
      setRecipientPhones([]);
      setFormModalKey(prev => prev + 1);
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
    if (recipientEmails.length === 0 && recipientPhones.length === 0) {
      toast.error(t('toast.error.pleaseEnterAtLeastOneEmailOrPhoneNumber'));
      return;
    }
    setIsSendingForm(true);
    try {
      await intakeFormsApi.assign(selectedForm, {
        emails: recipientEmails,
        phones: recipientPhones,
        expiresInDays: 30,
        assignedBy: null
      });
      toast.success(t('toast.success.formSentSuccessfully'));
      setIsFormSelectModalOpen(false);
      setSelectedForm(null);
      setRecipientEmails([]);
      setRecipientPhones([]);
      setFormModalKey(prev => prev + 1);
      setShowSuccessModal(true);
    } catch (error) {
      logger.error('Form send error:', error);
      toast.error(t('toast.error.failedToSendForm', 'Failed to send form') + ": " + (error.message || t('common.unknownError', 'Unknown error')));
    } finally {
      setIsSendingForm(false);
    }
  };

  const handleCloseAddStudent = () => setIsAddStudentOpen(false);

  const getActiveTab = () => {
    if (location.pathname === "/students/attendance") return "attendance";
    if (location.pathname === "/students/submissions") return "submissions";
    return "list";
  };

  const handleSaveStudent = async (studentData) => {
    try {
      await addStudent(studentData);
      window.dispatchEvent(new Event("students:list-refresh"));
      toast.success(t('toast.success.studentAddedSuccessfully'));
      handleCloseAddStudent();
    } catch (err) {
      logger.error('Failed to add student:', err);
      toast.error(t('toast.error.failedToAddStudent', 'Failed to add student') + ": " + (err.message || t('common.unknownError', 'Unknown error')));
      throw err;
    }
  };

  const activeTab = getActiveTab();

  const tabHeaderInfo = {
    list: { title: "All Students", description: "View and manage student records" },
    attendance: { title: "Student Attendance", description: "Track daily attendance" },
    submissions: { title: "Form Submissions", description: "Review admission form submissions" }
  };

  const tabs = [
    { key: "list", title: "All Students" },
    { key: "attendance", title: "Attendance" },
    { key: "submissions", title: "Form Submissions" }
  ];

  const handleTabChange = (key) => {
    // Use replace to avoid building up history entries for tab switches
    if (key === "list") navigate("/students", { replace: true });
    else if (key === "attendance") navigate("/students/attendance", { replace: true });
    else if (key === "submissions") navigate("/students/submissions", { replace: true });
  };

  const pathParts = location.pathname.split('/').filter(Boolean);
  const isProfileView = pathParts.length === 2 &&
    pathParts[0] === 'students' &&
    pathParts[1] !== 'attendance' &&
    pathParts[1] !== 'submissions' &&
    pathParts[1] !== '';

  if (isProfileView) {
    return (
      <ErrorBoundary>
        <Routes>
          <Route path=":id" element={<StudentDashboard />} />
        </Routes>
      </ErrorBoundary>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <PageLayout
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        header={tabHeaderInfo[activeTab]}
        className="flex-1 min-h-0"
        noPadding
        actions={activeTab === "list" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/students/promotion')}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Promotion
            </button>
            <button
              onClick={() => navigate('/students/transfer-certificate')}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Transfer Certificate
            </button>
            <MinimalButton
              icon={<Plus size={16} />}
              onClick={handleOpenAddStudent}
            >
              New Student
            </MinimalButton>
          </div>
        )}
      >
        {activeTab === "list" && (
          <div className="flex-1 flex flex-col min-h-0">
            <StudentsList />
          </div>
        )}
        {activeTab === "attendance" && (
          <div className="p-6 overflow-auto">
            <StudentAttendance />
          </div>
        )}
        {activeTab === "submissions" && (
          <div className="p-6 overflow-auto">
            <StudentFormSubmissions />
          </div>
        )}
      </PageLayout>

      {/* Add Student Drawer - only mount when open */}
      {isAddStudentOpen && (
      <Suspense fallback={null}>
      <Drawer
        isOpen={isAddStudentOpen}
        onOpenChange={(open) => {
          if (!open) {
            if (addStudentRef.current) addStudentRef.current.attemptClose();
            else handleCloseAddStudent();
          }
        }}
        placement="right"
        size="xl"
        hideCloseButton
        classNames={{ base: "max-w-[900px]", wrapper: "z-[9999]", backdrop: "z-[9998]" }}
      >
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="border-b border-default-200/60 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <GraduationCap size={20} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-default-900">{t('pages.addNewStudent')}</h2>
                    <p className="text-xs text-default-500">{t('pages.registerANewStudentManually')}</p>
                  </div>
                </div>
                <Button isIconOnly size="sm" variant="light" onPress={() => {
                  if (addStudentRef.current) addStudentRef.current.attemptClose();
                  else handleCloseAddStudent();
                }}>
                  <X size={20} className="text-default-400" />
                </Button>
              </DrawerHeader>
              <DrawerBody className="p-0 overflow-hidden">
                <Suspense fallback={<div className="p-6 space-y-4">{Array.from({ length: 6 }).map((_, i) => (<div key={i} className="space-y-2"><div className="h-4 w-1/4 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" /><div className="h-10 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" /></div>))}</div>}>
                  <AddStudent
                    ref={addStudentRef}
                    onClose={handleCloseAddStudent}
                    onSave={handleSaveStudent}
                    classesWithTeachers={classesWithTeachers}
                  />
                </Suspense>
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>
      </Suspense>
      )}

      {/* Method Selection Modal */}
      <Modal
        isOpen={isMethodModalOpen}
        onClose={() => setIsMethodModalOpen(false)}
        size="2xl"
        backdrop="opaque"
        classNames={{ backdrop: "bg-black/50", base: "bg-white dark:bg-zinc-900" }}
      >
        <ModalContent>
          <ModalHeader className="border-b border-gray-100 dark:border-zinc-700 py-4">
            <h3 className="text-lg font-medium">{t('pages.chooseAdmissionMethod')}</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 font-normal mt-1">{t('pages.selectHowYouWantToAddTheNewStudent')}</p>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleSelectMethod('form')}
                className="group p-6 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-500 transition-colors text-left"
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                    <Send size={24} className="text-gray-600 dark:text-zinc-400" />
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-gray-900 dark:text-zinc-100 mb-2">{t('pages.sendAdmissionForm')}</h4>
                    <p className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.shareAFormLinkWithParentsViaEmailOrSms')}</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => handleSelectMethod('full')}
                className="group p-6 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-500 transition-colors text-left"
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                    <UserPlus size={24} className="text-gray-600 dark:text-zinc-400" />
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-gray-900 dark:text-zinc-100 mb-2">{t('pages.manualRegistration')}</h4>
                    <p className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.addStudentDetailsDirectlyInTheAdminPanel')}</p>
                  </div>
                </div>
              </button>
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-gray-100 dark:border-zinc-700">
            <Button variant="light" onPress={() => setIsMethodModalOpen(false)}>{t('pages.cancel2')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Form Selection Modal */}
      <Modal
        key={formModalKey}
        isOpen={isFormSelectModalOpen}
        onClose={() => {
          setIsFormSelectModalOpen(false);
          setSelectedForm(null);
          setRecipientEmails([]);
          setRecipientPhones([]);
          setFormModalKey(prev => prev + 1);
        }}
        size="2xl"
        backdrop="opaque"
        classNames={{ backdrop: "bg-black/50", base: "bg-white dark:bg-zinc-900" }}
      >
        <ModalContent>
          <ModalHeader className="border-b border-gray-100 dark:border-zinc-700 py-4">
            <h3 className="text-lg font-medium">{t('pages.sendAdmissionForm')}</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 font-normal mt-1">{t('pages.chooseAFormAndShareIt')}</p>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="space-y-4">
              <div className="relative" ref={formDropdownRef}>
                <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2 block">{t('pages.selectForm')}</label>
                <button
                  type="button"
                  onClick={() => setIsFormDropdownOpen(!isFormDropdownOpen)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 transition-colors"
                >
                  {selectedForm ? (
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-gray-500 dark:text-zinc-400" />
                      <span className="text-sm">{availableForms.find(f => f.id === selectedForm)?.formName}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.chooseAnAdmissionForm')}</span>
                  )}
                  <ChevronDown size={18} className={`text-gray-400 dark:text-zinc-500 transition-transform ${isFormDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isFormDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg max-h-[320px] overflow-y-auto">
                    <div className="p-2">
                      {availableForms.length > 0 ? (
                        availableForms.map((form) => (
                          <button
                            key={form.id}
                            type="button"
                            onClick={() => { setSelectedForm(form.id); setIsFormDropdownOpen(false); }}
                            className={`w-full p-3 rounded-lg text-left flex items-center gap-3 ${selectedForm === form.id ? 'bg-gray-100 dark:bg-zinc-800' : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'}`}
                          >
                            <FileText size={18} className="text-gray-500 dark:text-zinc-400" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{form.formName}</p>
                              <p className="text-xs text-gray-500 dark:text-zinc-400">{form.fields?.length || 0} fields</p>
                            </div>
                            {selectedForm === form.id && <CheckCircle2 size={16} className="text-gray-600 dark:text-zinc-400" />}
                          </button>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-zinc-400">
                          <p>{t('pages.noActiveAdmissionFormsAvailable')}</p>
                          <Button size="sm" variant="flat" className="mt-2" onPress={() => { setIsFormDropdownOpen(false); setIsFormSelectModalOpen(false); navigate('/settings/intake-forms'); }}>{t('pages.createAForm')}</Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2 block">{t('pages.parentEmail1')}</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="email"
                    placeholder={t('pages.enterEmailAddress')}
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddEmail(); }}}
                    className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 text-sm focus:outline-none focus:border-gray-400 dark:focus:border-zinc-500 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  />
                  <Button variant="flat" size="sm" onPress={handleAddEmail} isDisabled={!newEmail} startContent={<Mail size={14} />}>{t('pages.add1')}</Button>
                </div>
                {recipientEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {recipientEmails.map((email) => (
                      <Chip key={email} onClose={() => handleRemoveEmail(email)} variant="flat" size="md">{email}</Chip>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2 block">{t('pages.parentMobileNumber')}</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="tel"
                    placeholder={t('pages.enter10DigitMobileNumber')}
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPhone(); }}}
                    className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 text-sm focus:outline-none focus:border-gray-400 dark:focus:border-zinc-500 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  />
                  <Button variant="flat" size="sm" onPress={handleAddPhone} isDisabled={!newPhone || newPhone.length !== 10} startContent={<Phone size={14} />}>{t('pages.add1')}</Button>
                </div>
                {recipientPhones.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {recipientPhones.map((phone) => (
                      <Chip key={phone} onClose={() => handleRemovePhone(phone)} variant="flat" size="md">{phone}</Chip>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-zinc-400">A form link will be sent to the parent. Review submissions in the Submissions tab.</p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-gray-100 dark:border-zinc-700">
            <Button variant="light" onPress={() => { setIsFormSelectModalOpen(false); setSelectedForm(null); setRecipientEmails([]); setRecipientPhones([]); }}>{t('pages.cancel2')}</Button>
            <Button color="primary" onPress={handleSendForm} isLoading={isSendingForm} isDisabled={!selectedForm || (recipientEmails.length === 0 && recipientPhones.length === 0)} startContent={!isSendingForm && <Send size={16} />}>{t('pages.sendForm')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Success Modal */}
      <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} size="md" backdrop="opaque" classNames={{ backdrop: "bg-black/50", base: "bg-white dark:bg-zinc-900" }}>
        <ModalContent>
          <ModalHeader className="border-b border-gray-100 dark:border-zinc-700 py-4">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-900 dark:bg-zinc-100 flex items-center justify-center">
                <Check size={24} className="text-white dark:text-zinc-900" />
              </div>
              <h3 className="text-lg font-medium">{t('pages.formSentSuccessfully1')}</h3>
            </div>
          </ModalHeader>
          <ModalBody className="py-6">
            <p className="text-sm text-gray-500 dark:text-zinc-400 text-center">The admission form has been sent. You can review the submission in the Form Submissions tab.</p>
          </ModalBody>
          <ModalFooter className="border-t border-gray-100 dark:border-zinc-700 gap-3">
            <Button variant="flat" onPress={() => { setShowSuccessModal(false); setIsFormSelectModalOpen(true); }} className="flex-1">{t('pages.sendAnother')}</Button>
            <Button color="primary" onPress={() => { setShowSuccessModal(false); setIsMethodModalOpen(true); }} className="flex-1" startContent={<UserPlus size={16} />}>{t('pages.manualRegistration')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
