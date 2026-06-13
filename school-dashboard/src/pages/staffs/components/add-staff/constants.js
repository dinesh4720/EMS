import { STAFF_ROLES } from "../../../../constants/roles";

// Minimal design constants matching login page style
export const minimalInputClasses = "bg-surface border border-border-token hover:border-accent focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all duration-200";
export const minimalLabelClasses = "text-xs font-medium text-fg mb-1";
export const minimalButtonPrimary = "bg-accent hover:bg-accent-hover text-surface transition-colors";
export const minimalButtonSecondary = "bg-surface-2 hover:bg-surface-hover text-fg transition-colors";

export const employmentTypes = [
  { label: "Full-Time", value: "Full-time" },
  { label: "Part-Time", value: "Part-time" },
  { label: "Contract", value: "Contract" },
];
export const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
export const genders = ["Male", "Female", "Other"];
export const maritalStatuses = ["Single", "Married", "Divorced", "Widowed"];
export const staffTypes = STAFF_ROLES; // Use centralized roles
export const idProofTypes = ["Aadhar Card", "PAN Card", "Driving License", "Passport", "Voter ID", "Other"];
export const degreeOptions = [
  { label: "B.Ed", value: "B.Ed" }, { label: "M.Ed", value: "M.Ed" },
  { label: "PhD", value: "PhD" }, { label: "B.Sc", value: "B.Sc" },
  { label: "M.Sc", value: "M.Sc" }, { label: "B.A", value: "B.A" },
  { label: "M.A", value: "M.A" }, { label: "B.Com", value: "B.Com" },
  { label: "M.Com", value: "M.Com" }, { label: "MBA", value: "MBA" },
  { label: "B.Tech", value: "B.Tech" }, { label: "M.Tech", value: "M.Tech" },
  { label: "Other", value: "Other" }
];
export const DEFAULT_DEPARTMENTS = ["Academic", "Science", "Mathematics", "Languages", "Social Studies", "Arts", "Sports", "Administration", "Accounts", "IT", "Library", "Transport", "Maintenance", "Others"];
export const shiftOptions = ["Morning", "Afternoon", "Evening", "Full Day"];

// Fallback class options - will be replaced by actual API data
export const fallbackClassOptions = Array.from({ length: 12 }, (_, i) => i + 1).flatMap(num => ["A", "B", "C", "D"].map(sec => `${num}-${sec}`));

export const emptyForm = {
  // Personal Details
  name: "", dob: "", picture: null, phone: "", isWhatsapp: false,
  whatsappNumber: "", email: "", fatherName: "", bloodGroup: "", gender: "", maritalStatus: "",
  employmentType: "Full-time", idDocuments: [], customDocuments: [],
  emergencyContacts: [{ _key: 1, name: "", relationship: "", phone: "" }], address: "",
  // Qualifications
  professionalQualifications: [], totalExperience: "", experience: 0, previousOrganization: "", roleInOrganization: "", qualificationDocs: [],
  // Staff Info
  staffNumber: "", staffType: [], department: "", shift: "Morning", joinDate: "", assignedClasses: [], isClassTeacher: false, classTeacherOf: "",
  // Salary Details
  accountNumber: "", ifscCode: "", bankName: "", branchName: "", salaryTemplate: "", salaryBreakdown: []
};
