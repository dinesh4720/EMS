import { useState, useEffect, useCallback } from 'react';
import {
  Card, CardBody, Chip, Button, Select, SelectItem, Checkbox,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Breadcrumbs, BreadcrumbItem, Tabs, Tab, Input,
} from '@heroui/react';
import {
  ArrowUpCircle, Home, CheckCircle, XCircle, AlertTriangle, Users,
  Clock, RotateCcw, History,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { request } from '../../services/api';
import { PageLayout } from '../../components/ui';
import toast from 'react-hot-toast';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { formatDateTime } from '../../utils/dateFormatter';
import { useTranslation } from 'react-i18next';

function currentAcademicYear() {
  const now = new Date();
  const yr = now.getFullYear();
  return now.getMonth() >= 3 ? `${yr}-${String(yr + 1).slice(-2)}` : `${yr - 1}-${String(yr).slice(-2)}`;
}

export default function StudentPromotionPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('promote');

  // ── Promote tab ─────────────────────────────────────────────────────────────
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [targetClassId, setTargetClassId] = useState('');
  const [fromAcadYear, setFromAcadYear] = useState(currentAcademicYear());
  const [toAcadYear, setToAcadYear] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [result, setResult] = useState(null);

  // ── History tab ──────────────────────────────────────────────────────────────
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [rollbackRecord, setRollbackRecord] = useState(null);
  const [rollbackReason, setRollbackReason] = useState('');
  const [rollingBack, setRollingBack] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await request('/classes');
        setClasses(res?.classes || res || []);
      } catch {
        toast.error('Failed to load classes');
      }
    })();
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await request('/promotions/records');
      setHistory(res?.records || []);
    } catch {
      toast.error('Failed to load promotion history');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'history') fetchHistory();
  }, [activeTab, fetchHistory]);

  const handlePreview = async () => {
    if (!classId) { toast.error('Select a class'); return; }
    setLoading(true);
    setPreview(null);
    setSelectedIds(new Set());
    try {
      const res = await request(`/promotions/preview?classId=${classId}`);
      const students = res?.students || res || [];
      setPreview(students);
      const eligible = students.filter(s => !s.blocked).map(s => String(s.studentId || s._id));
      setSelectedIds(new Set(eligible));
    } catch {
      toast.error('Failed to load promotion preview');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(String(id))) next.delete(String(id));
      else next.add(String(id));
      return next;
    });
  };

  const handlePromote = async () => {
    if (!targetClassId) { toast.error('Select a target class'); return; }
    if (!toAcadYear.trim()) { toast.error('Enter the target academic year'); return; }
    if (selectedIds.size === 0) { toast.error('Select at least one student'); return; }
    setPromoting(true);
    try {
      const studentDecisions = (preview || [])
        .filter(s => selectedIds.has(String(s.studentId || s._id)))
        .map(s => ({
          studentId: String(s.studentId || s._id),
          decision: 'promoted',
          toClassId: targetClassId,
        }));

      const res = await request('/promotions/execute', {
        method: 'POST',
        body: JSON.stringify({
          fromAcademicYear: fromAcadYear,
          toAcademicYear: toAcadYear,
          studentDecisions,
          generateRollNumbers: false,
        }),
      });
      setResult(res);
      setConfirmOpen(false);
      toast.success(`Promoted ${res?.summary?.promoted ?? selectedIds.size} students`);
      setPreview(null);
      setSelectedIds(new Set());
    } catch (e) {
      toast.error(e?.message || 'Promotion failed');
    } finally {
      setPromoting(false);
    }
  };

  const openRollback = (rec) => {
    setRollbackRecord(rec);
    setRollbackReason('');
    setRollbackOpen(true);
  };

  const handleRollback = async () => {
    if (!rollbackRecord) return;
    setRollingBack(true);
    try {
      await request(`/promotions/rollback/${rollbackRecord._id}`, {
        method: 'POST',
        body: JSON.stringify({ reason: rollbackReason || undefined }),
      });
      toast.success('Promotion rolled back successfully');
      setRollbackOpen(false);
      setRollbackRecord(null);
      fetchHistory();
    } catch (e) {
      toast.error(e?.message || 'Rollback failed');
    } finally {
      setRollingBack(false);
    }
  };

  const currentClass = classes.find(c => c._id === classId);
  const allSelected = preview?.length > 0 && selectedIds.size === (preview.filter(s => !s.blocked).length || 0);

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <Breadcrumbs size="sm">
          <BreadcrumbItem startContent={<Home size={14} />} onPress={() => navigate('/')}>Home</BreadcrumbItem>
          <BreadcrumbItem onPress={() => navigate('/students')}>Students</BreadcrumbItem>
          <BreadcrumbItem>Bulk Promotion</BreadcrumbItem>
        </Breadcrumbs>
      </div>

      <PageLayout
        header={{ title: 'Student Bulk Promotion', description: 'Review promotion eligibility and promote students to the next class' }}
        noPadding
      >
        <div className="p-6 space-y-5">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(k) => setActiveTab(k)}
            variant="underlined"
            classNames={{
              tabList: 'border-b border-gray-100 dark:border-zinc-800 w-full gap-4',
              cursor: 'bg-gray-900 dark:bg-zinc-100',
            }}
          >
            <Tab
              key="promote"
              title={
                <div className="flex items-center gap-2">
                  <ArrowUpCircle size={15} />
                  <span>Promote Students</span>
                </div>
              }
            />
            <Tab
              key="history"
              title={
                <div className="flex items-center gap-2">
                  <History size={15} />
                  <span>History</span>
                </div>
              }
            />
          </Tabs>

          {/* ── Promote tab ───────────────────────────────────────────────────── */}
          {activeTab === 'promote' && (
            <>
              <Card shadow="sm" className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800">
                <CardBody className="p-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Select
                      label="Source Class"
                      placeholder={t('students.form.selectSourceClassPlaceholder')}
                      selectedKeys={classId ? [classId] : []}
                      onSelectionChange={keys => { setClassId([...keys][0] || ''); setPreview(null); }}
                      variant="bordered"
                      className="flex-1"
                      classNames={{ trigger: 'dark:border-zinc-700' }}
                    >
                      {classes.map(c => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.name}{c.section ? ` (${c.section})` : ''}
                        </SelectItem>
                      ))}
                    </Select>
                    <Button
                      className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 self-end"
                      onPress={handlePreview}
                      isLoading={loading}
                      isDisabled={!classId}
                    >
                      Load Students
                    </Button>
                  </div>
                </CardBody>
              </Card>

              {result && (
                <Card shadow="sm" className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                  <CardBody className="p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Promotion complete. {result?.summary?.promoted ?? 0} students promoted, {result?.summary?.errors ?? 0} failed.
                      </p>
                    </div>
                  </CardBody>
                </Card>
              )}

              {loading && <TablePageSkeleton />}

              {!loading && preview && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-zinc-400">Total Students</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-zinc-100">{preview.length}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950 border border-green-100 dark:border-green-900 rounded-lg p-3">
                      <p className="text-xs text-green-600 dark:text-green-400">Eligible</p>
                      <p className="text-xl font-semibold text-green-700 dark:text-green-300">{preview.filter(s => !s.blocked).length}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-900 rounded-lg p-3">
                      <p className="text-xs text-red-600 dark:text-red-400">Blocked</p>
                      <p className="text-xl font-semibold text-red-700 dark:text-red-300">{preview.filter(s => s.blocked).length}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
                        {selectedIds.size} of {preview.filter(s => !s.blocked).length} eligible selected
                      </p>
                      <button
                        onClick={() => {
                          if (allSelected) setSelectedIds(new Set());
                          else setSelectedIds(new Set(preview.filter(s => !s.blocked).map(s => String(s.studentId || s._id))));
                        }}
                        className="text-xs text-blue-500 hover:underline"
                      >
                        {allSelected ? 'Deselect all' : 'Select all eligible'}
                      </button>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {preview.map(s => {
                        const sid = String(s.studentId || s._id);
                        const isBlocked = s.blocked;
                        const isSelected = selectedIds.has(sid);
                        return (
                          <div
                            key={sid}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                              isBlocked
                                ? 'bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900 opacity-70'
                                : isSelected
                                  ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
                                  : 'bg-gray-50 dark:bg-zinc-900 border-gray-100 dark:border-zinc-800'
                            }`}
                          >
                            <Checkbox
                              isSelected={isSelected && !isBlocked}
                              isDisabled={isBlocked}
                              onChange={() => !isBlocked && toggleSelect(sid)}
                              size="sm"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{s.name}</p>
                              <p className="text-xs text-gray-500 dark:text-zinc-400">
                                Roll: {s.rollNo || '—'} · Adm: {s.admissionId || '—'}
                                {s.attendancePercent != null && ` · Attendance: ${s.attendancePercent}%`}
                                {s.feeStatus && ` · Fee: ${s.feeStatus}`}
                              </p>
                            </div>
                            {isBlocked ? (
                              <div className="flex items-center gap-1 shrink-0">
                                <XCircle size={14} className="text-red-500" />
                                <span className="text-xs text-red-600 dark:text-red-400">{s.blockedReason || 'Blocked'}</span>
                              </div>
                            ) : (
                              <CheckCircle size={14} className="text-green-500 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {selectedIds.size > 0 && (
                    <div className="flex justify-end pt-2">
                      <Button
                        className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                        startContent={<ArrowUpCircle size={16} />}
                        onPress={() => setConfirmOpen(true)}
                      >
                        Promote {selectedIds.size} Students
                      </Button>
                    </div>
                  )}
                </>
              )}

              {!loading && !preview && !result && (
                <div className="text-center py-16">
                  <Users size={48} className="mx-auto mb-4 text-gray-200 dark:text-zinc-700" />
                  <p className="text-gray-500 dark:text-zinc-400">Select a class and click "Load Students" to preview promotion eligibility</p>
                </div>
              )}
            </>
          )}

          {/* ── History tab ───────────────────────────────────────────────────── */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {historyLoading ? (
                <TablePageSkeleton />
              ) : history.length === 0 ? (
                <div className="text-center py-16">
                  <Clock size={48} className="mx-auto mb-4 text-gray-200 dark:text-zinc-700" />
                  <p className="text-gray-500 dark:text-zinc-400">No promotion records found</p>
                </div>
              ) : (
                history.map(rec => (
                  <Card key={rec._id} shadow="sm" className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800">
                    <CardBody className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                              {rec.fromAcademicYear} → {rec.toAcademicYear}
                            </p>
                            <Chip
                              size="sm"
                              variant="flat"
                              className={rec.status === 'rolledback'
                                ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                                : 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                              }
                            >
                              {rec.status === 'rolledback' ? 'Rolled back' : 'Completed'}
                            </Chip>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-zinc-400">
                            {formatDateTime(rec.createdAt)} ·{' '}
                            {rec.summary?.promoted ?? 0} promoted · {rec.summary?.detained ?? 0} detained · {rec.summary?.errors ?? 0} failed
                          </p>
                          {rec.status === 'rolledback' && rec.rollbackReason && (
                            <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">Reason: {rec.rollbackReason}</p>
                          )}
                        </div>
                        {rec.status !== 'rolledback' && (
                          <Button
                            size="sm"
                            variant="flat"
                            color="danger"
                            startContent={<RotateCcw size={13} />}
                            onPress={() => openRollback(rec)}
                            className="shrink-0"
                          >
                            Rollback
                          </Button>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </PageLayout>

      {/* Confirm Promote Modal */}
      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        size="md"
        classNames={{ backdrop: 'bg-black/30', base: 'bg-white dark:bg-zinc-950' }}
      >
        <ModalContent>
          <ModalHeader className="border-b border-gray-100 dark:border-zinc-800 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-950 rounded-lg">
                <AlertTriangle size={20} className="text-yellow-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100">Confirm Bulk Promotion</h3>
            </div>
          </ModalHeader>
          <ModalBody className="py-4 space-y-4">
            <p className="text-sm text-gray-600 dark:text-zinc-300">
              You are about to promote <strong>{selectedIds.size} students</strong> from{' '}
              <strong>{currentClass?.name}{currentClass?.section ? ` (${currentClass.section})` : ''}</strong>.
            </p>
            <Select
              label="Promote To (Target Class) *"
              placeholder={t('students.form.selectTargetClassPlaceholder')}
              selectedKeys={targetClassId ? [targetClassId] : []}
              onSelectionChange={keys => setTargetClassId([...keys][0] || '')}
              variant="bordered"
              classNames={{ trigger: 'dark:border-zinc-700' }}
            >
              {classes.filter(c => c._id !== classId).map(c => (
                <SelectItem key={c._id} value={c._id}>
                  {c.name}{c.section ? ` (${c.section})` : ''}
                </SelectItem>
              ))}
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="From Academic Year *"
                placeholder={t('students.form.academicYearPlaceholder')}
                value={fromAcadYear}
                onValueChange={setFromAcadYear}
                variant="bordered"
                size="sm"
              />
              <Input
                label="To Academic Year *"
                placeholder={t('students.form.academicYearPlaceholder')}
                value={toAcadYear}
                onValueChange={setToAcadYear}
                variant="bordered"
                size="sm"
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-zinc-500">
              This will update the classId for all selected students. Fee structures and timetables for the new class will apply.
            </p>
          </ModalBody>
          <ModalFooter className="border-t border-gray-100 dark:border-zinc-800">
            <Button variant="light" onPress={() => setConfirmOpen(false)}>Cancel</Button>
            <Button
              className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
              onPress={handlePromote}
              isLoading={promoting}
              isDisabled={!targetClassId || !toAcadYear.trim()}
            >
              Confirm & Promote
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Rollback Confirmation Modal */}
      <Modal
        isOpen={rollbackOpen}
        onClose={() => setRollbackOpen(false)}
        size="sm"
        classNames={{ backdrop: 'bg-black/30', base: 'bg-white dark:bg-zinc-950' }}
      >
        <ModalContent>
          <ModalHeader className="border-b border-gray-100 dark:border-zinc-800 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-950 rounded-lg">
                <RotateCcw size={18} className="text-red-600" />
              </div>
              <h3 className="text-base font-medium text-gray-900 dark:text-zinc-100">Rollback Promotion</h3>
            </div>
          </ModalHeader>
          <ModalBody className="py-4 space-y-3">
            {rollbackRecord && (
              <p className="text-sm text-gray-600 dark:text-zinc-300">
                Roll back <strong>{rollbackRecord.fromAcademicYear} → {rollbackRecord.toAcademicYear}</strong>?{' '}
                This will restore <strong>{rollbackRecord.summary?.promoted ?? 0} students</strong> to their previous classes.
              </p>
            )}
            <Input
              label="Reason (optional)"
              placeholder={t('students.form.rollbackReasonPlaceholder')}
              value={rollbackReason}
              onValueChange={setRollbackReason}
              variant="bordered"
              size="sm"
            />
            <p className="text-xs text-red-500 dark:text-red-400">
              This cannot be undone. Students will be moved back to their original classes and fee structures.
            </p>
          </ModalBody>
          <ModalFooter className="border-t border-gray-100 dark:border-zinc-800">
            <Button variant="light" onPress={() => setRollbackOpen(false)}>Cancel</Button>
            <Button
              color="danger"
              onPress={handleRollback}
              isLoading={rollingBack}
            >
              Confirm Rollback
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
