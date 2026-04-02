import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from '@heroui/react';
import { FileText, Calendar, Eye, Pencil, Trash2, AlertTriangle, Plus, Clock, Users, BookOpen, Send } from 'lucide-react';
import { examsApi, classesApi } from '../../services/api';
import FiltersDropdown from '../../components/FiltersDropdown';
import { MinimalButton } from '../../components/ui';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const STATUS_OPTIONS = ['all', 'scheduled', 'ongoing', 'completed', 'results_published'];

import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { formatShortDate } from '../../utils/dateFormatter';

// Simple cache
const examsCache = {
  data: null,
  timestamp: 0,
  duration: 30000 // 30 seconds
};

/** Bust the exams cache so the next fetch returns fresh data */
export const invalidateExamsCache = () => {
  examsCache.data = null;
  examsCache.timestamp = 0;
};

const ExamManagement = ({ onCreateExam }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, examId: null, examName: '' });
  const [activeView, setActiveView] = useState('list');
  const [filters, setFilters] = useState({
    classId: 'all',
    status: 'all',
    academicYear: 'all'
  });

  const initialFetchDone = useRef(false);

  // Get unique values for filter options
  const uniqueClasses = useMemo(() => {
    const classSet = new Set(exams.map(e => e.className || e.classId).filter(Boolean));
    return Array.from(classSet);
  }, [exams]);

  const uniqueYears = useMemo(() => {
    const yearSet = new Set(exams.map(e => e.academicYear).filter(Boolean));
    return Array.from(yearSet);
  }, [exams]);

  const filterConfig = {
    classId: {
      label: 'Class',
      value: filters.classId,
      options: ['all', ...uniqueClasses],
      displayLabels: { all: 'All Classes' },
      counts: {}
    },
    status: {
      label: 'Status',
      value: filters.status,
      options: STATUS_OPTIONS,
      displayLabels: {
        all: 'All Status',
        scheduled: 'Scheduled',
        ongoing: 'Ongoing',
        completed: 'Completed',
        results_published: 'Published'
      },
      counts: {}
    },
    academicYear: {
      label: 'Academic Year',
      value: filters.academicYear,
      options: ['all', ...uniqueYears],
      displayLabels: { all: 'All Years' },
      counts: {}
    }
  };

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.classId !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.academicYear !== 'all') count++;
    if (searchQuery) count++;
    return count;
  }, [filters, searchQuery]);

  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchExams();
      fetchClasses();
      initialFetchDone.current = true;
    }
  }, []);

  // Expose refresh method
  const refreshExams = useCallback(() => {
    examsCache.data = null;
    fetchExams();
  }, []);

  const fetchExams = async (forceRefresh = false) => {
    // Check cache first
    const now = Date.now();
    if (!forceRefresh && examsCache.data && (now - examsCache.timestamp) < examsCache.duration) {
      setExams(examsCache.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await examsApi.getAll();
      setExams(data || []);
      examsCache.data = data || [];
      examsCache.timestamp = now;
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.error(t('toast.error.failedToLoadExams'));
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const data = await classesApi.getAll ? classesApi.getAll() : Promise.resolve([]);
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ classId: 'all', status: 'all', academicYear: 'all' });
    setSearchQuery('');
  };

  const handleApplyFilters = () => {
    // Filters are already applied reactively
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'primary',
      ongoing: 'warning',
      completed: 'success',
      results_published: 'success'
    };
    return colors[status] || 'default';
  };

  const handleDeleteClick = (examId, examName) => {
    setDeleteModal({ isOpen: true, examId, examName });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.examId) return;

    try {
      await examsApi.delete(deleteModal.examId);
      toast.success(t('toast.success.examDeletedSuccessfully'));
      refreshExams();
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast.error(t('toast.error.failedToDeleteExam'));
    } finally {
      setDeleteModal({ isOpen: false, examId: null, examName: '' });
    }
  };

  const handlePublish = async (examId, examName) => {
    try {
      await examsApi.publish(examId);
      toast.success(`Results published for ${examName}`);
      refreshExams();
    } catch (error) {
      console.error('Error publishing results:', error);
      toast.error(t('toast.error.failedToPublishResults'));
    }
  };

  // Filter exams
  const filteredExams = useMemo(() => {
    return exams.filter(exam => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          exam.name?.toLowerCase().includes(query) ||
          exam.classId?.toLowerCase().includes(query) ||
          exam.subjectName?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Class filter — compare against className (human-readable) since filter options are class names
      if (filters.classId !== 'all' && (exam.className || exam.classId) !== filters.classId) {
        return false;
      }

      // Status filter
      if (filters.status !== 'all' && exam.status !== filters.status) {
        return false;
      }

      // Academic year filter
      if (filters.academicYear !== 'all' && exam.academicYear !== filters.academicYear) {
        return false;
      }

      return true;
    });
  }, [exams, searchQuery, filters]);

  // Group exams by status for schedule view
  const examsByStatus = useMemo(() => {
    return {
      scheduled: filteredExams.filter(e => e.status === 'scheduled'),
      ongoing: filteredExams.filter(e => e.status === 'ongoing'),
      completed: filteredExams.filter(e => e.status === 'completed'),
      results_published: filteredExams.filter(e => e.status === 'results_published'),
    };
  }, [filteredExams]);

  if (loading) {
    return <TablePageSkeleton kpiCards={4} columns={7} rows={6} />;
  }

  return (
    <div className="space-y-4">
      {/* View Tabs */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('list')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeView === 'list'
                ? 'bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setActiveView('schedule')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeView === 'schedule'
                ? 'bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            Schedule View
          </button>
        </div>

        <div className="flex items-center gap-3">
          <FiltersDropdown
            filters={filterConfig}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearFilters}
            onApply={handleApplyFilters}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeFiltersCount={activeFiltersCount}
          />
          <MinimalButton icon={<Plus size={16} />} onClick={onCreateExam}>
            Create Exam
          </MinimalButton>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-3 border border-gray-100 dark:border-zinc-800">
          <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.totalExams')}</p>
          <p className="text-xl font-semibold text-gray-900 dark:text-zinc-100">{exams.length}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
          <p className="text-xs text-blue-600 dark:text-blue-400">{t('pages.scheduled')}</p>
          <p className="text-xl font-semibold text-blue-700 dark:text-blue-300">{exams.filter(e => e.status === 'scheduled').length}</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-3 border border-amber-100 dark:border-amber-800">
          <p className="text-xs text-amber-600 dark:text-amber-400">{t('pages.ongoing')}</p>
          <p className="text-xl font-semibold text-amber-700 dark:text-amber-300">{exams.filter(e => e.status === 'ongoing').length}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 border border-green-100 dark:border-green-800">
          <p className="text-xs text-green-600 dark:text-green-400">{t('pages.completed')}</p>
          <p className="text-xl font-semibold text-green-700 dark:text-green-300">{exams.filter(e => e.status === 'completed' || e.status === 'results_published').length}</p>
        </div>
      </div>

      {/* Content based on view */}
      {activeView === 'list' ? (
        // List View
        <Card shadow="none" className="border border-gray-100 dark:border-zinc-800">
          <CardBody className="p-0">
            {filteredExams.length === 0 ? (
              <div className="text-center py-12">
                <FileText size={40} className="mx-auto mb-3 text-gray-300 dark:text-zinc-600" />
                <p className="text-gray-500 dark:text-zinc-400 mb-4">{t('pages.noExamsFound')}</p>
                {activeFiltersCount > 0 ? (
                  <Button variant="flat" size="sm" onPress={handleClearFilters}>
                    Clear Filters
                  </Button>
                ) : (
                  <MinimalButton icon={<Plus size={16} />} onClick={onCreateExam}>
                    Create First Exam
                  </MinimalButton>
                )}
              </div>
            ) : (
              <Table aria-label={t('aria.tables.exams')} removeWrapper>
                <TableHeader>
                  <TableColumn scope="col">{t('pages.eXAM')}</TableColumn>
                  <TableColumn scope="col">{t('pages.tYPE')}</TableColumn>
                  <TableColumn scope="col">{t('pages.cLASS')}</TableColumn>
                  <TableColumn scope="col">{t('pages.sUBJECT')}</TableColumn>
                  <TableColumn scope="col">{t('pages.dATE')}</TableColumn>
                  <TableColumn scope="col">{t('pages.sTATUS')}</TableColumn>
                  <TableColumn scope="col">{t('pages.aCTIONS')}</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No exams found">
                  {filteredExams.map((exam) => (
                    <TableRow key={exam.id || exam._id} className="hover:bg-gray-50 dark:hover:bg-zinc-900">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                            <FileText size={16} className="text-gray-500 dark:text-zinc-400" />
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 dark:text-zinc-100">{exam.name}</span>
                            {exam.academicYear && (
                              <p className="text-xs text-gray-400 dark:text-zinc-500">{exam.academicYear}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 dark:text-zinc-400 capitalize">
                          {exam.type?.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 dark:text-zinc-400">{exam.className || exam.classId}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 dark:text-zinc-400">{exam.subjectName}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400">
                          <Calendar size={14} />
                          {exam.startDate ? formatShortDate(exam.startDate) : 'Not scheduled'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          color={getStatusColor(exam.status)}
                          variant="flat"
                          className="capitalize"
                        >
                          {exam.status?.replace('_', ' ')}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <button
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                            onClick={() => navigate(`/academics/exams/${exam.id || exam._id}`)}
                            title={t('pages.viewDetails1')}
                          >
                            <Eye size={16} className="text-gray-500 dark:text-zinc-400" />
                          </button>
                          <button
                            className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                            onClick={() => navigate(`/academics/exams/${exam.id || exam._id}/results`)}
                            title={t('pages.enterResults')}
                          >
                            <Pencil size={16} className="text-blue-500" />
                          </button>
                          {exam.status === 'completed' && !exam.isPublished && (
                            <button
                              className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-950 transition-colors"
                              onClick={() => handlePublish(exam.id || exam._id, exam.name)}
                              title="Publish Results"
                            >
                              <Send size={16} className="text-green-500" />
                            </button>
                          )}
                          <button
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                            onClick={() => handleDeleteClick(exam.id || exam._id, exam.name)}
                            title={t('pages.delete1')}
                          >
                            <Trash2 size={16} className="text-red-400" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>
      ) : (
        // Schedule View
        <div className="space-y-4">
          {/* Scheduled */}
          {examsByStatus.scheduled.length > 0 && (
            <Card shadow="none" className="border border-blue-100 dark:border-blue-800">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={16} className="text-blue-500" />
                  <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300">Scheduled ({examsByStatus.scheduled.length})</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {examsByStatus.scheduled.map(exam => (
                    <div
                      key={exam.id || exam._id}
                      className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-100 dark:border-blue-800 hover:shadow-sm cursor-pointer transition-shadow"
                      onClick={() => navigate(`/academics/exams/${exam.id || exam._id}`)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{exam.name}</span>
                        <Chip size="sm" color="primary" variant="flat">{t('pages.scheduled')}</Chip>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">{exam.className || exam.classId} - {exam.subjectName}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{exam.startDate ? formatShortDate(exam.startDate) : ''}</p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Ongoing */}
          {examsByStatus.ongoing.length > 0 && (
            <Card shadow="none" className="border border-amber-100 dark:border-amber-800">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={16} className="text-amber-500" />
                  <h3 className="text-sm font-medium text-amber-700 dark:text-amber-300">Ongoing ({examsByStatus.ongoing.length})</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {examsByStatus.ongoing.map(exam => (
                    <div
                      key={exam.id || exam._id}
                      className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-100 dark:border-amber-800 hover:shadow-sm cursor-pointer transition-shadow"
                      onClick={() => navigate(`/academics/exams/${exam.id || exam._id}`)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{exam.name}</span>
                        <Chip size="sm" color="warning" variant="flat">{t('pages.ongoing')}</Chip>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">{exam.className || exam.classId} - {exam.subjectName}</p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Completed */}
          {(examsByStatus.completed.length > 0 || examsByStatus.results_published.length > 0) && (
            <Card shadow="none" className="border border-green-100 dark:border-green-800">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={16} className="text-green-500" />
                  <h3 className="text-sm font-medium text-green-700 dark:text-green-300">Completed ({examsByStatus.completed.length + examsByStatus.results_published.length})</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[...examsByStatus.completed, ...examsByStatus.results_published].map(exam => (
                    <div
                      key={exam.id || exam._id}
                      className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-100 dark:border-green-800 hover:shadow-sm cursor-pointer transition-shadow"
                      onClick={() => navigate(`/academics/exams/${exam.id || exam._id}`)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{exam.name}</span>
                        <Chip size="sm" color="success" variant="flat">
                          {exam.status === 'results_published' ? 'Published' : 'Completed'}
                        </Chip>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">{exam.className || exam.classId} - {exam.subjectName}</p>
                      <div className="flex gap-2 mt-2">
                        <button
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/academics/exams/${exam.id || exam._id}/results`);
                          }}
                        >
                          Enter Results
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Empty state for schedule view */}
          {filteredExams.length === 0 && (
            <div className="text-center py-12">
              <FileText size={40} className="mx-auto mb-3 text-gray-300 dark:text-zinc-600" />
              <p className="text-gray-500 dark:text-zinc-400 mb-4">{t('pages.noExamsToDisplay')}</p>
              <MinimalButton icon={<Plus size={16} />} onClick={onCreateExam}>
                Create First Exam
              </MinimalButton>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, examId: null, examName: '' })}
        size="sm"
        classNames={{ backdrop: 'bg-black/30', base: 'bg-white dark:bg-zinc-950' }}
      >
        <ModalContent>
          <ModalHeader className="border-b border-gray-100 dark:border-zinc-800 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium">{t('pages.deleteExam')}</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400 font-normal">{t('pages.thisActionCannotBeUndone1')}</p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="py-4">
            <p className="text-sm text-gray-600 dark:text-zinc-400">
              Are you sure you want to delete <span className="font-medium">{deleteModal.examName}</span>?
              All associated results will also be removed.
            </p>
          </ModalBody>
          <ModalFooter className="border-t border-gray-100 dark:border-zinc-800">
            <Button variant="light" onPress={() => setDeleteModal({ isOpen: false, examId: null, examName: '' })}>
              Cancel
            </Button>
            <Button color="danger" onPress={handleConfirmDelete}>
              Delete Exam
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ExamManagement;
