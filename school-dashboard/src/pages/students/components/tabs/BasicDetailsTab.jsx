import { Button } from "@heroui/react";
import { GraduationCap, User, Phone, Users, FileCheck, Edit } from "lucide-react";
import InfoItem from "../shared/InfoItem";

/**
 * BasicDetailsTab - Student personal and academic details
 */
export default function BasicDetailsTab({
  student,
  classTeacher,
  onEditSection
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Academic Information */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <GraduationCap size={18} className="text-gray-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Academic Information</h3>
          </div>
          {onEditSection && (
            <Button 
              isIconOnly 
              size="sm" 
              variant="light" 
              onPress={() => onEditSection("academic")}
              className="text-gray-500 hover:text-gray-700"
            >
              <Edit size={16} />
            </Button>
          )}
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-6">
          <InfoItem label="Class" value={student?.class || "N/A"} />
          <InfoItem label="Roll Number" value={student?.rollNo || "N/A"} />
          <InfoItem label="Academic Year" value={student?.academicYear || "2024-25"} />
          <InfoItem label="Class Teacher" value={classTeacher?.name || "Not Assigned"} />
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <User size={18} className="text-gray-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Personal Information</h3>
          </div>
          {onEditSection && (
            <Button 
              isIconOnly 
              size="sm" 
              variant="light" 
              onPress={() => onEditSection("personal")}
              className="text-gray-500 hover:text-gray-700"
            >
              <Edit size={16} />
            </Button>
          )}
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-6">
          <InfoItem label="Full Name" value={student?.name} />
          <InfoItem label="Admission ID" value={student?.admissionId} />
          <InfoItem label="Date of Birth" value={student?.dateOfBirth} />
          <InfoItem label="Gender" value={student?.gender} />
          <InfoItem label="Blood Group" value={student?.bloodGroup} />
          <InfoItem label="Religion" value={student?.religion} />
          <InfoItem label="Category" value={student?.category} />
          <InfoItem label="Mother Tongue" value={student?.motherTongue} />
          <InfoItem label="Aadhaar Number" value={student?.aadhaarNumber} />
          <InfoItem label="Nationality" value={student?.nationality} />
        </div>
      </div>

      {/* Contact Details */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <Phone size={18} className="text-gray-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Contact Details</h3>
          </div>
          {onEditSection && (
            <Button 
              isIconOnly 
              size="sm" 
              variant="light" 
              onPress={() => onEditSection("contact")}
              className="text-gray-500 hover:text-gray-700"
            >
              <Edit size={16} />
            </Button>
          )}
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-6">
          <div className="col-span-full">
            <InfoItem label="Address" value={student?.address} />
          </div>
          <InfoItem label="City" value={student?.city} />
          <InfoItem label="State" value={student?.state} />
          <InfoItem label="ZIP Code" value={student?.zipCode} />
          <InfoItem label="Phone" value={student?.phone} />
          <InfoItem label="Email" value={student?.email} />
        </div>
      </div>

      {/* Parent/Guardian */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <Users size={18} className="text-gray-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Parent / Guardian</h3>
          </div>
          {onEditSection && (
            <Button 
              isIconOnly 
              size="sm" 
              variant="light" 
              onPress={() => onEditSection("parents")}
              className="text-gray-500 hover:text-gray-700"
            >
              <Edit size={16} />
            </Button>
          )}
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-6">
          <InfoItem label="Father's Name" value={student?.parentName} />
          <InfoItem label="Father's Occupation" value={student?.parentOccupation} />
          <InfoItem label="Mother's Name" value={
            student?.parents && student.parents.find(p => p.relationship?.toLowerCase() === 'mother')?.name ||
            student?.parents && student.parents.find(p => p.relationship?.toLowerCase() === 'wife')?.name ||
            'N/A'
          } />
          <InfoItem label="Mother's Occupation" value={
            student?.parents && student.parents.find(p => p.relationship?.toLowerCase() === 'mother')?.occupation ||
            student?.parents && student.parents.find(p => p.relationship?.toLowerCase() === 'wife')?.occupation ||
            'N/A'
          } />
          <InfoItem label="Primary Phone" value={student?.parentPhone} />
          <InfoItem label="Alternate Phone" value={student?.alternatePhone} />
          <InfoItem label="Primary Email" value={student?.parentEmail} />
        </div>
      </div>

      {/* Previous Education */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <GraduationCap size={18} className="text-gray-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Previous Education</h3>
          </div>
          {onEditSection && (
            <Button 
              isIconOnly 
              size="sm" 
              variant="light" 
              onPress={() => onEditSection("education")}
              className="text-gray-500 hover:text-gray-700"
            >
              <Edit size={16} />
            </Button>
          )}
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-6">
          <InfoItem label="Previous School" value={student?.previousSchool} />
          <InfoItem label="TC Number" value={student?.tcNumber} />
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <FileCheck size={18} className="text-gray-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Additional Information</h3>
          </div>
          {onEditSection && (
            <Button 
              isIconOnly 
              size="sm" 
              variant="light" 
              onPress={() => onEditSection("additional")}
              className="text-gray-500 hover:text-gray-700"
            >
              <Edit size={16} />
            </Button>
          )}
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-6">
          <InfoItem label="Academic Year" value={student?.academicYear || "2024-25"} />
          <InfoItem label="Transport Required" value={student?.transportRequired ? "Yes" : "No"} />
          <InfoItem label="Hostel Required" value={student?.hostelRequired ? "Yes" : "No"} />
          <div className="col-span-full">
            <InfoItem label="Medical Conditions" value={student?.medicalConditions || "None"} />
          </div>
          <InfoItem label="Emergency Contact Name" value={student?.emergencyContactName || "-"} />
          <InfoItem label="Emergency Contact Phone" value={student?.emergencyContactPhone || "-"} />
        </div>
      </div>
    </div>
  );
}
