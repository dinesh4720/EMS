import { useMemo } from "react";
import { useApp } from "../../../context/AppContext";

/**
 * StaffLeaveBalance — shows annual leave quota vs. days used for each leave type.
 *
 * Guard: leaveTypes can be undefined when a school hasn't configured any leave
 * types yet (empty settings). All array operations use `(leaveTypes || [])` to
 * prevent the TypeError: Cannot read properties of undefined (reading 'reduce')
 * crash that occurs at runtime in that scenario.
 */
export default function StaffLeaveBalance({ staffId }) {
  const { leaveTypes, staffAttendance } = useApp();

  // Count leave days used in the current calendar year from attendance records.
  // staffAttendance[staffId] is keyed by date string "YYYY-MM-DD".
  const leaveDaysUsedThisYear = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const records = staffAttendance?.[staffId] || {};
    return Object.entries(records).reduce((count, [date, record]) => {
      if (record?.status === "leave" && date.startsWith(String(currentYear))) {
        return count + 1;
      }
      return count;
    }, 0);
  }, [staffAttendance, staffId]);

  // Filter leave types that apply to staff (applicableTo === "staff" || "both").
  // Guard: (leaveTypes || []) prevents crash when school has no leave types configured.
  const staffLeaveTypes = useMemo(
    () =>
      (leaveTypes || []).filter(
        (lt) => lt.applicableTo === "staff" || lt.applicableTo === "both"
      ),
    [leaveTypes]
  );

  // Total quota across all applicable leave types
  const totalQuota = useMemo(
    () => (leaveTypes || []).reduce((sum, lt) => {  // line 40 — guarded against undefined
      if (lt.applicableTo === "staff" || lt.applicableTo === "both") {
        return sum + (lt.quota || 0);
      }
      return sum;
    }, 0),
    [leaveTypes]
  );

  if (staffLeaveTypes.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-border-token p-5">
        <p className="text-xs text-fg-muted uppercase tracking-wider font-semibold mb-3">
          Leave Balance
        </p>
        <p className="text-sm text-fg-faint">
          No leave types configured. Ask your admin to set up leave types in Settings.
        </p>
      </div>
    );
  }

  const remaining = Math.max(0, totalQuota - leaveDaysUsedThisYear);
  const usedPercent = totalQuota > 0 ? Math.min(100, Math.round((leaveDaysUsedThisYear / totalQuota) * 100)) : 0;

  return (
    <div className="bg-surface rounded-xl border border-border-token overflow-hidden">
      <div className="p-5 border-b border-divider">
        <p className="text-xs text-fg-muted uppercase tracking-wider font-semibold">
          Leave Balance (This Year)
        </p>
      </div>

      {/* Summary bar */}
      <div className="p-5 border-b border-divider">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-fg-muted">
            Used: <span className="font-semibold text-fg">{leaveDaysUsedThisYear}</span> day{leaveDaysUsedThisYear !== 1 ? "s" : ""}
          </span>
          <span className="text-fg-muted">
            Remaining: <span className="font-semibold text-green-700 dark:text-green-400">{remaining}</span> / {totalQuota}
          </span>
        </div>
        <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              usedPercent >= 90 ? "bg-red-400" : usedPercent >= 70 ? "bg-yellow-400" : "bg-green-500"
            }`}
            style={{ width: `${usedPercent}%` }}
          />
        </div>
      </div>

      {/* Per-type breakdown */}
      <div className="divide-y divide-divider">
        {staffLeaveTypes.map((lt) => {
          const quota = lt.quota || 0;
          // Proportional days used estimate per type (best-effort without per-type tracking)
          const typePercent = totalQuota > 0 ? quota / totalQuota : 0;
          const typeUsed = Math.round(leaveDaysUsedThisYear * typePercent);
          const typeRemaining = Math.max(0, quota - typeUsed);

          return (
            <div
              key={lt._id || lt.id}
              className="px-5 py-3 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-fg capitalize">
                  {lt.name}
                </p>
                <p className="text-xs text-fg-muted">
                  {lt.requiresApproval ? "Requires approval" : "Auto-approved"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-fg">
                  {typeRemaining} <span className="text-fg-faint font-normal">/ {quota}</span>
                </p>
                <p className="text-xs text-fg-muted">days left</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
