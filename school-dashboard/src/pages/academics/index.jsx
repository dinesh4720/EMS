import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Breadcrumbs, BreadcrumbItem, Modal, ModalContent, ModalHeader, ModalBody } from '@heroui/react';
import { Home, BarChart3, FileText, Plus } from 'lucide-react';
import { PageLayout, MinimalButton } from '../../components/ui';
import PerformanceDashboard from './PerformanceDashboard';
import ExamManagement from './ExamManagement';
import CreateExamModal from './CreateExamModal';
import ExamDetailModal from './ExamDetailModal';
import ResultsEntryModal from './ResultsEntryModal';

const AcademicLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Modal states
  const [createExamOpen, setCreateExamOpen] = useState(false);
  const [examDetailOpen, setExamDetailOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [resultsEntryOpen, setResultsEntryOpen] = useState(false);

  // Determine active tab from URL
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/academics' || path === '/academics/') return 'dashboard';
    if (path.startsWith('/academics/exams')) return 'exams';
    return 'dashboard';
  };

  const activeTab = getActiveTab();

  const tabs = [
    {
      key: "dashboard",
      title: (
        <div className="flex items-center gap-2">
          <BarChart3 size={16} />
          <span>Dashboard</span>
        </div>
      ),
    },
    {
      key: "exams",
      title: (
        <div className="flex items-center gap-2">
          <FileText size={16} />
          <span>Exams</span>
        </div>
      ),
    },
  ];

  const handleTabChange = useCallback((key) => {
    if (key === 'dashboard') navigate('/academics', { replace: true });
    else if (key === 'exams') navigate('/academics/exams', { replace: true });
  }, [navigate]);

  const getHeader = () => {
    if (activeTab === 'exams') {
      return {
        title: 'Exam Management',
        description: 'Create, schedule, and manage examinations',
      };
    }
    return {
      title: 'Academic Dashboard',
      description: 'Overview of academic performance and analytics',
    };
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
    setRefreshKey(k => k + 1); // Trigger refresh of exam list
  }, []);

  // Exam Detail handlers
  const handleViewExam = useCallback((examId) => {
    setSelectedExamId(examId);
    setExamDetailOpen(true);
  }, []);

  const handleCloseExamDetail = useCallback(() => {
    setExamDetailOpen(false);
    setSelectedExamId(null);
  }, []);

  // Results Entry handlers
  const handleOpenResultsEntry = useCallback((examId) => {
    setSelectedExamId(examId);
    setResultsEntryOpen(true);
  }, []);

  const handleCloseResultsEntry = useCallback(() => {
    setResultsEntryOpen(false);
    setSelectedExamId(null);
    setRefreshKey(k => k + 1); // Trigger refresh after results saved
  }, []);

  const actions = activeTab === 'exams' ? (
    <MinimalButton
      icon={<Plus size={16} />}
      onClick={handleOpenCreateExam}
    >
      Create Exam
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
          <BreadcrumbItem>Academics</BreadcrumbItem>
          {activeTab === 'exams' && <BreadcrumbItem>Exams</BreadcrumbItem>}
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
              onViewExam={handleViewExam}
              onEnterResults={handleOpenResultsEntry}
            />
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
          base: 'bg-white max-h-[90vh]',
          body: 'py-0'
        }}
      >
        <ModalContent>
          <ModalHeader className="border-b border-gray-100 py-4 px-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <FileText size={20} className="text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Create New Exam</h3>
                <p className="text-sm text-gray-500 font-normal">Schedule a new examination</p>
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

      {/* Exam Detail Modal */}
      <Modal
        isOpen={examDetailOpen}
        onClose={handleCloseExamDetail}
        size="3xl"
        scrollBehavior="inside"
        classNames={{
          backdrop: 'bg-black/30',
          base: 'bg-white max-h-[90vh]',
        }}
      >
        <ModalContent>
          <ExamDetailModal
            examId={selectedExamId}
            onClose={handleCloseExamDetail}
            onEnterResults={() => {
              handleCloseExamDetail();
              handleOpenResultsEntry(selectedExamId);
            }}
          />
        </ModalContent>
      </Modal>

      {/* Results Entry Modal */}
      <Modal
        isOpen={resultsEntryOpen}
        onClose={handleCloseResultsEntry}
        size="5xl"
        scrollBehavior="inside"
        classNames={{
          backdrop: 'bg-black/30',
          base: 'bg-white max-h-[95vh]',
        }}
      >
        <ModalContent>
          <ResultsEntryModal
            examId={selectedExamId}
            onClose={handleCloseResultsEntry}
          />
        </ModalContent>
      </Modal>
    </div>
  );
};

export default AcademicLayout;
