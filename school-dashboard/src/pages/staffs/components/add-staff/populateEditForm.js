import { employmentTypes } from "./constants";

/**
 * Builds the formData object from an existing staff document (edit mode).
 * Returns the populated formData to be passed to setFormData.
 */
export const buildEditFormData = (editingStaff) => {
  // Normalize DOB — backend may return as dob, dateOfBirth, or ISO string
  const rawDob = editingStaff.dob || editingStaff.dateOfBirth || "";
  const normalizedDob = rawDob ? rawDob.split('T')[0] : "";

  // Normalize employment type — match exact case expected by Select options
  const rawEmployment = editingStaff.employmentType || "";
  const matchedEmployment = employmentTypes.find(t => t.value.toLowerCase() === rawEmployment.toLowerCase())?.value || "Full-time";

  return {
    // Personal Details
    name: editingStaff.name || "",
    dob: normalizedDob,
    picture: editingStaff.picture || null,
    phone: editingStaff.phone || "",
    isWhatsapp: editingStaff.whatsappNumber === editingStaff.phone,
    whatsappNumber: editingStaff.whatsappNumber || "",
    email: editingStaff.email || "",
    fatherName: editingStaff.fatherName || "",
    bloodGroup: editingStaff.bloodGroup || "",
    gender: editingStaff.gender || "",
    maritalStatus: editingStaff.maritalStatus || "",
    employmentType: matchedEmployment,
    idDocuments: editingStaff.idDocuments || [],
    customDocuments: editingStaff.customDocuments || [],
    emergencyContacts: editingStaff.emergencyContacts
      ? editingStaff.emergencyContacts.map((c, i) => ({ ...c, _key: i + 1 }))
      : [{ _key: 1, name: "", relationship: "", phone: "" }],
    address: editingStaff.address || "",
    // Qualifications
    professionalQualifications: editingStaff.professionalQualifications || [],
    totalExperience: editingStaff.totalExperience || "",
    experience: editingStaff.experience ?? (parseInt(editingStaff.totalExperience, 10) || 0),
    previousOrganization: editingStaff.previousOrganization || "",
    roleInOrganization: editingStaff.roleInOrganization || "",
    qualificationDocs: editingStaff.qualificationDocs || [],
    // Staff Info
    staffNumber: editingStaff.staffNumber || editingStaff.code || "",
    // Prefer `role` (canonical) over `staffType` (deprecated) to avoid stale data on re-edit
    staffType: (() => {
      const source = editingStaff.role || editingStaff.staffType;
      if (!source) return [];
      return Array.isArray(source) ? source : [source];
    })(),
    department: editingStaff.department || "",
    shift: editingStaff.shift || "Morning",
    joinDate: editingStaff.joinDate ? editingStaff.joinDate.split('T')[0] : "",
    assignedClasses: editingStaff.assignedClasses || [],
    // Derive isClassTeacher from multiple sources — the flag may be stale
    isClassTeacher: editingStaff.isClassTeacher || !!editingStaff.classTeacherOf || !!editingStaff.assignedClassId || false,
    classTeacherOf: editingStaff.classTeacherOf || editingStaff.assignedClassId || "",
    // Salary Details
    accountNumber: editingStaff.accountNumber || "",
    ifscCode: editingStaff.ifscCode || "",
    bankName: editingStaff.bankName || "",
    branchName: editingStaff.branchName || "",
    salaryTemplate: editingStaff.salaryTemplate || "",
    salaryBreakdown: editingStaff.salaryBreakdown || []
  };
};
