import { useState, useEffect, useMemo } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure,
  Select, SelectItem,
} from "@heroui/react";
import { BookOpen, Plus, Trash2, Users, AlertCircle, GraduationCap, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { usePermissions } from "../../context/PermissionContext";
import ConfirmDialog from "../../components/ConfirmDialog";
import { showErrorToast, executeWithFeedback } from "../../utils/errorHandling";
import logger from "../../utils/logger";

export default function StaffAssignmentPanel({ staffId, onAssignClassTeacher }) {
  const {
    teacherAssignmentsApi, classesApi, schoolSettings,
    classesWithTeachers, getStaffById,
  } = useApp();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ subject: "", classIds: new Set() });
  const [errors, setErrors] = useState({});
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [classToRemove, setClassToRemove] = useState(null);
  const { isOpen: isConfirmDeleteOpen, onOpen: onConfirmDeleteOpen, onClose: onConfirmDeleteClose } = useDisclosure();
  const { isOpen: isConfirmRemoveClassOpen, onOpen: onConfirmRemoveClassOpen, onClose: onConfirmRemoveClassClose } = useDisclosure();

  const staff = getStaffById(staffId);

  const classTeacherAssignments = useMemo(() => {
    if (!staff || !classesWithTeachers) return [];
    return classesWithTeachers.filter((cls) => {
      if (!cls.classTeacherId) return false;
      const staffId = staff._id || staff.id;
      return staffId && String(cls.classTeacherId) === String(staffId);
    });
  }, [staff, classesWithTeachers]);

  const canEdit = hasPermission("staff", "edit");

  const availableSubjects =
    schoolSettings?.subjects?.map((s) => (typeof s === "string" ? s : s.name)) || [
      "Mathematics", "Science", "English", "Hindi", "Social Studies",
      "Computer Science", "Physical Education", "Art", "Music",
    ];

  useEffect(() => {
    if (staffId) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignmentsData, classesData] = await Promise.all([
        teacherAssignmentsApi.getAll(staffId),
        classesApi.getAll(),
      ]);
      setAssignments(assignmentsData.assignments || []);
      setAvailableClasses(classesData || []);
    } catch (error) {
      logger.error("Error loading data:", error);
      showErrorToast(error, "Failed to load teacher assignments");
    } finally {
      setLoading(false);
    }
  };

  const validateAssignment = () => {
    const newErrors = {};
    if (!newAssignment.subject) newErrors.subject = "Please select a subject";
    if (newAssignment.classIds.size === 0) newErrors.classes = "Please select at least one class";
    const existing = assignments.find((a) => a.subject === newAssignment.subject);
    if (existing) {
      const selectedIds = Array.from(newAssignment.classIds);
      const existingIds = existing.classes.map((c) => c._id || c);
      if (selectedIds.some((id) => existingIds.includes(id))) {
        newErrors.classes = "Some selected classes are already assigned to this subject";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddAssignment = async () => {
    if (!validateAssignment()) return;
    await executeWithFeedback(
      async () => {
        setSaving(true);
        const classIds = Array.from(newAssignment.classIds);
        await teacherAssignmentsApi.create({
          teacherId: staffId,
          subject: newAssignment.subject,
          classIds,
        });
        setNewAssignment({ subject: "", classIds: new Set() });
        setIsAddModalOpen(false);
        setErrors({});
        await loadData();
      },
      {
        loadingMessage: "Adding assignment...",
        successMessage: "Assignment added successfully!",
        errorMessage: null,
        onSuccess: () => setSaving(false),
        onError: () => setSaving(false),
      }
    );
  };

  const handleRemoveClass = (assignment, classObj) => {
    const classId = typeof classObj === "string" ? classObj : classObj._id;
    setClassToRemove({
      assignmentId: assignment._id,
      classId,
      subject: assignment.subject,
      className: getClassDisplay(classObj),
      isLastClass: assignment.classes.length === 1,
    });
    onConfirmRemoveClassOpen();
  };

  const confirmRemoveClass = async () => {
    if (!classToRemove) return;
    const { assignmentId, classId, isLastClass } = classToRemove;
    await executeWithFeedback(
      async () => {
        setSaving(true);
        if (isLastClass) {
          await teacherAssignmentsApi.delete(assignmentId, staffId);
        } else {
          const assignment = assignments.find((a) => a._id === assignmentId);
          const remainingClassIds = assignment.classes
            .map((c) => (typeof c === "string" ? c : c._id))
            .filter((id) => id !== classId);
          await teacherAssignmentsApi.update(assignmentId, {
            teacherId: staffId,
            subject: assignment.subject,
            classIds: remainingClassIds,
          });
        }
        await loadData();
      },
      {
        loadingMessage: "Removing class assignment...",
        successMessage: "Class removed from assignment!",
        errorMessage: null,
        onSuccess: () => {
          setSaving(false);
          setClassToRemove(null);
          onConfirmRemoveClassClose();
        },
        onError: () => {
          setSaving(false);
          setClassToRemove(null);
          onConfirmRemoveClassClose();
        },
      }
    );
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
        loadingMessage: "Removing assignment...",
        successMessage: "Assignment removed successfully!",
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
        },
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
    if (typeof classObj === "string") {
      const found = availableClasses.find((c) => c._id === classObj || c.id === classObj);
      return found ? `${found.name} ${found.section}` : classObj;
    }
    return `${classObj.name} ${classObj.section}`;
  };

  const totalClassesAssigned = assignments.reduce(
    (sum, a) => sum + (a.classes?.length || 0),
    0
  );

  if (loading) {
    return (
      <div className="col" style={{ gap: 12, paddingTop: 8 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={`staff-assign-skeleton-${i}`} className="card">
            <div className="card__head">
              <div style={{ width: 24, height: 24, background: "var(--surface-2)", borderRadius: 6 }} />
              <div className="col" style={{ gap: 6 }}>
                <div style={{ height: 12, width: 120, background: "var(--surface-2)", borderRadius: 4 }} />
                <div style={{ height: 10, width: 180, background: "var(--surface-2)", borderRadius: 4 }} />
              </div>
            </div>
            <div className="card__body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ height: 32, background: "var(--surface-2)", borderRadius: 6 }} />
              <div style={{ height: 32, background: "var(--surface-2)", borderRadius: 6 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="col" style={{ gap: 12 }}>
        {/* Class teacher section */}
        <div className="assignsec">
          <div className="assignsec__head">
            <div className="assignsec__title">
              <span className="assignsec__icon"><GraduationCap size={14} /></span>
              <div>
                <div className="card__title">Class teacher assignment</div>
                <div className="subtle" style={{ fontSize: 12 }}>
                  {classTeacherAssignments.length > 0
                    ? "Homeroom class assignment for this staff member."
                    : "Not currently assigned to any class."}
                </div>
              </div>
            </div>
            {onAssignClassTeacher && canEdit && (
              <button type="button" className="btn btn--sm" onClick={onAssignClassTeacher}>
                {classTeacherAssignments.length > 0 ? "Change class" : "Assign class"}
              </button>
            )}
          </div>
          <div className="assignsec__body">
            {classTeacherAssignments.length > 0 ? (
              <div className="col" style={{ gap: 6 }}>
                {classTeacherAssignments.map((cls) => (
                  <button
                    key={cls.id || cls._id}
                    type="button"
                    className="subjrow"
                    style={{ cursor: "pointer", textAlign: "left" }}
                    onClick={() => navigate(`/classes/${cls.id || cls._id}`)}
                  >
                    <div className="col" style={{ gap: 2 }}>
                      <span className="subjrow__name">
                        {cls.name} - {cls.section}
                      </span>
                      <span className="subtle" style={{ fontSize: 12 }}>
                        {cls.studentCount || cls.strength || 0} students
                      </span>
                    </div>
                    <span className="chip">Class teacher</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="assign-empty">
                <div className="assign-empty__icon"><GraduationCap size={16} /></div>
                <div className="assign-empty__title">No class assigned yet</div>
                <div className="assign-empty__sub">
                  This staff member isn't a class teacher for any class.
                </div>
                {onAssignClassTeacher ? (
                  <button
                    type="button"
                    onClick={onAssignClassTeacher}
                    disabled={!canEdit}
                    className="btn btn--sm"
                    style={{ marginTop: 8 }}
                  >
                    Assign as class teacher
                  </button>
                ) : (
                  <Link to="/classes" className="btn btn--sm" style={{ marginTop: 8, textDecoration: "none" }}>
                    Assign a class
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Info banner */}
        <div className="staff-banner">
          <div className="staff-banner__icon"><AlertCircle size={14} /></div>
          <div>
            <div className="staff-banner__title">Note</div>
            <div className="staff-banner__body">
              Subject assignments below control which subjects and classes this teacher can teach
              in the timetable. Class teacher assignment (above) is a separate homeroom role.
            </div>
          </div>
        </div>

        {/* Subject assignments */}
        <div className="assignsec">
          <div className="assignsec__head">
            <div className="assignsec__title">
              <span className="assignsec__icon"><BookOpen size={14} /></span>
              <div>
                <div className="card__title">Subject assignments</div>
                <div className="subtle" style={{ fontSize: 12 }}>
                  Manage which subjects and classes this teacher can teach.
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn btn--accent btn--sm"
              onClick={handleOpenAddModal}
              disabled={saving || !canEdit}
            >
              <Plus size={12} /> Add assignment
            </button>
          </div>
          <div className="assignsec__body">
            {!canEdit && (
              <div className="staff-banner staff-banner--warn" style={{ marginBottom: 12 }}>
                <div className="staff-banner__icon"><AlertCircle size={14} /></div>
                <div className="staff-banner__body">
                  You don't have permission to edit teacher assignments. Contact an administrator for access.
                </div>
              </div>
            )}

            {assignments.length === 0 ? (
              <div className="assign-empty">
                <div className="assign-empty__icon"><BookOpen size={16} /></div>
                <div className="assign-empty__title">No assignments yet</div>
                <div className="assign-empty__sub">
                  This teacher hasn't been assigned any subjects or classes yet.
                </div>
                <button
                  type="button"
                  className="btn btn--accent btn--sm"
                  style={{ marginTop: 8 }}
                  onClick={handleOpenAddModal}
                  disabled={!canEdit}
                >
                  <Plus size={12} /> Add first assignment
                </button>
              </div>
            ) : (
              <div className="col" style={{ gap: 6 }}>
                {assignments.map((assignment) => (
                  <div key={assignment._id} className="subjrow">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="row" style={{ alignItems: "center", gap: 6 }}>
                        <BookOpen size={13} className="text-fg-muted" />
                        <span className="subjrow__name">{assignment.subject}</span>
                      </div>
                      <div className="row" style={{ alignItems: "flex-start", gap: 6, marginTop: 6 }}>
                        <Users size={11} className="text-fg-faint" style={{ marginTop: 4 }} />
                        <div className="subjrow__classes">
                          {assignment.classes && assignment.classes.length > 0 ? (
                            assignment.classes.map((classObj) => (
                              <span
                                key={typeof classObj === "string" ? classObj : classObj._id}
                                className="tagchip"
                              >
                                {getClassDisplay(classObj)}
                                {canEdit && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveClass(assignment, classObj);
                                    }}
                                    disabled={saving}
                                    aria-label={`Remove ${getClassDisplay(classObj)}`}
                                  >
                                    <X size={10} />
                                  </button>
                                )}
                              </span>
                            ))
                          ) : (
                            <span className="subtle" style={{ fontSize: 12 }}>No classes assigned</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="iconbtn"
                      onClick={() => {
                        setAssignmentToDelete(assignment._id);
                        onConfirmDeleteOpen();
                      }}
                      disabled={saving || !canEdit}
                      aria-label="Remove assignment"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        {(assignments.length > 0 || classTeacherAssignments.length > 0) && (
          <div className="detail-pane__metrics" style={{ margin: 0, gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className="dp-metric">
              <span className="dp-metric__label">Class teacher</span>
              <span className="dp-metric__value mono tnum">{classTeacherAssignments.length}</span>
            </div>
            <div className="dp-metric">
              <span className="dp-metric__label">Subjects</span>
              <span className="dp-metric__value mono tnum">{assignments.length}</span>
            </div>
            <div className="dp-metric">
              <span className="dp-metric__label">Total classes</span>
              <span className="dp-metric__value mono tnum">
                {totalClassesAssigned + classTeacherAssignments.length}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Add Assignment Modal */}
      <Modal isOpen={isAddModalOpen} onClose={handleCloseAddModal} size="2xl">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 border-b border-divider px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="assignsec__icon"><BookOpen size={14} /></span>
              <div>
                <h3 className="text-lg font-semibold text-fg">Add subject assignment</h3>
                <p className="text-sm text-fg-muted font-normal">
                  Assign subjects and classes to this teacher
                </p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="py-6 px-6">
            <div className="col" style={{ gap: 16 }}>
              <div className="col" style={{ gap: 6 }}>
                <label className="text-sm font-medium text-fg">
                  Subject <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <Select
                  placeholder="Select a subject"
                  selectedKeys={newAssignment.subject ? new Set([newAssignment.subject]) : new Set()}
                  onSelectionChange={(keys) => {
                    const subject = Array.from(keys)[0];
                    setNewAssignment((prev) => ({ ...prev, subject }));
                    if (errors.subject) setErrors((prev) => ({ ...prev, subject: undefined }));
                  }}
                  isInvalid={!!errors.subject}
                  errorMessage={errors.subject}
                  variant="bordered"
                  size="md"
                  aria-label="Select subject"
                >
                  {availableSubjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </Select>
              </div>

              <div className="col" style={{ gap: 6 }}>
                <label className="text-sm font-medium text-fg">
                  Classes <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                {/* optgrid for class picker — keyboard friendly, visible state */}
                <div className="optgrid" role="group" aria-label="Select classes">
                  {availableClasses.map((cls) => {
                    const id = cls._id || cls.id;
                    const isActive = newAssignment.classIds.has(id);
                    return (
                      <button
                        type="button"
                        key={id}
                        className={`opt ${isActive ? "is-active" : ""}`}
                        aria-pressed={isActive}
                        onClick={() => {
                          const next = new Set(newAssignment.classIds);
                          if (isActive) next.delete(id);
                          else next.add(id);
                          setNewAssignment((prev) => ({ ...prev, classIds: next }));
                          if (errors.classes) setErrors((prev) => ({ ...prev, classes: undefined }));
                        }}
                      >
                        <span className="mono tnum">{cls.name}-{cls.section}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.classes && (
                  <div style={{ fontSize: 12, color: "var(--danger)" }}>{errors.classes}</div>
                )}
                {newAssignment.classIds.size > 0 && (
                  <div className="taginput" style={{ marginTop: 4 }}>
                    {Array.from(newAssignment.classIds).map((classId) => {
                      const classObj = availableClasses.find(
                        (c) => String(c._id || c.id) === String(classId)
                      );
                      return classObj ? (
                        <span key={classId} className="tagchip">
                          {`${classObj.name} ${classObj.section}`}
                          <button
                            type="button"
                            onClick={() => {
                              const next = new Set(newAssignment.classIds);
                              next.delete(classId);
                              setNewAssignment((prev) => ({ ...prev, classIds: next }));
                            }}
                            aria-label={`Remove ${classObj.name} ${classObj.section}`}
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              <div className="staff-banner">
                <div className="staff-banner__icon"><AlertCircle size={14} /></div>
                <div className="staff-banner__body">
                  This assignment will allow the teacher to be selected when creating timetables
                  for the selected classes and subject.
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-divider px-6 py-4">
            <button
              type="button"
              className="btn"
              onClick={handleCloseAddModal}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--accent"
              onClick={handleAddAssignment}
              disabled={saving}
            >
              {saving ? "Adding…" : (<><Plus size={12} /> Add assignment</>)}
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Confirmation Dialog - Remove entire assignment */}
      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        onClose={onConfirmDeleteClose}
        onConfirm={confirmRemoveAssignment}
        title="Remove assignment"
        message="Are you sure you want to remove this entire assignment? This will remove all class assignments for this subject."
        confirmText="Remove all"
        cancelText="Cancel"
        variant="danger"
        isLoading={saving}
      />

      {/* Confirmation Dialog - Remove single class */}
      <ConfirmDialog
        isOpen={isConfirmRemoveClassOpen}
        onClose={onConfirmRemoveClassClose}
        onConfirm={confirmRemoveClass}
        title="Remove class"
        message={
          classToRemove
            ? classToRemove.isLastClass
              ? `This is the only class for ${classToRemove.subject}. Removing it will delete the entire subject assignment.`
              : `Remove ${classToRemove.className} from ${classToRemove.subject}?`
            : ""
        }
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
        isLoading={saving}
      />
    </>
  );
}
