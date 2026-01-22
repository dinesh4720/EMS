import { useState, useEffect } from "react";
import { Card, CardBody, Button, Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Input, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Spinner } from "@heroui/react";
import { motion } from "framer-motion";
import { Settings, Plus, Trash2, Save, X, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { timetableApi, teacherAssignmentsApi } from "../../services/api";
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

export default function Timetable({ classId }) {
  const { classesWithTeachers, staff, schoolSettings } = useApp();
  const [selectedClass, setSelectedClass] = useState(classId || "");
  const [timetable, setTimetable] = useState(null);
  const [periods, setPeriods] = useState(defaultPeriods);
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // New state for conflict detection and available teachers
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [syncStatus, setSyncStatus] = useState(null); // 'syncing', 'success', 'error'

  // Modals
  const { isOpen: isPeriodsOpen, onOpen: onPeriodsOpen, onClose: onPeriodsClose } = useDisclosure();
  const { isOpen: isSlotOpen, onOpen: onSlotOpen, onClose: onSlotClose } = useDisclosure();
  const { isOpen: isConfirmClearOpen, onOpen: onConfirmClearOpen, onClose: onConfirmClearClose } = useDisclosure();
  const { isOpen: isConfirmSaveOpen, onOpen: onConfirmSaveOpen, onClose: onConfirmSaveClose } = useDisclosure();
  const [editingSlot, setEditingSlot] = useState(null);
  const [slotForm, setSlotForm] = useState({ subject: "", teacherId: "", room: "" });

  // Set first class as default
  useEffect(() => {
    if (classesWithTeachers.length > 0 && !selectedClass) {
      setSelectedClass(`${classesWithTeachers[0].id}`);
    }
  }, [classesWithTeachers, selectedClass]);

  // Load timetable when class changes
  useEffect(() => {
    if (selectedClass) {
      loadTimetable();
    }
  }, [selectedClass]);

  const loadTimetable = async () => {
    try {
      setLoading(true);
      const data = await timetableApi.getByClass(selectedClass, schoolSettings.academicYear);
      if (data) {
        setTimetable(data);
        setPeriods(data.periods || defaultPeriods);
        setSchedule(data.schedule || initializeSchedule());
      } else {
        // No timetable exists, initialize empty
        setPeriods(defaultPeriods);
        setSchedule(initializeSchedule());
        setTimetable(null);
      }
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to load timetable:', err);
      showErrorToast(err, 'Failed to load timetable. Please try again.');
      setPeriods(defaultPeriods);
      setSchedule(initializeSchedule());
    } finally {
      setLoading(false);
    }
  };

  const initializeSchedule = () => {
    const emptySchedule = {};
    days.forEach(day => {
      emptySchedule[day] = periods.map(() => ({ subject: "", teacherId: null, room: "" }));
    });
    return emptySchedule;
  };

  const handleSlotClick = (day, periodIndex) => {
    const period = periods[periodIndex];
    if (period.isBreak) return;

    const slot = schedule[day]?.[periodIndex] || { subject: "", teacherId: null, room: "" };
    setEditingSlot({ day, periodIndex });
    setSlotForm({ ...slot, teacherId: slot.teacherId || "" });
    setConflicts([]); // Clear previous conflicts
    onSlotOpen();
  };

  // Fetch available teachers when subject is selected
  useEffect(() => {
    if (isSlotOpen && slotForm.subject && editingSlot && selectedClass) {
      fetchAvailableTeachers();
    }
  }, [slotForm.subject, isSlotOpen, editingSlot, selectedClass]);

  const fetchAvailableTeachers = async () => {
    if (!slotForm.subject || !editingSlot || !selectedClass) return;

    try {
      setLoadingTeachers(true);
      const { day, periodIndex } = editingSlot;
      
      const params = {
        classId: selectedClass,
        subject: slotForm.subject,
        day,
        period: periodIndex
      };

      const response = await teacherAssignmentsApi.getAvailableTeachers(params);
      setAvailableTeachers(response.availableTeachers || []);
      
      if (response.availableTeachers?.length === 0) {
        showWarningToast('No qualified teachers are available for this subject and time slot.');
      }
    } catch (err) {
      console.error('Failed to fetch available teachers:', err);
      showErrorToast(err, 'Failed to load available teachers.');
      setAvailableTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  };

  // Check for conflicts when teacher is selected
  const checkConflict = async (teacherId) => {
    if (!teacherId || !editingSlot || !selectedClass) {
      setConflicts([]);
      return;
    }

    try {
      const { day, periodIndex } = editingSlot;
      
      // Call the conflict detection endpoint
      const params = {
        classId: selectedClass,
        subject: slotForm.subject,
        day,
        period: periodIndex
      };

      const response = await teacherAssignmentsApi.getAvailableTeachers(params);
      
      // Check if selected teacher is in available list
      const isAvailable = response.availableTeachers?.some(t => 
        String(t.id) === String(teacherId) || String(t._id) === String(teacherId)
      );

      if (!isAvailable && teacherId) {
        // Teacher has a conflict
        setConflicts([{
          type: 'double_booking',
          message: 'This teacher is already assigned to another class at this time',
          teacherId,
          day,
          period: periodIndex
        }]);
      } else {
        setConflicts([]);
      }
    } catch (err) {
      console.error('Failed to check conflicts:', err);
      setConflicts([]);
    }
  };

  // Update teacher selection handler to check conflicts
  const handleTeacherChange = (teacherId) => {
    setSlotForm({ ...slotForm, teacherId });
    checkConflict(teacherId);
  };

  const handleSaveSlot = async () => {
    if (!editingSlot) return;

    // Prevent saving if there are conflicts
    if (conflicts.length > 0) {
      showWarningToast('Cannot save: Teacher has a scheduling conflict. Please select a different teacher.');
      return;
    }

    const { day, periodIndex } = editingSlot;
    
    const result = await executeWithFeedback(
      async () => {
        setSyncStatus('syncing');
        
        const slotData = {
          day,
          periodIndex,
          subject: slotForm.subject,
          teacherId: slotForm.teacherId || null,
          room: slotForm.room
        };

        await timetableApi.updateSlot(selectedClass, slotData);
        
        // Update local state
        const newSchedule = { ...schedule };
        if (!newSchedule[day]) newSchedule[day] = [];
        newSchedule[day][periodIndex] = {
          subject: slotForm.subject,
          teacherId: slotForm.teacherId || null,
          room: slotForm.room
        };

        setSchedule(newSchedule);
        setSyncStatus('success');
        
        return newSchedule;
      },
      {
        loadingMessage: 'Saving and syncing timetable...',
        successMessage: 'Timetable slot saved and synced successfully!',
        errorMessage: null,
        retries: 2,
        onSuccess: async () => {
          // Clear success status after 2 seconds
          setTimeout(() => setSyncStatus(null), 2000);
          
          onSlotClose();
          setEditingSlot(null);
          setSlotForm({ subject: "", teacherId: "", room: "" });
          setConflicts([]);
          
          // Reload timetable to get synced data
          await loadTimetable();
        },
        onError: (error) => {
          setSyncStatus('error');
          
          // Check if error is a conflict error
          if (error.type === 'ConflictError') {
            setConflicts([{
              type: 'conflict_error',
              message: formatConflictDetails(error),
              details: error.details
            }]);
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
          subject: "",
          teacherId: null,
          room: ""
        };

        await timetableApi.updateSlot(selectedClass, slotData);
        
        // Update local state
        const newSchedule = { ...schedule };
        if (!newSchedule[day]) newSchedule[day] = [];
        newSchedule[day][periodIndex] = {
          subject: "",
          teacherId: null,
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
          setSlotForm({ subject: "", teacherId: "", room: "" });
          setConflicts([]);
          
          // Reload timetable to get synced data
          await loadTimetable();
        },
        onError: (error) => {
          setSyncStatus('error');
          onConfirmClearClose();
        }
      }
    );
  };

  const handleSaveTimetable = async () => {
    // Show confirmation dialog
    onConfirmSaveOpen();
  };

  const confirmSaveTimetable = async () => {
    const result = await executeWithFeedback(
      async () => {
        setLoading(true);
        await timetableApi.createOrUpdate({
          classId: selectedClass,
          academicYear: schoolSettings.academicYear,
          periods,
          schedule
        });
        setHasChanges(false);
        await loadTimetable();
      },
      {
        loadingMessage: 'Saving timetable...',
        successMessage: 'Timetable saved successfully!',
        errorMessage: null,
        retries: 2,
        onSuccess: () => {
          onConfirmSaveClose();
        },
        onError: () => {
          onConfirmSaveClose();
        }
      }
    );
    
    setLoading(false);
  };

  const handleSavePeriods = () => {
    setSchedule(initializeSchedule());
    setHasChanges(true);
    onPeriodsClose();
  };

  const addPeriod = () => {
    setPeriods([...periods, { name: `Period ${periods.length + 1}`, startTime: "14:00", endTime: "14:45", isBreak: false }]);
  };

  const removePeriod = (index) => {
    if (periods.length <= 1) return;
    setPeriods(periods.filter((_, i) => i !== index));
  };

  const updatePeriod = (index, field, value) => {
    const updated = [...periods];
    updated[index] = { ...updated[index], [field]: value };
    setPeriods(updated);
  };

  const getTeacherName = (teacherId) => {
    if (!teacherId) return "";
    const teacher = staff.find(s => s.id === teacherId || s.id === String(teacherId));
    return teacher?.name || "";
  };

  const selectedClassData = classesWithTeachers.find(c => String(c.id) === String(selectedClass));

  if (classesWithTeachers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-default-500">No classes available</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {!classId && (
            <Select
              size="sm"
              selectedKeys={selectedClass ? [selectedClass] : []}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-[160px]"
              aria-label="Select Class"
              variant="bordered"
              classNames={{
                trigger: "h-9"
              }}
            >
              {classesWithTeachers.map(c => (
                <SelectItem key={c.id} textValue={`Class ${c.name}-${c.section}`}>
                  Class {c.name}-{c.section}
                </SelectItem>
              ))}
            </Select>
          )}
          {selectedClassData && (
            <Chip size="sm" variant="flat" color="primary" className="h-7">
              {schoolSettings.academicYear}
            </Chip>
          )}
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
            startContent={<Settings size={14} />}
            onPress={onPeriodsOpen}
            className="h-9"
          >
            <span className="hidden sm:inline">Periods</span>
          </Button>
          {hasChanges && (
            <Button
              size="sm"
              color="primary"
              radius="md"
              startContent={<Save size={14} />}
              onPress={handleSaveTimetable}
              isLoading={loading}
              className="h-9"
            >
              Save
            </Button>
          )}
        </div>
      </div>

      {loading && !hasChanges ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-6 px-6">
          <div className="min-w-[800px]">
            <Table
              aria-label="Class Timetable"
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
                      const slot = schedule[day]?.[i] || { subject: "", teacherId: null, room: "" };

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

                      return (
                        <TableCell key={i} className="p-1">
                          {slot.subject ? (
                            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                              <Card
                                isPressable
                                shadow="none"
                                onPress={() => handleSlotClick(day, i)}
                                className={`w-full h-20 bg-${getSubjectColor(slot.subject)}-50 border border-${getSubjectColor(slot.subject)}-200 hover:border-${getSubjectColor(slot.subject)}-300 hover:shadow-sm transition-all duration-150`}
                              >
                                <CardBody className="p-1.5 flex flex-col justify-center items-center gap-0.5">
                                  <span className={`text-[11px] font-bold text-${getSubjectColor(slot.subject)}-700 text-center line-clamp-2 leading-tight`}>
                                    {slot.subject}
                                  </span>
                                  {slot.teacherId && (
                                    <span className="text-[9px] text-default-500 text-center line-clamp-1 w-full px-1">
                                      {getTeacherName(slot.teacherId)}
                                    </span>
                                  )}
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
                              className="w-full h-20 border border-dashed border-default-200 rounded-md flex items-center justify-center text-default-300 hover:border-primary hover:text-primary hover:bg-primary-50/10 cursor-pointer transition-all"
                              onClick={() => handleSlotClick(day, i)}
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

      {/* Legend - Compact */}
      <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-default-400 items-center justify-end">
        <div className="flex gap-1.5 items-center">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-200"></span>
          <span>Core</span>
        </div>
        <div className="flex gap-1.5 items-center">
          <span className="w-2.5 h-2.5 rounded-full bg-success-200"></span>
          <span>Science</span>
        </div>
        <div className="flex gap-1.5 items-center">
          <span className="w-2.5 h-2.5 rounded-full bg-warning-200"></span>
          <span>Languages</span>
        </div>
      </div>

      {/* Periods Management Modal */}
      <Modal isOpen={isPeriodsOpen} onClose={onPeriodsClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            <span>Manage Periods</span>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-3">
              {periods.map((period, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <Input
                    size="sm"
                    value={period.name}
                    onValueChange={(v) => updatePeriod(i, 'name', v)}
                    label="Period Name"
                    className="flex-1"
                    variant="bordered"
                  />
                  <Input
                    size="sm"
                    type="time"
                    value={period.startTime}
                    onValueChange={(v) => updatePeriod(i, 'startTime', v)}
                    label="Start Time"
                    className="w-32"
                    variant="bordered"
                  />
                  <Input
                    size="sm"
                    type="time"
                    value={period.endTime}
                    onValueChange={(v) => updatePeriod(i, 'endTime', v)}
                    label="End Time"
                    className="w-32"
                    variant="bordered"
                  />
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={period.isBreak}
                        onChange={(e) => updatePeriod(i, 'isBreak', e.target.checked)}
                        className="rounded"
                      />
                      <span>Break</span>
                    </label>
                    <Button
                      isIconOnly
                      size="sm"
                      color="danger"
                      variant="flat"
                      radius="md"
                      onPress={() => removePeriod(i)}
                      isDisabled={periods.length <= 1}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                size="sm"
                variant="flat"
                radius="md"
                startContent={<Plus size={14} />}
                onPress={addPeriod}
                className="w-full"
              >
                Add Period
              </Button>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onPeriodsClose}>Cancel</Button>
            <Button color="primary" onPress={handleSavePeriods}>Apply Changes</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Slot Modal */}
      <Modal isOpen={isSlotOpen} onClose={onSlotClose} size="md">
        <ModalContent>
          <ModalHeader>
            {editingSlot && `Edit ${editingSlot.day} - ${periods[editingSlot.periodIndex]?.name}`}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Select
                label="Subject"
                placeholder="Select subject"
                selectedKeys={slotForm.subject ? [slotForm.subject] : []}
                onSelectionChange={(keys) => setSlotForm({ ...slotForm, subject: Array.from(keys)[0] || "" })}
                variant="bordered"
              >
                {(schoolSettings.subjects || []).map(subject => (
                  <SelectItem key={subject.name} textValue={subject.name}>
                    {subject.name}
                  </SelectItem>
                ))}
              </Select>

              {/* Show loading state while fetching teachers */}
              {loadingTeachers && slotForm.subject && (
                <div className="flex items-center justify-center gap-2 p-4 bg-default-50 rounded-lg">
                  <Spinner size="sm" />
                  <span className="text-sm text-default-500">Loading available teachers...</span>
                </div>
              )}

              {/* Teacher selection - only show available teachers */}
              {slotForm.subject && !loadingTeachers && (
                <Select
                  label="Teacher"
                  placeholder={availableTeachers.length > 0 ? "Select teacher" : "No teachers available"}
                  selectedKeys={slotForm.teacherId ? [String(slotForm.teacherId)] : []}
                  onSelectionChange={(keys) => handleTeacherChange(Array.from(keys)[0] || "")}
                  variant="bordered"
                  isDisabled={availableTeachers.length === 0}
                  description={
                    availableTeachers.length === 0 
                      ? "No qualified teachers are available for this subject and time slot"
                      : `${availableTeachers.length} teacher(s) available`
                  }
                >
                  {availableTeachers.map(teacher => (
                    <SelectItem 
                      key={String(teacher.id || teacher._id)} 
                      textValue={teacher.name}
                    >
                      {teacher.name}
                    </SelectItem>
                  ))}
                </Select>
              )}

              {/* Show conflict warning using ConflictIndicator */}
              {conflicts.length > 0 && (
                <ConflictIndicator
                  conflicts={conflicts}
                  onResolve={(resolutionData) => {
                    const { action, classId } = resolutionData;
                    
                    if (action === 'remove_current') {
                      // Clear the current slot
                      handleClearSlot();
                    } else if (action === 'choose_different') {
                      // User needs to select a different teacher
                      setConflicts([]);
                      setSlotForm({ ...slotForm, teacherId: "" });
                    } else if (action === 'remove_from_class') {
                      // This would require additional API call to remove teacher from conflicting class
                      alert(`To resolve this conflict, please go to ${resolutionData.resolution.className} timetable and remove the teacher from that slot.`);
                    } else if (action === 'update_assignments') {
                      alert('Please go to Staff Assignments to add this subject-class assignment to the teacher.');
                    }
                  }}
                />
              )}

              <Input
                label="Room"
                placeholder="e.g., Room 101 (optional)"
                value={slotForm.room}
                onValueChange={(v) => setSlotForm({ ...slotForm, room: v })}
                variant="bordered"
              />

              {slotForm.subject && (
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
              onPress={handleSaveSlot}
              isDisabled={!slotForm.subject || conflicts.length > 0}
              isLoading={syncStatus === 'syncing'}
            >
              {syncStatus === 'syncing' ? 'Saving & Syncing...' : 'Save'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={isConfirmClearOpen}
        onClose={onConfirmClearClose}
        onConfirm={confirmClearSlot}
        title="Clear Timetable Slot"
        message="Are you sure you want to clear this slot? This will remove the teacher assignment from both the class and teacher timetables."
        confirmText="Clear Slot"
        cancelText="Cancel"
        variant="danger"
        isLoading={syncStatus === 'syncing'}
      />

      <ConfirmDialog
        isOpen={isConfirmSaveOpen}
        onClose={onConfirmSaveClose}
        onConfirm={confirmSaveTimetable}
        title="Save Timetable"
        message="Are you sure you want to save all changes to the timetable? This will update the schedule for the entire class."
        confirmText="Save Changes"
        cancelText="Cancel"
        variant="info"
        isLoading={loading}
      />
    </div>
  );
}
