import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { FileText, Plus, Clock, CheckCircle2, ListChecks } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { examsApi } from '../../services/api';
import { useApp } from '../../context/AppContext';
import FiltersDropdown from '../../components/FiltersDropdown';
import {
  Button,
  ConfirmDialog,
  DataTable,
  ErrorState,
  MinimalButton,
  MinimalTabs,
  StatCard,
} from '../../components/ui';
import logger from '../../utils/logger';
import ExamScheduleView from './ExamScheduleView';
import { buildExamColumns } from './examTableColumns';
import ExamRowActions from './examTableConfig';

const STATUS_OPTIONS = ['all', 'scheduled', 'ongoing', 'completed', 'results_published'];
const PAGE_LIMIT = 50;

const ExamManagement = ({ onCreateExam }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedAcademicYear } = useApp();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState('list');

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, examId: null, examName: '' });
  const [publishModal, setPublishModal] = useState({
    isOpen: false,
    examId: null,
    examName: '',
    publishing: false,
  });

  const [filters, setFilters] = useState({ classId: 'all', status: 'all', academicYear: 'all' });

  const fetchExams = useCallback(
    async (skipValue) => {
      const isInitial = skipValue === 0;
      if (isInitial) {
        setLoading(true);
        setExams([]);
      } else {
        setLoadingMore(true);
      }
      try {
        const params = { limit: PAGE_LIMIT, skip: skipValue };
        if (selectedAcademicYear) params.academicYear = selectedAcademicYear;
        const data = await examsApi.getAll(params);
        const results = (data || []).map((e) => ({ ...e, id: e.id || e._id }));
        setExams((prev) => (isInitial ? results : [...prev, ...results]));
        setSkip(skipValue + results.length);
        setHasMore(results.length === PAGE_LIMIT);
        setError(null);
      } catch (err) {
        logger.error('Error fetching exams:', err);
        setError(err);
        if (!isInitial) toast.error(t('toast.error.failedToLoadExams'));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedAcademicYear, t],
  );

  useEffect(() => {
    fetchExams(0);
  }, [fetchExams]);

  const uniqueClasses = useMemo(() => {
    const classSet = new Set(exams.map((e) => e.className || e.classId).filter(Boolean));
    return Array.from(classSet);
  }, [exams]);

  const uniqueYears = useMemo(() => {
    const yearSet = new Set(exams.map((e) => e.academicYear).filter(Boolean));
    return Array.from(yearSet);
  }, [exams]);

  const filterConfig = useMemo(
    () => ({
      classId: {
        label: t('pages.cLASS', { defaultValue: 'Class' }),
        value: filters.classId,
        options: ['all', ...uniqueClasses],
        displayLabels: { all: t('pages.allClasses', { defaultValue: 'All Classes' }) },
        counts: {},
      },
      status: {
        label: t('pages.sTATUS', { defaultValue: 'Status' }),
        value: filters.status,
        options: STATUS_OPTIONS,
        displayLabels: {
          all: t('pages.allStatus', { defaultValue: 'All Status' }),
          scheduled: t('pages.scheduled'),
          ongoing: t('pages.ongoing'),
          completed: t('pages.completed'),
          results_published: t('pages.published', { defaultValue: 'Published' }),
        },
        counts: {},
      },
      academicYear: {
        label: t('pages.academicYear', { defaultValue: 'Academic Year' }),
        value: filters.academicYear,
        options: ['all', ...uniqueYears],
        displayLabels: { all: t('pages.allYears', { defaultValue: 'All Years' }) },
        counts: {},
      },
    }),
    [filters, t, uniqueClasses, uniqueYears],
  );

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.classId !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.academicYear !== 'all') count++;
    if (searchQuery) count++;
    return count;
  }, [filters, searchQuery]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({ classId: 'all', status: 'all', academicYear: 'all' });
    setSearchQuery('');
  }, []);

  const handleLoadMore = useCallback(() => {
    fetchExams(skip);
  }, [fetchExams, skip]);

  const handleDeleteClick = useCallback((examId, examName) => {
    setDeleteModal({ isOpen: true, examId, examName });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteModal.examId) return;
    try {
      await examsApi.delete(deleteModal.examId);
      toast.success(t('toast.success.examDeletedSuccessfully'));
      fetchExams(0);
    } catch (err) {
      logger.error('Error deleting exam:', err);
      toast.error(t('toast.error.failedToDeleteExam'));
    } finally {
      setDeleteModal({ isOpen: false, examId: null, examName: '' });
    }
  }, [deleteModal.examId, fetchExams, t]);

  const handlePublishClick = useCallback((examId, examName) => {
    setPublishModal({ isOpen: true, examId, examName, publishing: false });
  }, []);

  const handleConfirmPublish = useCallback(async () => {
    const publishedId = publishModal.examId;
    setPublishModal((prev) => ({ ...prev, publishing: true }));
    try {
      await examsApi.publish(publishedId);
      toast.success(
        t('toast.success.resultsPublishedForExam', { examName: publishModal.examName }),
      );
      setPublishModal({ isOpen: false, examId: null, examName: '', publishing: false });
      setExams((prev) =>
        prev.map((e) =>
          (e.id || e._id) === publishedId
            ? { ...e, status: 'results_published', isPublished: true }
            : e,
        ),
      );
    } catch (err) {
      logger.error('Error publishing results:', err);
      toast.error(t('toast.error.failedToPublishResults'));
      setPublishModal((prev) => ({ ...prev, publishing: false }));
    }
  }, [publishModal.examId, publishModal.examName, t]);

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          exam.name?.toLowerCase().includes(query) ||
          exam.classId?.toLowerCase().includes(query) ||
          exam.subjectName?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      if (filters.classId !== 'all' && (exam.className || exam.classId) !== filters.classId) {
        return false;
      }
      if (filters.status !== 'all' && exam.status !== filters.status) return false;
      if (filters.academicYear !== 'all' && exam.academicYear !== filters.academicYear)
        return false;
      return true;
    });
  }, [exams, searchQuery, filters]);

  const stats = useMemo(
    () => ({
      total: exams.length,
      scheduled: exams.filter((e) => e.status === 'scheduled').length,
      ongoing: exams.filter((e) => e.status === 'ongoing').length,
      completed: exams.filter(
        (e) => e.status === 'completed' || e.status === 'results_published',
      ).length,
    }),
    [exams],
  );

  const columns = useMemo(() => buildExamColumns(t), [t]);

  const renderRowActions = useCallback(
    (exam) => (
      <ExamRowActions
        exam={exam}
        t={t}
        onView={(id) => navigate(`/academics/exams/${id}`)}
        onEnterResults={(id) => navigate(`/academics/exams/${id}/results`)}
        onPublish={handlePublishClick}
        onDelete={handleDeleteClick}
      />
    ),
    [handleDeleteClick, handlePublishClick, navigate, t],
  );

  const viewTabs = useMemo(
    () => [
      {
        key: 'list',
        title: (
          <span className="flex items-center gap-2">
            <ListChecks size={14} aria-hidden="true" />
            {t('pages.listView', { defaultValue: 'List View' })}
          </span>
        ),
      },
      {
        key: 'schedule',
        title: (
          <span className="flex items-center gap-2">
            <Clock size={14} aria-hidden="true" />
            {t('pages.scheduleView', { defaultValue: 'Schedule View' })}
          </span>
        ),
      },
    ],
    [t],
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <MinimalTabs
          tabs={viewTabs}
          activeKey={activeView}
          onChange={setActiveView}
          size="sm"
          variant="pills"
        />
        <div className="flex items-center gap-3">
          <FiltersDropdown
            filters={filterConfig}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearFilters}
            onApply={() => { /* filters apply reactively */ }}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeFiltersCount={activeFiltersCount}
          />
          <MinimalButton icon={<Plus size={16} />} onClick={onCreateExam}>
            {t('pages.createExam')}
          </MinimalButton>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label={t('pages.totalExams')}
          value={stats.total}
          icon={FileText}
          color="gray"
          isLoading={loading}
        />
        <StatCard
          label={t('pages.scheduled')}
          value={stats.scheduled}
          icon={Clock}
          color="blue"
          isLoading={loading}
        />
        <StatCard
          label={t('pages.ongoing')}
          value={stats.ongoing}
          icon={Clock}
          color="amber"
          isLoading={loading}
        />
        <StatCard
          label={t('pages.completed')}
          value={stats.completed}
          icon={CheckCircle2}
          color="green"
          isLoading={loading}
        />
      </div>

      {/* Content */}
      {activeView === 'list' && (
        <DataTable
          columns={columns}
          data={filteredExams}
          keyField="id"
          loading={loading}
          error={error}
          onRetry={() => fetchExams(0)}
          rowActions={renderRowActions}
          ariaLabel={t('aria.tables.exams')}
          density="normal"
          emptyState={{
            icon: <FileText size={20} className="text-[var(--color-text-muted)]" />,
            title: t('pages.noExamsFound'),
            description: t('pages.noExamsFoundDesc', {
              defaultValue: 'Create an exam to start tracking results.',
            }),
            action:
              activeFiltersCount > 0 ? (
                <Button size="sm" variant="outline" onClick={handleClearFilters}>
                  {t('common.clearFilters', { defaultValue: 'Clear Filters' })}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Plus size={14} />}
                  onClick={onCreateExam}
                >
                  {t('pages.createFirstExam', { defaultValue: 'Create First Exam' })}
                </Button>
              ),
          }}
        />
      )}

      {activeView === 'schedule' && error && !loading && (
        <ErrorState
          error={error}
          onRetry={() => fetchExams(0)}
          size="md"
          title={t('toast.error.failedToLoadExams')}
        />
      )}

      {activeView === 'schedule' && !error && !loading && (
        <ExamScheduleView
          exams={filteredExams}
          activeFiltersCount={activeFiltersCount}
          onCreateExam={onCreateExam}
          onClearFilters={handleClearFilters}
        />
      )}

      {/* Load more */}
      {!error && hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleLoadMore}
            loading={loadingMore}
          >
            {t('common.loadMore', { defaultValue: 'Load More' })}
          </Button>
        </div>
      )}

      {/* Publish Confirmation */}
      <ConfirmDialog
        isOpen={publishModal.isOpen}
        onClose={() =>
          !publishModal.publishing &&
          setPublishModal({ isOpen: false, examId: null, examName: '', publishing: false })
        }
        onConfirm={handleConfirmPublish}
        title={t('pages.publishResults', { defaultValue: 'Publish Results' })}
        message={t('pages.publishResultsMessage', {
          examName: publishModal.examName,
          defaultValue: `Publish results for ${publishModal.examName}? Results will become visible to all students and parents in this class.`,
        })}
        confirmText={t('pages.publishResults', { defaultValue: 'Publish Results' })}
        cancelText={t('common.cancel', { defaultValue: 'Cancel' })}
        variant="info"
        isLoading={publishModal.publishing}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, examId: null, examName: '' })}
        onConfirm={handleConfirmDelete}
        title={t('pages.deleteExam')}
        message={t('pages.deleteExamMessage', {
          examName: deleteModal.examName,
          defaultValue: `Delete ${deleteModal.examName}? All associated results will also be removed. ${t('pages.thisActionCannotBeUndone1')}`,
        })}
        confirmText={t('pages.delete1')}
        cancelText={t('common.cancel', { defaultValue: 'Cancel' })}
        variant="danger"
      />
    </div>
  );
};

ExamManagement.propTypes = {
  onCreateExam: PropTypes.func,
};

export default ExamManagement;
