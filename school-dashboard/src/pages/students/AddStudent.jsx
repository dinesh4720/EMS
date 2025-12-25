import { useState, useRef } from "react";
import { Button, Input, Select, SelectItem, Checkbox, Textarea, Chip, Avatar, RadioGroup, Radio, cn, Divider } from "@heroui/react";
import { ArrowLeft, ArrowRight, Upload, X, Plus, User, FileText, Users, GraduationCap, Check, Heart, Bus } from "lucide-react";

// --- Constants ---
const genders = ["Male", "Female", "Other"];
const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const relationships = ["Father", "Mother", "Guardian", "Grandparent", "Uncle", "Aunt", "Other"];
const academicYears = ["2024-25", "2025-26", "2023-24"];
const mediumOptions = ["English", "Hindi", "Regional"];
const houseOptions = ["Red House", "Blue House", "Green House", "Yellow House"];

const emptyForm = {
  // Personal Information
  fullName: "", admissionId: "", academicYear: "2024-25", dateOfBirth: "", gender: "Male",
  picture: null, aadhaarNumber: "", bloodGroup: "", nationality: "", religion: "",
  category: "", motherTongue: "", previousSchool: "", tcNumber: "",
  // Class Info
  class: "", section: "", rollNumber: "", mediumOfInstruction: "", house: "",
  // Contact
  mobile: "", isWhatsapp: true, whatsappNumber: "", email: "", address: "",
  // Parent/Guardian 1
  parents: [{
    name: "", relationship: "Father", phone: "", email: "", occupation: "", isWhatsapp: true
  }],
  alternatePhone: "",
  // Health & Safety
  medicalConditions: "", emergencyContactName: "", emergencyContactPhone: "",
  // Transport & Hostel
  transportRequired: false, hostelRequired: false,
  // Documents
  birthCertificate: null, transferCertificate: null, aadhaarDoc: null, studentPhoto: null, otherDocuments: []
};

