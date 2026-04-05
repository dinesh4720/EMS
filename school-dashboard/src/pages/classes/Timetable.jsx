import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDisclosure } from "@heroui/react";
import { useApp } from "../../context/AppContext";
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { timetableApi, teacherAssignmentsApi } from "../../services/api";
import ConfirmDialog from "../../components/ConfirmDialog";
import useConfirmDialog from '../../hooks/useConfirmDialog';
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

// Extracted components
import { TimetableToolbar } from './components/TimetableToolbar';
import { TimetableGrid } from './components/TimetableGrid';
import { TimetableEmptyState } from './components/TimetableEmptyState';
import { PeriodsModal } from './components/PeriodsModal';
import { EditSlotModal } from './components/EditSlotModal';

const days = TIMETABLE_DAYS;
const defaultPeriods = DEFAULT_PERIODS;

export default function Timetable({ classId }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { classesWithTeachers, staff, schoolSettings, currentAcademicYear } = useApp();
  const { confirmState: periodConfirmState, showConfirm: showPeriodConfirm, closeConfirm: closePeriodConfirm } = useConfirmDialog();
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
  const syncTimeoutRef = useRef(null);

  const clearSyncStatusAfterDelay = useCallback(() => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => setSyncStatus(null), 2000);
  }, []);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, []);

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

  const initializeSchedule = (periodsArg) => {
    const activePeriods = periodsArg || periods;
    const emptySchedule = {};
    days.forEach(day => {
      emptySchedule[day] = activePeriods.map(() => ({ subject: "", teacherId: null, room: "" }));
    });
    return emptySchedule;
  };

  const handleSlotClick = (day, periodIndex) => {
    const period = periods[periodIndex];
    if (period.isBreak) return;

    const slot = schedule[day]?.[periodIndex] || { subject: "", teacherId: null, room: "" };

    if (slot.subject) {
      // Filled slot -> show info modal
      setInfoSlot({ day, periodIndex, slot, period });
      onInfoOpen();
    } else {
      // Empty slot -> open edit modal directly
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

  const fetchAvailableTeachers = useCallback(async () => {
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
  }, [slotForm.subject, editingSlot, selectedClass]);

  // Fetch available teachers when subject is selected
  useEffect(() => {
    if (isSlotOpen && slotForm.subject && editingSlot && selectedClass) {
      fetchAvailableTeachers();
    }
  }, [slotForm.subject, isSlotOpen, editingSlot, selectedClass, fetchAvailableTeachers]);

  // Check for conflicts when teacher is selected
  const checkConflict = async (teacherId) => {
    if (!teacherId || !editingSlot || !selectedClass) {
      setConflicts([]);
      return;
    }

    try {
      const { day, periodIndex } = editingSlot;

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
          clearSyncStatusAfterDelay();

          onSlotClose();
          setEditingSlot(null);
          setSlotForm({ subject: "", teacherId: null, room: "" });
          setConflicts([]);

          // Reload timetable to get synced data
          await loadTimetable();
        },
        onError: (error) => {
          setSyncStatus('error');

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
          clearSyncStatusAfterDelay();

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

  const savePeriods = async (newSchedule) => {
    await executeWithFeedback(
      async () => {
        setSyncStatus('syncing');
        await timetableApi.createOrUpdate({
          classId: selectedClass,
          academicYear: currentAcademicYear,
          periods,
          schedule: newSchedule
        });
        setSchedule(newSchedule);
        setHasChanges(false);
        setSyncStatus('success');
      },
      {
        loadingMessage: 'Saving periods...',
        successMessage: 'Periods saved successfully!',
        errorMessage: null,
        retries: 2,
        onSuccess: async () => {
          clearSyncStatusAfterDelay();
          onPeriodsClose();
          await loadTimetable();
        },
        onError: () => {
          setSyncStatus('error');
        }
      }
    );
  };

  const handleSavePeriods = () => {
    const hasExistingSchedule = Object.values(schedule).some(daySlots =>
      Array.isArray(daySlots) && daySlots.some(slot => slot && slot.subject)
    );

    if (hasExistingSchedule) {
      showPeriodConfirm({
        title: t('pages.resetTimetable', 'Reset Timetable'),
        message: 'Saving period changes will reset the entire timetable schedule. All currently assigned subjects and teachers will be cleared. Are you sure you want to continue?',
        variant: 'warning',
        confirmText: t('pages.resetAndSave', 'Reset & Save'),
        onConfirm: () => {
          savePeriods(initializeSchedule(periods));
        },
      });
      return;
    }

    savePeriods(initializeSchedule(periods));
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
      <TimetableToolbar
        classId={classId}
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        classesWithTeachers={classesWithTeachers}
        selectedClassData={selectedClassData}
        currentAcademicYear={currentAcademicYear}
        syncStatus={syncStatus}
        hasChanges={hasChanges}
        loading={loading}
        onWizardClick={handleWizardClick}
        onPeriodsOpen={onPeriodsOpen}
        onSaveTimetable={handleSaveTimetable}
      />

      {loading && !hasChanges ? (
        <TablePageSkeleton />
      ) : !timetable ? (
        <TimetableEmptyState
          onWizardClick={handleWizardClick}
          onPeriodsOpen={onPeriodsOpen}
        />
      ) : (
        <TimetableGrid
          days={days}
          periods={periods}
          schedule={schedule}
          staff={staff}
          onSlotClick={handleSlotClick}
        />
      )}

      {/* Periods Management Modal */}
      <PeriodsModal
        isOpen={isPeriodsOpen}
        onClose={onPeriodsClose}
        periods={periods}
        onAddPeriod={addPeriod}
        onRemovePeriod={removePeriod}
        onUpdatePeriod={updatePeriod}
        onSavePeriods={handleSavePeriods}
      />

      {/* Edit Slot Modal */}
      <EditSlotModal
        isOpen={isSlotOpen}
        onClose={onSlotClose}
        editingSlot={editingSlot}
        periods={periods}
        slotForm={slotForm}
        setSlotForm={setSlotForm}
        loadingTeachers={loadingTeachers}
        availableTeachers={availableTeachers}
        conflicts={conflicts}
        setConflicts={setConflicts}
        syncStatus={syncStatus}
        schoolSettings={schoolSettings}
        onTeacherChange={handleTeacherChange}
        onSaveSlot={handleSaveSlot}
        onClearSlot={handleClearSlot}
      />

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

      <ConfirmDialog {...periodConfirmState} onClose={closePeriodConfirm} />

      {/* Slot Info Modal */}
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
