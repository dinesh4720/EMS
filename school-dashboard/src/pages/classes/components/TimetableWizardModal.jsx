import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Input, Select, SelectItem, Chip, Card, CardBody,
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Checkbox, Progress, Badge, Divider, Tooltip
} from "@heroui/react";
import {
  ChevronRight, ChevronLeft, Wand2, BookOpen, Users, Settings,
  RefreshCw, Check, X, AlertCircle, Shuffle, Clock, Calendar,
  Save, Eye, Plus, Trash2
} from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "../../../context/AppContext";
import { usePermissions } from "../../../context/PermissionContext";
import { timetableApi, teacherAssignmentsApi, classesApi } from "../../../services/api";
import { DEFAULT_PERIODS, TIMETABLE_DAYS } from "../../../utils/constants";
import { useTranslation } from 'react-i18next';

const DAYS = TIMETABLE_DAYS;
const DEFAULT_PERIODS_LIST = DEFAULT_PERIODS;

// Subject color mapping
const getSubjectColor = (subject) => {
  const colors = {
    Mathematics: "primary", Science: "success", English: "warning",
    Hindi: "danger", "Social Studies": "secondary", "Computer Science": "secondary",
    Art: "warning", "Physical Education": "danger", Physics: "success",
    Chemistry: "success", Biology: "success"
  };
  return colors[subject] || "default";
};

/**
 * TimetableWizardModal - Multi-step wizard for creating/editing timetables
 *
 * Steps:
 * 1. Class Selection & Setup
 * 2. Configure Subjects
 * 3. Assign Teachers
 * 4. Period Rules
 * 5. Generate & Preview
 */
