import { useRef } from "react";
import AddStudentComposer from "./AddStudentComposer";
import toast from "react-hot-toast";
import { studentsApi } from "../../services/api";
import { useTranslation } from "react-i18next";
import logger from "../../utils/logger";

// classOptions is accepted for backward-compat with existing callers but
// the composer reads class options directly from classesWithTeachers.

/**
 * EditStudentDrawer — opens the composer pre-populated with `student`.
 *
 * The composer renders its own frosted overlay (via portal), so this
 * wrapper no longer needs a HeroUI Drawer. Kept as a separate component
 * for API compatibility (callers pass `student`, `onUpdate`, etc.).
 */
export default function EditStudentDrawer({
  isOpen,
  onClose,
  student,
  onUpdate,
  // eslint-disable-next-line no-unused-vars
  classOptions = [],
  classesWithTeachers = [],
}) {
  const { t } = useTranslation();
  const composerRef = useRef(null);

  const handleSave = async (studentData) => {
    try {
      const response = await studentsApi.update(student.id, studentData);
      toast.success(t("toast.success.studentUpdatedSuccessfully"));
      onUpdate?.(response);
      onClose();
      return response;
    } catch (error) {
      logger.error("Failed to update student:", error);
      if (error.status === 409 && error.details?.code === "STALE_DATA") {
        toast.error(
          "This student was updated elsewhere. Close this form and reopen it to get the latest data.",
          { duration: 7000 }
        );
        error._toastShown = true;
      }
      // Composer maps server-side field errors back onto the form.
      throw error;
    }
  };

  if (!isOpen || !student) return null;

  return (
    <AddStudentComposer
      ref={composerRef}
      onClose={onClose}
      onSave={handleSave}
      classesWithTeachers={classesWithTeachers}
      initialData={student}
    />
  );
}
