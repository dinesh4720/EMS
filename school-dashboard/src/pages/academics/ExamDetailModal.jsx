import { useState, useEffect } from 'react';
import { ModalHeader, ModalBody, Chip, Button } from '@heroui/react';
import { FileText, Calendar, Award, Eye, Pencil, Send, AlertTriangle } from 'lucide-react';
import { examsApi, resultsApi, classesApi } from '../../services/api';
import { MinimalButton } from '../../components/ui';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { formatShortDate } from '../../utils/dateFormatter';
import logger from '../../utils/logger';


const ExamDetailModal = ({ examId, onClose, onEnterResults }) => {
  const { t } = useTranslation();
  const [exam, setExam] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);

  useEffect(() => {
    if (examId) {
      fetchExamDetails();
    }
  }, [examId]);

  const fetchExamDetails = async () => {
    setLoading(true);
    try {
      const examData = await examsApi.getById(examId);
      setExam(examData);

      if (examData?.classId) {
        const resultsData = await resultsApi.getByClassExam(examData.classId, examId);
        setResults(Array.isArray(resultsData) ? resultsData : []);
      }
    } catch (error) {
      logger.error('Error fetching exam details:', error);
      toast.error(t('toast.error.failedToLoadExamDetails'));
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await examsApi.publish(examId);
      toast.success(t('toast.success.resultsPublishedSuccessfully'));
      setPublishConfirmOpen(false);
      fetchExamDetails();
    } catch (error) {
      logger.error('Error publishing results:', error);
      toast.error(t('toast.error.failedToPublishResults'));
    } finally {
      setPublishing(false);
    }
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

  if (loading) {
    return (
      <div className="space-y-4 py-4 px-2">
        <div className="flex items-center gap-3">
          <div className="h-6 w-48 bg-surface-2 rounded animate-pulse" />
          <div className="h-5 w-20 bg-surface-2 rounded-full animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2 p-3 bg-surface-2 rounded-lg">
              <div className="h-3 w-16 bg-surface-2 rounded animate-pulse" />
              <div className="h-5 w-24 bg-surface-2 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-surface-2 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-12">
        <FileText size={40} className="mx-auto mb-3 text-fg-faint" />
        <p className="text-fg-muted">{t('pages.examNotFound')}</p>
        <Button className="mt-4" onPress={onClose}>{t('pages.close2')}</Button>
      </div>
    );
  }

  const passedCount = results.filter(r => r.status === 'passed').length;
  const failedCount = results.filter(r => r.status === 'failed').length;

  return (
    <>
      <ModalHeader className="border-b border-divider py-4 px-6">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-surface-2 rounded-lg">
              <FileText size={20} className="text-fg-muted" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-fg">{exam.name}</h3>
              <p className="text-sm text-fg-muted font-normal">
                {exam.className || (typeof exam.classId === 'object' ? exam.classId?.name : null) || 'Class'} - {exam.subjectName}
              </p>
            </div>
          </div>
          <Chip
            size="sm"
            color={getStatusColor(exam.status)}
            variant="flat"
            className="capitalize"
          >
            {exam.status?.replace(/_/g, ' ')}
          </Chip>
        </div>
      </ModalHeader>
      <ModalBody className="px-6 pb-6 pt-4">
        <div className="space-y-6">
          {/* Exam Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface-2 rounded-lg p-4 border border-divider">
              <div className="flex items-center gap-2 text-fg-muted mb-1">
                <Calendar size={14} />
                <span className="text-xs">{t('pages.startDate1')}</span>
              </div>
              <p className="font-medium text-fg">
                {exam.startDate ? formatShortDate(exam.startDate) : 'Not set'}
              </p>
            </div>
            <div className="bg-surface-2 rounded-lg p-4 border border-divider">
              <div className="flex items-center gap-2 text-fg-muted mb-1">
                <Calendar size={14} />
                <span className="text-xs">{t('pages.endDate1')}</span>
              </div>
              <p className="font-medium text-fg">
                {exam.endDate ? formatShortDate(exam.endDate) : 'Not set'}
              </p>
            </div>
            <div className="bg-surface-2 rounded-lg p-4 border border-divider">
              <div className="flex items-center gap-2 text-fg-muted mb-1">
                <Award size={14} />
                <span className="text-xs">{t('pages.maxMarks2')}</span>
              </div>
              <p className="font-medium text-fg">{exam.maxMarks || exam.totalMarks || 100}</p>
            </div>
            <div className="bg-surface-2 rounded-lg p-4 border border-divider">
              <div className="flex items-center gap-2 text-fg-muted mb-1">
                <Award size={14} />
                <span className="text-xs">{t('pages.passingMarks')}</span>
              </div>
              <p className="font-medium text-fg">{exam.passingMarks || 35}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
              <p className="text-xs text-blue-600 dark:text-blue-400">{t('pages.totalResults')}</p>
              <p className="text-2xl font-semibold text-blue-700 dark:text-blue-300">{results.length}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border border-green-100 dark:border-green-800">
              <p className="text-xs text-green-600 dark:text-green-400">{t('pages.passed')}</p>
              <p className="text-2xl font-semibold text-green-700 dark:text-green-300">{passedCount}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 border border-red-100 dark:border-red-800">
              <p className="text-xs text-red-600 dark:text-red-400">{t('pages.failed')}</p>
              <p className="text-2xl font-semibold text-red-700 dark:text-red-300">{failedCount}</p>
            </div>
          </div>

          {/* Results Table */}
          {results.length === 0 ? (
            <div className="text-center py-8 border border-divider rounded-lg">
              <Eye size={32} className="mx-auto mb-2 text-fg-faint" />
              <p className="text-sm text-fg-muted">{t('pages.noResultsEnteredYet')}</p>
            </div>
          ) : (
            <div className="border border-divider rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-surface-2">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-fg-muted">{t('pages.student')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-fg-muted">{t('pages.marks')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-fg-muted">{t('pages.status2')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-fg-muted">{t('pages.remarks')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {results.map((result) => (
                    <tr key={result._id} className="hover:bg-surface-2">
                      <td className="px-4 py-3 text-sm text-fg">
                        {result.studentName || result.studentId}
                      </td>
                      <td className="px-4 py-3 text-sm text-fg-muted">
                        {result.marksObtained} / {exam.maxMarks || 100}
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const status = result.status || (result.marksObtained >= (exam.passingMarks || 35) ? 'passed' : 'failed');
                          const statusConfig = {
                            passed:   { color: 'success', label: 'Passed' },
                            failed:   { color: 'danger',  label: 'Failed' },
                            absent:   { color: 'warning', label: 'Absent' },
                            promoted: { color: 'primary', label: 'Promoted' },
                            withheld: { color: 'default', label: 'Withheld' },
                          };
                          const cfg = statusConfig[status] || { color: 'default', label: status || 'Unknown' };
                          return (
                            <Chip size="sm" color={cfg.color} variant="flat">
                              {cfg.label}
                            </Chip>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-sm text-fg-muted">
                        {result.remarks || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Publish Confirmation Inline */}
          {publishConfirmOpen && (
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />
                <span className="font-medium text-amber-800 dark:text-amber-200 text-sm">Confirm Publish</span>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                Are you sure you want to publish results for <span className="font-medium">{exam?.name}</span>?
                This will make results visible to students and parents and cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="light" onPress={() => setPublishConfirmOpen(false)} isDisabled={publishing}>
                  Cancel
                </Button>
                <Button size="sm" color="success" onPress={handlePublish} isLoading={publishing}>
                  Publish Results
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-divider">
            <Button variant="light" onPress={onClose}>
              Close
            </Button>
            <div className="flex gap-2">
              {exam.status !== 'results_published' && (
                <>
                  <MinimalButton
                    icon={<Pencil size={16} />}
                    onClick={onEnterResults}
                  >
                    Enter Results
                  </MinimalButton>
                  {results.length > 0 && (
                    <MinimalButton
                      icon={<Send size={16} />}
                      onClick={() => setPublishConfirmOpen(true)}
                      variant="primary"
                    >
                      Publish Results
                    </MinimalButton>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </ModalBody>
    </>
  );
};

export default ExamDetailModal;
