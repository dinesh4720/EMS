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

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const defaultPeriods = [
  { name: "Period 1", startTime: "08:00", endTime: "08:45", isBreak: false },
  { name: "Period 2", startTime: "08:45", endTime: "09:30", isBreak: false },
  { name: "Break", startTime: "09:30", endTime: "09:45", isBreak: true },
  { name: "Period 3", startTime: "09:45", endTime: "10:30", isBreak: false },
  { name: "Period 4", startTime: "10:30", endTime: "11:15", isBreak: false },
  { name: "Lunch", startTime: "11:15", endTime: "12:00", isBreak: true },
  { name: "Period 5", startTime: "12:00", endTime: "12:45", isBreak: false },
  { name: "Period 6", startTime: "12:45", endTime: "13:30", isBreak: false },
];

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
  const { classesWithTeachers, schoolSettings } = useApp();
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
  const [editingSlot, setEditingSlot] = useState(null);
  const [slotForm, setSlotForm] = useState({ classId: "", subject: "", room: "" });
  const [availableClasses, setAvailableClasses] = useState([]);

  // Check if user can edit this teacher's timetable
  // Only admins can edit teacher timetables, teachers can only view their own
  const isOwnTimetable = user?.id === teacherId;
  const isAdmin = hasPermission('staff', 'edit') && user?.role?.toLowerCase().includes('admin');
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
      const response = await teacherTimetableApi.get(teacherId, schoolSettings.academicYear);
      
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
        emptySchedule[day] = periods.map(() => ({ classId: null, subject: "", room: "" }));
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
      setTeacherAssignments(response.assignments || []);
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
      const response = await teacherTimetableApi.getConflicts(teacherId, schoolSettings.academicYear);
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

    const slot = schedule[day]?.[periodIndex] || { classId: null, subject: "", room: "" };
    setEditingSlot({ day, periodIndex });
    setSlotForm({ 
      classId: slot.classId || "", 
      subject: slot.subject || "", 
      room: slot.room || "" 
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

    // Find all classes where teacher is assigned to teach this subject
    const classesForSubject = [];
    teacherAssignments.forEach(assignment => {
      if (assignment.subject === subject) {
        assignment.classes.forEach(classId => {
          const classData = classesWithTeachers.find(c => 
            String(c.id) === String(classId) || String(c._id) === String(classId)
          );
          if (classData && !classesForSubject.find(c => String(c.id) === String(classData.id))) {
            classesForSubject.push(classData);
          }
        });
      }
    });

    setAvailableClasses(classesForSubject);
  };

  const handleClassSwitch = async () => {
    if (!editingSlot || !slotForm.classId || !slotForm.subject) {
      showWarningToast('Please select both a class and subject');
      return;
    }

    const { day, periodIndex } = editingSlot;

    // Validate that teacher is qualified to teach this subject in this class
    const isQualified = teacherAssignments.some(assignment => 
      assignment.subject === slotForm.subject && 
      assignment.classes.some(classId => 
        String(classId) === String(slotForm.classId)
      )
    );

    if (!isQualified) {
      showWarningToast(`Teacher is not assigned to teach ${slotForm.subject} in this class. Please update teacher assignments first.`);
      return;
    }

    const result = await executeWithFeedback(
      async () => {
        setSyncStatus('syncing');

        const slotData = {
          day,
          periodIndex,
          classId: slotForm.classId,
          subject: slotForm.subject,
          room: slotForm.room,
          academicYear: schoolSettings.academicYear
        };

        await teacherTimetableApi.updateSlot(teacherId, slotData);

        // Update local state
        const newSchedule = { ...schedule };
        if (!newSchedule[day]) newSchedule[day] = [];
        
        // Ensure the array is long enough
        while (newSchedule[day].length <= periodIndex) {
          newSchedule[day].push({ classId: null, subject: "", room: "" });
        }
        
        newSchedule[day][periodIndex] = {
          classId: slotForm.classId,
          subject: slotForm.subject,
          room: slotForm.room
        };

        setSchedule(newSchedule);
        setSyncStatus('success');
        
        return newSchedule;
      },
      {
        loadingMessage: 'Saving and syncing timetable...',
        successMessage: 'Teacher timetable updated and synced successfully!',
        errorMessage: null,
        retries: 2,
        onSuccess: async () => {
          // Clear success status after 2 seconds
          setTimeout(() => setSyncStatus(null), 2000);

          onSlotClose();
          setEditingSlot(null);
          setSlotForm({ classId: "", subject: "", room: "" });

          // Reload timetable and conflicts to get synced data
          await loadTimetable();
          await loadConflicts();
        },
        onError: (error) => {
          setSyncStatus('error');
          
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
          room: "",
          academicYear: schoolSettings.academicYear
        };

        await teacherTimetableApi.updateSlot(teacherId, slotData);

        // Update local state
        const newSchedule = { ...schedule };
        if (!newSchedule[day]) newSchedule[day] = [];
        
        // Ensure the array is long enough
        while (newSchedule[day].length <= periodIndex) {
          newSchedule[day].push({ classId: null, subject: "", room: "" });
        }
        
        newSchedule[day][periodIndex] = {
          classId: null,
          subject: "",
          room: ""
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
          setSlotForm({ classId: "", subject: "", room: "" });

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

  const getClassName = (classId) => {
    if (!classId) return "";
    const classData = classesWithTeachers.find(c => 
      String(c.id) === String(classId) || String(c._id) === String(classId)
    );
    return classData ? `${classData.name}-${classData.section}` : "";
  };

  // Get unique subjects from teacher assignments
  const getTeacherSubjects = () => {
    const subjects = new Set();
    teacherAssignments.forEach(assignment => {
      subjects.add(assignment.subject);
    });
    return Array.from(subjects);
  };

  // Get assigned classes for display
  const getAssignedClassesDisplay = () => {
    const classSubjectMap = {};
    
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
            {schoolSettings.academicYear}
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
      {!loadingAssignments && teacherAssignments.length > 0 && (
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
                      const slot = schedule[day]?.[i] || { classId: null, subject: "", room: "" };

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
                                  {slot.room && (
                                    <Chip size="sm" variant="flat" className="text-[8px] h-3.5 px-1 min-w-0">
                                      {slot.room}
                                    </Chip>
                                  )}
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
                description={`Subjects you teach: ${getTeacherSubjects().join(', ') || 'None assigned'}`}
              >
                {getTeacherSubjects().map(subject => (
                  <SelectItem key={subject} textValue={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </Select>

              {/* Class Selection - only show classes where teacher is assigned for this subject */}
              {slotForm.subject && (
                <Select
                  label="Class"
                  placeholder={availableClasses.length > 0 ? "Select class" : "No classes available"}
                  selectedKeys={slotForm.classId ? [String(slotForm.classId)] : []}
                  onSelectionChange={(keys) => setSlotForm({ ...slotForm, classId: Array.from(keys)[0] || "" })}
                  variant="bordered"
                  isDisabled={availableClasses.length === 0}
                  description={
                    availableClasses.length === 0
                      ? "You are not assigned to teach this subject in any class"
                      : `${availableClasses.length} class(es) available`
                  }
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

              <Input
                label="Room"
                placeholder="e.g., Room 101 (optional)"
                value={slotForm.room}
                onValueChange={(v) => setSlotForm({ ...slotForm, room: v })}
                variant="bordered"
              />

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
