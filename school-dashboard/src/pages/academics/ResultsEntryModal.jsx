import React, { useState, useEffect, useMemo } from 'react';
import { ModalHeader, ModalBody, Chip, Spinner, Input } from '@heroui/react';
import { FileText, Users, Save, AlertCircle, Award, CheckCircle2, Search } from 'lucide-react';
import { examsApi, resultsApi, classesApi } from '../../services/api';
import { MinimalButton } from '../../components/ui';
import toast from 'react-hot-toast';

const ResultsEntryModal = ({ examId, onClose }) => {
  const [exam, setExam] = useState(null);
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (examId) {
      fetchExamAndStudents();
    }
  }, [examId]);

  const fetchExamAndStudents = async () => {
    setLoading(true);
    try {
      const examData = await examsApi.getById(examId);
      setExam(examData);

      if (examData?.classId) {
        const [studentsData, existingResults] = await Promise.all([
          classesApi.getStudents(examData.classId),
          resultsApi.getByClassExam(examData.classId, examId)
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

    setSaving(true);

    try {
      const user = JSON.parse(sessionStorage.getItem('app_user') || '{}');

      const resultsArray = students.map(student => ({
        studentId: student.id || student._id,
        marksObtained: results[student.id || student._id]?.marksObtained || 0,
        remarks: results[student.id || student._id]?.remarks || '',
        enteredBy: user.id
      }));

      await resultsApi.bulkCreate(resultsArray, examId, exam.classId);

      toast.success('Results saved successfully!');
    } catch (error) {
      console.error('Error saving results:', error);
      toast.error('Failed to save results');
    } finally {
      setSaving(false);
    }
  };

  const calculateGrade = (marks) => {
    if (!exam) return '';
    const percentage = (marks / (exam.maxMarks || 100)) * 100;
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
    return marks >= (exam.passingMarks || 35) ? 'pass' : 'fail';
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

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-12">
        <FileText size={40} className="mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">Exam not found</p>
        <MinimalButton className="mt-4" onClick={onClose}>Close</MinimalButton>
      </div>
    );
  }

  return (
    <>
      <ModalHeader className="border-b border-gray-100 py-4 px-6">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Award size={20} className="text-gray-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Enter Results: {exam.name}</h3>
              <p className="text-sm text-gray-500 font-normal">
                {exam.className || exam.classId} - {exam.subjectName} | Max: {exam.maxMarks || 100} | Pass: {exam.passingMarks || 35}
              </p>
            </div>
          </div>
          {/* Prominent Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || students.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Results'}
          </button>
        </div>
      </ModalHeader>
      <ModalBody className="px-6 pb-6 pt-4">
        <div className="space-y-4">
          {/* Stats Summary */}
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
          <div className="border border-gray-100 rounded-lg overflow-hidden">
            {students.length === 0 ? (
              <div className="text-center py-12">
                <Users size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No students found in this class</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-28">Marks</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.map((student) => {
                    const studentId = student.id || student._id;
                    const marks = results[studentId]?.marksObtained || 0;
                    const grade = calculateGrade(marks);
                    const status = getStatus(marks);

                    return (
                      <tr key={studentId} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {student.name?.charAt(0)?.toUpperCase() || 'S'}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">{student.rollNo || studentId}</span>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={marks}
                            onChange={(e) => handleMarksChange(studentId, e.target.value)}
                            min={0}
                            max={exam.maxMarks || 100}
                            className="w-20 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none text-sm"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Chip size="sm" variant="flat">{grade || '-'}</Chip>
                        </td>
                        <td className="px-4 py-3">
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
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={results[studentId]?.remarks || ''}
                            onChange={(e) => handleRemarksChange(studentId, e.target.value)}
                            placeholder="Add remarks..."
                            className="w-32 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none text-sm"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || students.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save All Results'}
            </button>
          </div>
        </div>
      </ModalBody>
    </>
  );
};

export default ResultsEntryModal;
