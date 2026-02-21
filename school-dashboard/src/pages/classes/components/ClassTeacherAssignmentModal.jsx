import { useState, useMemo, useCallback } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Input, Spinner, Badge, Avatar
} from "@heroui/react";
import { Search, Users, User, AlertCircle, GraduationCap, Check } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "../../../components/ConfirmDialog";
import { useApp } from "../../../context/AppContext";

/**
 * ClassTeacherAssignmentModal - Modal to assign a teacher to a class
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - classId: string
 * - className: string
 * - section: string
 * - currentTeacherId: string | null
 */
export default function ClassTeacherAssignmentModal({
  isOpen,
  onClose,
  classId,
  className,
  section,
  currentTeacherId
}) {
  const { staff, classesApi, updateClassLocal } = useApp();

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    variant: "default"
  });

  // Filter teachers by search query and role
  const filteredTeachers = useMemo(() => {
    if (!staff) return [];
    
    // Filter for teachers only (can be array or string)
    const teachers = staff.filter(s => {
      const roles = Array.isArray(s.role) ? s.role : [s.role];
      return roles.includes('Teacher');
    });

    return teachers.filter(s => {
      if (!searchQuery) return true;
      
      const searchLower = searchQuery.toLowerCase();
      const name = (s.name || "").toLowerCase();
      const code = (s.code || "").toLowerCase();
      const department = (s.department || "").toLowerCase();
      
      return name.includes(searchLower) || code.includes(searchLower) || department.includes(searchLower);
    });
  }, [staff, searchQuery]);

  // Handle teacher assignment
  const handleAssignTeacher = useCallback((teacher) => {
    const currentAssignedClass = teacher.classTeacherOf 
      ? classes.find(c => c.id === teacher.classTeacherOf) 
      : null;

    if (currentTeacherId === teacher.id) {
      // Teacher is already assigned to this class
      toast.info(`${teacher.name} is already the class teacher for ${className}-${section}`);
      return;
    }

    if (currentAssignedClass) {
      // Teacher is assigned to another class - show confirmation
      setConfirmDialog({
        isOpen: true,
        title: "Replace Class Teacher Assignment",
        message: `${teacher.name} is currently the class teacher for ${currentAssignedClass.name}-${currentAssignedClass.section}.\n\nDo you want to assign them to ${className}-${section} instead?\n\n${currentAssignedClass.name}-${currentAssignedClass.section} will become unassigned.`,
        onConfirm: async () => {
          await performAssignment(teacher.id);
        },
        variant: "warning"
      });
    } else {
      // Teacher is not assigned to any class - direct assignment
      setConfirmDialog({
        isOpen: true,
        title: "Assign as Class Teacher",
        message: `Assign ${teacher.name} as class teacher for ${className}-${section}?`,
        onConfirm: async () => {
          await performAssignment(teacher.id);
        },
        variant: "default"
      });
    }
  }, [currentTeacherId, className, section]);

  // Perform the actual assignment
  const performAssignment = async (teacherId) => {
    try {
      setIsProcessing(true);

      // Call API to update class teacher
      await classesApi.updateClassTeacher(classId, teacherId);

      // Get teacher name for toast
      const teacher = staff.find(s => s.id === teacherId);
      const teacherName = teacher?.name || 'Teacher';

      // Update local state immediately
      updateClassLocal(classId, {
        classTeacherId: teacherId,
        teacher: teacherName,
        teacherPhoto: teacher?.picture || null
      });

      toast.success(`${teacherName} assigned as class teacher for ${className}-${section}`);
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      onClose();
    } catch (error) {
      console.error('Error assigning class teacher:', error);
      toast.error(error.message || 'Failed to assign class teacher');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    setSearchQuery("");
    onClose();
  }, [onClose]);

  // Get classes to check teacher assignments
  const classes = useMemo(() => {
    // This would typically come from app context, but we'll use a simple mapping
    // In real implementation, this should be from useApp().classes
    return [];
  }, []);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        size="3xl"
        scrollBehavior="inside"
        classNames={{
          backdrop: "bg-black/50 backdrop-blur-sm",
          base: "bg-white dark:bg-gray-900"
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 border-b border-default-200">
            <div>
              <h3 className="text-xl font-semibold">Assign Class Teacher</h3>
              <p className="text-sm text-default-500 font-normal">
                Class: <span className="font-medium text-primary">{className}-{section}</span>
              </p>
            </div>
          </ModalHeader>

          <ModalBody className="py-4">
            {/* Search */}
            <div className="mb-4">
              <Input
                placeholder="Search teachers by name, code, or department..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                startContent={<Search size={16} className="text-default-400" />}
                isClearable
                onClear={() => setSearchQuery("")}
                variant="bordered"
                size="sm"
                classNames={{
                  input: "text-sm"
                }}
              />
            </div>

            {/* Teachers List */}
            <div className="space-y-2">
              {filteredTeachers.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <GraduationCap size={32} className="text-default-300 mx-auto mb-2" />
                  <p className="text-sm text-default-500 mb-1">
                    {searchQuery ? "No teachers found matching your search" : "No teachers available"}
                  </p>
                  <p className="text-xs text-default-400">
                    {searchQuery ? "Try a different search term" : "Add teachers first to assign as class teacher"}
                  </p>
                </div>
              ) : (
                filteredTeachers.map((teacher) => {
                  const isCurrentTeacher = teacher.id === currentTeacherId;
                  const hasOtherClass = teacher.classTeacherOf && teacher.classTeacherOf !== classId;
                  
                  return (
                    <div
                      key={teacher.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-default-200 hover:border-default-300 hover:bg-default-50 transition-all"
                    >
                      {/* Left: Teacher Info */}
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar
                          src={teacher.picture}
                          name={teacher.name || teacher.code}
                          size="lg"
                          className="flex-shrink-0"
                        />
                        <div>
                          <p className="text-sm font-medium text-default-700">
                            {teacher.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-default-500">{teacher.code}</span>
                            <span className="text-default-300">|</span>
                            <span className="text-xs text-default-500">{teacher.department || "—"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Current Assignment */}
                      <div className="flex items-center gap-2 px-4">
                        {isCurrentTeacher ? (
                          <div className="flex items-center gap-2">
                            <Check size={16} className="text-success-600" />
                            <div>
                              <p className="text-sm font-medium text-default-700">Current</p>
                              <p className="text-xs text-default-400">Already assigned</p>
                            </div>
                          </div>
                        ) : hasOtherClass ? (
                          <div className="flex items-center gap-2">
                            <Badge color="warning" variant="flat" size="sm">
                              Already assigned to {teacher.classTeacherOf}
                            </Badge>
                          </div>
                        ) : (
                          <Badge color="default" variant="flat" size="sm">
                            Available
                          </Badge>
                        )}
                      </div>

                      {/* Right: Assign Button */}
                      <Button
                        size="sm"
                        color={isCurrentTeacher ? "success" : hasOtherClass ? "warning" : "primary"}
                        variant="flat"
                        onPress={() => handleAssignTeacher(teacher)}
                        isDisabled={isProcessing || isCurrentTeacher}
                        className="min-w-[80px]"
                      >
                        {isProcessing ? <Spinner size="sm" /> : isCurrentTeacher ? "Assigned" : "Assign"}
                      </Button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Stats footer */}
            {filteredTeachers.length > 0 && (
              <div className="mt-4 pt-4 border-t border-default-200 flex items-center justify-between text-xs text-default-500">
                <span>
                  Showing {filteredTeachers.length} teacher{filteredTeachers.length !== 1 ? 's' : ''}
                </span>
                <span>
                  {filteredTeachers.filter(t => t.classTeacherOf).length} assigned to classes
                </span>
              </div>
            )}
          </ModalBody>

          <ModalFooter className="border-t border-default-200">
            <Button
              variant="flat"
              onPress={handleClose}
              isDisabled={isProcessing}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.variant === 'warning' ? "Yes, Replace" : "Yes, Assign"}
        cancelText="Cancel"
        variant={confirmDialog.variant}
        isLoading={isProcessing}
      />
    </>
  );
}