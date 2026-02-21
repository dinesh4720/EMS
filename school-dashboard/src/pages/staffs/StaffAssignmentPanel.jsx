import { useState, useEffect, useMemo } from "react";
import {
  Card, CardBody, CardHeader, Button, Select, SelectItem,
  Spinner, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure
} from "@heroui/react";
import { BookOpen, Plus, Trash2, Users, AlertCircle, GraduationCap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { usePermissions } from "../../context/PermissionContext";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
  showErrorToast,
  showSuccessToast,
  executeWithFeedback
} from "../../utils/errorHandling";

export default function StaffAssignmentPanel({ staffId }) {
  const { teacherAssignmentsApi, classesApi, schoolSettings, classesWithTeachers, getStaffById } = useApp();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    subject: "",
    classIds: new Set()
  });
  const [errors, setErrors] = useState({});
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const { isOpen: isConfirmDeleteOpen, onOpen: onConfirmDeleteOpen, onClose: onConfirmDeleteClose } = useDisclosure();

  // Get the staff member to match class teacher assignments
  const staff = getStaffById(staffId);

  // Get classes where this teacher is assigned as class teacher
  const classTeacherAssignments = useMemo(() => {
    if (!staff || !classesWithTeachers) return [];
    return classesWithTeachers.filter(cls => {
      // Guard: skip classes without a classTeacherId to avoid String(undefined) === String(undefined) false matches
      if (!cls.classTeacherId) return false;
      return String(cls.classTeacherId) === String(staff.id) || (staff._id && String(cls.classTeacherId) === String(staff._id));
    });
  }, [staff, classesWithTeachers]);

  // Check if user has edit permission
  const canEdit = hasPermission('staff', 'edit');

  // Available subjects from school settings
  const availableSubjects = schoolSettings?.subjects || [
    "Mathematics",
    "Science",
    "English",
    "Hindi",
    "Social Studies",
    "Computer Science",
    "Physical Education",
    "Art",
    "Music"
  ];

  // Load teacher assignments and available classes on mount
  useEffect(() => {
    if (staffId) {
      loadData();
    }
  }, [staffId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load assignments and classes in parallel
      const [assignmentsData, classesData] = await Promise.all([
        teacherAssignmentsApi.getAll(staffId),
        classesApi.getAll()
      ]);

      setAssignments(assignmentsData.assignments || []);
      setAvailableClasses(classesData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      showErrorToast(error, "Failed to load teacher assignments");
    } finally {
      setLoading(false);
    }
  };

  const validateAssignment = () => {
    const newErrors = {};

    if (!newAssignment.subject) {
      newErrors.subject = "Please select a subject";
    }

    if (newAssignment.classIds.size === 0) {
      newErrors.classes = "Please select at least one class";
    }

    // Check if this subject already has an assignment
    const existingAssignment = assignments.find(
      a => a.subject === newAssignment.subject
    );

    if (existingAssignment) {
      // Check if any of the selected classes are already assigned
      const selectedClassIds = Array.from(newAssignment.classIds);
      const existingClassIds = existingAssignment.classes.map(c => c._id || c);
      const duplicates = selectedClassIds.filter(id =>
        existingClassIds.includes(id)
      );

      if (duplicates.length > 0) {
        newErrors.classes = "Some selected classes are already assigned to this subject";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddAssignment = async () => {
    if (!validateAssignment()) {
      return;
    }

    await executeWithFeedback(
      async () => {
        setSaving(true);

        const classIds = Array.from(newAssignment.classIds);
        await teacherAssignmentsApi.create({
          teacherId: staffId,
          subject: newAssignment.subject,
          classIds
        });

        // Reset form and close modal
        setNewAssignment({ subject: "", classIds: new Set() });
        setIsAddModalOpen(false);
        setErrors({});

        // Reload assignments
        await loadData();
      },
      {
        loadingMessage: 'Adding assignment...',
        successMessage: 'Assignment added successfully!',
        errorMessage: null,
        onSuccess: () => {
          setSaving(false);
        },
        onError: () => {
          setSaving(false);
        }
      }
    );
  };

  const handleRemoveAssignment = (assignmentId) => {
    setAssignmentToDelete(assignmentId);
    onConfirmDeleteOpen();
  };

  const confirmRemoveAssignment = async () => {
    if (!assignmentToDelete) return;

    await executeWithFeedback(
      async () => {
        setSaving(true);
        await teacherAssignmentsApi.delete(assignmentToDelete, staffId);

        // Reload assignments
        await loadData();
      },
      {
        loadingMessage: 'Removing assignment...',
        successMessage: 'Assignment removed successfully!',
        errorMessage: null,
        onSuccess: () => {
          setSaving(false);
          setAssignmentToDelete(null);
          onConfirmDeleteClose();
        },
        onError: () => {
          setSaving(false);
          setAssignmentToDelete(null);
          onConfirmDeleteClose();
        }
      }
    );
  };

  const handleOpenAddModal = () => {
    setNewAssignment({ subject: "", classIds: new Set() });
    setErrors({});
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setNewAssignment({ subject: "", classIds: new Set() });
    setErrors({});
  };

  const getClassDisplay = (classObj) => {
    if (typeof classObj === 'string') {
      const foundClass = availableClasses.find(c => c._id === classObj || c.id === classObj);
      return foundClass ? `${foundClass.name} ${foundClass.section}` : classObj;
    }
    return `${classObj.name} ${classObj.section}`;
  };

  if (loading) {
    return (
      <Card className="shadow-sm border border-default-200">
        <CardBody className="flex items-center justify-center py-12">
          <Spinner size="lg" />
          <p className="text-default-500 mt-4">Loading assignments...</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Class Teacher Assignments Section - Always visible */}
        <Card className="shadow-sm border border-default-200">
          <CardHeader className="flex justify-between items-center px-6 py-4 border-b border-default-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <GraduationCap size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-default-800">Class Teacher Assignment</h3>
                <p className="text-xs text-default-500">
                  {classTeacherAssignments.length > 0 ? 'Class assigned as class teacher (homeroom)' : 'Not assigned to any class'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            {classTeacherAssignments.length > 0 ? (
              <div className="space-y-3">
                {classTeacherAssignments.map((cls) => (
                  <div
                    key={cls.id || cls._id}
                    className="flex items-center justify-between p-4 rounded-lg border border-default-200 hover:border-primary-200 hover:bg-primary-50/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/classes/${cls.id || cls._id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                        {cls.name}-{cls.section}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-default-800">{cls.name} - {cls.section}</p>
                        <p className="text-xs text-default-500">{cls.studentCount || cls.strength || 0} students</p>
                      </div>
                    </div>
                    <Chip size="sm" variant="flat" color="primary">Class Teacher</Chip>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-4">
                <div className="w-12 h-12 rounded-full bg-default-100 flex items-center justify-center mb-3">
                  <GraduationCap size={20} className="text-default-300" />
                </div>
                <p className="text-sm text-default-500 mb-1">No class has been assigned yet</p>
                <p className="text-xs text-default-400 mb-4">This staff member is not a class teacher for any class.</p>
                <Link to="/classes" className="text-xs font-medium text-primary hover:text-primary-600 bg-primary-50 hover:bg-primary-100 px-4 py-2 rounded-lg transition-colors no-underline">
                  Assign a Class →
                </Link>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Info Banner - Clarify Class Teacher vs Subject Teacher */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
          <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> The section below manages <strong>subject assignments</strong> (which subjects and classes this teacher can teach in the timetable).
              {classTeacherAssignments.length > 0 ? ' The class teacher assignments shown above are managed from the ' : ' To assign a class teacher, go to the '}
              <Link to="/classes" className="underline hover:text-blue-900">Classes section</Link>.
            </p>
          </div>
        </div>

        <Card className="shadow-sm border border-default-200">
          <CardHeader className="flex justify-between items-center px-6 py-4 border-b border-default-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <BookOpen size={20} className="text-secondary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-default-800">Subject Assignments</h3>
                <p className="text-xs text-default-500">Manage which subjects and classes this teacher can teach</p>
              </div>
            </div>
            <Button
              color="secondary"
              startContent={<Plus size={16} />}
              onPress={handleOpenAddModal}
              isDisabled={saving || !canEdit}
              size="sm"
            >
              Add Assignment
            </Button>
          </CardHeader>
          <CardBody className="p-6">
            {!canEdit && (
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 flex items-center gap-2 mb-4">
                <span className="text-sm text-warning-700">
                  You don't have permission to edit teacher assignments. Contact an administrator for access.
                </span>
              </div>
            )}
            {assignments.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-default-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <BookOpen size={32} className="text-default-400" />
                </div>
                <h4 className="text-lg font-medium text-default-700 mb-2">No Assignments Yet</h4>
                <p className="text-sm text-default-500 mb-4">
                  This teacher hasn't been assigned any subjects or classes yet.
                </p>
                <Button
                  color="secondary"
                  variant="flat"
                  startContent={<Plus size={16} />}
                  onPress={handleOpenAddModal}
                  isDisabled={!canEdit}
                >
                  Add First Assignment
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <Card
                    key={assignment._id}
                    className="shadow-sm border border-default-200 hover:border-secondary-200 transition-colors"
                  >
                    <CardBody className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <BookOpen size={18} className="text-secondary" />
                            <h4 className="text-base font-semibold text-default-800">
                              {assignment.subject}
                            </h4>
                          </div>

                          <div className="flex items-start gap-2">
                            <Users size={16} className="text-default-400 mt-1 flex-shrink-0" />
                            <div className="flex flex-wrap gap-2">
                              {assignment.classes && assignment.classes.length > 0 ? (
                                assignment.classes.map((classObj, idx) => (
                                  <Chip
                                    key={idx}
                                    size="sm"
                                    variant="flat"
                                    color="secondary"
                                  >
                                    {getClassDisplay(classObj)}
                                  </Chip>
                                ))
                              ) : (
                                <span className="text-sm text-default-500">No classes assigned</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => handleRemoveAssignment(assignment._id)}
                          isDisabled={saving || !canEdit}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Summary Card */}
        {(assignments.length > 0 || classTeacherAssignments.length > 0) && (
          <Card className="shadow-sm border border-default-200 bg-gradient-to-br from-secondary-50 to-white">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                {classTeacherAssignments.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-default-700">Class Teacher</p>
                    <p className="text-2xl font-bold text-primary mt-1">
                      {classTeacherAssignments.length} {classTeacherAssignments.length === 1 ? 'class' : 'classes'}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-default-700">Subject Assignments</p>
                  <p className="text-2xl font-bold text-secondary mt-1">
                    {assignments.length}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-default-700">Total Classes</p>
                  <p className="text-2xl font-bold text-secondary mt-1">
                    {assignments.reduce((sum, a) => sum + (a.classes?.length || 0), 0) + classTeacherAssignments.length}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Add Assignment Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        size="2xl"
        classNames={{
          backdrop: "bg-black/50",
          base: "bg-white dark:bg-gray-900"
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-semibold">Add Subject Assignment</h3>
            <p className="text-sm text-gray-500 font-normal">Assign subjects and classes to this teacher</p>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="space-y-4">
              {/* Subject Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-default-700">
                  Subject <span className="text-danger">*</span>
                </label>
                <Select
                  placeholder="Select a subject"
                  selectedKeys={newAssignment.subject ? new Set([newAssignment.subject]) : new Set()}
                  onSelectionChange={(keys) => {
                    const subject = Array.from(keys)[0];
                    setNewAssignment(prev => ({ ...prev, subject }));
                    if (errors.subject) {
                      setErrors(prev => ({ ...prev, subject: undefined }));
                    }
                  }}
                  isInvalid={!!errors.subject}
                  errorMessage={errors.subject}
                  variant="bordered"
                  radius="lg"
                  size="md"
                  classNames={{
                    trigger: "border-default-200",
                    value: "text-sm"
                  }}
                >
                  {availableSubjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Class Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-default-700">
                  Classes <span className="text-danger">*</span>
                </label>
                <Select
                  label="Select classes"
                  placeholder="Choose one or more classes"
                  selectionMode="multiple"
                  selectedKeys={newAssignment.classIds}
                  onSelectionChange={(keys) => {
                    setNewAssignment(prev => ({ ...prev, classIds: keys }));
                    if (errors.classes) {
                      setErrors(prev => ({ ...prev, classes: undefined }));
                    }
                  }}
                  isInvalid={!!errors.classes}
                  errorMessage={errors.classes}
                  variant="bordered"
                  radius="lg"
                  size="md"
                  classNames={{
                    trigger: "border-default-200",
                    value: "text-sm"
                  }}
                >
                  {availableClasses.map((classObj) => (
                    <SelectItem key={classObj._id || classObj.id} value={classObj._id || classObj.id}>
                      {`${classObj.name} ${classObj.section}`}
                    </SelectItem>
                  ))}
                </Select>

                {newAssignment.classIds.size > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {Array.from(newAssignment.classIds).map((classId) => {
                      // FIXED: Use String() comparison for ObjectId matching
                      const classObj = availableClasses.find(c => String(c._id || c.id) === String(classId));
                      return classObj ? (
                        <Chip
                          key={classId}
                          size="sm"
                          variant="flat"
                          color="secondary"
                          onClose={() => {
                            const newSelection = new Set(newAssignment.classIds);
                            newSelection.delete(classId);
                            setNewAssignment(prev => ({ ...prev, classIds: newSelection }));
                          }}
                        >
                          {`${classObj.name} ${classObj.section}`}
                        </Chip>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Info Message */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
                <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> This assignment will allow the teacher to be selected when creating timetables for the selected classes and subject.
                  </p>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-gray-200 dark:border-gray-800">
            <Button
              variant="light"
              onPress={handleCloseAddModal}
              isDisabled={saving}
            >
              Cancel
            </Button>
            <Button
              color="secondary"
              onPress={handleAddAssignment}
              isLoading={saving}
              startContent={!saving && <Plus size={16} />}
            >
              Add Assignment
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        onClose={onConfirmDeleteClose}
        onConfirm={confirmRemoveAssignment}
        title="Remove Assignment"
        message="Are you sure you want to remove this assignment? This will prevent the teacher from being assigned to these classes for this subject in the timetable."
        confirmText="Remove Assignment"
        cancelText="Cancel"
        variant="danger"
        isLoading={saving}
      />
    </>
  );
}
