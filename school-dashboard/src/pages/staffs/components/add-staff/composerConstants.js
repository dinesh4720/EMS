import {
  GraduationCap,
  Building2,
  Users,
  Sparkles,
} from "lucide-react";

export const ROLE_OPTIONS = [
  { value: "Teaching", icon: GraduationCap, label: "Teaching", sub: "Has classes" },
  { value: "Admin", icon: Building2, label: "Admin", sub: "Office staff" },
  { value: "Support", icon: Users, label: "Support", sub: "Lab, library" },
  { value: "Leadership", icon: Sparkles, label: "Leadership", sub: "HoD, principal" },
];

export const SUBJECT_OPTIONS = [
  "Mathematics", "English", "Physics", "Chemistry", "Biology",
  "Hindi", "Sanskrit", "Computer Science", "History", "Geography",
  "Economics", "Civics", "Art", "Music", "Physical Education",
];

export const EMPLOYMENT_OPTIONS = [
  { value: "Full-time", label: "Full-time" },
  { value: "Part-time", label: "Part-time" },
  { value: "Contract", label: "Contract" },
];

export const FIELD_LABELS = {
  firstName: "First name",
  lastName: "Last name",
  subject: "Subject",
  email: "Email",
  phone: "Phone",
};

export const FIELD_TO_SECTION = {
  firstName: "identity",
  lastName: "identity",
  subject: "role",
  email: "contact",
  phone: "contact",
};

export const SECTIONS = [
  { id: "identity", label: "Identity" },
  { id: "role", label: "Role & teaching" },
  { id: "contact", label: "Contact" },
  { id: "employment", label: "Employment" },
  { id: "access", label: "System access" },
  { id: "review", label: "Review & invite" },
];
