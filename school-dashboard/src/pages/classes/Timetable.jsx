import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button, Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Input, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Spinner } from "@heroui/react";
import { motion } from "framer-motion";
import { Settings, Plus, Trash2, Save, X, Clock, AlertTriangle, CheckCircle2, Wand2 } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { timetableApi, teacherAssignmentsApi, classesEnhancedApi } from "../../services/api";
import ConflictIndicator from "../../components/ConflictIndicator";
import ConfirmDialog from "../../components/ConfirmDialog";
import SlotInfoModal from "../../components/timetable/SlotInfoModal";
import {
  showErrorToast,
  showSuccessToast,
  showWarningToast,
  executeWithFeedback,
  parseError,
  formatConflictDetails
} from "../../utils/errorHandling";
import { DEFAULT_PERIODS, TIMETABLE_DAYS } from "../../utils/constants";
import { useTranslation } from 'react-i18next';

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

// Get Tailwind classes for subject cards — supports dark mode
const getSubjectClasses = (subject) => {
  const color = getSubjectColor(subject);
  const colorMap = {
    primary:   { card: 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800',     text: 'text-blue-700 dark:text-blue-300',   pill: 'bg-blue-100/60 dark:bg-blue-900/60' },
    success:   { card: 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-300', pill: 'bg-green-100/60 dark:bg-green-900/60' },
    warning:   { card: 'bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800', text: 'text-yellow-700 dark:text-yellow-300', pill: 'bg-yellow-100/60 dark:bg-yellow-900/60' },
    danger:    { card: 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800',         text: 'text-red-700 dark:text-red-300',     pill: 'bg-red-100/60 dark:bg-red-900/60' },
    secondary: { card: 'bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-300', pill: 'bg-purple-100/60 dark:bg-purple-900/60' },
    default:   { card: 'bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700',    text: 'text-gray-700 dark:text-zinc-300',   pill: 'bg-gray-100/60 dark:bg-zinc-700/60' },
  };
  return colorMap[color] || colorMap.default;
};

export default function Timetable({ classId }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { classesWithTeachers, staff, schoolSettings, currentAcademicYear } = useApp();
  const [searchParams] = useSearchParams();
  const [selectedClass, setSelectedClass] = useState(classId || searchParams.get('classId') || "");
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
  const { isOpen: isInfoOpen, onOpen: onInfoOpen, onClose: onInfoClose } = useDisclosure();
  const [editingSlot, setEditingSlot] = useState(null);
  const [infoSlot, setInfoSlot] = useState(null); // { day, periodIndex, slot, period }
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
      const data = await timetableApi.getByClass(selectedClass, currentAcademicYear);
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

    if (slot.subject) {
      // Filled slot → show info modal
      setInfoSlot({ day, periodIndex, slot, period });
      onInfoOpen();
    } else {
      // Empty slot → open edit modal directly
      setEditingSlot({ day, periodIndex });
      setSlotForm({ ...slot, teacherId: slot.teacherId || "" });
      setConflicts([]);
      onSlotOpen();
    }
  };

  // Called from info modal "Edit Slot" button
  const handleEditFromInfo = () => {
    if (!infoSlot) return;
    const { day, periodIndex, slot } = infoSlot;
    setEditingSlot({ day, periodIndex });
    setSlotForm({ ...slot, teacherId: slot.teacherId || "" });
    setConflicts([]);
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
          setSlotForm({ subject: "", teacherId: null, room: "" });
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
          setSlotForm({ subject: "", teacherId: null, room: "" });
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
          academicYear: currentAcademicYear,
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
    navigate('/timetable-wizard');
  };

  const selectedClassData = classesWithTeachers.find(c => String(c.id) === String(selectedClass));

  if (classesWithTeachers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-zinc-400">{t('pages.noClassesAvailable')}</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center border-b border-gray-200 dark:border-zinc-800 py-4 px-4 mb-4">
        {/* Left Side - Filters & Status */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            {!classId && (
              <Select
                size="sm"
                selectedKeys={selectedClass ? [selectedClass] : []}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-[160px]"
                aria-label={t('aria.inputs.selectClass')}
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
                {currentAcademicYear}
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
            <span className="hidden sm:inline">{t('pages.timetableWizard')}</span>
            <span className="sm:hidden">{t('pages.wizard')}</span>
          </Button>
          <Button
            size="sm"
            variant="flat"
            startContent={<Settings size={14} />}
            onPress={onPeriodsOpen}
          >
            <span className="hidden sm:inline">{t('pages.periods')}</span>
            <span className="sm:hidden">{t('pages.settings2')}</span>
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
        <TablePageSkeleton />
      ) : !timetable ? (
        /* No timetable set - grayed out state */
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-gray-50 dark:bg-zinc-900 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-lg">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
              <Clock size={40} className="text-gray-400 dark:text-zinc-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-zinc-300 mb-2">{t('pages.noTimetableSet')}</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">
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
            aria-label={t('aria.misc.classTimetable')}
            shadow="none"
            isStriped={false}
            radius="sm"
            removeWrapper
            classNames={{
              base: "overflow-x-auto",
              th: "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 font-semibold text-xs uppercase h-10 border-b border-gray-200 dark:border-zinc-800 text-center",
              td: "p-1 border-b border-gray-100 dark:border-zinc-800",
              tr: "hover:bg-gray-50 dark:hover:bg-zinc-900",
              wrapper: "p-0"
            }}
          >
            <TableHeader>
              <TableColumn className="w-24" scope="col">{t('pages.day2')}</TableColumn>
              {periods.map((period, i) => (
                <TableColumn key={`period-${period.name}-${period.startTime}`} className="w-32" scope="col">
                  <div className="flex flex-col items-center justify-center gap-0.5">
                    <span className="text-xs font-bold">{period.name}</span>
                    <span className="text-[9px] text-gray-400 dark:text-zinc-500 font-normal">
                      {period.startTime}-{period.endTime}
                    </span>
                  </div>
                </TableColumn>
              ))}
            </TableHeader>
            <TableBody>
              {days.map((day) => (
                <TableRow key={day}>
                  <TableCell className="font-semibold text-gray-700 dark:text-zinc-300 text-xs">
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{day.slice(0, 3)}</span>
                  </TableCell>
                  {periods.map((period, i) => {
                    const slot = schedule[day]?.[i] || { subject: "", teacherId: null, room: "" };

                    if (period.isBreak) {
                      return (
                        <TableCell key={`${day}-${i}`} className="text-center bg-amber-50 dark:bg-amber-950 p-0">
                          <div className="h-24 flex items-center justify-center">
                            <span className="text-[9px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 opacity-70 [writing-mode:vertical-rl] rotate-180">
                              {period.name}
                            </span>
                          </div>
                        </TableCell>
                      );
                    }

                    const subjectClasses = slot.subject ? getSubjectClasses(slot.subject) : null;
                    return (
                      <TableCell key={`${day}-${i}`} className="p-1">
                        {slot.subject ? (
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <div
                              className={`${subjectClasses.card} rounded-lg h-24 flex flex-col justify-center items-center gap-1 p-1.5 cursor-pointer transition-opacity hover:opacity-90`}
                              onClick={() => handleSlotClick(day, i)}
                            >
                              <span className={`text-xs font-bold text-center line-clamp-2 ${subjectClasses.text}`}>
                                {slot.subject}
                              </span>
                              {slot.teacherId && (
                                <div className={`flex items-center gap-1 ${subjectClasses.pill} px-1.5 py-0.5 rounded-full max-w-full`}>
                                  <span className="text-[10px] text-gray-600 dark:text-zinc-300 text-center truncate">
                                    {getTeacherName(slot.teacherId)}
                                  </span>
                                </div>
                              )}
                              {slot.room && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${subjectClasses.pill} text-gray-500 dark:text-zinc-400`}>
                                  {slot.room}
                                </span>
                              )}
                            </div>
                          </motion.div>
                        ) : (
                          <div
                            className="w-full h-24 border border-dashed border-gray-200 dark:border-zinc-800 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-300 dark:text-zinc-600 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 cursor-pointer"
                            onClick={() => handleSlotClick(day, i)}
                          >
                            <Plus size={16} />
                            <span className="text-[10px]">{t('pages.add1')}</span>
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
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-zinc-400 items-center justify-end px-4 pb-4 border-t border-gray-100 dark:border-zinc-800 pt-4">
            <span className="font-medium mr-2">{t('pages.subjectTypes')}</span>
            <div className="flex gap-2 items-center">
              <span className="w-3 h-3 rounded-full bg-blue-200 border border-blue-300"></span>
              <span>{t('pages.coreMath')}</span>
            </div>
            <div className="flex gap-2 items-center">
              <span className="w-3 h-3 rounded-full bg-green-200 border border-green-300"></span>
              <span>{t('pages.science')}</span>
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
            <span>{t('pages.managePeriods')}</span>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-3">
              {periods.map((period, i) => (
                <div key={`period-edit-${i}`} className="flex gap-2 items-end">
                  <Input
                    size="sm"
                    value={period.name}
                    onValueChange={(v) => updatePeriod(i, 'name', v)}
                    label={t('pages.periodName')}
                    className="flex-1"
                    variant="bordered"
                  />
                  <Input
                    size="sm"
                    type="time"
                    value={period.startTime}
                    onValueChange={(v) => updatePeriod(i, 'startTime', v)}
                    label={t('pages.startTime1')}
                    className="w-32"
                    variant="bordered"
                  />
                  <Input
                    size="sm"
                    type="time"
                    value={period.endTime}
                    onValueChange={(v) => updatePeriod(i, 'endTime', v)}
                    label={t('pages.endTime1')}
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
                      <span>{t('pages.break')}</span>
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
            <Button variant="light" onPress={onPeriodsClose}>{t('pages.cancel2')}</Button>
            <Button color="primary" onPress={handleSavePeriods}>{t('pages.applyChanges')}</Button>
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
                label={t('pages.subject2')}
                placeholder={t('pages.selectSubject')}
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
                <div className="flex items-center justify-center gap-2 p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                  <Spinner size="sm" />
                  <span className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.loadingAvailableTeachers')}</span>
                </div>
              )}

              {/* Teacher selection - only show available teachers */}
              {slotForm.subject && !loadingTeachers && (
                <>
                  <Select
                    label={t('pages.teacher2')}
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
                        <strong>{t('pages.tip')}</strong> No teachers are qualified or available. You can:
                      </p>
                      <ul className="text-xs text-warning-600 mt-2 ml-4 list-disc space-y-1">
                        <li>{t('pages.assignATeacherToThisSubjectInStaffManagement')}</li>
                        <li>{t('pages.chooseADifferentTimeSlot')}</li>
                        <li>{t('pages.selectADifferentSubject')}</li>
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
                label={t('pages.room')}
                placeholder={t('classes.roomOptionalPlaceholder')}
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
            <Button variant="light" onPress={onSlotClose}>{t('pages.cancel2')}</Button>
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
        title={t('pages.clearTimetableSlot')}
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
        title={t('pages.saveTimetable')}
        message="Are you sure you want to save all changes to the timetable? This will update the schedule for the entire class."
        confirmText="Save Changes"
        cancelText="Cancel"
        variant="info"
        isLoading={loading}
      />

      {/* Slot Info Modal — rich details view for filled slots */}
      <SlotInfoModal
        isOpen={isInfoOpen}
        onClose={onInfoClose}
        slot={infoSlot?.slot}
        day={infoSlot?.day}
        periodIndex={infoSlot?.periodIndex}
        period={infoSlot?.period}
        classId={selectedClass}
        schedule={schedule}
        periods={periods}
        staff={staff}
        onEdit={handleEditFromInfo}
      />

    </div>
  );
}
