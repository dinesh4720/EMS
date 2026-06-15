import { useState, useEffect } from "react";
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { useNavigate } from "react-router-dom";
import { useValidatedParams } from "../../hooks/useValidatedParams";
import {
  BookOpen, Plus, AlertCircle, Clock, CheckCircle2, AlertTriangle
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import logger from '../../utils/logger';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Checkbox from '../../components/ui/Checkbox';
import Chip from '../../components/ui/Chip';
import Progress from '../../components/ui/Progress';
import Avatar from '../../components/ui/Avatar';


export default function Subjects() {
  const { t } = useTranslation();
  // [AUDIT-514] id is optional — Subjects tab doesn't receive :id from route.
  // Instead of redirecting, show a class selector when no class is chosen.
  const { params: { id: routeId } } = useValidatedParams({ id: 'optional' }, {});
  const navigate = useNavigate();
  const { classesEnhancedApi, classesApi, staff, classes } = useApp();
  const [selectedClassId, setSelectedClassId] = useState(routeId || '');
  const id = routeId || selectedClassId;
  const isValid = true; // Always valid — class selection handled by UI

  // Lazily loaded students for this class (only fetched when "specific students" is selected)
  const [classStudents, setClassStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Reset students cache when class changes
  useEffect(() => {
    setClassStudents([]);
  }, [id]);

  const fetchClassStudents = async () => {
    if (!id || classStudents.length > 0) return;
    try {
      setLoadingStudents(true);
      const data = await classesApi.getStudents(id);
      setClassStudents((data || []).filter(s =>
        (s.status || 'active') === 'active' && s.isDeleted !== true
      ));
    } catch (error) {
      logger.error('Error loading class students:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addSubjectModal, setAddSubjectModal] = useState(false);
  const [editChapterModal, setEditChapterModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);

  // New subject form state
  const [newSubject, setNewSubject] = useState({
    subjectName: '',
    subjectId: '',
    teacherId: '',
    assignTo: 'all', // 'all' or 'specific'
    selectedStudents: []
  });

  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [isUpdatingChapter, setIsUpdatingChapter] = useState(false);

  // Fetch subjects data
  useEffect(() => {
    if (isValid && id) {
      loadSubjects();
    }
    // `loadSubjects` is recreated each render; triggering on `id`/`isValid` is
    // the intended mount-and-change signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isValid]);

  // If no class selected, show class selector
  if (!id) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-fg">{t('pages.subjectsTeachers')}</h2>
          <p className="text-fg-muted mt-1">{t('pages.manageSubjectsChapterProgressAndTeacherAssignments')}</p>
        </div>
        <div className="card">
          <div className="card__body py-8 space-y-4">
            <EmptyState
              icon={BookOpen}
              title={t('pages.pleaseSelectAClassToViewItsSubjects')}
              size="md"
            >
              <Select
                label={t('pages.selectClass')}
                placeholder={t('pages.chooseAClass')}
                className="max-w-xs mx-auto"
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                {(classes || []).map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.name}{cls.section ? ` - ${cls.section}` : ''}
                  </option>
                ))}
              </Select>
            </EmptyState>
          </div>
        </div>
      </div>
    );
  }


  const loadSubjects = async () => {
    try {
      setLoading(true);
      const data = await classesEnhancedApi.getSubjects(id);
      setSubjects(data || []);
    } catch (error) {
      logger.error('Error loading subjects:', error);
        toast.error(t('toast.error.failedToLoadSubjects', 'Failed to load subjects'));
      // Fallback to class subjects if API fails
      const classData = classes.find(c => String(c.id || c._id) === String(id));
      if (classData && classData.subjects) {
        const fallbackSubjects = classData.subjects.map(sub => ({
          subjectName: sub,
          chapters: [],
          overallProgress: 0,
          teacherName: t('classes.noTeacherAssigned', 'No Teacher Assigned')
        }));
        setSubjects(fallbackSubjects);
      }
    } finally {
      setLoading(false);
    }
  };

  // Get teachers for dropdown - Filter for active staff with Teacher role
  const teachers = staff.filter(s => {
    const roles = Array.isArray(s.role) ? s.role : [s.role];
    return roles.includes('Teacher') && s.status === 'active';
  });

  // Handle add subject
  const handleAddSubject = async () => {
    if (!newSubject.subjectName?.trim()) {
      toast.error(t('toast.error.pleaseEnterSubjectName', 'Please enter a subject name'));
      return;
    }
    // Check for duplicate subject
    const isDuplicate = subjects.some(s =>
      s.subjectName?.toLowerCase() === newSubject.subjectName.trim().toLowerCase()
    );
    if (isDuplicate) {
      toast.error(t('toast.error.subjectAlreadyExists', 'This subject already exists in this class'));
      return;
    }
    if (isAddingSubject) return;
    setIsAddingSubject(true);
    try {
      await classesEnhancedApi.addSubject(id, {
        subjectName: newSubject.subjectName.trim(),
        subjectId: newSubject.subjectId || undefined,
        teacherId: newSubject.teacherId,
        assignedStudents: newSubject.assignTo === 'specific' ? newSubject.selectedStudents : []
      });

      setAddSubjectModal(false);
      setNewSubject({
        subjectName: '',
        subjectId: '',
        teacherId: '',
        assignTo: 'all',
        selectedStudents: []
      });

      loadSubjects();
      toast.success(t('toast.success.subjectAdded', 'Subject added successfully'));
    } catch (error) {
      logger.error('Error adding subject:', error);
      toast.error(error.response?.data?.message || error.message || t('toast.error.failedToAddSubject', 'Failed to add subject'));
    } finally {
      setIsAddingSubject(false);
    }
  };

  // Handle chapter progress update
  const handleUpdateChapter = async () => {
    if (!selectedSubject || isUpdatingChapter) return;
    setIsUpdatingChapter(true);
    try {
      await classesEnhancedApi.updateChapter(selectedSubject._id, {
        chapters: selectedSubject.chapters
      });

      setEditChapterModal(false);
      loadSubjects();
      toast.success(t('toast.success.chapterProgressUpdatedSuccessfully'));
    } catch (error) {
      logger.error('Error updating chapter:', error);
      toast.error(error.response?.data?.message || error.message || t('toast.error.failedToUpdateChapter', 'Failed to update chapter progress'));
    } finally {
      setIsUpdatingChapter(false);
    }
  };

  // Get progress color
  const getProgressColor = (progress) => {
    if (progress >= 70) return 'success';
    if (progress >= 40) return 'warning';
    return 'danger';
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const colors = {
      not_started: 'neutral',
      in_progress: 'primary',
      completed: 'success'
    };
    return colors[status] || 'neutral';
  };

  if (loading) {
    return (
      <TablePageSkeleton />
    );
  }

  const onTrackCount = subjects.filter(s => (s.overallProgress || 0) >= 50).length;
  const behindCount = subjects.filter(s => (s.overallProgress || 0) < 50).length;

  return (
    <div className="w-full flex flex-col">
      {/* Toolbar — dense, mirrors StaffList */}
      <div className="toolbar -mx-6 -mt-6 mb-4">
        <span style={{ fontSize: 13, fontWeight: 520, letterSpacing: '-0.01em', color: 'var(--fg)' }}>
          {t('pages.subjectsTeachers')}
        </span>
        <span className="status">
          <span className="mono tnum">{subjects.length}</span>&nbsp;{t('classes.subjects', 'Subjects')}
        </span>
        {subjects.length > 0 && (
          <>
            <span className="status status--ok">
              <span className="mono tnum">{onTrackCount}</span>&nbsp;on track
            </span>
            <span className="status status--warn">
              <span className="mono tnum">{behindCount}</span>&nbsp;behind
            </span>
          </>
        )}
        <button
          type="button"
          className="btn btn--accent btn--sm"
          onClick={() => setAddSubjectModal(true)}
          style={{ marginLeft: 'auto' }}
        >
          <Plus size={13} aria-hidden /> {t('classes.addSubject', 'Add Subject')}
        </button>
      </div>

      {/* Curriculum Health Summary */}
      {subjects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <StatCard
            label={t('classes.totalSubjects', 'Total Subjects')}
            value={subjects.length}
            icon={BookOpen}
            color="gray"
          />
          <StatCard
            label={t('classes.onTrack', 'On Track')}
            value={onTrackCount}
            subtext={t('classes.fiftyPlusProgress', '50%+ progress')}
            icon={CheckCircle2}
            color="success"
          />
          <StatCard
            label={t('classes.behindSchedule', 'Behind Schedule')}
            value={behindCount}
            subtext={t('classes.belowFifty', 'Below 50%')}
            icon={AlertTriangle}
            color="warning"
          />
        </div>
      )}

      {/* Subjects Table */}
      {subjects.length === 0 ? (
        <div className="bg-surface-2 rounded-lg border border-dashed border-divider">
          <EmptyState
            icon={BookOpen}
            title={t('pages.noSubjectsAssignedYet')}
            size="lg"
            action={
              <button
                type="button"
                className="btn btn--accent btn--sm"
                onClick={() => setAddSubjectModal(true)}
              >
                {t('classes.addFirstSubject', 'Add First Subject')}
              </button>
            }
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table" aria-label={t('aria.tables.subjects')}>
          <thead>
            <tr>
              <th scope="col">{t('pages.sUBJECT')}</th>
              <th scope="col">{t('pages.tEACHER')}</th>
              <th scope="col">{t('pages.pROGRESS')}</th>
              <th scope="col">{t('pages.cHAPTERS')}</th>
              <th scope="col" className="text-center">{t('pages.aCTIONS')}</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject) => (
              <tr key={subject._id || subject.subjectName}>
                <td>
                  <div className="py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 bg-surface-2 text-fg-muted">
                      <BookOpen size={16} />
                    </div>
                    <span className="font-semibold text-fg">{subject.subjectName}</span>
                  </div>
                </td>
                <td>
                  <div className="py-3">
                    {subject.teacherName || subject.teacherId?.name ? (
                      <div className="flex items-center gap-2">
                        <Avatar
                          name={subject.teacherName || subject.teacherId?.name}
                          size="sm"
                          shape="square"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-fg">{subject.teacherName || subject.teacherId?.name}</span>
                          <span className="text-xs text-fg-muted">{t('common.teacher', 'Teacher')}</span>
                        </div>
                      </div>
                    ) : (
                      <Chip size="sm" color="warning">{t('pages.unassigned1')}</Chip>
                    )}
                  </div>
                </td>
                <td>
                  <div className="py-3 w-full max-w-[140px]">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-fg-muted">{t('pages.completed')}</span>
                      <span className="font-medium">{subject.overallProgress || 0}%</span>
                    </div>
                    <Progress
                      size="sm"
                      value={subject.overallProgress || 0}
                      color={getProgressColor(subject.overallProgress)}
                    />
                  </div>
                </td>
                <td>
                  <div className="py-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-fg">{subject.chapters?.length || 0} {t('classes.chapters', 'Chapters')}</span>
                      {subject.upcomingChapters?.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-fg-muted max-w-[180px]">
                          <Clock size={10} />
                          <span className="truncate">{t('classes.next', 'Next')}: {subject.upcomingChapters[0]}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="py-3 flex justify-center">
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      onClick={() => { setSelectedSubject(subject); setEditChapterModal(true); }}
                    >
                      {t('common.manage', 'Manage')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      )}

      {/* Add Subject Modal */}
      <Modal
        isOpen={addSubjectModal}
        onClose={() => setAddSubjectModal(false)}
        size="md"
        title={t('pages.addSubject1')}
        footer={
          <>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setAddSubjectModal(false)}
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="button"
              className="btn btn--accent"
              onClick={handleAddSubject}
              disabled={!newSubject.subjectName || isAddingSubject}
            >
              {isAddingSubject ? 'Adding…' : t('classes.addSubject', 'Add Subject')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={t('pages.subjectName1')}
            placeholder={t('classes.subjectNamePlaceholder')}
            value={newSubject.subjectName}
            onChange={(e) => setNewSubject(prev => ({ ...prev, subjectName: e.target.value }))}
            required
          />

          <Select
            label={t('pages.assignTeacher')}
            placeholder={t('pages.selectATeacher')}
            value={newSubject.teacherId}
            onChange={(e) => setNewSubject(prev => ({ ...prev, teacherId: e.target.value }))}
          >
            <option value="">{t('pages.selectATeacher')}</option>
            {teachers.map(teacher => (
              <option key={teacher._id} value={teacher._id}>
                {teacher.name}
              </option>
            ))}
          </Select>

          <div className="space-y-2">
            <label className="text-sm font-medium text-fg">{t('pages.assignToStudents')}</label>
            <div className="flex gap-4">
              <Checkbox
                size="sm"
                checked={newSubject.assignTo === 'all'}
                onChange={(e) => {
                  if (e.target.checked) {
                    setNewSubject(prev => ({ ...prev, assignTo: 'all', selectedStudents: [] }));
                  }
                }}
                label={t('pages.allStudents', 'All Students')}
              />
              <Checkbox
                size="sm"
                checked={newSubject.assignTo === 'specific'}
                onChange={(e) => {
                  if (e.target.checked) {
                    setNewSubject(prev => ({ ...prev, assignTo: 'specific' }));
                    fetchClassStudents();
                  }
                }}
                label={t('pages.specificStudents', 'Specific Students')}
              />
            </div>
            {newSubject.assignTo === 'specific' && (
              <div className="mt-2 max-h-40 overflow-y-auto border border-divider rounded-lg p-2 space-y-1">
                {loadingStudents ? (
                  <p className="text-sm text-fg-muted text-center py-2">{t('common.loading', 'Loading...')}</p>
                ) : classStudents.length > 0 ? classStudents.map(student => (
                  <Checkbox
                    key={student._id || student.id}
                    size="sm"
                    checked={newSubject.selectedStudents.includes(String(student._id || student.id))}
                    onChange={(e) => {
                      const sid = String(student._id || student.id);
                      setNewSubject(prev => ({
                        ...prev,
                        selectedStudents: e.target.checked
                          ? [...prev.selectedStudents, sid]
                          : prev.selectedStudents.filter(s => s !== sid)
                      }));
                    }}
                    label={`${student.name} ${student.rollNo ? `(${student.rollNo})` : ''}`}
                  />
                )) : (
                  <p className="text-sm text-fg-muted text-center py-2">{t('pages.noStudentsInClass', 'No students in this class')}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Edit Chapter Progress Modal */}
      <Modal
        isOpen={editChapterModal}
        onClose={() => setEditChapterModal(false)}
        size="lg"
        title={t('pages.updateChapterProgress')}
        footer={
          <>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setEditChapterModal(false)}
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="button"
              className="btn btn--accent"
              onClick={handleUpdateChapter}
              disabled={isUpdatingChapter}
            >
              {isUpdatingChapter ? 'Saving…' : t('common.saveChanges', 'Save Changes')}
            </button>
          </>
        }
      >
        {selectedSubject && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg text-fg">{selectedSubject.subjectName}</h3>
              <p className="text-sm text-fg-muted">
                {t('common.teacher', 'Teacher')}: {selectedSubject.teacherName || selectedSubject.teacherId?.name || t('classes.noTeacherAssigned', 'No Teacher Assigned')}
              </p>
            </div>

            {selectedSubject.chapters && selectedSubject.chapters.length > 0 ? (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto px-1">
                {selectedSubject.chapters.map((chapter, idx) => (
                  <div key={chapter._id || `ch-${chapter.chapterNumber}-${chapter.chapterName}`} className="card">
                    <div className="card__body space-y-3">
                      <div className="flex justify-between items-center gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate text-fg">Ch {chapter.chapterNumber}: {chapter.chapterName}</p>
                          <Chip
                            size="sm"
                            color={getStatusBadge(chapter.status)}
                            className="mt-1 h-5 text-[10px]"
                          >
                            {chapter.status === 'not_started' ? t('classes.notStarted', 'Not Started') : chapter.status === 'in_progress' ? t('classes.inProgress', 'In Progress') : chapter.status === 'completed' ? t('pages.completed', 'Completed') : t('classes.notStarted', 'Not Started')}
                          </Chip>
                        </div>
                        <div className="text-right shrink-0">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            label={t('pages.progress')}
                            value={chapter.progressPercentage || 0}
                            onChange={(e) => {
                              const newChapters = [...selectedSubject.chapters];
                              newChapters[idx].progressPercentage = parseInt(e.target.value) || 0;
                              setSelectedSubject(prev => ({ ...prev, chapters: newChapters }));
                            }}
                            className="w-20"
                            size="sm"
                            endContent={<span className="text-fg-muted text-xs">%</span>}
                          />
                        </div>
                      </div>
                      <Progress value={chapter.progressPercentage || 0} size="sm" color={getProgressColor(chapter.progressPercentage)} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-surface-2 rounded-lg">
                <EmptyState
                  icon={AlertCircle}
                  title={t('pages.noChaptersFound')}
                  size="sm"
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
