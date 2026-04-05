import { useState, useEffect } from 'react';
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Chip, Input,
} from '@heroui/react';
import { ClipboardList, Clock, Star, UserCheck, Paperclip, ExternalLink } from 'lucide-react';
import { request } from '../../services/api';
import toast from 'react-hot-toast';
import { formatShortDate } from '../../utils/dateFormatter';
import { useTranslation } from 'react-i18next';

const SUBMISSION_STATUS_COLORS = {
  submitted: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  graded: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
  late: 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-300',
};

export default function HomeworkDetailModal({ homeworkId, onClose, onDataChanged }) {
  const [hw, setHw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [classStudents, setClassStudents] = useState([]);
  const [grading, setGrading] = useState(null); // { studentId, marks, feedback }
  const [savingGrade, setSavingGrade] = useState(false);
  const [markingSubmit, setMarkingSubmit] = useState(null); // studentId being marked
  const [showUnsubmitted, setShowUnsubmitted] = useState(false);

  useEffect(() => {
    if (!homeworkId) return;
    fetchDetail();
  }, [homeworkId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await request(`/homework/${homeworkId}`);
      setHw(res);
      // Fetch class students to show unsubmitted list
      const classId = res?.classId?._id || res?.classId;
      if (classId) {
        try {
          const studentsRes = await request(`/students?classId=${classId}&limit=200`);
          setClassStudents(studentsRes?.data ?? []);
        } catch {
          // Non-critical — unsubmitted list simply won't show
        }
      }
    } catch {
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
    } catch (e) {
      toast.error(e?.message || 'Failed to record submission');
    } finally {
      setMarkingSubmit(null);
    }
  };

  const handleGrade = async () => {
    if (!grading || grading.marks === '' || grading.marks === undefined) {
      toast.error('Enter a marks value');
      return;
    }
    const maxMarks = hw?.totalMarks ?? 100;
    if (Number(grading.marks) > maxMarks) {
      toast.error(`Marks cannot exceed ${maxMarks}`);
      return;
    }
    if (Number(grading.marks) < 0) {
      toast.error('Marks cannot be negative');
      return;
    }
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
  const gradedCount = hw?.submissions?.filter(s => s.marks != null).length || 0;
  const dueDate = hw?.dueDate ? new Date(hw.dueDate) : null;
  const isOverdue = dueDate && dueDate < new Date();

  const submittedStudentIds = new Set(
    (hw?.submissions || []).map(s => String(s.studentId?._id || s.studentId))
  );
  const unsubmittedStudents = classStudents.filter(
    st => !submittedStudentIds.has(String(st._id))
  );

  return (
    <Modal
      isOpen={!!homeworkId}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      classNames={{ backdrop: 'bg-black/30', base: 'bg-white dark:bg-zinc-950' }}
    >
      <ModalContent>
        <ModalHeader className="border-b border-gray-100 dark:border-zinc-800 py-4 px-6">
          {loading ? (
            <div className="h-6 w-48 bg-gray-100 dark:bg-zinc-800 rounded animate-pulse" />
          ) : (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                <ClipboardList size={20} className="text-gray-600 dark:text-zinc-300" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100">{hw?.title}</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400 font-normal">
                  {hw?.subject} · {hw?.classId?.name}{hw?.classId?.section ? ` (${hw.classId.section})` : ''}
                </p>
              </div>
            </div>
          )}
        </ModalHeader>
        <ModalBody className="px-6 py-4">
          {loading ? (
            <div className="animate-pulse space-y-4 py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-200 dark:bg-zinc-700 rounded-lg" />)}
              </div>
              <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-1/3" />
              <div className="h-24 bg-gray-100 dark:bg-zinc-800 rounded-lg" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Meta */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-3 border border-gray-100 dark:border-zinc-800">
                  <p className="text-xs text-gray-500 dark:text-zinc-400">Due Date</p>
                  <p className={`text-sm font-medium mt-0.5 ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-zinc-100'}`}>
                    {dueDate ? formatShortDate(dueDate) : '—'}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-3 border border-gray-100 dark:border-zinc-800">
                  <p className="text-xs text-gray-500 dark:text-zinc-400">Submitted</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 mt-0.5">{submittedCount}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 border border-green-100 dark:border-green-900">
                  <p className="text-xs text-green-600 dark:text-green-400">Graded</p>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300 mt-0.5">{gradedCount}</p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-950 rounded-lg p-3 border border-yellow-100 dark:border-yellow-900">
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">Pending Grade</p>
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mt-0.5">{submittedCount - gradedCount}</p>
                </div>
              </div>

              {/* Description */}
              {hw?.description && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">Description</p>
                  <p className="text-sm text-gray-700 dark:text-zinc-300">{hw.description}</p>
                </div>
              )}

              {/* Attachments */}
              {hw?.attachments?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mb-2 flex items-center gap-1">
                    <Paperclip size={12} /> Attachments ({hw.attachments.length})
                  </p>
                  <div className="space-y-1.5">
                    {hw.attachments.map((att, i) => (
                      <a
                        key={i}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors group"
                      >
                        <Paperclip size={14} className="text-gray-400 dark:text-zinc-500 shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-zinc-300 truncate flex-1">
                          {att.name || att.url}
                        </span>
                        {att.type && (
                          <Chip size="sm" variant="flat" className="text-xs bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 shrink-0">
                            {att.type}
                          </Chip>
                        )}
                        <ExternalLink size={13} className="text-gray-400 dark:text-zinc-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Unsubmitted students — paper submission panel */}
              {unsubmittedStudents.length > 0 && (
                <div className="border border-orange-100 dark:border-orange-900 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setShowUnsubmitted(p => !p)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-orange-50 dark:bg-orange-950/40 text-sm font-medium text-orange-700 dark:text-orange-300"
                  >
                    <span className="flex items-center gap-2">
                      <UserCheck size={14} />
                      Not Submitted ({unsubmittedStudents.length}) — Mark Paper Submission
                    </span>
                    <span className="text-xs">{showUnsubmitted ? '▲' : '▼'}</span>
                  </button>
                  {showUnsubmitted && (
                    <div className="divide-y divide-gray-100 dark:divide-zinc-800 max-h-48 overflow-y-auto">
                      {unsubmittedStudents.map(st => (
                        <div
                          key={st._id}
                          className="flex items-center justify-between px-4 py-2 bg-white dark:bg-zinc-950"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{st.name}</p>
                            <p className="text-xs text-gray-400 dark:text-zinc-500">Roll: {st.rollNo || '—'}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="flat"
                            className="bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 text-xs"
                            isLoading={markingSubmit === st._id}
                            onPress={() => handleMarkSubmitted(st._id)}
                          >
                            Mark Submitted
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Submissions list */}
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-3">Submissions</p>
                {!hw?.submissions?.length ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-lg">
                    <Clock size={32} className="mx-auto mb-2 text-gray-300 dark:text-zinc-600" />
                    <p className="text-sm text-gray-400 dark:text-zinc-500">No submissions yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {hw.submissions.map((sub, i) => {
                      const student = sub.studentId;
                      const isLate = sub.submittedAt && dueDate && new Date(sub.submittedAt) > dueDate;
                      const isGraded = sub.marks != null;
                      const isEditingThis = grading?.studentId === (student?._id || student);

                      return (
                        <div
                          key={i}
                          className="p-3 rounded-lg bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">
                                {student?.name || 'Student'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-zinc-400">
                                Roll: {student?.rollNo || '—'} · Submitted {sub.submittedAt ? formatShortDate(sub.submittedAt) : '—'}
                                {isLate && <span className="ml-1 text-orange-500">(Late)</span>}
                              </p>
                              {sub.remarks && (
                                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5 italic">"{sub.remarks}"</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {isGraded && (
                                <div className="flex items-center gap-1">
                                  <Star size={13} className="text-yellow-400 fill-yellow-400" />
                                  <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">{sub.marks}/{hw?.totalMarks ?? 100}</span>
                                </div>
                              )}
                              <Chip
                                size="sm"
                                variant="flat"
                                className={isGraded ? SUBMISSION_STATUS_COLORS.graded : isLate ? SUBMISSION_STATUS_COLORS.late : SUBMISSION_STATUS_COLORS.submitted}
                              >
                                {isGraded ? 'Graded' : isLate ? 'Late' : 'Submitted'}
                              </Chip>
                              <button
                                onClick={() => setGrading(
                                  isEditingThis ? null : {
                                    studentId: student?._id || student,
                                    marks: sub.marks ?? '',
                                    feedback: sub.feedback || '',
                                  }
                                )}
                                className="text-xs text-blue-500 hover:underline"
                              >
                                {isEditingThis ? 'Cancel' : isGraded ? 'Edit' : 'Grade'}
                              </button>
                            </div>
                          </div>

                          {/* Inline grading form */}
                          {isEditingThis && (
                            <div className="mt-3 flex items-end gap-2 border-t border-gray-100 dark:border-zinc-800 pt-3">
                              <Input
                                label={`Marks (max ${hw?.totalMarks ?? 100})`}
                                type="number"
                                size="sm"
                                min={0}
                                max={hw?.totalMarks ?? 100}
                                value={String(grading.marks)}
                                onChange={e => setGrading(p => ({ ...p, marks: e.target.value }))}
                                variant="bordered"
                                className="w-28"
                                classNames={{ input: 'dark:text-zinc-100', inputWrapper: 'dark:border-zinc-700' }}
                              />
                              <Input
                                label="Feedback (optional)"
                                size="sm"
                                value={grading.feedback}
                                onChange={e => setGrading(p => ({ ...p, feedback: e.target.value }))}
                                variant="bordered"
                                className="flex-1"
                                classNames={{ input: 'dark:text-zinc-100', inputWrapper: 'dark:border-zinc-700' }}
                              />
                              <Button
                                size="sm"
                                className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                                onPress={handleGrade}
                                isLoading={savingGrade}
                              >
                                Save
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter className="border-t border-gray-100 dark:border-zinc-800">
          <Button variant="light" onPress={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
