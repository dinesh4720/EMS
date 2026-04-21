import { useState, useEffect, useMemo } from 'react';
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
import { FileText, Users, Eye, Pencil, Send, ArrowLeft, CheckCircle2, AlertCircle, Trophy, Award } from 'lucide-react';
import { examsApi, resultsApi, classesApi } from '../../services/api';
import { MinimalButton } from '../../components/ui';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { formatShortDate } from '../../utils/dateFormatter';
import logger from '../../utils/logger';


const ExamDetail = () => {
  const { t } = useTranslation();
  const { params: { examId }, isValid } = useValidatedParams({ examId: 'objectId' }, { redirectTo: '/academics/exams' });
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [results, setResults] = useState([]);
  const [studentMap, setStudentMap] = useState({}); // studentId → { name, rollNo }
  const [loading, setLoading] = useState(true);
  const [publishModal, setPublishModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setExam(null);
    setResults([]);
    setStudentMap({});
    if (!examId) return;

    const controller = new AbortController();
    const signal = controller.signal;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const examData = await examsApi.getById(examId, { signal });
        setExam(examData);

        if (examData?.classId) {
          const [resultsData, studentsResponse] = await Promise.all([
            resultsApi.getByClassExam(examData.classId, examId, { signal }),
            classesApi.getStudents(examData.classId, { signal })
          ]);

          setResults(Array.isArray(resultsData) ? resultsData : []);

          // Build name map from students list
          const students = Array.isArray(studentsResponse)
            ? studentsResponse
            : studentsResponse?.students || [];
          const map = {};
          students.forEach(s => {
            const id = String(s._id || s.id);
            map[id] = { name: s.name, rollNo: s.rollNo };
          });
          setStudentMap(map);
        }
      } catch (error) {
        if (error.name === 'AbortError') return;
        logger.error('Error fetching exam details:', error);
        toast.error(t('toast.error.failedToLoadExamDetails'));
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    };

    fetchAll();
    return () => controller.abort();
  }, [examId, refreshKey]);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await examsApi.publish(examId);
      toast.success(t('toast.success.resultsPublishedSuccessfully'));
      setPublishModal(false);
      setRefreshKey(k => k + 1);
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

  const getStatusLabel = (status) => {
    if (status === 'results_published') return 'Published';
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : '';
  };

  // Resolve student name: try backend-populated name first, then local map, then fallback
  const getStudentName = (result) => {
    if (result.studentName) return result.studentName;
    const rawId = typeof result.studentId === 'object'
      ? String(result.studentId?._id || result.studentId)
      : String(result.studentId);
    return studentMap[rawId]?.name || rawId;
  };

  const getStudentRollNo = (result) => {
    if (result.studentRollNo) return result.studentRollNo;
    const rawId = typeof result.studentId === 'object'
      ? String(result.studentId?._id || result.studentId)
      : String(result.studentId);
    return studentMap[rawId]?.rollNo;
  };

  // Computed stats — use backend-stored status only; do not infer from marks
  const stats = useMemo(() => {
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const avg = results.length > 0
      ? (results.reduce((s, r) => s + (r.percentage ?? 0), 0) / results.length).toFixed(1)
      : 0;
    return { passed, failed, avg };
  }, [results]);

  // Client-side percentile: "beats X% of class" based on percentage scores
  const percentileMap = useMemo(() => {
    if (results.length === 0) return {};
    const total = results.length;
    const map = {};
    results.forEach(r => {
      const id = String(r._id || r.id);
      const below = results.filter(o => (o.percentage ?? 0) < (r.percentage ?? 0)).length;
      map[id] = total > 1 ? Math.round((below / total) * 100) : 100;
    });
    return map;
  }, [results]);

  if (!isValid) return null;

  if (loading) return <TablePageSkeleton />;

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

  const className = exam.className || (typeof exam.classId === 'object' ? exam.classId?.name : exam.classId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl">
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
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-medium text-gray-900 dark:text-zinc-100">{exam.name}</h1>
                <Chip size="sm" color={getStatusColor(exam.status)} variant="flat" className="capitalize">
                  {getStatusLabel(exam.status)}
                </Chip>
              </div>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
                {className} · {exam.subjectName} · {exam.academicYear}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {exam.status !== 'results_published' && (
              <MinimalButton
                variant="ghost"
                icon={<Pencil size={16} />}
                onClick={() => navigate(`/academics/exams/${examId}/results`)}
              >
                Enter Results
              </MinimalButton>
            )}
            {exam.status !== 'results_published' && results.length > 0 && (
              <MinimalButton
                icon={<Send size={16} />}
                onClick={() => setPublishModal(true)}
              >
                Publish Results
              </MinimalButton>
            )}
            {exam.status === 'results_published' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-950 rounded-lg border border-green-100 dark:border-green-800">
                <CheckCircle2 size={14} className="text-green-600 dark:text-green-400" />
                <span className="text-sm text-green-700 dark:text-green-300 font-medium">Results Published</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card shadow="none" className="border border-gray-100 dark:border-zinc-800">
          <CardBody className="p-4">
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">Type</p>
            <p className="font-medium text-gray-900 dark:text-zinc-100 capitalize">
              {exam.type?.replace(/_/g, ' ')}
            </p>
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-gray-100 dark:border-zinc-800">
          <CardBody className="p-4">
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">Date</p>
            <p className="font-medium text-gray-900 dark:text-zinc-100">
              {exam.startDate ? formatShortDate(exam.startDate) : 'Not set'}
            </p>
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-gray-100 dark:border-zinc-800">
          <CardBody className="p-4">
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">Max Marks</p>
            <p className="font-medium text-gray-900 dark:text-zinc-100">{exam.maxMarks || 100}</p>
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-gray-100 dark:border-zinc-800">
          <CardBody className="p-4">
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">Passing Marks</p>
            <p className="font-medium text-gray-900 dark:text-zinc-100">{exam.passingMarks ?? 35}</p>
          </CardBody>
        </Card>
      </div>

      {/* Stats (only when results exist) */}
      {results.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
            <p className="text-xs text-blue-600 dark:text-blue-400">Total Results</p>
            <p className="text-2xl font-semibold text-blue-700 dark:text-blue-300">{results.length}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-950 rounded-xl p-4 border border-green-100 dark:border-green-800">
            <p className="text-xs text-green-600 dark:text-green-400">Passed</p>
            <p className="text-2xl font-semibold text-green-700 dark:text-green-300">{stats.passed}</p>
          </div>
          <div className="bg-red-50 dark:bg-red-950 rounded-xl p-4 border border-red-100 dark:border-red-800">
            <p className="text-xs text-red-600 dark:text-red-400">Failed</p>
            <p className="text-2xl font-semibold text-red-700 dark:text-red-300">{stats.failed}</p>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <Card shadow="none" className="border border-gray-100 dark:border-zinc-800">
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                <Users size={18} className="text-gray-600 dark:text-zinc-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-zinc-100">{t('pages.resultsSummary')}</h3>
                {results.length > 0 && (
                  <p className="text-xs text-gray-400 dark:text-zinc-500">Class avg: {stats.avg}%</p>
                )}
              </div>
            </div>
            <MinimalButton
              variant="ghost"
              size="sm"
              icon={<Pencil size={14} />}
              onClick={() => navigate(`/academics/exams/${examId}/results`)}
            >
              {results.length > 0 ? 'Edit Results' : 'Enter Results'}
            </MinimalButton>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-10">
              <Eye size={40} className="mx-auto mb-3 text-gray-300 dark:text-zinc-600" />
              <p className="text-gray-500 dark:text-zinc-400 mb-4">{t('pages.noResultsEnteredYet')}</p>
              <MinimalButton onClick={() => navigate(`/academics/exams/${examId}/results`)}>
                Enter Results
              </MinimalButton>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-zinc-800">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">Rank</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">Student</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">Roll No</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">Marks</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">% / Percentile</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">Grade</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => {
                    // AUDIT-748: Trust backend-stored status; do not recompute with hardcoded passing marks
                    const status = result.status ?? 'pending';
                    const statusConfig = {
                      passed:   { color: 'success', label: 'Passed',   icon: <CheckCircle2 size={11} /> },
                      failed:   { color: 'danger',  label: 'Failed',   icon: <AlertCircle size={11} /> },
                      absent:   { color: 'warning', label: 'Absent',   icon: <AlertCircle size={11} /> },
                      promoted: { color: 'primary', label: 'Promoted', icon: <CheckCircle2 size={11} /> },
                      withheld: { color: 'default', label: 'Withheld', icon: <AlertCircle size={11} /> },
                      pending:  { color: 'default', label: 'Pending',  icon: null },
                    };
                    const cfg = statusConfig[status] || { color: 'default', label: status || 'Unknown', icon: null };
                    const rank = result.rank;
                    const resultId = String(result._id || result.id);
                    const percentile = percentileMap[resultId];
                    return (
                      <tr key={result.id || result._id} className="border-b border-gray-50 dark:border-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-900">
                        <td className="py-3 px-4">
                          {rank != null ? (
                            <div className="flex items-center gap-1.5">
                              {rank === 1 && <Trophy size={14} className="text-yellow-500 shrink-0" />}
                              {rank === 2 && <Award size={14} className="text-gray-400 shrink-0" />}
                              {rank === 3 && <Award size={14} className="text-amber-600 shrink-0" />}
                              <span className={`text-sm font-semibold ${rank === 1 ? 'text-yellow-600 dark:text-yellow-400' : rank <= 3 ? 'text-gray-700 dark:text-zinc-300' : 'text-gray-500 dark:text-zinc-400'}`}>
                                #{rank}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-zinc-500">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                              <span className="text-xs font-medium text-gray-600 dark:text-zinc-400">
                                {getStudentName(result)?.charAt(0)?.toUpperCase() || 'S'}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                              {getStudentName(result)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500 dark:text-zinc-400">
                          {getStudentRollNo(result) || '—'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700 dark:text-zinc-300 font-medium">
                          {result.marksObtained}/{exam.maxMarks || 100}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-gray-600 dark:text-zinc-400">
                            {Math.max(0, Math.min(100, result.percentage ?? 0)).toFixed(1)}%
                          </div>
                          {percentile != null && status !== 'absent' && (
                            <div className="text-xs text-gray-400 dark:text-zinc-500">
                              Beats {percentile}% of class
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Chip size="sm" variant="flat">{result.grade || '—'}</Chip>
                        </td>
                        <td className="py-3 px-4">
                          <Chip
                            size="sm"
                            color={cfg.color}
                            variant="flat"
                            startContent={cfg.icon}
                          >
                            {cfg.label}
                          </Chip>
                        </td>
                      </tr>
                    );
                  })}
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
              Publishing results for <span className="font-medium">{exam.name}</span> will make them visible to all students and parents.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 border border-green-100 dark:border-green-800 text-center">
                <p className="text-xl font-semibold text-green-700 dark:text-green-300">{stats.passed}</p>
                <p className="text-xs text-green-600 dark:text-green-400">Passing</p>
              </div>
              <div className="bg-red-50 dark:bg-red-950 rounded-lg p-3 border border-red-100 dark:border-red-800 text-center">
                <p className="text-xl font-semibold text-red-700 dark:text-red-300">{stats.failed}</p>
                <p className="text-xs text-red-600 dark:text-red-400">Failing</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-3">{t('pages.thisActionCannotBeUndone2')}</p>
          </ModalBody>
          <ModalFooter className="border-t border-gray-100 dark:border-zinc-800">
            <Button variant="light" onPress={() => setPublishModal(false)} isDisabled={publishing}>
              Cancel
            </Button>
            <Button color="success" onPress={handlePublish} isLoading={publishing}>
              Publish Results
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ExamDetail;