export default function TimetableWizardModal({
  isOpen,
  onClose,
  classId: initialClassId,
  onSaved
}) {
  const { t } = useTranslation();
  const { classesWithTeachers, staff, schoolSettings, currentAcademicYear, refetch } = useApp();
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission('classes', 'edit');

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Step 1: Class Selection
  const [selectedClassId, setSelectedClassId] = useState(initialClassId || "");

  // Step 2: Subject Configuration
  const [classSubjects, setClassSubjects] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);

  // Step 3: Teacher Assignments
  const [teacherAssignments, setTeacherAssignments] = useState({});
  // { subjectName: [teacherId1, teacherId2] }

  // Step 4: Period Rules
  const [periodRules, setPeriodRules] = useState({
    maxPeriodsPerSubjectPerDay: 1,
    maxPeriodsPerSubjectPerWeek: 5,
    doublePeriodsAllowed: false,
    preferMorningForCore: true,
    excludeBreaksFromRandomization: true,
    firstPeriodMustBe: [], // Subjects that must be in first period
    lastPeriodMustBe: [], // Subjects that must be in last period
    noConsecutiveSame: true,
    distributeEvenly: true,
  });

  // Step 5: Generated Timetable
  const [generatedSchedule, setGeneratedSchedule] = useState(null);
  const [periods, setPeriods] = useState(DEFAULT_PERIODS_LIST);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setGeneratedSchedule(null);

      if (initialClassId) {
        setSelectedClassId(initialClassId);
        loadClassData(initialClassId);
      }
    }
  }, [isOpen, initialClassId]);

  // Load class data when class is selected
  useEffect(() => {
    if (selectedClassId) {
      loadClassData(selectedClassId);
    }
  }, [selectedClassId]);

  const loadClassData = async (classId) => {
    try {
      const cls = classesWithTeachers.find(c => String(c.id) === String(classId));
      if (cls) {
        // Load subjects
        const subjects = cls.subjects || schoolSettings?.subjects?.map(s =>
          typeof s === 'string' ? s : s.name
        ) || [];
        setClassSubjects(subjects);
        setAvailableSubjects(schoolSettings?.subjects?.map(s =>
          typeof s === 'string' ? s : s.name
        ) || []);

        // Load existing timetable if any
        try {
          const existingTimetable = await timetableApi.getByClass(classId, currentAcademicYear);
          if (existingTimetable) {
            setPeriods(existingTimetable.periods || DEFAULT_PERIODS_LIST);
            setGeneratedSchedule(existingTimetable.schedule);
          } else {
            setPeriods(DEFAULT_PERIODS_LIST);
            setGeneratedSchedule(null);
          }
        } catch (err) {
          // No existing timetable
          setPeriods(DEFAULT_PERIODS_LIST);
          setGeneratedSchedule(null);
        }

        // Load teacher assignments for this class
        await loadTeacherAssignments(classId);
      }
    } catch (error) {
      console.error('Error loading class data:', error);
      toast.error(t('toast.error.failedToLoadClassData'));
    }
  };

  const loadTeacherAssignments = async (classId) => {
    try {
      // Get all teachers and their assignments for this class
      const assignments = {};

      for (const teacher of staff) {
        if (teacher.teacherAssignments) {
          for (const assignment of teacher.teacherAssignments) {
            if (assignment.classes?.some(c => String(c._id || c) === String(classId))) {
              if (!assignments[assignment.subject]) {
                assignments[assignment.subject] = [];
              }
              assignments[assignment.subject].push({
                id: String(teacher.id || teacher._id),
                name: teacher.name,
                department: teacher.department
              });
            }
          }
        }
      }

      setTeacherAssignments(assignments);
    } catch (error) {
      console.error('Error loading teacher assignments:', error);
    }
  };

  // Get selected class info
  const selectedClass = useMemo(() => {
    return classesWithTeachers.find(c => String(c.id) === String(selectedClassId));
  }, [selectedClassId, classesWithTeachers]);

  // Get teachers for a subject
  const getTeachersForSubject = useCallback((subject) => {
    // First check if we have loaded assignments
    if (teacherAssignments[subject]) {
      return teacherAssignments[subject];
    }

    // Otherwise, find from staff
    return staff.filter(teacher => {
      if (!teacher.teacherAssignments) return false;
      return teacher.teacherAssignments.some(a =>
        a.subject === subject &&
        a.classes?.some(c => String(c._id || c) === String(selectedClassId))
      );
    }).map(t => ({
      id: String(t.id || t._id),
      name: t.name,
      department: t.department
    }));
  }, [teacherAssignments, staff, selectedClassId]);

  // =====================
  // STEP 2: Subject Management
  // =====================

  const handleAddSubject = (subject) => {
    if (!classSubjects.includes(subject)) {
      setClassSubjects([...classSubjects, subject]);
    }
  };

  const handleRemoveSubject = (subject) => {
    setClassSubjects(classSubjects.filter(s => s !== subject));
    // Also remove teacher assignment
    const newAssignments = { ...teacherAssignments };
    delete newAssignments[subject];
    setTeacherAssignments(newAssignments);
  };

  // =====================
  // STEP 3: Teacher Assignment
  // =====================

  const handleAssignTeacher = (subject, teacherId) => {
    setTeacherAssignments(prev => {
      const current = prev[subject] || [];
      if (current.includes(teacherId)) {
        return {
          ...prev,
          [subject]: current.filter(id => id !== teacherId)
        };
      } else {
        return {
          ...prev,
          [subject]: [...current, teacherId]
        };
      }
    });
  };

  // =====================
  // STEP 4: Period Rules
  // =====================

  const updatePeriodRule = (key, value) => {
    setPeriodRules(prev => ({ ...prev, [key]: value }));
  };

  // =====================
  // STEP 5: Generate Timetable
  // =====================

  const generateTimetable = useCallback(async () => {
    if (!selectedClassId || classSubjects.length === 0) {
      toast.error(t('toast.error.pleaseSelectAClassAndConfigureSubjects'));
      return;
    }

    setIsGenerating(true);

    try {
      // Initialize empty schedule
      const schedule = {};
      DAYS.forEach(day => {
        schedule[day] = periods.map(period => ({
          subject: "",
          teacherId: null,
          room: `Room ${selectedClass?.name?.replace('Class ', '')}-${selectedClass?.section}`
        }));
      });

      // Get non-break periods
      const nonBreakIndices = periods
        .map((p, i) => (!p.isBreak ? i : -1))
        .filter(i => i !== -1);

      // Track subject usage per day and week
      const subjectUsage = {};
      classSubjects.forEach(s => {
        subjectUsage[s] = { perDay: {}, perWeek: 0 };
        DAYS.forEach(d => {
          subjectUsage[s].perDay[d] = 0;
        });
      });

      // Calculate total periods needed and available
      const totalAvailablePeriods = nonBreakIndices.length * DAYS.length;
      const periodsPerSubject = Math.floor(totalAvailablePeriods / classSubjects.length);

      // Build a pool of subject slots to distribute
      const subjectPool = [];
      classSubjects.forEach(subject => {
        // Check if subject has assigned teachers
        const teachers = getTeachersForSubject(subject);
        if (teachers.length === 0) {
          console.warn(`No teachers assigned for ${subject}`);
        }

        for (let i = 0; i < Math.max(1, periodsPerSubject); i++) {
          subjectPool.push(subject);
        }
      });

      // Shuffle the pool
      const shuffleArray = (arr) => {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      // Fill schedule with constraints
      for (const day of DAYS) {
        const pool = shuffleArray(subjectPool);

        for (const periodIdx of nonBreakIndices) {
          // Find a valid subject from pool
          let selectedSubject = null;
          let selectedTeacher = null;

          for (let i = 0; i < pool.length; i++) {
            const subject = pool[i];

            // Check constraints
            const usage = subjectUsage[subject];

            // Max per day
            if (periodRules.maxPeriodsPerSubjectPerDay &&
                usage.perDay[day] >= periodRules.maxPeriodsPerSubjectPerDay) {
              continue;
            }

            // Max per week
            if (periodRules.maxPeriodsPerSubjectPerWeek &&
                usage.perWeek >= periodRules.maxPeriodsPerSubjectPerWeek) {
              continue;
            }

            // No consecutive same subject
            if (periodRules.noConsecutiveSame && periodIdx > 0) {
              const prevPeriod = periodIdx - 1;
              if (!periods[prevPeriod]?.isBreak &&
                  schedule[day][prevPeriod]?.subject === subject) {
                continue;
              }
            }

            // Check first period rule
            if (periodRules.firstPeriodMustBe?.length > 0 && periodIdx === nonBreakIndices[0]) {
              if (!periodRules.firstPeriodMustBe.includes(subject)) {
                // Skip if this subject is not allowed in first period
                continue;
              }
            }

            // Found valid subject
            selectedSubject = subject;
            pool.splice(i, 1);
            break;
          }

          if (selectedSubject) {
            // Get available teacher
            const teachers = getTeachersForSubject(selectedSubject);
            if (teachers.length > 0) {
              // Rotate through teachers
              const teacherIndex = subjectUsage[selectedSubject].perWeek % teachers.length;
              selectedTeacher = teachers[teacherIndex].id;
            }

            schedule[day][periodIdx] = {
              subject: selectedSubject,
              teacherId: selectedTeacher,
              room: `Room ${selectedClass?.name?.replace('Class ', '')}-${selectedClass?.section}`
            };

            // Update usage
            subjectUsage[selectedSubject].perDay[day]++;
            subjectUsage[selectedSubject].perWeek++;
          }
        }
      }

      setGeneratedSchedule(schedule);
      toast.success(t('toast.success.timetableGeneratedSuccessfully'));
    } catch (error) {
      console.error('Error generating timetable:', error);
      toast.error(t('toast.error.failedToGenerateTimetable'));
    } finally {
      setIsGenerating(false);
    }
  }, [selectedClassId, classSubjects, periods, periodRules, getTeachersForSubject, selectedClass]);

  // Save timetable
  const handleSave = async () => {
    if (!generatedSchedule) {
      toast.error(t('toast.error.pleaseGenerateATimetableFirst'));
      return;
    }

    setIsSaving(true);

    try {
      const timetableData = {
        classId: selectedClassId,
        academicYear: currentAcademicYear,
        periods: periods,
        schedule: generatedSchedule
      };

      // Check if timetable exists (handle 404 as "not existing")
      let existing;
      try {
        existing = await timetableApi.getByClass(selectedClassId, currentAcademicYear);
      } catch (err) {
        // 404 means no timetable exists - that's fine, we'll create a new one
        if (err.message && err.message.includes('not found')) {
          existing = null;
        } else {
          throw err; // Re-throw other errors
        }
      }

      if (existing) {
        // Update existing
        await timetableApi.update(selectedClassId, timetableData);
      } else {
        // Create new
        await timetableApi.create(timetableData);
      }

      // Update class subjects
      await classesApi.update(selectedClassId, { subjects: classSubjects });

      toast.success(t('toast.success.timetableSavedSuccessfully'));

      if (refetch) await refetch();
      if (onSaved) onSaved();

      onClose();
    } catch (error) {
      console.error('Error saving timetable:', error);
      toast.error(error.message || 'Failed to save timetable');
    } finally {
      setIsSaving(false);
    }
  };

  // Navigation
  const canGoNext = () => {
    switch (currentStep) {
      case 1: return !!selectedClassId;
      case 2: return classSubjects.length > 0;
      case 3: return true; // Teacher assignments are optional
      case 4: return true;
      case 5: return !!generatedSchedule;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 4) {
      generateTimetable();
    }
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Steps configuration
  const steps = [
    { number: 1, title: "Select Class", icon: Calendar },
    { number: 2, title: "Configure Subjects", icon: BookOpen },
    { number: 3, title: "Assign Teachers", icon: Users },
    { number: 4, title: "Set Rules", icon: Settings },
    { number: 5, title: "Generate & Preview", icon: Wand2 },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="5xl"
      scrollBehavior="inside"
      classNames={{
        backdrop: "bg-black/50 backdrop-blur-sm",
        base: "max-h-[95vh] dark:bg-zinc-950"
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 border-b border-gray-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Wand2 size={24} className="text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{t('pages.timetableWizard')}</h2>
              <p className="text-sm text-gray-500 dark:text-zinc-400">
                Create and configure class timetables with smart generation
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-4 px-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;

              return (
                <div key={step.number} className="flex items-center">
                  <div className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
                    ${isActive ? 'bg-primary-100 text-primary-700' :
                      isCompleted ? 'bg-success-100 text-success-700' :
                      'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400'}
                  `}>
                    <div className={`
                      w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium
                      ${isActive ? 'bg-primary-500 text-white' :
                        isCompleted ? 'bg-success-500 text-white' :
                        'bg-gray-300 dark:bg-zinc-600 text-gray-600 dark:text-zinc-300'}
                    `}>
                      {isCompleted ? <Check size={14} /> : step.number}
                    </div>
                    <span className="text-sm font-medium hidden md:block">{step.title}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight size={20} className="mx-2 text-gray-400 dark:text-zinc-500" />
                  )}
                </div>
              );
            })}
          </div>
        </ModalHeader>

        <ModalBody className="py-6">
          {/* STEP 1: Class Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">{t('pages.selectAClass')}</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">
                  Choose the class for which you want to create or edit the timetable.
                </p>

                <Select
                  label={t('pages.selectClass1')}
                  placeholder={t('pages.chooseAClass')}
                  selectedKeys={selectedClassId ? [selectedClassId] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0];
                    setSelectedClassId(selected || "");
                  }}
                  variant="bordered"
                  size="lg"
                  classNames={{ trigger: "text-base" }}
                >
                  {classesWithTeachers.map(cls => (
                    <SelectItem key={cls.id} textValue={`${cls.name}-${cls.section}`}>
                      <div className="flex items-center justify-between w-full">
                        <span>{cls.name}-{cls.section}</span>
                        {cls.teacher && (
                          <Chip size="sm" variant="flat" color="primary">
                            {cls.teacher}
                          </Chip>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {selectedClass && (
                <Card className="bg-gray-50 dark:bg-zinc-900">
                  <CardBody className="p-4">
                    <h4 className="font-medium mb-3">{t('pages.classInformation')}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.class1')}</p>
                        <p className="font-medium">{selectedClass.name}-{selectedClass.section}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.classTeacher2')}</p>
                        <p className="font-medium">{selectedClass.teacher || 'Not assigned'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.currentSubjects')}</p>
                        <p className="font-medium">{selectedClass.subjects?.length || 0} subjects</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.academicYear1')}</p>
                        <p className="font-medium">{currentAcademicYear}</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          )}

          {/* STEP 2: Subject Configuration */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">{t('pages.configureSubjects')}</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">
                  Add or remove subjects for this class. These subjects will be used in the timetable.
                </p>
              </div>

              {/* Add Subject */}
              <div className="flex gap-2">
                <Select
                  placeholder={t('pages.addASubject')}
                  className="flex-1"
                  variant="bordered"
                  onSelectionChange={(keys) => {
                    const subject = Array.from(keys)[0];
                    if (subject && !classSubjects.includes(subject)) {
                      handleAddSubject(subject);
                    }
                  }}
                >
                  {(availableSubjects.length > 0 ? availableSubjects : [
                    "English", "Hindi", "Mathematics", "Science", "Social Studies",
                    "Computer Science", "Physical Education", "Art", "Music"
                  ]).filter(s => !classSubjects.includes(s)).map(subject => (
                    <SelectItem key={subject}>{subject}</SelectItem>
                  ))}
                </Select>
              </div>

              {/* Current Subjects */}
              <div>
                <h4 className="font-medium mb-3">Selected Subjects ({classSubjects.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {classSubjects.map(subject => (
                    <Chip
                      key={subject}
                      color={getSubjectColor(subject)}
                      variant="flat"
                      onClose={() => handleRemoveSubject(subject)}
                      className="py-2 px-3"
                    >
                      {subject}
                    </Chip>
                  ))}
                  {classSubjects.length === 0 && (
                    <p className="text-sm text-gray-400 dark:text-zinc-500 italic">{t('pages.noSubjectsSelected')}</p>
                  )}
                </div>
              </div>

              {/* Quick Add Common Subjects */}
              <div>
                <h4 className="font-medium mb-3">{t('pages.quickAdd')}</h4>
                <div className="flex flex-wrap gap-2">
                  {["English", "Hindi", "Mathematics", "Science", "Social Studies", "Computer Science", "Physical Education"].map(subject => (
                    <Button
                      key={subject}
                      size="sm"
                      variant={classSubjects.includes(subject) ? "solid" : "bordered"}
                      color={classSubjects.includes(subject) ? "success" : "default"}
                      onPress={() => {
                        if (classSubjects.includes(subject)) {
                          handleRemoveSubject(subject);
                        } else {
                          handleAddSubject(subject);
                        }
                      }}
                    >
                      {classSubjects.includes(subject) ? <Check size={14} className="mr-1" /> : <Plus size={14} className="mr-1" />}
                      {subject}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Teacher Assignments */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">{t('pages.assignTeachersToSubjects')}</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">
                  Select which teachers can teach each subject for this class.
                  Teachers must already have subject assignments configured.
                </p>
              </div>

              <div className="space-y-4">
                {classSubjects.map(subject => {
                  const assignedTeachers = teacherAssignments[subject] || [];
                  const availableTeachersForSubject = getTeachersForSubject(subject);

                  return (
                    <Card key={subject} className="shadow-sm">
                      <CardBody className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <BookOpen size={18} className="text-gray-500 dark:text-zinc-400" />
                            <span className="font-medium">{subject}</span>
                            <Chip size="sm" variant="flat" color={getSubjectColor(subject)}>
                              {assignedTeachers.length} teacher(s)
                            </Chip>
                          </div>
                        </div>

                        {availableTeachersForSubject.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {availableTeachersForSubject.map(teacher => (
                              <Chip
                                key={teacher.id}
                                variant={assignedTeachers.some(t => t.id === teacher.id) ? "solid" : "bordered"}
                                color={assignedTeachers.some(t => t.id === teacher.id) ? "primary" : "default"}
                                className="cursor-pointer"
                                onClick={() => handleAssignTeacher(subject, teacher.id)}
                              >
                                {teacher.name}
                                {teacher.department && ` (${teacher.department})`}
                              </Chip>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 flex items-center gap-2">
                            <AlertCircle size={16} className="text-warning-600" />
                            <p className="text-sm text-warning-700">
                              No teachers assigned for this subject. Add teachers via Staff &gt; Subjects or continue without assigned teachers.
                            </p>
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Period Rules */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">{t('pages.setPeriodRules')}</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">
                  Configure constraints for timetable generation. These rules will be applied when generating the schedule.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Rules */}
                <Card className="shadow-sm">
                  <CardBody className="p-4 space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Settings size={18} className="text-gray-500 dark:text-zinc-400" />
                      Basic Rules
                    </h4>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{t('pages.maxPeriodsPerSubjectPerDay')}</p>
                          <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.limitHowManyTimesASubjectCanAppearInOneDay')}</p>
                        </div>
                        <Select
                          size="sm"
                          className="w-24"
                          selectedKeys={[String(periodRules.maxPeriodsPerSubjectPerDay)]}
                          onSelectionChange={(keys) => updatePeriodRule('maxPeriodsPerSubjectPerDay', parseInt(Array.from(keys)[0]))}
                        >
                          {[1, 2, 3, 4].map(n => (
                            <SelectItem key={n}>{n}</SelectItem>
                          ))}
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{t('pages.maxPeriodsPerSubjectPerWeek')}</p>
                          <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.totalLimitAcrossAllDays')}</p>
                        </div>
                        <Select
                          size="sm"
                          className="w-24"
                          selectedKeys={[String(periodRules.maxPeriodsPerSubjectPerWeek)]}
                          onSelectionChange={(keys) => updatePeriodRule('maxPeriodsPerSubjectPerWeek', parseInt(Array.from(keys)[0]))}
                        >
                          {[3, 4, 5, 6, 7, 8, 10].map(n => (
                            <SelectItem key={n}>{n}</SelectItem>
                          ))}
                        </Select>
                      </div>

                      <Divider />

                      <Checkbox size="sm"
                        isSelected={periodRules.noConsecutiveSame}
                        onValueChange={(v) => updatePeriodRule('noConsecutiveSame', v)}
                      >
                        No consecutive same subject
                      </Checkbox>

                      <Checkbox size="sm"
                        isSelected={periodRules.distributeEvenly}
                        onValueChange={(v) => updatePeriodRule('distributeEvenly', v)}
                      >
                        Distribute subjects evenly across days
                      </Checkbox>
                    </div>
                  </CardBody>
                </Card>

                {/* Advanced Rules */}
                <Card className="shadow-sm">
                  <CardBody className="p-4 space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Clock size={18} className="text-gray-500 dark:text-zinc-400" />
                      Advanced Rules
                    </h4>

                    <div className="space-y-3">
                      <Checkbox size="sm"
                        isSelected={periodRules.doublePeriodsAllowed}
                        onValueChange={(v) => updatePeriodRule('doublePeriodsAllowed', v)}
                      >
                        Allow double periods (2 consecutive periods)
                      </Checkbox>

                      <Checkbox size="sm"
                        isSelected={periodRules.preferMorningForCore}
                        onValueChange={(v) => updatePeriodRule('preferMorningForCore', v)}
                      >
                        Prefer morning slots for core subjects
                      </Checkbox>

                      <Checkbox size="sm"
                        isSelected={periodRules.excludeBreaksFromRandomization}
                        onValueChange={(v) => updatePeriodRule('excludeBreaksFromRandomization', v)}
                        defaultSelected
                      >
                        Keep breaks fixed (don't randomize)
                      </Checkbox>

                      <Divider />

                      <div>
                        <p className="text-sm font-medium mb-2">{t('pages.firstPeriodMustBe')}</p>
                        <Select
                          placeholder={t('pages.selectSubjects')}
                          selectionMode="multiple"
                          selectedKeys={new Set(periodRules.firstPeriodMustBe)}
                          onSelectionChange={(keys) => updatePeriodRule('firstPeriodMustBe', Array.from(keys))}
                          size="sm"
                          variant="bordered"
                        >
                          {classSubjects.map(s => (
                            <SelectItem key={s}>{s}</SelectItem>
                          ))}
                        </Select>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">{t('pages.subjectsThatShouldBeScheduledInTheFirstPeriod')}</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* Period Configuration */}
              <Card className="shadow-sm">
                <CardBody className="p-4">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <Calendar size={18} className="text-gray-500 dark:text-zinc-400" />
                    Period Configuration ({periods.length} periods)
                  </h4>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3">#</th>
                          <th className="text-left py-2 px-3">{t('pages.name1')}</th>
                          <th className="text-left py-2 px-3">{t('pages.start')}</th>
                          <th className="text-left py-2 px-3">{t('pages.end')}</th>
                          <th className="text-left py-2 px-3">{t('pages.type1')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {periods.map((period, idx) => (
                          <tr key={`period-config-${idx}`} className={`border-b ${period.isBreak ? 'bg-gray-50 dark:bg-zinc-900' : ''}`}>
                            <td className="py-2 px-3">{idx + 1}</td>
                            <td className="py-2 px-3">{period.name}</td>
                            <td className="py-2 px-3">{period.startTime}</td>
                            <td className="py-2 px-3">{period.endTime}</td>
                            <td className="py-2 px-3">
                              <Chip size="sm" color={period.isBreak ? "warning" : "success"} variant="flat">
                                {period.isBreak ? 'Break' : 'Class'}
                              </Chip>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

          {/* STEP 5: Generate & Preview */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium mb-2">{t('pages.generatedTimetable')}</h3>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    Preview the generated timetable. Click "Regenerate" to create a new arrangement.
                  </p>
                </div>
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<Shuffle size={16} />}
                  onPress={generateTimetable}
                  isLoading={isGenerating}
                >
                  Regenerate
                </Button>
              </div>

              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin h-8 w-8 rounded-full border-2 border-gray-300 border-t-gray-900" />
                  <p className="mt-4 text-gray-500 dark:text-zinc-400">{t('pages.generatingTimetable')}</p>
                </div>
              ) : generatedSchedule ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-zinc-800">
                        <th className="border p-2 text-left min-w-[100px]">{t('pages.period2')}</th>
                        {DAYS.map(day => (
                          <th key={day} className="border p-2 text-center min-w-[120px]">{day}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {periods.map((period, periodIdx) => (
                        <tr key={`preview-${period.name}-${periodIdx}`} className={period.isBreak ? 'bg-warning-50' : ''}>
                          <td className="border p-2 font-medium">
                            <div>
                              <p>{period.name}</p>
                              <p className="text-xs text-gray-500 dark:text-zinc-400">{period.startTime}-{period.endTime}</p>
                            </div>
                          </td>
                          {DAYS.map(day => {
                            const slot = generatedSchedule[day]?.[periodIdx];
                            return (
                              <td key={day} className="border p-1 text-center">
                                {period.isBreak ? (
                                  <span className="text-warning-600 text-xs">{t('pages.break')}</span>
                                ) : slot?.subject ? (
                                  <div className={`
                                    p-2 rounded text-xs
                                    ${getSubjectColor(slot.subject) === 'primary' ? 'bg-primary-50 text-primary-700' :
                                      getSubjectColor(slot.subject) === 'success' ? 'bg-success-50 text-success-700' :
                                      getSubjectColor(slot.subject) === 'warning' ? 'bg-warning-50 text-warning-700' :
                                      getSubjectColor(slot.subject) === 'danger' ? 'bg-danger-50 text-danger-700' :
                                      getSubjectColor(slot.subject) === 'secondary' ? 'bg-secondary-50 text-secondary-700' :
                                      'bg-gray-50 dark:bg-zinc-900 text-gray-700 dark:text-zinc-300'}
                                  `}>
                                    <p className="font-medium">{slot.subject}</p>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 dark:text-zinc-500 text-xs">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <AlertCircle size={48} className="text-gray-300 dark:text-zinc-600 mb-4" />
                  <p className="text-gray-500 dark:text-zinc-400 mb-4">{t('pages.noTimetableGeneratedYet')}</p>
                  <Button
                    color="primary"
                    startContent={<Wand2 size={16} />}
                    onPress={generateTimetable}
                  >
                    Generate Timetable
                  </Button>
                </div>
              )}

              {/* Summary Stats */}
              {generatedSchedule && (
                <Card className="bg-gray-50 dark:bg-zinc-900">
                  <CardBody className="p-4">
                    <h4 className="font-medium mb-3">{t('pages.scheduleSummary')}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">Total Periods/Week</p>
                        <p className="text-lg font-semibold">
                          {periods.filter(p => !p.isBreak).length * DAYS.length}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.subjects1')}</p>
                        <p className="text-lg font-semibold">{classSubjects.length}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.workingDays')}</p>
                        <p className="text-lg font-semibold">{DAYS.length}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">Breaks/Day</p>
                        <p className="text-lg font-semibold">
                          {periods.filter(p => p.isBreak).length}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          )}
        </ModalBody>

        <ModalFooter className="border-t border-gray-200 dark:border-zinc-800">
          <div className="flex items-center justify-between w-full">
            <Button
              variant="light"
              onPress={onClose}
            >
              Cancel
            </Button>

            <div className="flex items-center gap-2">
              {currentStep > 1 && (
                <Button
                  variant="flat"
                  onPress={handleBack}
                  startContent={<ChevronLeft size={16} />}
                >
                  Back
                </Button>
              )}

              {currentStep < 5 ? (
                <Button
                  color="primary"
                  onPress={handleNext}
                  isDisabled={!canGoNext()}
                  endContent={<ChevronRight size={16} />}
                >
                  Next
                </Button>
              ) : (
                <Button
                  color="success"
                  onPress={handleSave}
                  isLoading={isSaving}
                  isDisabled={!generatedSchedule}
                  startContent={!isSaving && <Save size={16} />}
                >
                  Save Timetable
                </Button>
              )}
            </div>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
