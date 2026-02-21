import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card, CardBody, Button, Input, Select, SelectItem, Chip, Spinner, Badge,
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Checkbox
} from "@heroui/react";
import {
  Search, BookOpen, Plus, Trash2, Check, X, AlertCircle, Users, Save
} from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "../../context/AppContext";
import { usePermissions } from "../../context/PermissionContext";
import { MinimalButton } from "../../components/ui";
import ConfirmDialog from "../../components/ConfirmDialog";

/**
 * BulkSubjectAssignment - Page for assigning subjects and classes to teachers in bulk
 * Enables teachers to be selected when creating timetables
 */
export default function BulkSubjectAssignment() {
  const navigate = useNavigate();
  const { staff, classesWithTeachers, schoolSettings, teacherAssignmentsApi, refetch } = useApp();
  const { hasPermission } = usePermissions();

  // Permission check
  const canEdit = hasPermission('staff', 'edit');

  // Available subjects from school settings
  const availableSubjects = schoolSettings?.subjects?.map(s => typeof s === 'string' ? s : s.name) || [
    "Mathematics", "Science", "English", "Hindi", "Social Studies",
    "Computer Science", "Physical Education", "Art", "Music"
  ];

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teacherAssignments, setTeacherAssignments] = useState({}); // { teacherId: [{ subject, classes }] }
  const [pendingChanges, setPendingChanges] = useState({}); // { teacherId: { added: [], removed: [] } }
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    subject: "",
    classIds: new Set()
  });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    variant: "default"
  });

  // Extract unique departments from staff
  const departments = useMemo(() => {
    const depts = new Set();
    staff.forEach(s => {
      if (s.department) depts.add(s.department);
    });
    return Array.from(depts).sort();
  }, [staff]);

  // Filter teachers (staff with Teacher role)
  const teachers = useMemo(() => {
    return staff.filter(s => {
      const roles = Array.isArray(s.role) ? s.role : [s.role];
      const staffTypes = Array.isArray(s.staffType) ? s.staffType : [s.staffType];
      const isTeacher = roles.includes('Teacher') || staffTypes.includes('Teacher') || s.isClassTeacher;
      if (!isTeacher) return false;

      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        if (!s.name?.toLowerCase().includes(searchLower) &&
            !s.department?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Department filter
      if (departmentFilter !== 'all' && s.department !== departmentFilter) {
        return false;
      }

      return true;
    });
  }, [staff, searchQuery, departmentFilter]);

  // Load teacher assignments on mount
  useEffect(() => {
    loadAssignments();
  }, [staff]);

  const loadAssignments = async () => {
    try {
      setLoading(true);

      // Load assignments for all teachers
      const assignmentPromises = teachers.map(async (teacher) => {
        try {
          const data = await teacherAssignmentsApi.getAll(teacher.id || teacher._id);
          return {
            teacherId: String(teacher.id || teacher._id),
            assignments: data.assignments || []
          };
        } catch (err) {
          console.error(`Failed to load assignments for teacher ${teacher.id}:`, err);
          return {
            teacherId: String(teacher.id || teacher._id),
            assignments: []
          };
        }
      });

      const results = await Promise.all(assignmentPromises);

      // Convert to object
      const assignmentsMap = {};
      results.forEach(r => {
        assignmentsMap[r.teacherId] = r.assignments;
      });

      setTeacherAssignments(assignmentsMap);
    } catch (error) {
      console.error('Error loading assignments:', error);
      toast.error('Failed to load teacher assignments');
    } finally {
      setLoading(false);
    }
  };

  // Get assignments for a teacher
  const getTeacherAssignments = useCallback((teacherId) => {
    const id = String(teacherId);
    return teacherAssignments[id] || [];
  }, [teacherAssignments]);

  // Get pending changes for a teacher
  const getPendingChanges = useCallback((teacherId) => {
    const id = String(teacherId);
    return pendingChanges[id] || { added: [], removed: [] };
  }, [pendingChanges]);

  // Check if teacher has pending changes
  const hasPendingChanges = useCallback((teacherId) => {
    const changes = getPendingChanges(teacherId);
    return changes.added.length > 0 || changes.removed.length > 0;
  }, [getPendingChanges]);

  // Count total pending changes
  const totalPendingChanges = useMemo(() => {
    let count = 0;
    Object.values(pendingChanges).forEach(changes => {
      count += changes.added.length + changes.removed.length;
    });
    return count;
  }, [pendingChanges]);

  // Handle opening assignment modal
  const handleOpenAssignModal = useCallback((teacher) => {
    if (!canEdit) {
      toast.error('You do not have permission to edit teacher assignments');
      return;
    }
    setSelectedTeacher(teacher);
    setNewAssignment({ subject: "", classIds: new Set() });
    setIsAssignModalOpen(true);
  }, [canEdit]);

  // Handle adding assignment
  const handleAddAssignment = useCallback(() => {
    if (!selectedTeacher || !newAssignment.subject || newAssignment.classIds.size === 0) {
      toast.error('Please select subject and at least one class');
      return;
    }

    const teacherId = String(selectedTeacher.id || selectedTeacher._id);
    const subject = newAssignment.subject;
    const classIds = Array.from(newAssignment.classIds);

    // Check if this subject already has an assignment with overlapping classes
    const currentAssignments = getTeacherAssignments(teacherId);
    const existingSubject = currentAssignments.find(a => a.subject === subject);

    // Add to pending changes
    setPendingChanges(prev => {
      const teacherChanges = prev[teacherId] || { added: [], removed: [] };

      // Check if already pending to add
      const alreadyPending = teacherChanges.added.some(a => a.subject === subject);
      if (alreadyPending) {
        toast.error('This subject is already pending to be added');
        return prev;
      }

      return {
        ...prev,
        [teacherId]: {
          ...teacherChanges,
          added: [...teacherChanges.added, {
            subject,
            classIds,
            classes: classIds.map(id => {
              const cls = classesWithTeachers.find(c => c.id === id);
              return cls ? { id: cls.id, name: cls.name, section: cls.section } : { id };
            })
          }]
        }
      };
    });

    setIsAssignModalOpen(false);
    setNewAssignment({ subject: "", classIds: new Set() });
    toast.success(`Added ${subject} to pending changes`);
  }, [selectedTeacher, newAssignment, getTeacherAssignments, classesWithTeachers]);

  // Handle removing assignment
  const handleRemoveAssignment = useCallback((teacherId, assignmentId, subject) => {
    if (!canEdit) {
      toast.error('You do not have permission to edit teacher assignments');
      return;
    }

    const id = String(teacherId);

    setPendingChanges(prev => {
      const teacherChanges = prev[id] || { added: [], removed: [] };

      // Check if it's a pending addition - just remove from added
      const pendingAddIndex = teacherChanges.added.findIndex(a => a.subject === subject);
      if (pendingAddIndex >= 0) {
        const newAdded = [...teacherChanges.added];
        newAdded.splice(pendingAddIndex, 1);

        return {
          ...prev,
          [id]: {
            ...teacherChanges,
            added: newAdded
          }
        };
      }

      // Otherwise add to removed
      return {
        ...prev,
        [id]: {
          ...teacherChanges,
          removed: [...teacherChanges.removed, { assignmentId, subject }]
        }
      };
    });

    toast.success(`Marked ${subject} for removal`);
  }, [canEdit]);

  // Handle undoing a removal
  const handleUndoRemoval = useCallback((teacherId, subject) => {
    const id = String(teacherId);

    setPendingChanges(prev => {
      const teacherChanges = prev[id] || { added: [], removed: [] };
      const newRemoved = teacherChanges.removed.filter(r => r.subject !== subject);

      return {
        ...prev,
        [id]: {
          ...teacherChanges,
          removed: newRemoved
        }
      };
    });
  }, []);

  // Handle saving all pending changes
  const handleSaveAll = useCallback(async () => {
    if (totalPendingChanges === 0) {
      toast.error('No pending changes to save');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Save All Changes",
      message: `Save ${totalPendingChanges} pending change(s)? This will add/remove assignments for all modified teachers.`,
      onConfirm: async () => {
        try {
          setSaving(true);

          const promises = [];

          // Process each teacher's changes
          Object.entries(pendingChanges).forEach(([teacherId, changes]) => {
            // Add new assignments
            changes.added.forEach(assignment => {
              promises.push(
                teacherAssignmentsApi.create({
                  teacherId,
                  subject: assignment.subject,
                  classIds: assignment.classIds
                })
              );
            });

            // Remove assignments
            changes.removed.forEach(removal => {
              if (removal.assignmentId) {
                promises.push(
                  teacherAssignmentsApi.delete(removal.assignmentId, teacherId)
                );
              }
            });
          });

          const results = await Promise.allSettled(promises);

          // Check for failures
          const failures = results.filter(r => r.status === 'rejected');
          if (failures.length > 0) {
            console.error('Some operations failed:', failures);
            toast.error(`${failures.length} operation(s) failed`);
          }

          const successCount = results.filter(r => r.status === 'fulfilled').length;
          if (successCount > 0) {
            toast.success(`${successCount} change(s) saved successfully`);
          }

          // Clear pending and reload
          setPendingChanges({});
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));

          // Reload assignments
          await loadAssignments();

          // Refetch data
          if (refetch) await refetch();
        } catch (error) {
          console.error('Error saving changes:', error);
          toast.error(error.message || 'Failed to save changes');
        } finally {
          setSaving(false);
        }
      },
      variant: "default"
    });
  }, [pendingChanges, totalPendingChanges, teacherAssignmentsApi, refetch]);

  // Handle clearing all pending changes
  const handleClearAll = useCallback(() => {
    setPendingChanges({});
    toast.success('All pending changes cleared');
  }, []);

  // Get effective assignments (current + pending)
  const getEffectiveAssignments = useCallback((teacherId) => {
    const id = String(teacherId);
    const current = [...(teacherAssignments[id] || [])];
    const changes = pendingChanges[id] || { added: [], removed: [] };

    // Remove assignments marked for removal
    const removedSubjects = new Set(changes.removed.map(r => r.subject));
    const filtered = current.filter(a => !removedSubjects.has(a.subject));

    // Add pending additions
    const combined = [...filtered, ...changes.added];

    return combined;
  }, [teacherAssignments, pendingChanges]);

  // Get class display name
  const getClassDisplay = useCallback((classObj) => {
    if (typeof classObj === 'string') {
      const found = classesWithTeachers.find(c => c._id === classObj || c.id === classObj);
      return found ? `${found.name}-${found.section}` : classObj;
    }
    if (classObj.name && classObj.section) {
      return `${classObj.name}-${classObj.section}`;
    }
    return String(classObj.id || classObj);
  }, [classesWithTeachers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Bulk Subject Assignment</h1>
          <p className="text-sm text-gray-500 mt-1">
            Assign subjects and classes to teachers. Teachers can then be selected when creating timetables.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MinimalButton onClick={() => navigate("/staffs")}>
            Back to Staff
          </MinimalButton>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Subject assignments determine which teachers can be selected when creating timetables for specific subjects and classes.
            This is separate from "Class Teacher" assignment.
          </p>
        </div>
      </div>

      {/* Pending Changes Bar */}
      {totalPendingChanges > 0 && (
        <Card className="bg-primary-50 border border-primary-200">
          <CardBody className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Save size={18} className="text-primary-600" />
                <div>
                  <p className="font-medium text-primary-800">
                    {totalPendingChanges} Pending Change(s)
                  </p>
                  <p className="text-xs text-primary-600">
                    Changes will not be saved until you click "Save All"
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="light"
                  onPress={handleClearAll}
                  isDisabled={saving}
                >
                  Clear All
                </Button>
                <Button
                  size="sm"
                  color="primary"
                  onPress={handleSaveAll}
                  isLoading={saving}
                  startContent={!saving && <Check size={16} />}
                >
                  Save All
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search teachers..."
          value={searchQuery}
          onValueChange={setSearchQuery}
          startContent={<Search size={16} className="text-gray-400" />}
          isClearable
          onClear={() => setSearchQuery("")}
          variant="bordered"
          size="sm"
          className="flex-1"
        />
        <Select
          placeholder="Filter by department"
          selectedKeys={departmentFilter !== 'all' ? [departmentFilter] : []}
          onSelectionChange={(keys) => setDepartmentFilter(Array.from(keys)[0] || 'all')}
          variant="bordered"
          size="sm"
          className="w-full sm:w-48"
        >
          <SelectItem key="all">All Departments</SelectItem>
          {departments.map(dept => (
            <SelectItem key={dept}>{dept}</SelectItem>
          ))}
        </Select>
      </div>

      {/* Teachers Table */}
      <Card className="shadow-sm border border-gray-200">
        <CardBody className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
              <p className="text-gray-500 ml-3">Loading assignments...</p>
            </div>
          ) : (
            <Table
              removeWrapper
              aria-label="Teacher subject assignments"
              classNames={{
                th: "bg-gray-50 text-gray-600 font-medium",
                td: "py-3"
              }}
            >
              <TableHeader>
                <TableColumn>TEACHER</TableColumn>
                <TableColumn>DEPARTMENT</TableColumn>
                <TableColumn>SUBJECT ASSIGNMENTS</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody emptyContent="No teachers found">
                {teachers.map(teacher => {
                  const teacherId = String(teacher.id || teacher._id);
                  const assignments = getEffectiveAssignments(teacherId);
                  const changes = getPendingChanges(teacherId);
                  const hasChanges = hasPendingChanges(teacherId);

                  return (
                    <TableRow key={teacherId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            {teacher.picture ? (
                              <img src={teacher.picture} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-medium text-gray-600">
                                {teacher.name?.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{teacher.name}</p>
                            {hasChanges && (
                              <Badge color="primary" variant="flat" size="sm">
                                Pending
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {teacher.department || 'No department'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {assignments.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">No subjects assigned</p>
                          ) : (
                            assignments.map((assignment, index) => {
                              const isPendingAdd = changes.added.some(a => a.subject === assignment.subject);
                              const isPendingRemove = changes.removed.some(r => r.subject === assignment.subject);

                              if (isPendingRemove) {
                                return (
                                  <div key={index} className="flex items-center gap-2 p-2 rounded bg-red-50 border border-red-200">
                                    <span className="text-sm text-red-600 line-through flex-1">
                                      {assignment.subject}
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="light"
                                      color="primary"
                                      onPress={() => handleUndoRemoval(teacherId, assignment.subject)}
                                    >
                                      Undo
                                    </Button>
                                  </div>
                                );
                              }

                              return (
                                <div key={index} className={`p-2 rounded border ${
                                  isPendingAdd ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <BookOpen size={14} className="text-gray-500" />
                                      <span className="font-medium text-sm">{assignment.subject}</span>
                                      {isPendingAdd && (
                                        <Badge color="success" variant="flat" size="sm">
                                          New
                                        </Badge>
                                      )}
                                    </div>
                                    {canEdit && (
                                      <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        color="danger"
                                        onPress={() => handleRemoveAssignment(
                                          teacherId,
                                          assignment._id || assignment.id,
                                          assignment.subject
                                        )}
                                      >
                                        <X size={14} />
                                      </Button>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {assignment.classes?.map((cls, idx) => (
                                      <Chip
                                        key={idx}
                                        size="sm"
                                        variant="flat"
                                        color="secondary"
                                      >
                                        {getClassDisplay(cls)}
                                      </Chip>
                                    ))}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          color="primary"
                          variant="flat"
                          startContent={<Plus size={14} />}
                          onPress={() => handleOpenAssignModal(teacher)}
                          isDisabled={!canEdit}
                        >
                          Add Subject
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Add Assignment Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        size="2xl"
        classNames={{
          backdrop: "bg-black/50",
          base: "bg-white"
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Add Subject Assignment</h3>
            <p className="text-sm text-gray-500 font-normal">
              For: {selectedTeacher?.name}
            </p>
          </ModalHeader>
          <ModalBody className="py-6">
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
                    setNewAssignment(prev => ({ ...prev, subject: Array.from(keys)[0] || "" }));
                  }}
                  variant="bordered"
                  radius="lg"
                  size="md"
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
                  placeholder="Choose one or more classes"
                  selectionMode="multiple"
                  selectedKeys={newAssignment.classIds}
                  onSelectionChange={(keys) => {
                    setNewAssignment(prev => ({ ...prev, classIds: keys }));
                  }}
                  variant="bordered"
                  radius="lg"
                  size="md"
                >
                  {classesWithTeachers.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {`${cls.name}-${cls.section}`}
                    </SelectItem>
                  ))}
                </Select>

                {newAssignment.classIds.size > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {Array.from(newAssignment.classIds).map((classId) => {
                      // FIXED: Use String() comparison for ObjectId matching
                      const cls = classesWithTeachers.find(c => String(c.id) === String(classId));
                      return cls ? (
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
                          {`${cls.name}-${cls.section}`}
                        </Chip>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <AlertCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  This assignment will allow {selectedTeacher?.name} to be selected when creating timetables
                  for the chosen classes and subject.
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-gray-200">
            <Button
              variant="light"
              onPress={() => setIsAssignModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleAddAssignment}
              isDisabled={!newAssignment.subject || newAssignment.classIds.size === 0}
              startContent={<Plus size={16} />}
            >
              Add to Pending
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
        confirmText="Confirm"
        cancelText="Cancel"
        variant={confirmDialog.variant}
        isLoading={saving}
      />
    </div>
  );
}
