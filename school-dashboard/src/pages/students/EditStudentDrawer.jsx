import { useRef, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, Button } from "@heroui/react";
import { X, GraduationCap } from "lucide-react";
import AddStudent from "./AddStudent";
import toast from "react-hot-toast";
import { studentsApi } from "../../services/api";
import { useTranslation } from 'react-i18next';
import logger from '../../utils/logger';


/**
 * EditStudentDrawer - A drawer component for editing existing students
 * Reuses the AddStudent component by passing initialData prop
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the drawer is open
 * @param {Function} props.onClose - Callback when drawer closes
 * @param {Object} props.student - The student object to edit
 * @param {Function} props.onUpdate - Callback when student is updated successfully
 * @param {Array<string>} props.classOptions - Array of class options in "X-A" format
 * @param {Array<Object>} props.classesWithTeachers - Array of class objects with teacher info
 */
export default function EditStudentDrawer({
  isOpen,
  onClose,
  student,
  onUpdate,
  classOptions = [],
  classesWithTeachers = []
}) {
  const { t } = useTranslation();
  const addStudentRef = useRef(null);

  // Handle backdrop click for unsaved changes check
  useEffect(() => {
    if (!isOpen) return;
    const handleBackdropClick = (e) => {
      const backdrop = e.target.closest?.('[data-slot="backdrop"]') || (e.target.getAttribute?.('data-slot') === 'backdrop' ? e.target : null);
      if (backdrop) {
        if (addStudentRef.current) addStudentRef.current.attemptClose();
        else handleClose();
      }
    };
    document.addEventListener('click', handleBackdropClick, true);
    return () => document.removeEventListener('click', handleBackdropClick, true);
  }, [isOpen]);

  /**
   * Handles saving the updated student data
   * Calls the studentsApi.update endpoint and triggers the onUpdate callback
   */
  const handleSave = async (studentData) => {
    try {
      // Call the API to update the student
      const response = await studentsApi.update(student.id, studentData);

      // Show success toast
      toast.success(t('toast.success.studentUpdatedSuccessfully'));

      // Call the parent's update callback
      if (onUpdate) {
        onUpdate(response);
      }

      // Close the drawer
      onClose();
    } catch (error) {
      logger.error('❌ Failed to update student:', error);

      // Stale data: another tab/session saved while this form was open
      if (error.status === 409 && error.details?.code === 'STALE_DATA') {
        toast.error(
          'This student was updated elsewhere. Close this form and reopen it to get the latest data.',
          { duration: 7000 }
        );
      } else {
        toast.error(error.message || 'Failed to update student');
      }
      error._toastShown = true;

      // Re-throw the error so AddStudent can handle loading state
      throw error;
    }
  };

  /**
   * Handles closing the drawer
   */
  const handleClose = () => {
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          if (addStudentRef.current) addStudentRef.current.attemptClose();
          else handleClose();
        }
      }}
      placement="right"
      size="xl"
      hideCloseButton
      classNames={{
        base: "max-w-[900px]",
        wrapper: "z-[9999]",
        backdrop: "z-[9998]"
      }}
    >
      <DrawerContent>
        {(onCloseDrawer) => (
          <>
            {/* Drawer Header */}
            <DrawerHeader className="border-b border-default-200 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <GraduationCap size={20} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-default-900">{t('pages.editStudent1')}</h2>
                  <p className="text-xs text-default-500">
                    {student?.name ? `Editing ${student.name}` : 'Update student information'}
                  </p>
                </div>
              </div>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => {
                  if (addStudentRef.current) addStudentRef.current.attemptClose();
                  else handleClose();
                }}
              >
                <X size={20} className="text-default-500" />
              </Button>
            </DrawerHeader>

            {/* Drawer Body - AddStudent Component with initialData */}
            <DrawerBody className="p-0 overflow-hidden">
              {student && (
                <AddStudent
                  ref={addStudentRef}
                  onClose={handleClose}
                  onSave={handleSave}
                  classOptions={classOptions}
                  classesWithTeachers={classesWithTeachers}
                  initialData={student}
                />
              )}
            </DrawerBody>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
