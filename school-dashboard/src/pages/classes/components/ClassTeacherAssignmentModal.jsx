import { useState, useMemo, useCallback } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Input, Select, SelectItem, Badge, Divider, Spinner, Tooltip
} from "@heroui/react";
import { Search, AlertCircle, Users, UserCheck, X, RefreshCw, Info, Keyboard, HelpCircle } from "lucide-react";
import toast from "react-hot-toast";
import TeacherCard from "./TeacherCard";
import ConfirmDialog from "../../../components/ConfirmDialog";
import { useApp } from "../../../context/AppContext";

/**
 * ClassTeacherAssignmentModal - Enhanced modal for assigning class teachers
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - classId: string
 * - className: string (e.g., "10")
 * - section: string (e.g., "A")
 * - currentTeacherId: string | null
 */
export default function ClassTeacherAssignmentModal({
  isOpen,
  onClose,
  classId,
  className,
  section,
  currentTeacherId,
}) {
  const { staff, classesWithTeachers, classesApi, updateClassLocal } = useApp();

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [selectedTeachers, setSelectedTeachers] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [swapTarget, setSwapTarget] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    variant: "default"
  });

  // Determine current mode for instruction banner
  const currentMode = swapTarget ? 'swap' : selectionMode ? 'selection' : 'normal';

  // Extract unique departments from staff
  const departments = useMemo(() => {
    const depts = new Set();
    staff.forEach(s => {
      if (s.department) depts.add(s.department);
    });
    return Array.from(depts).sort();
  }, [staff]);

  // Split teachers into available and assigned
  const { availableTeachers, assignedTeachers } = useMemo(() => {
    const available = [];
    const assigned = [];

    staff.forEach(teacher => {
      // Only consider teachers (check if role is strictly 'Teacher' or includes 'Teacher' in array)
      const roles = Array.isArray(teacher.role) ? teacher.role : [teacher.role];
      if (!roles.includes('Teacher')) return;

      const teacherId = String(teacher.id || teacher._id);
      const assignment = classesWithTeachers.find(c =>
        String(c.classTeacherId) === teacherId
      );

      if (assignment) {
        assigned.push({
          ...teacher,
          currentAssignment: assignment
        });
      } else {
        available.push(teacher);
      }
    });

    return { availableTeachers: available, assignedTeachers: assigned };
  }, [staff, classesWithTeachers]);

  // Filter teachers by search and department
  const filteredAvailable = useMemo(() => {
    return availableTeachers.filter(teacher => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
          teacher.name?.toLowerCase().includes(searchLower) ||
          teacher.department?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Department filter
      if (departmentFilter !== 'all' && teacher.department !== departmentFilter) {
        return false;
      }

      return true;
    });
  }, [availableTeachers, searchQuery, departmentFilter]);

  const filteredAssigned = useMemo(() => {
    return assignedTeachers.filter(teacher => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
          teacher.name?.toLowerCase().includes(searchLower) ||
          teacher.department?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Department filter
      if (departmentFilter !== 'all' && teacher.department !== departmentFilter) {
        return false;
      }

      return true;
    });
  }, [assignedTeachers, searchQuery, departmentFilter]);

  // Handle single assignment (available teacher)
  const handleAssignTeacher = useCallback(async (teacher) => {
    if (!classId) return;

    setConfirmDialog({
      isOpen: true,
      title: "Assign Class Teacher",
      message: `Assign ${teacher.name} as class teacher for ${className}-${section}?`,
      onConfirm: async () => {
        try {
          setIsProcessing(true);

          await classesApi.updateClassTeacher(classId, teacher.id || teacher._id);

          // Update local state
          updateClassLocal(classId, {
            classTeacherId: teacher.id || teacher._id,
            teacher: teacher.name,
            teacherPhoto: teacher.picture
          });

          toast.success(`${teacher.name} assigned as class teacher`);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          onClose();
        } catch (error) {
          console.error('Error assigning teacher:', error);
          toast.error(error.message || 'Failed to assign teacher');
        } finally {
          setIsProcessing(false);
        }
      },
      variant: "default"
    });
  }, [classId, className, section, classesApi, updateClassLocal, onClose]);

  // Handle initiate swap (assigned teacher)
  const handleInitiateSwap = useCallback((teacher) => {
    if (swapTarget?.id === teacher.id) {
      // Cancel swap if clicking same teacher
      setSwapTarget(null);
    } else if (!swapTarget) {
      // Start swap
      setSwapTarget(teacher);
      toast(`Select another teacher to swap with ${teacher.name}`, {
        icon: '🔄'
      });
    } else {
      // Complete swap
      handleCompleteSwap(teacher);
    }
  }, [swapTarget]);

  // Handle complete swap
  const handleCompleteSwap = useCallback(async (targetTeacher) => {
    if (!swapTarget) return;

    const sourceClassId = swapTarget.currentAssignment?.id;
    // Get the target teacher's current assignment (if they have one)
    const targetClassId = targetTeacher.currentAssignment?.id;

    // If target teacher is not assigned to any class, this is not a swap - it's an assignment
    if (!targetClassId) {
      // This should not happen in normal swap flow, but handle it gracefully
      toast.error('Cannot swap with an unassigned teacher');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Swap Class Teachers",
      message: `Swap assignments between:
${swapTarget.name} (${swapTarget.currentAssignment?.name}-${swapTarget.currentAssignment?.section})
and
${targetTeacher.name} (${targetTeacher.currentAssignment?.name}-${targetTeacher.currentAssignment?.section})`,
      onConfirm: async () => {
        try {
          setIsProcessing(true);

          // Atomic swap - both updates in parallel
          await Promise.all([
            classesApi.updateClassTeacher(sourceClassId, targetTeacher.id || targetTeacher._id),
            classesApi.updateClassTeacher(targetClassId, swapTarget.id || swapTarget._id)
          ]);

          // Update local state for both classes
          updateClassLocal(sourceClassId, {
            classTeacherId: targetTeacher.id || targetTeacher._id,
            teacher: targetTeacher.name,
            teacherPhoto: targetTeacher.picture
          });

          updateClassLocal(targetClassId, {
            classTeacherId: swapTarget.id || swapTarget._id,
            teacher: swapTarget.name,
            teacherPhoto: swapTarget.picture
          });

          toast.success('Class teachers swapped successfully');
          setSwapTarget(null);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          onClose();
        } catch (error) {
          console.error('Error swapping teachers:', error);
          toast.error(error.message || 'Failed to swap teachers');
        } finally {
          setIsProcessing(false);
        }
      },
      variant: "default"
    });
  }, [swapTarget, classesApi, updateClassLocal, onClose]);

  // Handle bulk selection toggle
  const toggleSelectionMode = useCallback(() => {
    setSelectionMode(prev => {
      if (!prev) {
        setSelectedTeachers(new Set());
      }
      return !prev;
    });
    setSwapTarget(null);
  }, []);

  // Handle teacher selection for bulk operations
  const handleSelectTeacher = useCallback((teacher) => {
    const teacherId = String(teacher.id || teacher._id);
    setSelectedTeachers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teacherId)) {
        newSet.delete(teacherId);
      } else {
        newSet.add(teacherId);
      }
      return newSet;
    });
  }, []);

  // Handle bulk swap
  const handleBulkSwap = useCallback(async () => {
    if (selectedTeachers.size !== 2) {
      toast.error('Select exactly 2 teachers to swap');
      return;
    }

    const selectedArray = Array.from(selectedTeachers);
    const teacher1 = assignedTeachers.find(t =>
      String(t.id || t._id) === selectedArray[0]
    );
    const teacher2 = assignedTeachers.find(t =>
      String(t.id || t._id) === selectedArray[1]
    );

    if (!teacher1 || !teacher2) {
      toast.error('Both teachers must be assigned to classes');
      return;
    }

    const class1 = teacher1.currentAssignment;
    const class2 = teacher2.currentAssignment;

    setConfirmDialog({
      isOpen: true,
      title: "Swap Class Teachers",
      message: `Swap assignments between:
${teacher1.name} (${class1.name}-${class1.section})
and
${teacher2.name} (${class2.name}-${class2.section})`,
      onConfirm: async () => {
        try {
          setIsProcessing(true);

          await Promise.all([
            classesApi.updateClassTeacher(class1.id, teacher2.id || teacher2._id),
            classesApi.updateClassTeacher(class2.id, teacher1.id || teacher1._id)
          ]);

          updateClassLocal(class1.id, {
            classTeacherId: teacher2.id || teacher2._id,
            teacher: teacher2.name,
            teacherPhoto: teacher2.picture
          });

          updateClassLocal(class2.id, {
            classTeacherId: teacher1.id || teacher1._id,
            teacher: teacher1.name,
            teacherPhoto: teacher1.picture
          });

          toast.success('Class teachers swapped successfully');
          setSelectedTeachers(new Set());
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          onClose();
        } catch (error) {
          console.error('Error swapping teachers:', error);
          toast.error(error.message || 'Failed to swap teachers');
        } finally {
          setIsProcessing(false);
        }
      },
      variant: "default"
    });
  }, [selectedTeachers, assignedTeachers, classesApi, updateClassLocal, onClose]);

  // Handle bulk remove
  const handleBulkRemove = useCallback(async () => {
    if (selectedTeachers.size === 0) {
      toast.error('Select at least one teacher');
      return;
    }

    const selectedArray = Array.from(selectedTeachers);
    const teachersToRemove = assignedTeachers.filter(t =>
      selectedArray.includes(String(t.id || t._id))
    );

    if (teachersToRemove.length === 0) {
      toast.error('No assigned teachers selected');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Remove Class Teacher Assignments",
      message: `Remove ${teachersToRemove.length} teacher(s) from their class assignments?`,
      onConfirm: async () => {
        try {
          setIsProcessing(true);

          // Unassign all selected teachers
          await Promise.all(
            teachersToRemove.map(teacher =>
              classesApi.updateClassTeacher(teacher.currentAssignment.id, null)
            )
          );

          // Update local state
          teachersToRemove.forEach(teacher => {
            updateClassLocal(teacher.currentAssignment.id, {
              classTeacherId: null,
              teacher: null,
              teacherPhoto: null
            });
          });

          toast.success(`${teachersToRemove.length} assignment(s) removed`);
          setSelectedTeachers(new Set());
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          onClose();
        } catch (error) {
          console.error('Error removing assignments:', error);
          toast.error(error.message || 'Failed to remove assignments');
        } finally {
          setIsProcessing(false);
        }
      },
      variant: "danger"
    });
  }, [selectedTeachers, assignedTeachers, classesApi, updateClassLocal, onClose]);

  // Handle cancel selection mode
  const handleCancelSelection = useCallback(() => {
    setSelectedTeachers(new Set());
    setSelectionMode(false);
    setSwapTarget(null);
  }, []);

  // Handle cancel swap mode
  const handleCancelSwap = useCallback(() => {
    setSwapTarget(null);
  }, []);

  // Determine action hint for teacher cards
  const getActionHint = useCallback((isAvailable) => {
    if (currentMode === 'swap') {
      return "Click to complete swap";
    }
    return isAvailable ? "Click to assign" : "Click to swap";
  }, [currentMode]);

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    setSearchQuery("");
    setDepartmentFilter("all");
    setSelectedTeachers(new Set());
    setSelectionMode(false);
    setSwapTarget(null);
    onClose();
  }, [onClose]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        size="4xl"
        scrollBehavior="inside"
        classNames={{
          backdrop: "bg-black/50 backdrop-blur-sm",
          base: "bg-white dark:bg-gray-900"
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 border-b border-default-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Assign Class Teacher</h3>
                <p className="text-sm text-default-500 font-normal">
                  For: <span className="font-medium text-primary">{className}-{section}</span>
                </p>
              </div>
              {swapTarget && (
                <Badge color="primary" variant="flat" className="text-xs">
                  Swap mode: {swapTarget.name}
                </Badge>
              )}
            </div>
          </ModalHeader>

          <ModalBody className="py-4">
            {/* Instructions Banner - Changes based on mode */}
            <div className={`rounded-lg p-4 mb-4 border ${currentMode === 'swap'
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                : currentMode === 'selection'
                  ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                  : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              }`}>
              {currentMode === 'normal' && (
                <div className="flex gap-3">
                  <Info size={20} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-green-800 dark:text-green-200 mb-2">
                      Quick Actions Guide
                    </h4>
                    <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span><strong>Click an Available teacher</strong> to assign them as class teacher</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span><strong>Click an Assigned teacher</strong> to swap their assignment</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Or use <strong>"Select Multiple"</strong> for bulk operations</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {currentMode === 'swap' && (
                <div className="flex gap-3">
                  <RefreshCw size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm text-blue-800 dark:text-blue-200">
                        Swap Mode Active
                      </h4>
                      <Button
                        size="sm"
                        variant="flat"
                        color="default"
                        onPress={handleCancelSwap}
                        className="h-7 text-xs"
                      >
                        Cancel Swap
                      </Button>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">
                      <strong>Selected:</strong> {swapTarget?.name} (currently: {swapTarget?.currentAssignment?.name}-{swapTarget?.currentAssignment?.section})
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      → Now click another assigned teacher to complete the swap
                    </p>
                  </div>
                </div>
              )}

              {currentMode === 'selection' && (
                <div className="flex gap-3">
                  <Users size={20} className="text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-purple-800 dark:text-purple-200 mb-2">
                      Bulk Selection Mode
                    </h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Check teachers to perform actions on multiple items. Select 2 teachers to swap or any number to remove.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Important Notice */}
            <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-3 flex gap-3 mb-4">
              <AlertCircle size={18} className="text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-warning-800 dark:text-warning-200">
                <strong>Important:</strong> One teacher can be assigned as class teacher to only one class.
              </p>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <Input
                placeholder="Search teachers..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                startContent={<Search size={16} className="text-default-400" />}
                isClearable
                onClear={() => setSearchQuery("")}
                variant="bordered"
                size="sm"
                classNames={{
                  input: "text-sm",
                  base: "flex-1"
                }}
              />
              <Select
                placeholder="Filter by department"
                selectedKeys={departmentFilter !== 'all' ? [departmentFilter] : []}
                onSelectionChange={(keys) => setDepartmentFilter(Array.from(keys)[0] || 'all')}
                variant="bordered"
                size="sm"
                className="flex-1 sm:max-w-xs"
                classNames={{
                  value: "text-sm",
                  trigger: "text-sm"
                }}
              >
                <SelectItem key="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept}>{dept}</SelectItem>
                ))}
              </Select>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Available Teachers */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <UserCheck size={18} className="text-success-500" />
                      <h4 className="font-semibold text-sm text-default-700">Available Teachers</h4>
                    </div>
                    <p className="text-xs text-default-500 ml-6 mt-0.5">
                      Not assigned - click to assign
                    </p>
                  </div>
                  <Badge color="success" variant="flat" size="sm">
                    {filteredAvailable.length}
                  </Badge>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  {filteredAvailable.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <Users size={32} className="text-default-300 mx-auto mb-2" />
                      <p className="text-sm text-default-500 mb-1">No available teachers</p>
                      <p className="text-xs text-default-400">
                        All teachers are currently assigned. Use swap to reassign.
                      </p>
                    </div>
                  ) : (
                    filteredAvailable.map(teacher => (
                      <TeacherCard
                        key={teacher.id || teacher._id}
                        teacher={teacher}
                        currentAssignment={null}
                        isAvailable={true}
                        isSelected={selectedTeachers.has(String(teacher.id || teacher._id))}
                        onSelect={handleSelectTeacher}
                        onClick={handleAssignTeacher}
                        showCheckbox={selectionMode}
                        actionHint={getActionHint(true)}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Assigned Teachers */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Users size={18} className="text-warning-500" />
                      <h4 className="font-semibold text-sm text-default-700">Assigned Teachers</h4>
                    </div>
                    <p className="text-xs text-default-500 ml-6 mt-0.5">
                      Already assigned - click to swap
                    </p>
                  </div>
                  <Badge color="warning" variant="flat" size="sm">
                    {filteredAssigned.length}
                  </Badge>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  {filteredAssigned.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <UserCheck size={32} className="text-default-300 mx-auto mb-2" />
                      <p className="text-sm text-default-500 mb-1">No assigned teachers</p>
                      <p className="text-xs text-default-400">
                        Teachers will appear here when assigned as class teachers.
                      </p>
                    </div>
                  ) : (
                    filteredAssigned.map(teacher => (
                      <TeacherCard
                        key={teacher.id || teacher._id}
                        teacher={teacher}
                        currentAssignment={teacher.currentAssignment}
                        isAvailable={false}
                        isSelected={selectedTeachers.has(String(teacher.id || teacher._id))}
                        onSelect={handleSelectTeacher}
                        onClick={handleInitiateSwap}
                        showCheckbox={selectionMode}
                        isSwapTarget={swapTarget?.id === teacher.id}
                        actionHint={getActionHint(false)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectionMode && selectedTeachers.size > 0 && (
              <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                    {selectedTeachers.size} teacher{selectedTeachers.size > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex gap-2">
                    {selectedTeachers.size === 2 && (
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        startContent={<RefreshCw size={14} />}
                        onPress={handleBulkSwap}
                        isDisabled={isProcessing}
                      >
                        Swap
                      </Button>
                    )}
                    <Button
                      size="sm"
                      color="danger"
                      variant="flat"
                      onPress={handleBulkRemove}
                      isDisabled={isProcessing}
                    >
                      Remove
                    </Button>
                    <Button
                      size="sm"
                      variant="light"
                      onPress={handleCancelSelection}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Keyboard Shortcut Hint */}
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-default-400">
              <Keyboard size={12} />
              <span>Press ESC to close modal</span>
            </div>
          </ModalBody>

          <ModalFooter className="border-t border-default-200">
            <Button
              variant="flat"
              onPress={handleClose}
              isDisabled={isProcessing}
            >
              {selectionMode ? 'Cancel Selection' : 'Close'}
            </Button>
            {!selectionMode && (
              <Tooltip content="Select multiple teachers for bulk operations like swap or remove">
                <Button
                  color="primary"
                  variant="flat"
                  onPress={toggleSelectionMode}
                  startContent={<Users size={14} />}
                >
                  Select Multiple
                </Button>
              </Tooltip>
            )}
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
        confirmText="Confirm"
        cancelText="Cancel"
        variant={confirmDialog.variant}
        isLoading={isProcessing}
      />
    </>
  );
}
