import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from 'react-i18next';
import { getSubjectClasses } from './timetableUtils';

/**
 * The main timetable grid — renders the day/period table with subject cards
 * and the subject-type legend below.
 */
export function TimetableGrid({ days, periods, schedule, staff, onSlotClick }) {
  const { t } = useTranslation();

  const getTeacherName = (teacherId) => {
    if (!teacherId) return "";
    const tid = String(teacherId);
    const teacher = staff.find(s => String(s.id) === tid || String(s._id) === tid);
    return teacher?.name || "";
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
          {periods.map((period, i) => (
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

                if (period.isBreak) {
                  return (
                    <TableCell key={`${day}-${i}`} className="text-center bg-amber-50 dark:bg-amber-950 p-0">
                      <div className="h-24 flex items-center justify-center">
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 opacity-70 [writing-mode:vertical-rl] rotate-180">
                          {period.name}
                        </span>
                      </div>
                    </TableCell>
                  );
                }

                const subjectClasses = slot.subject ? getSubjectClasses(slot.subject) : null;
                return (
                  <TableCell key={`${day}-${i}`} className="p-1">
                    {slot.subject ? (
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <div
                          className={`${subjectClasses.card} rounded-lg h-24 flex flex-col justify-center items-center gap-1 p-1.5 cursor-pointer transition-opacity hover:opacity-90`}
                          onClick={() => onSlotClick(day, i)}
                        >
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
                          {slot.room && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${subjectClasses.pill} text-gray-500 dark:text-zinc-400`}>
                              {slot.room}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <div
                        className="w-full h-24 border border-dashed border-gray-200 dark:border-zinc-800 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-300 dark:text-zinc-600 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 cursor-pointer"
                        onClick={() => onSlotClick(day, i)}
                      >
                        <Plus size={16} />
                        <span className="text-[10px]">{t('pages.add1')}</span>
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
      </div>
    </>
  );
}
