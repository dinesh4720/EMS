import {
  Edit, Phone, FileCheck, FileText, Award, BarChart3,
  User, Mail, AlertCircle, ChevronRight, IndianRupee, TrendingUp, CheckCircle2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCurrency } from '../../../context/hooks/useCurrency';

// ============================================================================
// STUDENT DASHBOARD SIDEBAR
// Quick Actions, Alerts/All Clear, Contact Card
// ============================================================================

export default function StudentDashboardSidebar({
  student,
  attendanceStats,
  studentFeeStructure,
  avgPercentage,
  loadingFeeStructure,
  attendanceLoading,
  resultsLoading,

  onEditOpen,
  onTcOpen,
  onBonafideOpen,
  onCharacterOpen,
  onProgressOpen,
}) {
  const { t } = useTranslation();
  const { fmt } = useCurrency();

  return (
    <>
      {/* Quick Actions */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-100 dark:border-zinc-700 p-5">
        <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-4">{t('pages.quickActions1')}</h3>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={onEditOpen} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700">
            <Edit size={18} className="text-gray-600 dark:text-zinc-400" />
            <span className="text-xs text-gray-600 dark:text-zinc-400">{t('pages.edit1')}</span>
          </button>
          <button
            onClick={() => student.parentPhone && (window.location.href = `tel:${student.parentPhone.replace(/[^\d+]/g, '')}`)}
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700"
          >
            <Phone size={18} className="text-gray-600 dark:text-zinc-400" />
            <span className="text-xs text-gray-600 dark:text-zinc-400">{t('pages.call')}</span>
          </button>
          <button onClick={onTcOpen} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700">
            <FileCheck size={18} className="text-gray-600 dark:text-zinc-400" />
            <span className="text-xs text-gray-600 dark:text-zinc-400">TC</span>
          </button>
          <button onClick={onBonafideOpen} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700">
            <FileText size={18} className="text-gray-600 dark:text-zinc-400" />
            <span className="text-xs text-gray-600 dark:text-zinc-400">Bonafide</span>
          </button>
          <button onClick={onCharacterOpen} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700">
            <Award size={18} className="text-gray-600 dark:text-zinc-400" />
            <span className="text-xs text-gray-600 dark:text-zinc-400">Character</span>
          </button>
          <button onClick={onProgressOpen} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700">
            <BarChart3 size={18} className="text-gray-600 dark:text-zinc-400" />
            <span className="text-xs text-gray-600 dark:text-zinc-400">{t('pages.progress')}</span>
          </button>
        </div>
      </div>

      {/* Alerts / All Clear */}
      {loadingFeeStructure || attendanceLoading || resultsLoading ? (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-100 dark:border-zinc-700 p-5 space-y-3">
          <div className="h-3 w-28 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-100 dark:bg-zinc-800 rounded animate-pulse" />
        </div>
      ) : (
        <>
          {(attendanceStats.total > 0 && attendanceStats.percentage < 75 || studentFeeStructure?.totalBalance > 0 || (avgPercentage && avgPercentage < 60)) && (
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-100 dark:border-zinc-700 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-zinc-700">
                <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.attentionRequired1')}</h3>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-zinc-800">
                {attendanceStats.total > 0 && attendanceStats.percentage < 75 && (
                  <div className="p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                      <AlertCircle size={16} className="text-gray-600 dark:text-zinc-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.lowAttendance1')}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">{attendanceStats.percentage}% (below 75%)</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 dark:text-zinc-500" />
                  </div>
                )}
                {studentFeeStructure?.totalBalance > 0 && (
                  <div className="p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                      <IndianRupee size={16} className="text-gray-600 dark:text-zinc-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.pendingFees1')}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">{fmt(studentFeeStructure.totalBalance)} due</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 dark:text-zinc-500" />
                  </div>
                )}
                {avgPercentage && avgPercentage < 60 && (
                  <div className="p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                      <TrendingUp size={16} className="text-gray-600 dark:text-zinc-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.academicConcern1')}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">{avgPercentage}% average</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 dark:text-zinc-500" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* All Clear */}
          {(attendanceStats.total === 0 || attendanceStats.percentage >= 75) && !studentFeeStructure?.totalBalance && (!avgPercentage || avgPercentage >= 60) && (
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-100 dark:border-zinc-700 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                  <CheckCircle2 size={16} className="text-gray-600 dark:text-zinc-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.allClear')}</h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.noIssuesDetected')}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-zinc-400">
                This student has no pending issues. All records are up to date.
              </p>
            </div>
          )}
        </>
      )}

      {/* Contact Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-100 dark:border-zinc-700 p-5">
        <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-4">{t('pages.contactInformation1')}</h3>
        <div className="space-y-4">
          {(student.parentName || student.parents?.find(par => par.isParent !== false)?.name || student.parents?.[0]?.name) && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <User size={14} className="text-gray-600 dark:text-zinc-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-zinc-500">{t('pages.parentName2', 'Parent Name')}</p>
                <p className="text-sm text-gray-900 dark:text-zinc-100">
                  {student.parentName || student.parents?.find(par => par.isParent !== false)?.name || student.parents?.[0]?.name}
                </p>
              </div>
            </div>
          )}
          {student.parentPhone && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <Phone size={14} className="text-gray-600 dark:text-zinc-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-zinc-500">{t('pages.parentPhone1')}</p>
                <p className="text-sm text-gray-900 dark:text-zinc-100">{student.parentPhone}</p>
              </div>
            </div>
          )}
          {(student.parentEmail || student.parents?.find(par => par.isParent !== false)?.email || student.parents?.[0]?.email) && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <Mail size={14} className="text-gray-600 dark:text-zinc-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-zinc-500">{t('pages.parentEmail1')}</p>
                <p className="text-sm text-gray-900 dark:text-zinc-100 truncate">
                  {student.parentEmail || student.parents?.find(par => par.isParent !== false)?.email || student.parents?.[0]?.email}
                </p>
              </div>
            </div>
          )}
          {student.address && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                <Mail size={14} className="text-gray-600 dark:text-zinc-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-zinc-500">{t('pages.address2')}</p>
                <p className="text-sm text-gray-900 dark:text-zinc-100">{student.address}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
