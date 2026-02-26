import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { classesApi, timetableApi, classesEnhancedApi } from '../services/api';
import { ChevronLeft, RefreshCw, AlertTriangle, CheckCircle, Save, BookOpen, Clock, Calendar, Users, X, UserCheck, Wand2, Edit } from 'lucide-react';
import { Modal, ModalContent, Select, SelectItem, Button, Chip, Tabs, Tab } from "@heroui/react";
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import BulkClassTeacherAssignment from '../pages/classes/BulkClassTeacherAssignment';

const TimetableWizardPage = () => {
  const navigate = useNavigate();
  const { schoolSettings } = useApp();

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [missingSubjectsClasses, setMissingSubjectsClasses] = useState([]);
  const [classSubjectSelections, setClassSubjectSelections] = useState({});
  const [assigningSubjects, setAssigningSubjects] = useState(false);
  const [generating, setGenerating] = useState(false);

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
      console.error('Error fetching data:', err);
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
      await fetchData(); // Refetch data will automatically move to next tab if no missing subjects left
      if (missingSubjectsClasses.length === updatesToMake.length) {
        setActiveTab("generate");
      }
    } catch (err) {
      console.error('Error saving subjects:', err);
      toast.error('Failed to save subjects');
    } finally {
      setAssigningSubjects(false);
    }
  };

  const handleGenerateAll = async () => {
    try {
      setGenerating(true);
      const result = await timetableApi.generateAll({});

      if (result.errors > 0) {
        toast.error(`Generated with ${result.errors} errors`);
      } else {
        toast.success(`Generated ${result.generated} timetables successfully`);
      }

      await fetchData();
      setActiveTab("view");
    } catch (err) {
      toast.error('Failed to generate timetables. Ensure subjects and teachers are properly assigned.');
      console.error('Error generating timetables:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleClose = () => {
    navigate(-1);
  };

  const getTimetableForClass = (classId) => {
    return timetables.find(t => t.classId?._id === classId || t.classId === classId);
  };

  const getClassStatus = (cls) => {
    const timetable = getTimetableForClass(cls.id || cls._id);
    if (!timetable) return { status: 'not-created', label: 'Not Created', color: 'text-gray-500', bgColor: 'bg-gray-100', icon: AlertTriangle };
    if (!cls.subjects || cls.subjects.length === 0) return { status: 'missing-subjects', label: 'Missing Subjects', color: 'text-orange-500', bgColor: 'bg-orange-100', icon: AlertTriangle };
    return { status: 'created', label: 'Created', color: 'text-green-500', bgColor: 'bg-green-100', icon: CheckCircle };
  };

  if (loading) {
    return (
      <Modal isOpen={true} size="full" hideCloseButton classNames={{ base: "bg-white m-0 rounded-none", body: "p-0" }}>
        <ModalContent>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal isOpen={true} onClose={handleClose} size="full" hideCloseButton scrollBehavior="inside" classNames={{ base: "bg-gray-50 m-0 rounded-none", wrapper: "overflow-hidden" }}>
      <ModalContent className="h-screen rounded-none m-0 shadow-none border-0 overflow-hidden">

        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar size={24} className="text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-outfit text-gray-900 leading-tight">Master Timetable Wizard</h1>
              <p className="text-sm text-gray-500">Configure subjects, assignments, and generate timetables for the entire school effortlessly.</p>
            </div>
          </div>
          <Button isIconOnly variant="light" onPress={handleClose} size="lg" className="hover:bg-red-50 text-gray-500 hover:text-red-500">
            <X size={24} />
          </Button>
        </div>

        <div className="flex h-[calc(100vh-81px)] w-full relative">

          {/* Left Sidebar Tabs */}
          <div className="w-80 bg-white border-r border-gray-200 shrink-0 flex flex-col pt-6 pb-6 px-4 gap-2 z-10 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Wizard Steps</p>

            <button
              onClick={() => setActiveTab("missing-subjects")}
              disabled={missingSubjectsClasses.length === 0}
              className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-200 border-2 text-left ${activeTab === 'missing-subjects' ? 'border-orange-500 bg-orange-50' : 'border-transparent hover:bg-gray-50'} ${missingSubjectsClasses.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className={`mt-0.5 shrink-0 ${activeTab === 'missing-subjects' ? 'text-orange-500' : 'text-gray-400'}`}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className={`font-semibold text-sm ${activeTab === 'missing-subjects' ? 'text-orange-800' : 'text-gray-700'}`}>1. Missing Subjects</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">Ensure all classes have their subjects correctly assigned.</p>
                {missingSubjectsClasses.length > 0 && <span className="inline-block mt-2 text-[10px] font-bold bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full">{missingSubjectsClasses.length} Pending</span>}
              </div>
            </button>

            <button
              onClick={() => setActiveTab("teachers")}
              className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-200 border-2 text-left ${activeTab === 'teachers' ? 'border-primary bg-primary-50' : 'border-transparent hover:bg-gray-50'}`}
            >
              <div className={`mt-0.5 shrink-0 ${activeTab === 'teachers' ? 'text-primary' : 'text-gray-400'}`}>
                <UserCheck size={24} />
              </div>
              <div>
                <h3 className={`font-semibold text-sm ${activeTab === 'teachers' ? 'text-primary-800' : 'text-gray-700'}`}>2. Subject & Class Teachers</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">Assign class teachers and verify subject instructors.</p>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("generate")}
              className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-200 border-2 text-left ${activeTab === 'generate' ? 'border-primary bg-primary-50' : 'border-transparent hover:bg-gray-50'}`}
            >
              <div className={`mt-0.5 shrink-0 ${activeTab === 'generate' ? 'text-primary' : 'text-gray-400'}`}>
                <Wand2 size={24} />
              </div>
              <div>
                <h3 className={`font-semibold text-sm ${activeTab === 'generate' ? 'text-primary-800' : 'text-gray-700'}`}>3. Generate Timetables</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">Automatically build clash-free timetables for everyone.</p>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("view")}
              className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-200 border-2 text-left ${activeTab === 'view' ? 'border-primary bg-primary-50' : 'border-transparent hover:bg-gray-50'}`}
            >
              <div className={`mt-0.5 shrink-0 ${activeTab === 'view' ? 'text-primary' : 'text-gray-400'}`}>
                <Clock size={24} />
              </div>
              <div>
                <h3 className={`font-semibold text-sm ${activeTab === 'view' ? 'text-primary-800' : 'text-gray-700'}`}>4. View & Edit Timetables</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">Review, manually tweak, and export generated timetables.</p>
              </div>
            </button>
          </div>

          {/* Main Right Content */}
          <div className="flex-1 bg-gray-50 overflow-y-auto">
            {activeTab === "missing-subjects" && (
              <div className="max-w-4xl mx-auto p-8 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-orange-200 overflow-hidden">
                  <div className="bg-orange-50 border-b border-orange-100 p-6 flex items-start gap-4">
                    <div className="p-3 bg-white shadow-sm text-orange-500 rounded-full mt-1 shrink-0">
                      <AlertTriangle size={28} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-orange-800 mb-1">Missing Subject Assignments</h2>
                      <p className="text-sm text-orange-700">The following classes do not have subjects assigned. You must assign subjects before generating timetables.</p>
                    </div>
                  </div>

                  <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {missingSubjectsClasses.map((cls, index) => {
                      const classIdStr = String(cls.classId || cls._id || cls.id);
                      return (
                        <div key={classIdStr || index} className="flex flex-col md:flex-row md:items-center gap-4 p-5 bg-gray-50 border border-gray-200 rounded-xl hover:border-orange-300 transition-colors">
                          <div className="flex-shrink-0 w-48">
                            <p className="font-semibold text-gray-900 text-lg">{cls.className || cls.name + '-' + cls.section}</p>
                            <p className="text-sm text-gray-500">Unassigned</p>
                          </div>
                          <div className="flex-1">
                            <Select
                              label="Assign Subjects"
                              placeholder="Select multiple subjects..."
                              selectionMode="multiple"
                              selectedKeys={classSubjectSelections[classIdStr] || new Set()}
                              onSelectionChange={(keys) => {
                                setClassSubjectSelections(prev => ({
                                  ...prev,
                                  [classIdStr]: new Set(Array.from(keys))
                                }));
                              }}
                              variant="faded"
                              radius="lg"
                              className="w-full bg-white shadow-sm"
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

                  <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
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

            {activeTab === "teachers" && (
              <div className="p-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 h-full min-h-[70vh]">
                  <BulkClassTeacherAssignment />
                </div>
              </div>
            )}

            {activeTab === "generate" && (
              <div className="max-w-4xl mx-auto p-8 flex flex-col items-center justify-center min-h-[70vh]">
                <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-200 text-center max-w-2xl">
                  <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                    <Wand2 size={48} />
                  </div>
                  <h2 className="text-3xl font-bold font-outfit text-gray-900 mb-4">Auto-Generate Timetables</h2>
                  <p className="text-gray-500 text-lg mb-8 leading-relaxed">
                    Let our advanced algorithm generate clash-free timetables for all classes simultaneously based on your subjects and teacher assignments.
                  </p>
                  <Button
                    onPress={handleGenerateAll}
                    isLoading={generating}
                    color="primary"
                    size="lg"
                    className="h-16 px-12 text-lg font-semibold shadow-lg shadow-primary/30 w-full md:w-auto"
                    startContent={!generating && <RefreshCw size={24} />}
                  >
                    {generating ? "Generating school timetable..." : "Generate For All Classes"}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "view" && (
              <div className="max-w-7xl mx-auto p-8 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-bold text-gray-900 mb-1">{classes.length}</span>
                    <span className="text-sm text-gray-500 font-medium">Total Classes</span>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-bold text-success-600 mb-1">{timetables.length}</span>
                    <span className="text-sm text-gray-500 font-medium">Timetables Created</span>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-bold text-orange-600 mb-1">{classes.length - timetables.length}</span>
                    <span className="text-sm text-gray-500 font-medium">Missing Timetables</span>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-bold disabled text-red-600 mb-1">{classes.filter(c => !c.subjects || c.subjects.length === 0).length}</span>
                    <span className="text-sm text-gray-500 font-medium">Missing Subjects</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {classes.map((cls) => {
                    const timetable = getTimetableForClass(cls.id || cls._id);
                    const status = getClassStatus(cls);
                    const StatusIcon = status.icon;

                    return (
                      <div
                        key={cls.id || cls._id}
                        className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-primary/50 transition-all hover:shadow-md overflow-hidden flex flex-col"
                      >
                        <div className="p-6 flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">
                                {cls.name} - {cls.section}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">{cls.students?.length || 0} students enrolled</p>
                            </div>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${status.bgColor} ${status.color}`}>
                              <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
                              {status.label}
                            </span>
                          </div>

                          <div className="space-y-3 mb-6 bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Total Subjects</span>
                              <span className="font-semibold text-gray-900">{cls.subjects?.length || 0}</span>
                            </div>
                            {timetable && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Periods per Week</span>
                                <span className="font-semibold text-gray-900">{timetable.periods?.length || 0} base</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex gap-3">
                          <Button
                            onPress={() => navigate('/classes/timetable')}
                            color="primary"
                            variant="flat"
                            className="flex-1 font-semibold"
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
      </ModalContent>
    </Modal>
  );
};

export default TimetableWizardPage;