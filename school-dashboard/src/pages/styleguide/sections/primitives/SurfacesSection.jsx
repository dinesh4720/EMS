import { Mail, ChevronRight } from "lucide-react";

import Card from "../../../../components/ui/Card";
import Badge from "../../../../components/ui/Badge";
import Chip from "../../../../components/ui/Chip";
import Tag from "../../../../components/ui/Tag";
import Avatar from "../../../../components/ui/Avatar";
import StatusBadge from "../../../../components/ui/StatusBadge";
import Button from "../../../../components/ui/Button";
import { Story, StoryGroup } from "../../shared";

export default function SurfacesSection() {
  return (
    <StoryGroup
      id="prim-surfaces"
      title="Surfaces"
      sub="Card, Badge, Chip, Tag, StatusBadge — the building blocks for laying out content."
    >
      <Story
        title="Card — composition"
        sub="Header / content / footer slots. Border-only by default; raise via elevation."
        layout="grid"
      >
        <Card padding="md">
          <Card.Header>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Class 3-A</span>
              <Badge color="success" dot>Active</Badge>
            </div>
          </Card.Header>
          <Card.Content>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Students
                </div>
                <div style={{ fontSize: 22, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>30</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Attendance
                </div>
                <div style={{ fontSize: 22, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: "var(--ok)" }}>94%</div>
              </div>
            </div>
          </Card.Content>
          <Card.Footer>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--fg-muted)" }}>Updated 5m ago</span>
              <Button variant="ghost" size="sm" icon={<ChevronRight size={14} />} iconPosition="right">
                Open
              </Button>
            </div>
          </Card.Footer>
        </Card>

        <Card padding="md" elevation="raised">
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <span
              aria-hidden
              style={{
                width: 36, height: 36, borderRadius: 8,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                background: "var(--accent-bg)", color: "var(--accent)", flexShrink: 0,
              }}
            >
              <Mail size={16} />
            </span>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}>Daily digest sent</p>
              <p style={{ fontSize: 12, color: "var(--fg-muted)", margin: 0 }}>
                <code>elevation="raised"</code> with icon-led layout. 142 parents received the bulletin.
              </p>
            </div>
          </div>
        </Card>

        <Card padding="md" interactive as="button" style={{ textAlign: "left", width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}>Interactive card</p>
              <p style={{ fontSize: 12, color: "var(--fg-muted)", margin: 0 }}>
                Hoverable + focusable — use for clickable card grids.
              </p>
            </div>
            <ChevronRight size={16} aria-hidden style={{ color: "var(--fg-faint)", flexShrink: 0 }} />
          </div>
        </Card>

        <Card padding="none" radius="lg" elevation="raised" style={{ overflow: "hidden" }}>
          <div
            style={{
              height: 80,
              background: "linear-gradient(135deg, var(--accent-bg), var(--surface-2))",
              borderBottom: "1px solid var(--divider)",
            }}
            aria-hidden
          />
          <div style={{ padding: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}>Hero card</p>
            <p style={{ fontSize: 12, color: "var(--fg-muted)", margin: 0 }}>
              <code>padding="none"</code> + a colored band — use for feature highlights.
            </p>
          </div>
        </Card>
      </Story>

      <Story
        title="Badge — solid"
        sub="6 colors × sm/md/lg · use the dot variant for liveness pulses"
      >
        {["neutral", "primary", "success", "warning", "danger", "info"].map((c) => (
          <Badge key={c} color={c}>{c}</Badge>
        ))}
        {["neutral", "primary", "success", "warning", "danger", "info"].map((c) => (
          <Badge key={`${c}-dot`} color={c} dot>{c}</Badge>
        ))}
      </Story>

      <Story title="Badge — outline">
        {["neutral", "primary", "success", "warning", "danger", "info"].map((c) => (
          <Badge key={c} color={c} variant="outline">{c}</Badge>
        ))}
      </Story>

      <Story title="Status pills — token-driven (.status)">
        <span className="status status--ok"><span className="dot" aria-hidden />Paid</span>
        <span className="status status--warn"><span className="dot" aria-hidden />Pending</span>
        <span className="status status--danger"><span className="dot" aria-hidden />Overdue</span>
        <span className="status status--info"><span className="dot" aria-hidden />Scheduled</span>
      </Story>

      <Story title="Chip · Tag" sub="Inline metadata (Chip, dense) · stronger categorization with border (Tag)">
        <Chip>10-A</Chip>
        <Chip>English</Chip>
        <Chip>Class teacher</Chip>
        <Tag>Maths</Tag>
        <Tag color="primary">Featured</Tag>
        <Tag color="success">Active</Tag>
        <Tag color="danger">Critical</Tag>
        <Tag color="info">Beta</Tag>
      </Story>

      <Story title="Avatar — sizes / shape / status">
        <Avatar name="Asha Sharma" size="xs" />
        <Avatar name="Asha Sharma" size="sm" />
        <Avatar name="Asha Sharma" size="md" />
        <Avatar name="Vikram Singh" size="lg" status="online" />
        <Avatar name="Deepak Mehta" size="xl" status="busy" shape="square" />
        <Avatar.Group max={4} size="md">
          <Avatar name="Aarav Joshi" />
          <Avatar name="Riya Mehta" />
          <Avatar name="Vikram Singh" />
          <Avatar name="Asha Sharma" />
          <Avatar name="Deepak Mehta" />
          <Avatar name="Karan Singh" />
        </Avatar.Group>
      </Story>

      <Story title="StatusBadge — semantic with built-in label">
        <StatusBadge status="active" />
        <StatusBadge status="inactive" />
        <StatusBadge status="on-leave" />
        <StatusBadge status="suspended" />
        <StatusBadge status="passed" />
        <StatusBadge status="failed" />
      </Story>
    </StoryGroup>
  );
}
