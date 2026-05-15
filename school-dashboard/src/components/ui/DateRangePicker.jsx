import { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent, RangeCalendar } from '@heroui/react';
import { parseDate, today, getLocalTimeZone } from '@internationalized/date';
import { CalendarDays } from 'lucide-react';

/**
 * DateRangePicker
 *
 * Wraps HeroUI's RangeCalendar in a Popover.
 *
 * Props:
 *   startDate  – string (YYYY-MM-DD) | undefined
 *   endDate    – string (YYYY-MM-DD) | undefined
 *   onChange   – ({ start: string, end: string }) => void
 *   maxDate    – string (YYYY-MM-DD) | undefined  (defaults to today)
 *   minDate    – string (YYYY-MM-DD) | undefined
 *   className  – extra classes for the trigger button
 *   placeholder – trigger label when no range is selected
 */
export default function DateRangePicker({
  startDate,
  endDate,
  onChange,
  maxDate,
  minDate,
  className = '',
  placeholder = 'Select date range',
}) {
  const [isOpen, setIsOpen] = useState(false);

  const value =
    startDate && endDate
      ? { start: parseDate(startDate), end: parseDate(endDate) }
      : null;

  const handleOpenChange = (open) => {
    setIsOpen(open);
  };

  const handleChange = (range) => {
    if (!range?.start || !range?.end) return;

    const start = range.start.toString();
    const end = range.end.toString();

    onChange?.({ start, end });

    // FIX (AUDIT-860): Close the calendar automatically once the user has
    // picked both the start and end date.  Previously the popover stayed open
    // and users could not tell whether their selection had been saved.
    setIsOpen(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-');
    return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const label =
    startDate && endDate
      ? `${formatDate(startDate)} – ${formatDate(endDate)}`
      : startDate
      ? `${formatDate(startDate)} – …`
      : placeholder;

  return (
    <Popover
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      placement="bottom-start"
    >
      <PopoverTrigger>
        <button
          type="button"
          className={[
            'flex items-center gap-2 px-3 py-2 rounded-lg border',
            'border-gray-300 dark:border-zinc-700',
            'bg-surface',
            'text-sm text-fg',
            'hover:border-primary transition-colors',
            className,
          ].join(' ')}
        >
          <CalendarDays size={15} className="text-fg-faint flex-shrink-0" />
          <span>{label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <RangeCalendar
          value={value}
          onChange={handleChange}
          maxValue={maxDate ? parseDate(maxDate) : today(getLocalTimeZone())}
          minValue={minDate ? parseDate(minDate) : undefined}
          aria-label="Select date range"
        />
      </PopoverContent>
    </Popover>
  );
}
