import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Breadcrumbs, BreadcrumbItem, Modal, ModalContent, ModalHeader, ModalBody } from '@heroui/react';
import { Home, BarChart3, FileText, Plus, BookOpen, Award, ClipboardList, CalendarRange } from 'lucide-react';
import { PageLayout, MinimalButton } from '../../components/ui';
import PerformanceDashboard from './PerformanceDashboard';
import ExamManagement from './ExamManagement';
import CreateExamModal from './CreateExamModal';
import CreateExamScheduleModal from './CreateExamScheduleModal';
import ExamScheduleConflict from './ExamScheduleConflict';
import SubjectAssignment from '../../components/SubjectAssignment';
import CBSEReportCardPage from './CBSEReportCardPage';
import CCEGradingPage from './CCEGradingPage';
import { useTranslation } from 'react-i18next';

const AcademicLayout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Modal states
  const [createExamOpen, setCreateExamOpen] = useState(false);
  const [createScheduleOpen, setCreateScheduleOpen] = useState(false);

  // Determine active tab from URL
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/academics' || path === '/academics/') return 'dashboard';
    if (path.startsWith('/academics/exams')) return 'exams';
    if (path.startsWith('/academics/schedules')) return 'schedules';
    if (path.startsWith('/academics/subjects')) return 'subjects';
    if (path.startsWith('/academics/cbse-report-card')) return 'cbse';
    if (path.startsWith('/academics/cce-grading')) return 'cce';
    return 'dashboard';
  };

  const activeTab = getActiveTab();

  const tabs = [
    {
      key: "dashboard",
      title: (
        <div className="flex items-center gap-2">
          <BarChart3 size={16} />
          <span>{t('pages.dashboard1')}</span>
        </div>
      ),
    },
    {
      key: "exams",
      title: (
        <div className="flex items-center gap-2">
          <FileText size={16} />
          <span>{t('pages.exams1')}</span>
        </div>
      ),
    },
    {
      key: "schedules",
      title: (
        <div className="flex items-center gap-2">
          <CalendarRange size={16} />
          <span>{t('pages.examSchedules')}</span>
        </div>
      ),
    },
    {
      key: "subjects",
      title: (
        <div className="flex items-center gap-2">
          <BookOpen size={16} />
          <span>{t('pages.subjects1')}</span>
        </div>
      ),
    },
    {
      key: "cbse",
      title: (
        <div className="flex items-center gap-2">
          <Award size={16} />
          <span>{t('pages.cbseReportCard')}</span>
        </div>
      ),
    },
    {
      key: "cce",
      title: (
        <div className="flex items-center gap-2">
          <ClipboardList size={16} />
          <span>{t('pages.cceGrading')}</span>
        </div>
      ),
    },
  ];

  const handleTabChange = useCallback((key) => {
    if (key === 'dashboard') navigate('/academics', { replace: true });
    else if (key === 'exams') navigate('/academics/exams', { replace: true });
    else if (key === 'schedules') navigate('/academics/schedules', { replace: true });
    else if (key === 'subjects') navigate('/academics/subjects', { replace: true });
    else if (key === 'cbse') navigate('/academics/cbse-report-card', { replace: true });
    else if (key === 'cce') navigate('/academics/cce-grading', { replace: true });
  }, [navigate]);

  const getHeader = () => {
    if (activeTab === 'exams') {
      return { title: t('pages.examManagement'), description: t('pages.examManagementDesc') };
    }
    if (activeTab === 'schedules') {
      return { title: t('pages.examSchedules'), description: t('pages.examSchedulesDesc') };
    }
    if (activeTab === 'subjects') {
      return { title: t('pages.subjectAssignment'), description: t('pages.subjectAssignmentDesc') };
    }
    if (activeTab === 'cbse') {
      return { title: t('pages.cbseReportCard'), description: t('pages.cbseReportCardDesc') };
    }
    if (activeTab === 'cce') {
      return { title: t('pages.cceGrading'), description: t('pages.cceGradingDesc') };
    }
    return { title: t('pages.academicDashboard'), description: t('pages.academicDashboardDesc') };
  };

  // Create Exam handlers
  const handleOpenCreateExam = useCallback(() => {
    setCreateExamOpen(true);
  }, []);

  const handleCloseCreateExam = useCallback(() => {
    setCreateExamOpen(false);
  }, []);

  const [refreshKey, setRefreshKey] = useState(0);

  const handleExamCreated = useCallback(() => {
    setCreateExamOpen(false);
    setRefreshKey(k => k + 1);
  }, []);

  const [scheduleRefreshKey, setScheduleRefreshKey] = useState(0);

  const handleScheduleCreated = useCallback(() => {
    setCreateScheduleOpen(false);
    setScheduleRefreshKey(k => k + 1);
  }, []);

  const actions = activeTab === 'exams' ? (
    <MinimalButton icon={<Plus size={16} />} onClick={handleOpenCreateExam}>
      {t('pages.createExam')}
    </MinimalButton>
  ) : activeTab === 'schedules' ? (
    <MinimalButton icon={<Plus size={16} />} onClick={() => setCreateScheduleOpen(true)}>
      {t('pages.newSchedule')}
    </MinimalButton>
  ) : null;

  return (
    <div className="animate-fade-in">
      {/* Breadcrumbs Section */}
      <div className="mb-4">
        <Breadcrumbs size="sm">
          <BreadcrumbItem startContent={<Home size={14} />} onPress={() => navigate('/')}>
            Home
          </BreadcrumbItem>
          <BreadcrumbItem>{t('pages.academics1')}</BreadcrumbItem>
          {activeTab === 'exams' && <BreadcrumbItem>{t('pages.exams1')}</BreadcrumbItem>}
          {activeTab === 'subjects' && <BreadcrumbItem>{t('pages.subjects1')}</BreadcrumbItem>}
          {activeTab === 'cbse' && <BreadcrumbItem>CBSE Report Card</BreadcrumbItem>}
          {activeTab === 'cce' && <BreadcrumbItem>CCE Grading</BreadcrumbItem>}
        </Breadcrumbs>
      </div>

      {/* Page Layout with Tabs */}
      <PageLayout
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        header={getHeader()}
        actions={actions}
        noPadding
      >
        <div className="min-h-[500px] p-6">
          {activeTab === 'dashboard' && (
            <PerformanceDashboard onCreateExam={handleOpenCreateExam} />
          )}
          {activeTab === 'exams' && (
            <ExamManagement
              key={refreshKey}
              onCreateExam={handleOpenCreateExam}
            />
          )}
          {activeTab === 'schedules' && (
            <ExamScheduleConflict
              key={scheduleRefreshKey}
              onCreateSchedule={() => setCreateScheduleOpen(true)}
            />
          )}
          {activeTab === 'subjects' && (
            <SubjectAssignment />
          )}
          {activeTab === 'cbse' && (
            <CBSEReportCardPage />
          )}
          {activeTab === 'cce' && (
            <CCEGradingPage />
          )}
        </div>
      </PageLayout>

      {/* Create Exam Modal */}
      <Modal
        isOpen={createExamOpen}
        onClose={handleCloseCreateExam}
        size="2xl"
        scrollBehavior="inside"
        classNames={{
          backdrop: 'bg-black/30',
          base: 'bg-white dark:bg-zinc-950 max-h-[90vh]',
          body: 'py-0'
        }}
      >
        <ModalContent>
          <ModalHeader className="border-b border-gray-100 dark:border-zinc-800 py-4 px-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                <FileText size={20} className="text-gray-600 dark:text-zinc-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100">{t('pages.createNewExam')}</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400 font-normal">{t('pages.scheduleANewExamination')}</p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="px-6 pb-6 pt-4">
            <CreateExamModal
              onClose={handleCloseCreateExam}
              onSuccess={handleExamCreated}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Create Exam Schedule Modal */}
      <Modal
        isOpen={createScheduleOpen}
        onClose={() => setCreateScheduleOpen(false)}
        size="2xl"
        scrollBehavior="inside"
        classNames={{
          backdrop: 'bg-black/30',
          base: 'bg-white dark:bg-zinc-950 max-h-[90vh]',
          body: 'py-0'
        }}
      >
        <ModalContent>
          <ModalHeader className="border-b border-gray-100 dark:border-zinc-800 py-4 px-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                <CalendarRange size={20} className="text-gray-600 dark:text-zinc-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100">New Exam Schedule</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400 font-normal">Create a multi-class exam timetable</p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="px-6 pb-6 pt-4">
            <CreateExamScheduleModal
              onClose={() => setCreateScheduleOpen(false)}
              onSuccess={handleScheduleCreated}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

    </div>
  );
};

export default AcademicLayout;
