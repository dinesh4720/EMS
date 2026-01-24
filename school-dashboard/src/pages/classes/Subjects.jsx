import { useState, useEffect } from "react";
import {
  Card, CardBody, CardHeader, Button, Progress, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, Textarea, Select, SelectItem, Checkbox, Spinner, Chip
} from "@heroui/react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BookOpen, Users, MessageSquare, Plus, TrendingUp, AlertCircle, Edit, Trash2, Clock
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function Subjects() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { classesEnhancedApi, staff, classes } = useApp();

  // If no id provided, show message to select a class
  if (!id) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-default-800">Subjects & Teachers</h2>
          <p className="text-default-500 mt-1">Manage subjects, chapter progress, and teacher assignments</p>
        </div>
        <Card className="border-default-200">
          <CardBody className="py-12 text-center">
            <BookOpen size={48} className="mx-auto text-default-300 mb-4" />
            <p className="text-default-500">Please select a class to view its subjects</p>
            <Button
              color="primary"
              variant="flat"
              className="mt-4"
              onPress={() => navigate('/classes')}
            >
              View All Classes
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addSubjectModal, setAddSubjectModal] = useState(false);
  const [editChapterModal, setEditChapterModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);

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
    loadSubjects();
  }, [id]);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const data = await classesEnhancedApi.getSubjects(id);
      setSubjects(data || []);
    } catch (error) {
      console.error('Error loading subjects:', error);
      // Fallback to class subjects if API fails
      const classData = classes.find(c => c.id === id || c._id === id);
      if (classData && classData.subjects) {
        const fallbackSubjects = classData.subjects.map(sub => ({
          subjectName: sub,
          chapters: [],
          overallProgress: 0,
          teacherName: 'Not Assigned'
        }));
        setSubjects(fallbackSubjects);
      }
    } finally {
      setLoading(false);
    }
  };

  // Get teachers for dropdown
  const teachers = staff.filter(s => s.role === 'Teacher' || s.status === 'active');

  // Handle add subject
  const handleAddSubject = async () => {
    try {
      await classesEnhancedApi.addSubject(id, {
        subjectName: newSubject.subjectName,
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
    } catch (error) {
      console.error('Error adding subject:', error);
    }
  };

  // Handle chapter progress update
  const handleUpdateChapter = async () => {
    try {
      await classesEnhancedApi.updateChapter(selectedSubject._id, {
        chapters: selectedSubject.chapters
      });

      setEditChapterModal(false);
      loadSubjects();
    } catch (error) {
      console.error('Error updating chapter:', error);
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
      not_started: 'default',
      in_progress: 'primary',
      completed: 'success'
    };
    return colors[status] || 'default';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-default-800">Subjects & Teachers</h2>
          <p className="text-default-500 mt-1">Manage subjects, chapter progress, and teacher assignments</p>
        </div>
        <Button
          color="primary"
          startContent={<Plus size={16} />}
          onPress={() => setAddSubjectModal(true)}
        >
          Add Subject
        </Button>
      </div>

      {/* Subjects Grid */}
      {subjects.length === 0 ? (
        <Card className="border-default-200">
          <CardBody className="py-12 text-center">
            <BookOpen size={48} className="mx-auto text-default-300 mb-4" />
            <p className="text-default-500">No subjects assigned yet</p>
            <Button
              color="primary"
              variant="flat"
              className="mt-4"
              onPress={() => setAddSubjectModal(true)}
            >
              Add First Subject
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject, index) => (
            <Card key={index} className="border-default-200 hover:border-primary transition-colors">
              <CardHeader className="flex justify-between items-start pb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen size={20} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-default-800">{subject.subjectName}</h3>
                      {subject.teacherName || subject.teacherId?.name ? (
                        <div className="flex items-center gap-2 mt-1">
                          <Users size={12} className="text-default-400" />
                          <span className="text-sm text-default-600">
                            {subject.teacherName || (subject.teacherId?.name)}
                          </span>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            className="ml-auto h-6 w-6 min-w-6"
                            onPress={() => {/* Handle message */}}
                          >
                            <MessageSquare size={12} className="text-default-400" />
                          </Button>
                        </div>
                      ) : (
                        <Chip size="sm" color="warning" variant="flat" className="mt-1">
                          No Teacher Assigned
                        </Chip>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardBody className="pt-0 space-y-4">
                {/* Overall Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-default-600">Overall Progress</span>
                    <span className="font-semibold">{subject.overallProgress || 0}%</span>
                  </div>
                  <Progress
                    value={subject.overallProgress || 0}
                    color={getProgressColor(subject.overallProgress || 0)}
                    size="md"
                    className="w-full"
                  />
                </div>

                {/* Chapters */}
                {subject.chapters && subject.chapters.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-default-700">Chapters</span>
                      <span className="text-xs text-default-500">
                        {subject.chapters.filter(c => c.status === 'completed').length} / {subject.chapters.length} completed
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {subject.chapters.slice(0, 3).map((chapter, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <Chip size="sm" color={getStatusBadge(chapter.status)} variant="flat">
                            {chapter.status === 'not_started' && 'Not Started'}
                            {chapter.status === 'in_progress' && 'In Progress'}
                            {chapter.status === 'completed' && 'Done'}
                          </Chip>
                          <span className="flex-1 truncate">{chapter.chapterName}</span>
                          <span className="text-default-400">{chapter.progressPercentage || 0}%</span>
                        </div>
                      ))}
                      {subject.chapters.length > 3 && (
                        <div className="text-xs text-default-400 text-center pt-1">
                          +{subject.chapters.length - 3} more chapters
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 bg-default-50 rounded-lg">
                    <AlertCircle size={16} className="mx-auto text-default-400 mb-1" />
                    <p className="text-xs text-default-500">No chapters added yet</p>
                  </div>
                )}

                {/* Upcoming Chapter */}
                {subject.upcomingChapters && subject.upcomingChapters.length > 0 && (
                  <div className="bg-default-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-xs text-default-600">
                      <Clock size={12} />
                      <span className="font-medium">Upcoming:</span>
                    </div>
                    <p className="text-sm text-default-700 mt-1 truncate">
                      {subject.upcomingChapters[0]}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    className="flex-1"
                    onPress={() => {
                      setSelectedSubject(subject);
                      setEditChapterModal(true);
                    }}
                  >
                    <Edit size={14} />
                    Edit Progress
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Add Subject Modal */}
      <Modal isOpen={addSubjectModal} onClose={() => setAddSubjectModal(false)} size="md">
        <ModalContent>
          <ModalHeader>Add Subject</ModalHeader>
          <ModalBody className="space-y-4">
            <Input
              label="Subject Name"
              placeholder="e.g., Mathematics"
              value={newSubject.subjectName}
              onValueChange={(val) => setNewSubject(prev => ({ ...prev, subjectName: val }))}
              isRequired
            />

            <Select
              label="Assign Teacher"
              placeholder="Select a teacher"
              selectedKeys={newSubject.teacherId ? [newSubject.teacherId] : []}
              onSelectionChange={(keys) => setNewSubject(prev => ({ ...prev, teacherId: Array.from(keys)[0] }))}
            >
              {teachers.map(teacher => (
                <SelectItem key={teacher._id} value={teacher._id}>
                  {teacher.name}
                </SelectItem>
              ))}
            </Select>

            <div className="space-y-2">
              <label className="text-sm font-medium">Assign to Students</label>
              <div className="flex gap-4">
                <Checkbox
                  isSelected={newSubject.assignTo === 'all'}
                  onValueChange={(checked) => {
                    if (checked) {
                      setNewSubject(prev => ({ ...prev, assignTo: 'all' }));
                    }
                  }}
                >
                  All Students
                </Checkbox>
                <Checkbox
                  isSelected={newSubject.assignTo === 'specific'}
                  onValueChange={(checked) => {
                    if (checked) {
                      setNewSubject(prev => ({ ...prev, assignTo: 'specific' }));
                    }
                  }}
                >
                  Specific Students
                </Checkbox>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => setAddSubjectModal(false)}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleAddSubject}
              isDisabled={!newSubject.subjectName}
            >
              Add Subject
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Chapter Progress Modal */}
      <Modal isOpen={editChapterModal} onClose={() => setEditChapterModal(false)} size="lg">
        <ModalContent>
          <ModalHeader>Update Chapter Progress</ModalHeader>
          <ModalBody>
            {selectedSubject && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedSubject.subjectName}</h3>
                  <p className="text-sm text-default-500">
                    Teacher: {selectedSubject.teacherName || selectedSubject.teacherId?.name || 'No Teacher Assigned'}
                  </p>
                </div>

                {selectedSubject.chapters && selectedSubject.chapters.map((chapter, idx) => (
                  <Card key={idx} className="border-default-200">
                    <CardBody className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Chapter {chapter.chapterNumber}: {chapter.chapterName}</p>
                          <Chip
                            size="sm"
                            color={getStatusBadge(chapter.status)}
                            variant="flat"
                            className="mt-1"
                          >
                            {chapter.status.replace('_', ' ')}
                          </Chip>
                        </div>
                        <div className="text-right">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            label="Progress %"
                            value={chapter.progressPercentage}
                            onValueChange={(val) => {
                              const newChapters = [...selectedSubject.chapters];
                              newChapters[idx].progressPercentage = parseInt(val);
                              setSelectedSubject(prev => ({ ...prev, chapters: newChapters }));
                            }}
                            className="w-24"
                            size="sm"
                          />
                        </div>
                      </div>
                      <Progress value={chapter.progressPercentage || 0} size="sm" />
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => setEditChapterModal(false)}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleUpdateChapter}
            >
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
