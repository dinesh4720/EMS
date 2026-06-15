import { useState, useMemo, useCallback } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, Spinner, Badge
} from "@heroui/react";
import { Search, Users, User, GraduationCap, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "../../../components/ConfirmDialog";
import { useApp } from "../../../context/AppContext";
import { useTranslation } from 'react-i18next';
import logger from '../../../utils/logger';


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
  const { classes, classesApi, updateClassLocal, updateStaffLocal } = useApp();

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
          await performAssignment(cls, { force: true });
        },
        variant: "warning"
      });
    } else {
      // Direct assignment for vacant class
      // Always use force: true — the staff member may already be assigned to another class
      setConfirmDialog({
        isOpen: true,
        title: "Assign as Class Teacher",
        message: `Assign ${staffName} as class teacher for ${cls.name}-${cls.section}?`,
        onConfirm: async () => {
          await performAssignment(cls, { force: true });
        },
        variant: "default"
      });
    }
  }, [staffName, staffId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Perform the actual assignment
  const performAssignment = async (cls, options = {}) => {
    try {
      setIsProcessing(true);

      // Call API to update class teacher
      await classesApi.updateClassTeacher(cls.id, staffId, { force: options.force });

      // Update local class state immediately
      updateClassLocal(cls.id, {
        classTeacherId: staffId,
        teacher: staffName,
        teacherPhoto: null
      });

      // Update local staff state to reflect the assignment
      updateStaffLocal(staffId, {
        classTeacherOf: `${cls.name}-${cls.section}`,
        isClassTeacher: true,
      });

      toast.success(`${staffName} assigned as class teacher for ${cls.name}-${cls.section}`);
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      onClose();
    } catch (error) {
      logger.error('Error assigning class teacher:', error);
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
          backdrop: "bg-overlay-bg backdrop-blur-sm",
          base: "bg-surface"
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 border-b border-border-token">
            <div>
              <h3 className="text-xl font-semibold">{t('pages.assignAsClassTeacher')}</h3>
              <p className="text-sm text-fg-muted font-normal">
                Staff: <span className="font-medium text-accent">{staffName}</span>
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
                startContent={<Search size={16} className="text-fg-subtle" />}
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
            <div className="staff-banner staff-banner--warn" style={{ marginBottom: 12 }}>
              <div className="staff-banner__icon"><AlertCircle size={14} /></div>
              <div>
                <div className="staff-banner__title">{t('pages.important')}</div>
                <div className="staff-banner__body">
                  A staff member can be class teacher for only one class. If they're already assigned to a class, that assignment will be automatically removed.
                </div>
              </div>
            </div>

            {/* Classes List */}
            <div className="col" style={{ gap: 6 }}>
              {filteredClasses.length === 0 ? (
                <div className="assign-empty">
                  <div className="assign-empty__icon"><GraduationCap size={16} /></div>
                  <div className="assign-empty__title">
                    {searchQuery ? "No classes found" : "No classes available"}
                  </div>
                  <div className="assign-empty__sub">
                    {searchQuery ? "Try a different search term" : "Create classes first to assign teachers"}
                  </div>
                </div>
              ) : (
                filteredClasses.map((cls) => (
                  <div key={cls.id} className="subjrow">
                    {/* Left: Class Info */}
                    <div className="row" style={{ alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                      <div className="assignsec__icon">
                        <GraduationCap size={14} />
                      </div>
                      <div className="col" style={{ gap: 2, minWidth: 0 }}>
                        <span className="subjrow__name mono tnum">
                          {cls.name}-{cls.section}
                        </span>
                        <span className="subtle" style={{ fontSize: 11.5 }}>
                          <Users size={10} style={{ display: "inline", marginRight: 4 }} />
                          {cls.studentCount || 0} students
                        </span>
                      </div>
                    </div>

                    {/* Middle: Current Teacher */}
                    <div className="row" style={{ alignItems: "center", gap: 8, marginRight: 12 }}>
                      {cls.classTeacherId ? (
                        <div className="row" style={{ alignItems: "center", gap: 8 }}>
                          <div
                            style={{
                              width: 28, height: 28, borderRadius: 999,
                              background: "var(--surface-2)", overflow: "hidden",
                              display: "grid", placeItems: "center",
                            }}
                          >
                            {cls.teacherPhoto ? (
                              <img
                                src={cls.teacherPhoto}
                                alt={cls.classTeacherName}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                loading="lazy"
                              />
                            ) : (
                              <User size={12} className="text-fg-muted" />
                            )}
                          </div>
                          <div className="col" style={{ gap: 0 }}>
                            <span style={{ fontSize: 12.5, fontWeight: 520 }}>
                              {cls.classTeacherName}
                            </span>
                            <span className="subtle" style={{ fontSize: 10.5 }}>
                              {t('pages.current')}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <Badge color="default" variant="flat" size="sm">
                          Vacant
                        </Badge>
                      )}
                    </div>

                    {/* Right: Assign Button */}
                    <button
                      type="button"
                      className={`btn btn--sm ${cls.classTeacherId ? "" : "btn--accent"}`}
                      onClick={() => handleAssignClass(cls)}
                      disabled={isProcessing}
                      style={{ minWidth: 72 }}
                    >
                      {isProcessing ? <Spinner size="sm" /> : "Assign"}
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Stats footer */}
            {filteredClasses.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border-token flex items-center justify-between text-xs text-fg-muted">
                <span>
                  Showing {filteredClasses.length} class{filteredClasses.length !== 1 ? 'es' : ''}
                </span>
                <span>
                  {filteredClasses.filter(c => !c.classTeacherId).length} vacant
                </span>
              </div>
            )}
          </ModalBody>

          <ModalFooter className="border-t border-border-token">
            <button
              type="button"
              className="btn"
              onClick={handleClose}
              disabled={isProcessing}
            >
              Close
            </button>
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