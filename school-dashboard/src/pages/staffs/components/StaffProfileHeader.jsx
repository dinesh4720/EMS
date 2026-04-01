/**
 * StaffProfileHeader - Staff profile header matching student profile UI
 */
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { announcementsApi } from "../../../services/api";
import {
  ArrowLeft, Edit, MessageSquare, CreditCard, MoreVertical, Trash2,
  Phone, FileCheck, Download, Printer, Share2, Bell, Users, Camera
} from "lucide-react";
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Tooltip } from "@heroui/react";
import PhotoAvatar from "../../../components/PhotoAvatar";
import PhotoEditorModal from "../../../components/PhotoEditorModal";
import CameraCaptureModal from "../../../components/CameraCaptureModal";
import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { escapeHtml } from "../../../utils/sanitize";
import { formatShortDate } from '../../../utils/dateFormatter';

export default function StaffProfileHeader({
  const { t } = useTranslation();
  staff,
  picturePreview,
  onPhotoClick,
  onEditClick,
  onMessageClick,
  hasPermission,
  onDeleteClick,
  onTabChange
}) {
  const navigate = useNavigate();

  // Modal states for photo actions
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const [isCameraCaptureOpen, setIsCameraCaptureOpen] = useState(false);
  const [selectedImageForEdit, setSelectedImageForEdit] = useState(null);

  const handleAdjustPhoto = () => {
    const currentPhoto = picturePreview || staff.picture;
    if (currentPhoto) {
      setSelectedImageForEdit(currentPhoto);
      setIsPhotoEditorOpen(true);
    } else {
      toast.error(t('toast.error.noPhotoToAdjust'));
    }
  };

  const handleUploadNewPhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file && onPhotoClick) {
        onPhotoClick(file);
      }
    };
    input.click();
  };

  const handleRemovePhoto = () => {
    if (staff.picture && onPhotoClick) {
      onPhotoClick(null);
      toast.success(t('toast.success.photoRemoved'));
    }
  };

  const handlePhotoSave = (editedImage) => {
    if (onPhotoClick) {
      onPhotoClick(editedImage);
    }
    setIsPhotoEditorOpen(false);
  };

  return (
    <>
      <div className="w-full bg-white dark:bg-zinc-950 rounded-lg p-6 border border-gray-200 dark:border-zinc-800 flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gray-50 dark:bg-zinc-800/50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-center gap-6 z-10 w-full lg:w-auto">
          {/* Back Button */}
          <div className="self-start md:self-center mr-2">
            <Button isIconOnly variant="light" onPress={() => navigate('/staffs')} className="text-default-500">
              <ArrowLeft size={20} />
            </Button>
          </div>

          {/* Avatar */}
          <div className="relative group">
            <PhotoAvatar
              src={picturePreview || staff.picture}
              alt={staff.name}
              name={staff.name}
              size="xl"
              type="staff"
            />
            <Dropdown>
              <DropdownTrigger>
                <div
                  className="absolute -bottom-1 -right-1 bg-white dark:bg-zinc-900 rounded-full p-1.5 shadow-sm border border-gray-200 dark:border-zinc-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                  title={t('pages.changePhoto1')}
                >
                  <Camera size={14} className="text-gray-600 dark:text-zinc-400" />
                </div>
              </DropdownTrigger>
              <DropdownMenu aria-label={t('aria.menus.photoActions')}>
                <DropdownItem
                  key="adjust"
                  startContent={<Camera size={16} />}
                  onPress={handleAdjustPhoto}
                >
                  Adjust photo
                </DropdownItem>
                <DropdownItem
                  key="upload"
                  startContent={<Camera size={16} />}
                  onPress={handleUploadNewPhoto}
                >
                  Upload new photo
                </DropdownItem>
                <DropdownItem
                  key="remove"
                  className="text-danger"
                  color="danger"
                  startContent={<Trash2 size={16} />}
                  onPress={handleRemovePhoto}
                >
                  Remove photo
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>

          {/* Staff Info */}
          <div className="text-center md:text-left space-y-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{staff.name}</h1>
            <div className="flex items-center justify-center md:justify-start gap-3 text-gray-600 dark:text-gray-400 font-medium text-sm mt-1">
              {Array.isArray(staff.role) ? (
                staff.role.map((r) => (
                  <span key={r} className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-2.5 py-0.5 rounded-md">
                    {r}
                  </span>
                ))
              ) : (
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-2.5 py-0.5 rounded-md capitalize">
                  {staff.role || "Staff"}
                </span>
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-2.5 py-0.5 rounded-md">
                {staff.department || "General"}
              </span>
              {staff.joinDate && <span className="text-gray-500 dark:text-gray-400">• Joined {staff.joinDate}</span>}
            </div>
          </div>
        </div>

        {/* Actions Row */}
        <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 z-10 w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-zinc-700 pt-4 lg:pt-0 lg:pl-6">
          {/* Call Button */}
          <Tooltip content={staff.phone ? `Call ${staff.name}` : "Call Staff"} placement="bottom">
            <Button
              className="bg-gray-900 hover:bg-gray-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900"
              startContent={<Phone size={18} />}
              onPress={() => {
                if (staff.phone) {
                  window.location.href = `tel:${staff.phone}`;
                  toast.success(`Calling ${staff.name}...`);
                } else {
                  toast.error(t('toast.error.noPhoneNumberAvailable'));
                }
              }}
              isDisabled={!staff.phone}
            >
              Call Staff
            </Button>
          </Tooltip>

          {/* Edit Profile Button */}
          <Button
            variant="bordered"
            className="border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300"
            startContent={<Edit size={18} />}
            onPress={onEditClick}
            isDisabled={!hasPermission('staff', 'edit')}
          >
            Edit Profile
          </Button>

          {/* Vertical Dot Menu */}
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly variant="light" color="default">
                <MoreVertical size={20} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label={t('aria.menus.staffActions')} closeOnSelect={false}>
              {/* Communication Section */}
              <DropdownItem sectionTitle="Communication" key="communication-header" showDivider>
                Communication
              </DropdownItem>

              <DropdownItem
                key="sendMessage"
                startContent={<MessageSquare size={16} />}
                onPress={onMessageClick}
              >
                Send Message
              </DropdownItem>

              <DropdownItem
                key="sendNotification"
                startContent={<Bell size={16} />}
                onPress={async () => {
                  const staffId = staff._id || staff.id;
                  if (!staffId) { toast.error('Staff ID not available'); return; }
                  const loadingId = toast.loading('Sending notification…');
                  try {
                    await announcementsApi.create({
                      title: `Notification from Admin`,
                      content: `You have a new notification from the administration.`,
                      recipients: [{ type: 'custom', userIds: [staffId] }],
                      channels: ['in_app'],
                    });
                    toast.dismiss(loadingId);
                    toast.success(`Notification sent to ${staff.name}`);
                  } catch (err) {
                    toast.dismiss(loadingId);
                    toast.error('Failed to send notification');
                    console.error('Notification error:', err);
                  }
                }}
              >
                Send Notification
              </DropdownItem>

              <DropdownItem
                key="shareProfile"
                startContent={<Share2 size={16} />}
                onPress={() => {
                  const url = window.location.href;
                  navigator.clipboard.writeText(url).then(() => {
                    toast.success(t('toast.success.profileLinkCopied'));
                  }).catch(() => {
                    toast.error('Failed to copy link');
                  });
                }}
              >
                Share Profile
              </DropdownItem>

              {/* Academic Section */}
              <DropdownItem sectionTitle="Academic" key="academic-header" showDivider>
                Academic
              </DropdownItem>

              <DropdownItem
                key="viewSalary"
                startContent={<CreditCard size={16} />}
                onPress={() => onTabChange?.('payroll')}
              >
                View Salary
              </DropdownItem>

              <DropdownItem
                key="viewClasses"
                startContent={<Users size={16} />}
                onPress={() => onTabChange?.('classes')}
              >
                View Classes
              </DropdownItem>

              <DropdownItem
                key="generateReport"
                startContent={<FileCheck size={16} />}
                onPress={() => {
                  const rows = [
                    ['Field', 'Value'],
                    ['Name', staff.name || ''],
                    ['Employee Code', staff.code || ''],
                    ['Role', Array.isArray(staff.role) ? staff.role.join(', ') : (staff.role || '')],
                    ['Department', staff.department || ''],
                    ['Email', staff.email || ''],
                    ['Phone', staff.phone || ''],
                    ['Status', staff.status || ''],
                    ['Join Date', staff.joinDate || ''],
                    ['Qualification', staff.qualification || ''],
                    ['Address', staff.address || ''],
                    ['Report Generated', new Date().toLocaleString()],
                  ];
                  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `staff-report-${staff.code || staff.name?.replace(/\s+/g, '-') || 'unknown'}-${new Date().toISOString().split('T')[0]}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  toast.success('Staff report downloaded');
                }}
              >
                Generate Report
              </DropdownItem>

              {/* Other Section */}
              <DropdownItem sectionTitle="Other" key="other-header" showDivider>
                Other
              </DropdownItem>

              <DropdownItem
                key="download"
                startContent={<Download size={16} />}
                onPress={() => {
                  const roles = escapeHtml(Array.isArray(staff.role) ? staff.role.join(', ') : (staff.role || 'Staff'));
                  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Staff Profile – ${escapeHtml(staff.name || '')}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#111;padding:40px;max-width:680px;margin:auto}
.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #111;padding-bottom:16px;margin-bottom:24px}
.header h1{font-size:22px;font-weight:700}.header p{font-size:13px;color:#666;margin-top:4px}
.badge{background:#f3f4f6;border:1px solid #e5e7eb;color:#374151;padding:4px 12px;border-radius:99px;font-size:11px;font-weight:600}
.section{margin-bottom:20px}
.section-title{font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px}
.rows{border:1px solid #e5e7eb;border-radius:8px;overflow:hidden}
.row{display:flex;font-size:13px;border-bottom:1px solid #f3f4f6}
.row:last-child{border-bottom:none}
.row .lbl{width:160px;min-width:160px;padding:10px 14px;background:#f9fafb;color:#6b7280;font-weight:500}
.row .val{padding:10px 14px;color:#111}
.footer{text-align:center;font-size:11px;color:#aaa;margin-top:28px}
@media print{body{padding:20px}}
</style></head>
<body>
<div class="header">
  <div><h1>${escapeHtml(staff.name || 'Staff Profile')}</h1><p>${roles} • ${escapeHtml(staff.department || 'General')}</p></div>
  <span class="badge">${escapeHtml(staff.status || 'Active')}</span>
</div>
<div class="section">
  <div class="section-title">Basic Information</div>
  <div class="rows">
    <div class="row"><span class="lbl">Employee Code</span><span class="val">${escapeHtml(staff.code || '—')}</span></div>
    <div class="row"><span class="lbl">Full Name</span><span class="val">${escapeHtml(staff.name || '—')}</span></div>
    <div class="row"><span class="lbl">Role</span><span class="val">${roles}</span></div>
    <div class="row"><span class="lbl">Department</span><span class="val">${escapeHtml(staff.department || '—')}</span></div>
    <div class="row"><span class="lbl">Qualification</span><span class="val">${escapeHtml(staff.qualification || '—')}</span></div>
    <div class="row"><span class="lbl">Join Date</span><span class="val">${escapeHtml(staff.joinDate || '—')}</span></div>
  </div>
</div>
<div class="section">
  <div class="section-title">Contact Information</div>
  <div class="rows">
    <div class="row"><span class="lbl">Email</span><span class="val">${escapeHtml(staff.email || '—')}</span></div>
    <div class="row"><span class="lbl">Phone</span><span class="val">${escapeHtml(staff.phone || '—')}</span></div>
    <div class="row"><span class="lbl">Address</span><span class="val">${escapeHtml(staff.address || '—')}</span></div>
  </div>
</div>
<div class="footer">Generated on ${formatShortDate(new Date())} — Confidential</div>
</body></html>`;
                  const w = window.open('', '_blank', 'width=750,height=650');
                  if (!w) { toast.error('Pop-up blocked. Allow pop-ups to download profile.'); return; }
                  w.document.write(html);
                  w.document.close();
                  w.focus();
                  setTimeout(() => w.print(), 400);
                }}
              >
                Download Profile
              </DropdownItem>

              <DropdownItem
                key="print"
                startContent={<Printer size={16} />}
                onPress={() => window.print()}
              >
                Print Profile
              </DropdownItem>

              {/* Delete */}
              <DropdownItem
                key="delete"
                className="text-danger"
                color="danger"
                startContent={<Trash2 size={16} />}
                onPress={onDeleteClick}
              >
                Delete Staff
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* Photo Editor Modal */}
      {selectedImageForEdit && (
        <PhotoEditorModal
          isOpen={isPhotoEditorOpen}
          onClose={() => setIsPhotoEditorOpen(false)}
          imageSrc={selectedImageForEdit}
          onSave={handlePhotoSave}
        />
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraCaptureOpen}
        onClose={() => setIsCameraCaptureOpen(false)}
        onPhotoCaptured={(photo) => {
          if (onPhotoClick) {
            onPhotoClick(photo);
          }
          setIsCameraCaptureOpen(false);
        }}
      />
    </>
  );
}
