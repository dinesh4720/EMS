import { useApp } from "../../../../context/AppContext";
import { Button } from "@heroui/react";
import { GraduationCap, User, Phone, Users, FileCheck, Edit } from "lucide-react";
import InfoItem from "../shared/InfoItem";
import { useTranslation } from 'react-i18next';

/**
 * BasicDetailsTab - Student personal and academic details
 */
export default function BasicDetailsTab({
  student,
  classTeacher,
  onEditSection
}) {
  const { t } = useTranslation();
  const { currentAcademicYear } = useApp();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Academic Information */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <GraduationCap size={18} className="text-gray-600 dark:text-zinc-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">{t('pages.academicInformation1')}</h3>
          </div>
          {onEditSection && (
            <Button 
              isIconOnly 
              size="sm" 
              variant="light" 
              onPress={() => onEditSection("academic")}
              className="text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
            >
              <Edit size={16} />
            </Button>
          )}
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-6">
          <InfoItem label={t('pages.class1')} value={student?.class || "N/A"} />
          <InfoItem label={t('pages.rollNumber2')} value={student?.rollNo || "N/A"} />
          <InfoItem label={t('pages.academicYear1')} value={student?.academicYear || currentAcademicYear} />
          <InfoItem label={t('pages.classTeacher2')} value={classTeacher?.name || "Not Assigned"} />
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <User size={18} className="text-gray-600 dark:text-zinc-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">{t('pages.personalInformation1')}</h3>
          </div>
          {onEditSection && (
            <Button 
              isIconOnly 
              size="sm" 
              variant="light" 
              onPress={() => onEditSection("personal")}
              className="text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
            >
              <Edit size={16} />
            </Button>
          )}
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-6">
          <InfoItem label={t('pages.fullName1')} value={student?.name} />
          <InfoItem label={t('pages.admissionId1')} value={student?.admissionId} />
          <InfoItem label={t('pages.dateOfBirth2')} value={student?.dateOfBirth} />
          <InfoItem label={t('pages.gender1')} value={student?.gender} />
          <InfoItem label={t('pages.bloodGroup1')} value={student?.bloodGroup} />
          <InfoItem label={t('pages.religion1')} value={student?.religion} />
          <InfoItem label={t('pages.category1')} value={student?.category} />
          <InfoItem label={t('pages.motherTongue1')} value={student?.motherTongue} />
          <InfoItem label={t('pages.aadhaarNumber')} value={student?.aadhaarNumber} />
          <InfoItem label={t('pages.nationality1')} value={student?.nationality} />
        </div>
      </div>

      {/* Contact Details */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <Phone size={18} className="text-gray-600 dark:text-zinc-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">{t('pages.contactDetails1')}</h3>
          </div>
          {onEditSection && (
            <Button 
              isIconOnly 
              size="sm" 
              variant="light" 
              onPress={() => onEditSection("contact")}
              className="text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
            >
              <Edit size={16} />
            </Button>
          )}
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-6">
          <div className="col-span-full">
            <InfoItem label={t('pages.address2')} value={student?.address} />
          </div>
          <InfoItem label={t('pages.city1')} value={student?.city} />
          <InfoItem label={t('pages.state1')} value={student?.state} />
          <InfoItem label={t('pages.zIPCode')} value={student?.zipCode} />
          <InfoItem label={t('pages.phone1')} value={student?.phone} />
          <InfoItem label={t('pages.email1')} value={student?.email} />
        </div>
      </div>

      {/* Parent/Guardian */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <Users size={18} className="text-gray-600 dark:text-zinc-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">Parent / Guardian</h3>
          </div>
          {onEditSection && (
            <Button 
              isIconOnly 
              size="sm" 
              variant="light" 
              onPress={() => onEditSection("parents")}
              className="text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
            >
              <Edit size={16} />
            </Button>
          )}
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-6">
          <InfoItem label={t('pages.fatherSName1')} value={student?.parentName} />
          <InfoItem label={t('pages.fatherSOccupation')} value={student?.parentOccupation} />
          <InfoItem label={t('pages.motherSName')} value={
            student?.parents && student.parents.find(p => p.relationship?.toLowerCase() === 'mother')?.name ||
            student?.parents && student.parents.find(p => p.relationship?.toLowerCase() === 'wife')?.name ||
            'N/A'
          } />
          <InfoItem label={t('pages.motherSOccupation')} value={
            student?.parents && student.parents.find(p => p.relationship?.toLowerCase() === 'mother')?.occupation ||
            student?.parents && student.parents.find(p => p.relationship?.toLowerCase() === 'wife')?.occupation ||
            'N/A'
          } />
          <InfoItem label={t('pages.primaryPhone')} value={student?.parentPhone} />
          <InfoItem label={t('pages.alternatePhone')} value={student?.alternatePhone} />
          <InfoItem label={t('pages.primaryEmail')} value={
            student?.parentEmail ||
            (student?.parents && student.parents.find(p => p.isParent !== false)?.email) ||
            (student?.parents && student.parents[0]?.email)
          } />
        </div>
      </div>

      {/* Previous Education */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <GraduationCap size={18} className="text-gray-600 dark:text-zinc-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">{t('pages.previousEducation1')}</h3>
          </div>
          {onEditSection && (
            <Button 
              isIconOnly 
              size="sm" 
              variant="light" 
              onPress={() => onEditSection("education")}
              className="text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
            >
              <Edit size={16} />
            </Button>
          )}
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-6">
          <InfoItem label={t('pages.previousSchool1')} value={student?.previousSchool} />
          <InfoItem label={t('pages.tCNumber')} value={student?.tcNumber} />
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <FileCheck size={18} className="text-gray-600 dark:text-zinc-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">{t('pages.additionalInformation1')}</h3>
          </div>
          {onEditSection && (
            <Button 
              isIconOnly 
              size="sm" 
              variant="light" 
              onPress={() => onEditSection("additional")}
              className="text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
            >
              <Edit size={16} />
            </Button>
          )}
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-6">
          <InfoItem label={t('pages.academicYear1')} value={student?.academicYear || currentAcademicYear} />
          <InfoItem label={t('pages.transportRequired1')} value={student?.transportRequired ? "Yes" : "No"} />
          <InfoItem label={t('pages.hostelRequired1')} value={student?.hostelRequired ? "Yes" : "No"} />
          <div className="col-span-full">
            <InfoItem label={t('pages.medicalConditions1')} value={student?.medicalConditions || "None"} />
          </div>
          <InfoItem label={t('pages.emergencyContactName')} value={student?.emergencyContactName || "-"} />
          <InfoItem label={t('pages.emergencyContactPhone')} value={student?.emergencyContactPhone || "-"} />
        </div>
      </div>
    </div>
  );
}
