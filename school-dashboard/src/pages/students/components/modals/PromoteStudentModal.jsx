import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { GraduationCap, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

/**
 * Helper function to calculate next class for automatic promotion
 */
const getNextClass = (currentClass, availableClasses) => {
  // Handle special cases
  if (!currentClass || currentClass === "Alumni" || currentClass === "Passed Out / Alumni") {
    return null;
  }

  // Handle Nursery/KG levels
  const preschoolMap = {
    "Nursery": "KG",
    "KG": "1",
    "LKG": "UKG",
    "UKG": "1"
  };

  // Check if it's a preschool level
  for (const [from, to] of Object.entries(preschoolMap)) {
    if (currentClass.startsWith(from)) {
      // Extract section if present
      const sectionMatch = currentClass.match(/-[A-Z]$/i);
      const section = sectionMatch ? sectionMatch[0] : "";
      return `${to}${section}`;
    }
  }

  // Extract class number and section (e.g., "9-A" → class: 9, section: "A")
  const match = currentClass.match(/^(\d+)-([A-Z])$/i);
  if (!match) {
    // Try without section (e.g., "9")
    const numMatch = currentClass.match(/^(\d+)$/);
    if (!numMatch) return null;

    const currentGrade = parseInt(numMatch[1]);
    if (currentGrade >= 10) return "Passed Out / Alumni";
    return `${currentGrade + 1}`;
  }

  const currentGrade = parseInt(match[1]);
  const section = match[2];

  // If already in 10th grade, promote to alumni
  if (currentGrade >= 10) return "Passed Out / Alumni";

  // Otherwise, promote to next grade with same section
  const nextClass = `${currentGrade + 1}-${section}`;

  // Check if the next class exists in available classes
  if (availableClasses && availableClasses.length > 0) {
    const classExists = availableClasses.some(c => c === nextClass || c.startsWith(`${currentGrade + 1}-`));
    if (!classExists) {
      return `${currentGrade + 1}`; // Return without section if exact match not found
    }
  }

  return nextClass;
};

/**
 * PromoteStudentModal - Modal for promoting a student to the next class
 *
 * Props:
 * - isOpen: boolean - Whether the modal is open
 * - onClose: function - Called when modal is closed
 * - student: object - The student to be promoted
 * - availableClasses: array - List of available classes in the school
 * - onPromote: function - Called to initiate promotion (optional)
 */
export default function PromoteStudentModal({ isOpen, onClose, student, availableClasses, onPromote }) {
  const [isPromoting, setIsPromoting] = useState(false);

  const handlePromote = async () => {
    if (!student?.class) {
      toast.error("Unable to determine current class");
      return;
    }

    // Auto-calculate next class
    const nextClass = getNextClass(student.class, availableClasses);

    if (!nextClass) {
      toast.error("Unable to calculate next class. Please update class manually.");
      return;
    }

    setIsPromoting(true);
    const loadingToast = toast.loading(`Promoting ${student.name}...`);

    try {
      // Import api dynamically to avoid circular dependencies
      const { api } = await import("../../../../services/api");

      const isAlumni = nextClass === "Passed Out / Alumni";

      const updateData = isAlumni
        ? {
            class: "Passed Out / Alumni",
            section: "Alumni",
            status: "inactive",
            graduationDate: new Date().toISOString().split('T')[0]
          }
        : {
            class: nextClass
          };

      await api.patch(`/students/${student.id}`, updateData);

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
      <ModalContent className="bg-white rounded-lg border border-gray-200">
        <ModalHeader className="text-gray-900 font-medium">Promote Student</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Student Info - Gray container */}
            <div className="flex items-center gap-3 p-4 bg-default-50 rounded-lg border border-gray-200">
              <GraduationCap size={24} className="text-primary" />
              <div>
                <p className="text-sm text-default-500">Student: <span className="font-semibold text-default-900">{student?.name || 'N/A'}</span></p>
                <p className="text-sm text-default-500">Current Class: <span className="font-semibold text-default-900">{student?.class || 'N/A'}</span></p>
              </div>
            </div>

            {/* Auto-calculated next class - Success colored container */}
            <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
              <p className="text-sm text-success-700 mb-1">
                <span className="font-semibold">Auto-calculated next class:</span>
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
            className="border border-gray-200 hover:bg-gray-50 text-gray-700"
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

export { getNextClass };
