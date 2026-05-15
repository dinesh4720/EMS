import { CheckCircle2, XCircle, MinusCircle, AlertTriangle, Clock, Ban } from "lucide-react";

const STATUS_CONFIG = {
  // Academic statuses
  pass:     { label: 'Pass',     Icon: CheckCircle2,  cls: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  fail:     { label: 'Fail',     Icon: XCircle,       cls: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  passed:   { label: 'Passed',   Icon: CheckCircle2,  cls: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  failed:   { label: 'Failed',   Icon: XCircle,       cls: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  // Account / entity statuses
  active:    { label: 'Active',    Icon: CheckCircle2, cls: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  inactive:  { label: 'Inactive',  Icon: MinusCircle,  cls: 'bg-gray-50 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400' },
  suspended: { label: 'Suspended', Icon: AlertTriangle, cls: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  'on-leave':  { label: 'On Leave',  Icon: Clock,       cls: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  terminated: { label: 'Terminated', Icon: Ban,         cls: 'bg-gray-50 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400' },
};

const FALLBACK = { label: 'Unknown', Icon: MinusCircle, cls: 'bg-gray-50 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400' };

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
