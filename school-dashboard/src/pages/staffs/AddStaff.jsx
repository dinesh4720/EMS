import { useState, useRef } from "react";
import { Button, Input, Select, SelectItem, Checkbox, Switch, Textarea, Chip, Divider, Avatar, RadioGroup, Radio, cn } from "@heroui/react";
import { ArrowLeft, ArrowRight, Upload, X, Plus, User, FileText, Briefcase, DollarSign, Trash2, Check, Banknote, GraduationCap, MapPin, Phone, Mail, BadgeCheck, FileBadge, Calendar as CalendarIcon, Clock, HeartPulse, MoreHorizontal } from "lucide-react";

// --- Constants ---
const employmentTypes = [
  { label: "Full-Time", value: "Full-time" },
  { label: "Contract", value: "Contract" },
];
const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const genders = ["Male", "Female", "Other"];
const maritalStatuses = ["Single", "Married", "Divorced", "Widowed"];
const staffTypes = ["Teaching", "Non-Teaching", "Admin", "Lab Assistant", "Accountant", "Others"];
const classOptions = Array.from({ length: 12 }, (_, i) => i + 1).flatMap(num => ["A", "B", "C", "D"].map(sec => `${num}-${sec}`));

const emptyForm = {
  // Personal Details
  fullName: "", dob: "", expertise: "", picture: null, mobile: "", isWhatsapp: false,
  whatsappNumber: "", email: "", fatherName: "", bloodGroup: "", gender: "Male", maritalStatus: "",
  employmentType: "Full-time", fatherMotherNumber: "", idDocuments: [], customDocuments: [],
  emergencyContact: "", emergencyPhone: "", address: "",
  // Qualifications
  professionalQualifications: [], totalExperience: "", previousOrganization: "", qualificationDocs: [],
  // Staff Info
  staffNumber: "", staffType: "", assignedClasses: [], isClassTeacher: false, classTeacherOf: "",
  // Salary Details
  accountNumber: "", ifscCode: "", bankName: "", branchName: "", salaryTemplate: "", salaryBreakdown: []
};

