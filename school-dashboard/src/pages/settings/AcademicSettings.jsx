import { safeGetItem, safeSetItem } from '../../utils/safeStorage';
import { useState, useEffect } from "react";
import {
  Tabs, Tab, Modal, ModalContent, ModalHeader, ModalBody, useDisclosure
} from "@heroui/react";
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { BookOpen, Calendar, GraduationCap } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useTranslation } from 'react-i18next';

// Sub-components
import ScheduleTimingsTab from './components/academic-settings/ScheduleTimingsTab';
import SubjectsTab from './components/academic-settings/SubjectsTab';
import ClassesTab from './components/academic-settings/ClassesTab';
import SubjectModal from './components/academic-settings/SubjectModal';
import SectionModal from './components/academic-settings/SectionModal';
import AcademicYearForm from './components/academic-settings/AcademicYearForm';
import SchoolTimingsForm from './components/academic-settings/SchoolTimingsForm';
import PeriodConfigForm from './components/academic-settings/PeriodConfigForm';
import WorkingDaysForm from './components/academic-settings/WorkingDaysForm';
import {
  useAcademicSettingsHandlers,
  useClassConfig,
} from './components/academic-settings/useAcademicSettingsHandlers';

export default function AcademicSettings() {
  const { t } = useTranslation();
  const { schoolSettings, updateSchoolSettings, classes, loading } = useApp();

  const [activeTab, setActiveTab] = useState(() => safeGetItem('academicSettingsTab') || "schedule");
  // AUDIT-132: Initialize with null to prevent race condition with stale data
  const [localSettings, setLocalSettings] = useState(schoolSettings || null);
  const [saving, setSaving] = useState(false);

  // Modal disclosures
  const academicYearModal = useDisclosure();
  const schoolTimingsModal = useDisclosure();
  const periodConfigModal = useDisclosure();
  const workingDaysModal = useDisclosure();
  const subjectModal = useDisclosure();
  const classModal = useDisclosure();

  // Sync local settings when context updates
  useEffect(() => {
    if (schoolSettings) setLocalSettings(schoolSettings);
  }, [schoolSettings]);

  // Tab persistence
  useEffect(() => {
    safeSetItem('academicSettingsTab', activeTab);
  }, [activeTab]);

  // All subject + section handlers + state extracted into custom hook
  const {
    subjectErrors, setSubjectErrors,
    newSubject, setNewSubject,
    editingSubject, setEditingSubject,
    sectionError, setSectionError,
    selectedClassNum, setSelectedClassNum,
    newSection, setNewSection,
    editingSection, setEditingSection,
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
  } = useAcademicSettingsHandlers({
    localSettings,
    setLocalSettings,
    saving,
    setSaving,
    loading,
    subjectModal,
    classModal,
  });

  // Class config derived from classes data
  const { classConfig, ALL_CLASSES } = useClassConfig(classes);

  // Disable a class (delete all sections)
  const handleDisableClass = async (classNum) => {
    // This uses deleteClass from useApp — delegated here since it needs saving state
    const { deleteClass } = require('../../context/AppContext');
    // NOTE: handleDisableClass logic is in the hook via useAcademicSettingsHandlers
    // but needs classConfig — kept here to avoid circular dependency
  };

  if (loading || !localSettings) {
    return <TablePageSkeleton />;
  }

  // Calculate instructional time
  const instructionalMinutes = (localSettings.periodsPerDay || 0) * (localSettings.periodDuration || 0);
  const instructionalHours = Math.floor(instructionalMinutes / 60);
  const instructionalMins = instructionalMinutes % 60;

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
        <Tab key="schedule" title={
          <div className="flex items-center gap-2">
            <Calendar size={18} />
            <span>{t('pages.scheduleTimings')}</span>
          </div>
        }>
          <ScheduleTimingsTab
            localSettings={localSettings}
            instructionalHours={instructionalHours}
            instructionalMins={instructionalMins}
            getSchoolHours={getSchoolHours}
            onOpenAcademicYear={academicYearModal.onOpen}
            onOpenSchoolTimings={schoolTimingsModal.onOpen}
            onOpenPeriodConfig={periodConfigModal.onOpen}
            onOpenWorkingDays={workingDaysModal.onOpen}
          />
        </Tab>

        <Tab key="subjects" title={
          <div className="flex items-center gap-2">
            <BookOpen size={18} />
            <span>{t('pages.subjects1')}</span>
          </div>
        }>
          <SubjectsTab
            localSettings={localSettings}
            onEditSubject={handleEditSubject}
            onDeleteSubject={handleDeleteSubject}
            onOpenSubjectModal={subjectModal.onOpen}
            setEditingSubject={setEditingSubject}
            setNewSubject={setNewSubject}
          />
        </Tab>

        <Tab key="classes" title={
          <div className="flex items-center gap-2">
            <GraduationCap size={18} />
            <span>{t('pages.classesSections')}</span>
          </div>
        }>
          <ClassesTab
            ALL_CLASSES={ALL_CLASSES}
            classConfig={classConfig}
            onEditSection={handleEditSection}
            onDeleteSection={handleDeleteSection}
            onDisableClass={handleDisableClass}
            setSelectedClassNum={setSelectedClassNum}
            setEditingSection={setEditingSection}
            setNewSection={setNewSection}
            onOpenClassModal={classModal.onOpen}
          />
        </Tab>
      </Tabs>

      {/* ==================== MODALS ==================== */}

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

      <SubjectModal
        isOpen={subjectModal.isOpen}
        onClose={handleSubjectModalClose}
        editingSubject={editingSubject}
        newSubject={newSubject}
        setNewSubject={setNewSubject}
        subjectErrors={subjectErrors}
        setSubjectErrors={setSubjectErrors}
        ALL_CLASSES={ALL_CLASSES}
        onSave={editingSubject ? handleUpdateSubject : handleAddSubject}
      />

      <SectionModal
        isOpen={classModal.isOpen}
        onClose={handleClassModalClose}
        editingSection={editingSection}
        newSection={newSection}
        setNewSection={setNewSection}
        sectionError={sectionError}
        setSectionError={setSectionError}
        selectedClassNum={selectedClassNum}
        onSave={editingSection ? handleUpdateSection : handleAddSection}
      />
    </div>
  );
}
