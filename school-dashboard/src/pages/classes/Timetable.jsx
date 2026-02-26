import { useState, useEffect } from "react";
import { Card, CardBody, Button, Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Input, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Spinner } from "@heroui/react";
import { motion } from "framer-motion";
import { Settings, Plus, Trash2, Save, X, Clock, AlertTriangle, CheckCircle2, Wand2 } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { timetableApi, teacherAssignmentsApi, classesEnhancedApi } from "../../services/api";
import ConflictIndicator from "../../components/ConflictIndicator";
import ConfirmDialog from "../../components/ConfirmDialog";
import TimetableWizardModal from "./components/TimetableWizardModal";
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

// Get inline styles for subject card colors
const getSubjectStyles = (subject) => {
  const color = getSubjectColor(subject);
  const colorMap = {
    primary: { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
    success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' },
    warning: { bg: '#fefce8', border: '#fef08a', text: '#a16207' },
    danger: { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c' },
    secondary: { bg: '#faf5ff', border: '#e9d5ff', text: '#7e22ce' },
    default: { bg: '#f9fafb', border: '#e5e7eb', text: '#374151' }
  };
  return colorMap[color] || colorMap.default;
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
  const { isOpen: isWizardOpen, onOpen: onWizardOpen, onClose: onWizardClose } = useDisclosure();
  const [editingSlot, setEditingSlot] = useState(null);
  const [slotForm, setSlotForm] = useState({ subject: "", teacherId: "", room: "" });
  const [showMissingSubjectsWarning, setShowMissingSubjectsWarning] = useState(false);
  const [missingSubjectsClasses, setMissingSubjectsClasses] = useState([]);
  const [classSubjectSelections, setClassSubjectSelections] = useState({});
  const [assigningSubjects, setAssigningSubjects] = useState(false);

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
      const data = await timetableApi.getByClass(selectedClass, schoolSettings?.academicYear);
      if (data && data.schedule) {
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
      if (err.status !== 404 && !err.message?.includes('not found')) {
        console.error('Failed to load timetable:', err);
      }
      // Don't show error toast - just initialize empty state
      setPeriods(defaultPeriods);
      setSchedule(initializeSchedule());
      setTimetable(null);
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
          academicYear: schoolSettings?.academicYear,
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

  const handleWizardClick = () => {
    window.location.href = '/timetable-wizard';
  };

  const selectedClassData = classesWithTeachers.find(c => String(c.id) === String(selectedClass));

  if (classesWithTeachers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No classes available</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center border-b border-gray-200 py-4 px-4 mb-4">
        {/* Left Side - Filters & Status */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            {!classId && (
              <Select
                size="sm"
                selectedKeys={selectedClass ? [selectedClass] : []}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-[160px]"
                aria-label="Select Class"
                variant="flat"
              >
                {classesWithTeachers.map(c => (
                  <SelectItem key={c.id} textValue={`Class ${c.name}-${c.section}`}>
                    Class {c.name}-{c.section}
                  </SelectItem>
                ))}
              </Select>
            )}
            {selectedClassData && (
              <Chip size="sm" variant="flat" color="primary">
                {schoolSettings?.academicYear || '2024-25'}
              </Chip>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Sync Status Indicator */}
            {syncStatus === 'syncing' && (
              <Chip size="sm" variant="flat" color="default" className="h-8" startContent={<Spinner size="sm" />}>
                Syncing...
              </Chip>
            )}
            {syncStatus === 'success' && (
              <Chip size="sm" variant="flat" color="success" className="h-8" startContent={<CheckCircle2 size={14} />}>
                Synced
              </Chip>
            )}
            {syncStatus === 'error' && (
              <Chip size="sm" variant="flat" color="danger" className="h-8" startContent={<AlertTriangle size={14} />}>
                Sync Failed
              </Chip>
            )}
          </div>
        </div>

        {/* Right Side - Actions */}
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <Button
            size="sm"
            color="primary"
            variant="flat"
            startContent={<Wand2 size={14} />}
            onPress={handleWizardClick}
          >
            <span className="hidden sm:inline">Timetable Wizard</span>
            <span className="sm:hidden">Wizard</span>
          </Button>
          <Button
            size="sm"
            variant="flat"
            startContent={<Settings size={14} />}
            onPress={onPeriodsOpen}
          >
            <span className="hidden sm:inline">Periods</span>
            <span className="sm:hidden">Settings</span>
          </Button>
          {hasChanges && (
            <Button
              size="sm"
              color="primary"
              startContent={<Save size={14} />}
              onPress={handleSaveTimetable}
              isLoading={loading}
            >
              Save Changes
            </Button>
          )}
        </div>
      </div>

      {loading && !hasChanges ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" color="primary" />
        </div>
      ) : !timetable ? (
        /* No timetable set - grayed out state */
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <Clock size={40} className="text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Timetable Set</h3>
              <p className="text-sm text-gray-500 mb-4">
                Timetable has not been created for this class yet.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button
                  size="sm"
                  color="primary"
                  variant="solid"
                  startContent={<Wand2 size={14} />}
                  onPress={handleWizardClick}
                >
                  Generate Timetable
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  onPress={onPeriodsOpen}
                >
                  Manage Periods
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <Table
            aria-label="Class Timetable"
            shadow="none"
            isStriped={false}
            radius="sm"
            removeWrapper
            classNames={{
              base: "overflow-x-auto",
              th: "bg-gray-100 text-gray-600 font-semibold text-xs uppercase h-10 border-b border-gray-200 text-center",
              td: "p-1 border-b border-gray-100",
              tr: "hover:bg-gray-50",
              wrapper: "p-0"
            }}
          >
            <TableHeader>
              <TableColumn className="w-24">Day</TableColumn>
              {periods.map((period, i) => (
                <TableColumn key={i} className="w-32">
                  <div className="flex flex-col items-center justify-center gap-0.5">
                    <span className="text-xs font-bold">{period.name}</span>
                    <span className="text-[9px] text-gray-400 font-normal">
                      {period.startTime}-{period.endTime}
                    </span>
                  </div>
                </TableColumn>
              ))}
            </TableHeader>
            <TableBody>
              {days.map((day) => (
                <TableRow key={day}>
                  <TableCell className="font-semibold text-gray-700 text-xs">
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{day.slice(0, 3)}</span>
                  </TableCell>
                  {periods.map((period, i) => {
                    const slot = schedule[day]?.[i] || { subject: "", teacherId: null, room: "" };

                    if (period.isBreak) {
                      return (
                        <TableCell key={i} className="text-center bg-amber-50 p-0">
                          <div className="h-24 flex items-center justify-center">
                            <span className="text-[9px] font-semibold uppercase tracking-wider text-amber-600 opacity-60" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                              {period.name}
                            </span>
                          </div>
                        </TableCell>
                      );
                    }

                    return (
                      <TableCell key={i} className="p-1">
                        {slot.subject ? (
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Card
                              isPressable
                              shadow="sm"
                              onPress={() => handleSlotClick(day, i)}
                              style={{
                                backgroundColor: getSubjectStyles(slot.subject).bg,
                                borderColor: getSubjectStyles(slot.subject).border,
                                height: '6rem',
                              }}
                            >
                              <CardBody className="p-1.5 flex flex-col justify-center items-center gap-1">
                                <span className="text-xs font-bold text-center line-clamp-2" style={{ color: getSubjectStyles(slot.subject).text }}>
                                  {slot.subject}
                                </span>
                                {slot.teacherId && (
                                  <div className="flex items-center gap-1 bg-white/60 px-1.5 py-0.5 rounded-full max-w-full">
                                    <span className="text-[10px] text-gray-600 text-center truncate">
                                      {getTeacherName(slot.teacherId)}
                                    </span>
                                  </div>
                                )}
                                {slot.room && (
                                  <Chip size="sm" variant="flat" className="text-[9px] h-4 px-1 min-w-0 bg-white/50">
                                    {slot.room}
                                  </Chip>
                                )}
                              </CardBody>
                            </Card>
                          </motion.div>
                        ) : (
                          <div
                            className="w-full h-24 border border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-300 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 cursor-pointer"
                            onClick={() => handleSlotClick(day, i)}
                          >
                            <Plus size={16} />
                            <span className="text-[10px]">Add</span>
                          </div>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500 items-center justify-end px-4 pb-4 border-t border-gray-100 pt-4">
            <span className="font-medium mr-2">Subject Types:</span>
            <div className="flex gap-2 items-center">
              <span className="w-3 h-3 rounded-full bg-blue-200 border border-blue-300"></span>
              <span>Core (Math)</span>
            </div>
            <div className="flex gap-2 items-center">
              <span className="w-3 h-3 rounded-full bg-green-200 border border-green-300"></span>
              <span>Science</span>
            </div>
            <div className="flex gap-2 items-center">
              <span className="w-3 h-3 rounded-full bg-yellow-200 border border-yellow-300"></span>
              <span>Languages/Art</span>
            </div>
            <div className="flex gap-2 items-center">
              <span className="w-3 h-3 rounded-full bg-purple-200 border border-purple-300"></span>
              <span>Social/Computer</span>
            </div>
            <div className="flex gap-2 items-center">
              <span className="w-3 h-3 rounded-full bg-red-200 border border-red-300"></span>
              <span>Sports/Hindi</span>
            </div>
          </div>
        </>
      )}

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
                <div className="flex items-center justify-center gap-2 p-4 bg-gray-50 rounded-lg">
                  <Spinner size="sm" />
                  <span className="text-sm text-gray-500">Loading available teachers...</span>
                </div>
              )}

              {/* Teacher selection - only show available teachers */}
              {slotForm.subject && !loadingTeachers && (
                <>
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
                        : `${availableTeachers.length} teacher(s) available and free at this time`
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

                  {availableTeachers.length === 0 && (
                    <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
                      <p className="text-xs text-warning-700">
                        <strong>Tip:</strong> No teachers are qualified or available. You can:
                      </p>
                      <ul className="text-xs text-warning-600 mt-2 ml-4 list-disc space-y-1">
                        <li>Assign a teacher to this subject in Staff Management</li>
                        <li>Choose a different time slot</li>
                        <li>Select a different subject</li>
                      </ul>
                    </div>
                  )}
                </>
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

      {/* Timetable Wizard Modal */}
      <TimetableWizardModal
        isOpen={isWizardOpen}
        onClose={onWizardClose}
        classId={selectedClass}
        onSaved={loadTimetable}
      />

    </div>
  );
}
