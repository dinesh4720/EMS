import { useState, useEffect, useRef, useMemo } from "react";
import logger from "../../../../utils/logger";
import { useApp } from "../../../../context/AppContext";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

// Validation functions
export const validateSettings = (settings) => {
  const errors = [];

  if (!settings.workingDays || settings.workingDays.length === 0) {
    errors.push("At least one working day must be selected");
  }

  if (settings.academicYearStart && settings.academicYearEnd) {
    const startDate = new Date(settings.academicYearStart);
    const endDate = new Date(settings.academicYearEnd);
    if (endDate <= startDate) {
      errors.push("Academic year end date must be after start date");
    }
  }

  if (settings.schoolStartTime && settings.schoolEndTime) {
    const start = settings.schoolStartTime.split(':').map(Number);
    const end = settings.schoolEndTime.split(':').map(Number);
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    if (endMinutes <= startMinutes) {
      errors.push("School end time must be after start time");
    }
    if (settings.periodDuration && settings.periodsPerDay) {
      const totalPeriodMinutes = settings.periodsPerDay * settings.periodDuration;
      const availableMinutes = endMinutes - startMinutes;
      if (totalPeriodMinutes > availableMinutes) {
        errors.push(`Total period time (${Math.floor(totalPeriodMinutes / 60)}h ${totalPeriodMinutes % 60}m) exceeds school hours (${Math.floor(availableMinutes / 60)}h ${availableMinutes % 60}m)`);
      }
    }
  }

  if (settings.periodDuration && settings.periodDuration <= 0) {
    errors.push("Period duration must be greater than 0");
  }
  if (settings.periodsPerDay && settings.periodsPerDay <= 0) {
    errors.push("Number of periods per day must be greater than 0");
  }

  return errors;
};

