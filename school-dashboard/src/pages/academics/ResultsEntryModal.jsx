import { useState, useEffect, useMemo } from 'react';
import { ModalHeader, ModalBody, Chip, Input } from '@heroui/react';
import { FileText, Users, Save, AlertCircle, Award, CheckCircle2, Search } from 'lucide-react';
import { examsApi, resultsApi, classesApi } from '../../services/api';
import { MinimalButton } from '../../components/ui';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const ResultsEntryModal = ({ examId, onClose }) => {
  const { t } = useTranslation();
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
      toast.error(t('toast.error.failedToLoadExamData'));
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

      toast.success(t('toast.success.resultsSavedSuccessfully'));
    } catch (error) {
      console.error('Error saving results:', error);
      toast.error(t('toast.error.failedToSaveResults'));
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
      <div className="flex justify-center py-8"><div className="animate-spin h-8 w-8 rounded-full border-2 border-gray-300 border-t-gray-900" /></div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-12">
        <FileText size={40} className="mx-auto mb-3 text-gray-300 dark:text-zinc-600" />
        <p className="text-gray-500 dark:text-zinc-400">{t('pages.examNotFound')}</p>
        <MinimalButton className="mt-4" onClick={onClose}>{t('pages.close2')}</MinimalButton>
      </div>
    );
  }

  return (
    <>
      <ModalHeader className="border-b border-gray-100 dark:border-zinc-800 py-4 px-6">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
              <Award size={20} className="text-gray-600 dark:text-zinc-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100">Enter Results: {exam.name}</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400 font-normal">
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
            <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-3 border border-gray-100 dark:border-zinc-800">
              <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.totalStudents1')}</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-zinc-100">{students.length}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
              <p className="text-xs text-blue-600 dark:text-blue-400">{t('pages.resultsEntered')}</p>
              <p className="text-xl font-semibold text-blue-700 dark:text-blue-300">{enteredCount}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 border border-green-100 dark:border-green-800">
              <p className="text-xs text-green-600 dark:text-green-400">{t('pages.passCount')}</p>
              <p className="text-xl font-semibold text-green-700 dark:text-green-300">{passCount}</p>
            </div>
          </div>

          {/* Search */}
          {students.length > 5 && (
            <Input
              placeholder={t('pages.searchStudents')}
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<Search size={16} className="text-gray-400 dark:text-zinc-500" />}
              className="max-w-xs"
              classNames={{
                inputWrapper: 'border-gray-200 hover:border-gray-300 dark:border-zinc-800 dark:hover:border-zinc-700'
              }}
            />
          )}

          {/* Results Table */}
          <div className="border border-gray-100 dark:border-zinc-800 rounded-lg overflow-hidden">
            {students.length === 0 ? (
              <div className="text-center py-12">
                <Users size={40} className="mx-auto mb-3 text-gray-300 dark:text-zinc-600" />
                <p className="text-gray-500 dark:text-zinc-400">{t('pages.noStudentsFoundInThisClass')}</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-zinc-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">{t('pages.student')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">{t('pages.rollNo1')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase w-28">{t('pages.marks')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">{t('pages.grade2')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">{t('pages.status2')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">{t('pages.remarks')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {filteredStudents.map((student) => {
                    const studentId = student.id || student._id;
                    const marks = results[studentId]?.marksObtained || 0;
                    const grade = calculateGrade(marks);
                    const status = getStatus(marks);

                    return (
                      <tr key={studentId} className="hover:bg-gray-50 dark:hover:bg-zinc-900">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                                {student.name?.charAt(0)?.toUpperCase() || 'S'}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900 dark:text-zinc-100">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600 dark:text-zinc-400">{student.rollNo || studentId}</span>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={marks}
                            onChange={(e) => handleMarksChange(studentId, e.target.value)}
                            min={0}
                            max={exam.maxMarks || 100}
                            className="w-20 px-3 py-2 bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 focus:border-green-500 dark:focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:focus:ring-green-900 outline-none text-sm dark:text-zinc-100"
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
                            <span className="text-sm text-gray-400 dark:text-zinc-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={results[studentId]?.remarks || ''}
                            onChange={(e) => handleRemarksChange(studentId, e.target.value)}
                            placeholder={t('pages.addRemarks')}
                            className="w-32 px-3 py-2 bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 focus:border-gray-400 dark:focus:border-zinc-500 focus:ring-2 focus:ring-gray-100 dark:focus:ring-zinc-800 outline-none text-sm dark:text-zinc-100"
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
          <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-zinc-800">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
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