export default function AddStaff({ onClose, onSave }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  // Refs
  const pictureInputRef = useRef(null);
  const idDocsInputRef = useRef(null);
  const qualDocsInputRef = useRef(null);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const addQualification = () => {
    updateField("professionalQualifications", [...formData.professionalQualifications, { name: "", year: "", documents: [] }]);
  };

  const removeQualification = (index) => {
    updateField("professionalQualifications", formData.professionalQualifications.filter((_, i) => i !== index));
  };

  const updateQualification = (index, field, value) => {
    const updated = [...formData.professionalQualifications];
    updated[index][field] = value;
    updateField("professionalQualifications", updated);
  };

  const handleQualificationDocUpload = (index, files) => {
    const updated = [...formData.professionalQualifications];
    updated[index].documents = [...(updated[index].documents || []), ...Array.from(files)];
    updateField("professionalQualifications", updated);
  };

  const removeQualificationDoc = (qualIndex, docIndex) => {
    const updated = [...formData.professionalQualifications];
    updated[qualIndex].documents = updated[qualIndex].documents.filter((_, i) => i !== docIndex);
    updateField("professionalQualifications", updated);
  };

  const handleFileUpload = (field, files) => {
    if (files && files.length > 0) {
      updateField(field, [...formData[field], ...Array.from(files)]);
    }
  };

  const removeFile = (field, index) => {
    updateField(field, formData[field].filter((_, i) => i !== index));
  };

  const validateStep = (stepNum) => {
    const newErrors = {};
    if (stepNum === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = "Required";
      if (!formData.mobile.trim()) newErrors.mobile = "Required";
      else if (!/^\d{10}$/.test(formData.mobile)) newErrors.mobile = "Invalid";
      if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Invalid email";
      }
    }
    if (stepNum === 3) {
      if (!formData.staffNumber.trim()) newErrors.staffNumber = "Required";
      if (!formData.staffType) newErrors.staffType = "Required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep(prev => Math.min(prev + 1, 4));
  };

  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = () => {
    if (validateStep(step)) onSave(formData);
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
        />
        <div className="flex flex-col gap-1 text-left">
          <div className="flex items-center gap-3">
            <button
              className="text-sm font-semibold text-primary hover:text-primary-600 transition-colors"
              onClick={() => pictureInputRef.current?.click()}
            >
              Upload Photo
            </button>
            <span className="text-gray-300">|</span>
            <button
              className="text-sm font-semibold text-danger hover:text-danger-600 transition-colors"
              onClick={() => updateField("picture", null)}
            >
              Delete
            </button>
          </div>
          <p className="text-xs text-gray-500 max-w-[250px]">
            An image of the person, it's best if it has the same height and width.
          </p>
          <input ref={pictureInputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => updateField("picture", e.target.files[0])} />
        </div>
      </div>

      {/* Type Selection */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-900">Employment Type</label>
        <div className="grid grid-cols-2 gap-4">
          {employmentTypes.map((type) => {
            const isSelected = formData.employmentType === type.value;
            return (
              <div
                key={type.value}
                className={cn(
                  "cursor-pointer rounded-xl border-2 p-3 flex items-center gap-3 transition-all",
                  isSelected ? "border-primary bg-primary-50/20" : "border-gray-200 hover:border-gray-300"
                )}
                onClick={() => updateField("employmentType", type.value)}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                  isSelected ? "border-primary" : "border-gray-300"
                )}>
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
                <span className={cn("text-sm font-medium", isSelected ? "text-primary-700" : "text-gray-600")}>
                  {type.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Name Field */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-900">Personal Information</label>
        <Input
          label="Full Name"
          labelPlacement="outside"
          placeholder="Enter full name"
          value={formData.fullName}
          onValueChange={v => updateField("fullName", v)}
          isInvalid={!!errors.fullName}
          errorMessage={errors.fullName}
          variant="bordered"
          radius="sm"
          classNames={{ inputWrapper: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          type="date"
          label="Date of Birth"
          labelPlacement="outside"
          value={formData.dob}
          onValueChange={v => updateField("dob", v)}
          variant="bordered"
          radius="sm"
          classNames={{ label: "text-xs font-medium text-gray-600 mb-1", inputWrapper: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
        />
        <Select
          label="Gender"
          labelPlacement="outside"
          placeholder="Select..."
          selectedKeys={formData.gender ? [formData.gender] : []}
          onSelectionChange={keys => updateField("gender", Array.from(keys)[0])}
          variant="bordered"
          radius="sm"
          classNames={{ label: "text-xs font-medium text-gray-600 mb-1", trigger: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
        >
          {genders.map(g => <SelectItem key={g}>{g}</SelectItem>)}
        </Select>
        <Input
          label="Father's Name"
          labelPlacement="outside"
          placeholder="Full Name"
          value={formData.fatherName}
          onValueChange={v => updateField("fatherName", v)}
          variant="bordered"
          radius="sm"
          classNames={{ label: "text-xs font-medium text-gray-600 mb-1", inputWrapper: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
        />
        <Select
          label="Marital Status"
          labelPlacement="outside"
          placeholder="Select..."
          selectedKeys={formData.maritalStatus ? [formData.maritalStatus] : []}
          onSelectionChange={keys => updateField("maritalStatus", Array.from(keys)[0])}
          variant="bordered"
          radius="sm"
          classNames={{ label: "text-xs font-medium text-gray-600 mb-1", trigger: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
        >
          {maritalStatuses.map(ms => <SelectItem key={ms}>{ms}</SelectItem>)}
        </Select>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 pt-2 border-t border-dashed border-gray-200">
        <label className="text-sm font-semibold text-gray-900 block mt-2">Contact Details</label>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-1 space-y-2">
            <Input
              label="Mobile Number"
              labelPlacement="outside"
              startContent={<span className="text-gray-400 text-xs">+91</span>}
              placeholder="Mobile Number"
              value={formData.mobile}
              onValueChange={v => updateField("mobile", v)}
              variant="bordered"
              radius="sm"
              classNames={{ inputWrapper: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
            />
            <Checkbox classNames={{ label: "text-xs text-gray-500" }} size="sm" isSelected={formData.isWhatsapp} onValueChange={v => updateField("isWhatsapp", v)}>
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
          <Input
            label="Email Address"
            labelPlacement="outside"
            placeholder="Email Address"
            value={formData.email}
            onValueChange={v => updateField("email", v)}
            variant="bordered"
            radius="sm"
            className="col-span-2"
            classNames={{ inputWrapper: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
          />
          <Input
            label="Emergency Contact"
            labelPlacement="outside"
            placeholder="Emergency Contact (Name & Phone)"
            value={formData.emergencyContact}
            onValueChange={v => updateField("emergencyContact", v)}
            variant="bordered"
            radius="sm"
            className="col-span-2"
            classNames={{ inputWrapper: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
          />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <label className="text-sm font-semibold text-gray-900">Address</label>
          <span className="text-xs text-gray-400">{formData.address.length} / 200</span>
        </div>
        <Textarea
          placeholder="Full Residential Address"
          value={formData.address}
          onValueChange={v => updateField("address", v)}
          variant="bordered"
          radius="sm"
          minRows={2}
          classNames={{ inputWrapper: "bg-white border-1 border-gray-200 hover:border-gray-300" }}
        />
      </div>

      {/* Identity Docs */}
      <div className="space-y-2 pt-2">
        <label className="text-sm font-semibold text-gray-900">Identity Proofs</label>
        <div className="flex flex-wrap gap-2">
          <button
            className="h-8 px-3 rounded-lg border border-dashed border-gray-300 text-xs font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors"
            onClick={() => idDocsInputRef.current?.click()}
          >
            <Upload size={14} /> Upload ID
          </button>
          <input ref={idDocsInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden"
            onChange={(e) => handleFileUpload("idDocuments", e.target.files)} />

          {formData.idDocuments.map((file, i) => (
            <Chip key={i} onClose={() => removeFile("idDocuments", i)} size="sm" variant="flat" className="h-8 border border-gray-200 bg-white" classNames={{ content: "text-xs" }}>
              {file.name}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-gray-900">Education Details</h3>
        <Button size="sm" color="primary" variant="flat" onPress={addQualification} className="h-8 text-xs">
          <Plus size={14} /> Add Degree
        </Button>
      </div>

      <div className="space-y-3">
        {formData.professionalQualifications.map((qual, i) => (
          <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
            <div className="flex gap-3 items-start">
              <Input
                className="flex-1"
                placeholder="Degree / Certificate"
                value={qual.name}
                onValueChange={v => updateQualification(i, "name", v)}
                variant="bordered"
                radius="sm"
                size="sm"
                classNames={{ inputWrapper: "bg-white border-1 border-gray-200 h-9" }}
              />
              <Input
                className="w-24"
                placeholder="Year"
                value={qual.year}
                onValueChange={v => updateQualification(i, "year", v)}
                variant="bordered"
                radius="sm"
                size="sm"
                classNames={{ inputWrapper: "bg-white border-1 border-gray-200 h-9" }}
              />
              <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => removeQualification(i)}>
                <Trash2 size={16} />
              </Button>
            </div>
            
            {/* Document Upload for this qualification */}
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="flat" 
                className="h-7 text-xs"
                onPress={() => document.getElementById(`qual-doc-${i}`).click()}
              >
                <Upload size={12} /> Upload Certificate
              </Button>
              <input 
                id={`qual-doc-${i}`} 
                type="file" 
                multiple 
                accept=".pdf,.jpg,.jpeg,.png" 
                className="hidden" 
                onChange={(e) => handleQualificationDocUpload(i, e.target.files)} 
              />
              {qual.documents && qual.documents.length > 0 && (
                <span className="text-xs text-gray-500">{qual.documents.length} file(s)</span>
              )}
            </div>
            
            {/* Show uploaded documents */}
            {qual.documents && qual.documents.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {qual.documents.map((file, docIdx) => (
                  <Chip
                    key={docIdx}
                    size="sm"
                    variant="flat"
                    onClose={() => removeQualificationDoc(i, docIdx)}
                    classNames={{ base: "h-6 text-xs" }}
                  >
                    {file.name}
                  </Chip>
                ))}
              </div>
            )}
          </div>
        ))}
        {formData.professionalQualifications.length === 0 && (
          <div className="text-center py-6 border border-dashed border-gray-200 rounded-lg text-gray-400 text-xs">
            No qualifications added yet.
          </div>
        )}
      </div>

      <div className="space-y-2 pt-4 border-t border-dashed border-gray-200">
        <label className="text-sm font-semibold text-gray-900">Experience</label>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Total Experience"
            labelPlacement="outside"
            placeholder="Years"
            value={formData.totalExperience}
            onValueChange={v => updateField("totalExperience", v)}
            variant="bordered"
            radius="sm"
            classNames={{ label: "text-xs font-medium text-gray-600 mb-1", inputWrapper: "bg-white border-1 border-gray-200 h-10" }}
          />
          <Input
            label="Previous Org."
            labelPlacement="outside"
            placeholder="Organization Name"
            value={formData.previousOrganization}
            onValueChange={v => updateField("previousOrganization", v)}
            variant="bordered"
            radius="sm"
            classNames={{ label: "text-xs font-medium text-gray-600 mb-1", inputWrapper: "bg-white border-1 border-gray-200 h-10" }}
          />
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <label className="text-sm font-semibold text-gray-900">Certificates</label>
        <div
          className="border border-dashed border-gray-300 rounded-lg p-3 flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => qualDocsInputRef.current?.click()}
        >
          <Upload size={14} className="text-gray-500" />
          <span className="text-xs text-gray-600">Upload Scanned Documents</span>
          <input ref={qualDocsInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden"
            onChange={(e) => handleFileUpload("qualificationDocs", e.target.files)} />
        </div>
        {formData.qualificationDocs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.qualificationDocs.map((file, i) => (
              <Chip key={i} onClose={() => removeFile("qualificationDocs", i)} size="sm" variant="flat" className="text-xs h-7">
                {file.name}
              </Chip>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-900">Role Designation</label>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Staff ID"
            labelPlacement="outside"
            placeholder="Code"
            value={formData.staffNumber}
            onValueChange={v => updateField("staffNumber", v)}
            variant="bordered"
            radius="sm"
            classNames={{ label: "text-xs font-medium text-gray-600 mb-1", inputWrapper: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
          />
          <Select
            label="Role"
            labelPlacement="outside"
            placeholder="Select..."
            selectedKeys={formData.staffType ? [formData.staffType] : []}
            onSelectionChange={keys => updateField("staffType", Array.from(keys)[0])}
            variant="bordered"
            radius="sm"
            classNames={{ label: "text-xs font-medium text-gray-600 mb-1", trigger: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
          >
            {staffTypes.map(st => <SelectItem key={st}>{st}</SelectItem>)}
          </Select>
        </div>
        <Input
          label="Department / Expertise"
          labelPlacement="outside"
          placeholder="e.g. Science"
          value={formData.expertise}
          onValueChange={v => updateField("expertise", v)}
          variant="bordered"
          radius="sm"
          classNames={{ label: "text-xs font-medium text-gray-600 mb-1", inputWrapper: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
        />
      </div>

      {formData.staffType === "Teaching" && (
        <div className="space-y-2 pt-2 border-t border-dashed border-gray-200">
          <label className="text-sm font-semibold text-gray-900 block mt-2">Class Assignments</label>
          <Select
            placeholder="Assign Classes"
            selectionMode="multiple"
            selectedKeys={new Set(formData.assignedClasses)}
            onSelectionChange={keys => updateField("assignedClasses", Array.from(keys))}
            variant="bordered"
            radius="sm"
            classNames={{ trigger: "bg-white border-1 border-gray-200 hover:border-gray-300 min-h-[40px]" }}
          >
            {classOptions.map(c => <SelectItem key={c}>{c}</SelectItem>)}
          </Select>

          <div className="flex items-center justify-between py-2 px-1">
            <span className="text-sm text-gray-700">Class Teacher Responsibility?</span>
            <Switch size="sm" isSelected={formData.isClassTeacher} onValueChange={v => updateField("isClassTeacher", v)} />
          </div>

          {formData.isClassTeacher && (
            <Select
              placeholder="Class Teacher Of"
              selectedKeys={formData.classTeacherOf ? [formData.classTeacherOf] : []}
              onSelectionChange={keys => updateField("classTeacherOf", Array.from(keys)[0])}
              variant="bordered"
              radius="sm"
              classNames={{ trigger: "bg-white border-1 border-gray-200 hover:border-gray-300 h-10" }}
            >
              {formData.assignedClasses.length > 0 ? formData.assignedClasses.map(c => <SelectItem key={c}>{c}</SelectItem>) : <SelectItem key="none" isDisabled>Select assigned classes first</SelectItem>}
            </Select>
          )}
        </div>
      )}
    </div>
  );

  const renderStep4 = () => {
    // Salary Templates Local Logic
    const salaryTemplates = [
      { name: "Teacher", breakdown: [{ component: "Basic Salary", amount: 25000 }, { component: "HRA", amount: 10000 }, { component: "Allowance", amount: 5000 }] },
      { name: "Assistant", breakdown: [{ component: "Basic Salary", amount: 18000 }, { component: "HRA", amount: 7000 }] },
    ];

    const handleTemplateChange = (templateName) => {
      const template = salaryTemplates.find(t => t.name === templateName);
      if (template) {
        updateField("salaryTemplate", templateName);
        updateField("salaryBreakdown", template.breakdown);
      }
    };

    const updateBreakdownItem = (index, field, value) => {
      const updated = [...formData.salaryBreakdown];
      updated[index][field] = field === "amount" ? Number(value) : value;
      updateField("salaryBreakdown", updated);
    };

    const totalSalary = formData.salaryBreakdown.reduce((sum, item) => sum + (item.amount || 0), 0);

    return (
      <div className="space-y-6 animate-fade-in text-left">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-900">Bank Details</label>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Account Number" labelPlacement="outside" placeholder="Account No" value={formData.accountNumber} onValueChange={v => updateField("accountNumber", v)} variant="bordered" radius="sm" classNames={{ inputWrapper: "bg-white border-1 h-10" }} />
            <Input label="IFSC Code" labelPlacement="outside" placeholder="IFSC" value={formData.ifscCode} onValueChange={v => updateField("ifscCode", v)} variant="bordered" radius="sm" classNames={{ inputWrapper: "bg-white border-1 h-10" }} />
            <Input label="Bank Name" labelPlacement="outside" placeholder="Bank Name" value={formData.bankName} onValueChange={v => updateField("bankName", v)} variant="bordered" radius="sm" classNames={{ inputWrapper: "bg-white border-1 h-10" }} />
            <Input label="Branch Name" labelPlacement="outside" placeholder="Branch" value={formData.branchName} onValueChange={v => updateField("branchName", v)} variant="bordered" radius="sm" classNames={{ inputWrapper: "bg-white border-1 h-10" }} />
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t border-dashed border-gray-200">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-gray-900">Salary Structure</label>
            <Select
              size="sm"
              placeholder="Load Template"
              className="w-32"
              selectedKeys={formData.salaryTemplate ? [formData.salaryTemplate] : []}
              onSelectionChange={keys => handleTemplateChange(Array.from(keys)[0])}
              variant="bordered"
              radius="sm"
              classNames={{ trigger: "h-8 min-h-0" }}
            >
              {salaryTemplates.map(t => <SelectItem key={t.name}>{t.name}</SelectItem>)}
            </Select>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {formData.salaryBreakdown.map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-2 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <Input size="sm" value={item.component} onValueChange={v => updateBreakdownItem(i, "component", v)} variant="flat" classNames={{ inputWrapper: "bg-transparent shadow-none" }} />
                <Input size="sm" type="number" value={item.amount} onValueChange={v => updateBreakdownItem(i, "amount", v)} variant="flat" startContent="₹" classNames={{ inputWrapper: "bg-transparent shadow-none w-24" }} />
                <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => updateField("salaryBreakdown", formData.salaryBreakdown.filter((_, idx) => idx !== i))}><X size={14} /></Button>
              </div>
            ))}
            <Button fullWidth variant="light" size="sm" className="text-gray-500 font-medium" onPress={() => updateField("salaryBreakdown", [...formData.salaryBreakdown, { component: "", amount: 0 }])}>+ Add Component</Button>
          </div>

          <div className="flex justify-between items-center px-2 pt-2">
            <span className="text-sm font-medium text-gray-600">Total Salary</span>
            <span className="text-lg font-bold text-gray-900">₹{totalSalary.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  };

  const steps = [
    { number: 1, title: "Staff Info", icon: User },
    { number: 2, title: "Education", icon: GraduationCap },
    { number: 3, title: "Role", icon: Briefcase },
    { number: 4, title: "Payroll", icon: Banknote }
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Elegant Stepper */}
      <div className="px-8 py-6">
        <div className="flex items-center justify-between relative">
          {/* Dashed Line Background */}
          <div className="absolute top-[20px] left-0 right-0 h-[1.5px] border-t-2 border-dashed border-gray-200 -z-0" />

          {steps.map((s, i) => {
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
                  <s.icon size={18} strokeWidth={2} />
                </div>
                <span className={cn(
                  "text-[11px] font-semibold mt-2 uppercase tracking-wide",
                  isCurrent ? "text-primary" : "text-gray-400"
                )}>
                  {s.title}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-2 custom-scrollbar">
        <div className="max-w-2xl mx-auto">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-6 flex justify-center gap-4 border-t border-gray-100">
        <Button
          className="w-32 font-medium"
          variant="light"
          onPress={onClose}
        >
          Cancel
        </Button>
        {step > 1 && (
          <Button
            className="w-32 font-medium border-gray-300 text-gray-700"
            variant="bordered"
            onPress={handlePrev}
          >
            Back
          </Button>
        )}
        <Button
          className="w-32 font-medium shadow-lg shadow-primary/20"
          color="primary"
          onPress={step === 4 ? handleSubmit : handleNext}
        >
          {step === 4 ? "Save" : "Next"}
        </Button>
      </div>
    </div>
  );
}
