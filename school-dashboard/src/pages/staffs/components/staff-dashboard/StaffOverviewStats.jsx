/**
 * StaffOverviewStats
 * Renders the 4 stat cards on the overview tab.
 */
export default function StaffOverviewStats({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <stat.icon size={16} className="text-gray-600 dark:text-zinc-400" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-zinc-200">{stat.value}</h3>
          <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mt-0.5">{stat.label}</p>
          {stat.subtext && (
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-2">{stat.subtext}</p>
          )}
        </div>
      ))}
    </div>
  );
}
