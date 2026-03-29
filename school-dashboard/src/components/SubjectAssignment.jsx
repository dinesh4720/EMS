import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { classesApi, settingsApi } from '../services/api';
import { ArrowLeft, Plus, X, Save, AlertTriangle, CheckCircle, BookOpen, Search, Settings, Users, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const SubjectAssignment = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [masterSubjects, setMasterSubjects] = useState([]);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [editingClassSubjects, setEditingClassSubjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [classData, subjectData] = await Promise.all([
        classesApi.getAll(true),
        settingsApi.getSubjects(),
      ]);
      setClasses(classData);
      setMasterSubjects(Array.isArray(subjectData) ? subjectData : []);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get master subjects applicable to a specific class number
  const getSubjectsForClass = (classDoc) => {
    const match = classDoc.name?.match(/\d+/);
    if (!match) return masterSubjects.map((s) => s.name);
    const classNum = parseInt(match[0], 10);
    return masterSubjects
      .filter((s) => !s.assignedClasses?.length || s.assignedClasses.includes(classNum))
      .map((s) => s.name);
  };

  const handleStartEdit = (cls) => {
    setEditingClass(cls._id);
    setEditingClassSubjects([...(cls.subjects || [])]);
  };

  const handleCancelEdit = () => {
    setEditingClass(null);
    setEditingClassSubjects([]);
  };

  const handleToggleSubject = (subjectName) => {
    setEditingClassSubjects((prev) =>
      prev.includes(subjectName) ? prev.filter((s) => s !== subjectName) : [...prev, subjectName]
    );
  };

  const handleSaveSubjects = async (classId) => {
    try {
      setSaving(true);
      setError(null);
      await classesApi.updateSubjects(classId, editingClassSubjects);
      toast.success('Subjects updated');
      await fetchData();
      handleCancelEdit();
    } catch (err) {
      setError('Failed to update subjects. Please try again.');
      console.error('Error updating subjects:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSyncAll = async () => {
    try {
      setSyncing(true);
      const result = await settingsApi.syncSubjectsToClasses();
      toast.success(`Synced subjects to ${result.classesUpdated} classes`);
      await fetchData();
    } catch (err) {
      toast.error('Failed to sync subjects');
      console.error('Error syncing subjects:', err);
    } finally {
      setSyncing(false);
    }
  };

  const getMissingSubjectsClasses = () => {
    return classes.filter((c) => !c.subjects || c.subjects.length === 0);
  };

  const filteredClasses = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return classes.filter(
      (cls) => cls.name?.toLowerCase().includes(q) || cls.section?.toLowerCase().includes(q)
    );
  }, [classes, searchQuery]);

  if (loading) {
    return (
      <div className="w-full flex-1 bg-gray-50 dark:bg-zinc-950 p-6 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-8 h-8 border-2 border-gray-300 dark:border-zinc-600 border-t-gray-600 dark:border-t-zinc-300 rounded-full"></div>
          <p className="text-sm text-gray-500 dark:text-zinc-400">{t('components.loadingClasses1')}</p>
        </div>
      </div>
    );
  }

  const missingSubjectsClasses = getMissingSubjectsClasses();
  const totalClasses = classes.length;
  const classesWithSubjects = classes.filter((c) => c.subjects && c.subjects.length > 0).length;
  const totalSubjects = classes.reduce((sum, c) => sum + (c.subjects?.length || 0), 0);
  const hasMasterSubjects = masterSubjects.length > 0;

  const stats = [
    { label: 'Total Classes', value: totalClasses, icon: Users, subtext: 'registered' },
    { label: 'Configured', value: classesWithSubjects, icon: CheckCircle, subtext: `${totalClasses - classesWithSubjects} pending` },
    { label: 'Total Subjects', value: totalSubjects, icon: BookOpen, subtext: 'across all classes' },
  ];

  return (
    <div className="w-full flex-1 bg-gray-50 dark:bg-zinc-950 p-6 min-h-screen">
      {/* HEADER */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors mb-2"
        >
          <ArrowLeft size={16} />
          <span>{t('components.back')}</span>
        </button>

        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-100 dark:border-zinc-800 p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <BookOpen size={24} className="text-gray-600 dark:text-zinc-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">{t('components.subjectAssignment')}</h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-zinc-400">
                  <span>{totalClasses} Classes</span>
                  <span className="text-gray-300 dark:text-zinc-600">|</span>
                  <span>{masterSubjects.length} Subjects in Directory</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {hasMasterSubjects && (
                <button
                  onClick={handleSyncAll}
                  disabled={syncing}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
                  {syncing ? 'Syncing...' : 'Sync All'}
                </button>
              )}
              <button
                onClick={() => navigate('/settings/academics')}
                className="px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 bg-gray-900 dark:bg-zinc-100 hover:bg-gray-800 dark:hover:bg-zinc-200 rounded-lg transition-colors flex items-center gap-2"
              >
                <Settings size={16} />
                Manage Directory
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Error */}
          {error && (
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-red-200 dark:border-red-900 p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle size={16} className="text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                  <X size={16} className="text-red-400" />
                </button>
              </div>
            </div>
          )}

          {/* Empty master list warning */}
          {!hasMasterSubjects && (
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-orange-200 dark:border-orange-900 overflow-hidden">
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <AlertTriangle size={16} className="text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">No subjects in directory</h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">Set up your subject directory first, then assign subjects to classes.</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/settings/academics')}
                  className="px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 bg-gray-900 dark:bg-zinc-100 hover:bg-gray-800 dark:hover:bg-zinc-200 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus size={14} />
                  Set Up Subjects
                </button>
              </div>
            </div>
          )}

          {/* Warning - Missing Subjects */}
          {hasMasterSubjects && missingSubjectsClasses.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
              <div className="p-5 border-b border-gray-200 dark:border-zinc-700">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                    <AlertTriangle size={16} className="text-gray-600 dark:text-zinc-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('components.attentionRequired')}</h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">
                      {missingSubjectsClasses.length} class{missingSubjectsClasses.length > 1 ? 'es have' : ' has'} no subjects assigned
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-600 dark:text-zinc-400 mb-3">
                  Timetables cannot be generated for classes without subjects. Use "Sync All" to auto-assign from your subject directory.
                </p>
                <div className="flex flex-wrap gap-2">
                  {missingSubjectsClasses.slice(0, 5).map((cls) => (
                    <span key={cls._id} className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded-md">
                      {cls.name} - {cls.section}
                    </span>
                  ))}
                  {missingSubjectsClasses.length > 5 && (
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded-md">
                      +{missingSubjectsClasses.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-100 dark:border-zinc-800 p-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
              <input
                type="text"
                placeholder={t('components.searchClasses')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-gray-400 dark:focus:border-zinc-500"
              />
            </div>
          </div>

          {/* Classes List */}
          {filteredClasses.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                <BookOpen size={20} className="text-gray-400 dark:text-zinc-500" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-2">{t('components.noClassesFound')}</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400">{t('components.createClassesFirstToAssignSubjects')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredClasses.map((cls) => {
                const isEditing = editingClass === cls._id;
                const hasSubjects = cls.subjects && cls.subjects.length > 0;
                const availableSubjects = getSubjectsForClass(cls);

                return (
                  <div
                    key={cls._id}
                    className={`bg-white dark:bg-zinc-900 rounded-lg border transition-all ${
                      isEditing ? 'border-gray-400 dark:border-zinc-500 ring-1 ring-gray-400 dark:ring-zinc-500' : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    {/* Class Header */}
                    <div className="p-5 border-b border-gray-100 dark:border-zinc-800">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                            <span className="text-sm font-semibold text-gray-600 dark:text-zinc-400">
                              {cls.name?.replace('Class ', '')}{cls.section}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">
                              Grade {cls.name} - Section {cls.section}
                            </h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-gray-500 dark:text-zinc-400">
                                {cls.students?.length || 0} students
                              </span>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  hasSubjects
                                    ? 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'
                                    : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                                }`}
                              >
                                {hasSubjects ? (
                                  <>
                                    <CheckCircle size={10} className="mr-1" />
                                    {cls.subjects.length} subject{cls.subjects.length > 1 ? 's' : ''}
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle size={10} className="mr-1" />
                                    No subjects
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        {!isEditing ? (
                          <button
                            onClick={() => handleStartEdit(cls)}
                            disabled={!hasMasterSubjects}
                            className="px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 bg-gray-900 dark:bg-zinc-100 hover:bg-gray-800 dark:hover:bg-zinc-200 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                            <Plus size={14} />
                            Manage
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleCancelEdit}
                              disabled={saving}
                              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                              <X size={14} />
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveSubjects(cls._id)}
                              disabled={saving}
                              className="px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 bg-gray-900 dark:bg-zinc-100 hover:bg-gray-800 dark:hover:bg-zinc-200 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                              <Save size={14} />
                              {saving ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Class Content */}
                    <div className="p-5">
                      {isEditing ? (
                        <div className="space-y-3">
                          <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                            Select subjects from directory
                          </p>
                          {availableSubjects.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {availableSubjects.map((subjectName) => {
                                const isSelected = editingClassSubjects.includes(subjectName);
                                return (
                                  <button
                                    key={subjectName}
                                    onClick={() => handleToggleSubject(subjectName)}
                                    disabled={saving}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                                      isSelected
                                        ? 'bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-gray-900 dark:border-zinc-100'
                                        : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-500'
                                    }`}
                                  >
                                    {isSelected && <CheckCircle size={12} />}
                                    {subjectName}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 dark:text-zinc-500 italic">
                              No subjects available for this class level.{' '}
                              <button onClick={() => navigate('/settings/academics')} className="underline hover:text-gray-600 dark:hover:text-zinc-300">
                                Add subjects in settings
                              </button>
                            </p>
                          )}
                          <p className="text-xs text-gray-400 dark:text-zinc-500">
                            {editingClassSubjects.length} selected &middot; Click to toggle
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {hasSubjects ? (
                            cls.subjects.map((subject) => (
                              <span
                                key={subject}
                                className="inline-flex items-center px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-md text-sm font-medium"
                              >
                                {subject}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-zinc-500 italic">{t('components.noSubjectsAssigned')}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="lg:col-span-1 space-y-4">
          {/* Stats Cards */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-100 dark:border-zinc-800 p-5">
            <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-4">{t('components.overview')}</h3>
            <div className="space-y-4">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                      <stat.icon size={14} className="text-gray-600 dark:text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{stat.value}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">{stat.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-100 dark:border-zinc-800 p-5">
            <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-4">{t('components.configurationProgress')}</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-500 dark:text-zinc-400">{t('components.classesWithSubjects')}</span>
                  <span className="font-medium text-gray-900 dark:text-zinc-100">{Math.round((classesWithSubjects / totalClasses) * 100) || 0}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      classesWithSubjects === totalClasses ? 'bg-gray-800 dark:bg-zinc-300' : 'bg-gray-500 dark:bg-zinc-500'
                    }`}
                    style={{ width: `${(classesWithSubjects / totalClasses) * 100 || 0}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 dark:text-zinc-500">
                {classesWithSubjects} of {totalClasses} classes have subjects assigned
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-100 dark:border-zinc-800 p-5">
            <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-4">{t('components.quickActions')}</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate('/settings/academics')}
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
              >
                <Settings size={18} className="text-gray-600 dark:text-zinc-400" />
                <span className="text-xs text-gray-600 dark:text-zinc-400">Subject Directory</span>
              </button>
              <button
                onClick={() => navigate('/timetable')}
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
              >
                <BookOpen size={18} className="text-gray-600 dark:text-zinc-400" />
                <span className="text-xs text-gray-600 dark:text-zinc-400">{t('components.timetable1')}</span>
              </button>
            </div>
          </div>

          {/* Help Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-100 dark:border-zinc-800 p-5">
            <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-2">{t('components.howItWorks')}</h3>
            <ol className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed space-y-1 list-decimal list-inside">
              <li>Define subjects in <button onClick={() => navigate('/settings/academics')} className="underline">Settings → Academics</button></li>
              <li>Assign classes to each subject (e.g. Math for Class 1-10)</li>
              <li>Click "Sync All" or manage each class individually here</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectAssignment;
