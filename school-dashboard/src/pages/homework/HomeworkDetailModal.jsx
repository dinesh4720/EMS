import { useState, useEffect } from 'react';
import {
  ClipboardList, Clock, Star, UserCheck, Paperclip, ExternalLink,
  Calendar, CheckCircle2, FileCheck2, Hourglass, ChevronDown, ChevronUp,
} from 'lucide-react';
import { request } from '../../services/api';
import toast from 'react-hot-toast';
import { formatShortDate } from '../../utils/dateFormatter';
import {
  Modal, Card, Chip, Button, Input,
  EmptyState, ErrorState, MarkdownRenderer, StatCard, Skeleton,
} from '../../components/ui';
import { homeworkGradeSchema, parseFormSchema } from '../../validators/formSchemas';

const getSubmissionChipColor = ({ isGraded, isLate }) => {
  if (isGraded) return 'success';
  if (isLate) return 'warning';
  return 'info';
};

export default function HomeworkDetailModal({ homeworkId, onClose, onDataChanged }) {
  const [hw, setHw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  const [grading, setGrading] = useState(null); // { studentId, marks, feedback }
  const [gradeErrors, setGradeErrors] = useState({});
  const [savingGrade, setSavingGrade] = useState(false);
  const [markingSubmit, setMarkingSubmit] = useState(null);
  const [showUnsubmitted, setShowUnsubmitted] = useState(false);

  useEffect(() => {
    if (!homeworkId) return;
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeworkId]);

  const fetchDetail = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await request(`/homework/${homeworkId}`);
      setHw(res);
      const classId = res?.classId?._id || res?.classId;
      if (classId) {
        try {
          const studentsRes = await request(`/students?classId=${classId}&limit=200`);
          setClassStudents(studentsRes?.data ?? []);
        } catch {
          // Non-critical — unsubmitted list simply won't show
        }
      }
    } catch (err) {
      setLoadError(err);
      toast.error('Failed to load homework details');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkSubmitted = async (studentId) => {
    setMarkingSubmit(studentId);
    try {
      await request(`/homework/${homeworkId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ studentId, remarks: 'Paper submission recorded by teacher' }),
      });
      toast.success('Submission recorded');
      fetchDetail();
      onDataChanged?.();
    } catch (e) {
      toast.error(e?.message || 'Failed to record submission');
    } finally {
      setMarkingSubmit(null);
    }
  };

  const handleGrade = async () => {
    const maxMarks = hw?.totalMarks ?? 100;
    const { success, errors } = parseFormSchema(homeworkGradeSchema, {
      studentId: grading?.studentId,
      marks: grading?.marks,
      feedback: grading?.feedback || '',
      maxMarks,
    });
    if (!success) {
      setGradeErrors(errors);
      const firstErr = Object.values(errors)[0];
      if (firstErr) toast.error(firstErr);
      return;
    }
    setGradeErrors({});
    setSavingGrade(true);
    try {
      await request(`/homework/${homeworkId}/grade`, {
        method: 'POST',
        body: JSON.stringify({
          studentId: grading.studentId,
          marks: Number(grading.marks),
          feedback: grading.feedback || '',
        }),
      });
      toast.success('Submission graded');
      setGrading(null);
      fetchDetail();
      onDataChanged?.();
    } catch (e) {
      toast.error(e?.message || 'Failed to grade submission');
    } finally {
      setSavingGrade(false);
    }
  };

  const submittedCount = hw?.submissions?.length || 0;
  const gradedCount = hw?.submissions?.filter((sub) => sub.marks != null).length || 0;
  const pendingGradeCount = submittedCount - gradedCount;
  const dueDate = hw?.dueDate ? new Date(hw.dueDate) : null;
  const isOverdue = dueDate && dueDate < new Date();

  const submittedStudentIds = new Set(
    (hw?.submissions || []).map((sub) => String(sub.studentId?._id || sub.studentId))
  );
  const unsubmittedStudents = classStudents.filter(
    (st) => !submittedStudentIds.has(String(st._id))
  );

  const headerTitle = loading
    ? 'Loading…'
    : hw?.title || 'Homework';
  const headerDescription = loading
    ? ' '
    : `${hw?.subject || ''} · ${hw?.classId?.name || ''}${hw?.classId?.section ? ` (${hw.classId.section})` : ''}`;

  const renderLoading = () => (
    <div role="status" aria-busy="true" aria-live="polite" className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={`hw-skeleton-${i}`} variant="rect" className="h-20 w-full" />
        ))}
      </div>
      <Skeleton variant="text" className="h-4 w-1/3" />
      <Skeleton variant="rect" className="h-24 w-full" />
    </div>
  );

  const renderBody = () => {
    if (loading) return renderLoading();
    if (loadError) {
      return (
        <ErrorState
          title="Couldn't load homework"
          error={loadError}
          onRetry={fetchDetail}
        />
      );
    }
    if (!hw) return <EmptyState icon={ClipboardList} title="Homework not found" description="This homework could not be loaded." />;

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Due Date"
            value={dueDate ? formatShortDate(dueDate) : '—'}
            icon={Calendar}
            color={isOverdue ? 'red' : 'gray'}
          />
          <StatCard label="Submitted" value={submittedCount} icon={FileCheck2} color="blue" />
          <StatCard label="Graded" value={gradedCount} icon={CheckCircle2} color="green" />
          <StatCard label="Pending Grade" value={pendingGradeCount} icon={Hourglass} color="amber" />
        </div>

        {hw?.description && (
          <div>
            <p className="text-xs text-fg-muted mb-1">Description</p>
            <MarkdownRenderer content={hw.description} className="text-sm text-fg" />
          </div>
        )}

        {hw?.attachments?.length > 0 && (
          <div>
            <p className="text-xs text-fg-muted mb-2 flex items-center gap-1">
              <Paperclip size={12} aria-hidden="true" /> Attachments ({hw.attachments.length})
            </p>
            <div className="space-y-1.5">
              {hw.attachments.map((att) => (
                <a
                  key={att.url || att.name}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-surface-2 border border-divider rounded-lg hover:bg-surface-2 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30"
                >
                  <Paperclip size={14} className="text-fg-faint shrink-0" aria-hidden="true" />
                  <span className="text-sm text-fg truncate flex-1">
                    {att.name || att.url}
                  </span>
                  {att.type && (
                    <Chip size="sm" color="neutral">
                      {att.type}
                    </Chip>
                  )}
                  <ExternalLink
                    size={13}
                    className="text-fg-faint shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-hidden="true"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {unsubmittedStudents.length > 0 && (
          <Card padding="none" className="overflow-hidden border-amber-100 dark:border-amber-900">
            <button
              type="button"
              onClick={() => setShowUnsubmitted((prev) => !prev)}
              aria-expanded={showUnsubmitted}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-amber-50 dark:bg-amber-950/40 text-sm font-medium text-amber-700 dark:text-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30"
            >
              <span className="flex items-center gap-2">
                <UserCheck size={14} aria-hidden="true" />
                Not Submitted ({unsubmittedStudents.length}) — Mark Paper Submission
              </span>
              {showUnsubmitted ? (
                <ChevronUp size={14} aria-hidden="true" />
              ) : (
                <ChevronDown size={14} aria-hidden="true" />
              )}
            </button>
            {showUnsubmitted && (
              <div className="divide-y divide-divider max-h-48 overflow-y-auto">
                {unsubmittedStudents.map((st) => (
                  <div
                    key={st._id}
                    className="flex items-center justify-between px-4 py-2 bg-surface"
                  >
                    <div>
                      <p className="text-sm font-medium text-fg">{st.name}</p>
                      <p className="text-xs text-fg-faint">Roll: {st.rollNo || '—'}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={markingSubmit === st._id}
                      onClick={() => handleMarkSubmitted(st._id)}
                    >
                      Mark Submitted
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        <div>
          <p className="text-sm font-semibold text-fg mb-3">Submissions</p>
          {!hw?.submissions?.length ? (
            <EmptyState icon={Clock} size="sm" title="No submissions yet" />
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {(hw.submissions || []).map((sub) => {
                const student = sub.studentId;
                const isLate = sub.submittedAt && dueDate && new Date(sub.submittedAt) > dueDate;
                const isGraded = sub.marks != null;
                const isEditingThis = grading?.studentId === (student?._id || student);

                return (
                  <Card key={sub._id || sub.studentId?._id || sub.studentId} padding="sm" className="bg-surface-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-fg truncate">
                          {student?.name || 'Student'}
                        </p>
                        <p className="text-xs text-fg-muted">
                          Roll: {student?.rollNo || '—'} · Submitted {sub.submittedAt ? formatShortDate(sub.submittedAt) : '—'}
                          {isLate && <span className="ml-1 text-amber-600 dark:text-amber-400">(Late)</span>}
                        </p>
                        {sub.remarks && (
                          <p className="text-xs text-fg-faint mt-0.5 italic">&quot;{sub.remarks}&quot;</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isGraded && (
                          <div className="flex items-center gap-1">
                            <Star size={13} className="text-amber-400 fill-amber-400" aria-hidden="true" />
                            <span className="text-sm font-medium text-fg">
                              {sub.marks}/{hw?.totalMarks ?? 100}
                            </span>
                          </div>
                        )}
                        <Chip size="sm" color={getSubmissionChipColor({ isGraded, isLate })}>
                          {isGraded ? 'Graded' : isLate ? 'Late' : 'Submitted'}
                        </Chip>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setGradeErrors({});
                            setGrading(
                              isEditingThis
                                ? null
                                : {
                                    studentId: student?._id || student,
                                    marks: sub.marks ?? '',
                                    feedback: sub.feedback || '',
                                  }
                            );
                          }}
                        >
                          {isEditingThis ? 'Cancel' : isGraded ? 'Edit' : 'Grade'}
                        </Button>
                      </div>
                    </div>

                    {isEditingThis && (
                      <div className="mt-3 flex items-end gap-2 border-t border-divider pt-3">
                        <Input
                          wrapperClassName="w-32"
                          label={`Marks (max ${hw?.totalMarks ?? 100})`}
                          type="number"
                          size="sm"
                          min={0}
                          max={hw?.totalMarks ?? 100}
                          value={String(grading.marks)}
                          onChange={(e) => setGrading((prev) => ({ ...prev, marks: e.target.value }))}
                          error={gradeErrors.marks}
                        />
                        <Input
                          wrapperClassName="flex-1"
                          label="Feedback (optional)"
                          size="sm"
                          value={grading.feedback}
                          onChange={(e) => setGrading((prev) => ({ ...prev, feedback: e.target.value }))}
                          error={gradeErrors.feedback}
                        />
                        <Button size="sm" variant="primary" onClick={handleGrade} loading={savingGrade}>
                          Save
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={!!homeworkId}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      title={headerTitle}
      description={headerDescription}
      footer={(close) => (
        <Button variant="ghost" onClick={close}>
          Close
        </Button>
      )}
    >
      {renderBody()}
    </Modal>
  );
}
