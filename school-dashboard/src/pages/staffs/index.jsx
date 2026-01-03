import { useState, useRef, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { Tabs, Tab, Button, Drawer, DrawerContent, DrawerHeader, DrawerBody, Card, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { Plus, X, Mail, Phone, Send, UserPlus, FileText, CheckCircle2, ChevronDown } from "lucide-react";
import StaffList from "./StaffList";
import StaffAttendance from "./StaffAttendance";
import StaffPayroll from "./StaffPayroll";
import StaffDashboard from "./StaffDashboard";
import AddStaff from "./AddStaff";
import FormInput from "../../components/FormInput";
import { useApp } from "../../context/AppContext";
import { intakeFormsApi } from "../../services/api";
import toast from "react-hot-toast";

export default function StaffsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addStaff } = useApp();
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [shouldRenderAddStaff, setShouldRenderAddStaff] = useState(false);
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



  const handleOpenStaffProfile = (staffId) => {
    navigate(`/staffs/${staffId}`);
  };

  const activeTab = location.pathname.includes("/staffs/") && location.pathname !== "/staffs/attendance" && location.pathname !== "/staffs/payroll" && location.pathname !== "/staffs" && location.pathname !== "/staffs/"
    ? "profile" // Virtual tab for profile, or just hide tabs if inside profile?
    : (location.pathname === "/staffs/attendance" ? "overview" : location.pathname === "/staffs/payroll" ? "payroll" : "list");

  // If we are in a sub-route like /staffs/:id, we might want to hide the main tabs or keep them?
  // The user interaction assumes clicking a staff opens their dashboard.
  // Usually this means we go to a detail view which might not show the main "All Staffs" tabs.
  const isProfileView = location.pathname !== "/staffs" && location.pathname !== "/staffs/" && location.pathname !== "/staffs/attendance" && location.pathname !== "/staffs/payroll" && !location.pathname.endsWith("/staffs");

  const handleSaveStaff = async (staffData) => {
    // Send all the comprehensive form data to the backend
    const transformedData = {
      // Basic fields (for backward compatibility)
      name: staffData.fullName,
      role: staffData.staffType === "Teaching" ? "Teacher" : staffData.staffType,
      department: staffData.expertise || "General",
      phone: staffData.mobile,
      email: staffData.email,
      status: "active",
      address: staffData.address,
      joinDate: new Date().toISOString().split('T')[0],
      
      // Personal Details
      dob: staffData.dob,
      gender: staffData.gender,
      fatherName: staffData.fatherName,
      bloodGroup: staffData.bloodGroup,
      maritalStatus: staffData.maritalStatus,
      employmentType: staffData.employmentType,
      emergencyContact: staffData.emergencyContact,
      emergencyPhone: staffData.emergencyPhone,
      whatsappNumber: staffData.isWhatsapp ? staffData.mobile : staffData.whatsappNumber,
      
      // Documents (will need to upload these separately if they're files)
      picture: staffData.picture,
      idDocuments: staffData.idDocuments,
      
      // Qualifications
      professionalQualifications: staffData.professionalQualifications,
      totalExperience: staffData.totalExperience,
      previousOrganization: staffData.previousOrganization,
      qualificationDocs: staffData.qualificationDocs,
      
      // Staff Info
      staffNumber: staffData.staffNumber,
      staffType: staffData.staffType,
      expertise: staffData.expertise,
      assignedClasses: staffData.assignedClasses || [],
      isClassTeacher: staffData.isClassTeacher,
      classTeacherOf: staffData.classTeacherOf,
      
      // Bank & Salary
      accountNumber: staffData.accountNumber,
      ifscCode: staffData.ifscCode,
      bankName: staffData.bankName,
      branchName: staffData.branchName,
      salaryTemplate: staffData.salaryTemplate,
      salaryBreakdown: staffData.salaryBreakdown
    };
    
    try {
      await addStaff(transformedData);
      toast.success('Staff member added successfully!');
      setIsAddStaffOpen(false);
      // Delay unmounting to allow smooth close animation
      setTimeout(() => setShouldRenderAddStaff(false), 300);
    } catch (err) {
      console.error('Failed to add staff:', err);
      toast.error('Failed to add staff member');
    }
  };

  const handleOpenAddStaff = () => {
    setIsMethodModalOpen(true);
  };

  const handleSelectMethod = (method) => {
    setIsMethodModalOpen(false);
    if (method === 'full') {
      setShouldRenderAddStaff(true);
      requestAnimationFrame(() => {
        setIsAddStaffOpen(true);
      });
    } else if (method === 'form') {
      // Load available forms and show form selection modal
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

      await intakeFormsApi.assign(selectedForm, {
        emails,
        phones,
        expiresInDays: 30,
        assignedBy: null // Allow backend to handle this
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

  const handleCloseAddStaff = () => {
    setIsAddStaffOpen(false);
    // Delay unmounting to allow smooth close animation
    setTimeout(() => setShouldRenderAddStaff(false), 300);
  };

  const tabHeaderInfo = {
    list: {
      title: "All Staffs",
      description: "Manage staff members, roles, departments, and contact details"
    },
    overview: {
      title: "Staff Attendance",
      description: "Track daily attendance, key metrics, and monthly statistics"
    },
    payroll: {
      title: "Staff Salary & Payroll",
      description: "Manage staff salaries, process payroll logs, and track payments"
    }
  };

  // If viewing a profile, render just the routes, or render routes outside the card structure?
  // The current structure wraps everything in a Card with Tabs.
  // We probably want the Profile to take over the full page.

  if (isProfileView) {
    return (
      <Routes>
        <Route path=":id" element={<StaffDashboard />} />
      </Routes>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <Card className="shadow-sm border border-default-200 bg-background rounded-md">
        <div className="px-6 py-3 border-b border-default-200">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => {
              if (key === "list") navigate("/staffs");
              else if (key === "payroll") navigate("/staffs/payroll");
              else if (key === "overview") navigate("/staffs/attendance");
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
            <Tab key="list" title="All Staff" />
            <Tab key="overview" title="Attendance" />
            <Tab key="payroll" title="Payroll" />
          </Tabs>
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-6 border-b border-default-200 overflow-hidden">
          {activeTab === "list" && (
            <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-orange-200/80 to-transparent blur-3xl pointer-events-none" />
          )}
          <div className="pl-2 relative z-10">
            <h1 className="text-2xl font-medium text-default-900">{tabHeaderInfo[activeTab]?.title}</h1>
            <p className="text-sm text-default-500 mt-1">{tabHeaderInfo[activeTab]?.description}</p>
          </div>
          {activeTab === "list" && (
            <button
              className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg border border-primary hover:bg-primary-600 transition-all duration-200 text-sm cursor-pointer whitespace-nowrap relative z-10"
              onClick={handleOpenAddStaff}
            >
              <Plus size={16} />
              <span>Create Staff</span>
            </button>
          )}
        </div>

        <div className="min-h-[500px] px-6 py-6">
          <Routes>
            <Route index element={<StaffList onStaffClick={handleOpenStaffProfile} />} />
            <Route path="list" element={<StaffList onStaffClick={handleOpenStaffProfile} />} />
            <Route path="attendance" element={<StaffAttendance onStaffClick={handleOpenStaffProfile} />} />
            <Route path="payroll" element={<StaffPayroll onStaffClick={handleOpenStaffProfile} />} />
            <Route path=":id" element={<StaffDashboard />} />
          </Routes>
        </div>
      </Card>

      {/* Add Staff Drawer */}
      {shouldRenderAddStaff && (
        <Drawer
          isOpen={isAddStaffOpen}
          onOpenChange={(open) => {
            if (!open) handleCloseAddStaff();
          }}
          placement="right"
          classNames={{
            wrapper: "justify-end",
            base: "w-[720px] max-w-[95vw]",
            backdrop: "bg-black/30"
          }}
        >
          <DrawerContent>
            <>
              <DrawerHeader className="border-b border-default-200 px-6 py-3 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">New Staff</h2>
                <Button isIconOnly size="sm" variant="light" onPress={handleCloseAddStaff}>
                  <X size={20} className="text-default-500" />
                </Button>
              </DrawerHeader>
              <DrawerBody className="p-0 overflow-y-auto">
                <AddStaff onClose={handleCloseAddStaff} onSave={handleSaveStaff} />
              </DrawerBody>
            </>
          </DrawerContent>
        </Drawer>
      )}

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
            <h3 className="text-xl font-semibold">Choose Registration Method</h3>
            <p className="text-sm text-gray-500 font-normal">Select how you want to add the new staff member</p>
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
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Send Filling Form</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Send an intake form to the staff member's email or phone. They fill it out themselves.
                    </p>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    ✓ Less work for admin<br />
                    ✓ Staff provides their own details<br />
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
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Full Registration</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Fill out all staff details directly in the admin panel. Immediate registration.
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
            <h3 className="text-xl font-semibold">Send Intake Form</h3>
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
                    <span className="text-sm text-gray-500">Choose an intake form</span>
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
                  <p className="mb-2">No active staff forms available.</p>
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
                label="Email"
                type="email"
                placeholder="Enter email address"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                startContent={<Mail size={18} />}
              />

              {/* Recipient Phone */}
              <FormInput
                label="Phone Number"
                type="tel"
                placeholder="Enter phone number"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                startContent={<Phone size={18} />}
              />

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> The recipient will receive a link to fill out the form. You can review and approve their submission in the Submissions section.
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
    </div>
  );
}
