import { useRef, useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Tabs, Tab, Button, Drawer, DrawerContent, DrawerHeader, DrawerBody, Card, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter as ModalFooterUI } from "@heroui/react";
import { GraduationCap, Plus, X, UserPlus, Send, FileText, CheckCircle2, ChevronDown, Mail, Phone } from "lucide-react";
import StudentsList from "./StudentsList";
import StudentOverview from "./StudentOverview";
import StudentAttendance from "./StudentAttendance";
import AddStudent from "./AddStudent";
import FormInput from "../../components/FormInput";
import { useApp } from "../../context/AppContext";
import { intakeFormsApi } from "../../services/api";
import toast from "react-hot-toast";

// Helper for modal footer to avoid name collision if needed, or just use ModalFooter from import
const ModalFooter = ModalFooterUI;

export default function StudentsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { classesWithTeachers, addStudent } = useApp();
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [isFormSelectModalOpen, setIsFormSelectModalOpen] = useState(false);
  const [availableForms, setAvailableForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [isSendingForm, setIsSendingForm] = useState(false);
  const [isFormDropdownOpen, setIsFormDropdownOpen] = useState(false);
  const formDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (formDropdownRef.current && !formDropdownRef.current.contains(event.target)) {
        setIsFormDropdownOpen(false);
      }
    };

    if (isFormDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFormDropdownOpen]);

  // Update handleOpenAddStudent to show method selection logic
  const handleOpenAddStudent = () => {
    setIsMethodModalOpen(true);
  };

  const handleSelectMethod = (method) => {
    setIsMethodModalOpen(false);
    if (method === 'full') {
      setIsAddStudentOpen(true);
    } else if (method === 'form') {
      loadAvailableForms();
    }
  };

  const loadAvailableForms = async () => {
    try {
      const forms = await intakeFormsApi.getAll();
      // Filter for student forms
      const studentForms = forms.filter(f => f.formType === 'student' && f.status === 'active');
      setAvailableForms(studentForms);
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

      await intakeFormsApi.assign(selectedForm, {
        emails,
        phones,
        expiresInDays: 30,
        assignedBy: null
      });

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

  const handleCloseAddStudent = () => {
    setIsAddStudentOpen(false);
  };

  const getActiveTab = () => {
    if (location.pathname === "/students/attendance") return "attendance";
    return "list";
  };

  const handleSaveStudent = async (studentData) => {
    try {
      console.log('handleSaveStudent called with:', studentData);
      await addStudent(studentData);
      toast.success('Student added successfully!');
      handleCloseAddStudent();
    } catch (err) {
      console.error('Failed to add student:', err);
      toast.error('Failed to add student: ' + (err.message || 'Unknown error'));
      throw err; // Re-throw so AddStudent component can handle it
    }
  };

  const classOptions = classesWithTeachers.map(c => `${c.name}-${c.section}`);
  const activeTab = getActiveTab();

  const tabHeaderInfo = {
    list: {
      title: "All Students",
      description: "Manage students, classes, parent contacts, and fee status"
    },
    attendance: {
      title: "Student Attendance",
      description: "Track daily attendance and view attendance statistics"
    }
  };

  // Check if we're viewing a student profile
  // Match any path like /students/123 but not /students or /students/attendance
  const pathParts = location.pathname.split('/').filter(Boolean);
  const isProfileView = pathParts.length === 2 &&
    pathParts[0] === 'students' &&
    pathParts[1] !== 'attendance' &&
    pathParts[1] !== '';

  // If viewing a profile, render just the routes without the card wrapper
  if (isProfileView) {
    return (
      <Routes>
        <Route path=":id" element={<StudentOverview />} />
      </Routes>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <Card className="shadow-sm border border-default-200 bg-background rounded-md">
        {/* <div className="px-6 py-3 border-b border-default-200">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => {
              if (key === "list") navigate("/students");
              else if (key === "attendance") navigate("/students/attendance");
            }}
            size="md"
            color="default"
            variant="light"
            classNames={{
              tabList: "gap-0 p-1.5 bg-gradient-to-r from-default-100 via-default-200/50 to-default-100 rounded-xl",
              cursor: "bg-white dark:bg-default-50 rounded-lg shadow-lg ring-1 ring-black/5",
              tab: "px-6 h-10 cursor-pointer",
              tabContent: "group-data-[selected=true]:text-default-900 group-data-[selected=true]:font-semibold text-default-500 font-medium"
            }}
          >
            <Tab key="list" title="All Students" />
            <Tab key="attendance" title="Attendance" />
          </Tabs>
        </div> */}

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-6 border-b border-default-200 overflow-hidden">
          {activeTab === "list" && (
            <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-blue-200/80 to-transparent blur-3xl pointer-events-none" />
          )}
          <div className="pl-2 relative z-10">
            <h1 className="text-2xl font-medium text-default-900">{tabHeaderInfo[activeTab]?.title}</h1>
            <p className="text-sm text-default-500 mt-1">{tabHeaderInfo[activeTab]?.description}</p>
          </div>
          {activeTab === "list" && (
            <button
              className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg border border-primary hover:bg-primary-600 transition-all duration-200 text-sm cursor-pointer whitespace-nowrap relative z-10"
              onClick={handleOpenAddStudent}
            >
              <Plus size={16} />
              <span>New Student</span>
            </button>
          )}
        </div>

        <div className="min-h-[500px] px-6 py-6">
          <Routes>
            <Route index element={<StudentsList />} />
            <Route path="attendance" element={<StudentAttendance />} />
          </Routes>
        </div>
      </Card>

      {/* Add Student Drawer */}
      <Drawer
        isOpen={isAddStudentOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseAddStudent();
        }}
        placement="right"
        size="xl"
        hideCloseButton
        classNames={{
          base: "max-w-[900px] z-[9999]",
          backdrop: "z-[9998]"
        }}
      >
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="border-b border-default-200 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <GraduationCap size={20} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-default-900">New Student Admission</h2>
                    <p className="text-xs text-default-500">Fill in the student details below</p>
                  </div>
                </div>
                <Button isIconOnly size="sm" variant="light" onPress={handleCloseAddStudent}>
                  <X size={20} className="text-default-500" />
                </Button>
              </DrawerHeader>
              <DrawerBody className="p-0 overflow-hidden">
                <AddStudent
                  onClose={handleCloseAddStudent}
                  onSave={handleSaveStudent}
                  classOptions={classOptions}
                  classesWithTeachers={classesWithTeachers}
                />
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>
      {/* Method Selection Modal */}
      <Modal
        isOpen={isMethodModalOpen}
        onClose={() => setIsMethodModalOpen(false)}
        size="2xl"
        classNames={{
          backdrop: "bg-black/50",
          base: "bg-white dark:bg-gray-900"
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-semibold">Choose Admission Method</h3>
            <p className="text-sm text-gray-500 font-normal">Select how you want to add the new student</p>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Send Form Option */}
              <button
                onClick={() => handleSelectMethod('form')}
                className="group relative p-6 rounded-xl border-2 border-gray-200 hover:border-primary-500 hover:shadow-lg transition-all duration-200 text-left bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-900"
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Send size={32} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Send Admission Form</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Send an intake form to the parent's email or phone. They fill it out themselves.
                    </p>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    ✓ Less work for admin<br />
                    ✓ Parents provide details<br />
                    ✓ Review before approval
                  </div>
                </div>
              </button>

              {/* Full Registration Option */}
              <button
                onClick={() => handleSelectMethod('full')}
                className="group relative p-6 rounded-xl border-2 border-gray-200 hover:border-primary-500 hover:shadow-lg transition-all duration-200 text-left bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/20 dark:to-gray-900"
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UserPlus size={32} className="text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Direct Admission</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Fill out all student details directly in the admin panel. Immediate admission.
                    </p>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    ✓ Immediate access<br />
                    ✓ Complete control<br />
                    ✓ No waiting for submission
                  </div>
                </div>
              </button>
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-gray-200 dark:border-gray-800">
            <Button
              variant="light"
              onPress={() => setIsMethodModalOpen(false)}
            >
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Form Selection Modal */}
      <Modal
        isOpen={isFormSelectModalOpen}
        onClose={() => {
          setIsFormSelectModalOpen(false);
          setSelectedForm(null);
          setRecipientEmail('');
          setRecipientPhone('');
        }}
        size="2xl"
        classNames={{
          backdrop: "bg-black/50",
          base: "bg-white dark:bg-gray-900"
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-semibold">Send Admission Form</h3>
            <p className="text-sm text-gray-500 font-normal">Select a form and enter recipient details</p>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="space-y-4">
              {/* Form Selection - Custom Dropdown with Cards */}
              <div className="relative" ref={formDropdownRef}>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Select Form
                </label>
                <button
                  type="button"
                  onClick={() => setIsFormDropdownOpen(!isFormDropdownOpen)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-default-100 rounded-lg border border-default-200 hover:border-primary hover:bg-default-50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                >
                  {selectedForm ? (
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-800">
                        <FileText size={18} className="text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {availableForms.find(f => f.id === selectedForm)?.formName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {availableForms.find(f => f.id === selectedForm)?.fields?.length || 0} fields
                        </p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Choose an admission form</span>
                  )}
                  <ChevronDown size={18} className={`text-gray-400 transition-transform ${isFormDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu with Cards */}
                {isFormDropdownOpen && availableForms.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-[320px] overflow-y-auto">
                    <div className="p-2 space-y-1">
                      {availableForms.map((form) => (
                        <button
                          key={form.id}
                          type="button"
                          onClick={() => {
                            setSelectedForm(form.id);
                            setIsFormDropdownOpen(false);
                          }}
                          className={`w-full p-3 rounded-lg transition-all duration-200 text-left ${selectedForm === form.id
                            ? 'bg-primary-50 dark:bg-primary-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${selectedForm === form.id
                              ? 'bg-primary-100 dark:bg-primary-800'
                              : 'bg-gray-100 dark:bg-gray-700'
                              }`}>
                              <FileText size={18} className={
                                selectedForm === form.id
                                  ? 'text-primary-600 dark:text-primary-400'
                                  : 'text-gray-600 dark:text-gray-400'
                              } />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className={`font-semibold text-sm ${selectedForm === form.id
                                  ? 'text-primary-900 dark:text-primary-100'
                                  : 'text-gray-900 dark:text-gray-100'
                                  }`}>
                                  {form.formName}
                                </h4>
                                {selectedForm === form.id && (
                                  <CheckCircle2 size={16} className="text-primary-600 dark:text-primary-400 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {form.fields?.length || 0} fields
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {availableForms.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="mb-2">No active student admission forms available.</p>
                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    className="mt-2"
                    onPress={() => {
                      setIsFormSelectModalOpen(false);
                      navigate('/settings/intake-forms');
                    }}
                  >
                    Create a Form
                  </Button>
                </div>
              )}

              {/* Recipient Email */}
              <FormInput
                label="Parent's Email"
                type="email"
                placeholder="Enter email address"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                startContent={<Mail size={18} />}
              />

              {/* Recipient Phone */}
              <FormInput
                label="Parent's Phone Number"
                type="tel"
                placeholder="Enter phone number"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                startContent={<Phone size={18} />}
              />

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> The parent will receive a link to fill out the admission form. You can review and approve their submission in the Submissions section.
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-gray-200 dark:border-gray-800">
            <Button
              variant="light"
              onPress={() => {
                setIsFormSelectModalOpen(false);
                setSelectedForm(null);
                setRecipientEmail('');
                setRecipientPhone('');
              }}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleSendForm}
              isLoading={isSendingForm}
              isDisabled={!selectedForm || (!recipientEmail && !recipientPhone)}
              startContent={!isSendingForm && <Send size={16} />}
            >
              Send Form
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div >
  );
}
