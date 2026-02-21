import { useState, useEffect } from "react";
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Card, CardBody, Button, Progress, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, Select, SelectItem, Checkbox, Spinner, Chip, User
} from "@heroui/react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BookOpen, Plus, AlertCircle, Clock
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

  // Get teachers for dropdown - Filter for active staff with Teacher role
  const teachers = staff.filter(s => {
    const roles = Array.isArray(s.role) ? s.role : [s.role];
    return roles.includes('Teacher') && s.status === 'active';
  });

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
      if (!selectedSubject) return;
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
    <div className="w-full flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-background border-b border-default-200 py-4 -mx-6 -mt-6 px-6 mb-4">
        {/* Left Side */}
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-default-800">Subjects & Teachers</h2>
          <Chip size="sm" variant="flat">{subjects.length} Subjects</Chip>
        </div>

        {/* Right Side - Actions */}
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <Button
            size="sm"
            color="primary"
            startContent={<Plus size={16} />}
            onPress={() => setAddSubjectModal(true)}
          >
            Add Subject
          </Button>
        </div>
      </div>

      {/* Subjects Table */}
      {subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-default-50/50 rounded-lg border border-dashed border-default-200">
          <BookOpen size={48} className="text-default-300 mb-4" />
          <p className="text-default-500 font-medium">No subjects assigned yet</p>
          <Button
            color="primary"
            variant="flat"
            size="sm"
            className="mt-4"
            onPress={() => setAddSubjectModal(true)}
          >
            Add First Subject
          </Button>
        </div>
      ) : (
        <Table
          aria-label="Subjects table"
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
            <TableColumn>SUBJECT</TableColumn>
            <TableColumn>TEACHER</TableColumn>
            <TableColumn>PROGRESS</TableColumn>
            <TableColumn>CHAPTERS</TableColumn>
            <TableColumn align="center">ACTIONS</TableColumn>
          </TableHeader>
          <TableBody items={subjects}>
            {(subject) => (
              <TableRow key={subject._id || subject.subjectName}>
                <TableCell>
                  <div className="py-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <BookOpen size={16} />
                    </div>
                    <span className="font-semibold text-default-900">{subject.subjectName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="py-4">
                    {subject.teacherName || subject.teacherId?.name ? (
                      <User
                        name={subject.teacherName || subject.teacherId?.name}
                        description="Teacher"
                        avatarProps={{
                          size: "sm",
                          className: "bg-default-100 text-default-500",
                          radius: "md"
                        }}
                      />
                    ) : (
                      <Chip size="sm" color="warning" variant="flat">Unassigned</Chip>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="py-4 w-full max-w-[140px]">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-default-500">Completed</span>
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
                      <span className="text-small text-default-700">{subject.chapters?.length || 0} Chapters</span>
                      {subject.upcomingChapters?.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-default-400 max-w-[180px]">
                          <Clock size={10} />
                          <span className="truncate">Next: {subject.upcomingChapters[0]}</span>
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
                      Manage
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
          <ModalHeader>Add Subject</ModalHeader>
          <ModalBody className="space-y-4">
            <Input
              label="Subject Name"
              placeholder="e.g., Mathematics"
              value={newSubject.subjectName}
              onValueChange={(val) => setNewSubject(prev => ({ ...prev, subjectName: val }))}
              isRequired
              variant="bordered"
            />

            <Select
              label="Assign Teacher"
              placeholder="Select a teacher"
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

                {selectedSubject.chapters && selectedSubject.chapters.length > 0 ? (
                  <div className="space-y-3 max-h-[60vh] overflow-y-auto px-1">
                    {selectedSubject.chapters.map((chapter, idx) => (
                      <Card key={idx} className="border-default-200" shadow="none">
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
                                {chapter.status?.replace('_', ' ') || 'Not Started'}
                              </Chip>
                            </div>
                            <div className="text-right shrink-0">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                label="Progress"
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
                    <p className="text-default-500">No chapters found</p>
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
