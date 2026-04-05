import { useTranslation } from "react-i18next";
import { AlertCircle, CheckCircle2, ChevronRight, IndianRupee, TrendingUp } from "lucide-react";
import { formatCurrency } from '../../../utils/numberFormatter';

/**
 * StudentSidebarAlerts - Right sidebar alerts section
 * Shows low attendance, pending fees, academic concerns, or an "all clear" message
 *
 * Props:
 * - attendanceStats: { total, percentage, present, absent }
 * - studentFeeStructure: { totalBalance, ... }
 * - avgPercentage: number | null
 * - onAttendanceClick: () => void (optional)
 * - onFeesClick: () => void (optional)
 * - onAcademicsClick: () => void (optional)
 */
export default function StudentSidebarAlerts({
  attendanceStats,
  studentFeeStructure,
  avgPercentage,
  onAttendanceClick,
  onFeesClick,
  onAcademicsClick,
}) {
  const { t } = useTranslation();

  const hasLowAttendance = attendanceStats?.total > 0 && attendanceStats?.percentage < 75;
  const hasPendingFees = studentFeeStructure?.totalBalance > 0;
  const hasAcademicConcern = avgPercentage && avgPercentage < 60;
  const hasAnyAlert = hasLowAttendance || hasPendingFees || hasAcademicConcern;

  if (!hasAnyAlert) {
    // All Clear state
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-100 dark:border-zinc-700 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
            <CheckCircle2 size={16} className="text-gray-600 dark:text-zinc-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100">
              {t('students.profile.overview.allGood', 'All Good!')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              {t('students.profile.overview.noActionsRequired', 'No immediate actions required')}
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-zinc-400">
          {t('students.sidebar.noIssues', 'This student has no pending issues. All records are up to date.')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-100 dark:border-zinc-700 overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-zinc-700">
        <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100">
          {t('students.profile.overview.actionNeeded', 'Action Needed')}
        </h3>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-zinc-700">
        {hasLowAttendance && (
          <div
            className="p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 cursor-pointer"
            onClick={onAttendanceClick}
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <AlertCircle size={16} className="text-gray-600 dark:text-zinc-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                {t('students.profile.overview.lowAttendance', 'Low Attendance')}
              </p>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                {t('students.profile.overview.lowAttendanceDesc', 'Attendance is {{percentage}}% (below 75%)', { percentage: attendanceStats?.percentage || 0 })}
              </p>
            </div>
            <ChevronRight size={16} className="text-gray-400 dark:text-zinc-500" />
          </div>
        )}
        {hasPendingFees && (
          <div
            className="p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 cursor-pointer"
            onClick={onFeesClick}
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <IndianRupee size={16} className="text-gray-600 dark:text-zinc-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                {t('students.profile.overview.pendingFees', 'Pending Fees')}
              </p>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                {t('students.profile.overview.pendingFeesDesc', '{{amount}} outstanding', { amount: formatCurrency(studentFeeStructure.totalBalance) })}
              </p>
            </div>
            <ChevronRight size={16} className="text-gray-400 dark:text-zinc-500" />
          </div>
        )}
        {hasAcademicConcern && (
          <div
            className="p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 cursor-pointer"
            onClick={onAcademicsClick}
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <TrendingUp size={16} className="text-gray-600 dark:text-zinc-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                {t('students.sidebar.academicConcern', 'Academic Concern')}
              </p>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                {t('students.sidebar.academicConcernDesc', '{{percentage}}% average', { percentage: avgPercentage })}
              </p>
            </div>
            <ChevronRight size={16} className="text-gray-400 dark:text-zinc-500" />
          </div>
        )}
      </div>
    </div>
  );
}
