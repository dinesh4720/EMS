import {
  Button,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { ArrowLeft, Camera, Edit, MoreVertical, Phone } from "lucide-react";
import { getSafeDisplayName, getSafeInitials } from "../../../../utils/objectIdHelper";

export default function StaffProfileHeader({
  staff,
  picturePreview,
  subjectAssignments,
  fileInputRef,
  handleRemovePhoto,
  setIsCameraCaptureOpen,
  handleEditClick,
  onOpen,
  navigate,
  t,
}) {
  return (
    <div className="mb-6">
      <button
        onClick={() => navigate("/staffs")}
        className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300 transition-colors mb-2"
      >
        <ArrowLeft size={16} />
        <span>{t("pages.backToStaff")}</span>
      </button>

      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative">
              <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center">
                {picturePreview || staff.picture ? (
                  <img
                    src={picturePreview || staff.picture}
                    alt={staff.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className="text-xl font-medium text-gray-400 dark:text-zinc-500">
                    {getSafeInitials(staff.name, staff.code?.charAt(0)?.toUpperCase() || "?")}
                  </span>
                )}
              </div>
              <Dropdown>
                <DropdownTrigger>
                  <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-md bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-900">
                    <Camera size={12} className="text-gray-500 dark:text-zinc-400" />
                  </button>
                </DropdownTrigger>
                <DropdownMenu className="min-w-[140px]">
                  <DropdownItem key="upload" onPress={() => fileInputRef.current?.click()}>
                    {t("pages.uploadPhoto1")}
                  </DropdownItem>
                  <DropdownItem key="camera" onPress={() => setIsCameraCaptureOpen(true)}>
                    {t("pages.takePhoto")}
                  </DropdownItem>
                  <DropdownItem key="remove" className="text-red-600" onPress={handleRemovePhoto}>
                    {t("pages.remove1")}
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>

            {/* Info */}
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">
                {getSafeDisplayName(staff, "code")}
              </h1>

              {/* Roles */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">
                  {t("pages.roles1")}
                </span>
                {Array.isArray(staff.role) ? (
                  staff.role.map((role) => (
                    <Chip
                      key={role}
                      size="sm"
                      variant="flat"
                      classNames={{
                        base:
                          role === "Admin" || role === "Principal"
                            ? "bg-gray-800 dark:bg-zinc-200 text-white dark:text-zinc-900"
                            : role === "Teacher"
                            ? "bg-gray-700 dark:bg-zinc-300 text-white dark:text-zinc-900"
                            : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300",
                        content: "text-xs font-medium",
                      }}
                    >
                      {role}
                    </Chip>
                  ))
                ) : (
                  <Chip
                    size="sm"
                    variant="flat"
                    classNames={{
                      base: "bg-gray-700 dark:bg-zinc-300 text-white dark:text-zinc-900",
                      content: "text-xs font-medium",
                    }}
                  >
                    {staff.role}
                  </Chip>
                )}
              </div>

              {/* Subjects (teachers only) */}
              {subjectAssignments.length > 0 && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">
                    {t("pages.subjectsHandling")}
                  </span>
                  {[...new Set(subjectAssignments.map((a) => a.subject).filter(Boolean))].map(
                    (subject) => (
                      <Chip
                        key={subject}
                        size="sm"
                        variant="flat"
                        classNames={{
                          base: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800",
                          content: "text-xs font-medium",
                        }}
                      >
                        {subject}
                      </Chip>
                    )
                  )}
                </div>
              )}

              {/* Department (non-teachers) */}
              {subjectAssignments.length === 0 && staff.department && (
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 dark:text-zinc-500">
                  <span>{staff.department}</span>
                </div>
              )}

              {/* Contact */}
              {staff.phone && (
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 dark:text-zinc-500">
                  <Phone size={12} />
                  <span>{staff.phone}</span>
                  {staff.email && (
                    <>
                      <span className="text-gray-300 dark:text-zinc-600">|</span>
                      <span>{staff.email}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="flat"
              className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300"
              startContent={<Phone size={16} />}
              onPress={() => {
                if (staff.phone) {
                  window.location.href = `tel:${staff.phone.replace(/[^\d+]/g, "")}`;
                } else {
                  // no-op — button is disabled when no phone
                }
              }}
              isDisabled={!staff.phone}
            >
              {t("pages.call")}
            </Button>
            <Button
              className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-gray-800 dark:hover:bg-zinc-200"
              startContent={<Edit size={16} />}
              onPress={handleEditClick}
            >
              {t("pages.edit1")}
            </Button>
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly variant="light" className="text-gray-400 dark:text-zinc-500">
                  <MoreVertical size={20} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu className="min-w-[180px]">
                <DropdownItem key="message" onPress={onOpen}>
                  {t("pages.sendMessage")}
                </DropdownItem>
                <DropdownItem key="download" onPress={() => window.print()}>
                  {t("pages.downloadProfile")}
                </DropdownItem>
                <DropdownItem key="print" onPress={() => window.print()}>
                  {t("pages.print")}
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </div>
    </div>
  );
}
