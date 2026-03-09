import { useState, useEffect } from "react";
import { Card, CardBody, Button, Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Input, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Spinner } from "@heroui/react";
import { motion } from "framer-motion";
import { Plus, X, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { usePermissions } from "../../context/PermissionContext";
import { teacherTimetableApi, teacherAssignmentsApi } from "../../services/api";
import ConflictIndicator from "../../components/ConflictIndicator";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
  showErrorToast,
  showSuccessToast,
  showWarningToast,
  executeWithFeedback,
  parseError,
  formatConflictDetails
} from "../../utils/errorHandling";
import { DEFAULT_PERIODS, TIMETABLE_DAYS } from "../../utils/constants";

const days = TIMETABLE_DAYS;
const defaultPeriods = DEFAULT_PERIODS;

const getSubjectColor = (subject) => {
  if (!subject) return "default";
  const colors = {
    Mathematics: "primary", Math: "primary",
    Science: "success", Physics: "success", Chemistry: "success", Biology: "success",
    English: "warning",
    Hindi: "danger",
    History: "secondary", Geography: "secondary", "Social Studies": "secondary",
    Computer: "secondary", "Computer Science": "secondary",
    Art: "warning",
    Music: "success",
    Library: "default",
    PT: "danger", "Physical Education": "danger"
  };
  return colors[subject] || "default";
};

