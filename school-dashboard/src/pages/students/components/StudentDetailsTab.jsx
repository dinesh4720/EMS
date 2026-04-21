import { GraduationCap, User, Mail, Users, FileCheck, Edit } from "lucide-react";
import { useTranslation } from "react-i18next";

// ============================================================================
// STUDENT DETAILS TAB
// Academic Info, Personal Info, Contact, Parent, Previous Education, Additional
// ============================================================================

function InfoSection({ icon: Icon, title, onEdit, children }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
      <div className="p-5 border-b border-gray-200 dark:border-zinc-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
            <Icon size={16} className="text-gray-600 dark:text-zinc-400" />
          </div>
          <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{title}</h3>
        </div>
        <button aria-label="Edit section" onClick={onEdit} className="p-2 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-lg">
          <Edit size={14} className="text-gray-400 dark:text-zinc-500" />
        </button>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{label}</p>
      <p className="text-sm text-gray-900 dark:text-zinc-100">{value || "—"}</p>
    </div>
  );
}

export default function StudentDetailsTab({ student, currentAcademicYear, classTeacher, onEditOpen }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* Academic Info */}
      <InfoSection icon={GraduationCap} title={t('pages.academicInformation1')} onEdit={onEditOpen}>
        <div className="p-5 grid grid-cols-2 lg:grid-cols-4 gap-6">
          <Field label={t('pages.class1')} value={student.class} />
          <Field label={t('pages.rollNumber2')} value={student.rollNo} />
          <Field label={t('pages.academicYear1')} value={student.academicYear || currentAcademicYear} />
          <Field label={t('pages.classTeacher2')} value={classTeacher?.name} />
        </div>
      </InfoSection>

      {/* Personal Info */}
      <InfoSection icon={User} title={t('pages.personalInformation1')} onEdit={onEditOpen}>
        <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-6">
          <Field label={t('pages.fullName1')} value={student.name} />
          <Field label={t('pages.admissionId1')} value={student.admissionId} />
          <Field label={t('pages.dateOfBirth2')} value={student.dateOfBirth ? student.dateOfBirth.split('T')[0].split('-').reverse().join('/') : null} />
          <Field label={t('pages.gender1')} value={student.gender} />
          <Field label={t('pages.bloodGroup1')} value={student.bloodGroup} />
          <Field label={t('pages.religion1')} value={student.religion} />
          <Field label={t('pages.category1')} value={student.category} />
          <Field label={t('pages.motherTongue1')} value={student.motherTongue} />
          <Field label={t('pages.nationality1')} value={student.nationality} />
        </div>
      </InfoSection>

      {/* Contact Info */}
      <InfoSection icon={Mail} title={t('pages.contactDetails1')} onEdit={onEditOpen}>
        <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="col-span-full">
            <p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t('pages.address2')}</p>
            <p className="text-sm text-gray-900 dark:text-zinc-100">{student.address || "—"}</p>
          </div>
          <Field label={t('pages.city1')} value={student.city} />
          <Field label={t('pages.state1')} value={student.state} />
          <Field label={t('pages.zIPCode')} value={student.zipCode} />
          <Field label={t('pages.phone1')} value={student.phone} />
          <Field label={t('pages.email1')} value={student.email} />
        </div>
      </InfoSection>

      {/* Parent Info */}
      <InfoSection icon={Users} title="Parent / Guardian" onEdit={onEditOpen}>
        <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-6">
          <Field label={t('pages.parentName2')} value={student.parentName} />
          <Field label={t('pages.parentPhone1')} value={student.parentPhone} />
          <Field
            label={t('pages.parentEmail1')}
            value={student.parentEmail || student.parents?.find(par => par.isParent !== false)?.email || student.parents?.[0]?.email}
          />
        </div>
      </InfoSection>

      {/* Previous Education */}
      <InfoSection icon={GraduationCap} title={t('pages.previousEducation1')} onEdit={onEditOpen}>
        <div className="p-5 grid grid-cols-2 gap-6">
          <Field label={t('pages.previousSchool1')} value={student.previousSchool} />
          <Field label={t('pages.tCNumber')} value={student.tcNumber} />
        </div>
      </InfoSection>

      {/* Additional Info */}
      <InfoSection icon={FileCheck} title={t('pages.additionalInformation1')} onEdit={onEditOpen}>
        <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-6">
          <Field label={t('pages.transportRequired1')} value={student.transportRequired ? "Yes" : "No"} />
          <Field label={t('pages.hostelRequired1')} value={student.hostelRequired ? "Yes" : "No"} />
          <Field label={t('pages.medicalConditions1')} value={student.medicalConditions || "None"} />
        </div>
      </InfoSection>
    </div>
  );
}
