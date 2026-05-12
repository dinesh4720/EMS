import { safeGetItem, safeSetItem } from '../../utils/safeStorage';
import { useState, useEffect, useMemo } from "react";
import {
  Modal as HeroModal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
} from "@heroui/react";
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { BookOpen, Calendar, GraduationCap } from "lucide-react";
import { PageHeader, Tabs, ErrorState } from "../../components/ui";
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
  const { schoolSettings, classes, loading } = useApp();

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

  // Disable a class (delete all sections) — handled in hook; placeholder retained for prop wiring
  const handleDisableClass = async (_classNum) => {};

  const tabs = useMemo(
    () => [
      {
        key: 'schedule',
        title: t('pages.scheduleTimings'),
        icon: <Calendar size={16} />,
      },
      {
        key: 'subjects',
        title: t('pages.subjects1'),
        icon: <BookOpen size={16} />,
      },
      {
        key: 'classes',
        title: t('pages.classesSections'),
        icon: <GraduationCap size={16} />,
      },
    ],
    [t]
  );

  if (loading) {
    return <TablePageSkeleton />;
  }

  if (!localSettings) {
    return (
      <div className="max-w-4xl mx-auto pb-10">
        <ErrorState
          title="Unable to load academic settings"
          description="We couldn't load your academic settings. Please refresh the page."
        />
      </div>
    );
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
    <div className="max-w-4xl mx-auto pb-10 space-y-6">
      <PageHeader
        title={t('pages.academicConfiguration')}
        description={t('pages.manageAcademicSessionsTimingsSubjectsAndClassStructures')}
        bordered={false}
        size="lg"
        className="px-0"
      />

      <Tabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab} variant="underline" />

      <div className="pt-2">
        {activeTab === 'schedule' && (
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
        )}
        {activeTab === 'subjects' && (
          <SubjectsTab
            localSettings={localSettings}
            onEditSubject={handleEditSubject}
            onDeleteSubject={handleDeleteSubject}
            onOpenSubjectModal={subjectModal.onOpen}
            setEditingSubject={setEditingSubject}
            setNewSubject={setNewSubject}
          />
        )}
        {activeTab === 'classes' && (
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
        )}
      </div>

      {/* ==================== MODALS ==================== */}

      <HeroModal isOpen={academicYearModal.isOpen} onClose={academicYearModal.onClose} size="2xl">
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
      </HeroModal>

      <HeroModal isOpen={schoolTimingsModal.isOpen} onClose={schoolTimingsModal.onClose} size="2xl">
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
      </HeroModal>

      <HeroModal isOpen={periodConfigModal.isOpen} onClose={periodConfigModal.onClose} size="2xl">
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
      </HeroModal>

      <HeroModal isOpen={workingDaysModal.isOpen} onClose={workingDaysModal.onClose} size="2xl">
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
      </HeroModal>

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
