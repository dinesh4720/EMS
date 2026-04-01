import { useState, useMemo, useCallback } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Input, Spinner, Badge
} from "@heroui/react";
import { Search, Users, User, GraduationCap, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "../../../components/ConfirmDialog";
import { useApp } from "../../../context/AppContext";
import { useTranslation } from 'react-i18next';

/**
 * AssignClassToStaffModal - Modal to assign a staff member as class teacher
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - staffId: string
 * - staffName: string
 */
export default function AssignClassToStaffModal({
  isOpen,
  onClose,
  staffId,
  staffName
}) {
  const { t } = useTranslation();
  const { classes, classesApi, updateClassLocal } = useApp();

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

  // Filter classes by search query
  const filteredClasses = useMemo(() => {
    if (!classes) return [];
    
    return classes.filter(cls => {
      if (!searchQuery) return true;
      
      const searchLower = searchQuery.toLowerCase();
      const classNameStr = `${cls.name} ${cls.section}`.toLowerCase();
      const teacherName = cls.classTeacherName?.toLowerCase() || "";
      
      return classNameStr.includes(searchLower) || teacherName.includes(searchLower);
    });
  }, [classes, searchQuery]);

  // Handle class assignment
  const handleAssignClass = useCallback(async (cls) => {
    const hasExistingTeacher = !!cls.classTeacherId;

    if (hasExistingTeacher) {
      // Show confirmation for replacement
      setConfirmDialog({
        isOpen: true,
        title: "Replace Class Teacher",
        message: `${cls.classTeacherName} is currently the class teacher for ${cls.name}-${cls.section}.\n\nDo you want to replace them with ${staffName}?`,
        onConfirm: async () => {
          await performAssignment(cls);
        },
        variant: "warning"
      });
    } else {
      // Direct assignment for vacant class
      setConfirmDialog({
        isOpen: true,
        title: "Assign as Class Teacher",
        message: `Assign ${staffName} as class teacher for ${cls.name}-${cls.section}?`,
        onConfirm: async () => {
          await performAssignment(cls);
        },
        variant: "default"
      });
    }
  }, [staffName, staffId]);

  // Perform the actual assignment
  const performAssignment = async (cls) => {
    try {
      setIsProcessing(true);

      // Call API to update class teacher
      await classesApi.updateClassTeacher(cls.id, staffId);

      // Update local state immediately
      updateClassLocal(cls.id, {
        classTeacherId: staffId,
        teacher: staffName,
        teacherPhoto: null // Will be populated by API response
      });

      toast.success(`${staffName} assigned as class teacher for ${cls.name}-${cls.section}`);
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
              <h3 className="text-xl font-semibold">{t('pages.assignAsClassTeacher')}</h3>
              <p className="text-sm text-default-500 font-normal">
                Staff: <span className="font-medium text-primary">{staffName}</span>
              </p>
            </div>
          </ModalHeader>

          <ModalBody className="py-4">
            {/* Search */}
            <div className="mb-4">
              <Input
                placeholder={t('pages.searchClassesByNameOrTeacher')}
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

            {/* Important Notice */}
            <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-3 flex gap-3 mb-4">
              <AlertCircle size={18} className="text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-warning-800 dark:text-warning-200">
                <strong>{t('pages.important')}</strong> A staff member can be class teacher for only one class. If they're already assigned to a class, that assignment will be automatically removed.
              </p>
            </div>

            {/* Classes List */}
            <div className="space-y-2">
              {filteredClasses.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <GraduationCap size={32} className="text-default-300 mx-auto mb-2" />
                  <p className="text-sm text-default-500 mb-1">
                    {searchQuery ? "No classes found matching your search" : "No classes available"}
                  </p>
                  <p className="text-xs text-default-400">
                    {searchQuery ? "Try a different search term" : "Create classes first to assign teachers"}
                  </p>
                </div>
              ) : (
                filteredClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-default-200 hover:border-default-300 hover:bg-default-50 transition-all"
                  >
                    {/* Left: Class Info */}
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <GraduationCap size={20} className="text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-default-700">
                          {cls.name}-{cls.section}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Users size={12} className="text-default-400" />
                          <span className="text-xs text-default-500">
                            {cls.studentCount || 0} students
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Current Teacher */}
                    <div className="flex items-center gap-2 px-4">
                      {cls.classTeacherId ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                            {cls.teacherPhoto ? (
                              <img src={cls.teacherPhoto} alt={cls.classTeacherName} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                            ) : (
                              <User size={14} className="text-gray-600 dark:text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-default-700">
                              {cls.classTeacherName}
                            </p>
                            <p className="text-xs text-default-400">{t('pages.current')}</p>
                          </div>
                        </div>
                      ) : (
                        <Badge color="default" variant="flat" size="sm">
                          No Teacher Assigned
                        </Badge>
                      )}
                    </div>

                    {/* Right: Assign Button */}
                    <Button
                      size="sm"
                      color={cls.classTeacherId ? "warning" : "primary"}
                      variant="flat"
                      onPress={() => handleAssignClass(cls)}
                      isDisabled={isProcessing}
                      className="min-w-[80px]"
                    >
                      {isProcessing ? <Spinner size="sm" /> : "Assign"}
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Stats footer */}
            {filteredClasses.length > 0 && (
              <div className="mt-4 pt-4 border-t border-default-200 flex items-center justify-between text-xs text-default-500">
                <span>
                  Showing {filteredClasses.length} class{filteredClasses.length !== 1 ? 'es' : ''}
                </span>
                <span>
                  {filteredClasses.filter(c => !c.classTeacherId).length} vacant
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