export default function TeacherTimetableEditor({ teacherId, teacherName }) {
  const { classesWithTeachers, schoolSettings, currentAcademicYear } = useApp();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [timetable, setTimetable] = useState(null);
  const [periods, setPeriods] = useState(defaultPeriods);
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(false);
  const [teacher, setTeacher] = useState(null);
  
  // Teacher assignments (subject-class associations)
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  
  // Conflict detection
  const [conflicts, setConflicts] = useState([]);
  const [loadingConflicts, setLoadingConflicts] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null); // 'syncing', 'success', 'error'

  // Modals
  const { isOpen: isSlotOpen, onOpen: onSlotOpen, onClose: onSlotClose } = useDisclosure();
  const { isOpen: isConfirmClearOpen, onOpen: onConfirmClearOpen, onClose: onConfirmClearClose } = useDisclosure();
  const { isOpen: isAssignmentsOpen, onOpen: onAssignmentsOpen, onClose: onAssignmentsClose } = useDisclosure();
  const [editingSlot, setEditingSlot] = useState(null);
  const [slotForm, setSlotForm] = useState({ classId: "", subject: "" });
  const [availableClasses, setAvailableClasses] = useState([]);

  // Assignments modal state
  const [newAssignment, setNewAssignment] = useState({ subject: "", classes: [] });
  const [savingAssignments, setSavingAssignments] = useState(false);

  // Check if user can edit this teacher's timetable
  // Only admins can edit teacher timetables, teachers can only view their own
  const isOwnTimetable = user?.id === teacherId;
  const userRole = user?.role;
  const isAdmin = hasPermission('staff', 'edit') && (
    (Array.isArray(userRole) ? userRole.some(r => r?.toLowerCase()?.includes('admin')) : userRole?.toLowerCase()?.includes('admin'))
  );
  const canEdit = isAdmin;
  const canView = isAdmin || isOwnTimetable;

  // Load timetable when component mounts
  useEffect(() => {
    if (teacherId) {
      loadTimetable();
      loadTeacherAssignments();
      loadConflicts();
    }
  }, [teacherId]);

  const loadTimetable = async () => {
    try {
      setLoading(true);
      const response = await teacherTimetableApi.get(teacherId, currentAcademicYear);
      
      if (response.success) {
        setTimetable(response.timetable);
        setTeacher(response.teacher);
        
        // Convert timetable schedule to our format
        const convertedSchedule = {};
        days.forEach(day => {
          convertedSchedule[day] = response.timetable.schedule[day] || [];
        });
        setSchedule(convertedSchedule);
      }
    } catch (err) {
      console.error('Failed to load teacher timetable:', err);
      showErrorToast(err, 'Failed to load teacher timetable. Please try again.');
      // Initialize empty schedule
      const emptySchedule = {};
      days.forEach(day => {
        emptySchedule[day] = periods.map(() => ({ classId: null, subject: "" }));
      });
      setSchedule(emptySchedule);
    } finally {
      setLoading(false);
    }
  };

  const loadTeacherAssignments = async () => {
    try {
      setLoadingAssignments(true);
      const response = await teacherAssignmentsApi.getAll(teacherId);
      // Handle both response formats: { assignments: [] } or direct array []
      const assignments = Array.isArray(response) ? response : (response?.assignments || []);
      setTeacherAssignments(assignments);
    } catch (err) {
      console.error('Failed to load teacher assignments:', err);
      showErrorToast(err, 'Failed to load teacher assignments.');
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
      
      if (response.conflicts?.length > 0) {
        showWarningToast(`${response.conflicts.length} scheduling conflict(s) detected.`);
      }
    } catch (err) {
      console.error('Failed to load conflicts:', err);
      showErrorToast(err, 'Failed to load conflicts.');
      setConflicts([]);
    } finally {
      setLoadingConflicts(false);
    }
  };

  const handleSlotClick = (day, periodIndex) => {
    const period = periods[periodIndex];
    if (period.isBreak) return;
    
    // Only allow editing if user has permission
    if (!canEdit) {
      showWarningToast('You do not have permission to edit this timetable. Only administrators can edit teacher timetables.');
      return;
    }

    const slot = schedule[day]?.[periodIndex] || { classId: null, subject: "" };
    setEditingSlot({ day, periodIndex });
    setSlotForm({
      classId: slot.classId || "",
      subject: slot.subject || ""
    });

    // Filter available classes based on teacher assignments
    updateAvailableClasses(slot.subject || "");
    
    onSlotOpen();
  };

  // Update available classes when subject changes
  useEffect(() => {
    if (isSlotOpen && slotForm.subject) {
      updateAvailableClasses(slotForm.subject);
    }
  }, [slotForm.subject, isSlotOpen]);

  const updateAvailableClasses = (subject) => {
    if (!subject) {
      setAvailableClasses([]);
      return;
    }

    // Always show all classes - assignments are optional and informational only
    // This allows flexible scheduling without being blocked by assignment requirements
    setAvailableClasses(classesWithTeachers);
  };

  const handleClassSwitch = async () => {
    if (!editingSlot || !slotForm.classId || !slotForm.subject) {
      showWarningToast('Please select both a class and subject');
      return;
    }

    const { day, periodIndex } = editingSlot;

    // Note: Assignments are now optional - any teacher can be scheduled for any subject/class
    // The assignment system is purely informational and doesn't restrict scheduling
    // However, the backend still validates - we catch that error and show helpful message

    const result = await executeWithFeedback(
      async () => {
        setSyncStatus('syncing');

        const slotData = {
          day,
          periodIndex,
          classId: slotForm.classId,
          subject: slotForm.subject,
          academicYear: currentAcademicYear
        };

        await teacherTimetableApi.updateSlot(teacherId, slotData);

        // Update local state
        const newSchedule = { ...schedule };
        if (!newSchedule[day]) newSchedule[day] = [];

        // Ensure the array is long enough
        while (newSchedule[day].length <= periodIndex) {
          newSchedule[day].push({ classId: null, subject: "" });
        }

        newSchedule[day][periodIndex] = {
          classId: slotForm.classId,
          subject: slotForm.subject
        };

        setSchedule(newSchedule);
        setSyncStatus('success');

        return newSchedule;
      },
      {
        loadingMessage: 'Saving and syncing timetable...',
        successMessage: 'Teacher timetable updated and synced successfully!',
        errorMessage: 'Failed to update timetable',
        retries: 2,
        onSuccess: async () => {
          // Clear success status after 2 seconds
          setTimeout(() => setSyncStatus(null), 2000);

          onSlotClose();
          setEditingSlot(null);
          setSlotForm({ classId: "", subject: "" });

          // Reload timetable and conflicts to get synced data
          await loadTimetable();
          await loadConflicts();
        },
        onError: (error) => {
          setSyncStatus('error');

          // Check if it's the backend qualification validation error
          if (error.message?.includes('not qualified')) {
            showErrorToast(
              error,
              'Backend validation: Teacher must be assigned to teach this subject in this class. ' +
              'Please create a staff assignment first, or ask your admin to disable backend validation.'
            );
            return;
          }

          // Check if error is a conflict or validation error
          if (error.type === 'ConflictError') {
            showWarningToast(formatConflictDetails(error));
          } else if (error.type === 'ValidationError') {
            // Error already shown by executeWithFeedback
          }
        }
      }
    );
  };

  const handleClearSlot = async () => {
    if (!editingSlot) return;

    // Show confirmation dialog
    onConfirmClearOpen();
  };

  const confirmClearSlot = async () => {
    if (!editingSlot) return;

    const { day, periodIndex } = editingSlot;

    const result = await executeWithFeedback(
      async () => {
        setSyncStatus('syncing');

        const slotData = {
          day,
          periodIndex,
          classId: null,
          subject: "",
          academicYear: currentAcademicYear
        };

        await teacherTimetableApi.updateSlot(teacherId, slotData);

        // Update local state
        const newSchedule = { ...schedule };
        if (!newSchedule[day]) newSchedule[day] = [];

        // Ensure the array is long enough
        while (newSchedule[day].length <= periodIndex) {
          newSchedule[day].push({ classId: null, subject: "" });
        }

        newSchedule[day][periodIndex] = {
          classId: null,
          subject: ""
        };

        setSchedule(newSchedule);
        setSyncStatus('success');
        
        return newSchedule;
      },
      {
        loadingMessage: 'Clearing slot and syncing...',
        successMessage: 'Slot cleared and synced successfully!',
        errorMessage: null,
        retries: 2,
        onSuccess: async () => {
          // Clear success status after 2 seconds
          setTimeout(() => setSyncStatus(null), 2000);

          onConfirmClearClose();
          onSlotClose();
          setEditingSlot(null);
          setSlotForm({ classId: "", subject: "" });

          // Reload timetable and conflicts to get synced data
          await loadTimetable();
          await loadConflicts();
        },
        onError: (error) => {
          setSyncStatus('error');
          onConfirmClearClose();
        }
      }
    );
  };

  // Assignment management functions
  const handleAddAssignment = async () => {
    if (!newAssignment.subject || newAssignment.classes.length === 0) {
      showWarningToast('Please select a subject and at least one class');
      return;
    }

    setSavingAssignments(true);
    try {
      const assignmentData = {
        teacherId,
        subject: newAssignment.subject,
        classIds: newAssignment.classes // Backend expects 'classIds' not 'classes'
      };

      await teacherAssignmentsApi.create(assignmentData);
      showSuccessToast('Assignment added successfully');

      // Reload assignments
      const response = await teacherAssignmentsApi.getAll(teacherId);
      const updatedAssignments = Array.isArray(response) ? response : (response?.assignments || []);
      setTeacherAssignments(updatedAssignments);

      // Reset form
      setNewAssignment({ subject: "", classes: [] });
    } catch (error) {
      showErrorToast(error, 'Failed to add assignment');
    } finally {
      setSavingAssignments(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    setSavingAssignments(true);
    try {
      await teacherAssignmentsApi.delete(assignmentId, teacherId);
      showSuccessToast('Assignment removed successfully');

      // Reload assignments
      const response = await teacherAssignmentsApi.getAll(teacherId);
      const updatedAssignments = Array.isArray(response) ? response : (response?.assignments || []);
      setTeacherAssignments(updatedAssignments);
    } catch (error) {
      showErrorToast(error, 'Failed to remove assignment');
    } finally {
      setSavingAssignments(false);
    }
  };

  const getClassName = (classId) => {
    if (!classId) return "";
    const classData = classesWithTeachers.find(c => 
      String(c.id) === String(classId) || String(c._id) === String(classId)
    );
    return classData ? `${classData.name}-${classData.section}` : "";
  };

  // Get unique subjects from teacher assignments, or all school subjects if no assignments
  const getTeacherSubjects = () => {
    // First, try to get subjects from teacher assignments
    const assignedSubjects = new Set();

    // Defensive check - ensure teacherAssignments is an array
    if (Array.isArray(teacherAssignments)) {
      teacherAssignments.forEach(assignment => {
        if (assignment.subject) {
          assignedSubjects.add(assignment.subject);
        }
      });
    }

    const assignedArray = Array.from(assignedSubjects);

    // If teacher has assigned subjects, return those first, then add all school subjects
    // This allows flexible scheduling while highlighting assigned subjects
    const allSubjects = new Set(assignedArray);
    
    if (schoolSettings?.subjects && Array.isArray(schoolSettings.subjects)) {
      schoolSettings.subjects.forEach(s => {
        const subjectName = s.name || s.subject;
        if (subjectName) {
          allSubjects.add(subjectName);
        }
      });
    }

    return Array.from(allSubjects);
  };

  // Get assigned classes for display
  const getAssignedClassesDisplay = () => {
    const classSubjectMap = {};

    // Defensive check - ensure teacherAssignments is an array
    if (Array.isArray(teacherAssignments)) {
      teacherAssignments.forEach(assignment => {
        assignment.classes.forEach(classId => {
          const className = getClassName(classId);
          if (className) {
            if (!classSubjectMap[className]) {
              classSubjectMap[className] = [];
            }
            if (!classSubjectMap[className].includes(assignment.subject)) {
              classSubjectMap[className].push(assignment.subject);
            }
          }
        });
      });
    }

    return classSubjectMap;
  };

  if (!teacherId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-default-500">No teacher selected</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Header with Teacher Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-default-900">
            {teacherName || teacher?.name || 'Teacher'} Timetable
          </h3>
          <Chip size="sm" variant="flat" color="primary" className="h-7">
            {currentAcademicYear}
          </Chip>
          {/* Sync Status Indicator */}
          {syncStatus === 'syncing' && (
            <Chip size="sm" variant="flat" color="default" className="h-7" startContent={<Spinner size="sm" />}>
              Syncing...
            </Chip>
          )}
          {syncStatus === 'success' && (
            <Chip size="sm" variant="flat" color="success" className="h-7" startContent={<CheckCircle2 size={14} />}>
              Synced
            </Chip>
          )}
          {syncStatus === 'error' && (
            <Chip size="sm" variant="flat" color="danger" className="h-7" startContent={<AlertTriangle size={14} />}>
              Sync Failed
            </Chip>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            color="primary"
            variant="flat"
            radius="md"
            startContent={<Plus size={14} />}
            onPress={onAssignmentsOpen}
            className="h-9"
          >
            Manage Subjects & Classes
          </Button>
          <Button
            size="sm"
            variant="flat"
            radius="md"
            startContent={<RefreshCw size={14} />}
            onPress={() => {
              loadTimetable();
              loadConflicts();
            }}
            isLoading={loading || loadingConflicts}
            className="h-9"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Teacher Assignments Display */}
      {!loadingAssignments && Array.isArray(teacherAssignments) && teacherAssignments.length > 0 && (
        <Card className="shadow-sm border border-default-200">
          <CardBody className="p-4">
            <h4 className="text-sm font-semibold text-default-700 mb-3">Assigned Classes & Subjects</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(getAssignedClassesDisplay()).map(([className, subjects]) => (
                <Chip
                  key={className}
                  size="sm"
                  variant="flat"
                  color="primary"
                  className="text-xs"
                >
                  {className}: {subjects.join(', ')}
                </Chip>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Helpful Info Panel */}
      {!loadingAssignments && (!Array.isArray(teacherAssignments) || teacherAssignments.length === 0) && (
        <Card className="shadow-sm border border-primary-200 bg-primary-50">
          <CardBody className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-primary-800">No Subject Assignments Yet</p>
                <p className="text-xs text-primary-700 mt-1">
                  Click "Manage Subjects & Classes" to assign which subjects and classes this teacher can teach. 
                  You can still schedule classes without assignments, but assignments help organize and validate schedules.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Permission Notice */}
      {!canEdit && canView && (
        <Card className="shadow-sm border border-warning-200 bg-warning-50">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} className="text-warning-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-warning-800">View-Only Mode</p>
                <p className="text-xs text-warning-700 mt-1">
                  {isOwnTimetable 
                    ? "You can view your timetable but cannot edit it. Contact an administrator to make changes."
                    : "You can only view this timetable. Only administrators can edit teacher timetables."}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {!canView && (
        <Card className="shadow-sm border border-danger-200 bg-danger-50">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} className="text-danger-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-danger-800">Access Denied</p>
                <p className="text-xs text-danger-700 mt-1">
                  You do not have permission to view this teacher's timetable.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Conflicts Display using ConflictIndicator */}
      {conflicts.length > 0 && (
        <ConflictIndicator
          conflicts={conflicts}
          onResolve={(resolutionData) => {
            const { action, conflict, classId } = resolutionData;
            
            if (action === 'remove_current') {
              // Clear the conflicting slot
              const { day, periodIndex } = conflict;
              handleClearSlot();
            } else if (action === 'choose_different') {
              // User needs to select a different class
              alert('Please select a different class or time slot to avoid the conflict.');
            } else if (action === 'remove_from_class') {
              // This would require additional API call to remove teacher from conflicting class
              alert(`To resolve this conflict, please go to ${resolutionData.resolution.className} timetable and remove the teacher from that slot.`);
            } else if (action === 'update_assignments') {
              alert('Please go to Staff Assignments to add this subject-class assignment to the teacher.');
            }
            
            // Reload conflicts after resolution attempt
            loadConflicts();
          }}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-6 px-6">
          <div className="min-w-[800px]">
            <Table
              aria-label="Teacher Timetable"
              shadow="none"
              isStriped={false}
              radius="none"
              classNames={{
                base: "border border-default-200 rounded-lg overflow-hidden",
                table: "w-full",
                th: "bg-default-100 text-default-600 font-semibold text-[11px] uppercase tracking-wider h-10 border-b border-default-200 text-center first:text-left",
                td: "p-1.5 border-b border-default-100 last:border-b-0",
                tr: "hover:bg-default-50/30 transition-colors",
                wrapper: "p-0"
              }}
            >
              <TableHeader>
                <TableColumn className="w-24 sticky left-0 z-10 bg-default-100">Day</TableColumn>
                {periods.map((period, i) => (
                  <TableColumn key={i} className={period.isBreak ? "bg-warning-50/50 w-16" : "w-32"}>
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <span className="text-[11px] font-bold">{period.name}</span>
                      <span className="text-[9px] text-default-400 font-normal">
                        {period.startTime}-{period.endTime}
                      </span>
                    </div>
                  </TableColumn>
                ))}
              </TableHeader>
              <TableBody>
                {days.map((day) => (
                  <TableRow key={day}>
                    <TableCell className="font-semibold text-default-700 bg-default-50/50 border-r border-default-200 sticky left-0 z-10 text-xs">
                      <span className="hidden sm:inline">{day}</span>
                      <span className="sm:hidden">{day.slice(0, 3)}</span>
                    </TableCell>
                    {periods.map((period, i) => {
                      const slot = schedule[day]?.[i] || { classId: null, subject: "" };

                      if (period.isBreak) {
                        return (
                          <TableCell key={i} className="text-center bg-warning-50/20 p-0">
                            <div className="h-20 flex items-center justify-center">
                              <span className="text-[9px] font-semibold uppercase tracking-wider text-warning-600 opacity-60 rotate-90">
                                {period.name}
                              </span>
                            </div>
                          </TableCell>
                        );
                      }

                      // Check if this slot has a conflict
                      const hasConflict = conflicts.some(c => 
                        c.day === day && c.periodIndex === i
                      );

                      return (
                        <TableCell key={i} className="p-1">
                          {slot.classId && slot.subject ? (
                            <motion.div whileHover={{ scale: canEdit ? 1.03 : 1 }} whileTap={{ scale: canEdit ? 0.97 : 1 }}>
                              <Card
                                isPressable={canEdit}
                                shadow="none"
                                onPress={() => canEdit && handleSlotClick(day, i)}
                                className={`w-full h-20 ${
                                  hasConflict 
                                    ? 'bg-danger-50 border-2 border-danger-300' 
                                    : `bg-${getSubjectColor(slot.subject)}-50 border border-${getSubjectColor(slot.subject)}-200 ${canEdit ? `hover:border-${getSubjectColor(slot.subject)}-300` : ''}`
                                } ${canEdit ? 'hover:shadow-sm' : 'cursor-default'} transition-all duration-150`}
                              >
                                <CardBody className="p-1.5 flex flex-col justify-center items-center gap-0.5">
                                  {hasConflict && (
                                    <AlertTriangle size={12} className="text-danger-500 mb-0.5" />
                                  )}
                                  <span className={`text-[10px] font-bold ${
                                    hasConflict ? 'text-danger-700' : `text-${getSubjectColor(slot.subject)}-700`
                                  } text-center line-clamp-1 leading-tight`}>
                                    {getClassName(slot.classId)}
                                  </span>
                                  <span className="text-[9px] text-default-600 text-center line-clamp-1 w-full px-1">
                                    {slot.subject}
                                  </span>
                                </CardBody>
                              </Card>
                            </motion.div>
                          ) : (
                            <div
                              className={`w-full h-20 border border-dashed border-default-200 rounded-md flex items-center justify-center text-default-300 transition-all ${
                                canEdit 
                                  ? 'hover:border-primary hover:text-primary hover:bg-primary-50/10 cursor-pointer' 
                                  : 'cursor-not-allowed opacity-50'
                              }`}
                              onClick={() => canEdit && handleSlotClick(day, i)}
                            >
                              <Plus size={16} />
                            </div>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Edit Slot Modal */}
      <Modal isOpen={isSlotOpen} onClose={onSlotClose} size="md">
        <ModalContent>
          <ModalHeader>
            {editingSlot && `Edit ${editingSlot.day} - ${periods[editingSlot.periodIndex]?.name}`}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {/* Subject Selection */}
              <Select
                label="Subject"
                placeholder="Select subject"
                selectedKeys={slotForm.subject ? [slotForm.subject] : []}
                onSelectionChange={(keys) => {
                  const subject = Array.from(keys)[0] || "";
                  setSlotForm({ ...slotForm, subject, classId: "" }); // Reset class when subject changes
                }}
                variant="bordered"
                description={
                  Array.isArray(teacherAssignments) && teacherAssignments.length > 0
                    ? `Assigned subjects highlighted. All subjects available for scheduling.`
                    : `All subjects available for scheduling`
                }
              >
                {getTeacherSubjects().map(subject => {
                  const isAssigned = Array.isArray(teacherAssignments) && 
                    teacherAssignments.some(a => a.subject === subject);
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

              {/* Class Selection - show all classes for flexible scheduling */}
              {slotForm.subject && (
                <Select
                  label="Class"
                  placeholder="Select class"
                  selectedKeys={slotForm.classId ? [String(slotForm.classId)] : []}
                  onSelectionChange={(keys) => setSlotForm({ ...slotForm, classId: Array.from(keys)[0] || "" })}
                  variant="bordered"
                  description={`${availableClasses.length} class(es) available`}
                >
                  {availableClasses.map(classData => (
                    <SelectItem
                      key={String(classData.id || classData._id)}
                      textValue={`Class ${classData.name}-${classData.section}`}
                    >
                      Class {classData.name}-{classData.section}
                    </SelectItem>
                  ))}
                </Select>
              )}

              {slotForm.classId && (
                <Button
                  size="sm"
                  color="danger"
                  variant="flat"
                  startContent={<X size={14} />}
                  onPress={handleClearSlot}
                  className="w-full"
                  isLoading={syncStatus === 'syncing'}
                >
                  Clear Slot
                </Button>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onSlotClose}>Cancel</Button>
            <Button
              color="primary"
              onPress={handleClassSwitch}
              isDisabled={!slotForm.subject || !slotForm.classId}
              isLoading={syncStatus === 'syncing'}
            >
              {syncStatus === 'syncing' ? 'Saving & Syncing...' : 'Save'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Manage Assignments Modal */}
      <Modal isOpen={isAssignmentsOpen} onClose={onAssignmentsClose} size="2xl">
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center justify-between w-full pr-6">
              <div>
                <h3 className="text-lg font-bold">Manage Subjects & Classes</h3>
                <p className="text-sm text-default-500 mt-1">
                  Assign which subjects and classes {teacherName || 'this teacher'} can teach
                </p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {/* Current Assignments */}
              <div>
                <h4 className="text-sm font-semibold text-default-700 mb-3">Current Assignments</h4>
                {!Array.isArray(teacherAssignments) || teacherAssignments.length === 0 ? (
                  <div className="text-center py-8 bg-default-50 rounded-lg border border-dashed border-default-300">
                    <p className="text-default-500">No assignments yet. Add one below.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {teacherAssignments.map((assignment) => (
                      <div
                        key={assignment._id || assignment.id}
                        className="flex items-center justify-between p-3 bg-default-50 rounded-lg border border-default-200"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Chip size="sm" color="primary" variant="flat">
                              {assignment.subject}
                            </Chip>
                            <span className="text-default-600 text-sm">→</span>
                            <div className="flex flex-wrap gap-1">
                              {assignment.classes.map((classId) => (
                                <Chip
                                  key={classId}
                                  size="sm"
                                  variant="bordered"
                                  className="text-xs"
                                >
                                  {getClassName(classId)}
                                </Chip>
                              ))}
                            </div>
                          </div>
                        </div>
                        <Button
                          isIconOnly
                          size="sm"
                          color="danger"
                          variant="light"
                          onPress={() => handleDeleteAssignment(assignment._id || assignment.id)}
                          isLoading={savingAssignments}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Assignment */}
              <div className="border-t border-default-200 pt-4">
                <h4 className="text-sm font-semibold text-default-700 mb-3">Add New Assignment</h4>
                <div className="space-y-3">
                  <Select
                    label="Subject"
                    placeholder="Select a subject"
                    selectedKeys={newAssignment.subject ? [newAssignment.subject] : []}
                    onSelectionChange={(keys) => {
                      const subject = Array.from(keys)[0] || "";
                      setNewAssignment({ ...newAssignment, subject, classes: [] });
                    }}
                    variant="bordered"
                  >
                    {getTeacherSubjects().map(subject => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </Select>

                  {newAssignment.subject && (
                    <Select
                      label="Classes"
                      placeholder="Select one or more classes"
                      selectionMode="multiple"
                      selectedKeys={newAssignment.classes.map(String)}
                      onSelectionChange={(keys) => {
                        const selectedClasses = Array.from(keys);
                        setNewAssignment({ ...newAssignment, classes: selectedClasses });
                      }}
                      variant="bordered"
                    >
                      {classesWithTeachers.map((classData) => (
                        <SelectItem
                          key={String(classData.id || classData._id)}
                          value={String(classData.id || classData._id)}
                          textValue={`Class ${classData.name}-${classData.section}`}
                        >
                          Class {classData.name}-{classData.section}
                        </SelectItem>
                      ))}
                    </Select>
                  )}

                  <Button
                    color="primary"
                    onPress={handleAddAssignment}
                    isDisabled={!newAssignment.subject || newAssignment.classes.length === 0}
                    isLoading={savingAssignments}
                    startContent={<Plus size={14} />}
                    className="w-full"
                  >
                    Add Assignment
                  </Button>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={onAssignmentsClose}>
              Done
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmClearOpen}
        onClose={onConfirmClearClose}
        onConfirm={confirmClearSlot}
        title="Clear Timetable Slot"
        message="Are you sure you want to clear this slot? This will remove the class assignment from both the teacher and class timetables."
        confirmText="Clear Slot"
        cancelText="Cancel"
        variant="danger"
        isLoading={syncStatus === 'syncing'}
      />
    </div>
  );
}
