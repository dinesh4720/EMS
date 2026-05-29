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
import { FileText, Users, ArrowLeft, Save, AlertCircle, Award, CheckCircle2, Search, UserX, GraduationCap } from 'lucide-react';
import { examsApi, resultsApi, classesApi } from '../../services/api';
import { MinimalButton, InlineEdit, StatCard, ErrorState, EmptyState, PageShell } from '../../components/ui';
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
  <Card shadow="none" className="gradebook">
    <CardBody className="p-0">
      {students.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t('pages.noStudentsFoundInThisClass')}
          size="md"
        />
      ) : (
        <Table aria-label={t('aria.tables.resultsEntry')} removeWrapper>
          <TableHeader className="gradebook__head">
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
                <TableRow key={studentId} className="gradebook__row hover:bg-surface-hover">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center">
                        <span className="text-sm font-medium text-fg-muted">
                          {student.name?.charAt(0)?.toUpperCase() || 'S'}
                        </span>
                      </div>
                      <span className="font-medium text-fg">{student.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-fg-muted">{student.rollNo || studentId}</span>
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      size="sm"
                      isSelected={isAbsent}
                      onValueChange={(checked) => handleAbsentToggle(studentId, checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <InlineEdit
                      type="number"
                      numeric
                      value={marks}
                      min={0}
                      max={exam.maxMarks}
                      disabled={isAbsent}
                      placeholder="0"
                      width="6rem"
                      ariaLabel={t('pages.mARKS')}
                      validate={(val) => {
                        if (val === '' || Number.isNaN(val)) return 'Required';
                        if (val < 0) return t('toast.error.marksCannotBeNegative');
                        if (val > exam.maxMarks) return t('toast.error.marksExceedMaximum', { maxMarks: exam.maxMarks });
                        return null;
                      }}
                      onSave={(val) => handleMarksChange(studentId, String(val))}
                    />
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
                      <span className="text-sm text-fg-faint">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <InlineEdit
                      type="text"
                      value={results[studentId]?.remarks || ''}
                      placeholder={t('pages.addRemarks')}
                      width="10rem"
                      ariaLabel={t('pages.rEMARKS')}
                      onSave={(val) => handleRemarksChange(studentId, val)}
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
  const [loadError, setLoadError] = useState(null);

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
    setLoadError(null);
    try {
      const data = await examsApi.getAll();
      setExams(data || []);
      // Auto-select first exam if available
      if (data && data.length > 0) {
        setSelectedExamId(new Set([data[0].id || data[0]._id]));
      }
    } catch (error) {
      logger.error('Error fetching exams:', error);
      setLoadError(error);
      toast.error(t('toast.error.failedToLoadExams'));
    } finally {
      setLoadingExams(false);
    }
  };

  const fetchExamAndStudents = async (id) => {
    setLoadingStudents(true);
    setDirtyStudentIds(new Set());
    setLoadError(null);
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
      setLoadError(error);
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
      <PageShell title="Enter Results">
        <TablePageSkeleton />
      </PageShell>
    );
  }

  // Error state (initial load failed and nothing to show)
  if (loadError && !exam && exams.length === 0) {
    return (
      <PageShell title="Enter Results">
        <ErrorState
          title={t('toast.error.failedToLoadExamData')}
          error={loadError}
          onRetry={() => (standalone ? fetchExamsList() : examId && fetchExamAndStudents(examId))}
          size="lg"
        />
      </PageShell>
    );
  }

  // Standalone mode - show exam selector
  if (standalone) {
    return (
      <PageShell title="Enter Results">
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
              trigger: 'border-border-token hover:border-fg-faint'
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
          <EmptyState
            icon={FileText}
            title={t('pages.noExamsAvailable')}
            description={t('pages.createAnExamFirstToEnterResults')}
            size="md"
          />
        )}

        {/* Loading students */}
        {loadingStudents && selectedExamId.size > 0 && (
          <TablePageSkeleton kpiCards={0} searchBar={false} rows={5} />
        )}

        {/* Results content */}
        {exam && !loadingStudents && (
          <>
            {/* Exam Info */}
            <div className="bg-surface-2 rounded-lg p-4 border border-divider">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-fg">{exam.name}</h3>
                  <p className="text-sm text-fg-muted">{exam.className || exam.classId} - {exam.subjectName}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-fg-muted">Max: <span className="font-medium text-fg">{exam.maxMarks}</span></span>
                  <span className="text-fg-muted">Pass: <span className="font-medium text-fg">{exam.passingMarks}</span></span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label={t('pages.totalStudents1')}
                value={students.length}
                icon={Users}
                color="gray"
              />
              <StatCard
                label={t('pages.resultsEntered')}
                value={enteredCount}
                icon={GraduationCap}
                color="primary"
              />
              <StatCard
                label={t('pages.passCount')}
                value={passCount}
                icon={CheckCircle2}
                color="success"
              />
            </div>

            {/* Search */}
            {students.length > 5 && (
              <Input
                placeholder={t('pages.searchStudents')}
                value={searchQuery}
                onValueChange={setSearchQuery}
                startContent={<Search size={16} className="text-fg-faint" />}
                className="max-w-xs"
                classNames={{
                  inputWrapper: 'border-border-token hover:border-fg-faint'
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
      </PageShell>
    );
  }

  // Non-standalone mode (original behavior)
  if (!exam) {
    return (
      <PageShell title="Enter Results">
        <EmptyState
          icon={FileText}
          title={t('pages.examNotFound')}
          size="lg"
          action={
            <MinimalButton onClick={() => navigate('/academics/exams')}>
              Back to Exams
            </MinimalButton>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title={`Enter Results: ${exam.name}`}
      description={`${exam.className || exam.classId} - ${exam.subjectName} | Max: ${exam.maxMarks} | Pass: ${exam.passingMarks}`}
      actions={
        <div className="flex items-center gap-2">
          <MinimalButton variant="ghost" onClick={() => navigateSafe(`/academics/exams/${examId}`)}>
            Cancel
          </MinimalButton>
          <MinimalButton icon={<Save size={16} />} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Results'}
          </MinimalButton>
        </div>
      }
    >
      <div className="space-y-6">

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label={t('pages.totalStudents1')}
          value={students.length}
          icon={Users}
          color="gray"
        />
        <StatCard
          label={t('pages.resultsEntered')}
          value={enteredCount}
          icon={GraduationCap}
          color="primary"
        />
        <StatCard
          label={t('pages.passCount')}
          value={passCount}
          icon={CheckCircle2}
          color="success"
        />
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
    </PageShell>
  );
};

export default ResultsEntry;
