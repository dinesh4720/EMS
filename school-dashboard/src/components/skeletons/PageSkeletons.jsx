/**
 * PageSkeletons - Composed page-level skeleton loaders
 * Pre-built skeletons for common page layouts (table pages, card grids, detail pages)
 */

import SkeletonTable from './SkeletonTable';
import SkeletonCard from './SkeletonCard';
import SkeletonForm from './SkeletonForm';

const Bone = ({ className = "" }) => (
  <div className={`bg-surface-hover rounded animate-pulse ${className}`} />
);

/** Full table page skeleton with optional title, search bar, KPI cards, and table */
export const TablePageSkeleton = ({
  title = true,
  searchBar = true,
  kpiCards = 3,
  columns = 5,
  rows = 6,
  hasAvatar = false,
}) => (
  <div role="status" aria-busy="true" aria-label="Loading page" className="space-y-6">
    {/* Page title */}
    {title && <Bone className="h-7 w-48" />}

    {/* KPI cards row */}
    {kpiCards > 0 && (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: kpiCards }).map((_, i) => (
          <div
            key={`kpi-${i}`}
            className="bg-surface rounded-lg border border-border-token p-4 space-y-2"
          >
            <Bone className="h-3 w-20" />
            <Bone className="h-6 w-16" />
          </div>
        ))}
      </div>
    )}

    {/* Search / filter bar */}
    {searchBar && (
      <div className="flex items-center gap-3">
        <Bone className="h-10 flex-1 max-w-xs" />
        <Bone className="h-10 w-28" />
      </div>
    )}

    {/* Table */}
    <SkeletonTable columns={hasAvatar ? columns + 1 : columns} rows={rows} />
  </div>
);

/** Card grid page skeleton */
export const CardGridPageSkeleton = ({
  title = true,
  cards = 6,
  columns = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
}) => (
  <div role="status" aria-busy="true" aria-label="Loading page" className="space-y-6">
    {title && <Bone className="h-7 w-48" />}
    <div className={`grid ${columns} gap-4`}>
      {Array.from({ length: cards }).map((_, i) => (
        <SkeletonCard key={`card-${i}`} bodyLines={2} />
      ))}
    </div>
  </div>
);

/** Detail page skeleton with a header area and form */
export const DetailPageSkeleton = ({
  title = true,
  avatar = false,
  fields = 6,
}) => (
  <div role="status" aria-busy="true" aria-label="Loading page" className="space-y-6">
    <div className="flex items-center gap-4">
      {avatar && <Bone className="h-16 w-16 rounded-full" />}
      <div className="space-y-2">
        {title && <Bone className="h-7 w-48" />}
        <Bone className="h-4 w-32" />
      </div>
    </div>
    <div className="bg-surface rounded-lg border border-border-token p-6">
      <SkeletonForm fields={fields} showSubmit={false} />
    </div>
  </div>
);
