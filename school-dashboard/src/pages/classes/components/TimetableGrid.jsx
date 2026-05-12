import { useState } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { getSubjectKind } from './timetableUtils';

/**
 * Dense, period-led timetable grid.
 *
 * Layout: CSS grid (.tt-grid) where periods are columns (header row carries
 * the monospace start–end times) and days are rows. Cells render either an
 * empty add tile, a break hatch, or a subject-tinted .tt-slot with a
 * conflict pill when overlapping bookings are detected.
 *
 * Drag rules (preserved from prior implementation):
 * - Only filled (non-break) slots are draggable
 * - Valid drop targets: any non-break slot that is not the source slot
 * - Break slots: show not-allowed cursor during drag, no drop accepted
 */
export function TimetableGrid({
  days,
  periods,
  schedule,
  staff,
  view = 'week',
  activeDay,
  onSlotClick,
  onSlotSwap,
}) {
  const { t } = useTranslation();

  const [draggingSlot, setDraggingSlot] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);

  const visibleDays = view === 'day' && activeDay ? [activeDay] : days;

  const getTeacherName = (teacherId) => {
    if (!teacherId) return "";
    const tid = String(teacherId);
    const teacher = staff.find((s) => String(s.id) === tid || String(s._id) === tid);
    return teacher?.name || "";
  };

  const isValidDropTarget = (day, periodIndex) => {
    if (!draggingSlot) return false;
    if (periods[periodIndex]?.isBreak) return false;
    if (draggingSlot.day === day && draggingSlot.periodIndex === periodIndex) return false;
    return true;
  };

  const handleDragStart = (e, day, periodIndex) => {
    setDraggingSlot({ day, periodIndex });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggingSlot(null);
    setDragOverSlot(null);
  };

  const handleDragOver = (e, day, periodIndex) => {
    e.preventDefault();
    if (isValidDropTarget(day, periodIndex)) {
      e.dataTransfer.dropEffect = 'move';
      if (dragOverSlot?.day !== day || dragOverSlot?.periodIndex !== periodIndex) {
        setDragOverSlot({ day, periodIndex });
      }
    } else {
      e.dataTransfer.dropEffect = 'none';
      if (dragOverSlot) setDragOverSlot(null);
    }
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverSlot(null);
    }
  };

  const handleDrop = (e, day, periodIndex) => {
    e.preventDefault();
    setDragOverSlot(null);
    if (!draggingSlot || !isValidDropTarget(day, periodIndex)) {
      setDraggingSlot(null);
      return;
    }
    onSlotSwap?.(draggingSlot.day, draggingSlot.periodIndex, day, periodIndex);
    setDraggingSlot(null);
  };

  const isDragging = !!draggingSlot;

  return (
    <div className="tt-grid-wrap">
      <div
        className="tt-grid"
        role="grid"
        aria-label={t('aria.misc.classTimetable')}
        style={{ '--period-count': periods.length }}
      >
        {/* Header row */}
        <div className="tt-grid__head tt-grid__head--corner" role="columnheader">
          DAY \ PERIOD
        </div>
        {periods.map((period) => (
          <div key={`h-${period.name}-${period.startTime}`} className="tt-grid__head" role="columnheader">
            <span className="tt-grid__head-name">{period.name}</span>
            <span className="tt-grid__head-time">
              {period.startTime}–{period.endTime}
            </span>
          </div>
        ))}

        {/* Day rows */}
        {visibleDays.map((day) => (
          <Row
            key={day}
            day={day}
            periods={periods}
            schedule={schedule}
            isDragging={isDragging}
            draggingSlot={draggingSlot}
            dragOverSlot={dragOverSlot}
            getTeacherName={getTeacherName}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onSlotClick={onSlotClick}
            t={t}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="tt-legend">
        <span style={{ fontWeight: 520, color: 'var(--fg-muted)' }}>{t('pages.subjectTypes')}</span>
        <span className="tt-legend__group">
          <span className="tt-legend-sw tt-legend-sw--math" />
          <span>{t('pages.coreMath')}</span>
        </span>
        <span className="tt-legend__group">
          <span className="tt-legend-sw tt-legend-sw--sci" />
          <span>{t('pages.science')}</span>
        </span>
        <span className="tt-legend__group">
          <span className="tt-legend-sw tt-legend-sw--eng" />
          <span>Languages</span>
        </span>
        <span className="tt-legend__group">
          <span className="tt-legend-sw tt-legend-sw--pe" />
          <span>PE / Sports</span>
        </span>
        <span className="tt-legend__group">
          <span className="tt-legend-sw tt-legend-sw--art" />
          <span>Art / Humanities</span>
        </span>
        <span className="tt-legend__hint">Drag a slot to swap periods · click empty cell to add</span>
      </div>
    </div>
  );
}

function Row({
  day,
  periods,
  schedule,
  isDragging,
  draggingSlot,
  dragOverSlot,
  getTeacherName,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onSlotClick,
  t,
}) {
  return (
    <>
      <div className="tt-grid__day" role="rowheader">
        <span>{day}</span>
        <span className="tt-grid__day-short">{day.slice(0, 3)}</span>
      </div>
      {periods.map((period, i) => {
        const slot = schedule[day]?.[i] || { subject: '', teacherId: null, room: '' };
        const isSelf = draggingSlot?.day === day && draggingSlot?.periodIndex === i;
        const isOver = dragOverSlot?.day === day && dragOverSlot?.periodIndex === i;

        if (period.isBreak) {
          return (
            <div
              key={`${day}-${i}`}
              className={`tt-grid__slot ${isDragging ? 'is-drop-invalid' : ''}`}
              role="gridcell"
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'none';
              }}
            >
              <div className="tt-slot--break">{period.name}</div>
            </div>
          );
        }

        const slotKind = slot.subject ? getSubjectKind(slot.subject) : null;
        const hasConflict = !!slot.hasConflict;

        const cellClass = [
          'tt-grid__slot',
          isSelf ? 'is-dragging' : '',
          isOver ? 'is-drop-target' : '',
        ].filter(Boolean).join(' ');

        return (
          <div
            key={`${day}-${i}`}
            className={cellClass}
            role="gridcell"
            onDragOver={(e) => onDragOver(e, day, i)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, day, i)}
          >
            {slot.subject ? (
              <div
                draggable
                onDragStart={(e) => onDragStart(e, day, i)}
                onDragEnd={onDragEnd}
                className={`tt-slot tt-ev--${slotKind} ${hasConflict ? 'tt-ev--conflict' : ''}`}
                onClick={() => !isDragging && onSlotClick(day, i)}
                title={isDragging ? undefined : 'Drag to move or click to edit'}
              >
                <span className="tt-slot__t">{slot.subject}</span>
                {slot.teacherId && (
                  <span className="tt-slot__sub">
                    {getTeacherName(slot.teacherId)}
                    {slot.room ? ` · ${slot.room}` : ''}
                  </span>
                )}
                {!slot.teacherId && slot.room && (
                  <span className="tt-slot__sub">{slot.room}</span>
                )}
                {hasConflict && (
                  <span className="tt-slot__conflict" title="Teacher conflict">
                    ⚠ Conflict
                  </span>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="tt-slot--empty"
                onClick={() => !isDragging && onSlotClick(day, i)}
              >
                {isOver ? (
                  <>↓ <span style={{ fontWeight: 600 }}>{t('pages.dropHere', 'Drop here')}</span></>
                ) : (
                  <>
                    <Plus size={12} aria-hidden />
                    <span>{t('pages.add1')}</span>
                  </>
                )}
              </button>
            )}
          </div>
        );
      })}
    </>
  );
}
