// Human labels for the fields the error summary can focus. The key is the
// form-field name (matches `errors[name]`); the value is the label rendered
// in the summary popover.
export const FIELD_LABELS = {
  fullName: "Full name",
  dateOfBirth: "Date of birth",
  gender: "Gender",
  classGrade: "Class",
  section: "Section",
  mobile: "Mobile",
  email: "Email",
  zipCode: "PIN code",
  aadhaarNumber: "Aadhaar",
  parentName: "Parent name",
  parentPhone: "Parent phone",
  parentEmail: "Parent email",
  birthCertificate: "Birth certificate",
  transferCertificate: "Transfer certificate",
  aadhaarFront: "Aadhaar front",
  aadhaarBack: "Aadhaar back",
};

// Maps a form-field name to the wizard section it belongs to. Used by the
// error focus step to scroll the relevant section into view before the
// inline error focus fires.
export const FIELD_TO_SECTION = {
  fullName: "identity",
  dateOfBirth: "identity",
  gender: "identity",
  aadhaarNumber: "identity",
  classGrade: "class",
  section: "class",
  rollNumber: "class",
  mobile: "contact",
  email: "contact",
  zipCode: "contact",
  parentName: "parents",
  parentPhone: "parents",
  parentEmail: "parents",
  birthCertificate: "documents",
  transferCertificate: "documents",
  aadhaarFront: "documents",
  aadhaarBack: "documents",
};
