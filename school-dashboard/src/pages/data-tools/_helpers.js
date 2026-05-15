export function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString();
}

export const JOB_STATUS = {
  completed: { color: 'success', label: 'Completed' },
  running: { color: 'info', label: 'Running' },
  failed: { color: 'danger', label: 'Failed' },
  queued: { color: 'warning', label: 'Queued' },
  rolled_back: { color: 'neutral', label: 'Rolled Back' },
  scheduled: { color: 'neutral', label: 'Scheduled' },
};
