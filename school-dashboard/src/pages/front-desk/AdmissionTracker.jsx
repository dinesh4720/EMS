import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Alert,
  Button,
  Chip,
  Modal,
  Progress,
  SkeletonText,
} from '../../components/ui';
import { frontDeskApi } from '../../services/api';
import { formatShortDate, formatTime } from '../../utils/dateFormatter';
import logger from '../../utils/logger';

const stepIconClass = (step) => {
  if (step.isCompleted) return 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400';
  if (step.isCurrent) return 'bg-blue-50 text-blue-600 animate-pulse dark:bg-blue-900/30 dark:text-blue-400';
  return 'bg-surface-2 text-fg-faint';
};

const stepLabelClass = (step) => {
  if (step.isCompleted) return 'text-green-700 dark:text-green-400';
  if (step.isCurrent) return 'text-blue-700 dark:text-blue-400';
  return 'text-fg-muted';
};

const stepConnectorClass = (step) =>
  step.isCompleted
    ? 'bg-green-300 dark:bg-green-700'
    : 'bg-surface-2';

function TimelineStep({ step, isLast }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${stepIconClass(step)}`}
        >
          {step.isCompleted ? (
            <CheckCircle size={16} />
          ) : step.isCurrent ? (
            <Clock size={16} />
          ) : (
            <Circle size={16} />
          )}
        </div>
        {!isLast && <div className={`w-0.5 h-12 ${stepConnectorClass(step)}`} />}
      </div>
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`font-medium ${stepLabelClass(step)}`}>{step.label}</p>
            {step.date && (
              <p className="text-sm text-fg-muted mt-1">
                {formatShortDate(step.date)} {formatTime(step.date)}
              </p>
            )}
            {step.notes && (
              <p className="text-sm text-fg-muted mt-1">
                {step.notes}
              </p>
            )}
            {step.assignedTo && (
              <p className="text-xs text-fg-muted mt-1">
                Assigned to: {step.assignedTo}
              </p>
            )}
          </div>
          {step.isCurrent && (
            <Chip size="sm" color="info">
              Current Stage
            </Chip>
          )}
        </div>
      </div>
    </div>
  );
}

TimelineStep.propTypes = {
  step: PropTypes.shape({
    status: PropTypes.string,
    label: PropTypes.string,
    date: PropTypes.string,
    notes: PropTypes.string,
    assignedTo: PropTypes.string,
    isCompleted: PropTypes.bool,
    isCurrent: PropTypes.bool,
  }).isRequired,
  isLast: PropTypes.bool,
};

function SummaryItem({ label, value }) {
  return (
    <div>
      <span className="text-fg-muted">{label}</span>
      <span className="ml-2 text-fg">{value || '—'}</span>
    </div>
  );
}

SummaryItem.propTypes = {
  label: PropTypes.node.isRequired,
  value: PropTypes.node,
};

export default function AdmissionTracker({ admission, isOpen, onClose }) {
  const { t } = useTranslation();
  const [trackerData, setTrackerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !admission?._id) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await frontDeskApi.getAdmissionTracker(admission._id);
        if (!cancelled) setTrackerData(data);
      } catch (err) {
        logger.error('Failed to load tracker:', err);
        if (!cancelled) {
          setError(err);
          toast.error('Failed to load admission tracker');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, admission?._id]);

  if (!admission) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
      title={t('pages.admissionTracker')}
      description={admission.studentName}
      footer={
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      }
    >
      {loading && (
        <div className="space-y-4">
          <SkeletonText lines={2} />
          <SkeletonText lines={6} />
        </div>
      )}

      {!loading && error && (
        <Alert variant="danger" title="Failed to load admission tracker">
          Please try reopening this dialog.
        </Alert>
      )}

      {!loading && !error && trackerData && (
        <div className="space-y-6">
          <Progress
            label={t('pages.progress')}
            value={trackerData.progress}
            color="success"
            showValue
          />

          <div className="space-y-0">
            {trackerData.timeline.map((item, index) => (
              <TimelineStep
                key={item.status}
                step={item}
                isLast={index === trackerData.timeline.length - 1}
              />
            ))}
          </div>

          <div className="rounded-lg bg-surface-2 p-4">
            <p className="text-sm font-medium mb-2 text-fg">
              {t('pages.admissionDetails')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <SummaryItem
                label={t('pages.class2')}
                value={admission.classApplyingFor}
              />
              <SummaryItem label={t('pages.source1')} value={admission.source} />
              <SummaryItem
                label={t('pages.parent1')}
                value={admission.parentName}
              />
              <SummaryItem
                label={t('pages.phone2')}
                value={admission.phoneNumber}
              />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

AdmissionTracker.propTypes = {
  admission: PropTypes.object,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
