import { useState, useRef, useEffect, useCallback } from "react";
import { format, addMonths, subMonths, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ClickAwayListener from "./ClickAwayListener";

// Simple calendar that shows only the calendar grid, no nested input
// Disables future dates to prevent selection
function CustomCalendar({ selectedDate, onSelect }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selectedDate) return selectedDate;
    return new Date();
  });
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [focusedDate, setFocusedDate] = useState(() => selectedDate || new Date());
  const yearDropdownRef = useRef(null);
  const calendarGridRef = useRef(null);

  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);

  // Get all days to display (including padding from previous/next months)
  const startOfWeekDay = new Date(firstDayOfMonth);
  startOfWeekDay.setDate(startOfWeekDay.getDate() - firstDayOfMonth.getDay());

  const endOfWeekDay = new Date(lastDayOfMonth);
  endOfWeekDay.setDate(endOfWeekDay.getDate() + (6 - lastDayOfMonth.getDay()));

  const allDays = eachDayOfInterval({ start: startOfWeekDay, end: endOfWeekDay });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Generate year options from 1900 to current year - 1
  const currentYear = new Date().getFullYear();
  const maxYear = currentYear - 1;
  const years = [];
  for (let year = maxYear; year >= 1900; year--) {
    years.push(year);
  }

  const isDayDisabled = useCallback((day) => {
    const dayDate = new Date(day);
    dayDate.setHours(0, 0, 0, 0);
    return dayDate > today;
  }, [today]);

  const handleDateClick = (day) => {
    if (isDayDisabled(day)) return;
    onSelect(day);
  };

  const handleYearChange = (year) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(parseInt(year));
    setCurrentMonth(newDate);
    setIsYearDropdownOpen(false);
  };

  // Scroll the active year into view when year dropdown opens
  useEffect(() => {
    if (isYearDropdownOpen && yearDropdownRef.current) {
      const activeBtn = yearDropdownRef.current.querySelector('[data-active-year="true"]');
      if (activeBtn) activeBtn.scrollIntoView({ block: 'center' });
    }
  }, [isYearDropdownOpen]);

  const handleYearDropdownKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsYearDropdownOpen(false);
    }
  };

  const handleCalendarKeyDown = (e) => {
    const key = e.key;
    let newFocused = focusedDate;

    switch (key) {
      case 'ArrowRight':
        e.preventDefault();
        newFocused = addDays(focusedDate, 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        newFocused = addDays(focusedDate, -1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        newFocused = addDays(focusedDate, 7);
        break;
      case 'ArrowUp':
        e.preventDefault();
        newFocused = addDays(focusedDate, -7);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!isDayDisabled(focusedDate)) {
          onSelect(focusedDate);
        }
        return;
      case 'Escape':
        e.preventDefault();
        if (isYearDropdownOpen) setIsYearDropdownOpen(false);
        return;
      default:
        return;
    }

    // If navigated to a different month, update currentMonth
    if (!isSameMonth(newFocused, currentMonth)) {
      setCurrentMonth(newFocused);
    }
    setFocusedDate(newFocused);

    // Focus the button for the new date after render
    requestAnimationFrame(() => {
      if (calendarGridRef.current) {
        const btn = calendarGridRef.current.querySelector(`[data-date="${format(newFocused, 'yyyy-MM-dd')}"]`);
        if (btn) btn.focus();
      }
    });
  };

  return (
    <div className="bg-surface border border-divider rounded-lg shadow-xl p-4 min-w-[320px]" role="dialog" aria-label="Date picker">
      {/* Header with month and year navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-1 hover:bg-surface-2 rounded transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft size={20} className="text-fg-subtle" aria-hidden />
        </button>

        <div className="flex items-center gap-2">
          <div className="font-semibold text-fg" aria-live="polite">
            {format(currentMonth, 'MMMM')}
          </div>

          {/* Year Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
              onKeyDown={handleYearDropdownKeyDown}
              className="font-semibold text-fg hover:text-primary transition-colors px-2 py-1 hover:bg-surface-2 rounded flex items-center gap-1"
              aria-expanded={isYearDropdownOpen}
              aria-haspopup="listbox"
              aria-label={`Year ${format(currentMonth, 'yyyy')}, click to change`}
            >
              {format(currentMonth, 'yyyy')}
              <svg
                className={`w-4 h-4 transition-transform ${isYearDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isYearDropdownOpen && (
              <ClickAwayListener onClickAway={() => setIsYearDropdownOpen(false)}>
                <div
                  ref={yearDropdownRef}
                  role="listbox"
                  aria-label="Select year"
                  onKeyDown={handleYearDropdownKeyDown}
                  className="absolute top-full left-0 mt-1 bg-surface border border-divider rounded-lg shadow-xl max-h-60 overflow-y-auto z-50 min-w-[100px]"
                >
                  {years.map(year => (
                    <button
                      key={year}
                      type="button"
                      role="option"
                      aria-selected={year === currentMonth.getFullYear()}
                      data-active-year={year === currentMonth.getFullYear() ? 'true' : undefined}
                      onClick={() => handleYearChange(year)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleYearChange(year);
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          setIsYearDropdownOpen(false);
                        }
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-surface-2 transition-colors ${
                        year === currentMonth.getFullYear() ? 'bg-[var(--accent-bg)] text-primary font-semibold' : 'text-fg'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </ClickAwayListener>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-1 hover:bg-surface-2 rounded transition-colors"
          aria-label="Next month"
        >
          <ChevronRight size={20} className="text-fg-subtle" aria-hidden />
        </button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2" role="row">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-fg-muted py-1" role="columnheader" abbr={day}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div
        ref={calendarGridRef}
        className="grid grid-cols-7 gap-1"
        role="grid"
        aria-label={format(currentMonth, 'MMMM yyyy')}
        onKeyDown={handleCalendarKeyDown}
      >
        {allDays.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isToday = isSameDay(day, today);
          const isFocused = isSameDay(day, focusedDate);
          const isDisabled = isDayDisabled(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              data-date={format(day, 'yyyy-MM-dd')}
              tabIndex={isFocused ? 0 : -1}
              onClick={() => handleDateClick(day)}
              disabled={isDisabled}
              aria-label={format(day, 'EEEE, MMMM d, yyyy')}
              aria-selected={isSelected || undefined}
              aria-current={isToday ? 'date' : undefined}
              className={`
                aspect-square flex items-center justify-center text-sm rounded transition-colors
                ${isDisabled ? 'text-fg-faint cursor-not-allowed opacity-50' : !isCurrentMonth ? 'text-fg-faint' : 'text-fg'}
                ${isSelected && !isDisabled ? 'bg-primary text-white font-semibold' : ''}
                ${isToday && !isSelected && !isDisabled ? 'border-2 border-primary' : ''}
                ${!isSelected && !isDisabled ? 'hover:bg-surface-2' : ''}
                ${isFocused && !isDisabled ? 'ring-2 ring-primary ring-offset-1' : ''}
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CustomCalendar;
