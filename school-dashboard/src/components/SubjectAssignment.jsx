import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { classesApi, classesEnhancedApi } from '../services/api';
import { ChevronLeft, Plus, X, Save, AlertTriangle, CheckCircle } from 'lucide-react';

const SubjectAssignment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [newSubject, setNewSubject] = useState('');
  const [editingClassSubjects, setEditingClassSubjects] = useState([]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const missingSubjectsClasses = getMissingSubjectsClasses();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Subject Assignment</h1>
                <p className="text-sm text-gray-500">Assign subjects to classes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <p className="ml-3 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="ml-3 text-sm text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Missing Subjects Warning */}
      {missingSubjectsClasses.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-orange-800">
                  {missingSubjectsClasses.length} class{missingSubjectsClasses.length > 1 ? 'es have' : ' has'} no subjects assigned
                </h3>
                <p className="mt-1 text-sm text-orange-700">
                  Timetables cannot be generated for classes without subjects.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {missingSubjectsClasses.slice(0, 5).map(cls => (
                    <span
                      key={cls._id}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-800"
                    >
                      {cls.name} - {cls.section}
                    </span>
                  ))}
                  {missingSubjectsClasses.length > 5 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-800">
                      +{missingSubjectsClasses.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {classes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No classes found</h3>
            <p className="text-gray-500">Create classes first to assign subjects.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {classes.map((cls) => {
              const isEditing = editingClass === cls._id;
              const hasSubjects = cls.subjects && cls.subjects.length > 0;

              return (
                <div
                  key={cls._id}
                  className={`bg-white rounded-lg shadow transition-all ${
                    isEditing ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {cls.name} - {cls.section}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-500">
                            {cls.students?.length || 0} students
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            hasSubjects
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {hasSubjects ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {cls.subjects.length} subject{cls.subjects.length > 1 ? 's' : ''}
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                No subjects
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                      
                      {!isEditing ? (
                        <button
                          onClick={() => handleStartEdit(cls)}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Manage</span>
                        </button>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={handleCancelEdit}
                            disabled={saving}
                            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                          >
                            <X className="w-4 h-4" />
                            <span>Cancel</span>
                          </button>
                          <button
                            onClick={() => handleSaveSubjects(cls._id)}
                            disabled={saving || editingClassSubjects.length === 0}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            <Save className="w-4 h-4" />
                            <span>{saving ? 'Saving...' : 'Save'}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-4">
                        {/* Add Subject Input */}
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={newSubject}
                            onChange={(e) => setNewSubject(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Add subject (e.g., Mathematics, English)"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={saving}
                          />
                          <button
                            onClick={handleAddSubject}
                            disabled={saving || !newSubject.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Subjects List */}
                        {editingClassSubjects.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {editingClassSubjects.map((subject, idx) => (
                              <div
                                key={idx}
                                className="inline-flex items-center space-x-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md"
                              >
                                <span className="text-sm font-medium">{subject}</span>
                                <button
                                  onClick={() => handleRemoveSubject(subject)}
                                  disabled={saving}
                                  className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No subjects added yet</p>
                        )}

                        {/* Helper Text */}
                        <p className="text-xs text-gray-500">
                          Press Enter or click the + button to add a subject. Click Save to apply changes.
                        </p>
                      </div>
                    ) : (
                      /* Display Subjects */
                      <div className="flex flex-wrap gap-2">
                        {hasSubjects ? (
                          cls.subjects.map((subject, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm font-medium"
                            >
                              {subject}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500 italic">No subjects assigned</span>
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
    </div>
  );
};

export default SubjectAssignment;