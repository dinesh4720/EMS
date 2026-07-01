import Skeleton from "../../../components/ui/Skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="briefing briefing--loading">
      {/* Hero */}
      <header className="briefing__hero">
        <div className="space-y-2">
          <Skeleton variant="text" className="h-8 w-72" />
          <Skeleton variant="text" className="h-4 w-48" />
        </div>
        <Skeleton variant="rect" className="h-8 w-8 rounded-md" />
      </header>

      {/* Action shelf */}
      <section className="action-shelf">
        <div className="action-shelf__head">
          <Skeleton variant="text" className="h-4 w-40" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton
              key={`act-${i}`}
              variant="rect"
              className="h-14 w-full rounded-xl"
            />
          ))}
        </div>
        <div className="action-shelf__verbs">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton
              key={`verb-${i}`}
              variant="rect"
              className="h-7 w-32 rounded-lg"
            />
          ))}
        </div>
      </section>

      {/* This week trend panel */}
      <section className="weekly-trend">
        <div className="weekly-trend__metric">
          <Skeleton variant="text" className="h-3 w-32" />
          <div className="flex items-end justify-between">
            <Skeleton variant="text" className="h-7 w-24" />
            <Skeleton variant="rect" className="h-9 w-24 rounded-md" />
          </div>
          <Skeleton variant="text" className="h-3 w-28" />
        </div>
        <div className="weekly-trend__divider" />
        <div className="weekly-trend__metric">
          <Skeleton variant="text" className="h-3 w-32" />
          <div className="flex items-end justify-between">
            <Skeleton variant="text" className="h-7 w-16" />
            <Skeleton variant="text" className="h-5 w-20" />
          </div>
          <Skeleton variant="text" className="h-3 w-36" />
        </div>
      </section>

      {/* Two-column lower */}
      <div className="briefing__cols">
        <section className="briefing__col">
          <Skeleton variant="text" className="h-5 w-32 mb-3" />
          <div className="briefing__panel space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={`feed-${i}`} className="flex items-center gap-3">
                <Skeleton variant="circle" className="h-8 w-8 shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton variant="text" className="h-3 w-3/4" />
                  <Skeleton variant="text" className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="briefing__col">
          <Skeleton variant="text" className="h-5 w-20 mb-3" />
          <div className="briefing__panel space-y-3">
            <Skeleton variant="rect" className="h-24 w-full rounded-xl" />
            <Skeleton variant="rect" className="h-20 w-full rounded-xl" />
          </div>
        </section>
      </div>
    </div>
  );
}
