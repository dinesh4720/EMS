import { useTranslation } from 'react-i18next';
import Badge from '../../components/ui/Badge';
import { JOB_STATUS } from './_helpers';

// Map raw status values (some snake_case) to camelCase translation key segments.
const STATUS_KEY = {
  completed: 'completed',
  running: 'running',
  failed: 'failed',
  queued: 'queued',
  rolled_back: 'rolledBack',
  scheduled: 'scheduled',
};

export default function JobStatusBadge({ status, size = 'md' }) {
  const { t } = useTranslation();
  const config = JOB_STATUS[status] || {
    color: 'neutral',
    label: status || t('dataTools.jobStatus.unknown', 'Unknown'),
  };
  const keyPart = STATUS_KEY[status];
  const label = keyPart
    ? t('dataTools.jobStatus.' + keyPart, config.label)
    : config.label;
  return (
    <Badge color={config.color} size={size} dot>
      {label}
    </Badge>
  );
}
