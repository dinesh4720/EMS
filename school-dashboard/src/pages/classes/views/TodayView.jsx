import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import useTodayPeriods from "../hooks/useTodayPeriods";
import PeriodStrip from "../../../components/classes/PeriodStrip";
import PeriodDetailList from "../../../components/classes/PeriodDetailList";
import ClassesRail from "../../../components/classes/ClassesRail";
import EmptyDayBanner from "../../../components/classes/EmptyDayBanner";
import ByClassView from "./ByClassView";

// Variation B body. Period strip + selected-period detail + right rail.
//
// Empty-day fallthrough (per README §5): when isWeekendOrHoliday OR
// isSchoolDayComplete, render banner + ByClassView. ONE view at a time.
// The toggle (in ClassesPage) stays usable; clicking Today again from this
// fallthrough state shows the period strip in retrospective mode.
export default function TodayView({ retrospectiveOverride = false }) {
  const { periods, dayMeta } = useTodayPeriods();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedNumber = useMemo(() => {
    const fromUrl = parseInt(searchParams.get("period") || "", 10);
    if (Number.isFinite(fromUrl)) return fromUrl;
    return dayMeta.activePeriodNumber || periods[0]?.number || null;
  }, [searchParams, dayMeta.activePeriodNumber, periods]);

  const setSelectedNumber = (n) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (n) next.set("period", String(n));
        else next.delete("period");
        return next;
      },
      { replace: false }
    );
  };

  const selectedPeriod =
    periods.find((p) => p.number === selectedNumber) || periods[0] || null;

  const handleJumpToPeriod = (n) => setSelectedNumber(n);

  // Empty-day fallthrough — same pattern for both triggers.
  const isFallthrough =
    dayMeta.isWeekendOrHoliday || dayMeta.isSchoolDayComplete;

  if (isFallthrough && !retrospectiveOverride) {
    return (
      <>
        <EmptyDayBanner
          dayMeta={dayMeta}
          onViewOverdue={() => {
            // Find the first overdue period and jump to it
            const firstOverdue = periods.find((p) => p.state === "overdue");
            if (firstOverdue) {
              setSearchParams(
                (prev) => {
                  const next = new URLSearchParams(prev);
                  next.set("period", String(firstOverdue.number));
                  return next;
                },
                { replace: true }
              );
            }
          }}
        />
        <ByClassView />
      </>
    );
  }

  // Retrospective: end-of-day, but user explicitly clicked Today again.
  // Show the strip with all states locked to their final values; no live
  // actions, no countdowns (handled inside PeriodStrip + PeriodClassRow).
  const retrospective =
    (dayMeta.isWeekendOrHoliday || dayMeta.isSchoolDayComplete) &&
    retrospectiveOverride;

  return (
    <>
      <PeriodStrip
        periods={periods}
        selectedNumber={selectedPeriod?.number}
        onSelect={setSelectedNumber}
        retrospective={retrospective}
      />
      <div className="today-view">
        <div className="today-view__main">
          <PeriodDetailList period={selectedPeriod} />
        </div>
        <div className="today-view__rail">
          <ClassesRail
            periods={periods}
            dayMeta={dayMeta}
            onJumpToPeriod={handleJumpToPeriod}
          />
        </div>
      </div>
    </>
  );
}
