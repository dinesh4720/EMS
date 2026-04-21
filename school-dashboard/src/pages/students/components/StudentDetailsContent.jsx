import { memo } from "react";
import { useTranslation } from "react-i18next";
import {
  GraduationCap, User, Mail, Users, FileCheck, Edit,
} from "lucide-react";

/**
 * StudentDetailsContent - Renders the "Details" tab content for the student dashboard.
 *
 * Shows academic info, personal info, contact details, parent/guardian info,
 * previous education, and additional information sections.
 */
const StudentDetailsContent = memo(function StudentDetailsContent({
  student,
  classTeacher,
  currentAcademicYear,
  onEditOpen,
}) {
  const { t } = useTranslation();

  const SectionHeader = ({ icon: Icon, title, showEdit = true }) => (
    <div className="p-5 border-b border-gray-200 dark:border-zinc-700 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
          <Icon size={16} className="text-gray-600 dark:text-zinc-400" />
        </div>
        <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{title}</h3>
      </div>
      {showEdit && (
        <button aria-label={`Edit ${title}`} onClick={onEditOpen} className="p-2 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-lg">
          <Edit size={14} className="text-gray-400 dark:text-zinc-500" />
        </button>
      )}
    </div>
  );

  const Field = ({ label, value }) => (
    <div>
      <p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{label}</p>
      <p className="text-sm text-gray-900 dark:text-zinc-100">{value || "\u2014"}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Academic Info */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
        <SectionHeader icon={GraduationCap} title={t("students.profile.details.academicInformation", "Academic Information")} />
        <div className="p-5 grid grid-cols-2 lg:grid-cols-4 gap-6">
          <Field label={t("common.class", "Class")} value={student.class} />
          <Field label={t("students.profile.details.rollNumber", "Roll Number")} value={student.rollNo} />
          <Field label={t("students.academicYear", "Academic Year")} value={student.academicYear || currentAcademicYear} />
          <Field label={t("common.teacher", "Teacher")} value={classTeacher?.name} />
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
        <SectionHeader icon={User} title={t("students.profile.details.personalInformation", "Personal Information")} />
        <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-6">
          <Field label={t("students.fullName", "Full Name")} value={student.name} />
          <Field label={t("students.profile.details.admissionId", "Admission ID")} value={student.admissionId} />
          <Field label={t("students.dateOfBirth", "Date of Birth")} value={student.dateOfBirth} />
          <Field label={t("common.gender", "Gender")} value={student.gender} />
          <Field label={t("students.bloodGroup", "Blood Group")} value={student.bloodGroup} />
          <Field label={t("students.religion", "Religion")} value={student.religion} />
          <Field label={t("students.profile.details.category", "Category")} value={student.category} />
          <Field label={t("students.profile.details.motherTongue", "Mother Tongue")} value={student.motherTongue} />
          <Field label={t("students.profile.details.nationality", "Nationality")} value={student.nationality} />
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
        <SectionHeader icon={Mail} title={t("students.profile.details.contactDetails", "Contact Details")} />
        <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="col-span-full">
            <Field label={t("common.address", "Address")} value={student.address} />
          </div>
          <Field label={t("students.profile.details.city", "City")} value={student.city} />
          <Field label={t("students.profile.details.state", "State")} value={student.state} />
          <Field label={t("students.profile.details.zipCode", "ZIP Code")} value={student.zipCode} />
          <Field label={t("common.phone", "Phone")} value={student.phone} />
          <Field label={t("common.email", "Email")} value={student.email} />
        </div>
      </div>

      {/* Parent Info */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
        <SectionHeader icon={Users} title={t("students.profile.details.parentGuardian", "Parent / Guardian")} />
        <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-6">
          <Field label={t("students.details.parentName", "Parent Name")} value={student.parentName} />
          <Field label={t("students.parentPhone", "Parent Phone")} value={student.parentPhone} />
          <Field label={t("students.parentEmail", "Parent Email")} value={student.parentEmail} />
        </div>
      </div>

      {/* Previous Education */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
        <SectionHeader icon={GraduationCap} title={t("students.profile.details.previousEducation", "Previous Education")} />
        <div className="p-5 grid grid-cols-2 gap-6">
          <Field label={t("students.profile.details.previousSchool", "Previous School")} value={student.previousSchool} />
          <Field label={t("students.profile.details.tcNumber", "TC Number")} value={student.tcNumber} />
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
        <SectionHeader icon={FileCheck} title={t("students.profile.details.additionalInformation", "Additional Information")} />
        <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-6">
          <Field
            label={t("students.profile.details.transportRequired", "Transport Required")}
            value={student.transportRequired ? t("common.yes", "Yes") : t("common.no", "No")}
          />
          <Field
            label={t("students.profile.details.hostelRequired", "Hostel Required")}
            value={student.hostelRequired ? t("common.yes", "Yes") : t("common.no", "No")}
          />
          <Field
            label={t("students.profile.details.medicalConditions", "Medical Conditions")}
            value={student.medicalConditions || t("common.none", "None")}
          />
        </div>
      </div>
    </div>
  );
});

export default StudentDetailsContent;
