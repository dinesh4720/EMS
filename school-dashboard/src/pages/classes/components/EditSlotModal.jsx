import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Select, SelectItem, Input, Spinner } from "@heroui/react";
import { X } from "lucide-react";
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import ConflictIndicator from "../../../components/ConflictIndicator";

/**
 * Modal for editing a single timetable slot — subject, teacher, room, and conflict handling.
 */
export function EditSlotModal({
  isOpen,
  onClose,
  editingSlot,
  periods,
  slotForm,
  setSlotForm,
  loadingTeachers,
  availableTeachers,
  conflicts,
  setConflicts,
  syncStatus,
  schoolSettings,
  onTeacherChange,
  onSaveSlot,
  onClearSlot,
}) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalContent>
        <ModalHeader>
          {editingSlot && `Edit ${editingSlot.day} - ${periods[editingSlot.periodIndex]?.name}`}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Select
              label={t('pages.subject2')}
              placeholder={t('pages.selectSubject')}
              selectedKeys={slotForm.subject ? [slotForm.subject] : []}
              onSelectionChange={(keys) => setSlotForm({ ...slotForm, subject: Array.from(keys)[0] || "" })}
              variant="bordered"
            >
              {(schoolSettings.subjects || []).map(subject => (
                <SelectItem key={subject.name} textValue={subject.name}>
                  {subject.name}
                </SelectItem>
              ))}
            </Select>

            {/* Show loading state while fetching teachers */}
            {loadingTeachers && slotForm.subject && (
              <div className="flex items-center justify-center gap-2 p-4 bg-surface-2 rounded-lg">
                <Spinner size="sm" />
                <span className="text-sm text-fg-muted">{t('pages.loadingAvailableTeachers')}</span>
              </div>
            )}

            {/* Teacher selection - only show available teachers */}
            {slotForm.subject && !loadingTeachers && (
              <>
                <Select
                  label={t('pages.teacher2')}
                  placeholder={availableTeachers.length > 0 ? "Select teacher" : "No teachers available"}
                  selectedKeys={slotForm.teacherId ? [String(slotForm.teacherId)] : []}
                  onSelectionChange={(keys) => onTeacherChange(Array.from(keys)[0] || "")}
                  variant="bordered"
                  isDisabled={availableTeachers.length === 0}
                  description={
                    availableTeachers.length === 0
                      ? "No qualified teachers are available for this subject and time slot"
                      : `${availableTeachers.length} teacher(s) available and free at this time`
                  }
                >
                  {availableTeachers.map(teacher => (
                    <SelectItem
                      key={String(teacher.id || teacher._id)}
                      textValue={teacher.name}
                    >
                      {teacher.name}
                    </SelectItem>
                  ))}
                </Select>

                {availableTeachers.length === 0 && (
                  <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
                    <p className="text-xs text-warning-700">
                      <strong>{t('pages.tip')}</strong> No teachers are qualified or available. You can:
                    </p>
                    <ul className="text-xs text-warning-600 mt-2 ml-4 list-disc space-y-1">
                      <li>{t('pages.assignATeacherToThisSubjectInStaffManagement')}</li>
                      <li>{t('pages.chooseADifferentTimeSlot')}</li>
                      <li>{t('pages.selectADifferentSubject')}</li>
                    </ul>
                  </div>
                )}
              </>
            )}

            {/* Show conflict warning using ConflictIndicator */}
            {conflicts.length > 0 && (
              <ConflictIndicator
                conflicts={conflicts}
                onResolve={(resolutionData) => {
                  const { action } = resolutionData;

                  if (action === 'remove_current') {
                    // Clear the current slot
                    onClearSlot();
                  } else if (action === 'choose_different') {
                    // User needs to select a different teacher
                    setConflicts([]);
                    setSlotForm({ ...slotForm, teacherId: "" });
                  } else if (action === 'remove_from_class') {
                    // This would require additional API call to remove teacher from conflicting class
                    toast.error(`To resolve this conflict, please go to ${resolutionData.resolution.className} timetable and remove the teacher from that slot.`);
                  } else if (action === 'update_assignments') {
                    toast.error('Please go to Staff Assignments to add this subject-class assignment to the teacher.');
                  }
                }}
              />
            )}

            <Input
              label={t('pages.room')}
              placeholder={t('classes.roomOptionalPlaceholder')}
              value={slotForm.room}
              onValueChange={(v) => setSlotForm({ ...slotForm, room: v })}
              variant="bordered"
            />

            {slotForm.subject && (
              <Button
                size="sm"
                color="danger"
                variant="flat"
                startContent={<X size={14} />}
                onPress={onClearSlot}
                className="w-full"
                isLoading={syncStatus === 'syncing'}
              >
                Clear Slot
              </Button>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>{t('pages.cancel2')}</Button>
          <Button
            color="primary"
            onPress={onSaveSlot}
            isDisabled={!slotForm.subject || conflicts.length > 0}
            isLoading={syncStatus === 'syncing'}
          >
            {syncStatus === 'syncing' ? 'Saving & Syncing...' : 'Save'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
