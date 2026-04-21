import { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo } from "react";
import { Button, Spinner, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { AlertTriangle } from "lucide-react";
import CameraCaptureModal from "../../components/CameraCaptureModal";
import ClassSubjectManagementModal from "./components/ClassSubjectManagementModal";
import { usePermissions } from "../../context/PermissionContext";
import { useApp } from "../../context/AppContext";
import { classesApi } from "../../services/api";
import { validatePhone } from "../../utils/validations";
import { getStoredUser } from "../../utils/authSession";
import RevokeRoleModal from "../../components/modals/RevokeRoleModal";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import logger from '../../utils/logger';

import { DEFAULT_DEPARTMENTS, fallbackClassOptions, emptyForm } from "./components/add-staff/constants";
import { buildEditFormData } from "./components/add-staff/populateEditForm";
import { validateSingleField, validateStep } from "./components/add-staff/validation";
import { submitStaffForm } from "./components/add-staff/submitStaff";
import StepPersonalInfo from "./components/add-staff/StepPersonalInfo";
import StepJobDetails from "./components/add-staff/StepJobDetails";
import StepEducation from "./components/add-staff/StepEducation";
import StepDocuments from "./components/add-staff/StepDocuments";
import StepPayroll from "./components/add-staff/StepPayroll";
import StepperHeader from "./components/add-staff/StepperHeader";

const AddStaff = forwardRef(({ onClose, onSave, editingStaff }, ref) => {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const { staff: allStaff } = useApp();
  const canEdit = editingStaff ? hasPermission('staff', 'edit') : hasPermission('staff', 'create');

  // AUDIT-210: Merge hardcoded departments with any custom ones from existing staff
  const departments = useMemo(() => {
    const staffDepts = (allStaff || []).map(s => s.department).filter(Boolean);
    return [...new Set([...DEFAULT_DEPARTMENTS, ...staffDepts])].sort();
  }, [allStaff]);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraCaptureOpen, setIsCameraCaptureOpen] = useState(false);

  // Create blob URL once per picture change to avoid memory leaks
  const picturePreviewUrl = useMemo(() => {
    if (!formData.picture || !(formData.picture instanceof File)) return null;
    return URL.createObjectURL(formData.picture);
  }, [formData.picture]);

  useEffect(() => {
    return () => {
      if (picturePreviewUrl) URL.revokeObjectURL(picturePreviewUrl);
    };
  }, [picturePreviewUrl]);

  const [showClassSubjectModal, setShowClassSubjectModal] = useState(false);
  const [createdStaffId, setCreatedStaffId] = useState(null);
  const [createdStaffName, setCreatedStaffName] = useState("");
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Self admin-role revocation confirmation
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const selfRevokeConfirmed = useRef(false);

  // Populate form with editingStaff data when editing
  useEffect(() => {
    if (editingStaff) {
      setFormData(buildEditFormData(editingStaff));
    }
    // In CREATE mode, staffNumber is left empty — the backend auto-generates it
  }, [editingStaff]);

  // Fetch available classes from the API
  useEffect(() => {
    const fetchClasses = async () => {
      setLoadingClasses(true);
      try {
        const classes = await classesApi.getPublic();
        setAvailableClasses(classes || []);
      } catch (error) {
        logger.error('Failed to fetch classes:', error);
        setAvailableClasses(fallbackClassOptions.map(c => ({ id: c, displayName: c })));
      } finally {
        setLoadingClasses(false);
      }
    };
    fetchClasses();
  }, []);

  const handleClose = () => {
    if (hasChanges) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  const confirmClose = () => { setShowConfirmClose(false); onClose(); };
  const cancelClose = () => setShowConfirmClose(false);

  useImperativeHandle(ref, () => ({
    attemptClose: handleClose,
    hasUnsavedChanges: () => hasChanges
  }));

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    validateSingleField({ field, value, editingStaff, allStaff, setErrors });
  };

  const runValidateStep = (stepNum) =>
    validateStep({ stepNum, formData, editingStaff, allStaff, setErrors });

  // --- Qualification helpers ---
  const addQualification = () => {
    updateField("professionalQualifications", [...(formData.professionalQualifications || []), { name: "", year: "", documents: [] }]);
  };

  const removeQualification = (index) => {
    updateField("professionalQualifications", (formData.professionalQualifications || []).filter((_, i) => i !== index));
  };

  const updateQualification = (index, field, value) => {
    const updated = [...(formData.professionalQualifications || [])];
    updated[index][field] = value;
    updateField("professionalQualifications", updated);
    if (field === "name") {
      setErrors(prev => ({ ...prev, [`qualName_${index}`]: !value ? "Required" : null }));
    }
    if (field === "year") {
      let error = null;
      if (value && !/^\d{4}$/.test(value)) error = "Invalid Year";
      if (value && (parseInt(value) < 1950 || parseInt(value) > new Date().getFullYear())) error = "Invalid Year";
      setErrors(prev => ({ ...prev, [`qualYear_${index}`]: error }));
    }
  };

  const handleQualificationDocUpload = (index, files) => {
    const updated = [...(formData.professionalQualifications || [])];
    updated[index].documents = [...(updated[index].documents || []), ...Array.from(files)];
    updateField("professionalQualifications", updated);
  };

  const removeQualificationDoc = (qualIndex, docIndex) => {
    const updated = [...(formData.professionalQualifications || [])];
    updated[qualIndex].documents = updated[qualIndex].documents.filter((_, i) => i !== docIndex);
    updateField("professionalQualifications", updated);
  };

  // --- File helpers ---
  const handleFileUpload = (field, files) => {
    if (files && files.length > 0) {
      updateField(field, [...formData[field], ...Array.from(files)]);
    }
  };

  const removeFile = (field, index) => {
    updateField(field, formData[field].filter((_, i) => i !== index));
  };

  // --- Navigation ---
  const handleNext = () => {
    if (runValidateStep(step)) {
      setStep(prev => Math.min(prev + 1, 5));
    } else {
      toast.error('Please fix the highlighted errors before proceeding');
    }
  };

  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

  // --- Submit ---
  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    for (let s = 1; s <= 5; s++) {
      if (!runValidateStep(s)) {
        setStep(s);
        toast.error(`Please fix errors in step ${s} before submitting`);
        return;
      }
    }

    // Warn if the current user is removing the Admin role from their own account
    if (!selfRevokeConfirmed.current && editingStaff) {
      const storedUser = getStoredUser();
      if (storedUser?.id && editingStaff.id === storedUser.id) {
        const originalRoles = Array.isArray(editingStaff.role) ? editingStaff.role : [editingStaff.role].filter(Boolean);
        if (originalRoles.includes('Admin') && !formData.staffType.includes('Admin')) {
          setShowRevokeModal(true);
          return;
        }
      }
    }
    selfRevokeConfirmed.current = false;

    setIsSubmitting(true);
    try {
      const { savedStaff, staffData } = await submitStaffForm({ formData, onSave });
      if (!editingStaff && savedStaff) {
        setCreatedStaffId(savedStaff._id || savedStaff.id);
        setCreatedStaffName(staffData.name);
        setShowClassSubjectModal(true);
      }
      setIsSubmitting(false);
    } catch (error) {
      logger.error('Error submitting staff:', error);
      toast.error(error?.message || (editingStaff ? 'Failed to update staff member' : 'Failed to create staff member'));
      setIsSubmitting(false);
    }
  };

  // --- Photo handlers ---
  const handleEditorSave = (croppedBlob) => {
    const file = new File([croppedBlob], "profile_photo.jpg", { type: "image/jpeg" });
    updateField("picture", file);
  };

  const handleCameraPhotoCapture = (file) => {
    updateField("picture", file);
  };

  // --- Emergency contacts ---
  const handleEmergencyContactChange = (index, field, value) => {
    if (field === "phone") {
      if (!/^[+\d\s\-()]*$/.test(value)) return;
      if (value.length > 20) return;
    }
    const updated = [...formData.emergencyContacts];
    updated[index][field] = value;
    updateField("emergencyContacts", updated);
    if (field === "phone") {
      let phoneError = null;
      const digits = value ? value.replace(/\D/g, '') : '';
      if (value && digits.length > 0 && digits.length < 7) {
        phoneError = "Too short — minimum 7 digits";
      } else if (value && !validatePhone(value)) {
        phoneError = "Invalid phone number";
      }
      setErrors(prev => ({ ...prev, [`emergencyPhone_${index}`]: phoneError }));
    }
  };

  const addEmergencyContact = () => {
    const maxKey = formData.emergencyContacts.reduce((max, c) => Math.max(max, c._key || 0), 0);
    updateField("emergencyContacts", [...formData.emergencyContacts, { _key: maxKey + 1, name: "", relationship: "", phone: "" }]);
  };

  const removeEmergencyContact = (index) => {
    updateField("emergencyContacts", formData.emergencyContacts.filter((_, i) => i !== index));
  };

  // --- ID Proof handlers ---
  const handleIDProofUpload = (type, files) => {
    if (files && files.length > 0) {
      const filtered = formData.idDocuments.filter(doc => doc.type !== type);
      const updated = [...filtered, { type, file: files[0], name: files[0].name }];
      updateField("idDocuments", updated);
    }
  };

  const removeIDProof = (type) => {
    updateField("idDocuments", formData.idDocuments.filter(doc => doc.type !== type));
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Permission Warning */}
      {!canEdit && (
        <div className="px-8 py-3 bg-warning-50 border-b border-warning-200">
          <div className="flex items-center gap-2 text-warning-700">
            <AlertTriangle size={16} />
            <span className="text-sm font-medium">
              {editingStaff
                ? "You don't have permission to edit staff members. All fields are read-only."
                : "You don't have permission to create staff members."}
            </span>
          </div>
        </div>
      )}

      {/* Elegant Stepper */}
      <StepperHeader step={step} />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-2 custom-scrollbar">
        <div className="max-w-2xl mx-auto">
          {step === 1 && (
            <StepPersonalInfo
              formData={formData}
              errors={errors}
              updateField={updateField}
              picturePreviewUrl={picturePreviewUrl}
              isEditorOpen={isEditorOpen}
              setIsEditorOpen={setIsEditorOpen}
              tempImage={tempImage}
              handleEditorSave={handleEditorSave}
              setIsCameraCaptureOpen={setIsCameraCaptureOpen}
              handleEmergencyContactChange={handleEmergencyContactChange}
              addEmergencyContact={addEmergencyContact}
              removeEmergencyContact={removeEmergencyContact}
            />
          )}
          {step === 2 && (
            <StepJobDetails
              formData={formData}
              errors={errors}
              updateField={updateField}
              departments={departments}
              availableClasses={availableClasses}
              loadingClasses={loadingClasses}
            />
          )}
          {step === 3 && (
            <StepEducation
              formData={formData}
              errors={errors}
              updateField={updateField}
              editingStaff={editingStaff}
              addQualification={addQualification}
              removeQualification={removeQualification}
              updateQualification={updateQualification}
              handleQualificationDocUpload={handleQualificationDocUpload}
              removeQualificationDoc={removeQualificationDoc}
            />
          )}
          {step === 4 && (
            <StepDocuments
              formData={formData}
              updateField={updateField}
              handleIDProofUpload={handleIDProofUpload}
              removeIDProof={removeIDProof}
              handleFileUpload={handleFileUpload}
              removeFile={removeFile}
            />
          )}
          {step === 5 && (
            <StepPayroll
              formData={formData}
              errors={errors}
              updateField={updateField}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-6 flex justify-center gap-4 border-t border-default-100">
        <Button className="w-32 font-medium" variant="light" onPress={handleClose}>
          Cancel
        </Button>
        {step > 1 && (
          <Button className="w-32 font-medium border-default-200 text-default-700" variant="bordered" onPress={handlePrev}>
            Back
          </Button>
        )}
        <Button
          className="w-32 font-medium shadow-lg shadow-primary/20"
          color="primary"
          onPress={step === 5 ? handleSubmit : handleNext}
          isDisabled={isSubmitting || !canEdit}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" color="white" />
              {step === 5 ? (editingStaff ? "Updating..." : "Creating...") : "Processing..."}
            </span>
          ) : (
            step === 5 ? (editingStaff ? "Update Staff" : "Create Staff") : "Next"
          )}
        </Button>
      </div>

      {/* Confirmation Modal */}
      <Modal isOpen={showConfirmClose} onClose={cancelClose} size="sm" isDismissable={false} hideCloseButton portalContainer={document.body} classNames={{ base: "z-[999999]", wrapper: "z-[999999]", backdrop: "z-[999999]" }}>
        <ModalContent>
          <ModalHeader className="flex gap-2 items-center">
            <AlertTriangle size={20} className="text-warning" />
            <span>{t('pages.unsavedChanges')}</span>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-600">
              You have unsaved changes. Are you sure you want to close without saving?
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={cancelClose}>Continue Editing</Button>
            <Button color="danger" onPress={confirmClose}>Discard Changes</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraCaptureOpen}
        onClose={() => setIsCameraCaptureOpen(false)}
        onPhotoCaptured={handleCameraPhotoCapture}
      />

      {/* Class & Subject Management Modal */}
      <ClassSubjectManagementModal
        isOpen={showClassSubjectModal}
        onClose={() => { setShowClassSubjectModal(false); onClose(); }}
        staffId={createdStaffId}
        staffName={createdStaffName}
      />

      {/* Self admin-role revocation warning */}
      <RevokeRoleModal
        isOpen={showRevokeModal}
        onClose={() => setShowRevokeModal(false)}
        onConfirm={() => {
          setShowRevokeModal(false);
          selfRevokeConfirmed.current = true;
          handleSubmit();
        }}
        isLoading={isSubmitting}
      />
    </div>
  );
});

export default AddStaff;
