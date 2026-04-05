import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { GraduationCap, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { getNextClass } from "../../utils/studentHelpers";
import { useTranslation } from 'react-i18next';

/**
 * PromoteStudentModal - Modal for promoting a student to the next class
 *
 * Props:
 * - isOpen: boolean - Whether the modal is open
 * - onClose: function - Called when modal is closed
 * - student: object - The student to be promoted
 * - availableClasses: array - List of available class name strings (e.g. ["9-A", "10-A"])
 * - classObjects: array - Class objects with _id, name, section (for resolving targetClassId)
 * - onPromote: function - Called to initiate promotion (optional)
 */
export default function PromoteStudentModal({ isOpen, onClose, student, availableClasses, classObjects = [], onPromote }) {
  const { t } = useTranslation();
  const [isPromoting, setIsPromoting] = useState(false);

  const handlePromote = async () => {
    if (!student?.class) {
      toast.error(t('toast.error.unableToDetermineCurrentClass'));
      return;
    }

    // Auto-calculate next class
    const nextClass = getNextClass(student.class, availableClasses);

    if (!nextClass) {
      toast.error(t('toast.error.unableToCalculateNextClassPleaseUpdateClassManually'));
      return;
    }

    setIsPromoting(true);
    const loadingToast = toast.loading(`Promoting ${student.name}...`);

    try {
      const { studentsApi } = await import("../../../../services/api");
      const studentId = student.id || student._id;

      if (nextClass === "Passed Out / Alumni") {
        await studentsApi.promote(studentId, { graduate: true });
      } else {
        // Resolve targetClassId from class string using classObjects
        const classMatch = nextClass.match(/^(\d+|[A-Za-z]+)(?:-([A-Z]))?$/i);
        let targetClassId = null;
        if (classMatch && Array.isArray(classObjects)) {
          const [, grade, section = ""] = classMatch;
          const target = classObjects.find(
            cls => String(cls.name) === String(grade) && (cls.section || "") === String(section)
          );
          if (target) targetClassId = target._id || target.id;
        }
        if (!targetClassId) {
          toast.error(`Target class "${nextClass}" not found. Create the class first.`, { id: loadingToast });
          return;
        }
        await studentsApi.promote(studentId, { targetClassId });
      }

      toast.success(`${student.name} promoted to ${nextClass}`, { id: loadingToast });

      if (onPromote) {
        onPromote(nextClass);
      }
      onClose();
    } catch (error) {
      console.error("Promotion error:", error);
      toast.error("Failed to promote student: " + (error.message || "Unknown error"), { id: loadingToast });
    } finally {
      setIsPromoting(false);
    }
  };

  const nextClass = student?.class ? getNextClass(student.class, availableClasses) : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800">
        <ModalHeader className="text-gray-900 dark:text-zinc-100 font-medium">{t('pages.promoteStudent')}</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Student Info - Gray container */}
            <div className="flex items-center gap-3 p-4 bg-default-50 rounded-lg border border-gray-200 dark:border-zinc-800">
              <GraduationCap size={24} className="text-primary" />
              <div>
                <p className="text-sm text-default-500">Student: <span className="font-semibold text-default-900">{student?.name || 'N/A'}</span></p>
                <p className="text-sm text-default-500">Current Class: <span className="font-semibold text-default-900">{student?.class || 'N/A'}</span></p>
              </div>
            </div>

            {/* Auto-calculated next class - Success colored container */}
            <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
              <p className="text-sm text-success-700 mb-1">
                <span className="font-semibold">{t('pages.autoCalculatedNextClass')}</span>
              </p>
              <p className="text-lg font-bold text-success-900">
                {nextClass || "Unable to calculate"}
              </p>
              <p className="text-xs text-success-600 mt-2">
                Click "Promote" to automatically promote the student to this class
              </p>
            </div>

            {/* Warning for alumni promotion */}
            {nextClass === "Passed Out / Alumni" && (
              <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
                <p className="text-xs text-warning-700">
                  <AlertTriangle size={14} className="inline mr-1" />
                  This will mark the student as "Passed Out / Alumni"
                </p>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="flat"
            onPress={onClose}
            className="border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-300"
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handlePromote}
            isDisabled={!nextClass || isPromoting}
            isLoading={isPromoting}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            <GraduationCap size={16} className="mr-1" />
            Promote
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

