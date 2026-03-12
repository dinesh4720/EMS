import { Drawer, DrawerContent, DrawerHeader, DrawerBody, Button } from "@heroui/react";
import { X, GraduationCap } from "lucide-react";
import AddStudent from "./AddStudent";
import toast from "react-hot-toast";
import { studentsApi } from "../../services/api";

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
  /**
   * Handles saving the updated student data
   * Calls the studentsApi.update endpoint and triggers the onUpdate callback
   */
  const handleSave = async (studentData) => {
    try {
      // Call the API to update the student
      const response = await studentsApi.update(student.id, studentData);

      // Show success toast
      toast.success('Student updated successfully!');

      // Call the parent's update callback
      if (onUpdate) {
        onUpdate(response);
      }

      // Close the drawer
      onClose();
    } catch (error) {
      console.error('❌ Failed to update student:', error);

      // Show error toast
      toast.error(error.message || 'Failed to update student');

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
        if (!open) handleClose();
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
                  <h2 className="text-lg font-semibold text-default-900">Edit Student</h2>
                  <p className="text-xs text-default-500">
                    {student?.name ? `Editing ${student.name}` : 'Update student information'}
                  </p>
                </div>
              </div>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={handleClose}
              >
                <X size={20} className="text-default-500" />
              </Button>
            </DrawerHeader>

            {/* Drawer Body - AddStudent Component with initialData */}
            <DrawerBody className="p-0 overflow-hidden">
              {student && (
                <AddStudent
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
