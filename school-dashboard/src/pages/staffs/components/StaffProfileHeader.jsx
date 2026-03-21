/**
 * StaffProfileHeader - Staff profile header matching student profile UI
 */
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft, Edit, MessageSquare, CreditCard, MoreVertical, Trash2,
  Phone, FileCheck, Download, Printer, Share2, Bell, Users, Camera
} from "lucide-react";
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Tooltip } from "@heroui/react";
import PhotoAvatar from "../../../components/PhotoAvatar";
import PhotoEditorModal from "../../../components/PhotoEditorModal";
import CameraCaptureModal from "../../../components/CameraCaptureModal";
import { useState } from "react";

export default function StaffProfileHeader({
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
      toast.error("No photo to adjust");
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
      toast.success("Photo removed");
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
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file && onPhotoClick) {
                onPhotoClick(file);
              }
            }}
          />
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
                  title="Change photo"
                >
                  <Camera size={14} className="text-gray-600 dark:text-zinc-400" />
                </div>
              </DropdownTrigger>
              <DropdownMenu aria-label="Photo actions">
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
                  toast.error("No phone number available");
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
            <DropdownMenu aria-label="Staff actions" closeOnSelect={false}>
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
                onPress={() => toast.success("Notification sent")}
              >
                Send Notification
              </DropdownItem>

              <DropdownItem
                key="shareProfile"
                startContent={<Share2 size={16} />}
                onPress={() => toast.success("Profile link copied")}
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
                onPress={() => toast.success("Report generated")}
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
                onPress={() => toast.success("Profile downloaded")}
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
