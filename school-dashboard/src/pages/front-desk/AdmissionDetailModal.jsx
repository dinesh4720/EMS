import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Button, Chip, Modal } from '../../components/ui';
import { getStatusMeta } from './admissionsConstants';

const Field = ({ label, children }) => (
  <div className="space-y-1">
    <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
      {label}
    </p>
    <div className="text-sm text-[var(--color-text-primary)]">{children || '—'}</div>
  </div>
);

Field.propTypes = {
  label: PropTypes.node.isRequired,
  children: PropTypes.node,
};

const decisionColor = (decision) => {
  if (decision === 'approved') return 'success';
  if (decision === 'rejected') return 'danger';
  return 'neutral';
};

export default function AdmissionDetailModal({ isOpen, onClose, admission }) {
  const { t } = useTranslation();
  if (!admission) return null;

  const status = getStatusMeta(admission.status);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      title={t('pages.admissionDetails')}
      description={admission.studentName}
      footer={
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t('pages.studentName2')}>{admission.studentName}</Field>
        <Field label={t('pages.dateOfBirth2')}>{admission.dateOfBirth}</Field>
        <Field label={t('pages.parentName2')}>{admission.parentName}</Field>
        <Field label={t('pages.phone1')}>{admission.phoneNumber}</Field>
        <Field label={t('pages.email1')}>{admission.email}</Field>
        <Field label={t('pages.classApplyingFor')}>{admission.classApplyingFor}</Field>
        <Field label={t('pages.source')}>
          <Chip size="sm" color="neutral">
            {admission.source || '—'}
          </Chip>
        </Field>
        <Field label={t('pages.status2')}>
          <Chip size="sm" color={status.color}>
            {status.label}
          </Chip>
        </Field>
        {admission.assessmentRequired && (
          <>
            <Field label={t('pages.assignedTeacher')}>
              {admission.assignedTeacher?.name}
            </Field>
            <Field label={t('pages.testDateTime')}>
              {admission.testDate && admission.testTime
                ? `${admission.testDate} ${admission.testTime}`
                : '—'}
            </Field>
            <Field label={t('pages.testResult')}>
              <Chip
                size="sm"
                color={admission.testResult === 'cleared' ? 'success' : 'neutral'}
              >
                {admission.testResult || 'pending'}
              </Chip>
            </Field>
          </>
        )}
        <Field label={t('pages.admissionDecision')}>
          <Chip size="sm" color={decisionColor(admission.admissionDecision)}>
            {admission.admissionDecision || 'pending'}
          </Chip>
        </Field>
        {admission.decisionRemarks && (
          <div className="sm:col-span-2">
            <Field label={t('pages.decisionRemarks')}>{admission.decisionRemarks}</Field>
          </div>
        )}
      </div>
    </Modal>
  );
}

AdmissionDetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  admission: PropTypes.object,
};
