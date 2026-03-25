import { safeGetItem, safeSetItem } from '../../utils/safeStorage';
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Tabs, Tab, Card, CardBody, Input, Button, Chip, Divider, Switch,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Tooltip
} from "@heroui/react";
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import {
  BookOpen, Calendar, Clock, GraduationCap, Plus, Save, Trash2,
  Edit2, AlertCircle, Check, Users, Layers
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';

// Validation functions
const validateSettings = (settings) => {
  const errors = [];

  // Working days validation
  if (!settings.workingDays || settings.workingDays.length === 0) {
    errors.push("At least one working day must be selected");
  }

  // Academic year date validation
  if (settings.academicYearStart && settings.academicYearEnd) {
    const startDate = new Date(settings.academicYearStart);
    const endDate = new Date(settings.academicYearEnd);
    if (endDate <= startDate) {
      errors.push("Academic year end date must be after start date");
    }
  }

  // School timing validation
  if (settings.schoolStartTime && settings.schoolEndTime) {
    const start = settings.schoolStartTime.split(':').map(Number);
    const end = settings.schoolEndTime.split(':').map(Number);
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    if (endMinutes <= startMinutes) {
      errors.push("School end time must be after start time");
    }

    // Period validation against school hours
    if (settings.periodDuration && settings.periodsPerDay) {
      const totalPeriodMinutes = settings.periodsPerDay * settings.periodDuration;
      const availableMinutes = endMinutes - startMinutes;
      if (totalPeriodMinutes > availableMinutes) {
        errors.push(`Total period time (${Math.floor(totalPeriodMinutes / 60)}h ${totalPeriodMinutes % 60}m) exceeds school hours (${Math.floor(availableMinutes / 60)}h ${availableMinutes % 60}m)`);
      }
    }
  }

  // Period validation
  if (settings.periodDuration && settings.periodDuration <= 0) {
    errors.push("Period duration must be greater than 0");
  }
  if (settings.periodsPerDay && settings.periodsPerDay <= 0) {
    errors.push("Number of periods per day must be greater than 0");
  }

  return errors;
};

// Data display field component
const DataField = ({ label, value }) => (
  <div className="space-y-1">
    <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">{label}</span>
    <p className="font-medium text-default-900">{value || "—"}</p>
  </div>
);

export default function AcademicSettings() {
  const { t } = useTranslation();
  const { schoolSettings, updateSchoolSettings, addSubject, updateSubject, deleteSubject, classes, addClass, updateClass, deleteClass, loading } = useApp();
  const [activeTab, setActiveTab] = useState(() => {
    return safeGetItem('academicSettingsTab') || "schedule";
  });
  const [localSettings, setLocalSettings] = useState(schoolSettings);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [subjectErrors, setSubjectErrors] = useState({});
  const [sectionError, setSectionError] = useState('');

  // Modal states
  const academicYearModal = useDisclosure();
  const schoolTimingsModal = useDisclosure();
  const periodConfigModal = useDisclosure();
  const workingDaysModal = useDisclosure();
  const subjectModal = useDisclosure();
  const classModal = useDisclosure();

  const [newSubject, setNewSubject] = useState({ name: "", code: "", assignedClasses: [] });
  const [editingSubject, setEditingSubject] = useState(null);
  const [selectedClassNum, setSelectedClassNum] = useState(null); // For adding sections
  const [newSection, setNewSection] = useState("");
  const [editingSection, setEditingSection] = useState(null); // { classNum, section, classId }

  // Sync local settings when context updates
  useEffect(() => {
    if (schoolSettings) {
      setLocalSettings(schoolSettings);
    }
  }, [schoolSettings]);

  // Tab persistence
  useEffect(() => {
    safeSetItem('academicSettingsTab', activeTab);
  }, [activeTab]);

  // Generic save handler for modals
  const handleSaveSection = async (sectionData, closeModal) => {
    const errors = validateSettings({ ...localSettings, ...sectionData });
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    setSaving(true);
    try {
      const updated = { ...localSettings, ...sectionData };
      await updateSchoolSettings(updated);
      setLocalSettings(updated);
      setSaveSuccess(true);
      toast.success(t('toast.success.settingsSavedSuccessfully'));
      setTimeout(() => setSaveSuccess(false), 2000);
      closeModal();
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error(t('toast.error.failedToSaveSettings'));
    } finally {
      setSaving(false);
    }
  };

  // Subject handlers
  const handleAddSubject = async () => {
    const newSubjectErrors = {};
    if (!newSubject.name.trim()) newSubjectErrors.name = t('toast.error.subjectNameAndCodeAreRequired');
    if (!newSubject.code.trim()) newSubjectErrors.code = t('toast.error.subjectNameAndCodeAreRequired');
    if (Object.keys(newSubjectErrors).length > 0) {
      setSubjectErrors(newSubjectErrors);
      toast.error(t('toast.error.subjectNameAndCodeAreRequired'));
      return;
    }
    try {
      await addSubject(newSubject);
      setNewSubject({ name: "", code: "", assignedClasses: [] });
      subjectModal.onClose();
      toast.success(t('toast.success.subjectAddedSuccessfully'));
    } catch (error) {
      console.error('Failed to add subject:', error);
      toast.error(t('toast.error.failedToAddSubject'));
    }
  };

  const handleEditSubject = (subject) => {
    setEditingSubject(subject);
    setNewSubject({
      name: subject.name,
      code: subject.code,
      assignedClasses: subject.assignedClasses || []
    });
    subjectModal.onOpen();
  };

  const handleUpdateSubject = async () => {
    const newSubjectErrors = {};
    if (!newSubject.name.trim()) newSubjectErrors.name = t('toast.error.subjectNameAndCodeAreRequired');
    if (!newSubject.code.trim()) newSubjectErrors.code = t('toast.error.subjectNameAndCodeAreRequired');
    if (!editingSubject || Object.keys(newSubjectErrors).length > 0) {
      setSubjectErrors(newSubjectErrors);
      toast.error(t('toast.error.subjectNameAndCodeAreRequired'));
      return;
    }
    try {
      await updateSubject(editingSubject.id || editingSubject._id, newSubject);
      setEditingSubject(null);
      setNewSubject({ name: "", code: "", assignedClasses: [] });
      subjectModal.onClose();
      toast.success(t('toast.success.subjectUpdatedSuccessfully'));
    } catch (error) {
      console.error('Failed to update subject:', error);
      toast.error(t('toast.error.failedToUpdateSubject'));
    }
  };

  const handleDeleteSubject = async (subject) => {
    const subjectId = subject.id || subject._id;
    if (!subjectId) {
      toast.error(t('toast.error.cannotDeleteSubjectMissingId'));
      return;
    }
    if (!confirm(t('confirm.deleteSubject', { name: subject.name }))) return;
    try {
      await deleteSubject(subjectId);
      toast.success(t('toast.success.subjectDeletedSuccessfully'));
    } catch (error) {
      console.error('Failed to delete subject:', error);
      toast.error(t('toast.error.failedToDeleteSubject'));
    }
  };

  const handleSubjectModalClose = () => {
    setEditingSubject(null);
    setNewSubject({ name: "", code: "", assignedClasses: [] });
    setSubjectErrors({});
    subjectModal.onClose();
  };

  // Section handlers
  const handleAddSection = async () => {
    if (!selectedClassNum || !newSection.trim()) {
      setSectionError(t('toast.error.pleaseEnterASectionLetter'));
      toast.error(t('toast.error.pleaseEnterASectionLetter'));
      return;
    }
    try {
      await addClass({
        name: `Class ${selectedClassNum}`,
        section: newSection.toUpperCase()
      });
      setNewSection("");
      classModal.onClose();
      toast.success(`Section ${newSection.toUpperCase()} added to Class ${selectedClassNum}`);
    } catch (error) {
      console.error('Failed to add section:', error);
      toast.error(t('toast.error.failedToAddSection'));
    }
  };

  const handleEditSection = (classNum, section, classId) => {
    setEditingSection({ classNum, section, classId });
    setNewSection(section);
    classModal.onOpen();
  };

  const handleUpdateSection = async () => {
    if (!editingSection || !newSection.trim()) {
      setSectionError(t('toast.error.pleaseEnterASectionLetter'));
      toast.error(t('toast.error.pleaseEnterASectionLetter'));
      return;
    }
    try {
      await updateClass(editingSection.classId, {
        name: `Class ${editingSection.classNum}`,
        section: newSection.toUpperCase()
      });
      setEditingSection(null);
      setNewSection("");
      classModal.onClose();
      toast.success(t('toast.success.sectionUpdatedSuccessfully'));
    } catch (error) {
      console.error('Failed to update section:', error);
      toast.error(t('toast.error.failedToUpdateSection'));
    }
  };

  const handleDeleteSection = async (cls) => {
    const classId = cls.id || cls._id;
    if (!classId) {
      toast.error(t('toast.error.cannotDeleteSectionMissingId'));
      return;
    }
    const classNum = cls.name?.replace(/\D/g, '') || '?';
    if (!confirm(t('confirm.deleteClass', { classNum, section: cls.section }))) return;
    try {
      await deleteClass(classId);
      toast.success(t('toast.success.sectionDeletedSuccessfully'));
    } catch (error) {
      console.error('Failed to delete section:', error);
      // Check for specific error message
      if (error.message?.includes('students')) {
        toast.error(t('toast.error.cannotDeleteStudentsAreEnrolledInThisSection'));
      } else {
        toast.error(t('toast.error.failedToDeleteSection'));
      }
    }
  };

  // Disable a class (delete all sections) - with error handling
  const handleDisableClass = async (classNum) => {
    const config = classConfig[classNum];
    if (!config || !config.sectionDetails.length) return;

    // Check if any section has students
    const hasStudents = config.sectionDetails.some(cls => cls.strength > 0);
    if (hasStudents) {
      toast.error(`Cannot disable Class ${classNum}: Students are enrolled. Transfer students first.`);
      return;
    }

    if (!confirm(t('confirm.disableClass', { classNum }))) return;

    try {
      // Delete sections one by one
      for (const cls of config.sectionDetails) {
        await deleteClass(cls.id || cls._id);
      }
      toast.success(`Class ${classNum} disabled`);
    } catch (error) {
      console.error('Failed to disable class:', error);
      if (error.message?.includes('students')) {
        toast.error(t('toast.error.cannotDisableStudentsAreEnrolledInThisClass'));
      } else {
        toast.error(t('toast.error.failedToDisableClass'));
      }
    }
  };

  const handleClassModalClose = () => {
    setEditingSection(null);
    setNewSection("");
    setSelectedClassNum(null);
    setSectionError('');
    classModal.onClose();
  };

  // Open modal to add section to a specific class
  const openAddSectionModal = (classNum) => {
    setSelectedClassNum(classNum);
    setEditingSection(null);
    setNewSection("");
    classModal.onOpen();
  };

  // Working days toggle
  const toggleWorkingDay = (day, currentDays, setDays) => {
    const days = currentDays?.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...(currentDays || []), day];
    setDays(days);
  };

  // Fixed classes 1-12
  const ALL_CLASSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  // Group classes by class number and calculate enabled status
  const classConfig = useMemo(() => {
    const grouped = {};

    // Initialize all classes
    ALL_CLASSES.forEach(num => {
      grouped[num] = {
        classNum: num,
        enabled: false,
        sections: [],
        sectionDetails: [],
        totalStrength: 0
      };
    });

    // Populate with existing class data
    if (classes && classes.length > 0) {
      classes.forEach(cls => {
        const classNum = parseInt(cls.name?.replace(/\D/g, '') || cls.class?.replace(/\D/g, '') || '0');
        if (classNum >= 1 && classNum <= 12) {
          grouped[classNum].enabled = true;
          if (cls.section) {
            grouped[classNum].sections.push(cls.section);
          }
          grouped[classNum].sectionDetails.push(cls);
          grouped[classNum].totalStrength += cls.strength || 0;
        }
      });
    }

    // Sort sections alphabetically
    Object.values(grouped).forEach(g => {
      g.sections = [...new Set(g.sections)].sort();
      g.sectionDetails = g.sectionDetails.sort((a, b) => (a.section || '').localeCompare(b.section || ''));
    });

    return grouped;
  }, [classes]);

  // Get enabled classes for display
  const enabledClasses = useMemo(() => {
    return ALL_CLASSES.filter(num => classConfig[num]?.enabled).map(num => classConfig[num]);
  }, [classConfig]);

  if (loading || !localSettings) {
    return (
      <TablePageSkeleton />
    );
  }

  // Calculate instructional time
  const instructionalMinutes = (localSettings.periodsPerDay || 0) * (localSettings.periodDuration || 0);
  const instructionalHours = Math.floor(instructionalMinutes / 60);
  const instructionalMins = instructionalMinutes % 60;

  // Calculate total school hours
  const getSchoolHours = () => {
    if (!localSettings.schoolStartTime || !localSettings.schoolEndTime) return "—";
    const [sh, sm] = localSettings.schoolStartTime.split(':').map(Number);
    const [eh, em] = localSettings.schoolEndTime.split(':').map(Number);
    const total = (eh * 60 + em) - (sh * 60 + sm);
    return `${Math.floor(total / 60)}h ${total % 60}m`;
  };

  return (
    <div className="max-w-4xl mx-auto pb-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-default-200 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-default-900">{t('pages.academicConfiguration')}</h2>
          <p className="text-sm text-default-500 mt-1">{t('pages.manageAcademicSessionsTimingsSubjectsAndClassStructures')}</p>
        </div>
      </div>

      <Tabs
        selectedKey={activeTab}
        onSelectionChange={setActiveTab}
        variant="underlined"
        classNames={{
          tabList: "gap-6 border-b border-default-200 w-full p-0",
          cursor: "w-full bg-primary",
          tab: "max-w-fit px-0 h-10 pb-2",
          tabContent: "group-data-[selected=true]:text-primary group-data-[selected=true]:font-semibold font-medium text-default-500"
        }}
      >
        {/* Schedule & Timings Tab */}
        <Tab key="schedule" title={
          <div className="flex items-center gap-2">
            <Calendar size={18} />
            <span>{t('pages.scheduleTimings')}</span>
          </div>
        }>
          <div className="pt-6 space-y-8 animate-fade-in">

            {/* Academic Session Card */}
            <div className="rounded-xl border border-default-200 bg-white dark:bg-zinc-950 hover:border-default-300 transition-colors">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Calendar size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-default-900">{t('pages.academicSession')}</h3>
                      <p className="text-xs text-default-500">{t('pages.currentAcademicYearConfiguration')}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="light"
                    color="primary"
                    startContent={<Edit2 size={16} />}
                    onPress={academicYearModal.onOpen}
                  >
                    Edit
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <DataField label={t('pages.sessionName')} value={localSettings.academicYear} />
                  <DataField label={t('pages.startDate1')} value={localSettings.academicYearStart} />
                  <DataField label={t('pages.endDate1')} value={localSettings.academicYearEnd} />
                </div>
              </div>
            </div>

            {/* School Timings Card */}
            <div className="rounded-xl border border-default-200 bg-white dark:bg-zinc-950 hover:border-default-300 transition-colors">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                      <Clock size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-default-900">{t('pages.schoolTimings')}</h3>
                      <p className="text-xs text-default-500">{t('pages.dailySchoolStartAndEndTimes')}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="light"
                    color="primary"
                    startContent={<Edit2 size={16} />}
                    onPress={schoolTimingsModal.onOpen}
                  >
                    Edit
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <DataField label={t('pages.schoolStarts')} value={localSettings.schoolStartTime} />
                  <DataField label={t('pages.schoolEnds')} value={localSettings.schoolEndTime} />
                  <DataField label={t('pages.totalSchoolHours')} value={getSchoolHours()} />
                </div>
              </div>
            </div>

            {/* Period Configuration Card */}
            <div className="rounded-xl border border-default-200 bg-white dark:bg-zinc-950 hover:border-default-300 transition-colors">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-warning/10 text-warning">
                      <Clock size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-default-900">{t('pages.periodConfiguration')}</h3>
                      <p className="text-xs text-default-500">{t('pages.periodDurationAndCountPerDay')}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="light"
                    color="primary"
                    startContent={<Edit2 size={16} />}
                    onPress={periodConfigModal.onOpen}
                  >
                    Edit
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <DataField label={t('pages.periodDuration1')} value={localSettings.periodDuration ? `${localSettings.periodDuration} minutes` : null} />
                  <DataField label={t('pages.periodsPerDay1')} value={localSettings.periodsPerDay} />
                  <DataField label={t('pages.instructionalTime1')} value={`${instructionalHours}h ${instructionalMins}m`} />
                </div>

                <div className="mt-4 p-4 bg-default-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={16} className="text-default-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-default-500 leading-relaxed">
                      Total instructional time: <span className="font-bold text-default-700">{instructionalHours}h {instructionalMins}m</span>.
                      Ensure this fits within school hours, including breaks.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Working Days Card */}
            <div className="rounded-xl border border-default-200 bg-white dark:bg-zinc-950 hover:border-default-300 transition-colors">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-success/10 text-success">
                      <Calendar size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-default-900">{t('pages.workingDays')}</h3>
                      <p className="text-xs text-default-500">{t('pages.daysTheSchoolOperates')}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="light"
                    color="primary"
                    startContent={<Edit2 size={16} />}
                    onPress={workingDaysModal.onOpen}
                  >
                    Edit
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
                    const isActive = localSettings.workingDays?.includes(day);
                    const fullDay = day === "Mon" ? "Monday" : day === "Tue" ? "Tuesday" : day === "Wed" ? "Wednesday" : day === "Thu" ? "Thursday" : day === "Fri" ? "Friday" : day === "Sat" ? "Saturday" : "Sunday";
                    return (
                      <Chip
                        key={day}
                        color={isActive ? "primary" : "default"}
                        variant={isActive ? "solid" : "flat"}
                        size="lg"
                      >
                        {fullDay}
                      </Chip>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </Tab>

        {/* Subjects Tab */}
        <Tab key="subjects" title={
          <div className="flex items-center gap-2">
            <BookOpen size={18} />
            <span>{t('pages.subjects1')}</span>
          </div>
        }>
          <div className="pt-6 space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-default-900">{t('pages.subjectRepository')}</h3>
                <p className="text-sm text-default-500">{localSettings.subjects?.length || 0} subjects configured</p>
              </div>
              <Button
                color="primary"
                radius="full"
                startContent={<Plus size={16} />}
                onPress={() => { setEditingSubject(null); setNewSubject({ name: "", code: "", assignedClasses: [] }); subjectModal.onOpen(); }}
                className="shadow-md"
              >
                Add Subject
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {localSettings.subjects && localSettings.subjects.length > 0 ? (
                [...localSettings.subjects]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((subject, index) => {
                    const subjectId = subject.id || subject._id;
                    return (
                      <div key={subjectId || `subject-${index}`} className="group p-4 bg-white dark:bg-zinc-950 border border-default-200 rounded-xl hover:border-primary transition-all duration-200 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                              {subject.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-default-900">{subject.name}</h4>
                              <p className="text-xs text-default-500 font-mono bg-default-100 px-1.5 py-0.5 rounded inline-block mt-1">{subject.code}</p>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button isIconOnly variant="light" color="primary" size="sm" onPress={() => handleEditSubject(subject)}>
                              <Edit2 size={14} />
                            </Button>
                            <Button isIconOnly variant="light" color="danger" size="sm" onPress={() => handleDeleteSubject(subject)}>
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                        {/* Assigned Classes */}
                        {subject.assignedClasses && subject.assignedClasses.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-default-100">
                            <div className="flex items-center gap-2 mb-2">
                              <Layers size={12} className="text-default-400" />
                              <span className="text-xs font-medium text-default-500">{t('pages.assignedToClasses')}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {subject.assignedClasses.sort((a, b) => a - b).map(cls => (
                                <Chip key={cls} size="sm" color="primary" variant="flat" className="text-xs">
                                  {cls}
                                </Chip>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
              ) : (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-default-400 bg-white dark:bg-zinc-950 border border-default-200 rounded-xl border-dashed">
                  <BookOpen size={32} className="mb-3 opacity-50" />
                  <p>{t('pages.noSubjectsDefinedYet')}</p>
                  <Button
                    color="primary"
                    variant="light"
                    size="sm"
                    className="mt-3"
                    onPress={() => subjectModal.onOpen()}
                  >
                    Add your first subject
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Tab>

        {/* Classes Tab */}
        <Tab key="classes" title={
          <div className="flex items-center gap-2">
            <GraduationCap size={18} />
            <span>{t('pages.classesSections')}</span>
          </div>
        }>
          <div className="pt-6 space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-default-900">{t('pages.classesSections')}</h3>
                <p className="text-sm text-default-500">{t('pages.enableClassesAndManageSections')}</p>
              </div>
            </div>

            {/* List View */}
            <div className="rounded-xl border border-default-200 bg-white dark:bg-zinc-950 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-default-200 bg-default-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-default-500 uppercase tracking-wider w-16">{t('pages.class1')}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-default-500 uppercase tracking-wider">{t('pages.sections1')}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-default-500 uppercase tracking-wider w-24">{t('pages.students1')}</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-default-500 uppercase tracking-wider w-20">{t('pages.enabled')}</th>
                  </tr>
                </thead>
                <tbody>
                  {ALL_CLASSES.map((classNum) => {
                    const config = classConfig[classNum];
                    const hasStudents = config.totalStrength > 0;
                    return (
                      <tr key={classNum} className={`border-b border-default-100 last:border-b-0 ${config.enabled ? 'bg-primary/5' : ''}`}>
                        <td className="px-4 py-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                            config.enabled ? 'bg-primary text-white' : 'bg-default-100 text-default-500'
                          }`}>
                            {classNum}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {config.enabled ? (
                            <div className="flex flex-wrap items-center gap-2">
                              {config.sectionDetails.map((cls) => (
                                <div key={cls.id || cls._id} className="group flex items-center gap-1">
                                  <Chip size="sm" color="primary" variant="flat">
                                    {cls.section}
                                  </Chip>
                                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="light"
                                      className="h-6 w-6 min-w-6"
                                      onPress={() => handleEditSection(classNum, cls.section, cls.id || cls._id)}
                                    >
                                      <Edit2 size={10} />
                                    </Button>
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="light"
                                      color="danger"
                                      className="h-6 w-6 min-w-6"
                                      onPress={() => handleDeleteSection(cls)}
                                    >
                                      <Trash2 size={10} />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="primary"
                                className="h-7 w-7 min-w-7"
                                onPress={() => openAddSectionModal(classNum)}
                              >
                                <Plus size={14} />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-default-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm ${config.totalStrength > 0 ? 'text-default-700 font-medium' : 'text-default-400'}`}>
                            {config.totalStrength || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Tooltip
                            content={hasStudents ? "Cannot disable: Students enrolled" : config.enabled ? "Click to disable" : "Click to enable"}
                            placement="top"
                          >
                            <div className="flex justify-center">
                              <Switch
                                size="sm"
                                color="primary"
                                isSelected={config.enabled}
                                isDisabled={hasStudents && config.enabled}
                                onValueChange={(enabled) => {
                                  if (enabled) {
                                    setSelectedClassNum(classNum);
                                    setEditingSection(null);
                                    setNewSection("");
                                    classModal.onOpen();
                                  } else {
                                    handleDisableClass(classNum);
                                  }
                                }}
                              />
                            </div>
                          </Tooltip>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Tab>
      </Tabs>

      {/* ==================== MODALS ==================== */}

      {/* Academic Session Modal */}
      <Modal isOpen={academicYearModal.isOpen} onClose={academicYearModal.onClose} size="2xl">
        <ModalContent>
          <ModalHeader>{t('pages.editAcademicSession')}</ModalHeader>
          <ModalBody>
            <AcademicYearForm
              settings={localSettings}
              onSave={(data) => handleSaveSection(data, academicYearModal.onClose)}
              onCancel={academicYearModal.onClose}
              saving={saving}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* School Timings Modal */}
      <Modal isOpen={schoolTimingsModal.isOpen} onClose={schoolTimingsModal.onClose} size="2xl">
        <ModalContent>
          <ModalHeader>{t('pages.editSchoolTimings')}</ModalHeader>
          <ModalBody>
            <SchoolTimingsForm
              settings={localSettings}
              onSave={(data) => handleSaveSection(data, schoolTimingsModal.onClose)}
              onCancel={schoolTimingsModal.onClose}
              saving={saving}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Period Configuration Modal */}
      <Modal isOpen={periodConfigModal.isOpen} onClose={periodConfigModal.onClose} size="2xl">
        <ModalContent>
          <ModalHeader>{t('pages.editPeriodConfiguration')}</ModalHeader>
          <ModalBody>
            <PeriodConfigForm
              settings={localSettings}
              onSave={(data) => handleSaveSection(data, periodConfigModal.onClose)}
              onCancel={periodConfigModal.onClose}
              saving={saving}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Working Days Modal */}
      <Modal isOpen={workingDaysModal.isOpen} onClose={workingDaysModal.onClose} size="2xl">
        <ModalContent>
          <ModalHeader>{t('pages.editWorkingDays')}</ModalHeader>
          <ModalBody>
            <WorkingDaysForm
              settings={localSettings}
              onSave={(data) => handleSaveSection(data, workingDaysModal.onClose)}
              onCancel={workingDaysModal.onClose}
              saving={saving}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Subject Modal */}
      <Modal isOpen={subjectModal.isOpen} onClose={handleSubjectModalClose} size="lg">
        <ModalContent>
          <ModalHeader>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</ModalHeader>
          <ModalBody>
            <div className="space-y-4 py-2">
              <Input
                label={t('pages.subjectName1')}
                placeholder="e.g., Mathematics"
                value={newSubject.name}
                onValueChange={(v) => { setNewSubject({ ...newSubject, name: v }); setSubjectErrors(prev => ({ ...prev, name: '' })); }}
                variant="bordered"
                labelPlacement="outside"
                isInvalid={!!subjectErrors.name}
                errorMessage={subjectErrors.name}
              />
              <Input
                label={t('pages.subjectCode1')}
                placeholder="e.g., MATH"
                value={newSubject.code}
                onValueChange={(v) => { setNewSubject({ ...newSubject, code: v.toUpperCase() }); setSubjectErrors(prev => ({ ...prev, code: '' })); }}
                variant="bordered"
                labelPlacement="outside"
                isInvalid={!!subjectErrors.code}
                errorMessage={subjectErrors.code}
              />

              {/* Class Assignment */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-default-700">{t('pages.assignToClasses1')}</label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      onPress={() => setNewSubject(prev => ({ ...prev, assignedClasses: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] }))}
                    >
                      Select All
                    </Button>
                    <Button
                      size="sm"
                      variant="flat"
                      color="default"
                      onPress={() => setNewSubject(prev => ({ ...prev, assignedClasses: [] }))}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {ALL_CLASSES.map(classNum => {
                    const isSelected = newSubject.assignedClasses?.includes(classNum);
                    return (
                      <div
                        key={classNum}
                        className={`flex items-center justify-center p-2 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary font-semibold'
                            : 'border-default-200 hover:border-default-300 text-default-600'
                        }`}
                        onClick={() => {
                          const currentClasses = newSubject.assignedClasses || [];
                          const newClasses = isSelected
                            ? currentClasses.filter(c => c !== classNum)
                            : [...currentClasses, classNum];
                          setNewSubject(prev => ({ ...prev, assignedClasses: newClasses }));
                        }}
                      >
                        {classNum}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-default-400">
                  {newSubject.assignedClasses?.length || 0} class{(newSubject.assignedClasses?.length || 0) !== 1 ? 'es' : ''} selected
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={handleSubjectModalClose}>{t('pages.cancel2')}</Button>
            <Button
              color="primary"
              onPress={editingSubject ? handleUpdateSubject : handleAddSubject}
              isDisabled={!newSubject.name.trim() || !newSubject.code.trim()}
            >
              {editingSubject ? 'Update Subject' : 'Add Subject'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Section Modal */}
      <Modal isOpen={classModal.isOpen} onClose={handleClassModalClose} size="sm">
        <ModalContent>
          <ModalHeader>
            {editingSection
              ? `Edit Section - Class ${editingSection.classNum}`
              : selectedClassNum
                ? `Add Section - Class ${selectedClassNum}`
                : 'Add Section'
            }
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4 py-2">
              <Input
                label={t('pages.section1')}
                placeholder="e.g., A"
                value={newSection}
                onValueChange={(v) => { setNewSection(v.toUpperCase().slice(0, 1)); setSectionError(''); }}
                variant="bordered"
                labelPlacement="outside"
                description="Enter section letter (A-Z)"
                autoFocus
                isInvalid={!!sectionError}
                errorMessage={sectionError}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={handleClassModalClose}>{t('pages.cancel2')}</Button>
            <Button
              color="primary"
              onPress={editingSection ? handleUpdateSection : handleAddSection}
              isDisabled={!newSection.trim()}
            >
              {editingSection ? 'Update' : 'Add'} Section
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

// ==================== FORM COMPONENTS ====================

function AcademicYearForm({ settings, onSave, onCancel, saving }) {
  const [formData, setFormData] = useState({
    academicYear: settings.academicYear || "",
    academicYearStart: settings.academicYearStart || "",
    academicYearEnd: settings.academicYearEnd || "",
  });

  return (
    <div className="space-y-6 py-4">
      <Input
        label={t('pages.sessionName')}
        labelPlacement="outside"
        placeholder="e.g., 2024-2025"
        value={formData.academicYear}
        onValueChange={(v) => setFormData({ ...formData, academicYear: v })}
        variant="bordered"
        description="This label will appear on all reports and documents."
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          type="date"
          label={t('pages.startDate1')}
          labelPlacement="outside"
          value={formData.academicYearStart}
          onValueChange={(v) => setFormData({ ...formData, academicYearStart: v })}
          variant="bordered"
        />
        <Input
          type="date"
          label={t('pages.endDate1')}
          labelPlacement="outside"
          value={formData.academicYearEnd}
          onValueChange={(v) => setFormData({ ...formData, academicYearEnd: v })}
          variant="bordered"
        />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="light" onPress={onCancel} disabled={saving}>{t('pages.cancel2')}</Button>
        <Button color="primary" onPress={() => onSave(formData)} isLoading={saving}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}

function SchoolTimingsForm({ settings, onSave, onCancel, saving }) {
  const [formData, setFormData] = useState({
    schoolStartTime: settings.schoolStartTime || "",
    schoolEndTime: settings.schoolEndTime || "",
  });

  return (
    <div className="space-y-6 py-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          type="time"
          label={t('pages.schoolStarts')}
          labelPlacement="outside"
          value={formData.schoolStartTime}
          onValueChange={(v) => setFormData({ ...formData, schoolStartTime: v })}
          variant="bordered"
        />
        <Input
          type="time"
          label={t('pages.schoolEnds')}
          labelPlacement="outside"
          value={formData.schoolEndTime}
          onValueChange={(v) => setFormData({ ...formData, schoolEndTime: v })}
          variant="bordered"
        />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="light" onPress={onCancel} disabled={saving}>{t('pages.cancel2')}</Button>
        <Button color="primary" onPress={() => onSave(formData)} isLoading={saving}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}

function PeriodConfigForm({ settings, onSave, onCancel, saving }) {
  const [formData, setFormData] = useState({
    periodDuration: settings.periodDuration || 45,
    periodsPerDay: settings.periodsPerDay || 8,
  });

  // Calculate instructional time
  const totalMinutes = (formData.periodsPerDay || 0) * (formData.periodDuration || 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <div className="space-y-6 py-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          type="number"
          label={t('pages.periodDurationMinutes')}
          labelPlacement="outside"
          value={String(formData.periodDuration)}
          onValueChange={(v) => setFormData({ ...formData, periodDuration: parseInt(v) || 0 })}
          variant="bordered"
          min={1}
          max={120}
        />
        <Input
          type="number"
          label={t('pages.periodsPerDay1')}
          labelPlacement="outside"
          value={String(formData.periodsPerDay)}
          onValueChange={(v) => setFormData({ ...formData, periodsPerDay: parseInt(v) || 0 })}
          variant="bordered"
          min={1}
          max={15}
        />
      </div>
      <div className="p-4 bg-default-50 rounded-lg">
        <p className="text-sm text-default-600">
          <span className="font-medium">{t('pages.instructionalTime')}</span> {hours}h {minutes}m
          <span className="text-default-400 ml-2">({formData.periodsPerDay} periods × {formData.periodDuration} minutes)</span>
        </p>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="light" onPress={onCancel} disabled={saving}>{t('pages.cancel2')}</Button>
        <Button color="primary" onPress={() => onSave(formData)} isLoading={saving}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}

function WorkingDaysForm({ settings, onSave, onCancel, saving }) {
  const [workingDays, setWorkingDays] = useState(settings.workingDays || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);

  const days = [
    { key: "Mon", label: "Monday" },
    { key: "Tue", label: "Tuesday" },
    { key: "Wed", label: "Wednesday" },
    { key: "Thu", label: "Thursday" },
    { key: "Fri", label: "Friday" },
    { key: "Sat", label: "Saturday" },
    { key: "Sun", label: "Sunday" },
  ];

  const toggleDay = (dayKey) => {
    const newDays = workingDays.includes(dayKey)
      ? workingDays.filter(d => d !== dayKey)
      : [...workingDays, dayKey];
    setWorkingDays(newDays);
  };

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-3">
        {days.map((day) => {
          const isActive = workingDays.includes(day.key);
          return (
            <div
              key={day.key}
              className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                isActive ? 'bg-primary/5 border-primary' : 'bg-white dark:bg-zinc-950 border-default-200 hover:border-default-300'
              }`}
              onClick={() => toggleDay(day.key)}
            >
              <span className={`font-medium ${isActive ? 'text-primary' : 'text-default-700'}`}>{day.label}</span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                isActive ? 'bg-primary border-primary' : 'border-default-300'
              }`}>
                {isActive && <Check size={12} className="text-white" />}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="light" onPress={onCancel} disabled={saving}>{t('pages.cancel2')}</Button>
        <Button color="primary" onPress={() => onSave({ workingDays })} isLoading={saving}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
