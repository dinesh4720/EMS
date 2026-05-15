/**
 * StaffAboutTab - Minimal gray styling matching StudentDashboard
 */
import { User, Briefcase, Phone, Landmark, Mail } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function StaffAboutTab({ staff }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      {/* Personal Information */}
      <div className="bg-surface rounded-lg border border-border-token overflow-hidden">
        <div className="p-5 border-b border-border-token flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center"><User size={16} className="text-fg-muted" /></div>
            <h3 className="font-medium text-fg text-sm">{t('pages.personalInformation1')}</h3>
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
      <div className="bg-surface rounded-lg border border-border-token overflow-hidden">
        <div className="p-5 border-b border-border-token flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center"><Briefcase size={16} className="text-fg-muted" /></div>
            <h3 className="font-medium text-fg text-sm">{t('pages.employmentDetails')}</h3>
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
      <div className="bg-surface rounded-lg border border-border-token overflow-hidden">
        <div className="p-5 border-b border-border-token flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center"><Phone size={16} className="text-fg-muted" /></div>
            <h3 className="font-medium text-fg text-sm">{t('pages.contactDetails1')}</h3>
          </div>
        </div>
        <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="col-span-full"><p className="text-xs text-fg-faint mb-1">{t('pages.address2')}</p><p className="text-sm text-fg">{staff.address || "—"}</p></div>
          <InfoItem label={t('pages.phone1')} value={staff.phone} icon={<Phone size={14} />} isLink={staff.phone ? `tel:${staff.phone}` : null} />
          <InfoItem label={t('pages.email1')} value={staff.email} icon={<Mail size={14} />} isLink={staff.email ? `mailto:${staff.email}` : null} />
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-surface rounded-lg border border-border-token overflow-hidden">
        <div className="p-5 border-b border-border-token flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center"><Mail size={16} className="text-fg-muted" /></div>
            <h3 className="font-medium text-fg text-sm">{t('pages.emergencyContact')}</h3>
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
      <div className="bg-surface rounded-lg border border-border-token overflow-hidden">
        <div className="p-5 border-b border-border-token flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center"><Landmark size={16} className="text-fg-muted" /></div>
            <h3 className="font-medium text-fg text-sm">{t('pages.bankAccountDetails1')}</h3>
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
      <p className="text-xs text-fg-faint mb-1 flex items-center gap-1.5">
        {icon && <span className="text-fg-faint">{icon}</span>}
        {label}
      </p>
      {isLink && value ? (
        <a href={isLink} className="text-sm text-fg hover:underline transition-colors">
          {value || "—"}
        </a>
      ) : (
        <p className="text-sm text-fg">{value || "—"}</p>
      )}
    </div>
  );
}
