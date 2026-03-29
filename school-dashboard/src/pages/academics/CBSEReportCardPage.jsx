import { useState, useCallback, useRef, useEffect } from 'react';
import { CURRENT_ACADEMIC_YEAR } from '../../utils/constants';
import {
  Card, CardBody, Input, Button, Select, SelectItem,
  Breadcrumbs, BreadcrumbItem, Chip,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Tab, Tabs, useDisclosure,
} from '@heroui/react';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { Search, FileText, Home, Download, Plus, Users, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { request } from '../../services/api';
import { classesApi } from '../../services/classesService';
import { PageLayout } from '../../components/ui';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const GRADE_COLORS = {
  A1: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
  A2: 'bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300',
  B1: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  B2: 'bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
  C1: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  C2: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400',
  D: 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-300',
  E1: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300',
  E2: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
};

const DEFAULT_SUBJECTS = ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science'];

// ── Mark Entry Modal (single student) ─────────────────────────────────────────
function MarkEntryModal({ isOpen, onClose, student, classId, academicYear, term, onSaved }) {
  const { t } = useTranslation();
  const [subjects, setSubjects] = useState(() =>
    DEFAULT_SUBJECTS.map(name => ({ subjectName: name, theoryMarks: '', practicalMarks: '' }))
  );
  const [saving, setSaving] = useState(false);

  const updateSubject = (i, field, val) => {
    setSubjects(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  };

  const addSubject = () => setSubjects(prev => [...prev, { subjectName: '', theoryMarks: '', practicalMarks: '' }]);
  const removeSubject = (i) => setSubjects(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    const scholasticGrades = subjects
      .filter(s => s.subjectName.trim())
      .map(s => ({
        subjectName: s.subjectName.trim(),
        theoryMarks: s.theoryMarks !== '' ? Number(s.theoryMarks) : null,
        practicalMarks: s.practicalMarks !== '' ? Number(s.practicalMarks) : null,
      }));

    if (scholasticGrades.length === 0) { toast.error('Add at least one subject'); return; }

    setSaving(true);
    try {
      await request('/cbse-report-card', {
        method: 'POST',
        body: JSON.stringify({
          studentId: student._id || student.id,
          classId,
          academicYear,
          term,
          scholasticGrades,
        }),
      });
      toast.success('Marks saved successfully');
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e?.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          Enter Marks — {student?.name}
          <span className="text-sm font-normal text-gray-500 ml-2">({term?.replace('_', ' ')} · {academicYear})</span>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 dark:text-zinc-400 px-1">
              <span className="col-span-5">Subject</span>
              <span className="col-span-3 text-center">Theory Marks</span>
              <span className="col-span-3 text-center">Practical Marks</span>
              <span className="col-span-1" />
            </div>
            {subjects.map((s, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <Input
                  size="sm"
                  placeholder={t('academics.subjectNamePlaceholder')}
                  value={s.subjectName}
                  onChange={e => updateSubject(i, 'subjectName', e.target.value)}
                  variant="bordered"
                  classNames={{ input: 'dark:text-zinc-100', inputWrapper: 'dark:border-zinc-700' }}
                  className="col-span-5"
                />
                <Input
                  size="sm"
                  type="number"
                  placeholder={t('academics.marksPlaceholder')}
                  min={0} max={100}
                  value={s.theoryMarks}
                  onChange={e => updateSubject(i, 'theoryMarks', e.target.value)}
                  variant="bordered"
                  classNames={{ input: 'dark:text-zinc-100 text-center', inputWrapper: 'dark:border-zinc-700' }}
                  className="col-span-3"
                />
                <Input
                  size="sm"
                  type="number"
                  placeholder={t('academics.marksPlaceholder')}
                  min={0} max={100}
                  value={s.practicalMarks}
                  onChange={e => updateSubject(i, 'practicalMarks', e.target.value)}
                  variant="bordered"
                  classNames={{ input: 'dark:text-zinc-100 text-center', inputWrapper: 'dark:border-zinc-700' }}
                  className="col-span-3"
                />
                <button
                  type="button"
                  onClick={() => removeSubject(i)}
                  className="col-span-1 text-gray-400 hover:text-red-500 text-lg leading-none text-center"
                >×</button>
              </div>
            ))}
            <Button size="sm" variant="light" color="primary" onPress={addSubject} className="mt-1">
              + Add Subject
            </Button>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>Cancel</Button>
          <Button color="primary" onPress={handleSave} isLoading={saving}>Save Marks</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ── Bulk Class Mark Entry Modal ────────────────────────────────────────────────
function BulkMarkEntryModal({ isOpen, onClose, term, academicYear }) {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS.slice());
  const [marks, setMarks] = useState({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);

  const [classesError, setClassesError] = useState(false);

  // Load classes when modal opens
  useEffect(() => {
    if (isOpen) {
      setClassesError(false);
      classesApi.getAll().then(data => {
        setClasses(Array.isArray(data) ? data : data?.classes || []);
      }).catch((err) => {
        console.error('Failed to load classes:', err);
        setClassesError(true);
        toast.error('Failed to load classes. Please close and try again.');
      });
    }
  }, [isOpen]);

  const loadStudents = async () => {
    if (!selectedClassId) return;
    setLoadingStudents(true);
    try {
      const data = await classesApi.getStudents(selectedClassId);
      const list = Array.isArray(data) ? data : data?.students || [];
      setStudents(list);
      const m = {};
      list.forEach(s => {
        m[s._id || s.id] = subjects.reduce((acc, subj) => {
          acc[subj] = { theoryMarks: '', practicalMarks: '' };
          return acc;
        }, {});
      });
      setMarks(m);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const updateMark = (studentId, subj, field, val) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [subj]: { ...prev[studentId]?.[subj], [field]: val } },
    }));
  };

  const handleSave = async () => {
    if (!selectedClassId) { toast.error('Select a class first'); return; }
    if (students.length === 0) { toast.error('Load students first'); return; }

    const reportCards = students.map(s => {
      const sid = s._id || s.id;
      return {
        studentId: sid,
        scholasticGrades: subjects
          .filter(subj => subj.trim())
          .map(subj => ({
            subjectName: subj,
            theoryMarks: marks[sid]?.[subj]?.theoryMarks !== '' ? Number(marks[sid]?.[subj]?.theoryMarks) : null,
            practicalMarks: marks[sid]?.[subj]?.practicalMarks !== '' ? Number(marks[sid]?.[subj]?.practicalMarks) : null,
          })),
      };
    });

    setSaving(true);
    try {
      const res = await request('/cbse-report-card/bulk', {
        method: 'POST',
        body: JSON.stringify({ classId: selectedClassId, academicYear, term, reportCards }),
      });
      toast.success(`Saved marks for ${res.upsertedCount ?? students.length} students`);
      onClose();
    } catch (e) {
      toast.error(e?.message || 'Failed to save bulk marks');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          Bulk Mark Entry
          <span className="text-sm font-normal text-gray-500 ml-2">({term?.replace('_', ' ')} · {academicYear})</span>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Class load error */}
            {classesError && (
              <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                Failed to load classes. Please close the modal and try again.
              </div>
            )}

            {/* Class selector */}
            <div className="flex gap-3 items-end">
              <Select
                label="Select Class"
                selectedKeys={selectedClassId ? [selectedClassId] : []}
                onSelectionChange={keys => setSelectedClassId([...keys][0] || '')}
                variant="bordered"
                className="flex-1"
                classNames={{ trigger: 'dark:border-zinc-700' }}
                isDisabled={classesError}
              >
                {classes.map(c => (
                  <SelectItem key={c._id || c.id} value={c._id || c.id}>
                    {c.name}{c.section ? ` ${c.section}` : ''}
                  </SelectItem>
                ))}
              </Select>
              <Button
                color="primary"
                onPress={loadStudents}
                isLoading={loadingStudents}
                isDisabled={!selectedClassId}
              >
                Load Students
              </Button>
            </div>

            {/* Subject list editor */}
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-2">Subjects (edit to customize)</p>
              <div className="flex flex-wrap gap-2">
                {subjects.map((s, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <input
                      className="border border-gray-300 dark:border-zinc-600 rounded px-2 py-1 text-xs bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none w-28"
                      value={s}
                      onChange={e => setSubjects(prev => prev.map((x, j) => j === i ? e.target.value : x))}
                    />
                    <button onClick={() => setSubjects(prev => prev.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500">×</button>
                  </div>
                ))}
                <button
                  onClick={() => setSubjects(prev => [...prev, ''])}
                  className="text-xs text-primary hover:underline"
                >+ Add</button>
              </div>
            </div>

            {/* Bulk entry table */}
            {students.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-zinc-700">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-zinc-900">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-gray-500 dark:text-zinc-400 sticky left-0 bg-gray-50 dark:bg-zinc-900">Student</th>
                      {subjects.filter(s => s.trim()).map(subj => (
                        <th key={subj} colSpan={2} className="text-center px-2 py-2 font-medium text-gray-500 dark:text-zinc-400 border-l border-gray-100 dark:border-zinc-800">
                          {subj}
                        </th>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-200 dark:border-zinc-700">
                      <th className="sticky left-0 bg-gray-50 dark:bg-zinc-900" />
                      {subjects.filter(s => s.trim()).map(subj => (
                        <>
                          <th key={`${subj}-t`} className="text-center px-2 py-1 text-gray-400 dark:text-zinc-500 font-normal border-l border-gray-100 dark:border-zinc-800">Theory</th>
                          <th key={`${subj}-p`} className="text-center px-2 py-1 text-gray-400 dark:text-zinc-500 font-normal">Practical</th>
                        </>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, si) => {
                      const sid = s._id || s.id;
                      return (
                        <tr key={sid} className={`border-b border-gray-100 dark:border-zinc-800 ${si % 2 === 0 ? 'bg-white dark:bg-zinc-950' : 'bg-gray-50/50 dark:bg-zinc-900/50'}`}>
                          <td className="px-3 py-1.5 font-medium text-gray-900 dark:text-zinc-100 sticky left-0 bg-inherit">
                            {s.name}
                            <span className="text-gray-400 dark:text-zinc-500 ml-1">({s.rollNo || s.admissionId})</span>
                          </td>
                          {subjects.filter(subj => subj.trim()).map(subj => (
                            <>
                              <td key={`${subj}-t`} className="px-1 py-1 border-l border-gray-100 dark:border-zinc-800">
                                <input
                                  type="number" min={0} max={100}
                                  value={marks[sid]?.[subj]?.theoryMarks ?? ''}
                                  onChange={e => updateMark(sid, subj, 'theoryMarks', e.target.value)}
                                  className="w-16 text-center border border-gray-200 dark:border-zinc-700 rounded px-1 py-0.5 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                              </td>
                              <td key={`${subj}-p`} className="px-1 py-1">
                                <input
                                  type="number" min={0} max={100}
                                  value={marks[sid]?.[subj]?.practicalMarks ?? ''}
                                  onChange={e => updateMark(sid, subj, 'practicalMarks', e.target.value)}
                                  className="w-16 text-center border border-gray-200 dark:border-zinc-700 rounded px-1 py-0.5 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                              </td>
                            </>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>Cancel</Button>
          <Button color="primary" onPress={handleSave} isLoading={saving} isDisabled={students.length === 0}>
            Save All Marks
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function CBSEReportCardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [admissionNo, setAdmissionNo] = useState('');
  const [term, setTerm] = useState('term_1');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [foundStudent, setFoundStudent] = useState(null);

  const markEntryDisclosure = useDisclosure();
  const bulkDisclosure = useDisclosure();
  const printRef = useRef(null);

  const handleSearch = async () => {
    if (!admissionNo.trim()) { toast.error('Enter an admission number'); return; }
    setLoading(true);
    try {
      const students = await request(`/students?search=${encodeURIComponent(admissionNo.trim())}&limit=1`);
      const student = students?.data?.[0] || students?.students?.[0] || students?.[0];
      if (!student) { toast.error('Student not found'); setLoading(false); return; }
      setFoundStudent(student);

      const res = await request(`/cbse-report-card/student/${student._id || student.id}?term=${term}`);
      setResult(res);
    } catch {
      toast.error('Failed to load CBSE report card');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = useCallback(() => {
    if (!printRef.current) return;
    // printContent is React-rendered innerHTML (already escaped by React)
    const printContent = printRef.current.innerHTML;
    const w = window.open('', '_blank', 'width=800,height=600');
    if (!w) { toast.error('Pop-up blocked. Allow pop-ups to print report card.'); return; }
    w.document.write(`
      <html><head><title>CBSE Report Card</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 24px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 6px 10px; }
        th { background: #f5f5f5; font-weight: 600; }
        .grade-badge { padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; }
        @media print { button { display: none; } }
      </style></head>
      <body>${printContent}</body></html>
    `);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  }, []);

  const reportCard = result?.reportCards?.[0] || result?.reportCard;

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <Breadcrumbs size="sm">
          <BreadcrumbItem startContent={<Home size={14} />} onPress={() => navigate('/')}>Home</BreadcrumbItem>
          <BreadcrumbItem onPress={() => navigate('/academics')}>Academics</BreadcrumbItem>
          <BreadcrumbItem>CBSE Report Card</BreadcrumbItem>
        </Breadcrumbs>
      </div>

      <PageLayout
        header={{ title: 'CBSE Report Card', description: 'View and enter CBSE-format student marks' }}
        actions={
          <Button
            size="sm"
            variant="flat"
            color="primary"
            startContent={<Users size={14} />}
            onPress={bulkDisclosure.onOpen}
          >
            Bulk Class Entry
          </Button>
        }
        noPadding
      >
        <div className="p-6 space-y-6">
          {/* Search */}
          <Card shadow="sm" className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800">
            <CardBody className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  label="Admission Number"
                  placeholder={t('academics.admissionNumberPlaceholder')}
                  value={admissionNo}
                  onChange={e => setAdmissionNo(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  variant="bordered"
                  startContent={<Search size={16} className="text-gray-400" />}
                  classNames={{ input: 'dark:text-zinc-100', inputWrapper: 'dark:border-zinc-700' }}
                  className="flex-1"
                />
                <Select
                  label="Term"
                  selectedKeys={[term]}
                  onSelectionChange={keys => setTerm([...keys][0] || 'term_1')}
                  variant="bordered"
                  className="w-40"
                  classNames={{ trigger: 'dark:border-zinc-700' }}
                >
                  <SelectItem key="term_1" value="term_1">Term 1</SelectItem>
                  <SelectItem key="term_2" value="term_2">Term 2</SelectItem>
                </Select>
                <Button
                  className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 self-end"
                  onPress={handleSearch}
                  isLoading={loading}
                >
                  Search
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Loading */}
          {loading && <TablePageSkeleton />}

          {/* Results */}
          {!loading && result && (
            <div className="space-y-4" ref={printRef}>
              {/* Student Header */}
              <Card shadow="sm" className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{result.student?.name}</h2>
                      <p className="text-sm text-gray-500 dark:text-zinc-400">
                        Adm: {result.student?.admissionNo} · Roll: {result.student?.rollNo} · Class: {result.student?.className}
                        {(result.student?.fatherName || result.student?.guardianName) && ` · Parent: ${result.student?.fatherName || result.student?.guardianName}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="flat"
                        size="sm"
                        color="primary"
                        startContent={<Plus size={14} />}
                        onPress={markEntryDisclosure.onOpen}
                        className="dark:border-zinc-600 dark:text-zinc-300"
                      >
                        Enter Marks
                      </Button>
                      <Button
                        variant="bordered"
                        size="sm"
                        startContent={<Printer size={14} />}
                        className="dark:border-zinc-600 dark:text-zinc-300"
                        onPress={handlePrint}
                        isDisabled={!reportCard}
                      >
                        Export PDF
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {!reportCard ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-xl">
                  <FileText size={40} className="mx-auto mb-3 text-gray-300 dark:text-zinc-600" />
                  <p className="text-gray-500 dark:text-zinc-400 mb-4">No CBSE report card found for this term</p>
                  <Button
                    color="primary"
                    size="sm"
                    startContent={<Plus size={14} />}
                    onPress={markEntryDisclosure.onOpen}
                  >
                    Enter Marks Now
                  </Button>
                </div>
              ) : (
                <>
                  {/* Scholastic */}
                  {reportCard.scholasticGrades?.length > 0 && (
                    <Card shadow="sm" className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800">
                      <CardBody className="p-4">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-3">Scholastic Areas</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-100 dark:border-zinc-800">
                                <th className="text-left py-2 text-gray-500 dark:text-zinc-400 font-medium">Subject</th>
                                <th className="text-center py-2 text-gray-500 dark:text-zinc-400 font-medium">Theory</th>
                                <th className="text-center py-2 text-gray-500 dark:text-zinc-400 font-medium">Practical</th>
                                <th className="text-center py-2 text-gray-500 dark:text-zinc-400 font-medium">Total</th>
                                <th className="text-center py-2 text-gray-500 dark:text-zinc-400 font-medium">Grade</th>
                                <th className="text-center py-2 text-gray-500 dark:text-zinc-400 font-medium">Grade Pt</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reportCard.scholasticGrades.map((subj, i) => (
                                <tr key={i} className="border-b border-gray-50 dark:border-zinc-900">
                                  <td className="py-2.5 text-gray-900 dark:text-zinc-100">{subj.subjectName}</td>
                                  <td className="py-2.5 text-center text-gray-700 dark:text-zinc-300">{subj.theoryMarks ?? '—'}</td>
                                  <td className="py-2.5 text-center text-gray-700 dark:text-zinc-300">{subj.practicalMarks ?? '—'}</td>
                                  <td className="py-2.5 text-center font-medium text-gray-900 dark:text-zinc-100">{subj.totalMarks ?? '—'}</td>
                                  <td className="py-2.5 text-center">
                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${GRADE_COLORS[subj.grade] || 'bg-gray-100 text-gray-700'}`}>
                                      {subj.grade || '—'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 text-center text-gray-700 dark:text-zinc-300">{subj.gradePoint ?? '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {reportCard.cgpa != null && (
                          <div className="mt-3 flex items-center justify-end gap-3">
                            <span className="text-sm text-gray-500 dark:text-zinc-400">CGPA:</span>
                            <span className="text-xl font-bold text-gray-900 dark:text-zinc-100">{reportCard.cgpa}</span>
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  )}

                  {/* Co-scholastic */}
                  {reportCard.coScholasticGrades?.length > 0 && (
                    <Card shadow="sm" className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800">
                      <CardBody className="p-4">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-3">Co-Scholastic Areas</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {reportCard.coScholasticGrades.map((area, i) => (
                            <div key={i} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                              <span className="text-xs text-gray-600 dark:text-zinc-400">{area.areaName}</span>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${GRADE_COLORS[area.grade] || 'bg-gray-100 text-gray-700'}`}>
                                {area.grade || '—'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardBody>
                    </Card>
                  )}

                  {/* Attendance */}
                  {reportCard.attendance && (
                    <Card shadow="sm" className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800">
                      <CardBody className="p-4">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-3">Attendance</h3>
                        <div className="flex gap-6 text-sm">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-zinc-400">Working Days</p>
                            <p className="font-semibold text-gray-900 dark:text-zinc-100">{reportCard.attendance.workingDays}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-zinc-400">Days Present</p>
                            <p className="font-semibold text-gray-900 dark:text-zinc-100">{reportCard.attendance.daysPresent}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-zinc-400">Percentage</p>
                            <p className="font-semibold text-gray-900 dark:text-zinc-100">
                              {reportCard.attendance.workingDays
                                ? `${Math.round((reportCard.attendance.daysPresent / reportCard.attendance.workingDays) * 100)}%`
                                : '—'}
                            </p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  )}
                </>
              )}
            </div>
          )}

          {/* Empty state */}
          {!loading && !result && (
            <div className="text-center py-20">
              <FileText size={48} className="mx-auto mb-4 text-gray-200 dark:text-zinc-700" />
              <p className="text-gray-500 dark:text-zinc-400">Search for a student to view their CBSE report card</p>
            </div>
          )}
        </div>
      </PageLayout>

      {/* Mark Entry Modal */}
      {markEntryDisclosure.isOpen && foundStudent && (
        <MarkEntryModal
          isOpen={markEntryDisclosure.isOpen}
          onClose={markEntryDisclosure.onClose}
          student={foundStudent}
          classId={foundStudent.classId}
          academicYear={result?.student?.academicYear}
          term={term}
          onSaved={handleSearch}
        />
      )}

      {/* Bulk Entry Modal */}
      <BulkMarkEntryModal
        isOpen={bulkDisclosure.isOpen}
        onClose={bulkDisclosure.onClose}
        term={term}
        academicYear={CURRENT_ACADEMIC_YEAR}
      />
    </div>
  );
}
