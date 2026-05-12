import Badge from '../../components/ui/Badge';
import { JOB_STATUS } from './_helpers';

export default function JobStatusBadge({ status, size = 'md' }) {
  const config = JOB_STATUS[status] || { color: 'neutral', label: status || 'Unknown' };
  return (
    <Badge color={config.color} size={size} dot>
      {config.label}
    </Badge>
  );
}
