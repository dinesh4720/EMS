export default function StaffMonthlySummary({ monthlyStats, t }) {
  const total = monthlyStats?.total ?? 0;
  const present = monthlyStats?.present ?? 0;
  const absent = monthlyStats?.absent ?? 0;
  // Derive on-leave from total - present - absent when not provided directly.
  // Prevents the historical bug where summary stats double-counted absent days
  // as leave days because leave was simply omitted from the breakdown.
  const leave = monthlyStats?.leave != null
    ? monthlyStats.leave
    : Math.max(0, total - present - absent);

  return (
    <div className="card">
      <div className="card__head">
        <span className="card__title">{t('pages.monthlySummary', 'Monthly summary')}</span>
      </div>
      <div className="card__body" style={{ paddingTop: 8 }}>
        <div className="grid grid-cols-4 gap-3">
          <SummaryCell value={total} label={t('pages.workingDays', 'Working days')} />
          <SummaryCell value={present} label={t('pages.present2', 'Present')} tone="ok" />
          <SummaryCell value={absent} label={t('pages.absent2', 'Absent')} tone="danger" />
          <SummaryCell value={leave} label={t('pages.onLeave', 'On leave')} tone="warn" />
        </div>
      </div>
    </div>
  );
}

function SummaryCell({ value, label, tone }) {
  const color =
    tone === "ok"
      ? "var(--ok)"
      : tone === "danger"
      ? "var(--danger)"
      : tone === "warn"
      ? "var(--warn)"
      : "var(--fg)";
  return (
    <div
      className="col"
      style={{
        padding: "12px 10px",
        background: "var(--surface-2)",
        borderRadius: 8,
        alignItems: "center",
        gap: 2,
      }}
    >
      <span
        className="mono tnum"
        style={{ fontSize: 20, fontWeight: 600, color }}
      >
        {value}
      </span>
      <span className="subtle" style={{ fontSize: 11 }}>
        {label}
      </span>
    </div>
  );
}
