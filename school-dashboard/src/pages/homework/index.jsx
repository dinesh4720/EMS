import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Card, CardBody, Chip, Modal, ModalContent, ModalHeader, ModalBody,
  ModalFooter, Button, Breadcrumbs, BreadcrumbItem,
} from '@heroui/react';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import {
  ClipboardList, Calendar, Eye, Trash2, AlertTriangle, Plus, Clock, Users, Home, Pencil,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { homeworkApi, classesApi } from '../../services/api';
import { PageLayout, MinimalButton } from '../../components/ui';
import FiltersDropdown from '../../components/FiltersDropdown';
import CreateHomeworkModal from './CreateHomeworkModal';
import HomeworkDetailModal from './HomeworkDetailModal';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const STATUS_OPTIONS = ['all', 'active', 'completed', 'cancelled'];

const homeworkCache = {
  data: null,
  timestamp: 0,
  duration: 30000,
};

const HomeworkPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingHomework, setEditingHomework] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, title: '' });
  const [detailId, setDetailId] = useState(null);
  const [filters, setFilters] = useState({ classId: 'all', status: 'all' });
  const initialFetchDone = useRef(false);

  const uniqueClasses = useMemo(() => {
    const classSet = new Set();
    homework.forEach(hw => {
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

  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchHomework();
      initialFetchDone.current = true;
    }
  }, []);

  const refreshHomework = useCallback(() => {
    homeworkCache.data = null;
    fetchHomework();
  }, []);

  const fetchHomework = async (forceRefresh = false) => {
    const now = Date.now();
    if (!forceRefresh && homeworkCache.data && (now - homeworkCache.timestamp) < homeworkCache.duration) {
      setHomework(homeworkCache.data);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await homeworkApi.getAll({ limit: 100 });
      // Support both paginated { data, pagination } and plain array responses
      const items = Array.isArray(response) ? response : (response?.data || []);
      setHomework(items);
      homeworkCache.data = items;
      homeworkCache.timestamp = now;
    } catch (error) {
      console.error('Error fetching homework:', error);
      toast.error(t('toast.error.failedToLoadHomework'));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
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
    try {
      await homeworkApi.delete(deleteModal.id);
      toast.success(t('toast.success.homeworkDeletedSuccessfully'));
      refreshHomework();
    } catch (error) {
      console.error('Error deleting homework:', error);
      toast.error(t('toast.error.failedToDeleteHomework'));
    } finally {
      setDeleteModal({ isOpen: false, id: null, title: '' });
    }
  };

  const getDueStatus = (dueDate) => {
    if (!dueDate) return 'pending';
    const now = new Date();
    const due = new Date(dueDate);
    if (due < now) return 'overdue';
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) return 'due-soon';
    return 'pending';
  };

  const filteredHomework = useMemo(() => {
    return homework.filter(hw => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          hw.title?.toLowerCase().includes(query) ||
          hw.subject?.toLowerCase().includes(query) ||
          hw.description?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      if (filters.status !== 'all' && hw.status !== filters.status) return false;
      if (filters.classId !== 'all') {
        const className = hw.classId?.name || hw.classId?.displayName || hw.className;
        if (className !== filters.classId) return false;
      }
      return true;
    });
  }, [homework, searchQuery, filters]);

  const stats = useMemo(() => ({
    total: homework.length,
    active: homework.filter(hw => hw.status === 'active').length,
    completed: homework.filter(hw => hw.status === 'completed').length,
    overdue: homework.filter(hw => hw.status === 'active' && getDueStatus(hw.dueDate) === 'overdue').length,
  }), [homework]);

  const header = {
    title: 'Homework',
    description: 'Assign, track, and manage homework assignments',
  };

  const actions = (
    <MinimalButton icon={<Plus size={16} />} onClick={() => { setEditingHomework(null); setCreateModalOpen(true); }}>
      Create Homework
    </MinimalButton>
  );

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <Breadcrumbs size="sm">
          <BreadcrumbItem startContent={<Home size={14} />} onPress={() => navigate('/')}>
            Home
          </BreadcrumbItem>
          <BreadcrumbItem>{t('pages.homework')}</BreadcrumbItem>
        </Breadcrumbs>
      </div>

      <PageLayout header={header} actions={actions} noPadding>
        <div className="min-h-[500px] p-6">
          {loading ? (
            <TablePageSkeleton />
          ) : (
            <div className="space-y-4">
              {/* Filters */}
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

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-3 border border-gray-100 dark:border-zinc-800">
                  <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.total2')}</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-zinc-100">{stats.total}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 border border-blue-100 dark:border-blue-900">
                  <p className="text-xs text-blue-600 dark:text-blue-400">{t('pages.active')}</p>
                  <p className="text-xl font-semibold text-blue-700 dark:text-blue-300">{stats.active}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 border border-green-100 dark:border-green-900">
                  <p className="text-xs text-green-600 dark:text-green-400">{t('pages.completed')}</p>
                  <p className="text-xl font-semibold text-green-700 dark:text-green-300">{stats.completed}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-950 rounded-lg p-3 border border-red-100 dark:border-red-900">
                  <p className="text-xs text-red-600 dark:text-red-400">{t('pages.overdue1')}</p>
                  <p className="text-xl font-semibold text-red-700 dark:text-red-300">{stats.overdue}</p>
                </div>
              </div>

              {/* Homework Cards */}
              {filteredHomework.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardList size={40} className="mx-auto mb-3 text-gray-300 dark:text-zinc-600" />
                  <p className="text-gray-500 dark:text-zinc-400 mb-4">{t('pages.noHomeworkFound')}</p>
                  {activeFiltersCount > 0 ? (
                    <Button variant="flat" size="sm" onClick={handleClearFilters}>
                      Clear Filters
                    </Button>
                  ) : (
                    <MinimalButton icon={<Plus size={16} />} onClick={() => { setEditingHomework(null); setCreateModalOpen(true); }}>
                      Create First Homework
                    </MinimalButton>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredHomework.map((hw) => {
                    const id = hw._id || hw.id;
                    const dueStatus = getDueStatus(hw.dueDate);
                    const className = hw.classId?.name || hw.classId?.displayName || hw.className || 'N/A';
                    const submissionCount = hw.submissions?.length || 0;

                    return (
                      <Card
                        key={id}
                        shadow="sm"
                        className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 shadow-sm dark:shadow-zinc-900/50 hover:shadow-md transition-shadow"
                      >
                        <CardBody className="p-4 space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 dark:text-zinc-100 truncate">{hw.title}</h3>
                              <p className="text-sm text-gray-700 dark:text-zinc-300 mt-0.5">{hw.subject}</p>
                            </div>
                            <Chip
                              size="sm"
                              variant="flat"
                              className={
                                hw.status === 'completed'
                                  ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'
                                  : hw.status === 'cancelled'
                                    ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
                                    : dueStatus === 'overdue'
                                      ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
                                      : 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300'
                              }
                            >
                              {hw.status === 'completed' ? 'Completed' : hw.status === 'cancelled' ? 'Cancelled' : dueStatus === 'overdue' ? 'Overdue' : 'Active'}
                            </Chip>
                          </div>

                          {/* Description */}
                          {hw.description && (
                            <p className="text-sm text-gray-500 dark:text-zinc-400 line-clamp-2">{hw.description}</p>
                          )}

                          {/* Meta */}
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1 text-gray-500 dark:text-zinc-400">
                              <Calendar size={14} />
                              {hw.dueDate ? (() => { const d = new Date(hw.dueDate); return isNaN(d.getTime()) ? 'Invalid date' : d.toLocaleDateString(); })() : 'No due date'}
                            </span>
                            <button
                              onClick={() => setDetailId(id)}
                              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-xs hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                              title="View submissions"
                            >
                              <Users size={12} />
                              {submissionCount} submitted
                            </button>
                          </div>

                          {/* Class & Teacher */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-zinc-800">
                            <span className="text-xs text-gray-500 dark:text-zinc-400">{className}</span>
                            <div className="flex items-center gap-1">
                              <button
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                                onClick={() => setDetailId(id)}
                                title={t('pages.viewDetails1')}
                              >
                                <Eye size={15} className="text-gray-500 dark:text-zinc-400" />
                              </button>
                              <button
                                className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                                onClick={() => {
                                  setEditingHomework(hw);
                                  setCreateModalOpen(true);
                                }}
                                title="Edit"
                              >
                                <Pencil size={15} className="text-blue-500 dark:text-blue-400" />
                              </button>
                              <button
                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                                onClick={() => handleDeleteClick(id, hw.title)}
                                title={t('pages.delete1')}
                              >
                                <Trash2 size={15} className="text-red-400 dark:text-red-500" />
                              </button>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </PageLayout>

      {/* Create/Edit Homework Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => { setCreateModalOpen(false); setEditingHomework(null); }}
        size="2xl"
        scrollBehavior="inside"
        classNames={{
          backdrop: 'bg-black/30',
          base: 'bg-white dark:bg-zinc-950 max-h-[90vh]',
          body: 'py-0',
        }}
      >
        <ModalContent>
          <ModalHeader className="border-b border-gray-100 dark:border-zinc-800 py-4 px-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                <ClipboardList size={20} className="text-gray-600 dark:text-zinc-300" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100">
                  {editingHomework ? 'Edit Homework' : t('pages.createHomework')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400 font-normal">
                  {editingHomework ? 'Update homework assignment details' : t('pages.assignNewHomeworkToStudents')}
                </p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="px-6 pb-6 pt-4">
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
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Homework Detail / Grade Modal */}
      <HomeworkDetailModal
        homeworkId={detailId}
        onClose={() => setDetailId(null)}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, title: '' })}
        size="sm"
        classNames={{
          backdrop: 'bg-black/30',
          base: 'bg-white dark:bg-zinc-950',
        }}
      >
        <ModalContent>
          <ModalHeader className="border-b border-gray-100 dark:border-zinc-800 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-950 rounded-lg">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100">{t('pages.deleteHomework')}</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400 font-normal">{t('pages.thisActionCannotBeUndone1')}</p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="py-4">
            <p className="text-sm text-gray-600 dark:text-zinc-300">
              Are you sure you want to delete <span className="font-medium">{deleteModal.title}</span>?
              All student submissions will also be removed.
            </p>
          </ModalBody>
          <ModalFooter className="border-t border-gray-100 dark:border-zinc-800">
            <Button variant="light" onPress={() => setDeleteModal({ isOpen: false, id: null, title: '' })}>
              Cancel
            </Button>
            <Button color="danger" onPress={handleConfirmDelete}>
              Delete Homework
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default HomeworkPage;
