import { Plus } from "lucide-react";
import { UserPlus, CreditCard, MessageSquare, ShieldAlert } from "lucide-react";

import Button from "../../../../components/ui/Button";
import Card from "../../../../components/ui/Card";
import Alert from "../../../../components/ui/Alert";
import Skeleton, {
  SkeletonText,
  SkeletonRow,
  SkeletonCard,
} from "../../../../components/ui/Skeleton";
import EmptyState from "../../../../components/ui/EmptyState";
import ErrorState from "../../../../components/ui/ErrorState";
import Progress, { CircularProgress } from "../../../../components/ui/Progress";
import ActivityFeed from "../../../../components/ui/ActivityFeed";
import toast from "../../../../components/ui/toast";
import { Story, StoryGroup } from "../../shared";
import PaginationDemo from "./PaginationDemo";

export default function FeedbackSection() {
  return (
    <StoryGroup
      id="prim-feedback"
      title="Feedback & state"
      sub="Alert, Toast, Skeleton, EmptyState, ErrorState, Progress. The four-state rule (skeleton / empty / error / success) applies to every data screen."
    >
      <Story title="Alert — variants" layout="col">
        <Alert variant="info" title="Heads up">
          A new term begins on May 12. Promote students before the lock date.
        </Alert>
        <Alert variant="success" title="Saved">All 24 changes were synced.</Alert>
        <Alert variant="warning" title="Action required" onClose={() => {}}>
          3 students are missing parent contacts. Update before sending the next bulletin.
        </Alert>
        <Alert
          variant="danger"
          title="Couldn't reach the server"
          action={<Button size="sm" variant="danger">Retry</Button>}
        >
          Retry in a moment, or check your connection.
        </Alert>
      </Story>

      <Story title="Toast — imperative API" sub="toast.success / .error / .info / .warning / .loading / .promise">
        <Button variant="ghost" size="sm" onClick={() => toast.success("Saved")}>success</Button>
        <Button variant="ghost" size="sm" onClick={() => toast.error("Network error")}>error</Button>
        <Button variant="ghost" size="sm" onClick={() => toast.info("New message")}>info</Button>
        <Button variant="ghost" size="sm" onClick={() => toast.warning("Almost out of seats")}>warning</Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            toast.promise(new Promise((r) => setTimeout(r, 1200)), {
              loading: "Saving…",
              success: "Saved",
              error: "Failed",
            })
          }
        >
          promise
        </Button>
      </Story>

      <Story title="Skeleton" sub="Shimmer-based placeholders — preferred over animate-pulse" layout="col">
        <SkeletonText lines={3} />
        <SkeletonRow />
        <SkeletonCard />
        <Skeleton variant="circle" width={48} height={48} />
      </Story>

      <Story title="EmptyState · ErrorState" layout="col">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card padding="md">
            <EmptyState
              title="No students yet"
              description="Add your first student or import from CSV to get started."
              action={<Button size="sm" variant="primary" icon={<Plus size={14} />}>Add student</Button>}
              secondaryAction={<Button size="sm" variant="ghost">Import CSV</Button>}
            />
          </Card>
          <Card padding="md">
            <ErrorState
              title="Couldn't load fees"
              description="Network request timed out."
              onRetry={() => {}}
            />
          </Card>
        </div>
      </Story>

      <Story title="Progress" layout="col">
        <Progress value={32} label="Importing students" showValue />
        <Progress value={78} label="Backup" showValue color="success" />
        <Progress indeterminate label="Sending" />
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <CircularProgress value={42} size="sm" />
          <CircularProgress value={42} size="md" color="success" />
          <CircularProgress indeterminate size="lg" />
        </div>
      </Story>

      <Story title="Pagination">
        <PaginationDemo />
      </Story>

      <Story
        title="ActivityFeed"
        sub="Canonical activity/audit-log primitive — vertical timeline, day grouping, relative time (absolute on hover), click-to-expand, dedupe-safe infinite scroll."
        layout="col"
      >
        <Card padding="md" style={{ maxWidth: 520 }}>
          <ActivityFeed
            events={[
              {
                id: "a",
                icon: UserPlus,
                tone: "success",
                title: "Aarav admitted to Grade 6-A",
                actor: "by Principal",
                timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
              },
              {
                id: "b",
                icon: CreditCard,
                tone: "primary",
                title: "Fee receipt #2351 generated",
                actor: "by Office",
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
                content: (
                  <>
                    Amount ₹12,500 collected against Term 2 tuition. Mode:
                    UPI. Receipt mailed to parent.
                  </>
                ),
              },
              {
                id: "c",
                icon: MessageSquare,
                tone: "info",
                title: "Announcement sent to all parents",
                actor: "by Admin",
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
              },
              {
                id: "d",
                icon: ShieldAlert,
                tone: "warning",
                title: "Late check-in flagged for Riya",
                actor: "by Gate",
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
              },
            ]}
          />
        </Card>
      </Story>
    </StoryGroup>
  );
}
