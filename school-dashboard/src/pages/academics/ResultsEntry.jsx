import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  Chip,
  Spinner,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Select,
  SelectItem,
  Input
} from '@heroui/react';
import { FileText, Users, ArrowLeft, Save, AlertCircle, Award, CheckCircle2, Search } from 'lucide-react';
import { examsApi, resultsApi, classesApi } from '../../services/api';
import { MinimalButton } from '../../components/ui';
import toast from 'react-hot-toast';

// Simple cache for exam data
const examCache = new Map();
const CACHE_DURATION = 60000; // 1 minute

const ResultsEntry = ({ standalone = false }) => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(examId ? new Set([examId]) : new Set([]));
  const [exam, setExam] = useState(null);
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(!standalone);
  const [loadingExams, setLoadingExams] = useState(standalone);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // For standalone mode, fetch all exams first
  useEffect(() => {
    if (standalone) {
      fetchExamsList();
    } else if (examId) {
      fetchExamAndStudents(examId);
    }
  }, [standalone, examId]);

  // Update when exam selection changes in standalone mode
  useEffect(() => {
    if (standalone && selectedExamId.size > 0) {
      const id = Array.from(selectedExamId)[0];
      fetchExamAndStudents(id);
    }
  }, [selectedExamId, standalone]);

  const fetchExamsList = async () => {
    setLoadingExams(true);
    try {
      const data = await examsApi.getAll();
      setExams(data || []);
      // Auto-select first exam if available
      if (data && data.length > 0) {
        setSelectedExamId(new Set([data[0].id || data[0]._id]));
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.error('Failed to load exams');
    } finally {
      setLoadingExams(false);
    }
  };

  const fetchExamAndStudents = async (id) => {
    setLoadingStudents(true);
    try {
      // Check cache first
      const cacheKey = `exam-${id}`;
      const cached = examCache.get(cacheKey);
      let examData;

      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        examData = cached.data;
      } else {
        examData = await examsApi.getById(id);
        examCache.set(cacheKey, { data: examData, timestamp: Date.now() });
      }

      setExam(examData);

      // Fetch students and results in parallel once we have classId
      if (examData?.classId) {
        const [studentsData, existingResults] = await Promise.all([
          classesApi.getStudents(examData.classId),
          resultsApi.getByClassExam(examData.classId, id)
        ]);

        setStudents(studentsData || []);

        const resultsMap = {};
        (existingResults || []).forEach(r => {
          resultsMap[r.studentId] = {
            marksObtained: r.marksObtained,
            remarks: r.remarks || ''
          };
        });
        setResults(resultsMap);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load exam data');
    } finally {
      setLoading(false);
      setLoadingStudents(false);
    }
  };

  const handleMarksChange = (studentId, value) => {
    const marks = parseInt(value) || 0;
    const maxMarks = exam?.maxMarks || 100;

    if (marks > maxMarks) {
      toast.error(`Marks cannot exceed ${maxMarks}`);
      return;
    }

    setResults(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        marksObtained: marks
      }
    }));
  };

  const handleRemarksChange = (studentId, value) => {
    setResults(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks: value
      }
    }));
  };

  const handleSave = async () => {
    if (!exam) return;

    const currentExamId = standalone ? Array.from(selectedExamId)[0] : examId;
    setSaving(true);

    try {
      const user = JSON.parse(sessionStorage.getItem('app_user') || '{}');

      const resultsArray = students.map(student => ({
        studentId: student.id || student._id,
        marksObtained: results[student.id || student._id]?.marksObtained || 0,
        remarks: results[student.id || student._id]?.remarks || '',
        enteredBy: user.id
      }));

      await resultsApi.bulkCreate(resultsArray, currentExamId, exam.classId);

      toast.success('Results saved successfully!');

      if (!standalone) {
        navigate(`/academics/exams/${examId}`);
      }
    } catch (error) {
      console.error('Error saving results:', error);
      toast.error('Failed to save results');
    } finally {
      setSaving(false);
    }
  };

  const calculateGrade = (marks) => {
    if (!exam) return '';
    const percentage = (marks / exam.maxMarks) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    if (percentage >= 35) return 'D';
    return 'F';
  };

  const getStatus = (marks) => {
    if (!exam) return '';
    return marks >= exam.passingMarks ? 'pass' : 'fail';
  };

  // Filter students by search
  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    const query = searchQuery.toLowerCase();
    return students.filter(s =>
      s.name?.toLowerCase().includes(query) ||
      s.rollNo?.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

  // Calculate stats
  const enteredCount = Object.values(results).filter(r => r.marksObtained > 0).length;
  const passCount = Object.values(results).filter(r => r.marksObtained >= (exam?.passingMarks || 35)).length;

  // Loading state
  if (loading || loadingExams) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  // Standalone mode - show exam selector
  if (standalone) {
    return (
      <div className="space-y-4">
        {/* Exam Selector */}
        <div className="flex items-center justify-between gap-4">
          <Select
            label="Select Exam"
            placeholder="Choose an exam to enter results"
            selectedKeys={selectedExamId}
            onSelectionChange={setSelectedExamId}
            className="max-w-xs"
            classNames={{
              trigger: 'border-gray-200 hover:border-gray-300'
            }}
          >
            {exams.map((exam) => (
              <SelectItem key={exam.id || exam._id} value={exam.id || exam._id}>
                {exam.name} - {exam.classId}
              </SelectItem>
            ))}
          </Select>

          {exam && (
            <div className="flex items-center gap-2">
              <MinimalButton variant="ghost" onClick={handleSave} disabled={saving || students.length === 0}>
                {saving ? 'Saving...' : 'Save Results'}
              </MinimalButton>
            </div>
          )}
        </div>

        {/* No exam selected */}
        {exams.length === 0 && (
          <div className="text-center py-12">
            <FileText size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No exams available</p>
            <p className="text-sm text-gray-400 mt-1">Create an exam first to enter results</p>
          </div>
        )}

        {/* Loading students */}
        {loadingStudents && selectedExamId.size > 0 && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Results content */}
        {exam && !loadingStudents && (
          <>
            {/* Exam Info */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{exam.name}</h3>
                  <p className="text-sm text-gray-500">{exam.classId} - {exam.subjectName}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-500">Max: <span className="font-medium text-gray-900">{exam.maxMarks}</span></span>
                  <span className="text-gray-500">Pass: <span className="font-medium text-gray-900">{exam.passingMarks}</span></span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <p className="text-xs text-gray-500">Total Students</p>
                <p className="text-xl font-semibold text-gray-900">{students.length}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <p className="text-xs text-blue-600">Results Entered</p>
                <p className="text-xl font-semibold text-blue-700">{enteredCount}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                <p className="text-xs text-green-600">Pass Count</p>
                <p className="text-xl font-semibold text-green-700">{passCount}</p>
              </div>
            </div>

            {/* Search */}
            {students.length > 5 && (
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                startContent={<Search size={16} className="text-gray-400" />}
                className="max-w-xs"
                classNames={{
                  inputWrapper: 'border-gray-200 hover:border-gray-300'
                }}
              />
            )}

            {/* Results Table */}
            <Card shadow="none" className="border border-gray-100">
              <CardBody className="p-0">
                {students.length === 0 ? (
                  <div className="text-center py-12">
                    <Users size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">No students found in this class</p>
                  </div>
                ) : (
                  <Table aria-label="Results entry table" removeWrapper>
                    <TableHeader>
                      <TableColumn>STUDENT</TableColumn>
                      <TableColumn>ROLL NO</TableColumn>
                      <TableColumn>MARKS</TableColumn>
                      <TableColumn>GRADE</TableColumn>
                      <TableColumn>STATUS</TableColumn>
                      <TableColumn>REMARKS</TableColumn>
                    </TableHeader>
                    <TableBody emptyContent="No students found">
                      {filteredStudents.map((student) => {
                        const studentId = student.id || student._id;
                        const marks = results[studentId]?.marksObtained || 0;
                        const grade = calculateGrade(marks);
                        const status = getStatus(marks);

                        return (
                          <TableRow key={studentId} className="hover:bg-gray-50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-600">
                                    {student.name?.charAt(0)?.toUpperCase() || 'S'}
                                  </span>
                                </div>
                                <span className="font-medium text-gray-900">{student.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600">{student.rollNo || studentId}</span>
                            </TableCell>
                            <TableCell>
                              <div className="w-24">
                                <input
                                  type="number"
                                  value={marks}
                                  onChange={(e) => handleMarksChange(studentId, e.target.value)}
                                  min={0}
                                  max={exam.maxMarks}
                                  className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-100 outline-none text-sm"
                                  placeholder="0"
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Chip size="sm" variant="flat">{grade || '-'}</Chip>
                            </TableCell>
                            <TableCell>
                              {marks > 0 ? (
                                <Chip
                                  size="sm"
                                  color={status === 'pass' ? 'success' : 'danger'}
                                  variant="flat"
                                  startContent={status === 'pass' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                >
                                  {status}
                                </Chip>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <input
                                type="text"
                                value={results[studentId]?.remarks || ''}
                                onChange={(e) => handleRemarksChange(studentId, e.target.value)}
                                placeholder="Add remarks..."
                                className="w-40 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-100 outline-none text-sm"
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardBody>
            </Card>
          </>
        )}
      </div>
    );
  }

  // Non-standalone mode (original behavior)
  if (!exam) {
    return (
      <div className="text-center py-20">
        <FileText size={40} className="mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">Exam not found</p>
        <MinimalButton className="mt-4" onClick={() => navigate('/academics/exams')}>
          Back to Exams
        </MinimalButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-100 rounded-lg">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/academics/exams/${examId}`)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-500" />
            </button>
            <div className="p-3 bg-gray-100 rounded-lg">
              <Award size={24} className="text-gray-600" />
            </div>
            <div>
              <h1 className="text-xl font-medium text-gray-900">Enter Results: {exam.name}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {exam.classId} - {exam.subjectName} | Max: {exam.maxMarks} | Pass: {exam.passingMarks}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MinimalButton variant="ghost" onClick={() => navigate(`/academics/exams/${examId}`)}>
              Cancel
            </MinimalButton>
            <MinimalButton icon={<Save size={16} />} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Results'}
            </MinimalButton>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <p className="text-xs text-gray-500">Total Students</p>
          <p className="text-2xl font-semibold text-gray-900">{students.length}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <p className="text-xs text-gray-500">Results Entered</p>
          <p className="text-2xl font-semibold text-gray-900">{enteredCount}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <p className="text-xs text-gray-500">Pass Count</p>
          <p className="text-2xl font-semibold text-green-600">{passCount}</p>
        </div>
      </div>

      {/* Results Table */}
      <Card shadow="none" className="border border-gray-100">
        <CardBody className="p-0">
          {students.length === 0 ? (
            <div className="text-center py-12">
              <Users size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No students found in this class</p>
            </div>
          ) : (
            <Table aria-label="Results entry table" removeWrapper>
              <TableHeader>
                <TableColumn>STUDENT</TableColumn>
                <TableColumn>ROLL NO</TableColumn>
                <TableColumn>MARKS</TableColumn>
                <TableColumn>GRADE</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>REMARKS</TableColumn>
              </TableHeader>
              <TableBody emptyContent="No students found">
                {students.map((student) => {
                  const studentId = student.id || student._id;
                  const marks = results[studentId]?.marksObtained || 0;
                  const grade = calculateGrade(marks);
                  const status = getStatus(marks);

                  return (
                    <TableRow key={studentId} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {student.name?.charAt(0)?.toUpperCase() || 'S'}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{student.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{student.rollNo || studentId}</span>
                      </TableCell>
                      <TableCell>
                        <div className="w-24">
                          <input
                            type="number"
                            value={marks}
                            onChange={(e) => handleMarksChange(studentId, e.target.value)}
                            min={0}
                            max={exam.maxMarks}
                            className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-100 outline-none text-sm"
                            placeholder="0"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip size="sm" variant="flat">{grade || '-'}</Chip>
                      </TableCell>
                      <TableCell>
                        {marks > 0 ? (
                          <Chip
                            size="sm"
                            color={status === 'pass' ? 'success' : 'danger'}
                            variant="flat"
                            startContent={status === 'pass' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                          >
                            {status}
                          </Chip>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <input
                          type="text"
                          value={results[studentId]?.remarks || ''}
                          onChange={(e) => handleRemarksChange(studentId, e.target.value)}
                          placeholder="Add remarks..."
                          className="w-40 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-100 outline-none text-sm"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default ResultsEntry;
