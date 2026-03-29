import React, { useState, useEffect } from 'react';
import logger from '../../utils/logger';
import { useNavigate } from 'react-router-dom';
import { classesApi, timetableApi, classesEnhancedApi } from '../../services/api';
import { ChevronLeft, RefreshCw, AlertTriangle, CheckCircle, Save, Clock, Calendar, UserCheck, Wand2, Edit, Settings2 } from 'lucide-react';
import { Select, SelectItem, Button, Switch } from "@heroui/react";
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';
import BulkClassTeacherAssignment from '../../pages/classes/BulkClassTeacherAssignment';
import { useTranslation } from 'react-i18next';

const TimetableWizardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { schoolSettings } = useApp();

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [missingSubjectsClasses, setMissingSubjectsClasses] = useState([]);
  const [classSubjectSelections, setClassSubjectSelections] = useState({});
  const [assigningSubjects, setAssigningSubjects] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [periodRules, setPeriodRules] = useState({
    maxPeriodsPerSubjectPerDay: 1,
    maxPeriodsPerSubjectPerWeek: 5,
    noConsecutiveSame: true,
    preferMorningForCore: false,
  });

  const [activeTab, setActiveTab] = useState("missing-subjects");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesData, timetablesData, missingData] = await Promise.all([
        classesApi.getAll(true),
        timetableApi.getAll(),
        classesEnhancedApi.getMissingSubjects().catch(() => ({ missingSubjects: [] }))
      ]);

      setClasses(classesData);
      setTimetables(timetablesData);

      const missing = missingData.missingSubjects || [];
      if (missing.length > 0) {
        setMissingSubjectsClasses(missing);
        const initialSelections = {};
        missing.forEach(cls => {
          initialSelections[String(cls.classId || cls._id || cls.id)] = new Set();
        });
        setClassSubjectSelections(initialSelections);
        setActiveTab("missing-subjects");
      } else {
        setMissingSubjectsClasses([]);
        setActiveTab("generate");
      }
    } catch (err) {
      logger.error('Error fetching data:', err);
      toast.error('Failed to load timetable wizard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMissingSubjects = async () => {
    try {
      setAssigningSubjects(true);
      const updatesToMake = missingSubjectsClasses.filter(cls => {
        const classIdStr = String(cls.classId || cls._id || cls.id);
        const selectedSet = classSubjectSelections[classIdStr];
        return selectedSet && selectedSet.size > 0;
      });

      if (updatesToMake.length === 0) {
        toast.error("Please assign subjects to at least one class");
        return;
      }

      for (const cls of updatesToMake) {
        const classIdStr = String(cls.classId || cls._id || cls.id);
        const selectedSubjects = Array.from(classSubjectSelections[classIdStr]);
        await classesApi.updateSubjects(classIdStr, selectedSubjects);
      }

      toast.success("Subjects successfully assigned!");
      await fetchData();
      if (missingSubjectsClasses.length === updatesToMake.length) {
        setActiveTab("generate");
      }
    } catch (err) {
      logger.error('Error saving subjects:', err);
      toast.error('Failed to save subjects');
    } finally {
      setAssigningSubjects(false);
    }
  };

  const handleGenerateAll = async () => {
    try {
      setGenerating(true);
      const result = await timetableApi.generateAll({ periodRules });

      if (result.errors > 0) {
        toast.error(`Generated with ${result.errors} errors`);
      } else {
        toast.success(`Generated ${result.generated} timetables successfully`);
      }

      await fetchData();
      setActiveTab("view");
    } catch (err) {
      toast.error('Failed to generate timetables. Ensure subjects and teachers are properly assigned.');
      logger.error('Error generating timetables:', err);
    } finally {
      setGenerating(false);
    }
  };

  const getTimetableForClass = (classId) => {
    return timetables.find(t => t.classId?._id === classId || t.classId === classId);
  };

  const getClassStatus = (cls) => {
    const timetable = getTimetableForClass(cls.id || cls._id);
    if (!timetable) return { status: 'not-created', label: 'Not Created', color: 'text-gray-500 dark:text-zinc-400', bgColor: 'bg-gray-100 dark:bg-zinc-800', icon: AlertTriangle };
    if (!cls.subjects || cls.subjects.length === 0) return { status: 'missing-subjects', label: 'Missing Subjects', color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-950', icon: AlertTriangle };
    return { status: 'created', label: 'Created', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-950', icon: CheckCircle };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-gray-500 dark:text-zinc-400">Loading timetable wizard...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      key: "missing-subjects",
      icon: AlertTriangle,
      label: "1. Missing Subjects",
      desc: t('components.ensureAllClassesHaveTheirSubjectsCorrectlyAssigned'),
      disabled: missingSubjectsClasses.length === 0,
      badge: missingSubjectsClasses.length > 0
        ? { text: `${missingSubjectsClasses.length} Pending`, cls: 'bg-orange-200 dark:bg-orange-900 text-orange-800 dark:text-orange-300' }
        : { text: '✓ All set', cls: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' },
      activeColor: 'border-orange-500 bg-orange-50 dark:bg-orange-950/30',
      activeIcon: 'text-orange-500',
      activeLabel: 'text-orange-800 dark:text-orange-300',
    },
    {
      key: "teachers",
      icon: UserCheck,
      label: "2. Subject & Class Teachers",
      desc: t('components.assignClassTeachersAndVerifySubjectInstructors'),
      disabled: false,
      badge: null,
      activeColor: 'border-primary bg-primary-50 dark:bg-primary/10',
      activeIcon: 'text-primary',
      activeLabel: 'text-primary-800 dark:text-primary-300',
    },
    {
      key: "generate",
      icon: Wand2,
      label: "3. Generate Timetables",
      desc: t('components.automaticallyBuildClashFreeTimetablesForEveryone'),
      disabled: false,
      badge: null,
      activeColor: 'border-primary bg-primary-50 dark:bg-primary/10',
      activeIcon: 'text-primary',
      activeLabel: 'text-primary-800 dark:text-primary-300',
    },
    {
      key: "view",
      icon: Clock,
      label: "4. View & Edit Timetables",
      desc: t('components.reviewManuallyTweakAndExportGeneratedTimetables'),
      disabled: false,
      badge: timetables.length > 0
        ? { text: `${timetables.length} ready`, cls: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' }
        : null,
      activeColor: 'border-primary bg-primary-50 dark:bg-primary/10',
      activeIcon: 'text-primary',
      activeLabel: 'text-primary-800 dark:text-primary-300',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-4">
          <Button
            isIconOnly
            variant="light"
            onPress={() => navigate(-1)}
            className="text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
          >
            <ChevronLeft size={20} />
          </Button>
          <div className="h-6 w-px bg-gray-200 dark:bg-zinc-700" />
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar size={22} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-outfit text-gray-900 dark:text-zinc-100 leading-tight">
                {t('components.masterTimetableWizard')}
              </h1>
              <p className="text-xs text-gray-500 dark:text-zinc-500">
                Configure subjects, assign teachers, and generate timetables for the entire school.
              </p>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="hidden md:flex items-center gap-6">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-zinc-100">{classes.length}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-500">Total Classes</p>
          </div>
          <div className="h-8 w-px bg-gray-200 dark:bg-zinc-700" />
          <div className="text-center">
            <p className="text-lg font-bold text-green-600 dark:text-green-400">{timetables.length}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-500">Created</p>
          </div>
          <div className="h-8 w-px bg-gray-200 dark:bg-zinc-700" />
          <div className="text-center">
            <p className="text-lg font-bold text-orange-500">{classes.length - timetables.length}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-500">Missing</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Left Sidebar */}
        <div className="w-72 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 shrink-0 flex flex-col pt-6 pb-6 px-4 gap-2 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2 px-2">
            {t('components.wizardSteps')}
          </p>

          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => !tab.disabled && setActiveTab(tab.key)}
                disabled={tab.disabled}
                className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-200 border-2 text-left
                  ${isActive ? tab.activeColor : 'border-transparent hover:bg-gray-50 dark:hover:bg-zinc-800'}
                  ${tab.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className={`mt-0.5 shrink-0 ${isActive ? tab.activeIcon : 'text-gray-400 dark:text-zinc-500'}`}>
                  <Icon size={22} />
                </div>
                <div>
                  <h3 className={`font-semibold text-sm ${isActive ? tab.activeLabel : 'text-gray-700 dark:text-zinc-300'}`}>
                    {tab.label}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1 line-clamp-2">{tab.desc}</p>
                  {tab.badge && (
                    <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${tab.badge.cls}`}>
                      {tab.badge.text}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">

          {/* Step 1 — Missing Subjects */}
          {activeTab === "missing-subjects" && (
            <div className="max-w-4xl mx-auto p-8 space-y-6">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-orange-200 dark:border-orange-900 overflow-hidden">
                <div className="bg-orange-50 dark:bg-orange-950/40 border-b border-orange-100 dark:border-orange-900 p-6 flex items-start gap-4">
                  <div className="p-3 bg-white dark:bg-zinc-800 shadow-sm text-orange-500 rounded-full mt-1 shrink-0">
                    <AlertTriangle size={26} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-orange-800 dark:text-orange-300 mb-1">
                      {t('components.missingSubjectAssignments')}
                    </h2>
                    <p className="text-sm text-orange-700 dark:text-orange-400">
                      The following classes do not have subjects assigned. Assign subjects before generating timetables.
                    </p>
                  </div>
                </div>

                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                  {missingSubjectsClasses.map((cls, index) => {
                    const classIdStr = String(cls.classId || cls._id || cls.id);
                    return (
                      <div
                        key={classIdStr || index}
                        className="flex flex-col md:flex-row md:items-center gap-4 p-5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl hover:border-orange-300 dark:hover:border-orange-700 transition-colors"
                      >
                        <div className="flex-shrink-0 w-48">
                          <p className="font-semibold text-gray-900 dark:text-zinc-100 text-lg">
                            {cls.className || `${cls.name}-${cls.section}`}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-zinc-400">{t('components.unassigned')}</p>
                        </div>
                        <div className="flex-1">
                          <Select
                            label={t('components.assignSubjects')}
                            placeholder={t('components.selectMultipleSubjects')}
                            selectionMode="multiple"
                            selectedKeys={classSubjectSelections[classIdStr] || new Set()}
                            onSelectionChange={(keys) =>
                              setClassSubjectSelections(prev => ({
                                ...prev,
                                [classIdStr]: new Set(Array.from(keys))
                              }))
                            }
                            variant="faded"
                            radius="lg"
                            className="w-full"
                          >
                            {(schoolSettings?.subjects || []).map(subject => (
                              <SelectItem key={subject.name} textValue={subject.name}>
                                {subject.name}
                              </SelectItem>
                            ))}
                          </Select>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-6 bg-gray-50 dark:bg-zinc-800/50 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    {missingSubjectsClasses.length} class{missingSubjectsClasses.length !== 1 ? 'es' : ''} need subject assignments
                  </p>
                  <Button
                    color="primary"
                    onPress={handleSaveMissingSubjects}
                    startContent={<Save size={18} />}
                    isLoading={assigningSubjects}
                    className="font-medium px-8"
                    size="lg"
                  >
                    {assigningSubjects ? "Saving..." : "Save Subjects & Continue"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Teachers */}
          {activeTab === "teachers" && (
            <div className="p-8">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 p-8 min-h-[70vh]">
                <BulkClassTeacherAssignment />
              </div>
            </div>
          )}

          {/* Step 3 — Generate */}
          {activeTab === "generate" && (
            <div className="max-w-3xl mx-auto p-8 space-y-6">
              {/* Rules config */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-zinc-800 flex items-center gap-3">
                  <Settings2 size={18} className="text-gray-500 dark:text-zinc-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-zinc-100">Generation Rules</h3>
                  <span className="text-xs bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 px-2 py-0.5 rounded-full ml-auto">
                    Optional
                  </span>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">
                      Max periods per subject / day
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range" min="1" max="4"
                        value={periodRules.maxPeriodsPerSubjectPerDay}
                        onChange={e => setPeriodRules(r => ({ ...r, maxPeriodsPerSubjectPerDay: parseInt(e.target.value) }))}
                        className="flex-1 accent-primary h-1.5 rounded-full"
                      />
                      <span className="w-8 text-center font-bold text-primary text-sm">
                        {periodRules.maxPeriodsPerSubjectPerDay}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 dark:text-zinc-600 mt-1">
                      <span>1</span><span>4</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">
                      Max periods per subject / week
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range" min="1" max="12"
                        value={periodRules.maxPeriodsPerSubjectPerWeek}
                        onChange={e => setPeriodRules(r => ({ ...r, maxPeriodsPerSubjectPerWeek: parseInt(e.target.value) }))}
                        className="flex-1 accent-primary h-1.5 rounded-full"
                      />
                      <span className="w-8 text-center font-bold text-primary text-sm">
                        {periodRules.maxPeriodsPerSubjectPerWeek}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 dark:text-zinc-600 mt-1">
                      <span>1</span><span>12</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">No consecutive same subject</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">Avoid back-to-back periods of the same subject</p>
                    </div>
                    <Switch
                      isSelected={periodRules.noConsecutiveSame}
                      onValueChange={v => setPeriodRules(r => ({ ...r, noConsecutiveSame: v }))}
                      size="sm"
                      color="primary"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">Prefer morning for core subjects</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">Schedule Maths / Science in earlier slots</p>
                    </div>
                    <Switch
                      isSelected={periodRules.preferMorningForCore}
                      onValueChange={v => setPeriodRules(r => ({ ...r, preferMorningForCore: v }))}
                      size="sm"
                      color="primary"
                    />
                  </div>
                </div>
              </div>

              {/* Generate action */}
              <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-200 dark:border-zinc-800 p-12 text-center">
                <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Wand2 size={42} />
                </div>
                <h2 className="text-2xl font-bold font-outfit text-gray-900 dark:text-zinc-100 mb-3">
                  {t('components.autoGenerateTimetables')}
                </h2>
                <p className="text-gray-500 dark:text-zinc-400 mb-2 leading-relaxed max-w-lg mx-auto">
                  Generate clash-free timetables for all{' '}
                  <strong className="text-gray-700 dark:text-zinc-300">{classes.length} classes</strong>{' '}
                  simultaneously based on your subjects and teacher assignments.
                </p>
                {missingSubjectsClasses.length > 0 && (
                  <div className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800 rounded-xl px-4 py-2 text-sm mb-6 mt-2">
                    <AlertTriangle size={16} />
                    <span>
                      {missingSubjectsClasses.length} class{missingSubjectsClasses.length !== 1 ? 'es' : ''} missing subjects will be skipped
                    </span>
                  </div>
                )}
                <div className="mt-6">
                  <Button
                    onPress={handleGenerateAll}
                    isLoading={generating}
                    color="primary"
                    size="lg"
                    className="h-14 px-12 text-base font-semibold shadow-lg shadow-primary/25 w-full md:w-auto"
                    startContent={!generating && <RefreshCw size={20} />}
                  >
                    {generating ? "Generating timetables for all classes..." : `Generate For All ${classes.length} Classes`}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4 — View & Edit */}
          {activeTab === "view" && (
            <div className="max-w-7xl mx-auto p-8 space-y-8">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { value: classes.length, label: t('components.totalClasses'), color: 'text-gray-900 dark:text-zinc-100' },
                  { value: timetables.length, label: t('components.timetablesCreated'), color: 'text-green-600 dark:text-green-400' },
                  { value: classes.length - timetables.length, label: t('components.missingTimetables'), color: 'text-orange-600' },
                  { value: classes.filter(c => !c.subjects || c.subjects.length === 0).length, label: t('components.missingSubjects'), color: 'text-red-500' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6 flex flex-col items-center justify-center text-center">
                    <span className={`text-3xl font-bold mb-1 ${stat.color}`}>{stat.value}</span>
                    <span className="text-sm text-gray-500 dark:text-zinc-400 font-medium">{stat.label}</span>
                  </div>
                ))}
              </div>

              {/* Class cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {classes.map((cls) => {
                  const timetable = getTimetableForClass(cls.id || cls._id);
                  const status = getClassStatus(cls);
                  const StatusIcon = status.icon;

                  return (
                    <div
                      key={cls.id || cls._id}
                      className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 hover:border-primary/50 transition-all hover:shadow-md overflow-hidden flex flex-col"
                    >
                      <div className="p-6 flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                              {cls.name} - {cls.section}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                              {cls.students?.length || 0} students enrolled
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${status.bgColor} ${status.color}`}>
                            <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
                            {status.label}
                          </span>
                        </div>

                        <div className="space-y-3 mb-4 bg-gray-50 dark:bg-zinc-800 rounded-xl p-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 dark:text-zinc-400">{t('components.totalSubjects')}</span>
                            <span className="font-semibold text-gray-900 dark:text-zinc-100">{cls.subjects?.length || 0}</span>
                          </div>
                          {timetable && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500 dark:text-zinc-400">{t('components.periodsPerWeek')}</span>
                              <span className="font-semibold text-gray-900 dark:text-zinc-100">
                                {timetable.periods?.length || 0} base periods
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-zinc-800/50 px-6 py-4 border-t border-gray-100 dark:border-zinc-800">
                        <Button
                          onPress={() => navigate(`/classes/timetable?classId=${cls.id || cls._id}`)}
                          color="primary"
                          variant="flat"
                          className="w-full font-semibold"
                          startContent={<Edit size={16} />}
                        >
                          View / Edit
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimetableWizardPage;
