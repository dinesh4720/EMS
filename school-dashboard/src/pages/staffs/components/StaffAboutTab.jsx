/**
 * StaffAboutTab - Minimal gray styling matching StudentDashboard
 */
import { User, Briefcase, Phone, Landmark, Mail, MapPin } from "lucide-react";

export default function StaffAboutTab({ staff }) {
  return (
    <div className="space-y-4">
      {/* Personal Information */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"><User size={16} className="text-gray-600" /></div>
            <h3 className="font-medium text-gray-900 text-sm">Personal Information</h3>
          </div>
        </div>
        <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoItem
            label="Full Name"
            value={staff.name && /^[a-f\d]{24}$/i.test(staff.name) ? (staff.code || '—') : (staff.name || '—')}
          />
          <InfoItem label="Staff ID" value={staff.code || staff.id} />
          <InfoItem label="Date of Birth" value={staff.dateOfBirth} />
          <InfoItem label="Gender" value={staff.gender} />
          <InfoItem label="Marital Status" value={staff.maritalStatus} />
          <InfoItem label="Blood Group" value={staff.bloodGroup} />
          <InfoItem label="Qualification" value={staff.qualification} />
          <InfoItem label="Experience" value={`${staff.experience || 0} Years`} />
          <InfoItem label="Nationality" value={staff.nationality || "Indian"} />
        </div>
      </div>

      {/* Employment Details */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"><Briefcase size={16} className="text-gray-600" /></div>
            <h3 className="font-medium text-gray-900 text-sm">Employment Details</h3>
          </div>
        </div>
        <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoItem
            label="Role"
            value={Array.isArray(staff.role) ? staff.role.join(', ') : staff.role}
          />
          <InfoItem label="Department" value={staff.department} />
          <InfoItem label="Designation" value={staff.designation} />
          <InfoItem label="Joining Date" value={staff.joinDate} />
          <InfoItem label="Employment Status" value={staff.status} />
          <InfoItem label="Previous Organization" value={staff.previousOrganization || "—"} />
          <InfoItem label="Role in Previous Organization" value={staff.roleInOrganization || "—"} />
        </div>
      </div>

      {/* Contact Details */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"><Phone size={16} className="text-gray-600" /></div>
            <h3 className="font-medium text-gray-900 text-sm">Contact Details</h3>
          </div>
        </div>
        <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="col-span-full"><p className="text-xs text-gray-400 mb-1">Address</p><p className="text-sm text-gray-900">{staff.address || "—"}</p></div>
          <InfoItem label="City" value={staff.city} />
          <InfoItem label="State" value={staff.state} />
          <InfoItem label="ZIP Code" value={staff.zipCode} />
          <InfoItem label="Phone" value={staff.phone} icon={<Phone size={14} />} isLink={staff.phone ? `tel:${staff.phone}` : null} />
          <InfoItem label="Email" value={staff.email} icon={<Mail size={14} />} isLink={staff.email ? `mailto:${staff.email}` : null} />
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"><Mail size={16} className="text-gray-600" /></div>
            <h3 className="font-medium text-gray-900 text-sm">Emergency Contact</h3>
          </div>
        </div>
        <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.emergencyContacts && staff.emergencyContacts.length > 0 ? (
            <>
              {staff.emergencyContacts.map((contact, index) => (
                <InfoItem
                  key={index}
                  label={`Contact ${index + 1}`}
                  value={`${contact.name} (${contact.relationship}): ${contact.phone}`}
                  className="col-span-full"
                />
              ))}
            </>
          ) : (
            <>
              <InfoItem label="Emergency Contact" value={staff.emergencyContact || "—"} />
              <InfoItem label="Emergency Phone" value={staff.emergencyPhone || "—"} />
            </>
          )}
        </div>
      </div>

      {/* Bank Account Details */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"><Landmark size={16} className="text-gray-600" /></div>
            <h3 className="font-medium text-gray-900 text-sm">Bank Account Details</h3>
          </div>
        </div>
        <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoItem label="Account Holder" value={staff.accountHolder} />
          <InfoItem label="Account Number" value={staff.accountNumber ? `••••${staff.accountNumber.slice(-4)}` : "—"} />
          <InfoItem label="Bank Name" value={staff.bankName} />
          <InfoItem label="IFSC Code" value={staff.ifscCode} />
          <InfoItem label="Branch" value={staff.branchName || "—"} />
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, className = "", icon = null, isLink = null }) {
  return (
    <div className={className}>
      <p className="text-xs text-gray-400 mb-1 flex items-center gap-1.5">
        {icon && <span className="text-gray-400">{icon}</span>}
        {label}
      </p>
      {isLink && value ? (
        <a href={isLink} className="text-sm text-gray-900 hover:underline transition-colors">
          {value || "—"}
        </a>
      ) : (
        <p className="text-sm text-gray-900">{value || "—"}</p>
      )}
    </div>
  );
}
