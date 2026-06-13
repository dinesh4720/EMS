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
          className="bg-surface rounded-lg p-4 border border-divider hover:border-border-strong transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center">
              <stat.icon size={16} className="text-fg-muted" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-fg">{stat.value}</h3>
          <p className="text-xs font-medium text-fg-muted mt-0.5">{stat.label}</p>
          {stat.subtext && (
            <p className="text-xs text-fg-faint mt-2">{stat.subtext}</p>
          )}
        </div>
      ))}
    </div>
  );
}
