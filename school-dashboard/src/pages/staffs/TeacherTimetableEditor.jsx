import { useState, useEffect } from "react";
import {
  Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  useDisclosure, Spinner,
} from "@heroui/react";
import { Plus, X, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { usePermissions } from "../../context/PermissionContext";
import { teacherTimetableApi, teacherAssignmentsApi } from "../../services/api";
import ConflictIndicator from "../../components/ConflictIndicator";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
  showErrorToast, showSuccessToast, showWarningToast, executeWithFeedback, formatConflictDetails,
} from "../../utils/errorHandling";
import { DEFAULT_PERIODS, TIMETABLE_DAYS } from "../../utils/constants";
import logger from "../../utils/logger";

const days = TIMETABLE_DAYS;
const defaultPeriods = DEFAULT_PERIODS;

export default function TeacherTimetableEditor({ teacherId, teacherName }) {
  const { classesWithTeachers, schoolSettings, currentAcademicYear } = useApp();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [, setTimetable] = useState(null);
  const [periods] = useState(defaultPeriods);
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(false);
  const [teacher, setTeacher] = useState(null);

  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  const [conflicts, setConflicts] = useState([]);
  const [loadingConflicts, setLoadingConflicts] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  const { isOpen: isSlotOpen, onOpen: onSlotOpen, onClose: onSlotClose } = useDisclosure();
  const { isOpen: isConfirmClearOpen, onOpen: onConfirmClearOpen, onClose: onConfirmClearClose } = useDisclosure();
  const { isOpen: isAssignmentsOpen, onOpen: onAssignmentsOpen, onClose: onAssignmentsClose } = useDisclosure();
  const [editingSlot, setEditingSlot] = useState(null);
  const [slotForm, setSlotForm] = useState({ classId: "", subject: "" });
  const [availableClasses, setAvailableClasses] = useState([]);

  const [newAssignment, setNewAssignment] = useState({ subject: "", classes: [] });
  const [savingAssignments, setSavingAssignments] = useState(false);

  const isOwnTimetable = user?.id === teacherId;
  const userRole = user?.role;
  const isAdmin =
    hasPermission("staff", "edit") &&
    ((Array.isArray(userRole)
      ? userRole.some((r) => r?.toLowerCase()?.includes("admin"))
      : userRole?.toLowerCase()?.includes("admin")));
  const canEdit = isAdmin;
  const canView = isAdmin || isOwnTimetable;

  useEffect(() => {
    if (teacherId) {
      loadTimetable();
      loadTeacherAssignments();
      loadConflicts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId]);

  const loadTimetable = async () => {
    try {
      setLoading(true);
      const response = await teacherTimetableApi.get(teacherId, currentAcademicYear);
      if (response.success) {
        setTimetable(response.timetable);
        setTeacher(response.teacher);
        const converted = {};
        days.forEach((day) => (converted[day] = response.timetable.schedule[day] || []));
        setSchedule(converted);
      }
    } catch (err) {
      logger.error("Failed to load teacher timetable:", err);
      showErrorToast(err, "Failed to load teacher timetable.");
      const empty = {};
      days.forEach((day) => (empty[day] = periods.map(() => ({ classId: null, subject: "" }))));
      setSchedule(empty);
    } finally {
      setLoading(false);
    }
  };

  const loadTeacherAssignments = async () => {
    try {
      setLoadingAssignments(true);
      const response = await teacherAssignmentsApi.getAll(teacherId);
      const assignments = Array.isArray(response) ? response : response?.assignments || [];
      setTeacherAssignments(assignments);
    } catch (err) {
      logger.error("Failed to load teacher assignments:", err);
      showErrorToast(err, "Failed to load teacher assignments.");
      setTeacherAssignments([]);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const loadConflicts = async () => {
    try {
      setLoadingConflicts(true);
      const response = await teacherTimetableApi.getConflicts(teacherId, currentAcademicYear);
      setConflicts(response.conflicts || []);
      if (response.conflicts?.length > 0)
        showWarningToast(`${response.conflicts.length} scheduling conflict(s) detected.`);
    } catch (err) {
      logger.error("Failed to load conflicts:", err);
      showErrorToast(err, "Failed to load conflicts.");
      setConflicts([]);
    } finally {
      setLoadingConflicts(false);
    }
  };

  const handleSlotClick = (day, periodIndex) => {
    const period = periods[periodIndex];
    if (period.isBreak) return;
    if (!canEdit) {
      showWarningToast("You do not have permission to edit this timetable.");
      return;
    }
    const slot = schedule[day]?.[periodIndex] || { classId: null, subject: "" };
    setEditingSlot({ day, periodIndex });
    setSlotForm({ classId: slot.classId || "", subject: slot.subject || "" });
    updateAvailableClasses(slot.subject || "");
    onSlotOpen();
  };

  useEffect(() => {
    if (isSlotOpen && slotForm.subject) updateAvailableClasses(slotForm.subject);
    // `updateAvailableClasses` is recreated each render; trigger on subject.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotForm.subject, isSlotOpen]);

  const updateAvailableClasses = (subject) => {
    if (!subject) {
      setAvailableClasses([]);
      return;
    }
    setAvailableClasses(classesWithTeachers);
  };

  const handleClassSwitch = async () => {
    if (!editingSlot || !slotForm.classId || !slotForm.subject) {
      showWarningToast("Please select both a class and subject");
      return;
    }
    const { day, periodIndex } = editingSlot;
    await executeWithFeedback(
      async () => {
        setSyncStatus("syncing");
        const slotData = {
          day, periodIndex,
          classId: slotForm.classId, subject: slotForm.subject,
          academicYear: currentAcademicYear,
        };
        await teacherTimetableApi.updateSlot(teacherId, slotData);
        const newSchedule = { ...schedule };
        if (!newSchedule[day]) newSchedule[day] = [];
        while (newSchedule[day].length <= periodIndex)
          newSchedule[day].push({ classId: null, subject: "" });
        newSchedule[day][periodIndex] = { classId: slotForm.classId, subject: slotForm.subject };
        setSchedule(newSchedule);
        setSyncStatus("success");
        return newSchedule;
      },
      {
        loadingMessage: "Saving and syncing timetable...",
        successMessage: "Teacher timetable updated and synced!",
        errorMessage: "Failed to update timetable",
        retries: 2,
        onSuccess: async () => {
          setTimeout(() => setSyncStatus(null), 2000);
          onSlotClose();
          setEditingSlot(null);
          setSlotForm({ classId: "", subject: "" });
          await loadTimetable();
          await loadConflicts();
        },
        onError: (error) => {
          setSyncStatus("error");
          if (error.message?.includes("not qualified")) {
            showErrorToast(
              error,
              "Backend validation: Teacher must be assigned to teach this subject in this class. " +
                "Create a staff assignment first."
            );
            return;
          }
          if (error.type === "ConflictError") showWarningToast(formatConflictDetails(error));
        },
      }
    );
  };

  const handleClearSlot = () => {
    if (!editingSlot) return;
    onConfirmClearOpen();
  };

  const confirmClearSlot = async () => {
    if (!editingSlot) return;
    const { day, periodIndex } = editingSlot;
    await executeWithFeedback(
      async () => {
        setSyncStatus("syncing");
        const slotData = { day, periodIndex, classId: null, subject: "", academicYear: currentAcademicYear };
        await teacherTimetableApi.updateSlot(teacherId, slotData);
        const newSchedule = { ...schedule };
        if (!newSchedule[day]) newSchedule[day] = [];
        while (newSchedule[day].length <= periodIndex)
          newSchedule[day].push({ classId: null, subject: "" });
        newSchedule[day][periodIndex] = { classId: null, subject: "" };
        setSchedule(newSchedule);
        setSyncStatus("success");
        return newSchedule;
      },
      {
        loadingMessage: "Clearing slot and syncing...",
        successMessage: "Slot cleared and synced!",
        errorMessage: null,
        retries: 2,
        onSuccess: async () => {
          setTimeout(() => setSyncStatus(null), 2000);
          onConfirmClearClose();
          onSlotClose();
          setEditingSlot(null);
          setSlotForm({ classId: "", subject: "" });
          await loadTimetable();
          await loadConflicts();
        },
        onError: () => {
          setSyncStatus("error");
          onConfirmClearClose();
        },
      }
    );
  };

  const handleAddAssignment = async () => {
    if (!newAssignment.subject || newAssignment.classes.length === 0) {
      showWarningToast("Please select a subject and at least one class");
      return;
    }
    setSavingAssignments(true);
    try {
      await teacherAssignmentsApi.create({
        teacherId, subject: newAssignment.subject, classIds: newAssignment.classes,
      });
      showSuccessToast("Assignment added successfully");
      const response = await teacherAssignmentsApi.getAll(teacherId);
      setTeacherAssignments(Array.isArray(response) ? response : response?.assignments || []);
      setNewAssignment({ subject: "", classes: [] });
    } catch (error) {
      showErrorToast(error, "Failed to add assignment");
    } finally {
      setSavingAssignments(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    setSavingAssignments(true);
    try {
      await teacherAssignmentsApi.delete(assignmentId, teacherId);
      showSuccessToast("Assignment removed successfully");
      const response = await teacherAssignmentsApi.getAll(teacherId);
      setTeacherAssignments(Array.isArray(response) ? response : response?.assignments || []);
    } catch (error) {
      showErrorToast(error, "Failed to remove assignment");
    } finally {
      setSavingAssignments(false);
    }
  };

  const getClassName = (classId) => {
    if (!classId) return "";
    const c = classesWithTeachers.find(
      (cl) => String(cl.id) === String(classId) || String(cl._id) === String(classId)
    );
    return c ? `${c.name}-${c.section}` : "";
  };

  const getTeacherSubjects = () => {
    const assigned = new Set();
    if (Array.isArray(teacherAssignments))
      teacherAssignments.forEach((a) => a.subject && assigned.add(a.subject));
    const all = new Set(assigned);
    if (schoolSettings?.subjects && Array.isArray(schoolSettings.subjects))
      schoolSettings.subjects.forEach((s) => {
        const n = s.name || s.subject;
        if (n) all.add(n);
      });
    return Array.from(all);
  };

  const getAssignedClassesDisplay = () => {
    const map = {};
    if (Array.isArray(teacherAssignments))
      teacherAssignments.forEach((a) =>
        a.classes.forEach((cid) => {
          const n = getClassName(cid);
          if (n) {
            if (!map[n]) map[n] = [];
            if (!map[n].includes(a.subject)) map[n].push(a.subject);
          }
        })
      );
    return map;
  };

  if (!teacherId) {
    return (
      <div style={{ padding: 32, textAlign: "center" }} className="subtle">
        No teacher selected.
      </div>
    );
  }

  return (
    <div className="col" style={{ gap: 12, width: "100%" }}>
      {/* Toolbar header */}
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div className="row" style={{ alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <h3 className="card__title" style={{ fontSize: 15, margin: 0 }}>
            {teacherName || teacher?.name || "Teacher"} timetable
          </h3>
          <span className="chip chip--accent mono tnum">{currentAcademicYear}</span>
          {syncStatus === "syncing" && (
            <span className="status status--info"><Spinner size="sm" /> Syncing</span>
          )}
          {syncStatus === "success" && (
            <span className="status status--ok"><CheckCircle2 size={11} /> Synced</span>
          )}
          {syncStatus === "error" && (
            <span className="status status--danger"><AlertTriangle size={11} /> Sync failed</span>
          )}
          {conflicts.length > 0 && (
            <span className="status status--danger" title="Scheduling conflicts">
              <AlertTriangle size={11} /> {conflicts.length} conflict{conflicts.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
        <div className="row" style={{ gap: 6 }}>
          <button
            type="button"
            className="btn btn--sm"
            onClick={onAssignmentsOpen}
          >
            <Plus size={12} /> Manage subjects & classes
          </button>
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => {
              loadTimetable();
              loadConflicts();
            }}
            disabled={loading || loadingConflicts}
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* Assigned subjects strip */}
      {!loadingAssignments && Array.isArray(teacherAssignments) && teacherAssignments.length > 0 && (
        <div className="card" style={{ padding: 12 }}>
          <div className="card__title" style={{ fontSize: 11.5, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--fg-subtle)" }}>
            Assigned classes / subjects
          </div>
          <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
            {Object.entries(getAssignedClassesDisplay()).map(([className, subjects]) => (
              <span key={className} className="chip chip--accent">
                <span className="mono tnum">{className}</span>: {subjects.join(", ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {!loadingAssignments && (!Array.isArray(teacherAssignments) || teacherAssignments.length === 0) && (
        <div className="staff-banner staff-banner--warn">
          <div className="staff-banner__icon"><AlertTriangle size={14} /></div>
          <div>
            <div className="staff-banner__title">No subject assignments yet</div>
            <div className="staff-banner__body">
              Click <em>Manage subjects & classes</em> to assign which subjects and classes this teacher can teach.
              You can still schedule classes without assignments — assignments help organize and validate.
            </div>
          </div>
        </div>
      )}

      {!canEdit && canView && (
        <div className="staff-banner staff-banner--warn">
          <div className="staff-banner__icon"><AlertTriangle size={14} /></div>
          <div>
            <div className="staff-banner__title">View only</div>
            <div className="staff-banner__body">
              {isOwnTimetable
                ? "You can view your timetable but cannot edit it. Contact an administrator to make changes."
                : "Only administrators can edit teacher timetables."}
            </div>
          </div>
        </div>
      )}

      {!canView && (
        <div className="staff-banner staff-banner--danger">
          <div className="staff-banner__icon"><AlertTriangle size={14} /></div>
          <div>
            <div className="staff-banner__title">Access denied</div>
            <div className="staff-banner__body">
              You do not have permission to view this teacher's timetable.
            </div>
          </div>
        </div>
      )}

      {conflicts.length > 0 && (
        <ConflictIndicator
          conflicts={conflicts}
          onResolve={(resolutionData) => {
            const { action } = resolutionData;
            if (action === "remove_current") handleClearSlot();
            else if (action === "choose_different")
              alert("Please select a different class or time slot to avoid the conflict.");
            else if (action === "remove_from_class")
              alert(
                `To resolve, go to ${resolutionData.resolution.className} timetable and remove the teacher from that slot.`
              );
            else if (action === "update_assignments")
              alert("Please go to Staff Assignments to add this subject-class assignment.");
            loadConflicts();
          }}
        />
      )}

      {/* Grid */}
      {loading ? (
        <div className="card" style={{ padding: 0 }}>
          {Array.from({ length: 7 }).map((_, row) => (
            <div
              key={row}
              className="row"
              style={{
                gap: 10, padding: 12, borderBottom: "1px solid var(--divider)",
              }}
            >
              {Array.from({ length: 6 }).map((__unused, col) => (
                <div
                  key={col}
                  style={{ flex: 1, height: 40, background: "var(--surface-2)", borderRadius: 6 }}
                />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <div className="card" style={{ padding: 0, minWidth: 800 }}>
            <table className="table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ width: 88, position: "sticky", left: 0, background: "var(--surface-2)" }}>
                    Day
                  </th>
                  {periods.map((p) => (
                    <th key={p.name} style={{ textAlign: "center", width: p.isBreak ? 64 : 116, background: p.isBreak ? "var(--warn-bg)" : undefined }}>
                      <div className="col" style={{ alignItems: "center", gap: 1 }}>
                        <span style={{ fontWeight: 600 }}>{p.name}</span>
                        <span className="subtle mono tnum" style={{ fontSize: 9.5 }}>
                          {p.startTime}-{p.endTime}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map((day) => (
                  <tr key={day}>
                    <td
                      style={{
                        fontWeight: 600, position: "sticky", left: 0,
                        background: "var(--surface-2)", fontSize: 11.5,
                      }}
                    >
                      <span className="hidden sm:inline">{day}</span>
                      <span className="sm:hidden">{day.slice(0, 3)}</span>
                    </td>
                    {periods.map((period, i) => {
                      const slot = schedule[day]?.[i] || { classId: null, subject: "" };
                      if (period.isBreak) {
                        return (
                          <td key={`${day}-${period.name}`} style={{ background: "var(--warn-bg)", textAlign: "center", padding: 0 }}>
                            <span
                              style={{
                                fontSize: 9, fontWeight: 600, textTransform: "uppercase",
                                letterSpacing: "0.05em", color: "var(--warn)", opacity: 0.6,
                                display: "inline-block", transform: "rotate(-90deg)",
                              }}
                            >
                              {period.name}
                            </span>
                          </td>
                        );
                      }
                      const hasConflict = conflicts.some(
                        (c) => c.day === day && c.periodIndex === i
                      );
                      const filled = !!(slot.classId && slot.subject);
                      const cellClass = [
                        "ttgrid-cell",
                        !filled ? "is-empty" : "",
                        hasConflict ? "has-conflict" : "",
                        !canEdit ? "is-readonly" : "",
                      ].filter(Boolean).join(" ");

                      return (
                        <td key={`${day}-${period.name}`} style={{ padding: 4 }}>
                          <button
                            type="button"
                            className={cellClass}
                            onClick={() => canEdit && handleSlotClick(day, i)}
                            disabled={!canEdit && !filled}
                            aria-label={
                              filled
                                ? `${day} ${period.name}: ${getClassName(slot.classId)} ${slot.subject}${
                                    hasConflict ? " — conflict" : ""
                                  }`
                                : `${day} ${period.name}: empty`
                            }
                          >
                            {filled ? (
                              <>
                                {hasConflict && <AlertTriangle size={11} />}
                                <span className="ttgrid-cell__class mono tnum">
                                  {getClassName(slot.classId)}
                                </span>
                                <span className="ttgrid-cell__subject">{slot.subject}</span>
                              </>
                            ) : (
                              <Plus size={14} />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Slot Modal */}
      <Modal isOpen={isSlotOpen} onClose={onSlotClose} size="md">
        <ModalContent>
          <ModalHeader>
            {editingSlot && `Edit ${editingSlot.day} · ${periods[editingSlot.periodIndex]?.name}`}
          </ModalHeader>
          <ModalBody>
            <div className="col" style={{ gap: 12 }}>
              <Select
                label="Subject"
                placeholder="Select subject"
                selectedKeys={slotForm.subject ? [slotForm.subject] : []}
                onSelectionChange={(keys) => {
                  const subject = Array.from(keys)[0] || "";
                  setSlotForm({ ...slotForm, subject, classId: "" });
                }}
                variant="bordered"
                description={
                  Array.isArray(teacherAssignments) && teacherAssignments.length > 0
                    ? "Assigned subjects highlighted. All subjects available for scheduling."
                    : "All subjects available for scheduling"
                }
              >
                {getTeacherSubjects().map((subject) => {
                  const isAssigned =
                    Array.isArray(teacherAssignments) &&
                    teacherAssignments.some((a) => a.subject === subject);
                  return (
                    <SelectItem
                      key={subject}
                      textValue={subject}
                      description={isAssigned ? "✓ Assigned" : undefined}
                    >
                      {subject}
                    </SelectItem>
                  );
                })}
              </Select>

              {slotForm.subject && (
                <Select
                  label="Class"
                  placeholder="Select class"
                  selectedKeys={slotForm.classId ? [String(slotForm.classId)] : []}
                  onSelectionChange={(keys) =>
                    setSlotForm({ ...slotForm, classId: Array.from(keys)[0] || "" })
                  }
                  variant="bordered"
                  description={`${availableClasses.length} class(es) available`}
                >
                  {availableClasses.map((c) => (
                    <SelectItem
                      key={String(c.id || c._id)}
                      textValue={`Class ${c.name}-${c.section}`}
                    >
                      Class {c.name}-{c.section}
                    </SelectItem>
                  ))}
                </Select>
              )}

              {slotForm.classId && (
                <button
                  type="button"
                  className="btn"
                  style={{ width: "100%", color: "var(--danger)", borderColor: "var(--danger)" }}
                  onClick={handleClearSlot}
                  disabled={syncStatus === "syncing"}
                >
                  <X size={12} /> Clear slot
                </button>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <button type="button" className="btn" onClick={onSlotClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--accent"
              onClick={handleClassSwitch}
              disabled={!slotForm.subject || !slotForm.classId || syncStatus === "syncing"}
            >
              {syncStatus === "syncing" ? "Saving…" : "Save"}
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Manage Assignments Modal */}
      <Modal isOpen={isAssignmentsOpen} onClose={onAssignmentsClose} size="2xl">
        <ModalContent>
          <ModalHeader>
            <div className="col" style={{ gap: 4 }}>
              <h3 className="text-lg font-semibold">Manage subjects & classes</h3>
              <p className="subtle" style={{ fontSize: 12.5 }}>
                Assign which subjects and classes {teacherName || "this teacher"} can teach.
              </p>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="col" style={{ gap: 18 }}>
              <div>
                <div className="card__title" style={{ fontSize: 12, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--fg-subtle)" }}>
                  Current assignments
                </div>
                {!Array.isArray(teacherAssignments) || teacherAssignments.length === 0 ? (
                  <div className="assign-empty">
                    <div className="assign-empty__icon"><Plus size={14} /></div>
                    <div className="assign-empty__sub">No assignments yet — add one below.</div>
                  </div>
                ) : (
                  <div className="col" style={{ gap: 6 }}>
                    {teacherAssignments.map((a) => (
                      <div key={a._id || a.id} className="subjrow">
                        <div className="col" style={{ gap: 6, flex: 1, minWidth: 0 }}>
                          <span className="row" style={{ gap: 6, alignItems: "center" }}>
                            <span className="chip chip--accent">{a.subject}</span>
                            <span className="subtle">→</span>
                            <span className="row" style={{ gap: 4, flexWrap: "wrap" }}>
                              {a.classes.map((cid) => (
                                <span key={cid} className="chip mono tnum">{getClassName(cid)}</span>
                              ))}
                            </span>
                          </span>
                        </div>
                        <button
                          type="button"
                          className="iconbtn"
                          onClick={() => handleDeleteAssignment(a._id || a.id)}
                          disabled={savingAssignments}
                          aria-label="Remove assignment"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ borderTop: "1px solid var(--divider)", paddingTop: 14 }}>
                <div className="card__title" style={{ fontSize: 12, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--fg-subtle)" }}>
                  Add new assignment
                </div>
                <div className="col" style={{ gap: 10 }}>
                  <Select
                    label="Subject"
                    placeholder="Select a subject"
                    selectedKeys={newAssignment.subject ? [newAssignment.subject] : []}
                    onSelectionChange={(keys) => {
                      const subject = Array.from(keys)[0] || "";
                      setNewAssignment({ subject, classes: [] });
                    }}
                    variant="bordered"
                  >
                    {getTeacherSubjects().map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </Select>

                  {newAssignment.subject && (
                    <Select
                      label="Classes"
                      placeholder="Select one or more classes"
                      selectionMode="multiple"
                      selectedKeys={newAssignment.classes.map(String)}
                      onSelectionChange={(keys) =>
                        setNewAssignment({ ...newAssignment, classes: Array.from(keys) })
                      }
                      variant="bordered"
                    >
                      {classesWithTeachers.map((c) => (
                        <SelectItem
                          key={String(c.id || c._id)}
                          value={String(c.id || c._id)}
                          textValue={`Class ${c.name}-${c.section}`}
                        >
                          Class {c.name}-{c.section}
                        </SelectItem>
                      ))}
                    </Select>
                  )}

                  <button
                    type="button"
                    className="btn btn--accent"
                    onClick={handleAddAssignment}
                    disabled={
                      !newAssignment.subject ||
                      newAssignment.classes.length === 0 ||
                      savingAssignments
                    }
                  >
                    <Plus size={12} /> Add assignment
                  </button>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <button type="button" className="btn btn--accent" onClick={onAssignmentsClose}>
              Done
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmClearOpen}
        onClose={onConfirmClearClose}
        onConfirm={confirmClearSlot}
        title="Clear timetable slot"
        message="Are you sure you want to clear this slot? This will remove the class assignment from both the teacher and class timetables."
        confirmText="Clear slot"
        cancelText="Cancel"
        variant="danger"
        isLoading={syncStatus === "syncing"}
      />
    </div>
  );
}