export function useAcademicSettingsHandlers({
  localSettings,
  setLocalSettings,
  saving,
  setSaving,
  loading,
  subjectModal,
  classModal,
}) {
  const { t } = useTranslation();
  const { schoolSettings, updateSchoolSettings, addSubject, updateSubject, deleteSubject, addClass, updateClass, deleteClass } = useApp();

  const [subjectErrors, setSubjectErrors] = useState({});
  const [sectionError, setSectionError] = useState('');
  const [newSubject, setNewSubject] = useState({ name: "", code: "", assignedClasses: [] });
  const [editingSubject, setEditingSubject] = useState(null);
  const [selectedClassNum, setSelectedClassNum] = useState(null);
  const [newSection, setNewSection] = useState("");
  const [editingSection, setEditingSection] = useState(null);
  // AUDIT-128: State-driven delete confirmation
  const [pendingDeleteKey, setPendingDeleteKey] = useState(null);
  // AUDIT-179: Track delete confirmation timeout for cleanup on unmount
  const deleteTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
    };
  }, []);

  // Generic save handler for modals
  // AUDIT-132: Guard against saving while settings are still loading
  const handleSaveSection = async (sectionData, closeModal) => {
    if (saving || loading || !localSettings) {
      toast.error('Please wait for settings to load before saving');
      return;
    }
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
      toast.success(t('toast.success.settingsSavedSuccessfully'));
      closeModal();
    } catch (error) {
      logger.error('Failed to save settings:', error);
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
    const existingSubjects = schoolSettings?.subjects || [];
    const trimmedCode = newSubject.code.trim().toUpperCase();
    const trimmedName = newSubject.name.trim().toLowerCase();
    if (existingSubjects.some(s => s.code && s.code.toUpperCase() === trimmedCode)) {
      setSubjectErrors(prev => ({ ...prev, code: `Subject code "${newSubject.code.trim()}" is already in use` }));
      toast.error(`Subject code "${newSubject.code.trim()}" is already in use`);
      return;
    }
    if (existingSubjects.some(s => s.name.toLowerCase() === trimmedName)) {
      setSubjectErrors(prev => ({ ...prev, name: `A subject named "${newSubject.name.trim()}" already exists` }));
      toast.error(`A subject named "${newSubject.name.trim()}" already exists`);
      return;
    }
    try {
      await addSubject(newSubject);
      setNewSubject({ name: "", code: "", assignedClasses: [] });
      subjectModal.onClose();
      toast.success(t('toast.success.subjectAddedSuccessfully'));
    } catch (error) {
      logger.error('Failed to add subject:', error);
      toast.error(error.response?.data?.message || t('toast.error.failedToAddSubject'));
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
    const editingId = String(editingSubject.id || editingSubject._id);
    const existingSubjects = (schoolSettings?.subjects || []).filter(
      s => String(s.id || s._id) !== editingId
    );
    const trimmedCode = newSubject.code.trim().toUpperCase();
    const trimmedName = newSubject.name.trim().toLowerCase();
    if (existingSubjects.some(s => s.code && s.code.toUpperCase() === trimmedCode)) {
      setSubjectErrors(prev => ({ ...prev, code: `Subject code "${newSubject.code.trim()}" is already in use` }));
      toast.error(`Subject code "${newSubject.code.trim()}" is already in use`);
      return;
    }
    if (existingSubjects.some(s => s.name.toLowerCase() === trimmedName)) {
      setSubjectErrors(prev => ({ ...prev, name: `A subject named "${newSubject.name.trim()}" already exists` }));
      toast.error(`A subject named "${newSubject.name.trim()}" already exists`);
      return;
    }
    try {
      await updateSubject(editingSubject.id || editingSubject._id, newSubject);
      setEditingSubject(null);
      setNewSubject({ name: "", code: "", assignedClasses: [] });
      subjectModal.onClose();
      toast.success(t('toast.success.subjectUpdatedSuccessfully'));
    } catch (error) {
      logger.error('Failed to update subject:', error);
      toast.error(error.response?.data?.message || t('toast.error.failedToUpdateSubject'));
    }
  };

  const handleDeleteSubject = async (subject) => {
    const subjectId = subject.id || subject._id;
    if (!subjectId) {
      toast.error(t('toast.error.cannotDeleteSubjectMissingId'));
      return;
    }
    // AUDIT-128: Replaced confirm() with state-driven confirmation
    const deleteKey = `subject-${subjectId}`;
    if (pendingDeleteKey !== deleteKey) {
      setPendingDeleteKey(deleteKey);
      toast(`Delete "${subject.name}"? Click delete again to confirm.`, { icon: '\u26A0\uFE0F', duration: 3000 });
      if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
      deleteTimeoutRef.current = setTimeout(() => setPendingDeleteKey(null), 3000);
      return;
    }
    setPendingDeleteKey(null);
    try {
      await deleteSubject(subjectId);
      toast.success(t('toast.success.subjectDeletedSuccessfully'));
    } catch (error) {
      logger.error('Failed to delete subject:', error);
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
      logger.error('Failed to add section:', error);
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
      logger.error('Failed to update section:', error);
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
    // AUDIT-128: Replaced confirm() with state-driven confirmation
    const deleteKey = `class-${classId}`;
    if (pendingDeleteKey !== deleteKey) {
      setPendingDeleteKey(deleteKey);
      toast(`Delete Class ${classNum} Section ${cls.section}? Click delete again to confirm.`, { icon: '\u26A0\uFE0F', duration: 3000 });
      if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
      deleteTimeoutRef.current = setTimeout(() => setPendingDeleteKey(null), 3000);
      return;
    }
    setPendingDeleteKey(null);
    try {
      await deleteClass(classId);
      toast.success(t('toast.success.sectionDeletedSuccessfully'));
    } catch (error) {
      logger.error('Failed to delete section:', error);
      if (error.message?.includes('students')) {
        toast.error(t('toast.error.cannotDeleteStudentsAreEnrolledInThisSection'));
      } else {
        toast.error(t('toast.error.failedToDeleteSection'));
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

  return {
    // Subject state
    subjectErrors,
    setSubjectErrors,
    newSubject,
    setNewSubject,
    editingSubject,
    setEditingSubject,
    // Section state
    sectionError,
    setSectionError,
    selectedClassNum,
    setSelectedClassNum,
    newSection,
    setNewSection,
    editingSection,
    setEditingSection,
    // Handlers
    handleSaveSection,
    handleAddSubject,
    handleEditSubject,
    handleUpdateSubject,
    handleDeleteSubject,
    handleSubjectModalClose,
    handleAddSection,
    handleEditSection,
    handleUpdateSection,
    handleDeleteSection,
    handleClassModalClose,
  };
}

export function useClassConfig(classes) {
  const classConfig = useMemo(() => {
    const existingClassNums = new Set();
    if (classes && classes.length > 0) {
      classes.forEach(cls => {
        const num = parseInt(cls.name?.replace(/\D/g, '') || cls.class?.replace(/\D/g, '') || '0');
        if (num > 0) existingClassNums.add(num);
      });
    }

    const maxClass = Math.max(12, ...existingClassNums, 0);
    const minClass = Math.min(1, ...existingClassNums);
    const allNums = [];
    for (let i = minClass; i <= maxClass; i++) {
      if (i > 0) allNums.push(i);
    }

    const grouped = {};
    allNums.forEach(num => {
      grouped[num] = {
        classNum: num,
        enabled: false,
        sections: [],
        sectionDetails: [],
        totalStrength: 0
      };
    });

    if (classes && classes.length > 0) {
      classes.forEach(cls => {
        const classNum = parseInt(cls.name?.replace(/\D/g, '') || cls.class?.replace(/\D/g, '') || '0');
        if (classNum > 0 && grouped[classNum]) {
          grouped[classNum].enabled = true;
          if (cls.section) {
            grouped[classNum].sections.push(cls.section);
          }
          grouped[classNum].sectionDetails.push(cls);
          grouped[classNum].totalStrength += cls.strength || 0;
        }
      });
    }

    Object.values(grouped).forEach(g => {
      g.sections = [...new Set(g.sections)].sort();
      g.sectionDetails = g.sectionDetails.sort((a, b) => (a.section || '').localeCompare(b.section || ''));
    });

    return grouped;
  }, [classes]);

  const ALL_CLASSES = useMemo(() => Object.keys(classConfig).map(Number).sort((a, b) => a - b), [classConfig]);

  return { classConfig, ALL_CLASSES };
}
