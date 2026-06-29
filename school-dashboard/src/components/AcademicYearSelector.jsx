import { useMemo } from "react";
import { useAppMeta } from "../context/AppContext";
import { getAcademicYearOptions } from "../utils/constants";

/**
 * Global academic year selector for the Topbar.
 * Reads/writes the shared selectedAcademicYear from AppContext so that
 * all data views that depend on it automatically refresh.
 */
export default function AcademicYearSelector() {
  const { currentAcademicYear, selectedAcademicYear, setSelectedAcademicYear } = useAppMeta();

  const yearOptions = useMemo(
    () => getAcademicYearOptions(currentAcademicYear, { past: 2, future: 1 }),
    [currentAcademicYear]
  );

  if (!currentAcademicYear) return null;

  const isNonCurrent = selectedAcademicYear !== currentAcademicYear;

  return (
    <select
      aria-label="Academic year"
      value={selectedAcademicYear}
      onChange={(e) => {
        const year = e.target.value;
        setSelectedAcademicYear(year === currentAcademicYear ? null : year);
      }}
      className={`
        text-xs font-medium rounded-lg px-2 py-1.5 border transition-colors cursor-pointer
        bg-surface
        border-border-token
        text-fg
        hover:border-gray-400 dark:hover:border-zinc-500
        focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-zinc-500
        ${isNonCurrent ? "border-amber-400 dark:border-amber-500 text-amber-700 dark:text-amber-400" : ""}
      `}
    >
      {yearOptions.map((year) => (
        <option key={year} value={year}>
          {year}{year === currentAcademicYear ? " (current)" : ""}
        </option>
      ))}
    </select>
  );
}
