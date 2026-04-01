import { useState, useEffect, useCallback } from 'react';
import {
  Card, CardBody, Chip, Button, Tabs, Tab, Input,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
} from '@heroui/react';
import {
  ArrowUpCircle, Home, CheckCircle, Clock, RotateCcw, History,
  Calendar, GitBranch, Users, ListChecks, Rocket,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { promotionApi } from '../../services/api/extensions';
import { PageLayout } from '../../components/ui';
import toast from 'react-hot-toast';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { formatDateTime } from '../../utils/dateFormatter';
import { BreadcrumbItem, Breadcrumbs } from '@heroui/react';

// Wizard steps
import StepAcademicYear from './promotion/StepAcademicYear';
import StepClassMapping from './promotion/StepClassMapping';
import StepStudentReview from './promotion/StepStudentReview';
import StepConfirm from './promotion/StepConfirm';
import StepResults from './promotion/StepResults';

const STEPS = [
  { key: 'year', label: 'Academic Year', icon: Calendar },
  { key: 'mapping', label: 'Class Mapping', icon: GitBranch },
  { key: 'review', label: 'Student Review', icon: Users },
  { key: 'confirm', label: 'Confirm', icon: ListChecks },
  { key: 'results', label: 'Results', icon: Rocket },
];

export default function StudentPromotionPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('promote');

  // ── Wizard state ─────────────────────────────────────────────────────────
  const [step, setStep] = useState(0);
  const [wizardState, setWizardState] = useState({
    fromYear: '',
    toYear: '',
    rules: null,
    classMappings: [],
    targetClassOptions: [],
    summary: null,
    result: null,
  });

  // ── History tab ──────────────────────────────────────────────────────────
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [rollbackRecord, setRollbackRecord] = useState(null);
  const [rollbackReason, setRollbackReason] = useState('');
  const [rollingBack, setRollingBack] = useState(false);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await promotionApi.getRecords();
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

  const openRollback = (rec) => {
    setRollbackRecord(rec);
    setRollbackReason('');
    setRollbackOpen(true);
  };

  const handleRollback = async () => {
    if (!rollbackRecord) return;
    setRollingBack(true);
    try {
      await promotionApi.rollback(rollbackRecord._id, { reason: rollbackReason || undefined });
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

  const resetWizard = () => {
    setStep(0);
    setWizardState({
      fromYear: '',
      toYear: '',
      rules: null,
      classMappings: [],
      targetClassOptions: [],
      summary: null,
      result: null,
    });
  };

  const goToHistory = () => {
    setActiveTab('history');
    fetchHistory();
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <Breadcrumbs size="sm">
          <BreadcrumbItem startContent={<Home size={14} />} onPress={() => navigate('/')}>Home</BreadcrumbItem>
          <BreadcrumbItem onPress={() => navigate('/students')}>Students</BreadcrumbItem>
          <BreadcrumbItem>Year-End Promotion</BreadcrumbItem>
        </Breadcrumbs>
      </div>

      <PageLayout
        header={{
          title: 'Year-End Promotion',
          description: 'Promote students across all classes for the new academic year',
        }}
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

          {/* ── Promote tab — Wizard ──────────────────────────────────────────── */}
          {activeTab === 'promote' && (
            <>
              {/* Step indicator */}
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {STEPS.map((s, idx) => {
                  const Icon = s.icon;
                  const isActive = idx === step;
                  const isDone = idx < step;
                  const isLast = idx === STEPS.length - 1;

                  return (
                    <div key={s.key} className="flex items-center">
                      <button
                        onClick={() => idx < step && setStep(idx)}
                        disabled={idx >= step}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                            : isDone
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 cursor-pointer hover:bg-green-200'
                              : 'bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500'
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle size={13} />
                        ) : (
                          <Icon size={13} />
                        )}
                        <span className="hidden sm:inline">{s.label}</span>
                        <span className="sm:hidden">{idx + 1}</span>
                      </button>
                      {!isLast && (
                        <div className={`w-6 h-px mx-1 ${isDone ? 'bg-green-300 dark:bg-green-700' : 'bg-gray-200 dark:bg-zinc-700'}`} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Step content */}
              {step === 0 && (
                <StepAcademicYear
                  onNext={() => setStep(1)}
                  wizardState={wizardState}
                  setWizardState={setWizardState}
                />
              )}
              {step === 1 && (
                <StepClassMapping
                  onNext={() => setStep(2)}
                  onBack={() => setStep(0)}
                  wizardState={wizardState}
                  setWizardState={setWizardState}
                />
              )}
              {step === 2 && (
                <StepStudentReview
                  onNext={() => setStep(3)}
                  onBack={() => setStep(1)}
                  wizardState={wizardState}
                  setWizardState={setWizardState}
                />
              )}
              {step === 3 && (
                <StepConfirm
                  onNext={() => setStep(4)}
                  onBack={() => setStep(2)}
                  wizardState={wizardState}
                  setWizardState={setWizardState}
                />
              )}
              {step === 4 && (
                <StepResults
                  wizardState={wizardState}
                  onReset={resetWizard}
                  onGoToHistory={goToHistory}
                />
              )}
            </>
          )}

          {/* ── History tab ─────────────────────────────────────────────────── */}
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
                history.map((rec) => (
                  <Card key={rec._id} shadow="sm" className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800">
                    <CardBody className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                              {rec.fromAcademicYear} &rarr; {rec.toAcademicYear}
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
                            {formatDateTime(rec.createdAt)} &middot;{' '}
                            {rec.summary?.promoted ?? 0} promoted &middot;{' '}
                            {rec.summary?.detained ?? 0} detained &middot;{' '}
                            {rec.summary?.graduated ?? 0} graduated &middot;{' '}
                            {rec.summary?.errors ?? 0} failed
                          </p>
                          {rec.status === 'rolledback' && rec.rollbackReason && (
                            <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">
                              Reason: {rec.rollbackReason}
                            </p>
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
                Roll back <strong>{rollbackRecord.fromAcademicYear} &rarr; {rollbackRecord.toAcademicYear}</strong>?{' '}
                This will restore <strong>{rollbackRecord.summary?.promoted ?? 0} students</strong> to their previous classes.
              </p>
            )}
            <Input
              label="Reason (optional)"
              placeholder="Why are you rolling back?"
              value={rollbackReason}
              onChange={(e) => setRollbackReason(e.target.value)}
              variant="bordered"
              size="sm"
            />
            <p className="text-xs text-red-500 dark:text-red-400">
              Students will be moved back to their original classes and fee structures will be reset.
            </p>
          </ModalBody>
          <ModalFooter className="border-t border-gray-100 dark:border-zinc-800">
            <Button variant="light" onPress={() => setRollbackOpen(false)}>Cancel</Button>
            <Button color="danger" onPress={handleRollback} isLoading={rollingBack}>
              Confirm Rollback
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
