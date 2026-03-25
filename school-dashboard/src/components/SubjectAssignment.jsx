import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { classesApi } from '../services/api';
import { ArrowLeft, Plus, X, Save, AlertTriangle, CheckCircle, BookOpen, Search, Settings, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SubjectAssignment = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [newSubject, setNewSubject] = useState('');
  const [editingClassSubjects, setEditingClassSubjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await classesApi.getAll(true);
      setClasses(data);
    } catch (err) {
      setError('Failed to load classes. Please try again.');
      console.error('Error fetching classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (cls) => {
    setEditingClass(cls._id);
    setEditingClassSubjects([...(cls.subjects || [])]);
    setNewSubject('');
  };

  const handleCancelEdit = () => {
    setEditingClass(null);
    setEditingClassSubjects([]);
    setNewSubject('');
  };

  const handleAddSubject = () => {
    if (newSubject.trim() && !editingClassSubjects.includes(newSubject.trim())) {
      setEditingClassSubjects([...editingClassSubjects, newSubject.trim()]);
      setNewSubject('');
    }
  };

  const handleRemoveSubject = (subject) => {
    setEditingClassSubjects(editingClassSubjects.filter(s => s !== subject));
  };

  const handleSaveSubjects = async (classId) => {
    try {
      setSaving(true);
      setError(null);

      await classesApi.updateSubjects(classId, editingClassSubjects);

      setSuccessMessage('Subjects updated successfully');

      // Refresh classes
      await fetchClasses();

      handleCancelEdit();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to update subjects. Please try again.');
      console.error('Error updating subjects:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubject();
    }
  };

  const getMissingSubjectsClasses = () => {
    return classes.filter(c => !c.subjects || c.subjects.length === 0);
  };

  // Filter classes based on search
  const filteredClasses = classes.filter(cls => {
    const searchLower = searchQuery.toLowerCase();
    return (
      cls.name?.toLowerCase().includes(searchLower) ||
      cls.section?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="w-full flex-1 bg-gray-50 p-6 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
          <p className="text-sm text-gray-500">{t('components.loadingClasses1')}</p>
        </div>
      </div>
    );
  }

  const missingSubjectsClasses = getMissingSubjectsClasses();

  // Calculate stats
  const totalClasses = classes.length;
  const classesWithSubjects = classes.filter(c => c.subjects && c.subjects.length > 0).length;
  const totalSubjects = classes.reduce((sum, c) => sum + (c.subjects?.length || 0), 0);

  const stats = [
    { label: "Total Classes", value: totalClasses, icon: Users, subtext: "registered" },
    { label: "Configured", value: classesWithSubjects, icon: CheckCircle, subtext: `${totalClasses - classesWithSubjects} pending` },
    { label: "Total Subjects", value: totalSubjects, icon: BookOpen, subtext: "across all classes" },
  ];

  return (
    <div className="w-full flex-1 bg-gray-50 p-6 min-h-screen">
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2"
        >
          <ArrowLeft size={16} />
          <span>{t('components.back')}</span>
        </button>

        <div className="bg-white rounded-lg border border-gray-100 p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                <BookOpen size={24} className="text-gray-600" />
              </div>

              {/* Info */}
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{t('components.subjectAssignment')}</h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span>{totalClasses} Classes</span>
                  <span className="text-gray-300">|</span>
                  <span>{totalSubjects} Subjects</span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                  <Settings size={12} />
                  <span>{t('components.configureSubjectsForEachClass')}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => navigate('/classes/new')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                Add Class
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          CONTENT AREA
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* MAIN CONTENT - 2/3 */}
        <div className="lg:col-span-2 space-y-4">

          {/* Error Message */}
          {error && (
            <div className="bg-white rounded-lg border border-red-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={16} className="text-red-600" />
                </div>
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto p-1 hover:bg-red-50 rounded"
                >
                  <X size={16} className="text-red-400" />
                </button>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={16} className="text-gray-600" />
                </div>
                <p className="text-sm text-gray-700">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Warning - Missing Subjects */}
          {missingSubjectsClasses.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                    <AlertTriangle size={16} className="text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">{t('components.attentionRequired')}</h3>
                    <p className="text-xs text-gray-500">
                      {missingSubjectsClasses.length} class{missingSubjectsClasses.length > 1 ? 'es have' : ' has'} no subjects assigned
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-600 mb-3">
                  Timetables cannot be generated for classes without subjects.
                </p>
                <div className="flex flex-wrap gap-2">
                  {missingSubjectsClasses.slice(0, 5).map(cls => (
                    <span
                      key={cls._id}
                      className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-md"
                    >
                      {cls.name} - {cls.section}
                    </span>
                  ))}
                  {missingSubjectsClasses.length > 5 && (
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-md">
                      +{missingSubjectsClasses.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('components.searchClasses')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
              />
            </div>
          </div>

          {/* Classes List */}
          {filteredClasses.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <BookOpen size={20} className="text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">{t('components.noClassesFound')}</h3>
              <p className="text-sm text-gray-500">{t('components.createClassesFirstToAssignSubjects')}</p>
              <button
                onClick={() => navigate('/classes/new')}
                className="mt-4 px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
              >
                Add Class
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredClasses.map((cls) => {
                const isEditing = editingClass === cls._id;
                const hasSubjects = cls.subjects && cls.subjects.length > 0;

                return (
                  <div
                    key={cls._id}
                    className={`bg-white rounded-lg border transition-all ${
                      isEditing ? 'border-gray-400 ring-1 ring-gray-400' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Class Header */}
                    <div className="p-5 border-b border-gray-100">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                            <span className="text-sm font-semibold text-gray-600">
                              {cls.name?.replace("Class ", "")}{cls.section}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-gray-900">
                              Grade {cls.name} - Section {cls.section}
                            </h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-gray-500">
                                {cls.students?.length || 0} students
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                hasSubjects
                                  ? 'bg-gray-100 text-gray-600'
                                  : 'bg-orange-50 text-orange-600'
                              }`}>
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
                            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
                          >
                            <Plus size={14} />
                            Manage
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleCancelEdit}
                              disabled={saving}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                              <X size={14} />
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveSubjects(cls._id)}
                              disabled={saving || editingClassSubjects.length === 0}
                              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
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
                        <div className="space-y-4">
                          {/* Add Subject Input */}
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={newSubject}
                              onChange={(e) => setNewSubject(e.target.value)}
                              onKeyPress={handleKeyPress}
                              placeholder={t('components.addSubjectEGMathematicsEnglish')}
                              className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
                              disabled={saving}
                            />
                            <button
                              onClick={handleAddSubject}
                              disabled={saving || !newSubject.trim()}
                              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                          {/* Subjects List */}
                          {editingClassSubjects.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {editingClassSubjects.map((subject, idx) => (
                                <div
                                  key={subject}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md"
                                >
                                  <span className="text-sm font-medium">{subject}</span>
                                  <button
                                    onClick={() => handleRemoveSubject(subject)}
                                    disabled={saving}
                                    className="hover:bg-gray-200 rounded-full p-0.5 transition-colors"
                                  >
                                    <X size={14} className="text-gray-500" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 italic">{t('components.noSubjectsAddedYet')}</p>
                          )}

                          {/* Helper Text */}
                          <p className="text-xs text-gray-400">
                            Press Enter or click the + button to add a subject. Click Save to apply changes.
                          </p>
                        </div>
                      ) : (
                        /* Display Subjects */
                        <div className="flex flex-wrap gap-2">
                          {hasSubjects ? (
                            cls.subjects.map((subject, idx) => (
                              <span
                                key={subject}
                                className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium"
                              >
                                {subject}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400 italic">{t('components.noSubjectsAssigned')}</span>
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

        {/* RIGHT SIDEBAR - 1/3 */}
        <div className="lg:col-span-1 space-y-4">

          {/* Stats Cards */}
          <div className="bg-white rounded-lg border border-gray-100 p-5">
            <h3 className="text-sm font-medium text-gray-900 mb-4">{t('components.overview')}</h3>
            <div className="space-y-4">
              {stats.map((stat, i) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <stat.icon size={14} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-500">{stat.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white rounded-lg border border-gray-100 p-5">
            <h3 className="text-sm font-medium text-gray-900 mb-4">{t('components.configurationProgress')}</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-500">{t('components.classesWithSubjects')}</span>
                  <span className="font-medium text-gray-900">{Math.round((classesWithSubjects / totalClasses) * 100) || 0}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      classesWithSubjects === totalClasses ? 'bg-gray-800' : 'bg-gray-500'
                    }`}
                    style={{ width: `${(classesWithSubjects / totalClasses) * 100 || 0}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400">
                {classesWithSubjects} of {totalClasses} classes have subjects assigned
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-100 p-5">
            <h3 className="text-sm font-medium text-gray-900 mb-4">{t('components.quickActions')}</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate('/classes')}
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <Users size={18} className="text-gray-600" />
                <span className="text-xs text-gray-600">{t('components.classes1')}</span>
              </button>
              <button
                onClick={() => navigate('/timetable')}
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <BookOpen size={18} className="text-gray-600" />
                <span className="text-xs text-gray-600">{t('components.timetable1')}</span>
              </button>
            </div>
          </div>

          {/* Help Card */}
          <div className="bg-white rounded-lg border border-gray-100 p-5">
            <h3 className="text-sm font-medium text-gray-900 mb-2">{t('components.howItWorks')}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Assign subjects to each class to enable timetable generation. Click "Manage" on a class to add or remove subjects.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectAssignment;
