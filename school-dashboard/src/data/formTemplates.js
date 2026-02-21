// Pre-built form templates for intake forms

export const staffOnboardingTemplate = {
  formName: "Staff Onboarding Form",
  formType: "staff",
  fields: [
    // Personal Information
    { id: 1, label: "First Name", type: "text", required: true, mapTo: "firstName" },
    { id: 2, label: "Last Name", type: "text", required: true, mapTo: "lastName" },
    { id: 3, label: "Email", type: "email", required: true, mapTo: "email" },
    { id: 4, label: "Phone", type: "phone", required: true, mapTo: "phone" },
    { id: 5, label: "Date of Birth", type: "date", required: true, mapTo: "dateOfBirth" },
    { id: 6, label: "Gender", type: "dropdown", options: ["Male", "Female", "Other"], required: true, mapTo: "gender" },
    { id: 7, label: "Address", type: "textarea", required: true, mapTo: "address" },
    
    // Employment Information
    { id: 8, label: "Department", type: "text", required: true, mapTo: "department" },
    { id: 9, label: "Designation", type: "text", required: true, mapTo: "designation" },
    { id: 10, label: "Date of Joining", type: "date", required: true, mapTo: "dateOfJoining" },
    { id: 11, label: "Employment Type", type: "dropdown", options: ["Full-time", "Part-time", "Contract"], required: true, mapTo: "employmentType" },
    
    // Qualifications
    { id: 12, label: "Highest Qualification", type: "text", required: true, mapTo: "qualification" },
    { id: 13, label: "Years of Experience", type: "number", required: true, mapTo: "experienceYears" },
    { id: 14, label: "Specialization", type: "text", required: false, mapTo: "specialization" },
    
    // Documents
    { id: 15, label: "Resume/CV", type: "file", required: true, mapTo: "resumeFile" },
    { id: 16, label: "Photo", type: "file", required: true, mapTo: "photo" },
    { id: 17, label: "ID Proof", type: "file", required: true, mapTo: "idProofFile" },
    { id: 18, label: "Educational Certificates", type: "file", required: false, mapTo: "certificatesFile" },
    
    // Emergency Contact
    { id: 19, label: "Emergency Contact Name", type: "text", required: true, mapTo: "emergencyContactName" },
    { id: 20, label: "Emergency Contact Phone", type: "phone", required: true, mapTo: "emergencyContactPhone" },
    { id: 21, label: "Emergency Contact Relationship", type: "text", required: true, mapTo: "emergencyContactRelation" },
    
    // Bank Details (Optional)
    { id: 22, label: "Bank Account Number", type: "text", required: false, mapTo: "bankAccount" },
    { id: 23, label: "Bank Name", type: "text", required: false, mapTo: "bankName" },
    { id: 24, label: "IFSC Code", type: "text", required: false, mapTo: "ifscCode" },
  ]
};

export const studentAdmissionTemplate = {
  formName: "Student Admission Form",
  formType: "student",
  fields: [
    // Student Information
    { id: 1, label: "Student Name", type: "text", required: true, mapTo: "name" },
    { id: 2, label: "Date of Birth", type: "date", required: true, mapTo: "dateOfBirth" },
    { id: 3, label: "Gender", type: "dropdown", options: ["Male", "Female", "Other"], required: true, mapTo: "gender" },
    { id: 4, label: "Blood Group", type: "dropdown", options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], required: false, mapTo: "bloodGroup" },
    { id: 5, label: "Nationality", type: "text", required: true, mapTo: "nationality" },
    { id: 6, label: "Religion", type: "dropdown", options: ["Hinduism", "Islam", "Christianity", "Sikhism", "Buddhism", "Jainism", "Other"], required: false, mapTo: "religion" },
    { id: 7, label: "Category", type: "dropdown", options: ["General", "OBC", "SC", "ST", "Other"], required: false, mapTo: "category" },
    { id: 8, label: "Mother Tongue", type: "text", required: false, mapTo: "motherTongue" },
    
    // Contact Information
    { id: 9, label: "Address", type: "textarea", required: true, mapTo: "address" },
    { id: 10, label: "Phone", type: "phone", required: true, mapTo: "phone" },
    { id: 11, label: "Email", type: "email", required: false, mapTo: "email" },
    
    // Parent/Guardian Information
    { id: 12, label: "Parent/Guardian Name", type: "text", required: true, mapTo: "parentName" },
    { id: 13, label: "Parent Phone", type: "phone", required: true, mapTo: "parentPhone" },
    { id: 14, label: "Parent Email", type: "email", required: false, mapTo: "parentEmail" },
    { id: 15, label: "Relationship", type: "dropdown", options: ["Father", "Mother", "Guardian"], required: true, mapTo: "parentRelationship" },
    { id: 16, label: "Parent Occupation", type: "text", required: false, mapTo: "parentOccupation" },
    
    // Academic Information
    { id: 17, label: "Previous School", type: "text", required: false, mapTo: "previousSchool" },
    { id: 18, label: "Class Applying For", type: "text", required: true, mapTo: "classApplying" },
    { id: 19, label: "Medium of Instruction", type: "dropdown", options: ["English", "Hindi", "Regional"], required: true, mapTo: "mediumOfInstruction" },
    
    // Documents
    { id: 20, label: "Student Photo", type: "file", required: true, mapTo: "photo" },
    { id: 21, label: "Birth Certificate", type: "file", required: true, mapTo: "birthCertificate" },
    { id: 22, label: "Transfer Certificate", type: "file", required: false, mapTo: "tcFile" },
    { id: 23, label: "Previous Report Card", type: "file", required: false, mapTo: "reportCard" },
    
    // Additional Requirements
    { id: 24, label: "Transport Required", type: "dropdown", options: ["Yes", "No"], required: true, mapTo: "transportRequired" },
    { id: 25, label: "Hostel Required", type: "dropdown", options: ["Yes", "No"], required: false, mapTo: "hostelRequired" },
    { id: 26, label: "Medical Conditions (if any)", type: "textarea", required: false, mapTo: "medicalConditions" },
  ]
};

export const formTemplates = [
  {
    id: 'staff-onboarding',
    name: 'Staff Onboarding',
    description: 'Complete staff onboarding form with personal, employment, and document fields',
    template: staffOnboardingTemplate,
  },
  {
    id: 'student-admission',
    name: 'Student Admission',
    description: 'Student admission form with academic and parent information',
    template: studentAdmissionTemplate,
  },
  {
    id: 'blank',
    name: 'Start from Blank',
    description: 'Create a custom form from scratch',
    template: {
      formName: "New Form",
      formType: "staff",
      fields: [],
    },
  },
];

export default formTemplates;
