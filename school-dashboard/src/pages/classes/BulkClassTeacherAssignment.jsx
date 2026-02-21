import { useState, useMemo, useCallback } from "react";
import {
  Card, CardHeader, CardBody, Chip, Button, Avatar,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter
} from "@heroui/react";
import { Search, X, ArrowLeftRight, RefreshCw, Users, UserCheck, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "../../context/AppContext";
import { usePermissions } from "../../context/PermissionContext";

/**
 * BulkClassTeacherAssignment - Redesigned intuitive UI for class teacher management
 * 
 * Features:
 * - Clear visual separation: Assigned Teachers | Available Teachers
 * - See all classes assigned to each teacher
 * - Swap functionality between assigned teachers
 * - Swap functionality between available and assigned
 * - Warning when trying to assign already-assigned teacher
 * - Refresh/swap button for already assigned classes
 */
export default function BulkClassTeacherAssignment() {
  const { staff, classesWithTeachers, classesApi, updateClassLocal, refetch } = useApp();
  const { hasPermission } = usePermissions();

  // Permission check
  const canEdit = hasPermission('classes', 'edit');

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [swapModal, setSwapModal] = useState({
    isOpen: false,
    type: null, // 'assign-new', 'swap-assigned', 'swap-available'
    sourceTeacher: null,
    targetClass: null,
    affectedClass: null
  });

  // Get all teachers
  const teachers = useMemo(() => {
    return staff.filter(s => {
      const roles = Array.isArray(s.role) ? s.role : [s.role];
      const staffTypes = Array.isArray(s.staffType) ? s.staffType : [s.staffType];
      return roles.includes('Teacher') || staffTypes.includes('Teacher') || s.isClassTeacher;
    });
  }, [staff]);

  // Build teacher assignment map
  const teacherAssignments = useMemo(() => {
    const assigned = [];
    const available = [];

    teachers.forEach(teacher => {
      const teacherId = String(teacher.id || teacher._id);
      const assignedClasses = classesWithTeachers.filter(c =>
        String(c.classTeacherId) === teacherId
      );

      if (assignedClasses.length > 0) {
        assigned.push({
          ...teacher,
          assignedClasses
        });
      } else {
        available.push(teacher);
      }
    });

    return { assigned, available };
  }, [teachers, classesWithTeachers]);

  // Filter teachers by search
  const filteredAssigned = useMemo(() => {
    if (!searchQuery) return teacherAssignments.assigned;
    const search = searchQuery.toLowerCase();
    return teacherAssignments.assigned.filter(t =>
      t.name?.toLowerCase().includes(search) ||
      t.assignedClasses.some(c =>
        `${c.name}-${c.section}`.toLowerCase().includes(search)
      )
    );
  }, [teacherAssignments.assigned, searchQuery]);

  const filteredAvailable = useMemo(() => {
    if (!searchQuery) return teacherAssignments.available;
    const search = searchQuery.toLowerCase();
    return teacherAssignments.available.filter(t =>
      t.name?.toLowerCase().includes(search)
    );
  }, [teacherAssignments.available, searchQuery]);

  // Get unassigned classes
  const unassignedClasses = useMemo(() => {
    return classesWithTeachers.filter(c => !c.classTeacherId).sort((a, b) => {
      const nameCompare = parseInt(a.name) - parseInt(b.name);
      if (nameCompare !== 0) return nameCompare;
      return (a.section || '').localeCompare(b.section || '');
    });
  }, [classesWithTeachers]);

  // Handle assigning available teacher to a class
  const handleAssignAvailableTeacher = useCallback((teacher, targetClass) => {
    if (!canEdit) {
      toast.error('You do not have permission to edit class assignments');
      return;
    }

    setSwapModal({
      isOpen: true,
      type: 'assign-new',
      sourceTeacher: teacher,
      targetClass,
      affectedClass: null
    });
  }, [canEdit]);

  // Handle swapping between two assigned teachers
  const handleSwapAssignedTeachers = useCallback((teacher1, class1, teacher2, class2) => {
    if (!canEdit) {
      toast.error('You do not have permission to edit class assignments');
      return;
    }

    setSwapModal({
      isOpen: true,
      type: 'swap-assigned',
      sourceTeacher: teacher1,
      targetClass: class2,
      affectedClass: class1,
      targetTeacher: teacher2
    });
  }, [canEdit]);

  // Handle replacing assigned teacher with available teacher
  const handleReplaceWithAvailable = useCallback((availableTeacher, assignedTeacher, targetClass) => {
    if (!canEdit) {
      toast.error('You do not have permission to edit class assignments');
      return;
    }

    setSwapModal({
      isOpen: true,
      type: 'swap-available',
      sourceTeacher: availableTeacher,
      targetClass,
      affectedClass: null,
      replacedTeacher: assignedTeacher
    });
  }, [canEdit]);

  // Execute the assignment/swap
  const executeAssignment = useCallback(async () => {
    const { type, sourceTeacher, targetClass, affectedClass, targetTeacher, replacedTeacher } = swapModal;

    try {
      setIsProcessing(true);

      if (type === 'assign-new') {
        // Simple assignment of available teacher to unassigned class
        await classesApi.updateClassTeacher(targetClass.id, String(sourceTeacher.id || sourceTeacher._id));
        updateClassLocal(targetClass.id, {
          classTeacherId: String(sourceTeacher.id || sourceTeacher._id),
          teacher: sourceTeacher.name,
          teacherPhoto: sourceTeacher.picture
        });
        toast.success(`${sourceTeacher.name} assigned to Class ${targetClass.name}-${targetClass.section}`);

      } else if (type === 'swap-assigned') {
        // Swap two assigned teachers between their classes
        const teacher1Id = String(sourceTeacher.id || sourceTeacher._id);
        const teacher2Id = String(targetTeacher.id || targetTeacher._id);

        // Update first class with second teacher
        await classesApi.updateClassTeacher(affectedClass.id, teacher2Id);
        updateClassLocal(affectedClass.id, {
          classTeacherId: teacher2Id,
          teacher: targetTeacher.name,
          teacherPhoto: targetTeacher.picture
        });

        // Update second class with first teacher
        await classesApi.updateClassTeacher(targetClass.id, teacher1Id);
        updateClassLocal(targetClass.id, {
          classTeacherId: teacher1Id,
          teacher: sourceTeacher.name,
          teacherPhoto: sourceTeacher.picture
        });

        toast.success(`Swapped: ${sourceTeacher.name} ↔ ${targetTeacher.name}`);

      } else if (type === 'swap-available') {
        // Replace assigned teacher with available teacher
        const newTeacherId = String(sourceTeacher.id || sourceTeacher._id);

        // Remove old teacher (they become available)
        await classesApi.updateClassTeacher(targetClass.id, newTeacherId);
        updateClassLocal(targetClass.id, {
          classTeacherId: newTeacherId,
          teacher: sourceTeacher.name,
          teacherPhoto: sourceTeacher.picture
        });

        toast.success(`${sourceTeacher.name} replaced ${replacedTeacher.name} for Class ${targetClass.name}-${targetClass.section}`);
      }

      if (refetch) await refetch();
      setSwapModal({ isOpen: false, type: null, sourceTeacher: null, targetClass: null, affectedClass: null });

    } catch (error) {
      console.error('Error executing assignment:', error);
      toast.error(error.message || 'Failed to update assignment');
    } finally {
      setIsProcessing(false);
    }
  }, [swapModal, classesApi, updateClassLocal, refetch]);

  // Handle unassigning a teacher
  const handleUnassign = useCallback(async (cls) => {
    if (!canEdit) {
      toast.error('You do not have permission to edit class assignments');
      return;
    }

    try {
      setIsProcessing(true);
      await classesApi.updateClassTeacher(cls.id, null);
      updateClassLocal(cls.id, {
        classTeacherId: null,
        teacher: null,
        teacherPhoto: null
      });
      toast.success(`Class ${cls.name}-${cls.section} unassigned`);
      if (refetch) await refetch();
    } catch (error) {
      console.error('Error unassigning teacher:', error);
      toast.error(error.message || 'Failed to unassign teacher');
    } finally {
      setIsProcessing(false);
    }
  }, [canEdit, classesApi, updateClassLocal, refetch]);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-default-900">Class Teacher Management</h2>
            <p className="text-sm text-default-500">
              {teacherAssignments.assigned.length} assigned • {teacherAssignments.available.length} available • {unassignedClasses.length} unassigned classes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:max-w-[350px] px-3 py-2 bg-default-100 rounded-lg border border-default-200 hover:border-primary hover:bg-default-50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
          <Search size={16} className="text-default-400" />
          <input
            type="search"
            placeholder="Search teachers or classes..."
            className="flex-1 bg-transparent outline-none text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="p-0.5 hover:bg-default-200 rounded cursor-pointer">
              <X size={14} className="text-default-400" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Assigned Teachers */}
        <Card className="shadow-sm border border-default-200">
          <CardHeader className="flex justify-between items-center px-6 py-4 border-b border-default-100 bg-success-50/50">
            <div className="flex items-center gap-2">
              <UserCheck size={20} className="text-success-600" />
              <div>
                <h3 className="text-base font-semibold text-default-800">Assigned Teachers</h3>
                <p className="text-xs text-default-500">{filteredAssigned.length} teachers with class assignments</p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-4 max-h-[600px] overflow-y-auto">
            {filteredAssigned.length === 0 ? (
              <div className="text-center py-12">
                <UserCheck size={32} className="text-default-300 mx-auto mb-2" />
                <p className="text-sm text-default-500">No assigned teachers</p>
                <p className="text-xs text-default-400 mt-1">Assign teachers from the available list</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAssigned.map((teacher) => (
                  <div
                    key={teacher.id || teacher._id}
                    className="p-4 rounded-lg border border-default-200 bg-white hover:shadow-md transition-all"
                  >
                    {/* Teacher Info */}
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar
                        src={teacher.picture}
                        name={teacher.name}
                        size="md"
                        className="flex-shrink-0"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-default-900">{teacher.name}</p>
                        <p className="text-xs text-default-500">{teacher.department || 'Teacher'}</p>
                      </div>
                      <Chip size="sm" color="success" variant="flat">
                        {teacher.assignedClasses.length} Class{teacher.assignedClasses.length > 1 ? 'es' : ''}
                      </Chip>
                    </div>

                    {/* Assigned Classes */}
                    <div className="space-y-2">
                      {teacher.assignedClasses.map((cls) => (
                        <div
                          key={cls.id}
                          className="flex items-center justify-between p-2 rounded bg-default-50 border border-default-100"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-semibold text-primary">{cls.name}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-default-900">
                                Class {cls.name}-{cls.section}
                              </p>
                              <p className="text-xs text-default-500">{cls.studentCount || 0} students</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="light"
                              isIconOnly
                              onPress={() => {
                                // Open swap modal for this class
                                setSwapModal({
                                  isOpen: true,
                                  type: 'replace-teacher',
                                  currentTeacher: teacher,
                                  targetClass: cls
                                });
                              }}
                              title="Swap or replace teacher"
                              isDisabled={isProcessing || !canEdit}
                            >
                              <RefreshCw size={14} className="text-default-500" />
                            </Button>
                            <Button
                              size="sm"
                              variant="light"
                              isIconOnly
                              onPress={() => handleUnassign(cls)}
                              title="Unassign teacher"
                              isDisabled={isProcessing || !canEdit}
                            >
                              <X size={14} className="text-danger-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Right Column - Available Teachers & Unassigned Classes */}
        <div className="space-y-6">
          {/* Available Teachers */}
          <Card className="shadow-sm border border-default-200">
            <CardHeader className="flex justify-between items-center px-6 py-4 border-b border-default-100 bg-default-50">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-default-600" />
                <div>
                  <h3 className="text-base font-semibold text-default-800">Available Teachers</h3>
                  <p className="text-xs text-default-500">{filteredAvailable.length} teachers without assignments</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-4 max-h-[280px] overflow-y-auto">
              {filteredAvailable.length === 0 ? (
                <div className="text-center py-8">
                  <Users size={28} className="text-default-300 mx-auto mb-2" />
                  <p className="text-sm text-default-500">No available teachers</p>
                  <p className="text-xs text-default-400 mt-1">All teachers are assigned</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAvailable.map((teacher) => (
                    <div
                      key={teacher.id || teacher._id}
                      className="flex items-center justify-between p-3 rounded-lg border border-default-200 bg-white hover:border-primary hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={teacher.picture}
                          name={teacher.name}
                          size="sm"
                          className="flex-shrink-0"
                        />
                        <div>
                          <p className="text-sm font-medium text-default-900">{teacher.name}</p>
                          <p className="text-xs text-default-500">{teacher.department || 'Teacher'}</p>
                        </div>
                      </div>
                      <Chip size="sm" color="default" variant="flat">
                        Available
                      </Chip>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Unassigned Classes */}
          <Card className="shadow-sm border border-default-200">
            <CardHeader className="flex justify-between items-center px-6 py-4 border-b border-default-100 bg-warning-50/50">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} className="text-warning-600" />
                <div>
                  <h3 className="text-base font-semibold text-default-800">Unassigned Classes</h3>
                  <p className="text-xs text-default-500">{unassignedClasses.length} classes need teachers</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-4 max-h-[280px] overflow-y-auto">
              {unassignedClasses.length === 0 ? (
                <div className="text-center py-8">
                  <UserCheck size={28} className="text-success-500 mx-auto mb-2" />
                  <p className="text-sm text-success-600 font-medium">All classes assigned!</p>
                  <p className="text-xs text-default-400 mt-1">Every class has a teacher</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {unassignedClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-warning-200 bg-warning-50/30 hover:border-warning-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-warning-100 flex items-center justify-center">
                          <span className="text-xs font-semibold text-warning-700">{cls.name}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-default-900">
                            Class {cls.name}-{cls.section}
                          </p>
                          <p className="text-xs text-default-500">{cls.studentCount || 0} students</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        onPress={() => {
                          // Open assignment modal
                          setSwapModal({
                            isOpen: true,
                            type: 'assign-to-unassigned',
                            targetClass: cls
                          });
                        }}
                        isDisabled={isProcessing || !canEdit || filteredAvailable.length === 0}
                      >
                        Assign
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Assignment/Swap Modal */}
      <Modal
        isOpen={swapModal.isOpen}
        onClose={() => !isProcessing && setSwapModal({ isOpen: false, type: null, sourceTeacher: null, targetClass: null, affectedClass: null })}
        size="2xl"
        classNames={{
          backdrop: "bg-black/50 backdrop-blur-sm",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 border-b border-default-200">
            <div className="flex items-center gap-2">
              {swapModal.type === 'replace-teacher' ? (
                <>
                  <RefreshCw size={20} className="text-primary" />
                  <span>Replace or Swap Teacher</span>
                </>
              ) : (
                <>
                  <UserCheck size={20} className="text-primary" />
                  <span>Assign Teacher</span>
                </>
              )}
            </div>
            {swapModal.targetClass && (
              <p className="text-sm text-default-500 font-normal">
                For Class {swapModal.targetClass.name}-{swapModal.targetClass.section}
              </p>
            )}
          </ModalHeader>

          <ModalBody className="py-6">
            {swapModal.type === 'replace-teacher' && swapModal.currentTeacher && (
              <div className="space-y-4">
                {/* Current Assignment */}
                <div className="p-4 rounded-lg bg-default-50 border border-default-200">
                  <p className="text-xs text-default-500 mb-2">Currently Assigned</p>
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={swapModal.currentTeacher.picture}
                      name={swapModal.currentTeacher.name}
                      size="md"
                    />
                    <div>
                      <p className="text-sm font-semibold text-default-900">{swapModal.currentTeacher.name}</p>
                      <p className="text-xs text-default-500">{swapModal.currentTeacher.department || 'Teacher'}</p>
                    </div>
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-default-700">Choose an option:</p>

                  {/* Option 1: Swap with another assigned teacher */}
                  {filteredAssigned.filter(t => t.id !== swapModal.currentTeacher.id).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-default-500 font-medium">Swap with another assigned teacher:</p>
                      <div className="max-h-[200px] overflow-y-auto space-y-2">
                        {filteredAssigned
                          .filter(t => (t.id || t._id) !== (swapModal.currentTeacher.id || swapModal.currentTeacher._id))
                          .map((teacher) => (
                            <button
                              key={teacher.id || teacher._id}
                              onClick={() => {
                                handleSwapAssignedTeachers(
                                  swapModal.currentTeacher,
                                  swapModal.targetClass,
                                  teacher,
                                  teacher.assignedClasses[0]
                                );
                              }}
                              className="w-full flex items-center justify-between p-3 rounded-lg border border-default-200 hover:border-primary hover:bg-primary-50 transition-all text-left"
                              disabled={isProcessing}
                            >
                              <div className="flex items-center gap-3">
                                <Avatar
                                  src={teacher.picture}
                                  name={teacher.name}
                                  size="sm"
                                />
                                <div>
                                  <p className="text-sm font-medium text-default-900">{teacher.name}</p>
                                  <p className="text-xs text-default-500">
                                    Currently: Class {teacher.assignedClasses[0]?.name}-{teacher.assignedClasses[0]?.section}
                                  </p>
                                </div>
                              </div>
                              <ArrowLeftRight size={16} className="text-default-400" />
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Option 2: Replace with available teacher */}
                  {filteredAvailable.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-default-500 font-medium">Replace with available teacher:</p>
                      <div className="max-h-[200px] overflow-y-auto space-y-2">
                        {filteredAvailable.map((teacher) => (
                          <button
                            key={teacher.id || teacher._id}
                            onClick={() => {
                              handleReplaceWithAvailable(
                                teacher,
                                swapModal.currentTeacher,
                                swapModal.targetClass
                              );
                            }}
                            className="w-full flex items-center justify-between p-3 rounded-lg border border-default-200 hover:border-success hover:bg-success-50 transition-all text-left"
                            disabled={isProcessing}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar
                                src={teacher.picture}
                                name={teacher.name}
                                size="sm"
                              />
                              <div>
                                <p className="text-sm font-medium text-default-900">{teacher.name}</p>
                                <p className="text-xs text-default-500">{teacher.department || 'Teacher'}</p>
                              </div>
                            </div>
                            <Chip size="sm" color="success" variant="flat">Available</Chip>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredAssigned.filter(t => t.id !== swapModal.currentTeacher.id).length === 0 && filteredAvailable.length === 0 && (
                    <div className="text-center py-8">
                      <AlertCircle size={32} className="text-default-300 mx-auto mb-2" />
                      <p className="text-sm text-default-500">No other teachers available</p>
                      <p className="text-xs text-default-400 mt-1">Add more teachers to enable swapping</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {swapModal.type === 'assign-to-unassigned' && swapModal.targetClass && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-warning-50 border border-warning-200">
                  <p className="text-xs text-warning-700 mb-2">Unassigned Class</p>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded bg-warning-100 flex items-center justify-center">
                      <span className="text-sm font-semibold text-warning-700">{swapModal.targetClass.name}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-default-900">
                        Class {swapModal.targetClass.name}-{swapModal.targetClass.section}
                      </p>
                      <p className="text-xs text-default-500">{swapModal.targetClass.studentCount || 0} students</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-default-700">Select a teacher to assign:</p>
                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {filteredAvailable.length === 0 ? (
                      <div className="text-center py-8">
                        <Users size={32} className="text-default-300 mx-auto mb-2" />
                        <p className="text-sm text-default-500">No available teachers</p>
                        <p className="text-xs text-default-400 mt-1">All teachers are currently assigned</p>
                      </div>
                    ) : (
                      filteredAvailable.map((teacher) => (
                        <button
                          key={teacher.id || teacher._id}
                          onClick={() => {
                            handleAssignAvailableTeacher(teacher, swapModal.targetClass);
                          }}
                          className="w-full flex items-center justify-between p-3 rounded-lg border border-default-200 hover:border-primary hover:bg-primary-50 transition-all text-left"
                          disabled={isProcessing}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={teacher.picture}
                              name={teacher.name}
                              size="md"
                            />
                            <div>
                              <p className="text-sm font-medium text-default-900">{teacher.name}</p>
                              <p className="text-xs text-default-500">{teacher.department || 'Teacher'}</p>
                            </div>
                          </div>
                          <Chip size="sm" color="success" variant="flat">Available</Chip>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation for simple operations */}
            {(swapModal.type === 'assign-new' || swapModal.type === 'swap-assigned' || swapModal.type === 'swap-available') && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle size={18} className="text-blue-600" />
                    <p className="text-sm font-medium text-blue-900">Confirm Action</p>
                  </div>

                  {swapModal.type === 'assign-new' && swapModal.sourceTeacher && swapModal.targetClass && (
                    <div className="space-y-2">
                      <p className="text-sm text-blue-800">
                        Assign <span className="font-semibold">{swapModal.sourceTeacher.name}</span> as class teacher for{' '}
                        <span className="font-semibold">Class {swapModal.targetClass.name}-{swapModal.targetClass.section}</span>?
                      </p>
                    </div>
                  )}

                  {swapModal.type === 'swap-assigned' && swapModal.sourceTeacher && swapModal.targetTeacher && (
                    <div className="space-y-3">
                      <p className="text-sm text-blue-800 font-medium">Swap teachers between classes:</p>
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-center">
                          <p className="text-xs text-blue-600 mb-1">{swapModal.sourceTeacher.name}</p>
                          <p className="text-sm font-semibold text-blue-900">
                            Class {swapModal.affectedClass?.name}-{swapModal.affectedClass?.section}
                          </p>
                        </div>
                        <ArrowLeftRight size={20} className="text-blue-600" />
                        <div className="text-center">
                          <p className="text-xs text-blue-600 mb-1">{swapModal.targetTeacher.name}</p>
                          <p className="text-sm font-semibold text-blue-900">
                            Class {swapModal.targetClass?.name}-{swapModal.targetClass?.section}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {swapModal.type === 'swap-available' && swapModal.sourceTeacher && swapModal.replacedTeacher && (
                    <div className="space-y-2">
                      <p className="text-sm text-blue-800">
                        Replace <span className="font-semibold">{swapModal.replacedTeacher.name}</span> with{' '}
                        <span className="font-semibold">{swapModal.sourceTeacher.name}</span> for{' '}
                        <span className="font-semibold">Class {swapModal.targetClass?.name}-{swapModal.targetClass?.section}</span>?
                      </p>
                      <p className="text-xs text-blue-600 mt-2">
                        {swapModal.replacedTeacher.name} will become available for other assignments.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </ModalBody>

          <ModalFooter className="border-t border-default-200">
            <Button
              variant="flat"
              onPress={() => setSwapModal({ isOpen: false, type: null, sourceTeacher: null, targetClass: null, affectedClass: null })}
              isDisabled={isProcessing}
            >
              Cancel
            </Button>
            {(swapModal.type === 'assign-new' || swapModal.type === 'swap-assigned' || swapModal.type === 'swap-available') && (
              <Button
                color="primary"
                onPress={executeAssignment}
                isLoading={isProcessing}
                isDisabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Confirm'}
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
