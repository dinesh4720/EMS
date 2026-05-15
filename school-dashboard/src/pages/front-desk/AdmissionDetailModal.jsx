import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { CheckCircle2, Circle, Clock, Edit, Printer, UserCheck } from 'lucide-react';
import { Alert, Button, Modal, SkeletonText } from '../../components/ui';
import { frontDeskApi } from '../../services/api';
import { formatShortDate, formatTime } from '../../utils/dateFormatter';
import logger from '../../utils/logger';
import {
  STAGE_OPTIONS,
  getStatusMeta,
  stageOfStatus,
} from './admissionsConstants';

const COLOR_TO_TONE = {
  success: 'ok',
  warning: 'warn',
  danger: 'danger',
  info: 'info',
  neutral: 'neutral',
};

const formatApplicationId = (a) => {
  if (a?.applicationId) return a.applicationId;
  const tail = String(a?._id || '').slice(-6).toUpperCase();
  return tail ? `ADM-${tail}` : 'ADM-—';
};

function Field({ label, value }) {
  return (
    <div>
      <div className="adm-detail__field-label">{label}</div>
      <div className="adm-detail__field-value">{value ?? '—'}</div>
    </div>
  );
}
Field.propTypes = { label: PropTypes.node.isRequired, value: PropTypes.node };

function TimelineStep({ step, isLast }) {
  const stateCls = step.isCompleted
    ? 'is-done'
    : step.isCurrent
    ? 'is-current'
    : '';
  return (
    <div className={`adm-timeline__step ${stateCls}`}>
      <div className="adm-timeline__dot">
        {step.isCompleted ? (
          <CheckCircle2 size={12} />
        ) : step.isCurrent ? (
          <Clock size={12} />
        ) : (
          <Circle size={10} />
        )}
      </div>
      <div>
        <div className="adm-timeline__label">{step.label}</div>
        {step.date && (
          <div className="adm-timeline__meta">
            {formatShortDate(step.date)}
            {step.date && formatTime(step.date) ? ` · ${formatTime(step.date)}` : ''}
          </div>
        )}
        {step.notes && (
          <div className="adm-timeline__meta" style={{ fontFamily: 'inherit' }}>
            {step.notes}
          </div>
        )}
      </div>
      {isLast ? null : null /* connector handled via CSS ::before */}
    </div>
  );
}
TimelineStep.propTypes = {
  step: PropTypes.shape({
    label: PropTypes.string,
    date: PropTypes.string,
    notes: PropTypes.string,
    isCompleted: PropTypes.bool,
    isCurrent: PropTypes.bool,
  }).isRequired,
  isLast: PropTypes.bool,
};

function PrintLayout({ admission }) {
  const status = getStatusMeta(admission.status);
  return (
    <div className="adm-print">
      <h1>Admission Application — {formatApplicationId(admission)}</h1>
      <div className="adm-print__grid">
        <div className="adm-print__label">Student name</div>
        <div>{admission.studentName || '—'}</div>
        <div className="adm-print__label">Date of birth</div>
        <div>{admission.dateOfBirth || '—'}</div>
        <div className="adm-print__label">Parent / guardian</div>
        <div>{admission.parentName || '—'}</div>
        <div className="adm-print__label">Phone</div>
        <div>{admission.phoneNumber || '—'}</div>
        <div className="adm-print__label">Email</div>
        <div>{admission.email || '—'}</div>
        <div className="adm-print__label">Class applying for</div>
        <div>{admission.classApplyingFor || '—'}</div>
        <div className="adm-print__label">Source</div>
        <div>{admission.source || '—'}</div>
        <div className="adm-print__label">Status</div>
        <div>{status.label}</div>
        <div className="adm-print__label">Decision</div>
        <div>{admission.admissionDecision || 'pending'}</div>
        <div className="adm-print__label">Payment</div>
        <div>
          {admission.paymentStatus === 'paid'
            ? `Paid${admission.paymentMode ? ` (${admission.paymentMode})` : ''}${admission.paymentAmount ? ` — ₹${admission.paymentAmount}` : ''}`
            : 'Unpaid'}
        </div>
      </div>
    </div>
  );
}
PrintLayout.propTypes = { admission: PropTypes.object.isRequired };

