import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { classesApi, timetableApi, classesEnhancedApi } from '../services/api';
import { ChevronLeft, RefreshCw, Edit, Plus, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

const TimetableWizardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [classesData, timetablesData] = await Promise.all([
        classesApi.getAll(true),
        timetableApi.getAll()
      ]);
      
      setClasses(classesData);
      setTimetables(timetablesData);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAll = async () => {
    try {
      setGenerating(true);
      setError(null);
      
      const result = await timetableApi.generateAll({});
      
      setSuccessMessage(`Generated ${result.generated} timetables successfully${result.errors > 0 ? ` with ${result.errors} errors` : ''}`);
      
      if (result.errors > 0) {
        setError(result.errors.map(e => `${e.className}: ${e.error}`).join('\n'));
      }
      
      // Refresh data
      await fetchData();
    } catch (err) {
      setError('Failed to generate timetables. Some classes may be missing subjects.');
      console.error('Error generating timetables:', err);
    } finally {
      setGenerating(false);
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  const handleEditClass = (classId) => {
    navigate(`/classes/${classId}/timetable`);
  };

  const getTimetableForClass = (classId) => {
    return timetables.find(t => t.classId._id === classId || t.classId === classId);
  };

  const getClassStatus = (cls) => {
    const timetable = getTimetableForClass(cls._id);
    
    if (!timetable) {
      return {
        status: 'not-created',
        label: 'Not Created',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        icon: AlertTriangle
      };
    }
    
    if (!cls.subjects || cls.subjects.length === 0) {
      return {
        status: 'missing-subjects',
        label: 'Missing Subjects',
        color: 'text-orange-500',
        bgColor: 'bg-orange-100',
        icon: AlertTriangle
      };
    }
    
    return {
      status: 'created',
      label: 'Created',
      color: 'text-green-500',
      bgColor: 'bg-green-100',
      icon: CheckCircle
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
                <h1 className="text-2xl font-bold text-gray-900">Timetable Wizard</h1>
                <p className="text-sm text-gray-500">Manage timetables for all classes</p>
              </div>
            </div>
            <button
              onClick={handleGenerateAll}
              disabled={generating}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
              <span>{generating ? 'Generating...' : 'Generate All'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Errors occurred</h3>
                <pre className="mt-1 text-sm text-red-700 whitespace-pre-wrap">{error}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="ml-3 text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Total Classes</div>
            <div className="text-2xl font-bold text-gray-900">{classes.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Timetables Created</div>
            <div className="text-2xl font-bold text-green-600">
              {timetables.length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Missing Timetables</div>
            <div className="text-2xl font-bold text-orange-600">
              {classes.length - timetables.length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Missing Subjects</div>
            <div className="text-2xl font-bold text-red-600">
              {classes.filter(c => !c.subjects || c.subjects.length === 0).length}
            </div>
          </div>
        </div>

        {/* Classes Grid */}
        {classes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No classes found</h3>
            <p className="text-gray-500">Create classes first to manage their timetables.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => {
              const timetable = getTimetableForClass(cls._id);
              const status = getClassStatus(cls);
              const StatusIcon = status.icon;

              return (
                <div
                  key={cls._id}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleEditClass(cls._id)}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {cls.name} - {cls.section}
                        </h3>
                        <p className="text-sm text-gray-500">{cls.students?.length || 0} students</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Subjects</span>
                        <span className="font-medium">
                          {cls.subjects?.length || 0}
                        </span>
                      </div>
                      {timetable && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Periods</span>
                          <span className="font-medium">
                            {timetable.periods?.length || 0}
                          </span>
                        </div>
                      )}
                    </div>

                    {cls.subjects && cls.subjects.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {cls.subjects.slice(0, 3).map((subject, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700"
                          >
                            {subject}
                          </span>
                        ))}
                        {cls.subjects.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                            +{cls.subjects.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/academics/subjects/${cls._id}`);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Manage Subjects
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClass(cls._id);
                        }}
                        className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit Timetable</span>
                      </button>
                    </div>
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

export default TimetableWizardPage;