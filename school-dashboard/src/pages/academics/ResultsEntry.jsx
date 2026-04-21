import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useValidatedParams } from '../../hooks/useValidatedParams';
import { getStoredUser } from '../../utils/authSession';
import { useUnsavedChanges, useBeforeUnloadWarning } from '../../hooks/useUnsavedChanges';
import { UnsavedChangesModal } from '../../components/modals';
import {
  Card,
  CardBody,
  Chip,
  Checkbox,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Select,
  SelectItem,
  Input
} from '@heroui/react';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { FileText, Users, ArrowLeft, Save, AlertCircle, Award, CheckCircle2, Search, UserX } from 'lucide-react';
import { examsApi, resultsApi, classesApi } from '../../services/api';
import { MinimalButton } from '../../components/ui';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { calculateGrade as calculateGradeUtil } from '../../utils/grading';
import logger from '../../utils/logger';


// Shared table used by both standalone and non-standalone modes
const ResultsTable = ({
  students,
  results,
  exam,
  calculateGrade,
  getStatus,
  handleAbsentToggle,
  handleMarksChange,
  handleRemarksChange,
  t
}) => (
  <Card shadow="none" className="border border-gray-100 dark:border-zinc-800 dark:bg-zinc-950">
    <CardBody className="p-0">
      {students.length === 0 ? (
        <div className="text-center py-12">
          <Users size={40} className="mx-auto mb-3 text-gray-300 dark:text-zinc-600" />
          <p className="text-gray-500 dark:text-zinc-400">{t('pages.noStudentsFoundInThisClass')}</p>
        </div>
      ) : (
        <Table aria-label={t('aria.tables.resultsEntry')} removeWrapper>
          <TableHeader>
            <TableColumn scope="col">{t('pages.sTUDENT')}</TableColumn>
            <TableColumn scope="col">{t('pages.rOLLNo')}</TableColumn>
            <TableColumn scope="col">ABSENT</TableColumn>
            <TableColumn scope="col">{t('pages.mARKS')}</TableColumn>
            <TableColumn scope="col">{t('pages.gRADE')}</TableColumn>
            <TableColumn scope="col">{t('pages.sTATUS')}</TableColumn>
            <TableColumn scope="col">{t('pages.rEMARKS')}</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No students found">
            {students.map((student) => {
              const studentId = student.id || student._id;
              const isAbsent = results[studentId]?.status === 'absent';
              const marks = isAbsent ? 0 : (results[studentId]?.marksObtained || 0);
              const grade = isAbsent ? '-' : calculateGrade(marks);
              const status = getStatus(studentId, marks);

              return (
                <TableRow key={studentId} className="hover:bg-gray-50 dark:hover:bg-zinc-900">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                          {student.name?.charAt(0)?.toUpperCase() || 'S'}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-zinc-100">{student.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600 dark:text-zinc-400">{student.rollNo || studentId}</span>
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      size="sm"
                      isSelected={isAbsent}
                      onValueChange={(checked) => handleAbsentToggle(studentId, checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="w-24">
                      <input
                        type="number"
                        value={marks}
                        onChange={(e) => handleMarksChange(studentId, e.target.value)}
                        min={0}
                        max={exam.maxMarks}
                        disabled={isAbsent}
                        className={`w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-100 outline-none text-sm dark:bg-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100 dark:focus:ring-zinc-800 dark:text-zinc-100 ${isAbsent ? 'opacity-50 cursor-not-allowed' : ''}`}
                        placeholder={t('academics.marksInputPlaceholder')}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat">{grade || '-'}</Chip>
                  </TableCell>
                  <TableCell>
                    {status === 'absent' ? (
                      <Chip size="sm" color="warning" variant="flat" startContent={<UserX size={12} />}>
                        absent
                      </Chip>
                    ) : marks > 0 ? (
                      <Chip
                        size="sm"
                        color={status === 'pass' ? 'success' : 'danger'}
                        variant="flat"
                        startContent={status === 'pass' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                      >
                        {status}
                      </Chip>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-zinc-500">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <input
                      type="text"
                      value={results[studentId]?.remarks || ''}
                      onChange={(e) => handleRemarksChange(studentId, e.target.value)}
                      placeholder={t('pages.addRemarks')}
                      className="w-40 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-100 outline-none text-sm dark:bg-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100 dark:focus:ring-zinc-800 dark:text-zinc-100"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </CardBody>
  </Card>
);

// Simple cache for exam data
// [AUDIT-539] Clear on logout to prevent tenant data leaking across sessions
const examCache = new Map();
const CACHE_DURATION = 60000; // 1 minute

// Listen for logout events to clear module-level cache
if (typeof window !== 'undefined') {
  window.addEventListener('auth-session-cleared', () => examCache.clear());
}

const ResultsEntry = ({ standalone = false }) => {
  const { t } = useTranslation();
  const { params: { examId }, isValid } = useValidatedParams({ examId: 'objectId' }, { redirectTo: '/academics/exams' });
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(examId ? new Set([examId]) : new Set([]));
  const [exam, setExam] = useState(null);
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(!standalone);
  const [loadingExams, setLoadingExams] = useState(standalone);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadedAt, setLoadedAt] = useState(null);
  const [dirtyStudentIds, setDirtyStudentIds] = useState(new Set());
  const [pendingNavPath, setPendingNavPath] = useState(null);

  const isDirty = dirtyStudentIds.size > 0;

  // Guard browser close/refresh when marks are entered but not saved
  const { isBlocked, proceed, reset } = useUnsavedChanges(isDirty && !standalone);
  useBeforeUnloadWarning(isDirty && standalone);

  // Navigate away only if there are no unsaved marks; otherwise show confirmation
  const navigateSafe = (path) => {
    if (isDirty) {
      setPendingNavPath(path);
    } else {
      navigate(path);
    }
  };

  // For standalone mode, fetch all exams first
  useEffect(() => {
    if (standalone) {
      fetchExamsList();
    } else if (examId) {
      fetchExamAndStudents(examId);
    }
  }, [standalone, examId]);

  // Update when exam selection changes in standalone mode
  useEffect(() => {
    if (standalone && selectedExamId.size > 0) {
      const id = Array.from(selectedExamId)[0];
      fetchExamAndStudents(id);
    }
  }, [selectedExamId, standalone]);

  const fetchExamsList = async () => {
    setLoadingExams(true);
    try {
      const data = await examsApi.getAll();
      setExams(data || []);
      // Auto-select first exam if available
      if (data && data.length > 0) {
        setSelectedExamId(new Set([data[0].id || data[0]._id]));
      }
    } catch (error) {
      logger.error('Error fetching exams:', error);
      toast.error(t('toast.error.failedToLoadExams'));
    } finally {
      setLoadingExams(false);
    }
  };

  const fetchExamAndStudents = async (id) => {
    setLoadingStudents(true);
    setDirtyStudentIds(new Set());
    try {
      // Check cache first
      const cacheKey = `exam-${id}`;
      const cached = examCache.get(cacheKey);
      let examData;

      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        examData = cached.data;
      } else {
        examData = await examsApi.getById(id);
        examCache.set(cacheKey, { data: examData, timestamp: Date.now() });
      }

      setExam(examData);
      setLoadedAt(new Date().toISOString());

      // Fetch students and results in parallel once we have classId
      if (examData?.classId) {
        const [studentsResponse, existingResults] = await Promise.all([
          classesApi.getStudents(examData.classId),
          resultsApi.getByClassExam(examData.classId, id)
        ]);

        // Backend returns { students: [...], hasMore, total } — extract the array
        const studentsData = Array.isArray(studentsResponse) ? studentsResponse : studentsResponse?.students || [];
        setStudents(studentsData);

        const resultsMap = {};
        (existingResults || []).forEach(r => {
          const sid = r.studentId?._id || r.studentId;
          if (sid) {
            resultsMap[String(sid)] = {
              marksObtained: r.marksObtained,
              remarks: r.remarks || '',
              ...(r.status === 'absent' ? { status: 'absent' } : {})
            };
          }
        });
        setResults(resultsMap);
      }
    } catch (error) {
      logger.error('Error fetching data:', error);
      toast.error(t('toast.error.failedToLoadExamData'));
    } finally {
      setLoading(false);
      setLoadingStudents(false);
    }
  };

  const markDirty = (studentId) => {
    setDirtyStudentIds(prev => {
      const next = new Set(prev);
      next.add(String(studentId));
      return next;
    });
  };

  const handleMarksChange = (studentId, value) => {
    const maxMarks = exam?.maxMarks ?? 100;
    const sid = String(studentId);
    const parsed = parseInt(value, 10);
    // Always clamp to [0, maxMarks] so the controlled input resets to a valid value
    const marks = isNaN(parsed) ? 0 : Math.max(0, Math.min(parsed, maxMarks));

    if (!isNaN(parsed) && parsed < 0) {
      toast.error(t('toast.error.marksCannotBeNegative'));
    } else if (!isNaN(parsed) && parsed > maxMarks) {
      toast.error(t('toast.error.marksExceedMaximum', { maxMarks }));
    }

    markDirty(sid);
    setResults(prev => ({
      ...prev,
      [sid]: {
        ...prev[sid],
        marksObtained: marks
      }
    }));
  };

  const handleRemarksChange = (studentId, value) => {
    const sid = String(studentId);
    markDirty(sid);
    setResults(prev => ({
      ...prev,
      [sid]: {
        ...prev[sid],
        remarks: value
      }
    }));
  };

  const handleAbsentToggle = (studentId, isAbsent) => {
    const sid = String(studentId);
    markDirty(sid);
    setResults(prev => ({
      ...prev,
      [sid]: {
        ...prev[sid],
        status: isAbsent ? 'absent' : undefined,
        marksObtained: isAbsent ? 0 : (prev[sid]?.marksObtained || 0)
      }
    }));
  };

  const buildResultsArray = () => {
    const user = getStoredUser() || {};
    return students
      .filter(student => dirtyStudentIds.has(String(student.id || student._id)))
      .map(student => {
        const sid = String(student.id || student._id);
        const entry = results[sid] || {};
        return {
          studentId: sid,
          marksObtained: entry.marksObtained ?? 0,
          remarks: entry.remarks || '',
          ...(entry.status === 'absent' ? { status: 'absent' } : {}),
          enteredBy: user.id
        };
      });
  };

  const handleSave = async ({ forceOverwrite } = {}) => {
    if (!exam) return;

    const currentExamId = standalone ? Array.from(selectedExamId)[0] : examId;

    // AUDIT-31: Only send modified students
    if (dirtyStudentIds.size === 0) {
      toast('No changes to save.');
      return;
    }

    setSaving(true);

    try {
      const resultsArray = buildResultsArray();

      // Pre-submission guard: reject if any marks exceed maxMarks
      const maxMarks = exam?.maxMarks || 100;
      const overMax = resultsArray.filter(r => r.status !== 'absent' && r.marksObtained > maxMarks);
      if (overMax.length > 0) {
        toast.error(`${overMax.length} student(s) have marks exceeding the maximum of ${maxMarks}. Please correct before saving.`);
        setSaving(false);
        return;
      }

      await resultsApi.bulkCreate(resultsArray, currentExamId, exam.classId, loadedAt, { forceOverwrite });

      toast.success(t('toast.success.resultsSavedSuccessfully'));
      setDirtyStudentIds(new Set());

      if (!standalone) {
        navigate(`/academics/exams/${examId}`);
      }
    } catch (error) {
      logger.error('Error saving results:', error);
      // AUDIT-233: Handle 409 conflict with forceOverwrite option
      if (error?.status === 409) {
        const count = error.details?.staleStudentIds?.length || 0;
        const confirmed = window.confirm(
          `Results for ${count || 'some'} student(s) were updated by another user since you loaded this page.\n\nClick OK to overwrite with your changes, or Cancel to reload the latest data.`
        );
        if (confirmed) {
          setSaving(false);
          return handleSave({ forceOverwrite: true });
        } else {
          // Reload fresh data
          fetchExamAndStudents(currentExamId);
        }
      } else if (error?.status === 403) {
        toast.error(t('toast.error.insufficientPermissionsToSaveResults'));
      } else {
        toast.error(t('toast.error.failedToSaveResults'));
      }
    } finally {
      setSaving(false);
    }
  };

  // Grade calculation — uses centralized grading utility
  const calculateGrade = (marks) => {
    if (!exam) return '';
    return calculateGradeUtil(marks, exam.maxMarks);
  };

  const getStatus = (studentId, marks) => {
    if (!exam) return '';
    const sid = String(studentId);
    if (results[sid]?.status === 'absent') return 'absent';
    return marks >= exam.passingMarks ? 'pass' : 'fail';
  };

  // Filter students by search
  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    const query = searchQuery.toLowerCase();
    return students.filter(s =>
      s.name?.toLowerCase().includes(query) ||
      String(s.rollNo ?? '').toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

  // Calculate stats
  const enteredCount = Object.values(results).filter(r => r.marksObtained != null && r.marksObtained !== '').length;
  const passCount = Object.values(results).filter(r => r.marksObtained >= (exam?.passingMarks || 35)).length;

  if (!isValid) return null;

  // Loading state
  if (loading || loadingExams) {
    return (
      <TablePageSkeleton />
    );
  }

  // Standalone mode - show exam selector
  if (standalone) {
    return (
      <div className="space-y-4">
        {/* Exam Selector */}
        <div className="flex items-center justify-between gap-4">
          <Select
            label={t('pages.selectExam')}
            placeholder={t('pages.chooseAnExamToEnterResults')}
            selectedKeys={selectedExamId}
            onSelectionChange={setSelectedExamId}
            className="max-w-xs"
            classNames={{
              trigger: 'border-gray-200 hover:border-gray-300 dark:border-zinc-700 dark:hover:border-zinc-600'
            }}
          >
            {exams.map((exam) => (
              <SelectItem key={exam.id || exam._id} value={exam.id || exam._id}>
                {exam.name} - {exam.className || exam.classId}
              </SelectItem>
            ))}
          </Select>

          {exam && (
            <div className="flex items-center gap-2">
              <MinimalButton variant="ghost" onClick={handleSave} disabled={saving || students.length === 0}>
                {saving ? 'Saving...' : 'Save Results'}
              </MinimalButton>
            </div>
          )}
        </div>

        {/* No exam selected */}
        {exams.length === 0 && (
          <div className="text-center py-12">
            <FileText size={40} className="mx-auto mb-3 text-gray-300 dark:text-zinc-600" />
            <p className="text-gray-500 dark:text-zinc-400">{t('pages.noExamsAvailable')}</p>
            <p className="text-sm text-gray-400 dark:text-zinc-500 mt-1">{t('pages.createAnExamFirstToEnterResults')}</p>
          </div>
        )}

        {/* Loading students */}
        {loadingStudents && selectedExamId.size > 0 && (
          <TablePageSkeleton kpiCards={0} searchBar={false} rows={5} />
        )}

        {/* Results content */}
        {exam && !loadingStudents && (
          <>
            {/* Exam Info */}
            <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-4 border border-gray-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-zinc-100">{exam.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">{exam.className || exam.classId} - {exam.subjectName}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-500 dark:text-zinc-400">Max: <span className="font-medium text-gray-900 dark:text-zinc-100">{exam.maxMarks}</span></span>
                  <span className="text-gray-500 dark:text-zinc-400">Pass: <span className="font-medium text-gray-900 dark:text-zinc-100">{exam.passingMarks}</span></span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-3 border border-gray-100 dark:border-zinc-800">
                <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.totalStudents1')}</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-zinc-100">{students.length}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
                <p className="text-xs text-blue-600 dark:text-blue-400">{t('pages.resultsEntered')}</p>
                <p className="text-xl font-semibold text-blue-700 dark:text-blue-300">{enteredCount}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 border border-green-100 dark:border-green-800">
                <p className="text-xs text-green-600 dark:text-green-400">{t('pages.passCount')}</p>
                <p className="text-xl font-semibold text-green-700 dark:text-green-300">{passCount}</p>
              </div>
            </div>

            {/* Search */}
            {students.length > 5 && (
              <Input
                placeholder={t('pages.searchStudents')}
                value={searchQuery}
                onValueChange={setSearchQuery}
                startContent={<Search size={16} className="text-gray-400 dark:text-zinc-500" />}
                className="max-w-xs"
                classNames={{
                  inputWrapper: 'border-gray-200 hover:border-gray-300 dark:border-zinc-700 dark:hover:border-zinc-600'
                }}
              />
            )}

            {/* Results Table */}
            <ResultsTable
              students={filteredStudents}
              results={results}
              exam={exam}
              calculateGrade={calculateGrade}
              getStatus={getStatus}
              handleAbsentToggle={handleAbsentToggle}
              handleMarksChange={handleMarksChange}
              handleRemarksChange={handleRemarksChange}
              t={t}
            />
          </>
        )}
      </div>
    );
  }

  // Non-standalone mode (original behavior)
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
              onClick={() => navigateSafe(`/academics/exams/${examId}`)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-500 dark:text-zinc-400" />
            </button>
            <div className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-lg">
              <Award size={24} className="text-gray-600 dark:text-zinc-400" />
            </div>
            <div>
              <h1 className="text-xl font-medium text-gray-900 dark:text-zinc-100">Enter Results: {exam.name}</h1>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
                {exam.className || exam.classId} - {exam.subjectName} | Max: {exam.maxMarks} | Pass: {exam.passingMarks}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MinimalButton variant="ghost" onClick={() => navigateSafe(`/academics/exams/${examId}`)}>
              Cancel
            </MinimalButton>
            <MinimalButton icon={<Save size={16} />} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Results'}
            </MinimalButton>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-4 border border-gray-100 dark:border-zinc-800">
          <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.totalStudents1')}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">{students.length}</p>
        </div>
        <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-4 border border-gray-100 dark:border-zinc-800">
          <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.resultsEntered')}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">{enteredCount}</p>
        </div>
        <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-4 border border-gray-100 dark:border-zinc-800">
          <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.passCount')}</p>
          <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{passCount}</p>
        </div>
      </div>

      {/* Results Table */}
      <ResultsTable
        students={students}
        results={results}
        exam={exam}
        calculateGrade={calculateGrade}
        getStatus={getStatus}
        handleAbsentToggle={handleAbsentToggle}
        handleMarksChange={handleMarksChange}
        handleRemarksChange={handleRemarksChange}
        t={t}
      />

      {/* Warn before losing unsaved marks via browser-back or in-app navigation */}
      <UnsavedChangesModal
        isOpen={isBlocked || !!pendingNavPath}
        onDiscard={() => {
          if (isBlocked) {
            proceed();
          } else {
            const path = pendingNavPath;
            setPendingNavPath(null);
            navigate(path);
          }
        }}
        onCancel={() => {
          reset();
          setPendingNavPath(null);
        }}
      />
    </div>
  );
};

export default ResultsEntry;
