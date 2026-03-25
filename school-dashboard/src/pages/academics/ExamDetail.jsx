import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useValidatedParams } from '../../hooks/useValidatedParams';
import {
  Card,
  CardBody,
  Chip,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter
} from '@heroui/react';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { FileText, Calendar, Award, Users, Eye, Pencil, Send, AlertTriangle, ArrowLeft, BookOpen } from 'lucide-react';
import { examsApi, resultsApi } from '../../services/api';
import { MinimalButton } from '../../components/ui';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const ExamDetail = () => {
  const { t } = useTranslation();
  const { params: { examId }, isValid } = useValidatedParams({ examId: 'objectId' }, { redirectTo: '/academics/exams' });
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishModal, setPublishModal] = useState(false);

  useEffect(() => {
    setExam(null);
    setResults([]);
    fetchExamDetails();
  }, [examId]);

  const fetchExamDetails = async () => {
    if (!examId) return;
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
      setPublishModal(false);
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

  if (!isValid) return null;

  if (loading) {
    return (
      <TablePageSkeleton />
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-20">
        <FileText size={40} className="mx-auto mb-3 text-gray-300 dark:text-zinc-600" />
        <p className="text-gray-500 dark:text-zinc-400">{t('pages.examNotFound')}</p>
        <MinimalButton className="mt-4" onClick={() => navigate('/academics/exams')}>
          Back to Exams
        </MinimalButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-lg">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/academics/exams')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-500 dark:text-zinc-400" />
            </button>
            <div className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-lg">
              <FileText size={24} className="text-gray-600 dark:text-zinc-400" />
            </div>
            <div>
              <h1 className="text-xl font-medium text-gray-900 dark:text-zinc-100">{exam.name}</h1>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
                {exam.classId} - {exam.subjectName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MinimalButton
              variant="ghost"
              icon={<Pencil size={16} />}
              onClick={() => navigate(`/academics/results/entry/${examId}`)}
            >
              Enter Results
            </MinimalButton>
            {!exam.isPublished && (
              <MinimalButton
                icon={<Send size={16} />}
                onClick={() => setPublishModal(true)}
              >
                Publish Results
              </MinimalButton>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Exam Details */}
        <Card shadow="none" className="border border-gray-100 dark:border-zinc-800">
          <CardBody className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                <FileText size={18} className="text-gray-600 dark:text-zinc-400" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-zinc-100">{t('pages.examDetails1')}</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-50 dark:border-zinc-800">
                <span className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.type1')}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-zinc-100 capitalize">
                  {exam.type?.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50 dark:border-zinc-800">
                <span className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.status2')}</span>
                <Chip size="sm" color={getStatusColor(exam.status)} variant="flat" className="capitalize">
                  {exam.status?.replace('_', ' ')}
                </Chip>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50 dark:border-zinc-800">
                <span className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.date2')}</span>
                <span className="text-sm text-gray-900 dark:text-zinc-100">{exam.startDate || 'Not scheduled'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.academicYear1')}</span>
                <span className="text-sm text-gray-900 dark:text-zinc-100">{exam.academicYear}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Marks Configuration */}
        <Card shadow="none" className="border border-gray-100 dark:border-zinc-800">
          <CardBody className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                <Award size={18} className="text-gray-600 dark:text-zinc-400" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-zinc-100">{t('pages.marksConfiguration')}</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-50 dark:border-zinc-800">
                <span className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.maxMarks2')}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{exam.maxMarks}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50 dark:border-zinc-800">
                <span className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.passingMarks')}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{exam.passingMarks}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50 dark:border-zinc-800">
                <span className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.weightage')}</span>
                <span className="text-sm text-gray-900 dark:text-zinc-100">{exam.weightage}%</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.resultsEntered')}</span>
                <span className="text-sm text-gray-900 dark:text-zinc-100">{results.length} students</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Results Summary */}
      <Card shadow="none" className="border border-gray-100 dark:border-zinc-800">
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                <Users size={18} className="text-gray-600 dark:text-zinc-400" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-zinc-100">{t('pages.resultsSummary')}</h3>
            </div>
            {results.length > 0 && (
              <MinimalButton variant="ghost" size="sm" onClick={() => navigate(`/academics/results/entry/${examId}`)}>
                Edit Results
              </MinimalButton>
            )}
          </div>

          {results.length === 0 ? (
            <div className="text-center py-8">
              <Eye size={40} className="mx-auto mb-3 text-gray-300 dark:text-zinc-600" />
              <p className="text-gray-500 dark:text-zinc-400 mb-4">{t('pages.noResultsEnteredYet')}</p>
              <MinimalButton onClick={() => navigate(`/academics/results/entry/${examId}`)}>
                Enter Results
              </MinimalButton>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-zinc-800">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">{t('pages.studentId')}</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">{t('pages.marks')}</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">{t('pages.percentage2')}</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">{t('pages.grade2')}</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">{t('pages.status2')}</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr key={result.id || result._id} className="border-b border-gray-50 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900">
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-zinc-100">{result.studentId}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-zinc-400">
                        {result.marksObtained}/{result.maxMarks}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-zinc-400">{Math.max(0, Math.min(100, result.percentage ?? 0)).toFixed(1)}%</td>
                      <td className="py-3 px-4">
                        <Chip size="sm" variant="flat">{result.grade}</Chip>
                      </td>
                      <td className="py-3 px-4">
                        <Chip
                          size="sm"
                          color={result.status === 'pass' ? 'success' : 'danger'}
                          variant="flat"
                        >
                          {result.status}
                        </Chip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Publish Confirmation Modal */}
      <Modal
        isOpen={publishModal}
        onClose={() => setPublishModal(false)}
        size="sm"
        classNames={{ backdrop: 'bg-black/30', base: 'bg-white dark:bg-zinc-950' }}
      >
        <ModalContent>
          <ModalHeader className="border-b border-gray-100 dark:border-zinc-800 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Send size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium">{t('pages.publishResults')}</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400 font-normal">{t('pages.makeResultsVisibleToStudents')}</p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="py-4">
            <p className="text-sm text-gray-600 dark:text-zinc-400">
              Are you sure you want to publish the results for <span className="font-medium">{exam.name}</span>?
              This will make the results visible to students and parents.
            </p>
            <div className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg p-3 mt-2">
              <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.thisActionCannotBeUndone2')}</p>
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-gray-100 dark:border-zinc-800">
            <Button variant="light" onPress={() => setPublishModal(false)}>
              Cancel
            </Button>
            <Button color="success" onPress={handlePublish}>
              Publish Results
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ExamDetail;
