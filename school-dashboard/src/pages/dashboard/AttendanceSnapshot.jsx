import { memo } from "react";
import PropTypes from "prop-types";
import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import ChartCard from "../../components/ui/ChartCard";
import Progress from "../../components/ui/Progress";

function AttendanceSnapshot({ rows = [], isLoading = false }) {
  const { t } = useTranslation();
  const hasData = rows.some((row) => Number.isFinite(row.value));

  return (
    <ChartCard
      title={
        <span className="inline-flex items-center gap-2">
          <Users
            size={14}
            className="text-gray-500 dark:text-zinc-400"
            aria-hidden="true"
          />
          {t("components.attendanceSnapshot")}
        </span>
      }
      description="Live rates from today's marked records"
      height={hasData || isLoading ? 220 : "auto"}
      isLoading={isLoading && !hasData}
      isEmpty={!isLoading && !hasData}
      emptyTitle={t("components.noAttendanceRecordedYet")}
      emptyDescription={t(
        "components.thisSectionUpdatesOnceStaffOrClassAttendanceIsMarked"
      )}
    >
      <div className="space-y-4 pt-1">
        {rows.map((row) => (
          <div key={row.label} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                  {row.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                  {row.subtext}
                </p>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100 tabular-nums">
                {Number.isFinite(row.value) ? Math.round(row.value) : 0}%
              </span>
            </div>
            <Progress
              value={Number.isFinite(row.value) ? row.value : 0}
              max={100}
              size="sm"
              color="primary"
              aria-label={`${row.label} attendance rate`}
            />
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

AttendanceSnapshot.propTypes = {
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.number,
      subtext: PropTypes.string,
    })
  ),
  isLoading: PropTypes.bool,
};

export default memo(AttendanceSnapshot);
