import { useState, useMemo } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Select, SelectItem } from "@heroui/react";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';

/**
 * MoveClassModal - Modal for moving a student to another class/section
 *
 * Props:
 * - isOpen: boolean - Whether modal is open
 * - onClose: function - Called when modal is closed
 * - student: object - The student to move
 * - availableClasses: array - List of available classes
 * - onMove: function - Called after successful move with new class
 */
export default function MoveClassModal({ isOpen, onClose, student, availableClasses = [], classObjects = [], onMove }) {
  const { t } = useTranslation();
  const [newClass, setNewClass] = useState("");
  const [classError, setClassError] = useState("");
  const [isMoving, setIsMoving] = useState(false);

  // Build a mapping from display label to ObjectId
  const classIdMap = useMemo(() => {
    const map = {};
    for (const cls of classObjects) {
      const label = cls.section ? `${cls.name}-${cls.section}` : cls.name;
      map[label] = cls._id || cls.id;
    }
    return map;
  }, [classObjects]);

  const handleMove = async () => {
    if (!newClass) {
      setClassError(t('toast.error.pleaseSelectANewClass', 'Please select a new class'));
      return;
    }

    setIsMoving(true);
    const loadingToast = toast.loading(t('toast.loading.movingStudentToNewClass'));

    try {
      const { request } = await import("../../../../services/api");

      // Resolve to ObjectId from classObjects, fall back to the string
      const classId = classIdMap[newClass] || newClass;

      await request(`/students/${student.id}`, {
        method: 'PUT',
        body: JSON.stringify({ classId })
      });

      toast.success(t('toast.success.studentMovedToClass', { className: newClass, defaultValue: `Student moved to ${newClass}` }), { id: loadingToast });

      if (onMove) {
        onMove(newClass);
      }
      onClose();
    } catch (error) {
      console.error("Error moving student:", error);
      toast.error(t('toast.error.failedToMoveStudent', 'Failed to move student') + ": " + (error.message || t('common.unknownError', 'Unknown error')), { id: loadingToast });
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalContent>
        <ModalHeader>{t('pages.moveToAnotherClass', 'Move to Another Class/Section')}</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-zinc-400">Current Class: <span className="font-semibold text-gray-900 dark:text-zinc-100">{student?.class || "N/A"}</span></p>
            </div>

            <Select
              label={t('pages.selectNewClass')}
              placeholder={t('pages.chooseAClass')}
              selectedKeys={newClass ? [newClass] : []}
              onSelectionChange={(keys) => {
                setNewClass(Array.from(keys)[0]);
                setClassError("");
              }}
              variant="bordered"
              isInvalid={!!classError}
              errorMessage={classError}
            >
              {availableClasses.map((cls) => (
                <SelectItem key={cls} value={cls}>
                  {cls}
                </SelectItem>
              ))}
            </Select>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="bordered" className="border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300" onPress={onClose}>{t('pages.cancel2')}</Button>
          <Button className="bg-gray-900 hover:bg-gray-800 text-white" onPress={handleMove} isLoading={isMoving}>{t('pages.moveStudent')}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
