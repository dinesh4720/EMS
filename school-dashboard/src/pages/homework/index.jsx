import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ClipboardList, Calendar, Eye, Trash2, Plus, Home, Pencil,
  Users, CheckCircle2, Activity, AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { homeworkApi } from '../../services/api';
import {
  PageLayout, MinimalButton, Breadcrumbs, Card, Chip, IconButton,
  StatCard, EmptyState, ErrorState, ConfirmDialog, Modal,
} from '../../components/ui';
import { CardGridPageSkeleton } from '../../components/skeletons/PageSkeletons';
import FiltersDropdown from '../../components/FiltersDropdown';
import Pagination from '../../components/common/Pagination';
import CreateHomeworkModal from './CreateHomeworkModal';
import HomeworkDetailModal from './HomeworkDetailModal';
import useHomeworkData from '../../hooks/useHomeworkData';
import { useDebounce } from '../../hooks/useDebounce';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { formatShortDate } from '../../utils/dateFormatter';
import logger from '../../utils/logger';

const STATUS_OPTIONS = ['all', 'active', 'completed', 'cancelled'];

const getDueStatus = (dueDate) => {
  if (!dueDate) return 'pending';
  const now = new Date();
  const due = new Date(dueDate);
  if (due < now) return 'overdue';
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) return 'due-soon';
  return 'pending';
};

const getStatusChipColor = (hw) => {
  if (hw.status === 'completed') return 'success';
  if (hw.status === 'cancelled') return 'danger';
  if (getDueStatus(hw.dueDate) === 'overdue') return 'danger';
  return 'warning';
};

const getStatusLabel = (hw) => {
  if (hw.status === 'completed') return 'Completed';
  if (hw.status === 'cancelled') return 'Cancelled';
  if (getDueStatus(hw.dueDate) === 'overdue') return 'Overdue';
  return 'Active';
};

const HomeworkPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingHomework, setEditingHomework] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, title: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [filters, setFilters] = useState({ classId: 'all', status: 'all' });

  // Search is matched server-side (PAG-08); debounce so we don't refetch on
  // every keystroke, and reset to page 1 whenever the result set changes.
  const debouncedSearch = useDebounce(searchQuery, 400);
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.classId, filters.status]);

  const { homework, stats, pagination, isLoading, isFetching, isError, error, refetch } =
    useHomeworkData({
      page,
      limit: 25,
      search: debouncedSearch,
      status: filters.status,
      classId: filters.classId,
    });

  const uniqueClasses = useMemo(() => {
    const classSet = new Set();
    homework.forEach((hw) => {
      const name = hw.classId?.name || hw.classId?.displayName || hw.className;
      if (name) classSet.add(name);
    });
    return Array.from(classSet);
  }, [homework]);

  const filterConfig = {
    classId: {
      label: 'Class',
      value: filters.classId,
      options: ['all', ...uniqueClasses],
      displayLabels: { all: 'All Classes' },
      counts: {},
    },
    status: {
      label: 'Status',
      value: filters.status,
      options: STATUS_OPTIONS,
      displayLabels: { all: 'All Status', active: 'Active', completed: 'Completed', cancelled: 'Cancelled' },
      counts: {},
    },
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.classId !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (searchQuery) count++;
    return count;
  }, [filters, searchQuery]);

  const refreshHomework = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ classId: 'all', status: 'all' });
    setSearchQuery('');
  };

  const handleDeleteClick = (id, title) => {
    setDeleteModal({ isOpen: true, id, title });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.id) return;
    setDeleteLoading(true);
    try {
      await homeworkApi.delete(deleteModal.id);
      toast.success(t('toast.success.homeworkDeletedSuccessfully'));
      refreshHomework();
      setDeleteModal({ isOpen: false, id: null, title: '' });
    } catch (err) {
      logger.error('Error deleting homework:', err);
      toast.error(t('toast.error.failedToDeleteHomework'));
    } finally {
      setDeleteLoading(false);
    }
  };

  // Server has already applied the search + status + classId filters, so
  // `homework` IS the filtered list. Show the existing empty state when the
  // server returns zero rows for the current filter set.
  const filteredHomework = homework;

  const header = {
    title: 'Homework',
    description: 'Assign, track, and manage homework assignments',
  };

  const openCreateModal = () => {
    setEditingHomework(null);
    setCreateModalOpen(true);
  };

  const actions = (
    <MinimalButton icon={<Plus size={16} />} onClick={openCreateModal}>
      Create Homework
    </MinimalButton>
  );

  const renderBody = () => {
    if (isLoading) {
      return <CardGridPageSkeleton title={false} cards={6} />;
    }

    if (isError) {
      return (
        <ErrorState
          title="Couldn't load homework"
          error={error}
          onRetry={() => refetch()}
        />
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-end gap-3">
          <FiltersDropdown
            filters={filterConfig}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearFilters}
            onApply={() => {}}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeFiltersCount={activeFiltersCount}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label={t('pages.total2')} value={stats.total} icon={ClipboardList} color="gray" headingLevel="h2" />
          <StatCard label={t('pages.active')} value={stats.active} icon={Activity} color="blue" headingLevel="h2" />
          <StatCard label={t('pages.completed')} value={stats.completed} icon={CheckCircle2} color="green" headingLevel="h2" />
          <StatCard label={t('pages.overdue1')} value={stats.overdue} icon={AlertCircle} color="red" headingLevel="h2" />
        </div>

        {filteredHomework.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={t('pages.noHomeworkFound')}
            description={
              activeFiltersCount > 0
                ? 'Try adjusting your filters to see more results.'
                : 'Create your first homework assignment to get started.'
            }
            actionLabel={activeFiltersCount > 0 ? 'Clear Filters' : 'Create First Homework'}
            onAction={activeFiltersCount > 0 ? handleClearFilters : openCreateModal}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHomework.map((hw) => {
                const id = hw._id || hw.id;
                const className = hw.classId?.name || hw.classId?.displayName || hw.className || 'N/A';
                const submissionCount = hw.submissions?.length || 0;

                return (
                  <Card key={id} padding="sm" elevation="raised" className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-fg truncate">{hw.title}</h3>
                        <p className="text-sm text-fg mt-0.5">{hw.subject}</p>
                      </div>
                      <Chip size="sm" color={getStatusChipColor(hw)}>
                        {getStatusLabel(hw)}
                      </Chip>
                    </div>

                    {hw.description && (
                      <p className="text-sm text-fg-muted line-clamp-2">{hw.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-fg-muted">
                        <Calendar size={14} />
                        {hw.dueDate ? formatShortDate(hw.dueDate, 'Invalid date') : 'No due date'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDetailId(id)}
                        className="flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 rounded-full"
                        title="View submissions"
                      >
                        <Chip size="sm" color="neutral" startContent={<Users size={12} />}>
                          {submissionCount} submitted
                        </Chip>
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-divider">
                      <span className="text-xs text-fg-muted">{className}</span>
                      <div className="flex items-center gap-1">
                        <IconButton
                          size="sm"
                          variant="ghost"
                          aria-label={t('pages.viewDetails1')}
                          icon={<Eye size={15} />}
                          onClick={() => setDetailId(id)}
                        />
                        <IconButton
                          size="sm"
                          variant="ghost"
                          aria-label="Edit homework"
                          icon={<Pencil size={15} />}
                          onClick={() => {
                            setEditingHomework(hw);
                            setCreateModalOpen(true);
                          }}
                        />
                        <IconButton
                          size="sm"
                          variant="danger"
                          aria-label={t('pages.delete1')}
                          icon={<Trash2 size={15} />}
                          onClick={() => handleDeleteClick(id, hw.title)}
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
            {pagination && pagination.total > 0 && (
              <Pagination
                currentPage={pagination.page || page}
                totalPages={pagination.totalPages || 1}
                onPageChange={setPage}
                totalItems={pagination.total}
                itemLabel="homework"
                disabled={isFetching}
              />
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <Breadcrumbs
          size="sm"
          items={[
            { icon: <Home size={14} />, label: 'Home', onClick: () => navigate('/') },
            { label: t('pages.homework') },
          ]}
        />
      </div>

      <PageLayout header={header} actions={actions} noPadding>
        <div className="min-h-[500px] p-6">{renderBody()}</div>
      </PageLayout>

      <Modal
        isOpen={createModalOpen}
        onClose={() => { setCreateModalOpen(false); setEditingHomework(null); }}
        size="2xl"
        scrollBehavior="inside"
        title={editingHomework ? 'Edit Homework' : t('pages.createHomework')}
        description={editingHomework ? 'Update homework assignment details' : t('pages.assignNewHomeworkToStudents')}
      >
        <CreateHomeworkModal
          key={editingHomework?._id || editingHomework?.id || 'create'}
          editingHomework={editingHomework}
          onClose={() => { setCreateModalOpen(false); setEditingHomework(null); }}
          onSuccess={() => {
            setCreateModalOpen(false);
            setEditingHomework(null);
            refreshHomework();
          }}
        />
      </Modal>

      <HomeworkDetailModal
        homeworkId={detailId}
        onClose={() => setDetailId(null)}
        onDataChanged={() => refetch()}
      />

      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, title: '' })}
        onConfirm={handleConfirmDelete}
        title={t('pages.deleteHomework')}
        message={`Are you sure you want to delete "${deleteModal.title}"? All student submissions will also be removed. ${t('pages.thisActionCannotBeUndone1')}`}
        confirmText="Delete Homework"
        variant="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default HomeworkPage;
