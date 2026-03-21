import { Target, UserPlus, UserMinus } from "lucide-react";

export default function QuickStats({ data }) {
  const feeProgress = Math.round((data.monthlyFeeCollected / data.monthlyFeeTarget) * 100);

  return (
    <div className="bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-zinc-400">
          <Target size={16} strokeWidth={2} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-zinc-100">Quick Stats</p>
          <p className="text-xs text-gray-500 dark:text-zinc-400">Weekly performance metrics</p>
        </div>
      </div>

      {/* Fee Collection */}
      <div className="p-3 rounded-lg border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">Monthly Fee Collection</span>
          <span className={`text-xs font-semibold ${feeProgress >= 80 ? 'text-gray-900' : 'text-amber-600'}`}>
            {feeProgress}%
          </span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5 mb-2">
          <div
            className={`h-1.5 rounded-full ${feeProgress >= 80 ? 'bg-gray-900' : 'bg-amber-500'}`}
            style={{ width: `${feeProgress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-zinc-400">
          <span>Collected: <span className="text-gray-800 dark:text-zinc-100 font-medium">₹{data.monthlyFeeCollected.toLocaleString()}</span></span>
          <span>Target: <span className="text-gray-800 dark:text-zinc-100 font-medium">₹{data.monthlyFeeTarget.toLocaleString()}</span></span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-center">
          <p className="text-lg font-semibold text-gray-800 dark:text-zinc-100">{data.avgAttendance}%</p>
          <p className="text-[10px] font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide mt-1">Avg Dept</p>
        </div>
        <div className="p-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-center">
          <div className="flex items-center justify-center gap-1">
            <UserPlus size={14} className="text-gray-500 dark:text-zinc-400" />
            <p className="text-lg font-semibold text-gray-800 dark:text-zinc-100">{data.newAdmissions}</p>
          </div>
          <p className="text-[10px] font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide mt-1">New Admins</p>
        </div>
        <div className="p-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-center">
          <div className="flex items-center justify-center gap-1">
            <UserMinus size={14} className="text-gray-500 dark:text-zinc-400" />
            <p className="text-lg font-semibold text-gray-800 dark:text-zinc-100">{data.staffOnLeave}</p>
          </div>
          <p className="text-[10px] font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide mt-1">On Leave</p>
        </div>
      </div>
    </div>
  );
}