export default function AdmissionDetailModal({
  isOpen,
  onClose,
  admission,
  onEdit,
  onSaved,
}) {
  const { t } = useTranslation();
  const [trackerData, setTrackerData] = useState(null);
  const [loadingTracker, setLoadingTracker] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    if (!isOpen || !admission?._id) return undefined;
    let cancelled = false;
    setLoadingTracker(true);
    setTrackerData(null);
    frontDeskApi
      .getAdmissionTracker(admission._id)
      .then((data) => { if (!cancelled) setTrackerData(data); })
      .catch((err) => {
        logger.error('Failed to load admission tracker:', err);
      })
      .finally(() => { if (!cancelled) setLoadingTracker(false); });
    return () => { cancelled = true; };
  }, [isOpen, admission?._id]);

  if (!admission) return null;

  const status = getStatusMeta(admission.status);
  const toneKey = COLOR_TO_TONE[status.color] || 'neutral';
  const stageKey = stageOfStatus(admission.status);
  const stage = STAGE_OPTIONS.find((s) => s.key === stageKey);

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  const handleConvert = async () => {
    if (isConverting) return;
    setIsConverting(true);
    try {
      const data = await frontDeskApi.convertToStudent(admission._id);
      toast.success(data?.message || 'Student created successfully!');
      onSaved?.();
      onClose();
    } catch (err) {
      logger.error('Failed to convert to student:', err);
      toast.error(err?.message || 'Failed to convert to student');
    } finally {
      setIsConverting(false);
    }
  };

  const canConvert = admission.status === 'fee-paid';

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="3xl"
        scrollBehavior="inside"
        title={
          <span className="row gap-2" style={{ alignItems: 'center' }}>
            <span>{admission.studentName || 'Admission'}</span>
            <span className={`status status--${toneKey}`}>{status.label}</span>
            {stage && (
              <span className="status" style={{ fontSize: 10.5 }}>
                Stage: {stage.label}
              </span>
            )}
          </span>
        }
        description={
          <span className="mono tnum">{formatApplicationId(admission)}</span>
        }
        footer={
          <div className="row gap-2 adm-no-print" style={{ width: '100%' }}>
            <Button variant="ghost" onClick={onClose}>Close</Button>
            <div style={{ flex: 1 }} />
            <Button variant="secondary" onClick={handlePrint}>
              <Printer size={13} /> Print form
            </Button>
            {onEdit && (
              <Button variant="secondary" onClick={() => onEdit(admission)}>
                <Edit size={13} /> Edit
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleConvert}
              disabled={!canConvert || isConverting}
              title={!canConvert ? 'Available once fee is paid' : undefined}
            >
              <UserCheck size={13} />
              {isConverting ? 'Converting…' : 'Convert to student'}
            </Button>
          </div>
        }
      >
        <div className="adm-detail">
          <div className="adm-detail__main">
            <div className="adm-detail__grid" style={{ marginBottom: 18 }}>
              <Field label="Student name" value={admission.studentName} />
              <Field label="Date of birth" value={admission.dateOfBirth} />
              <Field label="Parent / guardian" value={admission.parentName} />
              <Field label="Phone" value={<span className="mono tnum">{admission.phoneNumber}</span>} />
              <Field label="Email" value={admission.email} />
              <Field
                label="Class applying for"
                value={
                  admission.classApplyingFor
                    ? (Number.isNaN(Number(admission.classApplyingFor))
                        ? admission.classApplyingFor
                        : `Class ${admission.classApplyingFor}`)
                    : '—'
                }
              />
              <Field label="Source" value={admission.source} />
              <Field
                label="Decision"
                value={
                  <span className={`status status--${admission.admissionDecision === 'approved' ? 'ok' : admission.admissionDecision === 'rejected' ? 'danger' : ''}`}>
                    {admission.admissionDecision || 'pending'}
                  </span>
                }
              />
              {admission.assessmentRequired && (
                <>
                  <Field
                    label="Assigned teacher"
                    value={admission.assignedTeacher?.name || '—'}
                  />
                  <Field
                    label="Test date & time"
                    value={
                      admission.testDate
                        ? `${admission.testDate}${admission.testTime ? ` ${admission.testTime}` : ''}`
                        : '—'
                    }
                  />
                  <Field
                    label="Test result"
                    value={
                      <span className={`status status--${admission.testResult === 'cleared' ? 'ok' : admission.testResult === 'failed' ? 'danger' : ''}`}>
                        {admission.testResult || 'pending'}
                      </span>
                    }
                  />
                </>
              )}
              <Field
                label="Payment"
                value={
                  admission.paymentStatus === 'paid' ? (
                    <span className="status status--ok">
                      Paid{admission.paymentMode ? ` (${admission.paymentMode})` : ''}
                      {admission.paymentAmount ? ` · ₹${admission.paymentAmount}` : ''}
                    </span>
                  ) : (
                    <span className="status status--warn">Unpaid</span>
                  )
                }
              />
              {admission.decisionRemarks && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <Field label="Decision remarks" value={admission.decisionRemarks} />
                </div>
              )}
            </div>

            {!canConvert && (
              <Alert variant="info" title="Conversion pending">
                {t('pages.admissionMustBeApprovedAndFeePaidBeforeAddingAsStudent')}
              </Alert>
            )}
          </div>

          <aside className="adm-detail__side">
            <div>
              <div className="adm-detail__field-label" style={{ marginBottom: 8 }}>
                Timeline
              </div>
              {loadingTracker && <SkeletonText lines={5} />}
              {!loadingTracker && trackerData?.timeline?.length > 0 && (
                <div className="adm-timeline">
                  {trackerData.timeline.map((step, idx) => (
                    <TimelineStep
                      key={step.status || idx}
                      step={step}
                      isLast={idx === trackerData.timeline.length - 1}
                    />
                  ))}
                </div>
              )}
              {!loadingTracker && (!trackerData || !trackerData.timeline?.length) && (
                <div className="subtle" style={{ fontSize: 12 }}>
                  No timeline data yet.
                </div>
              )}
            </div>
          </aside>
        </div>
      </Modal>

      {/* Print-only render — appears outside the modal's portal so the
          browser print dialog has a clean A4 page. Hidden on screen via
          CSS, shown only inside @media print. */}
      <div className="adm-print-only">
        <PrintLayout admission={admission} />
      </div>
    </>
  );
}

AdmissionDetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  admission: PropTypes.object,
  onEdit: PropTypes.func,
  onSaved: PropTypes.func,
};
