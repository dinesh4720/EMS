import {
  Bone,
  SkeletonCard,
  SkeletonForm,
  SkeletonList,
  SkeletonTable,
} from "../../components/ui/Skeleton";
import { TablePageSkeleton, CardGridPageSkeleton, DetailPageSkeleton } from "../../components/skeletons/PageSkeletons";

import { Story, StoryGroup } from "./shared";

export default function SkeletonsSection() {
  return (
    <>
      <StoryGroup
        id="skeletons-components"
        title="Skeleton Loaders"
        sub="Loading placeholders for cards, forms, lists, and tables."
      >
        <Story title="SkeletonCard" layout="col">
          <SkeletonCard hasHeader bodyLines={3} />
        </Story>

        <Story title="SkeletonForm" layout="col">
          <SkeletonForm fields={3} showSubmit />
        </Story>

        <Story title="SkeletonList" layout="col">
          <SkeletonList items={3} />
        </Story>

        <Story title="SkeletonTable" layout="plain">
          <SkeletonTable columns={4} rows={4} />
        </Story>

        <Story title="Bone" layout="row">
          <Bone className="h-4 w-32" />
          <Bone className="h-8 w-20 rounded-lg" />
        </Story>
      </StoryGroup>

      <StoryGroup
        id="skeletons-pages"
        title="Page Skeletons"
        sub="Pre-composed skeleton layouts for common page types."
      >
        <Story title="TablePageSkeleton" layout="plain">
          <TablePageSkeleton kpiCards={2} columns={4} rows={3} />
        </Story>

        <Story title="CardGridSkeleton" layout="plain">
          <CardGridPageSkeleton cards={4} />
        </Story>

        <Story title="DetailPageSkeleton" layout="plain">
          <DetailPageSkeleton sections={2} />
        </Story>
      </StoryGroup>
    </>
  );
}
