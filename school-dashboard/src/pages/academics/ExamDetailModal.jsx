import { useState, useEffect } from 'react';
import { ModalHeader, ModalBody, Chip, Button } from '@heroui/react';
import { FileText, Calendar, Award, Users, Eye, Pencil, Send, AlertTriangle, BookOpen, Clock } from 'lucide-react';
import { examsApi, resultsApi, classesApi } from '../../services/api';
import { MinimalButton } from '../../components/ui';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const ExamDetailModal = ({ examId, onClose, onEnterResults }) => {
  const { t } = useTranslation();
  const [exam, setExam] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

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
        setResults(resultsData || []);
      }
    } catch (error) {
      console.error('Error fetching exam details:', error);
      toast.error(t('toast.error.failedToLoadExamDetails'));
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      await examsApi.publish(examId);
      toast.success(t('toast.success.resultsPublishedSuccessfully'));
      fetchExamDetails();
    } catch (error) {
      console.error('Error publishing results:', error);
      toast.error(t('toast.error.failedToPublishResults'));
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
      <div className="flex justify-center py-8"><div className="animate-spin h-8 w-8 rounded-full border-2 border-gray-300 border-t-gray-900" /></div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-12">
        <FileText size={40} className="mx-auto mb-3 text-gray-300 dark:text-zinc-600" />
        <p className="text-gray-500 dark:text-zinc-400">{t('pages.examNotFound')}</p>
        <Button className="mt-4" onClick={onClose}>{t('pages.close2')}</Button>
      </div>
    );
  }

  const passedCount = results.filter(r => r.marksObtained >= (exam.passingMarks || 35)).length;
  const failedCount = results.length - passedCount;

  return (
    <>
      <ModalHeader className="border-b border-gray-100 dark:border-zinc-800 py-4 px-6">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
              <FileText size={20} className="text-gray-600 dark:text-zinc-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100">{exam.name}</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400 font-normal">
                {exam.className || exam.classId} - {exam.subjectName}
              </p>
            </div>
          </div>
          <Chip
            size="sm"
            color={getStatusColor(exam.status)}
            variant="flat"
            className="capitalize"
          >
            {exam.status?.replace('_', ' ')}
          </Chip>
        </div>
      </ModalHeader>
      <ModalBody className="px-6 pb-6 pt-4">
        <div className="space-y-6">
          {/* Exam Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-4 border border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-gray-500 dark:text-zinc-400 mb-1">
                <Calendar size={14} />
                <span className="text-xs">{t('pages.startDate1')}</span>
              </div>
              <p className="font-medium text-gray-900 dark:text-zinc-100">
                {exam.startDate ? new Date(exam.startDate).toLocaleDateString() : 'Not set'}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-4 border border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-gray-500 dark:text-zinc-400 mb-1">
                <Calendar size={14} />
                <span className="text-xs">{t('pages.endDate1')}</span>
              </div>
              <p className="font-medium text-gray-900 dark:text-zinc-100">
                {exam.endDate ? new Date(exam.endDate).toLocaleDateString() : 'Not set'}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-4 border border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-gray-500 dark:text-zinc-400 mb-1">
                <Award size={14} />
                <span className="text-xs">{t('pages.maxMarks2')}</span>
              </div>
              <p className="font-medium text-gray-900 dark:text-zinc-100">{exam.maxMarks || exam.totalMarks || 100}</p>
            </div>
            <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-4 border border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-gray-500 dark:text-zinc-400 mb-1">
                <Award size={14} />
                <span className="text-xs">{t('pages.passingMarks')}</span>
              </div>
              <p className="font-medium text-gray-900 dark:text-zinc-100">{exam.passingMarks || 35}</p>
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
          {results.length > 0 && (
            <div className="border border-gray-100 dark:border-zinc-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-zinc-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400">{t('pages.student')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400">{t('pages.marks')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400">{t('pages.status2')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400">{t('pages.remarks')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {results.map((result) => (
                    <tr key={result._id} className="hover:bg-gray-50 dark:hover:bg-zinc-900">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-zinc-100">
                        {result.studentName || result.studentId}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-zinc-400">
                        {result.marksObtained} / {exam.maxMarks || 100}
                      </td>
                      <td className="px-4 py-3">
                        <Chip
                          size="sm"
                          color={result.marksObtained >= (exam.passingMarks || 35) ? 'success' : 'danger'}
                          variant="flat"
                        >
                          {result.marksObtained >= (exam.passingMarks || 35) ? 'Pass' : 'Fail'}
                        </Chip>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-zinc-400">
                        {result.remarks || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-zinc-800">
            <Button variant="light" onClick={onClose}>
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
                      onClick={handlePublish}
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
