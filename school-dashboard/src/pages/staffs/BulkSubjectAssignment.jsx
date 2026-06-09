import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select, SelectItem,
} from "@heroui/react";
import {
  Search, BookOpen, Plus, X, AlertCircle, Users, Save, ArrowLeft, Check,
} from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "../../context/AppContext";
import { usePermissions } from "../../context/PermissionContext";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useTranslation } from "react-i18next";
import logger from "../../utils/logger";

/**
 * BulkSubjectAssignment — Page for assigning subjects and classes to teachers in bulk.
 */
export default function BulkSubjectAssignment() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { staff, classesWithTeachers, schoolSettings, teacherAssignmentsApi, refetch } =
    useApp();
  const { hasPermission } = usePermissions();

  const canEdit = hasPermission("staff", "edit");

  const availableSubjects =
    schoolSettings?.subjects?.map((s) => (typeof s === "string" ? s : s.name)) || [
      "Mathematics", "Science", "English", "Hindi", "Social Studies",
      "Computer Science", "Physical Education", "Art", "Music",
    ];

  const preselectedStaffId = location.state?.preselectedStaffId;

  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teacherAssignments, setTeacherAssignments] = useState({});
  const [pendingChanges, setPendingChanges] = useState({});
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ subject: "", classIds: new Set() });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false, title: "", message: "", onConfirm: null, variant: "default",
  });

  useEffect(() => {
    if (preselectedStaffId && staff.length > 0 && !selectedTeacher) {
      const found = staff.find((s) => String(s.id || s._id) === String(preselectedStaffId));
      if (found) setSelectedTeacher(found);
    }
  }, [preselectedStaffId, staff, selectedTeacher]);

  const departments = useMemo(() => {
    const depts = new Set();
    staff.forEach((s) => s.department && depts.add(s.department));
    return Array.from(depts).sort();
  }, [staff]);

  const teachers = useMemo(() => {
    return staff.filter((s) => {
      const roles = Array.isArray(s.role) ? s.role : [s.role];
      const staffTypes = Array.isArray(s.staffType) ? s.staffType : [s.staffType];
      const isTeacher = roles.includes("Teacher") || staffTypes.includes("Teacher") || s.isClassTeacher;
      if (!isTeacher) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!s.name?.toLowerCase().includes(q) && !s.department?.toLowerCase().includes(q)) return false;
      }
      if (departmentFilter !== "all" && s.department !== departmentFilter) return false;
      return true;
    });
  }, [staff, searchQuery, departmentFilter]);

  const staffCount = staff?.length || 0;
  useEffect(() => {
    if (staffCount > 0) loadAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffCount]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const assignmentPromises = teachers.map(async (teacher) => {
        try {
          const data = await teacherAssignmentsApi.getAll(teacher.id || teacher._id);
          return { teacherId: String(teacher.id || teacher._id), assignments: data.assignments || [] };
        } catch (err) {
          logger.error(`Failed to load assignments for teacher ${teacher.id}:`, err);
          return { teacherId: String(teacher.id || teacher._id), assignments: [] };
        }
      });
      const results = await Promise.all(assignmentPromises);
      const map = {};
      results.forEach((r) => (map[r.teacherId] = r.assignments));
      setTeacherAssignments(map);
    } catch (error) {
      logger.error("Error loading assignments:", error);
      toast.error("Failed to load teacher assignments");
    } finally {
      setLoading(false);
    }
  };

  const getPendingChanges = useCallback(
    (teacherId) => pendingChanges[String(teacherId)] || { added: [], removed: [] },
    [pendingChanges]
  );

  const hasPendingChanges = useCallback(
    (teacherId) => {
      const c = getPendingChanges(teacherId);
      return c.added.length > 0 || c.removed.length > 0;
    },
    [getPendingChanges]
  );

  const totalPendingChanges = useMemo(() => {
    let n = 0;
    Object.values(pendingChanges).forEach((c) => (n += c.added.length + c.removed.length));
    return n;
  }, [pendingChanges]);

  const handleOpenAssignModal = useCallback(
    (teacher) => {
      if (!canEdit) {
        toast.error("You do not have permission to edit teacher assignments");
        return;
      }
      setSelectedTeacher(teacher);
      setNewAssignment({ subject: "", classIds: new Set() });
      setIsAssignModalOpen(true);
    },
    [canEdit]
  );

  const handleAddAssignment = useCallback(() => {
    if (!selectedTeacher || !newAssignment.subject || newAssignment.classIds.size === 0) {
      toast.error("Please select subject and at least one class");
      return;
    }
    const teacherId = String(selectedTeacher.id || selectedTeacher._id);
    const subject = newAssignment.subject;
    const classIds = Array.from(newAssignment.classIds);

    setPendingChanges((prev) => {
      const changes = prev[teacherId] || { added: [], removed: [] };
      if (changes.added.some((a) => a.subject === subject)) {
        toast.error("This subject is already pending to be added");
        return prev;
      }
      return {
        ...prev,
        [teacherId]: {
          ...changes,
          added: [
            ...changes.added,
            {
              subject,
              classIds,
              classes: classIds.map((id) => {
                const c = classesWithTeachers.find((cl) => cl.id === id);
                return c ? { id: c.id, name: c.name, section: c.section } : { id };
              }),
            },
          ],
        },
      };
    });

    setIsAssignModalOpen(false);
    setNewAssignment({ subject: "", classIds: new Set() });
    toast.success(`Queued ${subject}`);
  }, [selectedTeacher, newAssignment, classesWithTeachers]);

  const handleRemoveAssignment = useCallback(
    (teacherId, assignmentId, subject) => {
      if (!canEdit) {
        toast.error("You do not have permission to edit teacher assignments");
        return;
      }
      const id = String(teacherId);
      setPendingChanges((prev) => {
        const changes = prev[id] || { added: [], removed: [] };
        const pendingAddIdx = changes.added.findIndex((a) => a.subject === subject);
        if (pendingAddIdx >= 0) {
          const next = [...changes.added];
          next.splice(pendingAddIdx, 1);
          return { ...prev, [id]: { ...changes, added: next } };
        }
        return {
          ...prev,
          [id]: { ...changes, removed: [...changes.removed, { assignmentId, subject }] },
        };
      });
      toast.success(`Marked ${subject} for removal`);
    },
    [canEdit]
  );

  const handleUndoRemoval = useCallback((teacherId, subject) => {
    const id = String(teacherId);
    setPendingChanges((prev) => {
      const changes = prev[id] || { added: [], removed: [] };
      return {
        ...prev,
        [id]: { ...changes, removed: changes.removed.filter((r) => r.subject !== subject) },
      };
    });
  }, []);

  const handleSaveAll = useCallback(async () => {
    if (totalPendingChanges === 0) {
      toast.error("No pending changes to save");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Save all changes",
      message: `Save ${totalPendingChanges} pending change(s)? This will add/remove assignments for all modified teachers.`,
      onConfirm: async () => {
        try {
          setSaving(true);
          const ops = [];

          Object.entries(pendingChanges).forEach(([teacherId, changes]) => {
            changes.added.forEach((a) => {
              ops.push({
                kind: "add",
                teacherId,
                subject: a.subject,
                run: () =>
                  teacherAssignmentsApi.create({
                    teacherId,
                    subject: a.subject,
                    classIds: a.classIds,
                  }),
              });
            });
            changes.removed.forEach((r) => {
              if (r.assignmentId) {
                ops.push({
                  kind: "remove",
                  teacherId,
                  subject: r.subject,
                  run: () => teacherAssignmentsApi.delete(r.assignmentId, teacherId),
                });
              }
            });
          });

          // Partial-failure handling: use allSettled so a single bad op doesn't
          // discard valid work, then surface what succeeded vs. what failed and
          // *retain* the failing pending changes so the user can fix and retry.
          const results = await Promise.allSettled(ops.map((o) => o.run()));
          const failedOps = [];
          let okCount = 0;
          results.forEach((res, idx) => {
            if (res.status === "fulfilled") {
              okCount++;
            } else {
              failedOps.push({ op: ops[idx], reason: res.reason });
            }
          });

          if (okCount > 0) toast.success(`${okCount} change(s) saved`);
          if (failedOps.length > 0) {
            logger.error("Bulk assignment partial failure:", failedOps);
            const sample = failedOps[0];
            toast.error(
              `${failedOps.length} change(s) failed — ${sample.op.subject}: ${
                sample.reason?.message || "unknown error"
              }${failedOps.length > 1 ? " (and others)" : ""}`,
              { duration: 6000 }
            );
          }

          // Reset only the changes that succeeded — failed ops stay pending
          // so the user can retry without re-entering them.
          const failedKeys = new Set(failedOps.map((f) => `${f.op.teacherId}::${f.op.subject}::${f.op.kind}`));
          setPendingChanges((prev) => {
            const next = {};
            Object.entries(prev).forEach(([teacherId, changes]) => {
              const added = changes.added.filter((a) =>
                failedKeys.has(`${teacherId}::${a.subject}::add`)
              );
              const removed = changes.removed.filter((r) =>
                failedKeys.has(`${teacherId}::${r.subject}::remove`)
              );
              if (added.length || removed.length) next[teacherId] = { added, removed };
            });
            return next;
          });

          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          await loadAssignments();
          if (refetch) await refetch();
        } catch (error) {
          logger.error("Error saving changes:", error);
          toast.error(error.message || "Failed to save changes");
        } finally {
          setSaving(false);
        }
      },
      variant: "default",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingChanges, totalPendingChanges, teacherAssignmentsApi, refetch]);

  const handleClearAll = useCallback(() => {
    setPendingChanges({});
    toast.success("All pending changes cleared");
  }, []);

  const getEffectiveAssignments = useCallback(
    (teacherId) => {
      const id = String(teacherId);
      const current = [...(teacherAssignments[id] || [])];
      const changes = pendingChanges[id] || { added: [], removed: [] };
      const removedSubjects = new Set(changes.removed.map((r) => r.subject));
      const filtered = current.filter((a) => !removedSubjects.has(a.subject));
      return [...filtered, ...changes.added];
    },
    [teacherAssignments, pendingChanges]
  );

  const getClassDisplay = useCallback(
    (classObj) => {
      if (typeof classObj === "string") {
        const f = classesWithTeachers.find((c) => c._id === classObj || c.id === classObj);
        return f ? `${f.name}-${f.section}` : classObj;
      }
      if (classObj.name && classObj.section) return `${classObj.name}-${classObj.section}`;
      return String(classObj.id || classObj);
    },
    [classesWithTeachers]
  );

  return (
    <div className="page">
      {/* Header (title + description) is owned by the staffs section shell
          (PageLayout in pages/staffs/index.jsx) — no page-level header here,
          or it renders twice. */}
      <div className="col" style={{ gap: 12 }}>
        {/* Info banner */}
        <div className="staff-banner">
          <div className="staff-banner__icon"><AlertCircle size={14} /></div>
          <div>
            <div className="staff-banner__title">Note</div>
            <div className="staff-banner__body">
              Subject assignments determine which teachers can be selected when creating timetables
              for specific subjects and classes. Class teacher assignment is separate.
            </div>
          </div>
        </div>

        {/* Pending preview */}
        {totalPendingChanges > 0 && (
          <div className="pendingstrip">
            <div className="row" style={{ alignItems: "center", gap: 10 }}>
              <Save size={14} className="text-fg-muted" />
              <div className="col" style={{ gap: 2 }}>
                <div style={{ fontSize: 13 }}>
                  <span className="pendingstrip__count mono tnum">{totalPendingChanges}</span>{" "}
                  pending change{totalPendingChanges === 1 ? "" : "s"}
                </div>
                <div className="subtle" style={{ fontSize: 11.5 }}>
                  Changes are previewed below — click Save all to apply.
                </div>
              </div>
            </div>
            <div className="row" style={{ gap: 6 }}>
              <button
                type="button"
                className="btn btn--sm"
                onClick={handleClearAll}
                disabled={saving}
              >
                Clear all
              </button>
              <button
                type="button"
                className="btn btn--accent btn--sm"
                onClick={handleSaveAll}
                disabled={saving}
              >
                {saving ? "Saving…" : (<><Check size={12} /> Save all</>)}
              </button>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="toolbar">
          <div className="toolbar__search" style={{ flex: 1 }}>
            <Search size={14} className="text-fg-subtle" />
            <input
              type="text"
              placeholder="Search teachers"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search teachers"
            />
          </div>
          <div className="seg" role="tablist" aria-label="Filter department">
            <button
              type="button"
              role="tab"
              aria-selected={departmentFilter === "all"}
              className={`seg__btn ${departmentFilter === "all" ? "is-active" : ""}`}
              onClick={() => setDepartmentFilter("all")}
            >
              All
            </button>
            {departments.slice(0, 4).map((d) => (
              <button
                key={d}
                type="button"
                role="tab"
                aria-selected={departmentFilter === d}
                className={`seg__btn ${departmentFilter === d ? "is-active" : ""}`}
                onClick={() => setDepartmentFilter(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Teachers list */}
        <div className="card" style={{ padding: 0 }}>
          {loading ? (
            <div className="col" style={{ gap: 6, padding: 12 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="row" style={{ gap: 10, alignItems: "center", padding: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 999, background: "var(--surface-2)" }} />
                  <div className="col" style={{ flex: 1, gap: 4 }}>
                    <div style={{ height: 12, width: "30%", background: "var(--surface-2)", borderRadius: 4 }} />
                    <div style={{ height: 10, width: "60%", background: "var(--surface-2)", borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : teachers.length === 0 ? (
            <div className="assign-empty">
              <div className="assign-empty__icon"><Users size={16} /></div>
              <div className="assign-empty__title">No teachers found</div>
              <div className="assign-empty__sub">
                Try clearing the search or department filter.
              </div>
            </div>
          ) : (
            <div>
              {teachers.map((teacher) => {
                const teacherId = String(teacher.id || teacher._id);
                const assignments = getEffectiveAssignments(teacherId);
                const changes = getPendingChanges(teacherId);
                const hasChanges = hasPendingChanges(teacherId);

                return (
                  <div
                    key={teacherId}
                    className="stafflist__row"
                    style={{ alignItems: "flex-start", padding: "14px 16px", display: "grid", gridTemplateColumns: "minmax(180px, 220px) 1fr auto", gap: 14 }}
                  >
                    <div className="row" style={{ gap: 10, alignItems: "center", minWidth: 0 }}>
                      <div
                        style={{
                          width: 32, height: 32, borderRadius: 6,
                          background: "var(--surface-2)", overflow: "hidden",
                          display: "grid", placeItems: "center", flexShrink: 0,
                        }}
                      >
                        {teacher.picture ? (
                          <img
                            src={teacher.picture}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            loading="lazy"
                          />
                        ) : (
                          <span className="mono tnum" style={{ fontWeight: 600, fontSize: 12 }}>
                            {teacher.name?.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="col" style={{ minWidth: 0, gap: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 520, color: "var(--fg)" }}>
                          {teacher.name}
                        </span>
                        <span className="subtle" style={{ fontSize: 11.5 }}>
                          {teacher.department || "—"}
                          {hasChanges && (
                            <span className="chip chip--warn" style={{ marginLeft: 6 }}>
                              pending
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="col" style={{ gap: 6, minWidth: 0 }}>
                      {assignments.length === 0 ? (
                        <span className="subtle" style={{ fontSize: 12.5, fontStyle: "italic" }}>
                          No subjects assigned
                        </span>
                      ) : (
                        assignments.map((assignment) => {
                          const isPendingAdd = changes.added.some(
                            (a) => a.subject === assignment.subject
                          );
                          const isPendingRemove = changes.removed.some(
                            (r) => r.subject === assignment.subject
                          );

                          if (isPendingRemove) {
                            return (
                              <div
                                key={assignment.subject}
                                className="subjrow is-pending-remove"
                              >
                                <span className="subjrow__name">{assignment.subject}</span>
                                <button
                                  type="button"
                                  className="btn btn--ghost btn--sm"
                                  onClick={() => handleUndoRemoval(teacherId, assignment.subject)}
                                >
                                  Undo
                                </button>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={assignment.subject}
                              className={`subjrow ${isPendingAdd ? "is-pending-add" : ""}`}
                            >
                              <div className="col" style={{ flex: 1, minWidth: 0, gap: 4 }}>
                                <div className="row" style={{ alignItems: "center", gap: 6 }}>
                                  <BookOpen size={12} className="text-fg-muted" />
                                  <span className="subjrow__name">{assignment.subject}</span>
                                  {isPendingAdd && (
                                    <span className="chip chip--ok" style={{ fontSize: 10 }}>
                                      new
                                    </span>
                                  )}
                                </div>
                                <div className="subjrow__classes">
                                  {assignment.classes?.map((cls, idx) => (
                                    <span
                                      key={cls._id || cls.id || `class-${idx}`}
                                      className="chip mono tnum"
                                    >
                                      {getClassDisplay(cls)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              {canEdit && (
                                <button
                                  type="button"
                                  className="iconbtn"
                                  onClick={() =>
                                    handleRemoveAssignment(
                                      teacherId,
                                      assignment._id || assignment.id,
                                      assignment.subject
                                    )
                                  }
                                  aria-label="Remove assignment"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="row" style={{ alignItems: "center" }}>
                      <button
                        type="button"
                        className="btn btn--sm"
                        onClick={() => handleOpenAssignModal(teacher)}
                        disabled={!canEdit}
                      >
                        <Plus size={12} /> Add subject
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
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 border-b border-divider px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="assignsec__icon"><BookOpen size={14} /></span>
              <div>
                <h3 className="text-lg font-semibold text-fg">Add subject assignment</h3>
                <p className="text-sm text-fg-muted font-normal">
                  For: {selectedTeacher?.name}
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
                  onSelectionChange={(keys) =>
                    setNewAssignment((prev) => ({ ...prev, subject: Array.from(keys)[0] || "" }))
                  }
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
                <div className="optgrid" role="group" aria-label="Select classes">
                  {classesWithTeachers.map((cls) => {
                    const id = cls.id;
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
                        }}
                      >
                        <span className="mono tnum">{cls.name}-{cls.section}</span>
                      </button>
                    );
                  })}
                </div>
                {newAssignment.classIds.size > 0 && (
                  <div className="taginput" style={{ marginTop: 4 }}>
                    {Array.from(newAssignment.classIds).map((classId) => {
                      const c = classesWithTeachers.find((cl) => String(cl.id) === String(classId));
                      return c ? (
                        <span key={classId} className="tagchip">
                          {`${c.name}-${c.section}`}
                          <button
                            type="button"
                            onClick={() => {
                              const next = new Set(newAssignment.classIds);
                              next.delete(classId);
                              setNewAssignment((prev) => ({ ...prev, classIds: next }));
                            }}
                            aria-label={`Remove ${c.name}-${c.section}`}
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
                  This assignment will allow {selectedTeacher?.name} to be selected when creating
                  timetables for the chosen classes and subject.
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-divider px-6 py-4">
            <button
              type="button"
              className="btn"
              onClick={() => setIsAssignModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--accent"
              onClick={handleAddAssignment}
              disabled={!newAssignment.subject || newAssignment.classIds.size === 0}
            >
              <Plus size={12} /> Add to pending
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
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
