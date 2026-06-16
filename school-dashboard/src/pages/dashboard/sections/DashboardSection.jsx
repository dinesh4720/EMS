export default function DashboardSection({ title, count, children }) {
  return (
    <div className="dash-section">
      <h2 className="dash-section-title">
        {title}
        {count != null && <span className="dash-section-count">{count}</span>}
      </h2>
      <div className="dash-section-card">{children}</div>
    </div>
  );
}