export default function AddStudent({ onClose, onSave, classOptions = [], classesWithTeachers = [] }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  // Refs
  const pictureInputRef = useRef(null);
  const birthCertRef = useRef(null);
  const tcRef = useRef(null);
  const aadhaarRef = useRef(null);
  const photoRef = useRef(null);
  const otherDocsRef = useRef(null);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const updateParent = (index, field, value) => {
    const updated = [...formData.parents];
    updated[index] = { ...updated[index], [field]: value };
    updateField("parents", updated);
  };

  const addParent = () => {
    if (formData.parents.length < 3) {
      updateField("parents", [...formData.parents, { name: "", relationship: "Mother", phone: "", email: "", occupation: "", isWhatsapp: true }]);
    }
  };

  const removeParent = (index) => {
    if (formData.parents.length > 1) {
      updateField("parents", formData.parents.filter((_, i) => i !== index));
    }
  };

  const handleFileUpload = (field, file) => {
    if (file) {
      updateField(field, file);
    }
  };

  const handleMultiFileUpload = (field, files) => {
    if (files && files.length > 0) {
      updateField(field, [...formData[field], ...Array.from(files)]);
    }
  };

  const removeFile = (field, index) => {
    if (Array.isArray(formData[field])) {
      updateField(field, formData[field].filter((_, i) => i !== index));
    } else {
      updateField(field, null);
    }
  };

  const validateStep = (stepNum) => {
    const newErrors = {};
    if (stepNum === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = "Required";
      if (!formData.admissionId.trim()) newErrors.admissionId = "Required";
      if (!formData.class) newErrors.class = "Required";
    }
    if (stepNum === 2) {
      if (formData.parents.length === 0 || !formData.parents[0].name.trim()) {
        newErrors.parentName = "At least one parent/guardian is required";
      }
      if (formData.parents[0] && !formData.parents[0].phone.trim()) {
        newErrors.parentPhone = "Phone is required";
      } else if (formData.parents[0] && !/^\d{10}$/.test(formData.parents[0].phone)) {
        newErrors.parentPhone = "Invalid phone (10 digits)";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep(prev => Math.min(prev + 1, 3));
  };

  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = () => {
    if (validateStep(step)) {
      // Find the classId from the selected class
      const selectedClass = classesWithTeachers.find(c => `${c.name}-${c.section}` === formData.class);
      
      // Transform data for saving
      const studentData = {
        name: formData.fullName,
        admissionId: formData.admissionId,
        academicYear: formData.academicYear,
        classId: selectedClass?.id,
        rollNo: formData.rollNumber ? parseInt(formData.rollNumber) : null,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        bloodGroup: formData.bloodGroup,
        email: formData.email,
        phone: formData.mobile,
        address: formData.address,
        parentName: formData.parents[0]?.name,
        parentPhone: formData.parents[0]?.phone,
        parentEmail: formData.parents[0]?.email,
        parentRelationship: formData.parents[0]?.relationship,
        parentOccupation: formData.parents[0]?.occupation,
        parents: formData.parents,
        alternatePhone: formData.alternatePhone,
        aadhaarNumber: formData.aadhaarNumber,
        nationality: formData.nationality,
        religion: formData.religion,
        category: formData.category,
        motherTongue: formData.motherTongue,
        previousSchool: formData.previousSchool,
        tcNumber: formData.tcNumber,
        mediumOfInstruction: formData.mediumOfInstruction,
        house: formData.house,
        transportRequired: formData.transportRequired,
        hostelRequired: formData.hostelRequired,
        medicalConditions: formData.medicalConditions,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        photo: formData.picture,
        status: "active",
        feeStatus: "pending"
      };
      onSave(studentData);
    }
  };

  // --- Render Steps ---
  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Profile Section */}
      <div className="flex items-center gap-5">
        <Avatar
          src={formData.picture ? URL.createObjectURL(formData.picture) : undefined}
          name={!formData.picture ? (formData.fullName?.[0] || "") : undefined}
          className="w-20 h-20 text-3xl"
          isBordered
          radius="full"
          color="primary"
        />
        <div className="flex flex-col gap-1 text-left">
          <div className="flex items-center gap-3">
            <button
              className="text-sm font-semibold text-primary hover:text-primary-600 transition-colors cursor-pointer"
              onClick={() => pictureInputRef.current?.click()}
            >
              Upload Photo
            </button>
            <span className="text-gray-300">|</span>
            <button
              className="text-sm font-semibold text-danger hover:text-danger-600 transition-colors cursor-pointer"
              onClick={() => updateField("picture", null)}
            >
              Delete
            </button>
          </div>
          <p className="text-xs text-gray-500 max-w-[250px]">
            Upload a passport-size photo of the student
          </p>
          <input ref={pictureInputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => updateField("picture", e.target.files[0])} />
        </div>
      </div>

      {/* Academic Year & Admission ID */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-900">Admission Details</label>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Admission ID"
            labelPlacement="outside"
            placeholder="e.g., ADM2024001"
            value={formData.admissionId}
            onValueChange={v => updateField("admissionId", v)}
            isInvalid={!!errors.admissionId}
            errorMessage={errors.admissionId}
            variant="bordered"
            radius="sm"
            isRequired
            classNames={{ inputWrapper: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
          />
          <Select
            label="Academic Year"
            labelPlacement="outside"
            placeholder="Select..."
            selectedKeys={formData.academicYear ? [formData.academicYear] : []}
            onSelectionChange={keys => updateField("academicYear", Array.from(keys)[0])}
            variant="bordered"
            radius="sm"
            classNames={{ trigger: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
          >
            {academicYears.map(y => <SelectItem key={y}>{y}</SelectItem>)}
          </Select>
        </div>
      </div>

      {/* Personal Information */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-900">Personal Information</label>
        <Input
          label="Full Name"
          labelPlacement="outside"
          placeholder="Enter student's full name"
          value={formData.fullName}
          onValueChange={v => updateField("fullName", v)}
          isInvalid={!!errors.fullName}
          errorMessage={errors.fullName}
          variant="bordered"
          radius="sm"
          isRequired
          classNames={{ inputWrapper: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          type="date"
          label="Date of Birth"
          labelPlacement="outside"
          value={formData.dateOfBirth}
          onValueChange={v => updateField("dateOfBirth", v)}
          variant="bordered"
          radius="sm"
          classNames={{ inputWrapper: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
        />
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Gender</label>
          <RadioGroup
            orientation="horizontal"
            value={formData.gender}
            onValueChange={v => updateField("gender", v)}
            classNames={{ wrapper: "gap-4" }}
          >
            {genders.map(g => (
              <Radio key={g} value={g} size="sm" classNames={{ label: "text-sm" }}>{g}</Radio>
            ))}
          </RadioGroup>
        </div>
      </div>

      {/* Class Info */}
      <div className="space-y-2 pt-2 border-t border-dashed border-gray-200">
        <label className="text-sm font-semibold text-gray-900 block mt-2">Class Information</label>
        <div className="grid grid-cols-3 gap-4">
          <Select
            label="Class"
            labelPlacement="outside"
            placeholder="Select..."
            selectedKeys={formData.class ? [formData.class] : []}
            onSelectionChange={keys => updateField("class", Array.from(keys)[0])}
            isInvalid={!!errors.class}
            errorMessage={errors.class}
            variant="bordered"
            radius="sm"
            isRequired
            classNames={{ trigger: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
          >
            {classOptions.map(c => <SelectItem key={c}>{c}</SelectItem>)}
          </Select>
          <Input
            label="Roll Number"
            labelPlacement="outside"
            placeholder="Optional"
            value={formData.rollNumber}
            onValueChange={v => updateField("rollNumber", v)}
            variant="bordered"
            radius="sm"
            classNames={{ inputWrapper: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
          />
          <Select
            label="Medium"
            labelPlacement="outside"
            placeholder="Select..."
            selectedKeys={formData.mediumOfInstruction ? [formData.mediumOfInstruction] : []}
            onSelectionChange={keys => updateField("mediumOfInstruction", Array.from(keys)[0])}
            variant="bordered"
            radius="sm"
            classNames={{ trigger: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
          >
            {mediumOptions.map(m => <SelectItem key={m}>{m}</SelectItem>)}
          </Select>
        </div>
        <Select
          label="House / Group"
          labelPlacement="outside"
          placeholder="Select house (optional)"
          selectedKeys={formData.house ? [formData.house] : []}
          onSelectionChange={keys => updateField("house", Array.from(keys)[0])}
          variant="bordered"
          radius="sm"
          classNames={{ trigger: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
        >
          {houseOptions.map(h => <SelectItem key={h}>{h}</SelectItem>)}
        </Select>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 pt-2 border-t border-dashed border-gray-200">
        <label className="text-sm font-semibold text-gray-900 block mt-2">Contact Details</label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Input
              label="Mobile Number"
              labelPlacement="outside"
              startContent={<span className="text-gray-400 text-xs">+91</span>}
              placeholder="Student's mobile (if any)"
              value={formData.mobile}
              onValueChange={v => updateField("mobile", v)}
              variant="bordered"
              radius="sm"
              classNames={{ inputWrapper: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
            />
            <Checkbox size="sm" isSelected={formData.isWhatsapp} onValueChange={v => updateField("isWhatsapp", v)}
              classNames={{ label: "text-xs text-gray-500" }}>
              Same as WhatsApp
            </Checkbox>
          </div>
          {!formData.isWhatsapp && (
            <Input
              label="WhatsApp Number"
              labelPlacement="outside"
              startContent={<span className="text-gray-400 text-xs">+91</span>}
              placeholder="WhatsApp Number"
              value={formData.whatsappNumber}
              onValueChange={v => updateField("whatsappNumber", v)}
              variant="bordered"
              radius="sm"
              classNames={{ inputWrapper: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
            />
          )}
        </div>
        <Input
          label="Email Address"
          labelPlacement="outside"
          placeholder="student@email.com"
          value={formData.email}
          onValueChange={v => updateField("email", v)}
          variant="bordered"
          radius="sm"
          classNames={{ inputWrapper: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
        />
        <Textarea
          label="Address"
          labelPlacement="outside"
          placeholder="Full residential address"
          value={formData.address}
          onValueChange={v => updateField("address", v)}
          variant="bordered"
          radius="sm"
          minRows={2}
          classNames={{ inputWrapper: "bg-white border-1 border-gray-200 hover:border-gray-300" }}
        />
      </div>

      {/* Optional Fields */}
      <div className="space-y-2 pt-2 border-t border-dashed border-gray-200">
        <label className="text-sm font-semibold text-gray-900 block mt-2">Optional Information</label>
        <p className="text-xs text-gray-500 mb-3">These fields are optional and can be filled later</p>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Aadhaar Number"
            labelPlacement="outside"
            placeholder="12 digit Aadhaar"
            value={formData.aadhaarNumber}
            onValueChange={v => updateField("aadhaarNumber", v)}
            variant="bordered"
            radius="sm"
            classNames={{ inputWrapper: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
          />
          <Select
            label="Blood Group"
            labelPlacement="outside"
            placeholder="Select..."
            selectedKeys={formData.bloodGroup ? [formData.bloodGroup] : []}
            onSelectionChange={keys => updateField("bloodGroup", Array.from(keys)[0])}
            variant="bordered"
            radius="sm"
            classNames={{ trigger: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
          >
            {bloodGroups.map(b => <SelectItem key={b}>{b}</SelectItem>)}
          </Select>
          <Input
            label="Nationality"
            labelPlacement="outside"
            placeholder="e.g., Indian"
            value={formData.nationality}
            onValueChange={v => updateField("nationality", v)}
            variant="bordered"
            radius="sm"
            classNames={{ inputWrapper: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
          />
          <Input
            label="Religion"
            labelPlacement="outside"
            placeholder="Optional"
            value={formData.religion}
            onValueChange={v => updateField("religion", v)}
            variant="bordered"
            radius="sm"
            classNames={{ inputWrapper: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
          />
          <Input
            label="Category"
            labelPlacement="outside"
            placeholder="e.g., General, OBC, SC, ST"
            value={formData.category}
            onValueChange={v => updateField("category", v)}
            variant="bordered"
            radius="sm"
            classNames={{ inputWrapper: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
          />
          <Input
            label="Mother Tongue"
            labelPlacement="outside"
            placeholder="e.g., Hindi, Tamil"
            value={formData.motherTongue}
            onValueChange={v => updateField("motherTongue", v)}
            variant="bordered"
            radius="sm"
            classNames={{ inputWrapper: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
          />
          <Input
            label="Previous School"
            labelPlacement="outside"
            placeholder="Name of previous school"
            value={formData.previousSchool}
            onValueChange={v => updateField("previousSchool", v)}
            variant="bordered"
            radius="sm"
            className="col-span-2"
            classNames={{ inputWrapper: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
          />
          <Input
            label="Transfer Certificate No."
            labelPlacement="outside"
            placeholder="TC Number"
            value={formData.tcNumber}
            onValueChange={v => updateField("tcNumber", v)}
            variant="bordered"
            radius="sm"
            className="col-span-2"
            classNames={{ inputWrapper: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Parents/Guardians */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold text-gray-900">Parents / Guardians</label>
          {formData.parents.length < 3 && (
            <Button size="sm" color="primary" variant="flat" onPress={addParent} className="h-8 text-xs">
              <Plus size={14} /> Add Another Parent
            </Button>
          )}
        </div>

        {formData.parents.map((parent, index) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                {index === 0 ? "Primary Contact" : `Parent/Guardian ${index + 1}`}
              </span>
              {index > 0 && (
                <Button size="sm" variant="light" color="danger" onPress={() => removeParent(index)}>
                  <X size={14} /> Remove
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Full Name"
                labelPlacement="outside"
                placeholder="Parent/Guardian name"
                value={parent.name}
                onValueChange={v => updateParent(index, "name", v)}
                isInvalid={index === 0 && !!errors.parentName}
                errorMessage={index === 0 ? errors.parentName : ""}
                variant="bordered"
                radius="sm"
                isRequired={index === 0}
                classNames={{ inputWrapper: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
              />
              <Select
                label="Relationship"
                labelPlacement="outside"
                placeholder="Select..."
                selectedKeys={parent.relationship ? [parent.relationship] : []}
                onSelectionChange={keys => updateParent(index, "relationship", Array.from(keys)[0])}
                variant="bordered"
                radius="sm"
                classNames={{ trigger: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
              >
                {relationships.map(r => <SelectItem key={r}>{r}</SelectItem>)}
              </Select>
              <div className="space-y-2">
                <Input
                  label="Phone Number"
                  labelPlacement="outside"
                  startContent={<span className="text-gray-400 text-xs">+91</span>}
                  placeholder="10 digit number"
                  value={parent.phone}
                  onValueChange={v => updateParent(index, "phone", v)}
                  isInvalid={index === 0 && !!errors.parentPhone}
                  errorMessage={index === 0 ? errors.parentPhone : ""}
                  variant="bordered"
                  radius="sm"
                  isRequired={index === 0}
                  classNames={{ inputWrapper: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
                />
                <Checkbox size="sm" isSelected={parent.isWhatsapp} onValueChange={v => updateParent(index, "isWhatsapp", v)}
                  classNames={{ label: "text-xs text-gray-500" }}>
                  Same as WhatsApp
                </Checkbox>
              </div>
              <Input
                label="Email"
                labelPlacement="outside"
                placeholder="parent@email.com"
                value={parent.email}
                onValueChange={v => updateParent(index, "email", v)}
                variant="bordered"
                radius="sm"
                classNames={{ inputWrapper: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
              />
              <Input
                label="Occupation"
                labelPlacement="outside"
                placeholder="e.g., Engineer, Doctor"
                value={parent.occupation}
                onValueChange={v => updateParent(index, "occupation", v)}
                variant="bordered"
                radius="sm"
                className="col-span-2"
                classNames={{ inputWrapper: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Alternate Contact */}
      <div className="space-y-2 pt-2 border-t border-dashed border-gray-200">
        <label className="text-sm font-semibold text-gray-900 block mt-2">Alternate Contact</label>
        <Input
          label="Alternate Mobile Number"
          labelPlacement="outside"
          startContent={<span className="text-gray-400 text-xs">+91</span>}
          placeholder="Optional alternate number"
          value={formData.alternatePhone}
          onValueChange={v => updateField("alternatePhone", v)}
          variant="bordered"
          radius="sm"
          classNames={{ inputWrapper: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
        />
      </div>

      {/* Health & Safety */}
      <div className="space-y-2 pt-2 border-t border-dashed border-gray-200">
        <label className="text-sm font-semibold text-gray-900 block mt-2">Health & Safety</label>
        <Textarea
          label="Medical Conditions"
          labelPlacement="outside"
          placeholder="Any allergies, medical conditions, or special needs (optional)"
          value={formData.medicalConditions}
          onValueChange={v => updateField("medicalConditions", v)}
          variant="bordered"
          radius="sm"
          minRows={2}
          classNames={{ inputWrapper: "bg-white border-1 border-gray-200 hover:border-gray-300" }}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Emergency Contact Name"
            labelPlacement="outside"
            placeholder="Name"
            value={formData.emergencyContactName}
            onValueChange={v => updateField("emergencyContactName", v)}
            variant="bordered"
            radius="sm"
            classNames={{ inputWrapper: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
          />
          <Input
            label="Emergency Contact Phone"
            labelPlacement="outside"
            startContent={<span className="text-gray-400 text-xs">+91</span>}
            placeholder="Phone number"
            value={formData.emergencyContactPhone}
            onValueChange={v => updateField("emergencyContactPhone", v)}
            variant="bordered"
            radius="sm"
            classNames={{ inputWrapper: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
          />
        </div>
      </div>

      {/* Transport & Hostel */}
      <div className="space-y-4 pt-2 border-t border-dashed border-gray-200">
        <label className="text-sm font-semibold text-gray-900 block mt-2">Additional Requirements</label>
        <div className="grid grid-cols-2 gap-4">
          <div className={cn(
            "cursor-pointer rounded-xl border-2 p-4 flex items-center gap-3 transition-all",
            formData.transportRequired ? "border-primary bg-primary-50/20" : "border-gray-200 hover:border-gray-300"
          )} onClick={() => updateField("transportRequired", !formData.transportRequired)}>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              formData.transportRequired ? "bg-primary text-white" : "bg-gray-100 text-gray-400"
            )}>
              <Bus size={20} />
            </div>
            <div>
              <span className={cn("text-sm font-medium", formData.transportRequired ? "text-primary-700" : "text-gray-600")}>
                Transport Required
              </span>
              <p className="text-xs text-gray-500">School bus facility</p>
            </div>
          </div>
          <div className={cn(
            "cursor-pointer rounded-xl border-2 p-4 flex items-center gap-3 transition-all",
            formData.hostelRequired ? "border-primary bg-primary-50/20" : "border-gray-200 hover:border-gray-300"
          )} onClick={() => updateField("hostelRequired", !formData.hostelRequired)}>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              formData.hostelRequired ? "bg-primary text-white" : "bg-gray-100 text-gray-400"
            )}>
              <Heart size={20} />
            </div>
            <div>
              <span className={cn("text-sm font-medium", formData.hostelRequired ? "text-primary-700" : "text-gray-600")}>
                Hostel Required
              </span>
              <p className="text-xs text-gray-500">Boarding facility</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-900">Document Uploads</label>
        <p className="text-xs text-gray-500">Upload required documents. All documents are optional and can be uploaded later.</p>
      </div>

      {/* Birth Certificate */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-600">Birth Certificate</label>
        <div
          className="border border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => birthCertRef.current?.click()}
        >
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-gray-400" />
            {formData.birthCertificate ? (
              <span className="text-sm text-gray-700">{formData.birthCertificate.name}</span>
            ) : (
              <span className="text-sm text-gray-500">Click to upload birth certificate</span>
            )}
          </div>
          {formData.birthCertificate ? (
            <Button size="sm" variant="light" color="danger" onPress={(e) => { e.stopPropagation(); updateField("birthCertificate", null); }}>
              <X size={14} />
            </Button>
          ) : (
            <Upload size={16} className="text-gray-400" />
          )}
        </div>
        <input ref={birthCertRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
          onChange={(e) => handleFileUpload("birthCertificate", e.target.files[0])} />
      </div>

      {/* Transfer Certificate */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-600">Transfer Certificate (TC)</label>
        <div
          className="border border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => tcRef.current?.click()}
        >
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-gray-400" />
            {formData.transferCertificate ? (
              <span className="text-sm text-gray-700">{formData.transferCertificate.name}</span>
            ) : (
              <span className="text-sm text-gray-500">Click to upload transfer certificate</span>
            )}
          </div>
          {formData.transferCertificate ? (
            <Button size="sm" variant="light" color="danger" onPress={(e) => { e.stopPropagation(); updateField("transferCertificate", null); }}>
              <X size={14} />
            </Button>
          ) : (
            <Upload size={16} className="text-gray-400" />
          )}
        </div>
        <input ref={tcRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
          onChange={(e) => handleFileUpload("transferCertificate", e.target.files[0])} />
      </div>

      {/* Aadhaar */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-600">Aadhaar Card (if provided)</label>
        <div
          className="border border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => aadhaarRef.current?.click()}
        >
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-gray-400" />
            {formData.aadhaarDoc ? (
              <span className="text-sm text-gray-700">{formData.aadhaarDoc.name}</span>
            ) : (
              <span className="text-sm text-gray-500">Click to upload Aadhaar card</span>
            )}
          </div>
          {formData.aadhaarDoc ? (
            <Button size="sm" variant="light" color="danger" onPress={(e) => { e.stopPropagation(); updateField("aadhaarDoc", null); }}>
              <X size={14} />
            </Button>
          ) : (
            <Upload size={16} className="text-gray-400" />
          )}
        </div>
        <input ref={aadhaarRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
          onChange={(e) => handleFileUpload("aadhaarDoc", e.target.files[0])} />
      </div>

      {/* Student Photo */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-600">Student Photograph</label>
        <div
          className="border border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => photoRef.current?.click()}
        >
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-gray-400" />
            {formData.studentPhoto ? (
              <span className="text-sm text-gray-700">{formData.studentPhoto.name}</span>
            ) : (
              <span className="text-sm text-gray-500">Click to upload passport photo</span>
            )}
          </div>
          {formData.studentPhoto ? (
            <Button size="sm" variant="light" color="danger" onPress={(e) => { e.stopPropagation(); updateField("studentPhoto", null); }}>
              <X size={14} />
            </Button>
          ) : (
            <Upload size={16} className="text-gray-400" />
          )}
        </div>
        <input ref={photoRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => handleFileUpload("studentPhoto", e.target.files[0])} />
      </div>

      {/* Other Documents */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-600">Other Documents</label>
        <div
          className="border border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => otherDocsRef.current?.click()}
        >
          <Upload size={14} className="text-gray-500" />
          <span className="text-sm text-gray-600">Upload additional documents</span>
        </div>
        <input ref={otherDocsRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden"
          onChange={(e) => handleMultiFileUpload("otherDocuments", e.target.files)} />
        {formData.otherDocuments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.otherDocuments.map((file, i) => (
              <Chip key={i} onClose={() => removeFile("otherDocuments", i)} size="sm" variant="flat" className="h-8 border border-gray-200 bg-white">
                {file.name}
              </Chip>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const steps = [
    { number: 1, title: "Personal Info", icon: User },
    { number: 2, title: "Parents & Health", icon: Users },
    { number: 3, title: "Documents", icon: FileText }
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Stepper */}
      <div className="px-8 py-6">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-[20px] left-0 right-0 h-[1.5px] border-t-2 border-dashed border-gray-200 -z-0" />
          {steps.map((s) => {
            const isActive = step >= s.number;
            const isCurrent = step === s.number;
            return (
              <div key={s.number} className="flex flex-col items-center relative z-10 bg-white px-2">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                  isCurrent ? "border-primary text-primary bg-primary-50" :
                    isActive ? "border-primary text-white bg-primary" :
                      "border-gray-200 text-gray-400 bg-white"
                )}>
                  {isActive && !isCurrent ? <Check size={18} /> : <s.icon size={18} />}
                </div>
                <span className={cn(
                  "text-xs mt-2 font-medium",
                  isCurrent ? "text-primary" : isActive ? "text-gray-700" : "text-gray-400"
                )}>{s.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-8 pb-6">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>

      {/* Footer */}
      <div className="px-8 py-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
        <Button variant="flat" onPress={step === 1 ? onClose : handlePrev} startContent={step > 1 && <ArrowLeft size={16} />}>
          {step === 1 ? "Cancel" : "Back"}
        </Button>
        <div className="flex gap-2">
          {step < 3 ? (
            <Button color="primary" onPress={handleNext} endContent={<ArrowRight size={16} />}>
              Continue
            </Button>
          ) : (
            <Button color="primary" onPress={handleSubmit} startContent={<GraduationCap size={16} />}>
              Add Student
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
