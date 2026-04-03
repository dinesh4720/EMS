import { useState, useMemo, useCallback } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Input, Spinner, Badge, Avatar
} from "@heroui/react";
import { Search, Users, User, AlertCircle, GraduationCap, Check } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "../../../components/ConfirmDialog";
import { useApp } from "../../../context/AppContext";
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const { staff, classesApi, updateClassLocal, classesWithTeachers } = useApp();

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    variant: "info"
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
      ? classesWithTeachers.find(c => {
          const displayName = c.section ? `${c.name}-${c.section}` : c.name;
          return displayName === teacher.classTeacherOf;
        })
      : null;

    if (String(currentTeacherId) === String(teacher.id)) {
      // Teacher is already assigned to this class
      toast(t('classes.teacherAlreadyAssignedHere', '{{name}} is already the class teacher for {{class}}', { name: teacher.name, class: `${className}-${section}` }));
      return;
    }

    if (currentAssignedClass) {
      // Teacher is assigned to another class - show confirmation
      setConfirmDialog({
        isOpen: true,
        title: t('classes.replaceClassTeacher', 'Replace Class Teacher Assignment'),
        message: t('classes.replaceClassTeacherMessage', '{{name}} is currently the class teacher for {{currentClass}}.\n\nDo you want to assign them to {{newClass}} instead?\n\n{{currentClass}} will become unassigned.', { name: teacher.name, currentClass: `${currentAssignedClass.name}-${currentAssignedClass.section}`, newClass: `${className}-${section}` }),
        onConfirm: async () => {
          await performAssignment(teacher.id);
        },
        variant: "warning"
      });
    } else {
      // Teacher is not assigned to any class - direct assignment
      setConfirmDialog({
        isOpen: true,
        title: t('classes.assignAsClassTeacher', 'Assign as Class Teacher'),
        message: t('classes.assignAsClassTeacherMessage', 'Assign {{name}} as class teacher for {{class}}?', { name: teacher.name, class: `${className}-${section}` }),
        onConfirm: async () => {
          await performAssignment(teacher.id);
        },
        variant: "info"
      });
    }
  }, [currentTeacherId, className, section, classesWithTeachers]);

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

      toast.success(t('toast.success.classTeacherAssigned', '{{name}} assigned as class teacher for {{class}}', { name: teacherName, class: `${className}-${section}` }));
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      onClose();
    } catch (error) {
      console.error('Error assigning class teacher:', error);
      toast.error(error.message || t('toast.error.failedToAssignClassTeacher', 'Failed to assign class teacher'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    setSearchQuery("");
    onClose();
  }, [onClose]);


  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        size="3xl"
        scrollBehavior="inside"
        classNames={{
          backdrop: "bg-black/50 backdrop-blur-sm",
          base: "bg-white dark:bg-zinc-950"
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 border-b border-default-200">
            <div>
              <h3 className="text-xl font-semibold">{t('pages.assignClassTeacher1')}</h3>
              <p className="text-sm text-default-500 font-normal">
                {t('classes.classLabel', 'Class')}: <span className="font-medium text-primary">{className}-{section}</span>
              </p>
            </div>
          </ModalHeader>

          <ModalBody className="py-4">
            {/* Search */}
            <div className="mb-4">
              <Input
                placeholder={t('pages.searchTeachersByNameCodeOrDepartment')}
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
                    {searchQuery ? t('classes.noTeachersFoundSearch', 'No teachers found matching your search') : t('classes.noTeachersAvailable', 'No teachers available')}
                  </p>
                  <p className="text-xs text-default-400">
                    {searchQuery ? t('classes.tryDifferentSearch', 'Try a different search term') : t('classes.addTeachersFirst', 'Add teachers first to assign as class teacher')}
                  </p>
                </div>
              ) : (
                filteredTeachers.map((teacher) => {
                  const isCurrentTeacher = String(teacher.id) === String(currentTeacherId);
                  const currentClassDisplayName = section ? `${className}-${section}` : className;
                  const hasOtherClass = teacher.classTeacherOf && teacher.classTeacherOf !== currentClassDisplayName;
                  
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
                              <p className="text-sm font-medium text-default-700">{t('pages.current')}</p>
                              <p className="text-xs text-default-400">{t('pages.alreadyAssigned')}</p>
                            </div>
                          </div>
                        ) : hasOtherClass ? (
                          <div className="flex items-center gap-2">
                            <Badge color="warning" variant="flat" size="sm">
                              {t('classes.alreadyAssignedTo', 'Already assigned to {{class}}', { class: teacher.classTeacherOf })}
                            </Badge>
                          </div>
                        ) : (
                          <Badge color="default" variant="flat" size="sm">
                            {t('classes.available', 'Available')}
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
                        {isProcessing ? <Spinner size="sm" /> : isCurrentTeacher ? t('classes.assigned', 'Assigned') : t('classes.assign', 'Assign')}
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
                  {t('classes.showingTeachers', 'Showing {{count}} teacher(s)', { count: filteredTeachers.length })}
                </span>
                <span>
                  {filteredTeachers.filter(t => t.classTeacherOf).length} {t('classes.assignedToClasses', 'assigned to classes')}
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
              {t('common.close', 'Close')}
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
        confirmText={confirmDialog.variant === 'warning' ? t('classes.yesReplace', 'Yes, Replace') : t('classes.yesAssign', 'Yes, Assign')}
        cancelText={t('common.cancel', 'Cancel')}
        variant={confirmDialog.variant}
        isLoading={isProcessing}
      />
    </>
  );
}