import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Button, Avatar, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Tooltip
} from "@heroui/react";
import {
  ArrowLeft, Edit, FileCheck, BarChart4, TrendingUp as TrendingIcon,
  MoreVertical, Trash2, Camera, Phone, Move, GraduationCap,
  MessageSquare, Download, Printer, Share2, Bell
} from "lucide-react";
import PhotoAvatar from "../../../components/PhotoAvatar";
import PhotoEditorModal from "../../../components/PhotoEditorModal";
import CameraCaptureModal from "../../../components/CameraCaptureModal";
import PrintableStudentProfile from "./PrintableStudentProfile";
import MoveClassModal from "./modals/MoveClassModal";
import WriteRemarkModal from "./modals/WriteRemarkModal";
import MarkAlumniModal from "./modals/MarkAlumniModal";
import SendFeeReminderModal from "./modals/SendFeeReminderModal";
import ShareProfileModal from "./modals/ShareProfileModal";
import { useStudentPhotoActions } from "../hooks/useStudentPhotoActions";

export default function StudentProfileHeader({
  student,
  onEdit,
  onDelete,
  onGenerateTC,
  onProgressCard,
  onPromote,
  onUpdateStudent,
  availableClasses = [],
  results = [],
  attendanceStats = {},
  studentFeeStructure = null,
  staff = []
}) {
  const navigate = useNavigate();
  const printRef = useRef(null);

  // Photo actions hook
  const photoActions = useStudentPhotoActions(student, onUpdateStudent, printRef);

  // Modal states
  const [isMoveClassOpen, setIsMoveClassOpen] = useState(false);
  const [isRemarkOpen, setIsRemarkOpen] = useState(false);
  const [isAlumniOpen, setIsAlumniOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Refresh callback for modal actions
  const handleRefresh = () => {
    // Trigger a re-fetch or update via parent
    if (onUpdateStudent) {
      onUpdateStudent(student.id, {});
    }
  };

  return (
    <>
      <div className="w-full bg-white dark:bg-zinc-900 rounded-lg p-6 border border-gray-200 flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gray-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-center gap-6 z-10 w-full lg:w-auto">
          {/* Back Button */}
          <div className="self-start md:self-center mr-2">
            <Button isIconOnly variant="light" onPress={() => navigate('/students')} className="text-default-500">
              <ArrowLeft size={20} />
            </Button>
          </div>

          {/* Avatar */}
          <input
            type="file"
            ref={photoActions.fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={photoActions.handleFileSelect}
          />
          <div className="relative group">
            <PhotoAvatar
              src={student.photo}
              alt={student.name}
              name={student.name}
              size="xl"
              type="student"
            />
            <Dropdown>
              <DropdownTrigger>
                <div
                  className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                  title="Change photo"
                >
                  <Camera size={14} className="text-gray-600" />
                </div>
              </DropdownTrigger>
              <DropdownMenu aria-label="Photo actions">
                <DropdownItem
                  key="adjust"
                  startContent={<Camera size={16} />}
                  onPress={photoActions.handleAdjustPhoto}
                >
                  Adjust photo
                </DropdownItem>
                <DropdownItem
                  key="upload"
                  startContent={<Camera size={16} />}
                  onPress={photoActions.handleUploadNewPhoto}
                >
                  Upload new photo
                </DropdownItem>
                <DropdownItem
                  key="remove"
                  className="text-danger"
                  color="danger"
                  startContent={<Trash2 size={16} />}
                  onPress={photoActions.handleRemovePhoto}
                >
                  Remove photo
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>

          {/* Student Info */}
          <div className="text-center md:text-left space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
            <div className="flex items-center justify-center md:justify-start gap-3 text-gray-600 font-medium text-sm mt-1">
              <span>@{student.admissionId || "Student"}</span>
              <span className="text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-md">
                {student.class || "N/A"}
              </span>
              <span>• Roll {student.rollNo || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Actions Row */}
        <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 z-10 w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6">
          {/* Call Parent Button - Standalone */}
          <Tooltip content={student.parentName ? `Call ${student.parentName}` : "Call Parent"} placement="bottom">
            <Button
              className="bg-gray-900 hover:bg-gray-800 text-white"
              startContent={<Phone size={18} />}
              onPress={() => {
                if (student.parentPhone) {
                  window.location.href = `tel:${student.parentPhone}`;
                  toast.success(`Calling ${student.parentName || "Parent"}...`);
                } else {
                  toast.error("No phone number available");
                }
              }}
              isDisabled={!student.parentPhone}
            >
              Call Parent
            </Button>
          </Tooltip>

          {/* Edit Profile Button - Standalone */}
          <Button
            variant="bordered"
            className="border-gray-200 text-gray-700"
            startContent={<Edit size={18} />}
            onPress={onEdit}
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
            <DropdownMenu aria-label="Student actions" closeOnSelect={false}>
              {/* Academic Actions Section */}
              <DropdownItem sectionTitle="Academic Actions" key="academic-header" showDivider>
                Academic Actions
              </DropdownItem>

              <DropdownItem
                key="promote"
                startContent={<TrendingIcon size={16} />}
                onPress={onPromote}
              >
                Promote Student
              </DropdownItem>

              <DropdownItem
                key="moveClass"
                startContent={<Move size={16} />}
                onPress={() => setIsMoveClassOpen(true)}
              >
                Move to Another Class/Section
              </DropdownItem>

              <DropdownItem
                key="generateTC"
                startContent={<FileCheck size={16} />}
                onPress={onGenerateTC}
              >
                Generate TC
              </DropdownItem>

              <DropdownItem
                key="progressCard"
                startContent={<BarChart4 size={16} />}
                onPress={onProgressCard}
              >
                Progress Card
              </DropdownItem>

              {/* Status Section */}
              <DropdownItem sectionTitle="Status" key="status-header" showDivider>
                Status
              </DropdownItem>

              <DropdownItem
                key="markAlumni"
                startContent={<GraduationCap size={16} />}
                onPress={() => setIsAlumniOpen(true)}
              >
                Mark as Alumni
              </DropdownItem>

              {/* Communication Section */}
              <DropdownItem sectionTitle="Communication" key="communication-header" showDivider>
                Communication
              </DropdownItem>

              <DropdownItem
                key="sendReminder"
                startContent={<Bell size={16} />}
                onPress={() => setIsReminderOpen(true)}
              >
                Send Fee Reminder
              </DropdownItem>

              <DropdownItem
                key="shareProfile"
                startContent={<Share2 size={16} />}
                onPress={() => setIsShareOpen(true)}
              >
                Share Profile
              </DropdownItem>

              {/* Other Section */}
              <DropdownItem sectionTitle="Other" key="other-header" showDivider>
                Other
              </DropdownItem>

              <DropdownItem
                key="writeRemark"
                startContent={<MessageSquare size={16} />}
                onPress={() => setIsRemarkOpen(true)}
              >
                Write a Remark
              </DropdownItem>

              <DropdownItem
                key="download"
                startContent={<Download size={16} />}
                onPress={photoActions.handleDownload}
              >
                Download Profile
              </DropdownItem>

              <DropdownItem
                key="print"
                startContent={<Printer size={16} />}
                onPress={photoActions.handleDownload}
              >
                Print Profile
              </DropdownItem>

              {/* Delete */}
              <DropdownItem
                key="delete"
                className="text-danger"
                color="danger"
                startContent={<Trash2 size={16} />}
                onPress={onDelete}
              >
                Delete Student
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* Extracted Modals */}
      <MoveClassModal
        isOpen={isMoveClassOpen}
        onClose={() => setIsMoveClassOpen(false)}
        student={student}
        availableClasses={availableClasses}
        onMove={handleRefresh}
      />

      <WriteRemarkModal
        isOpen={isRemarkOpen}
        onClose={() => setIsRemarkOpen(false)}
        student={student}
        onSave={handleRefresh}
      />

      <MarkAlumniModal
        isOpen={isAlumniOpen}
        onClose={() => setIsAlumniOpen(false)}
        student={student}
        onMark={handleRefresh}
      />

      <SendFeeReminderModal
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        student={student}
      />

      <ShareProfileModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        student={student}
        staff={staff}
      />

      {/* Photo Editor Modal */}
      {photoActions.selectedImageForEdit && (
        <PhotoEditorModal
          isOpen={photoActions.isPhotoEditorOpen}
          onClose={() => photoActions.setIsPhotoEditorOpen(false)}
          imageSrc={photoActions.selectedImageForEdit}
          onSave={photoActions.handlePhotoSave}
        />
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={photoActions.isCameraCaptureOpen}
        onClose={() => photoActions.setIsCameraCaptureOpen(false)}
        onPhotoCaptured={photoActions.handleCameraPhotoCapture}
      />

      {/* Hidden Printable Component */}
      <div style={{ display: "none" }}>
        <PrintableStudentProfile
          ref={printRef}
          student={student}
          results={results}
          attendanceStats={attendanceStats}
          studentFeeStructure={studentFeeStructure}
        />
      </div>
    </>
  );
}
