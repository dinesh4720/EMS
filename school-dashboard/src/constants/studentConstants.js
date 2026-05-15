// Student Module Constants
// Extracted from AddStudent.jsx for better maintainability

export const GENDERS = ["Male", "Female", "Other"];

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const PARENT_RELATIONSHIPS = ["Father", "Mother"];

export const GUARDIAN_RELATIONSHIPS = ["Grandparent", "Uncle", "Aunt", "Sibling", "Other"];

export const RELIGIONS = ["Hinduism", "Islam", "Christianity", "Sikhism", "Buddhism", "Jainism", "Other"];

export const CATEGORIES = ["General", "OBC", "SC", "ST", "EWS", "Other"];

export const MOTHER_TONGUES = [
  "Hindi", "Bengali", "Telugu", "Marathi", "Tamil", "Urdu", "Gujarati", "Kannada",
  "Odia", "Malayalam", "Punjabi", "Assamese", "Maithili", "Santali", "Kashmiri", "Other"
];

export const STUDENT_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ALUMNI: 'alumni',
  GRADUATED: 'graduated',
  TRANSFERRED: 'transferred'
};

export const FEE_STATUSES = {
  PAID: 'paid',
  PENDING: 'pending',
  OVERDUE: 'overdue',
  PARTIAL: 'partial'
};

export const DEFAULT_STUDENT_FORM = {
  // Personal Information
  fullName: "",
  dateOfBirth: "",
  gender: "",
  picture: null,
  aadhaarNumber: "",
  bloodGroup: "",
  nationality: "",
  religion: "",
  category: "",
  motherTongue: "",
  previousSchool: "",
  tcNumber: "",
  
  // Class Info
  classGrade: "",
  section: "",
  rollNumber: "",
  
  // Contact
  mobile: "",
  isWhatsapp: true,
  whatsappNumber: "",
  email: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  
  // Parent/Guardian
  parents: [{
    name: "",
    relationship: "Father",
    phone: "",
    email: "",
    occupation: "",
    isWhatsapp: true,
    isParent: true
  }],
  alternatePhone: "",
  
  // Siblings
  siblings: [],
  
  // Health & Safety
  medicalConditions: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  
  // Transport & Hostel
  transportRequired: false,
  hostelRequired: false,
  
  // Documents
  birthCertificate: null,
  transferCertificate: null,
  aadhaarFront: null,
  aadhaarBack: null,
  studentPhoto: null,
  otherDocuments: []
};

export const VALIDATION_RULES = {
  name: {
    minLength: 2,
    maxLength: 100,
    pattern: /^[\p{L}\p{M}\s'-]+$/u, // Unicode letters + combining marks (for Indic scripts), spaces, hyphens, apostrophes
    message: "Name must contain only letters, spaces, hyphens, and apostrophes"
  },
  phone: {
    pattern: /^\d{10}$/,
    message: "Phone number must be exactly 10 digits"
  },
  aadhaar: {
    pattern: /^\d{12}$/,
    message: "Aadhaar number must be exactly 12 digits"
  },
  zipCode: {
    pattern: /^\d{6}$/,
    message: "ZIP code must be exactly 6 digits"
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Please enter a valid email address"
  }
};
