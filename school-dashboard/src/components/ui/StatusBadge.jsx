import { CheckCircle2, XCircle, MinusCircle, AlertTriangle, Clock, Ban } from "lucide-react";

const STATUS_CONFIG = {
  // Academic statuses
  pass:     { label: 'Pass',     Icon: CheckCircle2,  cls: 'bg-ok-bg text-ok' },
  fail:     { label: 'Fail',     Icon: XCircle,       cls: 'bg-danger-bg text-danger-token' },
  passed:   { label: 'Passed',   Icon: CheckCircle2,  cls: 'bg-ok-bg text-ok' },
  failed:   { label: 'Failed',   Icon: XCircle,       cls: 'bg-danger-bg text-danger-token' },
  // Account / entity statuses
  active:    { label: 'Active',    Icon: CheckCircle2, cls: 'bg-ok-bg text-ok' },
  inactive:  { label: 'Inactive',  Icon: MinusCircle,  cls: 'bg-surface-2 text-fg-muted' },
  suspended: { label: 'Suspended', Icon: AlertTriangle, cls: 'bg-danger-bg text-danger-token' },
  'on-leave':  { label: 'On Leave',  Icon: Clock,       cls: 'bg-warn-bg text-warn' },
  terminated: { label: 'Terminated', Icon: Ban,         cls: 'bg-surface-2 text-fg-muted' },
};

const FALLBACK = { label: 'Unknown', Icon: MinusCircle, cls: 'bg-surface-2 text-fg-muted' };

/**
 * StatusBadge — renders a status pill with an icon AND a text label so the
 * meaning is never conveyed through colour alone (accessibility, WCAG 1.4.1).
 *
 * Props:
 *   status   — one of the known status keys (pass/fail/active/inactive/…)
 *   label    — optional override for the visible text
 *   className — extra Tailwind classes
 */
export default function StatusBadge({ status, label, className = '' }) {
  const config = STATUS_CONFIG[status] ?? FALLBACK;
  const { Icon, cls } = config;
  const displayLabel = label ?? config.label;

  return (
    <span
      role="status"
      aria-label={displayLabel}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cls} ${className}`}
    >
      <Icon size={10} aria-hidden="true" />
      {displayLabel}
    </span>
  );
}
