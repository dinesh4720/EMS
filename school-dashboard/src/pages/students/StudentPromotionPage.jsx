import { useState, useEffect, useCallback } from 'react';
import {
  Card, Button, Input, Modal,
} from '../../components/ui';
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
import Breadcrumbs from '../../components/ui/Breadcrumbs';

// Wizard steps
import StepAcademicYear from './promotion/StepAcademicYear';
import StepClassMapping from './promotion/StepClassMapping';
import StepStudentReview from './promotion/StepStudentReview';
import StepConfirm from './promotion/StepConfirm';
import StepResults from './promotion/StepResults';
import '../../styles/student.css';

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

  // Bug-fix license: warn if the user is mid-wizard and switches tabs
  // (students stuck mid-promotion). The state stays in memory, but a hint
  // helps prevent accidental abandonment.
  const switchTab = (key) => {
    if (key === 'history' && step > 0 && step < 4 && wizardState.fromYear) {
      const ok = window.confirm(
        'You have a promotion in progress. Switching tabs will keep your selections but pause the flow. Continue?'
      );
      if (!ok) return;
    }
    setActiveTab(key);
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
      await promotionApi.rollback(rollbackRecord._id, { reason: rollbackReason || undefined });
      toast.success('Promotion rolled back successfully');
      setRollbackOpen(false);
      setRollbackRecord(null);
      fetchHistory();
    } catch (e) {
      // Edge: server returned 409 because students were already partly moved
      // back. Surface the message instead of a generic failure toast.
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
    <div className="animate-fade-in promo-page">
      <Breadcrumbs
        size="sm"
        items={[
          { label: 'Home', href: '/', icon: <Home size={14} /> },
          { label: 'Students', href: '/students' },
          { label: 'Year-End Promotion' },
        ]}
      />

      <PageLayout
        header={{
          title: 'Year-End Promotion',
          description: 'Promote students across all classes for the new academic year',
        }}
        noPadding
      >
        <div className="p-6 space-y-5">
          {/* Segmented tabs (mono tnum count for history) */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="promo-tabs" role="tablist" aria-label="Promotion sections">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'promote'}
                onClick={() => switchTab('promote')}
                className={`promo-tab ${activeTab === 'promote' ? 'is-active' : ''}`}
              >
                <ArrowUpCircle size={13} />
                <span>Promote Students</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'history'}
                onClick={() => switchTab('history')}
                className={`promo-tab ${activeTab === 'history' ? 'is-active' : ''}`}
              >
                <History size={13} />
                <span>History</span>
                {history.length > 0 && (
                  <span className="promo-tab__count">{history.length}</span>
                )}
              </button>
            </div>
          </div>

          {/* ── Promote tab — Wizard ──────────────────────────────────────────── */}
          {activeTab === 'promote' && (
            <>
              {/* Step rail */}
              <nav className="steprail" aria-label="Promotion steps">
                {STEPS.map((s, idx) => {
                  const Icon = s.icon;
                  const isActive = idx === step;
                  const isDone = idx < step;
                  const isLast = idx === STEPS.length - 1;
                  const cls = isActive ? 'is-active' : isDone ? 'is-done' : '';

                  return (
                    <div key={s.key} style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <button
                        type="button"
                        className={`steprail__step ${cls}`}
                        onClick={() => isDone && setStep(idx)}
                        disabled={!isDone && !isActive}
                        aria-current={isActive ? 'step' : undefined}
                      >
                        <span className="steprail__num">
                          {isDone ? <CheckCircle size={10} /> : <Icon size={10} />}
                        </span>
                        <span className="steprail__label">{s.label}</span>
                      </button>
                      {!isLast && (
                        <span className={`steprail__sep ${isDone ? 'is-done' : ''}`} aria-hidden />
                      )}
                    </div>
                  );
                })}
              </nav>

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
                  <Clock size={48} className="mx-auto mb-4 text-fg-faint" />
                  <p className="text-fg-muted">No promotion records found</p>
                </div>
              ) : (
                history.map((rec) => {
                  const isRolledback = rec.status === 'rolledback';
                  return (
                    <Card key={rec._id} className="bg-surface border border-border-token">
                      <Card.Content className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-fg mono tnum">
                                {rec.fromAcademicYear} &rarr; {rec.toAcademicYear}
                              </p>
                              <span className={`chip ${isRolledback ? 'chip--danger' : 'chip--ok'}`}>
                                {isRolledback ? 'Rolled back' : 'Completed'}
                              </span>
                            </div>
                            <p className="text-xs text-fg-muted">
                              {formatDateTime(rec.createdAt)} ·{' '}
                              <span className="mono tnum">{rec.summary?.promoted ?? 0}</span> promoted ·{' '}
                              <span className="mono tnum">{rec.summary?.detained ?? 0}</span> detained ·{' '}
                              <span className="mono tnum">{rec.summary?.graduated ?? 0}</span> graduated ·{' '}
                              <span className="mono tnum">{rec.summary?.errors ?? 0}</span> failed
                            </p>
                            {isRolledback && rec.rollbackReason && (
                              <p className="text-xs text-[var(--danger)] mt-0.5">
                                Reason: {rec.rollbackReason}
                              </p>
                            )}
                          </div>
                          {!isRolledback && (
                            <Button
                              size="sm"
                              variant="danger"
                              icon={<RotateCcw size={13} />}
                              onClick={() => openRollback(rec)}
                              className="shrink-0"
                            >
                              Rollback
                            </Button>
                          )}
                        </div>
                      </Card.Content>
                    </Card>
                  );
                })
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
      >
        <Modal.Header className="border-b border-divider py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--danger-bg)] rounded-lg">
              <RotateCcw size={18} className="text-[var(--danger)]" />
            </div>
            <h3 className="text-base font-medium text-fg">Rollback Promotion</h3>
          </div>
        </Modal.Header>
        <Modal.Body className="py-4 space-y-3">
          {rollbackRecord && (
            <p className="text-sm text-fg-muted">
              Roll back <strong className="mono tnum">{rollbackRecord.fromAcademicYear} &rarr; {rollbackRecord.toAcademicYear}</strong>?{' '}
              This will restore <strong className="mono tnum">{rollbackRecord.summary?.promoted ?? 0}</strong> students to their previous classes.
            </p>
          )}
          <Input
            label="Reason (optional)"
            placeholder="Why are you rolling back?"
            value={rollbackReason}
            onChange={(e) => setRollbackReason(e.target.value)}
            size="sm"
          />
          <p className="text-xs text-[var(--danger)]">
            Students will be moved back to their original classes and fee structures will be reset.
          </p>
        </Modal.Body>
        <Modal.Footer className="border-t border-divider">
          <Button variant="ghost" size="sm" onClick={() => setRollbackOpen(false)}>Cancel</Button>
          <Button variant="danger" size="sm" onClick={handleRollback} loading={rollingBack}>
            Confirm Rollback
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
