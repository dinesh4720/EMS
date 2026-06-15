import Skeleton from "../../../components/ui/Skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="page page--principal">
      <header className="dash-hero">
        <div className="space-y-2">
          <Skeleton variant="text" className="h-8 w-64" />
          <Skeleton variant="text" className="h-4 w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton variant="rect" className="h-8 w-8 rounded-md" />
          <Skeleton variant="rect" className="h-8 w-8 rounded-md" />
        </div>
      </header>

      <section className="stats-row" aria-label="Key metrics">
        <div className="stat-card space-y-2">
          <div className="stat-card__row">
            <Skeleton variant="circle" className="h-9 w-9" />
            <Skeleton variant="text" className="h-3 w-24" />
          </div>
          <Skeleton variant="text" className="h-8 w-28 mt-1" />
          <Skeleton variant="text" className="h-3 w-32 mt-1" />
        </div>
        <div className="stat-card space-y-2">
          <div className="stat-card__row">
            <Skeleton variant="circle" className="h-9 w-9" />
            <Skeleton variant="text" className="h-3 w-24" />
          </div>
          <Skeleton variant="text" className="h-8 w-28 mt-1" />
          <Skeleton variant="text" className="h-3 w-32 mt-1" />
        </div>
      </section>

      <div className="dash-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`dash-skeleton-section-${i}`} className="dash-section">
            <Skeleton variant="text" className="h-5 w-24 mb-3" />
            <div className="dash-section-card space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={`dash-skeleton-row-${i}-${j}`} className="flex items-center gap-3">
                  <Skeleton variant="circle" className="h-9 w-9 shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Skeleton variant="text" className="h-3 w-1/2" />
                    <Skeleton variant="text" className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
