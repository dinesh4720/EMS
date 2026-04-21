import { useState } from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from 'react-i18next';
import { getSubjectClasses } from './timetableUtils';

/**
 * The main timetable grid — renders the day/period table with subject cards
 * and the subject-type legend below. Supports drag-and-drop slot swapping.
 *
 * Drag rules:
 * - Only filled (non-break) slots are draggable
 * - Valid drop targets: any non-break slot that is not the source slot
 * - Break slots: show not-allowed cursor during drag, no drop accepted
 * - Visual: dragged card dims, valid targets highlight blue, drop target pulses
 */
export function TimetableGrid({ days, periods, schedule, staff, onSlotClick, onSlotSwap }) {
  const { t } = useTranslation();

  const [draggingSlot, setDraggingSlot] = useState(null); // { day, periodIndex }
  const [dragOverSlot, setDragOverSlot] = useState(null); // { day, periodIndex }

  const getTeacherName = (teacherId) => {
    if (!teacherId) return "";
    const tid = String(teacherId);
    const teacher = staff.find(s => String(s.id) === tid || String(s._id) === tid);
    return teacher?.name || "";
  };

  // --- Drag helpers ---

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
    // Only clear if leaving the cell entirely (not entering a child element)
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

  // --- Style helpers ---

  const isDragging = !!draggingSlot;

  const getCellDropStyle = (day, periodIndex, isBreak) => {
    if (!isDragging) return "";
    const isSelf = draggingSlot.day === day && draggingSlot.periodIndex === periodIndex;
    if (isSelf) return "";
    if (isBreak) return "cursor-not-allowed";
    const isOver = dragOverSlot?.day === day && dragOverSlot?.periodIndex === periodIndex;
    if (isOver) return "ring-2 ring-blue-400 ring-inset bg-blue-50 dark:bg-blue-950";
    return "ring-1 ring-inset ring-blue-200 dark:ring-blue-800";
  };

  return (
    <>
      <Table
        aria-label={t('aria.misc.classTimetable')}
        shadow="none"
        isStriped={false}
        radius="sm"
        removeWrapper
        classNames={{
          base: "overflow-x-auto",
          th: "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 font-semibold text-xs uppercase h-10 border-b border-gray-200 dark:border-zinc-800 text-center",
          td: "p-1 border-b border-gray-100 dark:border-zinc-800",
          tr: "hover:bg-gray-50 dark:hover:bg-zinc-900",
          wrapper: "p-0"
        }}
      >
        <TableHeader>
          <TableColumn className="w-24" scope="col">{t('pages.day2')}</TableColumn>
          {periods.map((period) => (
            <TableColumn key={`period-${period.name}-${period.startTime}`} className="w-32" scope="col">
              <div className="flex flex-col items-center justify-center gap-0.5">
                <span className="text-xs font-bold">{period.name}</span>
                <span className="text-[9px] text-gray-400 dark:text-zinc-500 font-normal">
                  {period.startTime}-{period.endTime}
                </span>
              </div>
            </TableColumn>
          ))}
        </TableHeader>
        <TableBody>
          {days.map((day) => (
            <TableRow key={day}>
              <TableCell className="font-semibold text-gray-700 dark:text-zinc-300 text-xs">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.slice(0, 3)}</span>
              </TableCell>
              {periods.map((period, i) => {
                const slot = schedule[day]?.[i] || { subject: "", teacherId: null, room: "" };
                const isSelf = draggingSlot?.day === day && draggingSlot?.periodIndex === i;
                const isOver = dragOverSlot?.day === day && dragOverSlot?.periodIndex === i;

                if (period.isBreak) {
                  return (
                    <TableCell
                      key={`${day}-${i}`}
                      className={`text-center bg-amber-50 dark:bg-amber-950 p-0 transition-colors ${isDragging ? "cursor-not-allowed opacity-60" : ""}`}
                      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'none'; }}
                    >
                      <div className="h-24 flex items-center justify-center">
                        {isDragging && (
                          <span className="text-[8px] font-bold uppercase tracking-wider text-red-400 dark:text-red-500 opacity-80 mb-1 block">
                            ✕
                          </span>
                        )}
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 opacity-70 [writing-mode:vertical-rl] rotate-180">
                          {period.name}
                        </span>
                      </div>
                    </TableCell>
                  );
                }

                const subjectClasses = slot.subject ? getSubjectClasses(slot.subject) : null;
                const dropCellStyle = getCellDropStyle(day, i, false);

                return (
                  <TableCell
                    key={`${day}-${i}`}
                    className={`p-1 rounded-lg transition-all duration-150 ${dropCellStyle}`}
                    onDragOver={(e) => handleDragOver(e, day, i)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, day, i)}
                  >
                    {slot.subject ? (
                      <motion.div
                        whileHover={!isDragging ? { scale: 1.02 } : undefined}
                        whileTap={!isDragging ? { scale: 0.98 } : undefined}
                        animate={isSelf ? { opacity: 0.4 } : isOver ? { scale: 1.03 } : { opacity: 1, scale: 1 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, day, i)}
                          onDragEnd={handleDragEnd}
                          className={`${subjectClasses.card} rounded-lg h-24 flex flex-col justify-center items-center gap-1 p-1.5 transition-opacity hover:opacity-90 ${isDragging && !isSelf ? "cursor-copy" : "cursor-grab active:cursor-grabbing"}`}
                          onClick={() => !isDragging && onSlotClick(day, i)}
                          title={isDragging ? undefined : "Drag to move to another slot"}
                        >
                          {isOver && (
                            <span className="text-[9px] font-bold text-blue-600 dark:text-blue-300 uppercase tracking-wide">
                              Drop here
                            </span>
                          )}
                          <span className={`text-xs font-bold text-center line-clamp-2 ${subjectClasses.text}`}>
                            {slot.subject}
                          </span>
                          {slot.teacherId && (
                            <div className={`flex items-center gap-1 ${subjectClasses.pill} px-1.5 py-0.5 rounded-full max-w-full`}>
                              <span className="text-[10px] text-gray-600 dark:text-zinc-300 text-center truncate">
                                {getTeacherName(slot.teacherId)}
                              </span>
                            </div>
                          )}
                          {slot.room && !isOver && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${subjectClasses.pill} text-gray-500 dark:text-zinc-400`}>
                              {slot.room}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <div
                        className={`w-full h-24 border border-dashed rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer transition-all duration-150
                          ${isOver
                            ? "border-blue-400 dark:border-blue-500 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 scale-105"
                            : isDragging && !period.isBreak
                              ? "border-blue-300 dark:border-blue-700 text-blue-400 dark:text-blue-600 bg-blue-50/50 dark:bg-blue-950/50"
                              : "border-gray-200 dark:border-zinc-800 text-gray-300 dark:text-zinc-600 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950"
                          }`}
                        onClick={() => !isDragging && onSlotClick(day, i)}
                      >
                        {isOver ? (
                          <>
                            <span className="text-lg">↓</span>
                            <span className="text-[10px] font-semibold">{t('pages.dropHere', 'Drop here')}</span>
                          </>
                        ) : (
                          <>
                            <Plus size={16} />
                            <span className="text-[10px]">{t('pages.add1')}</span>
                          </>
                        )}
                      </div>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-zinc-400 items-center justify-end px-4 pb-4 border-t border-gray-100 dark:border-zinc-800 pt-4">
        <span className="font-medium mr-2">{t('pages.subjectTypes')}</span>
        <div className="flex gap-2 items-center">
          <span className="w-3 h-3 rounded-full bg-blue-200 border border-blue-300"></span>
          <span>{t('pages.coreMath')}</span>
        </div>
        <div className="flex gap-2 items-center">
          <span className="w-3 h-3 rounded-full bg-green-200 border border-green-300"></span>
          <span>{t('pages.science')}</span>
        </div>
        <div className="flex gap-2 items-center">
          <span className="w-3 h-3 rounded-full bg-yellow-200 border border-yellow-300"></span>
          <span>Languages/Art</span>
        </div>
        <div className="flex gap-2 items-center">
          <span className="w-3 h-3 rounded-full bg-purple-200 border border-purple-300"></span>
          <span>Social/Computer</span>
        </div>
        <div className="flex gap-2 items-center">
          <span className="w-3 h-3 rounded-full bg-red-200 border border-red-300"></span>
          <span>Sports/Hindi</span>
        </div>
        <div className="flex gap-2 items-center ml-4 pl-4 border-l border-gray-200 dark:border-zinc-700">
          <span className="text-[10px] text-gray-400 dark:text-zinc-500 italic">
            Drag slots to swap periods
          </span>
        </div>
      </div>
    </>
  );
}
