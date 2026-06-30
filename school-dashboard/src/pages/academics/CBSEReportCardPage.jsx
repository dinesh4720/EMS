import { useState, useCallback, useRef, useEffect, Fragment } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Card, CardBody, Input, Button, Select, SelectItem,
  Breadcrumbs, BreadcrumbItem,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  useDisclosure,
} from '@heroui/react';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { Search, FileText, Home, Plus, Users, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { request } from '../../services/api';
import { classesApi } from '../../services/classesService';
import { PageLayout, Input as DSInput, ErrorState, EmptyState } from '../../components/ui';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import logger from '../../utils/logger';


// Token-driven grade pill class — maps CBSE grade bands to the
// status semantics defined in academics.css (.grade-pill--*).
const gradePillClass = (grade) => {
  if (!grade) return 'grade-pill grade-pill--muted';
  if (grade === 'A1' || grade === 'A2') return 'grade-pill grade-pill--ok';
  if (grade === 'B1' || grade === 'B2') return 'grade-pill grade-pill--info';
  if (grade === 'C1' || grade === 'C2') return 'grade-pill grade-pill--warn';
  return 'grade-pill grade-pill--danger';
};

// ── Mark Entry Modal (single student) ─────────────────────────────────────────
function MarkEntryModal({ isOpen, onClose, student, classId, academicYear, term, onSaved }) {
  const { t } = useTranslation();
  const { schoolSettings } = useApp();
  const [subjects, setSubjects] = useState(() => {
    const names = (schoolSettings?.subjects || []).map(s => (typeof s === 'string' ? s : s.name)).filter(Boolean);
    return names.map(name => ({ id: crypto.randomUUID(), subjectName: name, theoryMarks: '', practicalMarks: '' }));
  });
  const [saving, setSaving] = useState(false);

  const updateSubject = (i, field, val) => {
    setSubjects(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  };

  const addSubject = () => setSubjects(prev => [...prev, { id: crypto.randomUUID(), subjectName: '', theoryMarks: '', practicalMarks: '' }]);
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
          <span className="text-sm font-normal text-fg-muted ml-2">({term?.replace(/_/g, ' ')} · {academicYear})</span>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-fg-muted px-1">
              <span className="col-span-5">Subject</span>
              <span className="col-span-3 text-center">Theory Marks</span>
              <span className="col-span-3 text-center">Practical Marks</span>
              <span className="col-span-1" />
            </div>
            {subjects.map((s, i) => (
              <div key={s.id} className="grid grid-cols-12 gap-2 items-center">
                <Input
                  size="sm"
                  placeholder={t('academics.subjectNamePlaceholder')}
                  value={s.subjectName}
                  onChange={e => updateSubject(i, 'subjectName', e.target.value)}
                  variant="bordered"
                  classNames={{ input: 'text-fg', inputWrapper: 'border-border-token' }}
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
                  classNames={{ input: 'text-fg text-center', inputWrapper: 'border-border-token' }}
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
                  classNames={{ input: 'text-fg text-center', inputWrapper: 'border-border-token' }}
                  className="col-span-3"
                />
                <button
                  type="button"
                  onClick={() => removeSubject(i)}
                  aria-label={`Remove subject ${i + 1}`}
                  className="col-span-1 text-fg-faint hover:text-red-500 text-lg leading-none text-center"
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
  const { schoolSettings } = useApp();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState(() =>
    (schoolSettings?.subjects || []).map(s => (typeof s === 'string' ? s : s.name)).filter(Boolean)
  );
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
        logger.error('Failed to load classes:', err);
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
          <span className="text-sm font-normal text-fg-muted ml-2">({term?.replace(/_/g, ' ')} · {academicYear})</span>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Class load error */}
            {classesError && (
              <ErrorState
                title="Failed to load classes"
                description="Please close the modal and try again."
                size="sm"
              />
            )}

            {/* Class selector */}
            <div className="flex gap-3 items-end">
              <Select
                label="Select Class"
                selectedKeys={selectedClassId ? [selectedClassId] : []}
                onSelectionChange={keys => setSelectedClassId([...keys][0] || '')}
                variant="bordered"
                className="flex-1"
                classNames={{ trigger: 'border-border-token' }}
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
              <p className="text-xs font-medium text-fg-muted mb-2">Subjects (edit to customize)</p>
              <div className="flex flex-wrap gap-2 items-center">
                {subjects.map((s, i) => (
                  <div key={`subject-edit-${i}`} className="flex items-center gap-1">
                    <DSInput
                      size="sm"
                      value={s}
                      onChange={e => setSubjects(prev => prev.map((x, j) => j === i ? e.target.value : x))}
                      wrapperClassName="w-28"
                      aria-label={`Subject ${i + 1} name`}
                    />
                    <button
                      type="button"
                      onClick={() => setSubjects(prev => prev.filter((_, j) => j !== i))}
                      className="text-fg-faint hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 rounded"
                      aria-label={`Remove subject ${i + 1}`}
                    >×</button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setSubjects(prev => [...prev, ''])}
                  className="text-xs text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 rounded px-1"
                >+ Add</button>
              </div>
            </div>

            {/* Bulk entry table */}
            {students.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-border-token">
                <table className="w-full text-xs">
                  <thead className="bg-surface-2">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-fg-muted sticky left-0 bg-surface-2">Student</th>
                      {subjects.filter(s => s.trim()).map(subj => (
                        <th key={subj} colSpan={2} className="text-center px-2 py-2 font-medium text-fg-muted border-l border-divider">
                          {subj}
                        </th>
                      ))}
                    </tr>
                    <tr className="border-b border-border-token">
                      <th className="sticky left-0 bg-surface-2" />
                      {subjects.filter(s => s.trim()).map(subj => (
                        <Fragment key={subj}>
                          <th className="text-center px-2 py-1 text-fg-faint font-normal border-l border-divider">Theory</th>
                          <th className="text-center px-2 py-1 text-fg-faint font-normal">Practical</th>
                        </Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, si) => {
                      const sid = s._id || s.id;
                      return (
                        <tr key={sid} className={`border-b border-divider ${si % 2 === 0 ? 'bg-surface' : 'bg-surface-2'}`}>
                          <td className="px-3 py-1.5 font-medium text-fg sticky left-0 bg-inherit">
                            {s.name}
                            <span className="text-fg-faint ml-1">({s.rollNo || s.admissionId})</span>
                          </td>
                          {subjects.filter(subj => subj.trim()).map(subj => (
                            <Fragment key={`${sid}-${subj}`}>
                              <td className="px-1 py-1 border-l border-divider">
                                <DSInput
                                  size="sm"
                                  type="number" min={0} max={100}
                                  value={marks[sid]?.[subj]?.theoryMarks ?? ''}
                                  onChange={e => updateMark(sid, subj, 'theoryMarks', e.target.value)}
                                  wrapperClassName="w-20"
                                  aria-label={`${s.name} ${subj} theory marks`}
                                />
                              </td>
                              <td className="px-1 py-1">
                                <DSInput
                                  size="sm"
                                  type="number" min={0} max={100}
                                  value={marks[sid]?.[subj]?.practicalMarks ?? ''}
                                  onChange={e => updateMark(sid, subj, 'practicalMarks', e.target.value)}
                                  wrapperClassName="w-20"
                                  aria-label={`${s.name} ${subj} practical marks`}
                                />
                              </td>
                            </Fragment>
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
  const { currentAcademicYear, schoolSettings } = useApp();
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

  // Rely on @media print rules in academics.css — much cleaner than
  // a popup window since print styles already hide chrome (.no-print)
  // and reformat the report card to A4 portrait.
  const handlePrint = useCallback(() => {
    if (!printRef.current) return;
    window.print();
  }, []);

  const reportCard = result?.reportCards?.[0] || result?.reportCard;
  const attendancePct =
    reportCard?.attendance?.workingDays
      ? Math.round((reportCard.attendance.daysPresent / reportCard.attendance.workingDays) * 100)
      : null;

  return (
    <div className="animate-fade-in">
      <div className="mb-4 no-print">
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
          <Card shadow="sm" className="bg-surface border border-border-token no-print">
            <CardBody className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  label="Admission Number"
                  placeholder={t('academics.admissionNumberPlaceholder')}
                  value={admissionNo}
                  onChange={e => setAdmissionNo(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  variant="bordered"
                  startContent={<Search size={16} className="text-fg-faint" />}
                  classNames={{ input: 'text-fg', inputWrapper: 'border-border-token' }}
                  className="flex-1"
                />
                <Select
                  label="Term"
                  selectedKeys={[term]}
                  onSelectionChange={keys => setTerm([...keys][0] || 'term_1')}
                  variant="bordered"
                  className="w-40"
                  classNames={{ trigger: 'border-border-token' }}
                >
                  <SelectItem key="term_1" value="term_1">Term 1</SelectItem>
                  <SelectItem key="term_2" value="term_2">Term 2</SelectItem>
                </Select>
                <Button
                  className="bg-accent text-accent-fg self-end"
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
            <div className="space-y-4">
              {/* Screen-only action bar */}
              <div className="flex items-center justify-between no-print">
                <div>
                  <h2 className="text-lg font-semibold text-fg">{result.student?.name}</h2>
                  <p className="text-sm text-fg-muted">
                    Adm: {result.student?.admissionNo} · Roll: {result.student?.rollNo} · Class: {result.student?.className}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="flat"
                    size="sm"
                    color="primary"
                    startContent={<Plus size={14} />}
                    onPress={markEntryDisclosure.onOpen}
                  >
                    Enter Marks
                  </Button>
                  <Button
                    variant="bordered"
                    size="sm"
                    startContent={<Printer size={14} />}
                    className="border-border-token text-fg"
                    onPress={handlePrint}
                    isDisabled={!reportCard}
                  >
                    Print / PDF
                  </Button>
                </div>
              </div>

              {!reportCard ? (
                <EmptyState
                  icon={FileText}
                  title="No CBSE report card found for this term"
                  size="md"
                  action={
                    <Button
                      color="primary"
                      size="sm"
                      startContent={<Plus size={14} />}
                      onPress={markEntryDisclosure.onOpen}
                    >
                      Enter Marks Now
                    </Button>
                  }
                />
              ) : (
                <div className="report-card" ref={printRef}>
                  {/* School branding header */}
                  <div className="report-card__brand">
                    {schoolSettings?.logo ? (
                      <img src={schoolSettings.logo} alt="" className="report-card__logo" />
                    ) : (
                      <div className="report-card__logo report-card__photo--placeholder">Logo</div>
                    )}
                    <div className="report-card__brand-text">
                      <div className="report-card__school">{schoolSettings?.name || 'School Name'}</div>
                      {schoolSettings?.address && (
                        <div className="report-card__address">{schoolSettings.address}</div>
                      )}
                      <div className="report-card__board">
                        {schoolSettings?.boardOfEducation || 'CBSE'}
                        {schoolSettings?.affiliationNo ? ` · Affiliation No: ${schoolSettings.affiliationNo}` : ''}
                        {schoolSettings?.udiseNo ? ` · UDISE: ${schoolSettings.udiseNo}` : ''}
                      </div>
                    </div>
                    {result.student?.photo ? (
                      <img src={result.student.photo} alt="" className="report-card__photo" />
                    ) : (
                      <div className="report-card__photo report-card__photo--placeholder">Student Photo</div>
                    )}
                  </div>

                  <div className="report-card__title">
                    Progress Report — {term?.replace(/_/g, ' ')} · {result.student?.academicYear || currentAcademicYear}
                  </div>

                  {/* Student meta grid */}
                  <div className="report-card__meta">
                    <div className="report-card__meta-row">
                      <span className="report-card__meta-label">Name</span>
                      <span className="report-card__meta-value">{result.student?.name || '—'}</span>
                    </div>
                    <div className="report-card__meta-row">
                      <span className="report-card__meta-label">Admission No.</span>
                      <span className="report-card__meta-value">{result.student?.admissionNo || '—'}</span>
                    </div>
                    <div className="report-card__meta-row">
                      <span className="report-card__meta-label">Roll No.</span>
                      <span className="report-card__meta-value">{result.student?.rollNo || '—'}</span>
                    </div>
                    <div className="report-card__meta-row">
                      <span className="report-card__meta-label">Class</span>
                      <span className="report-card__meta-value">{result.student?.className || '—'}</span>
                    </div>
                    <div className="report-card__meta-row">
                      <span className="report-card__meta-label">Parent / Guardian</span>
                      <span className="report-card__meta-value">
                        {result.student?.fatherName || result.student?.guardianName || '—'}
                      </span>
                    </div>
                    <div className="report-card__meta-row">
                      <span className="report-card__meta-label">Date of Birth</span>
                      <span className="report-card__meta-value">{result.student?.dateOfBirth || '—'}</span>
                    </div>
                    <div className="report-card__meta-row">
                      <span className="report-card__meta-label">Academic Year</span>
                      <span className="report-card__meta-value">
                        {result.student?.academicYear || currentAcademicYear}
                      </span>
                    </div>
                    <div className="report-card__meta-row">
                      <span className="report-card__meta-label">Term</span>
                      <span className="report-card__meta-value">{term?.replace(/_/g, ' ')}</span>
                    </div>
                  </div>

                  {/* Scholastic */}
                  {reportCard.scholasticGrades?.length > 0 && (
                    <div className="report-card__section">
                      <h3 className="report-card__section-title">Scholastic Areas</h3>
                      <table className="report-card__table">
                        <thead>
                          <tr>
                            <th>Subject</th>
                            <th className="num">Theory</th>
                            <th className="num">Practical</th>
                            <th className="num">Total</th>
                            <th className="num">Grade</th>
                            <th className="num">Grade Pt</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportCard.scholasticGrades.map((subj, i) => (
                            <tr key={subj.subjectName || `scholastic-${i}`}>
                              <td>{subj.subjectName}</td>
                              <td className="num">{subj.theoryMarks ?? '—'}</td>
                              <td className="num">{subj.practicalMarks ?? '—'}</td>
                              <td className="num"><strong>{subj.totalMarks ?? '—'}</strong></td>
                              <td className="num">
                                <span className={gradePillClass(subj.grade)}>{subj.grade || '—'}</span>
                              </td>
                              <td className="num">{subj.gradePoint ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {reportCard.cgpa != null && (
                        <div className="report-card__summary">
                          <div className="dp-metric">
                            <span className="dp-metric__label">CGPA</span>
                            <span className="dp-metric__value tnum">{reportCard.cgpa}</span>
                          </div>
                          {reportCard.percentage != null && (
                            <div className="dp-metric">
                              <span className="dp-metric__label">Percentage</span>
                              <span className="dp-metric__value tnum">{reportCard.percentage}%</span>
                            </div>
                          )}
                          {reportCard.overallGrade && (
                            <div className="dp-metric">
                              <span className="dp-metric__label">Overall Grade</span>
                              <span className="dp-metric__value">
                                <span className={gradePillClass(reportCard.overallGrade)}>
                                  {reportCard.overallGrade}
                                </span>
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Co-scholastic */}
                  {reportCard.coScholasticGrades?.length > 0 && (
                    <div className="report-card__section">
                      <h3 className="report-card__section-title">Co-Scholastic Areas</h3>
                      <table className="report-card__table">
                        <thead>
                          <tr>
                            <th>Area</th>
                            <th>Activity</th>
                            <th className="num">Grade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportCard.coScholasticGrades.map((item, i) => (
                            <tr key={item.area || `coscholastic-${i}`}>
                              <td>{item.area}</td>
                              <td>{item.activity || '—'}</td>
                              <td className="num">
                                <span className={gradePillClass(item.grade)}>{item.grade || '—'}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Attendance */}
                  {reportCard.attendance && (
                    <div className="report-card__section">
                      <h3 className="report-card__section-title">Attendance</h3>
                      <div className="report-card__summary">
                        <div className="dp-metric">
                          <span className="dp-metric__label">Working Days</span>
                          <span className="dp-metric__value tnum">{reportCard.attendance.workingDays ?? '—'}</span>
                        </div>
                        <div className="dp-metric">
                          <span className="dp-metric__label">Days Present</span>
                          <span className="dp-metric__value tnum">{reportCard.attendance.daysPresent ?? '—'}</span>
                        </div>
                        <div className="dp-metric">
                          <span className="dp-metric__label">Attendance</span>
                          <span className={`dp-metric__value tnum ${
                            attendancePct == null ? '' :
                            attendancePct >= 90 ? 'dp-metric__value--ok' :
                            attendancePct >= 75 ? '' : 'dp-metric__value--warn'
                          }`}>
                            {attendancePct != null ? `${attendancePct}%` : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {reportCard.classTeacherRemark && (
                    <div className="report-card__section">
                      <h3 className="report-card__section-title">Class Teacher's Remarks</h3>
                      <p style={{ fontSize: '12.5px', color: 'var(--fg)', lineHeight: 1.5 }}>
                        {reportCard.classTeacherRemark}
                      </p>
                    </div>
                  )}

                  {/* Signatures */}
                  <div className="report-card__signatures">
                    <div className="report-card__signature">Class Teacher</div>
                    <div className="report-card__signature">
                      {schoolSettings?.principalSignature && (
                        <img src={schoolSettings.principalSignature} alt="" />
                      )}
                      Principal
                    </div>
                    <div className="report-card__signature">Parent / Guardian</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!loading && !result && (
            <EmptyState
              icon={FileText}
              title="Search for a student to view their CBSE report card"
              size="lg"
            />
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
          academicYear={result?.student?.academicYear || currentAcademicYear}
          term={term}
          onSaved={handleSearch}
        />
      )}

      {/* Bulk Entry Modal */}
      <BulkMarkEntryModal
        isOpen={bulkDisclosure.isOpen}
        onClose={bulkDisclosure.onClose}
        term={term}
        academicYear={currentAcademicYear}
      />
    </div>
  );
}
