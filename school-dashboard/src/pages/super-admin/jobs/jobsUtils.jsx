export const STATUS_CHIP_COLOR = {
  running: 'info',
  failed: 'danger',
  scheduled: 'warning',
  completed: 'success',
};

export function formatDuration(ms) {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
