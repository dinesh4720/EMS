import { useState, useEffect, useMemo } from "react";
import { Button, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Select, SelectItem } from "@heroui/react";
import { BookOpen, Plus, Trash2, Users, AlertCircle, GraduationCap, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { usePermissions } from "../../context/PermissionContext";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
  showErrorToast,
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
      if (!cls.classTeacherId) return false;
      return String(cls.classTeacherId) === String(staff.id) || (staff._id && String(cls.classTeacherId) === String(staff._id));
    });
  }, [staff, classesWithTeachers]);

  // Check if user has edit permission
  const canEdit = hasPermission('staff', 'edit');

  // Available subjects from school settings - extract names from objects
  const availableSubjects = schoolSettings?.subjects?.map(s => 
    typeof s === 'string' ? s : s.name
  ) || [
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

    const existingAssignment = assignments.find(
      a => a.subject === newAssignment.subject
    );

    if (existingAssignment) {
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

        setNewAssignment({ subject: "", classIds: new Set() });
        setIsAddModalOpen(false);
        setErrors({});

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

  // Calculate summary stats
  const totalClassesAssigned = assignments.reduce((sum, a) => sum + (a.classes?.length || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
          <p className="text-sm text-gray-500">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">

        {/* Class Teacher Assignments Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <GraduationCap size={16} className="text-gray-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">Class Teacher Assignment</h3>
                <p className="text-xs text-gray-500">
                  {classTeacherAssignments.length > 0 ? 'Class assigned as class teacher (homeroom)' : 'Not assigned to any class'}
                </p>
              </div>
            </div>
          </div>
          <div className="p-5">
            {classTeacherAssignments.length > 0 ? (
              <div className="space-y-2">
                {classTeacherAssignments.map((cls) => (
                  <div
                    key={cls.id || cls._id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/classes/${cls.id || cls._id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
                        {cls.name}-{cls.section}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{cls.name} - {cls.section}</p>
                        <p className="text-xs text-gray-500">{cls.studentCount || cls.strength || 0} students</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                      Class Teacher
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-6">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <GraduationCap size={20} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-1">No class has been assigned yet</p>
                <p className="text-xs text-gray-400 mb-4">This staff member is not a class teacher for any class.</p>
                <Link
                  to="/classes"
                  className="text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors no-underline"
                >
                  Assign a Class
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle size={16} className="text-gray-600" />
            </div>
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> The section below manages <strong>subject assignments</strong> (which subjects and classes this teacher can teach in the timetable).
              {classTeacherAssignments.length > 0 ? ' The class teacher assignments shown above are managed from the ' : ' To assign a class teacher, go to the '}
              <Link to="/classes" className="text-gray-900 hover:underline">Classes section</Link>.
            </p>
          </div>
        </div>

        {/* Subject Assignments Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <BookOpen size={16} className="text-gray-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">Subject Assignments</h3>
                <p className="text-xs text-gray-500">Manage which subjects and classes this teacher can teach</p>
              </div>
            </div>
            <button
              onClick={handleOpenAddModal}
              disabled={saving || !canEdit}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Plus size={14} />
              Add Assignment
            </button>
          </div>

          <div className="p-5">
            {!canEdit && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-2 mb-4">
                <AlertCircle size={16} className="text-orange-500" />
                <span className="text-sm text-orange-700">
                  You don't have permission to edit teacher assignments. Contact an administrator for access.
                </span>
              </div>
            )}

            {assignments.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <BookOpen size={20} className="text-gray-400" />
                </div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">No Assignments Yet</h4>
                <p className="text-sm text-gray-500 mb-4">
                  This teacher hasn't been assigned any subjects or classes yet.
                </p>
                <button
                  onClick={handleOpenAddModal}
                  disabled={!canEdit}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                  <Plus size={14} />
                  Add First Assignment
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <div
                    key={assignment._id}
                    className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <BookOpen size={16} className="text-gray-500" />
                          <h4 className="text-sm font-semibold text-gray-900">
                            {assignment.subject}
                          </h4>
                        </div>

                        <div className="flex items-start gap-2">
                          <Users size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex flex-wrap gap-2">
                            {assignment.classes && assignment.classes.length > 0 ? (
                              assignment.classes.map((classObj, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-md"
                                >
                                  {getClassDisplay(classObj)}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-gray-500">No classes assigned</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveAssignment(assignment._id)}
                        disabled={saving || !canEdit}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Summary Card */}
        {(assignments.length > 0 || classTeacherAssignments.length > 0) && (
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              {classTeacherAssignments.length > 0 && (
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-500 mb-1">Class Teacher</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {classTeacherAssignments.length}
                  </p>
                  <p className="text-xs text-gray-500">{classTeacherAssignments.length === 1 ? 'class' : 'classes'}</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-xs font-medium text-gray-500 mb-1">Subject Assignments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assignments.length}
                </p>
                <p className="text-xs text-gray-500">subjects</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-500 mb-1">Total Classes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalClassesAssigned + classTeacherAssignments.length}
                </p>
                <p className="text-xs text-gray-500">teaching</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Assignment Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        size="2xl"
        classNames={{
          backdrop: "bg-black/30",
          base: "bg-white"
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <BookOpen size={16} className="text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Add Subject Assignment</h3>
                <p className="text-sm text-gray-500 font-normal">Assign subjects and classes to this teacher</p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="py-6 px-6">
            <div className="space-y-4">
              {/* Subject Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Subject <span className="text-red-500">*</span>
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
                    trigger: "border-gray-200 hover:border-gray-300",
                    value: "text-sm text-gray-900"
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
                <label className="text-sm font-medium text-gray-700">
                  Classes <span className="text-red-500">*</span>
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
                    trigger: "border-gray-200 hover:border-gray-300",
                    value: "text-sm text-gray-900"
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
                      const classObj = availableClasses.find(c => String(c._id || c.id) === String(classId));
                      return classObj ? (
                        <span
                          key={classId}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium"
                        >
                          {`${classObj.name} ${classObj.section}`}
                          <button
                            onClick={() => {
                              const newSelection = new Set(newAssignment.classIds);
                              newSelection.delete(classId);
                              setNewAssignment(prev => ({ ...prev, classIds: newSelection }));
                            }}
                            className="hover:bg-gray-200 rounded-full p-0.5 transition-colors"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Info Message */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex gap-3">
                <AlertCircle size={18} className="text-gray-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600">
                  <strong>Note:</strong> This assignment will allow the teacher to be selected when creating timetables for the selected classes and subject.
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-gray-100 px-6 py-4">
            <button
              onClick={handleCloseAddModal}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddAssignment}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Plus size={14} />
                  Add Assignment
                </>
              )}
            </button>
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
