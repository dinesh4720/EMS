import { useState, useEffect } from "react";
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Card, CardBody, Button, Progress, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, Select, SelectItem, Checkbox, Chip, User
} from "@heroui/react";
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { useNavigate } from "react-router-dom";
import { useValidatedParams } from "../../hooks/useValidatedParams";
import {
  BookOpen, Plus, AlertCircle, Clock
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';

export default function Subjects() {
  const { t } = useTranslation();
  // [AUDIT-514] id is optional — Subjects tab doesn't receive :id from route.
  // Instead of redirecting, show a class selector when no class is chosen.
  const { params: { id: routeId } } = useValidatedParams({ id: 'optional' }, {});
  const navigate = useNavigate();
  const { classesEnhancedApi, staff, classes, students } = useApp();
  const [selectedClassId, setSelectedClassId] = useState(routeId || '');
  const id = routeId || selectedClassId;
  const isValid = true; // Always valid — class selection handled by UI

  // Filter students for this class
  const classStudents = (students || []).filter(s =>
    String(s.classId?._id || s.classId) === String(id) &&
    (s.status || 'active') === 'active' &&
    s.isDeleted !== true
  );

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

  // Fetch subjects data
  useEffect(() => {
    if (isValid && id) {
      loadSubjects();
    }
  }, [id, isValid]);

  // If no class selected, show class selector
  if (!id) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-default-800">{t('pages.subjectsTeachers')}</h2>
          <p className="text-default-500 mt-1">{t('pages.manageSubjectsChapterProgressAndTeacherAssignments')}</p>
        </div>
        <Card className="border-default-200">
          <CardBody className="py-8 space-y-4">
            <BookOpen size={48} className="mx-auto text-default-300" />
            <p className="text-default-500 text-center">{t('pages.pleaseSelectAClassToViewItsSubjects')}</p>
            <Select
              label={t('pages.selectClass')}
              placeholder={t('pages.chooseAClass')}
              variant="bordered"
              className="max-w-xs mx-auto"
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              {(classes || []).map((cls) => (
                <SelectItem key={cls._id} value={cls._id}>
                  {cls.name}{cls.section ? ` - ${cls.section}` : ''}
                </SelectItem>
              ))}
            </Select>
          </CardBody>
        </Card>
      </div>
    );
  }


  const loadSubjects = async () => {
    try {
      setLoading(true);
      const data = await classesEnhancedApi.getSubjects(id);
      setSubjects(data || []);
    } catch (error) {
      console.error('Error loading subjects:', error);
        toast.error(t('toast.error.failedToLoadSubjects', 'Failed to load subjects'));
      // Fallback to class subjects if API fails
      const classData = classes.find(c => c.id === id || c._id === id);
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
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [isUpdatingChapter, setIsUpdatingChapter] = useState(false);
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
      console.error('Error adding subject:', error);
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
      console.error('Error updating chapter:', error);
      toast.error(error.response?.data?.message || error.message || t('toast.error.failedToUpdateChapter', 'Failed to update chapter progress'));
    } finally {
      setIsUpdatingChapter(false);
    }
  };

  // Subject color mapping — consistent colors per subject name
  const SUBJECT_COLORS = [
    { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
    { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
    { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
    { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
    { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400' },
    { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400' },
    { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400' },
    { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
  ];
  const getSubjectColor = (name) => {
    const hash = (name || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return SUBJECT_COLORS[hash % SUBJECT_COLORS.length];
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
      not_started: 'default',
      in_progress: 'primary',
      completed: 'success'
    };
    return colors[status] || 'default';
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
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-background border-b border-default-200 py-4 -mx-6 -mt-6 px-6 mb-4">
        {/* Left Side */}
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-default-800">{t('pages.subjectsTeachers')}</h2>
          <Chip size="sm" variant="flat">{subjects.length} {t('classes.subjects', 'Subjects')}</Chip>
        </div>

        {/* Right Side - Actions */}
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <Button
            size="sm"
            color="primary"
            startContent={<Plus size={16} />}
            onPress={() => setAddSubjectModal(true)}
          >
            {t('classes.addSubject', 'Add Subject')}
          </Button>
        </div>
      </div>

      {/* Curriculum Health Summary */}
      {subjects.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-default-200">
            <p className="text-xs text-default-500">{t('classes.totalSubjects', 'Total Subjects')}</p>
            <p className="text-2xl font-semibold text-default-900">{subjects.length}</p>
          </div>
          <div className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-default-200">
            <p className="text-xs text-green-600">{t('classes.onTrack', 'On Track')}</p>
            <p className="text-2xl font-semibold text-green-700">{onTrackCount}</p>
            <p className="text-[11px] text-default-400">{t('classes.fiftyPlusProgress', '50%+ progress')}</p>
          </div>
          <div className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-default-200">
            <p className="text-xs text-amber-600">{t('classes.behindSchedule', 'Behind Schedule')}</p>
            <p className="text-2xl font-semibold text-amber-700">{behindCount}</p>
            <p className="text-[11px] text-default-400">{t('classes.belowFifty', 'Below 50%')}</p>
          </div>
        </div>
      )}

      {/* Subjects Table */}
      {subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-default-50/50 rounded-lg border border-dashed border-default-200">
          <BookOpen size={48} className="text-default-300 mb-4" />
          <p className="text-default-500 font-medium">{t('pages.noSubjectsAssignedYet')}</p>
          <Button
            color="primary"
            variant="flat"
            size="sm"
            className="mt-4"
            onPress={() => setAddSubjectModal(true)}
          >
            {t('classes.addFirstSubject', 'Add First Subject')}
          </Button>
        </div>
      ) : (
        <Table
          aria-label={t('aria.tables.subjects')}
          removeWrapper
          radius="none"
          classNames={{
            base: "-mx-6 overflow-visible [&_table]:w-[calc(100%+3rem)] [&_table]:border-spacing-0 [&_table]:select-text",
            thead: "[&>tr]:first:shadow-none [&>tr>th:first-child]:pl-6 [&>tr>th:first-child]:pr-3 [&>tr>th:first-child]:w-12",
            th: "bg-transparent text-default-400 font-medium text-xs uppercase tracking-wider h-12 border-b border-default-200 last:pr-6 hover:bg-default-100 transition-colors cursor-pointer [&_svg]:text-default-300 [&:hover_svg]:text-default-500 [&_svg]:opacity-100 first:hover:bg-transparent first:cursor-default select-none",
            td: "py-0 border-b border-default-200 group-data-[last=true]:border-none last:pr-6 select-text",
            tbody: "[&>tr>td:first-child]:pl-6 [&>tr>td:first-child]:pr-3 [&>tr>td:first-child]:w-12 [&>tr:first-child>td]:pt-0",
            tr: "hover:bg-default-50/50 transition-colors",
          }}
        >
          <TableHeader>
            <TableColumn scope="col">{t('pages.sUBJECT')}</TableColumn>
            <TableColumn scope="col">{t('pages.tEACHER')}</TableColumn>
            <TableColumn scope="col">{t('pages.pROGRESS')}</TableColumn>
            <TableColumn scope="col">{t('pages.cHAPTERS')}</TableColumn>
            <TableColumn align="center" scope="col">{t('pages.aCTIONS')}</TableColumn>
          </TableHeader>
          <TableBody items={subjects}>
            {(subject) => (
              <TableRow key={subject._id || subject.subjectName}>
                <TableCell>
                  <div className="py-4 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${getSubjectColor(subject.subjectName).bg} ${getSubjectColor(subject.subjectName).text}`}>
                      <BookOpen size={16} />
                    </div>
                    <span className="font-semibold text-default-900 select-text">{subject.subjectName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="py-4">
                    {subject.teacherName || subject.teacherId?.name ? (
                      <User
                        name={subject.teacherName || subject.teacherId?.name}
                        description={t('common.teacher', 'Teacher')}
                        avatarProps={{
                          size: "sm",
                          className: "bg-default-100 text-default-500",
                          radius: "md"
                        }}
                      />
                    ) : (
                      <Chip size="sm" color="warning" variant="flat">{t('pages.unassigned1')}</Chip>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="py-4 w-full max-w-[140px]">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-default-500">{t('pages.completed')}</span>
                      <span className="font-medium">{subject.overallProgress || 0}%</span>
                    </div>
                    <Progress
                      size="sm"
                      value={subject.overallProgress || 0}
                      color={getProgressColor(subject.overallProgress)}
                      className="h-1.5"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-small text-default-700">{subject.chapters?.length || 0} {t('classes.chapters', 'Chapters')}</span>
                      {subject.upcomingChapters?.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-default-400 max-w-[180px]">
                          <Clock size={10} />
                          <span className="truncate">{t('classes.next', 'Next')}: {subject.upcomingChapters[0]}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="py-4 flex justify-center">
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      onPress={() => { setSelectedSubject(subject); setEditChapterModal(true); }}
                    >
                      {t('common.manage', 'Manage')}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {/* Add Subject Modal */}
      <Modal isOpen={addSubjectModal} onClose={() => setAddSubjectModal(false)} size="md">
        <ModalContent>
          <ModalHeader>{t('pages.addSubject1')}</ModalHeader>
          <ModalBody className="space-y-4">
            <Input
              label={t('pages.subjectName1')}
              placeholder={t('classes.subjectNamePlaceholder')}
              value={newSubject.subjectName}
              onValueChange={(val) => setNewSubject(prev => ({ ...prev, subjectName: val }))}
              isRequired
              variant="bordered"
            />

            <Select
              label={t('pages.assignTeacher')}
              placeholder={t('pages.selectATeacher')}
              selectedKeys={newSubject.teacherId ? [newSubject.teacherId] : []}
              onSelectionChange={(keys) => setNewSubject(prev => ({ ...prev, teacherId: Array.from(keys)[0] }))}
              variant="bordered"
            >
              {teachers.map(teacher => (
                <SelectItem key={teacher._id} value={teacher._id}>
                  {teacher.name}
                </SelectItem>
              ))}
            </Select>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('pages.assignToStudents')}</label>
              <div className="flex gap-4">
                <Checkbox size="sm"
                  isSelected={newSubject.assignTo === 'all'}
                  onValueChange={(checked) => {
                    if (checked) {
                      setNewSubject(prev => ({ ...prev, assignTo: 'all', selectedStudents: [] }));
                    }
                  }}
                >
                  {t('pages.allStudents', 'All Students')}
                </Checkbox>
                <Checkbox size="sm"
                  isSelected={newSubject.assignTo === 'specific'}
                  onValueChange={(checked) => {
                    if (checked) {
                      setNewSubject(prev => ({ ...prev, assignTo: 'specific' }));
                    }
                  }}
                >
                  {t('pages.specificStudents', 'Specific Students')}
                </Checkbox>
              </div>
              {newSubject.assignTo === 'specific' && (
                <div className="mt-2 max-h-40 overflow-y-auto border border-default-200 rounded-lg p-2 space-y-1">
                  {classStudents.length > 0 ? classStudents.map(student => (
                    <Checkbox
                      key={student._id || student.id}
                      size="sm"
                      isSelected={newSubject.selectedStudents.includes(String(student._id || student.id))}
                      onValueChange={(checked) => {
                        const sid = String(student._id || student.id);
                        setNewSubject(prev => ({
                          ...prev,
                          selectedStudents: checked
                            ? [...prev.selectedStudents, sid]
                            : prev.selectedStudents.filter(s => s !== sid)
                        }));
                      }}
                    >
                      <span className="text-sm">{student.name} {student.rollNo ? `(${student.rollNo})` : ''}</span>
                    </Checkbox>
                  )) : (
                    <p className="text-sm text-default-400 text-center py-2">{t('pages.noStudentsInClass', 'No students in this class')}</p>
                  )}
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => setAddSubjectModal(false)}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              color="primary"
              onPress={handleAddSubject}
              isDisabled={!newSubject.subjectName}
            >
              {t('classes.addSubject', 'Add Subject')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Chapter Progress Modal */}
      <Modal isOpen={editChapterModal} onClose={() => setEditChapterModal(false)} size="lg">
        <ModalContent>
          <ModalHeader>{t('pages.updateChapterProgress')}</ModalHeader>
          <ModalBody>
            {selectedSubject && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedSubject.subjectName}</h3>
                  <p className="text-sm text-default-500">
                    {t('common.teacher', 'Teacher')}: {selectedSubject.teacherName || selectedSubject.teacherId?.name || t('classes.noTeacherAssigned', 'No Teacher Assigned')}
                  </p>
                </div>

                {selectedSubject.chapters && selectedSubject.chapters.length > 0 ? (
                  <div className="space-y-3 max-h-[60vh] overflow-y-auto px-1">
                    {selectedSubject.chapters.map((chapter, idx) => (
                      <Card key={chapter._id || `ch-${chapter.chapterNumber}-${chapter.chapterName}`} className="border-default-200" shadow="none">
                        <CardBody className="space-y-3 p-3">
                          <div className="flex justify-between items-center gap-4">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">Ch {chapter.chapterNumber}: {chapter.chapterName}</p>
                              <Chip
                                size="sm"
                                color={getStatusBadge(chapter.status)}
                                variant="flat"
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
                                value={chapter.progressPercentage}
                                onValueChange={(val) => {
                                  const newChapters = [...selectedSubject.chapters];
                                  newChapters[idx].progressPercentage = parseInt(val) || 0;
                                  setSelectedSubject(prev => ({ ...prev, chapters: newChapters }));
                                }}
                                className="w-20"
                                size="sm"
                                variant="bordered"
                                endContent={<span className="text-default-400 text-xs">%</span>}
                              />
                            </div>
                          </div>
                          <Progress value={chapter.progressPercentage || 0} size="sm" color={getProgressColor(chapter.progressPercentage)} />
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-default-50 rounded-lg">
                    <AlertCircle size={24} className="mx-auto text-default-300 mb-2" />
                    <p className="text-default-500">{t('pages.noChaptersFound')}</p>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => setEditChapterModal(false)}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              color="primary"
              onPress={handleUpdateChapter}
            >
              {t('common.saveChanges', 'Save Changes')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
