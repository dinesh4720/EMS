/**
 * StaffAboutTab - Minimal gray styling matching StudentDashboard
 */
import { User, Briefcase, Phone, Landmark, Mail, MapPin } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function StaffAboutTab({ staff }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      {/* Personal Information */}
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><User size={16} className="text-gray-600 dark:text-zinc-400" /></div>
            <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('pages.personalInformation1')}</h3>
          </div>
        </div>
        <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoItem
            label={t('pages.fullName1')}
            value={staff.name && /^[a-f\d]{24}$/i.test(staff.name) ? (staff.code || '—') : (staff.name || '—')}
          />
          <InfoItem label={t('pages.staffId')} value={staff.code || staff.id} />
          <InfoItem label={t('pages.dateOfBirth2')} value={staff.dateOfBirth} />
          <InfoItem label={t('pages.gender1')} value={staff.gender} />
          <InfoItem label={t('pages.maritalStatus1')} value={staff.maritalStatus} />
          <InfoItem label={t('pages.bloodGroup1')} value={staff.bloodGroup} />
          <InfoItem label={t('pages.qualification')} value={staff.qualification} />
          <InfoItem label={t('pages.experience')} value={`${staff.experience || 0} Years`} />
          <InfoItem label={t('pages.nationality1')} value={staff.nationality || "Indian"} />
        </div>
      </div>

      {/* Employment Details */}
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><Briefcase size={16} className="text-gray-600 dark:text-zinc-400" /></div>
            <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('pages.employmentDetails')}</h3>
          </div>
        </div>
        <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoItem
            label={t('pages.role1')}
            value={Array.isArray(staff.role) ? staff.role.join(', ') : staff.role}
          />
          <InfoItem label={t('pages.department1')} value={staff.department} />
          <InfoItem label={t('pages.designation1')} value={staff.designation} />
          <InfoItem label={t('pages.joiningDate')} value={staff.joinDate} />
          <InfoItem label={t('pages.employmentStatus')} value={staff.status} />
          <InfoItem label={t('pages.previousOrganization')} value={staff.previousOrganization || "—"} />
          <InfoItem label={t('pages.roleInPreviousOrganization')} value={staff.roleInOrganization || "—"} />
        </div>
      </div>

      {/* Contact Details */}
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><Phone size={16} className="text-gray-600 dark:text-zinc-400" /></div>
            <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('pages.contactDetails1')}</h3>
          </div>
        </div>
        <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="col-span-full"><p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t('pages.address2')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{staff.address || "—"}</p></div>
          <InfoItem label={t('pages.city1')} value={staff.city} />
          <InfoItem label={t('pages.state1')} value={staff.state} />
          <InfoItem label={t('pages.zIPCode')} value={staff.zipCode} />
          <InfoItem label={t('pages.phone1')} value={staff.phone} icon={<Phone size={14} />} isLink={staff.phone ? `tel:${staff.phone}` : null} />
          <InfoItem label={t('pages.email1')} value={staff.email} icon={<Mail size={14} />} isLink={staff.email ? `mailto:${staff.email}` : null} />
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><Mail size={16} className="text-gray-600 dark:text-zinc-400" /></div>
            <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('pages.emergencyContact')}</h3>
          </div>
        </div>
        <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.emergencyContacts && staff.emergencyContacts.length > 0 ? (
            <>
              {staff.emergencyContacts.map((contact, index) => (
                <InfoItem
                  key={contact._id || contact.phone || index}
                  label={`Contact ${index + 1}`}
                  value={`${contact.name} (${contact.relationship}): ${contact.phone}`}
                  className="col-span-full"
                />
              ))}
            </>
          ) : (
            <>
              <InfoItem label={t('pages.emergencyContact')} value={staff.emergencyContact || "—"} />
              <InfoItem label={t('pages.emergencyPhone')} value={staff.emergencyPhone || "—"} />
            </>
          )}
        </div>
      </div>

      {/* Bank Account Details */}
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><Landmark size={16} className="text-gray-600 dark:text-zinc-400" /></div>
            <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('pages.bankAccountDetails1')}</h3>
          </div>
        </div>
        <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoItem label={t('pages.accountHolder')} value={staff.accountHolder} />
          <InfoItem label={t('pages.accountNumber')} value={staff.accountNumber ? `••••${staff.accountNumber.slice(-4)}` : "—"} />
          <InfoItem label={t('pages.bankName')} value={staff.bankName} />
          <InfoItem label={t('pages.iFSCCode')} value={staff.ifscCode} />
          <InfoItem label={t('pages.branch')} value={staff.branchName || "—"} />
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, className = "", icon = null, isLink = null }) {
  return (
    <div className={className}>
      <p className="text-xs text-gray-400 dark:text-zinc-500 mb-1 flex items-center gap-1.5">
        {icon && <span className="text-gray-400 dark:text-zinc-500">{icon}</span>}
        {label}
      </p>
      {isLink && value ? (
        <a href={isLink} className="text-sm text-gray-900 dark:text-zinc-100 hover:underline transition-colors">
          {value || "—"}
        </a>
      ) : (
        <p className="text-sm text-gray-900 dark:text-zinc-100">{value || "—"}</p>
      )}
    </div>
  );
}
