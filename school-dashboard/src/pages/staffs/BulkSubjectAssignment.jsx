import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Button, Input, Select, SelectItem, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter
} from "@heroui/react";
import {
  Search, BookOpen, Plus, Trash2, Check, X, AlertCircle, Users, Save, ArrowLeft
} from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "../../context/AppContext";
import { usePermissions } from "../../context/PermissionContext";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useTranslation } from 'react-i18next';
import logger from '../../utils/logger';


/**
 * BulkSubjectAssignment - Page for assigning subjects and classes to teachers in bulk
 * Enables teachers to be selected when creating timetables
 */
export default function BulkSubjectAssignment() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { staff, classesWithTeachers, schoolSettings, teacherAssignmentsApi, refetch } = useApp();
  const { hasPermission } = usePermissions();

  // Permission check
  const canEdit = hasPermission('staff', 'edit');

  // Available subjects from school settings
  const availableSubjects = schoolSettings?.subjects?.map(s => typeof s === 'string' ? s : s.name) || [
    "Mathematics", "Science", "English", "Hindi", "Social Studies",
    "Computer Science", "Physical Education", "Art", "Music"
  ];

  // Pre-select staff coming from ClassSubjectManagementModal navigation (MF-26)
  const preselectedStaffId = location.state?.preselectedStaffId;

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teacherAssignments, setTeacherAssignments] = useState({});
  const [pendingChanges, setPendingChanges] = useState({});
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

  // Auto-select the staff member that navigated here from ClassSubjectManagementModal (MF-26)
  useEffect(() => {
    if (preselectedStaffId && staff.length > 0 && !selectedTeacher) {
      const found = staff.find(s => String(s.id || s._id) === String(preselectedStaffId));
      if (found) setSelectedTeacher(found);
    }
  }, [preselectedStaffId, staff, selectedTeacher]);

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

      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        if (!s.name?.toLowerCase().includes(searchLower) &&
            !s.department?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      if (departmentFilter !== 'all' && s.department !== departmentFilter) {
        return false;
      }

      return true;
    });
  }, [staff, searchQuery, departmentFilter]);

  // Load teacher assignments on mount - use staff length as stable dep
  const staffCount = staff?.length || 0;
  useEffect(() => {
    if (staffCount > 0) loadAssignments();
  }, [staffCount]);

  const loadAssignments = async () => {
    try {
      setLoading(true);

      const assignmentPromises = teachers.map(async (teacher) => {
        try {
          const data = await teacherAssignmentsApi.getAll(teacher.id || teacher._id);
          return {
            teacherId: String(teacher.id || teacher._id),
            assignments: data.assignments || []
          };
        } catch (err) {
          logger.error(`Failed to load assignments for teacher ${teacher.id}:`, err);
          return {
            teacherId: String(teacher.id || teacher._id),
            assignments: []
          };
        }
      });

      const results = await Promise.all(assignmentPromises);

      const assignmentsMap = {};
      results.forEach(r => {
        assignmentsMap[r.teacherId] = r.assignments;
      });

      setTeacherAssignments(assignmentsMap);
    } catch (error) {
      logger.error('Error loading assignments:', error);
      toast.error(t('toast.error.failedToLoadTeacherAssignments'));
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
      toast.error(t('toast.error.youDoNotHavePermissionToEditTeacherAssignments'));
      return;
    }
    setSelectedTeacher(teacher);
    setNewAssignment({ subject: "", classIds: new Set() });
    setIsAssignModalOpen(true);
  }, [canEdit]);

  // Handle adding assignment
  const handleAddAssignment = useCallback(() => {
    if (!selectedTeacher || !newAssignment.subject || newAssignment.classIds.size === 0) {
      toast.error(t('toast.error.pleaseSelectSubjectAndAtLeastOneClass'));
      return;
    }

    const teacherId = String(selectedTeacher.id || selectedTeacher._id);
    const subject = newAssignment.subject;
    const classIds = Array.from(newAssignment.classIds);

    setPendingChanges(prev => {
      const teacherChanges = prev[teacherId] || { added: [], removed: [] };

      const alreadyPending = teacherChanges.added.some(a => a.subject === subject);
      if (alreadyPending) {
        toast.error(t('toast.error.thisSubjectIsAlreadyPendingToBeAdded'));
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
  }, [selectedTeacher, newAssignment, classesWithTeachers]);

  // Handle removing assignment
  const handleRemoveAssignment = useCallback((teacherId, assignmentId, subject) => {
    if (!canEdit) {
      toast.error(t('toast.error.youDoNotHavePermissionToEditTeacherAssignments'));
      return;
    }

    const id = String(teacherId);

    setPendingChanges(prev => {
      const teacherChanges = prev[id] || { added: [], removed: [] };

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
      toast.error(t('toast.error.noPendingChangesToSave'));
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

          Object.entries(pendingChanges).forEach(([teacherId, changes]) => {
            changes.added.forEach(assignment => {
              promises.push(
                teacherAssignmentsApi.create({
                  teacherId,
                  subject: assignment.subject,
                  classIds: assignment.classIds
                })
              );
            });

            changes.removed.forEach(removal => {
              if (removal.assignmentId) {
                promises.push(
                  teacherAssignmentsApi.delete(removal.assignmentId, teacherId)
                );
              }
            });
          });

          const results = await Promise.allSettled(promises);

          const failures = results.filter(r => r.status === 'rejected');
          if (failures.length > 0) {
            logger.error('Some operations failed:', failures);
            toast.error(`${failures.length} operation(s) failed`);
          }

          const successCount = results.filter(r => r.status === 'fulfilled').length;
          if (successCount > 0) {
            toast.success(`${successCount} change(s) saved successfully`);
          }

          setPendingChanges({});
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));

          await loadAssignments();

          if (refetch) await refetch();
        } catch (error) {
          logger.error('Error saving changes:', error);
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
    toast.success(t('toast.success.allPendingChangesCleared'));
  }, []);

  // Get effective assignments (current + pending)
  const getEffectiveAssignments = useCallback((teacherId) => {
    const id = String(teacherId);
    const current = [...(teacherAssignments[id] || [])];
    const changes = pendingChanges[id] || { added: [], removed: [] };

    const removedSubjects = new Set(changes.removed.map(r => r.subject));
    const filtered = current.filter(a => !removedSubjects.has(a.subject));

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
    <div className="w-full flex-1 bg-gray-50 p-6 min-h-screen">
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/staffs')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2"
        >
          <ArrowLeft size={16} />
          <span>{t('pages.backToStaff')}</span>
        </button>

        <div className="bg-white rounded-lg border border-gray-100 p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                <BookOpen size={24} className="text-gray-600" />
              </div>

              {/* Info */}
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{t('pages.bulkSubjectAssignment')}</h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span>{teachers.length} Teachers</span>
                  <span className="text-gray-300">|</span>
                  <span>{availableSubjects.length} Subjects</span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                  <Users size={12} />
                  <span>{t('pages.assignSubjectsAndClassesToTeachersInBulk')}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => navigate('/staffs')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                Add Staff
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          CONTENT AREA
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        {/* Info Banner */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle size={16} className="text-gray-600" />
            </div>
            <p className="text-sm text-gray-600">
              <strong>{t('pages.note1')}</strong> Subject assignments determine which teachers can be selected when creating timetables for specific subjects and classes.
              This is separate from "Class Teacher" assignment.
            </p>
          </div>
        </div>

        {/* Pending Changes Bar */}
        {totalPendingChanges > 0 && (
          <div className="bg-white rounded-lg border border-gray-300 p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Save size={16} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {totalPendingChanges} Pending Change(s)
                  </p>
                  <p className="text-xs text-gray-500">
                    Changes will not be saved until you click "Save All"
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleClearAll}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Clear All
                </button>
                <button
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      Save All
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('pages.searchTeachers')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
              />
            </div>
            <Select
              placeholder={t('pages.filterByDepartment')}
              selectedKeys={departmentFilter !== 'all' ? [departmentFilter] : []}
              onSelectionChange={(keys) => setDepartmentFilter(Array.from(keys)[0] || 'all')}
              variant="bordered"
              size="sm"
              className="w-full sm:w-48"
              classNames={{
                trigger: "border-gray-200 hover:border-gray-300"
              }}
            >
              <SelectItem key="all">{t('pages.allDepartments')}</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept}>{dept}</SelectItem>
              ))}
            </Select>
          </div>
        </div>

        {/* Teachers List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
            <div className="col-span-3">{t('pages.teacher2')}</div>
            <div className="col-span-2">{t('pages.department1')}</div>
            <div className="col-span-5">{t('pages.subjectAssignments')}</div>
            <div className="col-span-2 text-right">{t('pages.actions1')}</div>
          </div>

          {loading ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 items-center px-4 py-3">
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-700 animate-pulse" />
                    <div className="h-4 w-24 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
                  </div>
                  <div className="col-span-2"><div className="h-4 w-16 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" /></div>
                  <div className="col-span-5 flex gap-2">
                    <div className="h-6 w-16 bg-gray-200 dark:bg-zinc-700 rounded-full animate-pulse" />
                    <div className="h-6 w-20 bg-gray-200 dark:bg-zinc-700 rounded-full animate-pulse" />
                  </div>
                  <div className="col-span-2"><div className="h-8 w-20 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse ml-auto" /></div>
                </div>
              ))}
            </div>
          ) : teachers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Users size={20} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">{t('pages.noTeachersFound')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {teachers.map(teacher => {
                const teacherId = String(teacher.id || teacher._id);
                const assignments = getEffectiveAssignments(teacherId);
                const changes = getPendingChanges(teacherId);
                const hasChanges = hasPendingChanges(teacherId);

                return (
                  <div key={teacherId} className="grid grid-cols-12 gap-4 px-5 py-4 items-start hover:bg-gray-50/50">
                    {/* Teacher Info */}
                    <div className="col-span-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {teacher.picture ? (
                            <img src={teacher.picture} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                          ) : (
                            <span className="text-sm font-medium text-gray-600">
                              {teacher.name?.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{teacher.name}</p>
                          {hasChanges && (
                            <span className="text-xs text-gray-500">{t('pages.pendingChanges')}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Department */}
                    <div className="col-span-2">
                      <span className="text-sm text-gray-600">
                        {teacher.department || '—'}
                      </span>
                    </div>

                    {/* Subject Assignments */}
                    <div className="col-span-5">
                      <div className="space-y-2">
                        {assignments.length === 0 ? (
                          <p className="text-sm text-gray-400 italic">{t('pages.noSubjectsAssigned1')}</p>
                        ) : (
                          assignments.map((assignment) => {
                            const isPendingAdd = changes.added.some(a => a.subject === assignment.subject);
                            const isPendingRemove = changes.removed.some(r => r.subject === assignment.subject);

                            if (isPendingRemove) {
                              return (
                                <div key={assignment.subject} className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200">
                                  <span className="text-sm text-red-600 line-through flex-1">
                                    {assignment.subject}
                                  </span>
                                  <button
                                    onClick={() => handleUndoRemoval(teacherId, assignment.subject)}
                                    className="text-xs text-gray-600 hover:text-gray-900 font-medium"
                                  >
                                    Undo
                                  </button>
                                </div>
                              );
                            }

                            return (
                              <div key={assignment.subject} className={`p-3 rounded-lg border ${
                                isPendingAdd ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <BookOpen size={14} className="text-gray-500" />
                                    <span className="text-sm font-medium text-gray-900">{assignment.subject}</span>
                                    {isPendingAdd && (
                                      <span className="text-xs text-green-600 font-medium">{t('pages.new')}</span>
                                    )}
                                  </div>
                                  {canEdit && (
                                    <button
                                      onClick={() => handleRemoveAssignment(
                                        teacherId,
                                        assignment._id || assignment.id,
                                        assignment.subject
                                      )}
                                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                    >
                                      <X size={14} />
                                    </button>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {assignment.classes?.map((cls, idx) => (
                                    <span
                                      key={cls._id || cls.id || `class-${idx}`}
                                      className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded"
                                    >
                                      {getClassDisplay(cls)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 text-right">
                      <button
                        onClick={() => handleOpenAssignModal(teacher)}
                        disabled={!canEdit}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                      >
                        <Plus size={14} />
                        Add Subject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Assignment Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
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
                <h3 className="text-lg font-semibold text-gray-900">{t('pages.addSubjectAssignment')}</h3>
                <p className="text-sm text-gray-500 font-normal">For: {selectedTeacher?.name}</p>
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
                  placeholder={t('pages.selectASubject')}
                  selectedKeys={newAssignment.subject ? new Set([newAssignment.subject]) : new Set()}
                  onSelectionChange={(keys) => {
                    setNewAssignment(prev => ({ ...prev, subject: Array.from(keys)[0] || "" }));
                  }}
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
                  placeholder={t('pages.chooseOneOrMoreClasses')}
                  selectionMode="multiple"
                  selectedKeys={newAssignment.classIds}
                  onSelectionChange={(keys) => {
                    setNewAssignment(prev => ({ ...prev, classIds: keys }));
                  }}
                  variant="bordered"
                  radius="lg"
                  size="md"
                  classNames={{
                    trigger: "border-gray-200 hover:border-gray-300",
                    value: "text-sm text-gray-900"
                  }}
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
                      const cls = classesWithTeachers.find(c => String(c.id) === String(classId));
                      return cls ? (
                        <span
                          key={classId}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium"
                        >
                          {`${cls.name}-${cls.section}`}
                          <button
                            onClick={() => {
                              const newSelection = new Set(newAssignment.classIds);
                              newSelection.delete(classId);
                              setNewAssignment(prev => ({ ...prev, classIds: newSelection }));
                            }}
                            className="hover:bg-gray-200 rounded-full p-0.5 transition-colors"
                          >
                            <X size={12} className="text-gray-500" />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex gap-3">
                <AlertCircle size={18} className="text-gray-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600">
                  This assignment will allow {selectedTeacher?.name} to be selected when creating timetables
                  for the chosen classes and subject.
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-gray-100 px-6 py-4">
            <button
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddAssignment}
              disabled={!newAssignment.subject || newAssignment.classIds.size === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Plus size={14} />
              Add to Pending
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
        confirmText="Confirm"
        cancelText="Cancel"
        variant={confirmDialog.variant}
        isLoading={saving}
      />
    </div>
  );
}
