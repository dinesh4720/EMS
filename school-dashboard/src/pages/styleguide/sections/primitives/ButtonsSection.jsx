import {
  Plus,
  Search,
  MoreHorizontal,
  Filter,
  Trash2,
  ChevronRight,
  Download,
  Wallet,
} from "lucide-react";

import Button from "../../../../components/ui/Button";
import IconButton from "../../../../components/ui/IconButton";
import Tooltip from "../../../../components/ui/Tooltip";
import { Story, StoryGroup } from "../../shared";

export default function ButtonsSection() {
  return (
    <StoryGroup
      id="prim-buttons"
      title="Buttons"
      sub="Six variants × three sizes. Use primary for the dominant action, accent for permission/sales-y CTAs, ghost for tertiary."
    >
      <Story
        title="Variants"
        sub="primary · accent · secondary · ghost · outline · danger"
        code={`<Button variant="primary">Save</Button>
<Button variant="accent" icon={<Plus size={14} />}>Add student</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="ghost">Skip</Button>
<Button variant="outline">Outline</Button>
<Button variant="danger" icon={<Trash2 size={14} />}>Delete</Button>`}
      >
        <Button variant="primary">Save</Button>
        <Button variant="accent" icon={<Plus size={14} />}>Add student</Button>
        <Button variant="secondary">Cancel</Button>
        <Button variant="ghost">Skip</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="danger" icon={<Trash2 size={14} />}>Delete</Button>
      </Story>

      <Story title="Sizes" sub="sm (h-8) · md (h-9) · lg (h-11)">
        <Button size="sm" variant="primary">Small</Button>
        <Button size="md" variant="primary">Medium</Button>
        <Button size="lg" variant="primary">Large</Button>
      </Story>

      <Story title="States" sub="loading · disabled · with right icon">
        <Button variant="primary" loading>Saving</Button>
        <Button variant="primary" disabled>Disabled</Button>
        <Button variant="accent" icon={<ChevronRight size={14} />} iconPosition="right">
          Continue
        </Button>
        <Button variant="primary" fullWidth>Full width</Button>
      </Story>

      <Story title="Icon button" sub="Square 32×32 / 40×40 — always pair with aria-label or Tooltip">
        <IconButton aria-label="Search"><Search size={14} /></IconButton>
        <IconButton variant="ghost" aria-label="Filter"><Filter size={14} /></IconButton>
        <IconButton variant="primary" aria-label="More"><MoreHorizontal size={14} /></IconButton>
        <Tooltip content="Delete row">
          <IconButton variant="danger" aria-label="Delete"><Trash2 size={14} /></IconButton>
        </Tooltip>
      </Story>

      <Story
        title="Toolbar buttons (CSS class family)"
        sub="`.btn` — dense (28px), pill-shaped, with a subtle inset highlight on the accent variant. Used in page headers, table toolbars, fees bulk chip, frosted-overlay footer. Pair with the React Button primitive — these are the right call inside compact toolbars."
        code={`<button className="btn btn--accent">
  <Plus size={13} aria-hidden /> Add staff
</button>
<button className="btn">Filter</button>
<button className="btn btn--primary">
  <Download size={13} aria-hidden /> Export
</button>
<button className="btn btn--ghost">Cancel</button>
<button className="btn btn--sm">Small</button>
<button className="iconbtn" aria-label="More">
  <MoreHorizontal size={14} aria-hidden />
</button>`}
      >
        <button type="button" className="btn btn--accent">
          <Plus size={13} aria-hidden /> Add staff
        </button>
        <button type="button" className="btn">
          <Filter size={13} aria-hidden /> Filter
        </button>
        <button type="button" className="btn btn--primary">
          <Download size={13} aria-hidden /> Export
        </button>
        <button type="button" className="btn btn--ghost">Cancel</button>
        <button type="button" className="btn btn--accent btn--sm">
          <Wallet size={12} aria-hidden /> Collect
        </button>
        <button type="button" className="btn btn--sm">Receipt</button>
        <button type="button" className="iconbtn" aria-label="More options">
          <MoreHorizontal size={14} aria-hidden />
        </button>
      </Story>

      <Story
        title="Toolbar vs primitive — when to use which"
        sub="Two parallel button systems by design"
        layout="col"
      >
        <div className="sg-prop-table">
          <div className="sg-prop-table__head">
            <span>Use case</span>
            <span>Reach for</span>
            <span>Why</span>
          </div>
          <div className="sg-prop-table__row">
            <span style={{ color: "var(--fg)" }}>Page header CTA, list toolbar</span>
            <span className="mono sg-prop-table__type">.btn .btn--accent</span>
            <span style={{ color: "var(--fg-muted)", fontSize: 11.5 }}>
              Compact 28px height fits dense toolbars
            </span>
          </div>
          <div className="sg-prop-table__row">
            <span style={{ color: "var(--fg)" }}>Form actions, modal footers</span>
            <span className="mono sg-prop-table__type">{`<Button variant="primary" />`}</span>
            <span style={{ color: "var(--fg-muted)", fontSize: 11.5 }}>
              Larger 36px tap target, loading + icon props
            </span>
          </div>
          <div className="sg-prop-table__row">
            <span style={{ color: "var(--fg)" }}>Table row action</span>
            <span className="mono sg-prop-table__type">.btn .btn--sm</span>
            <span style={{ color: "var(--fg-muted)", fontSize: 11.5 }}>
              24px — keeps row height tight
            </span>
          </div>
          <div className="sg-prop-table__row">
            <span style={{ color: "var(--fg)" }}>Toolbar overflow / icon-only</span>
            <span className="mono sg-prop-table__type">.iconbtn</span>
            <span style={{ color: "var(--fg-muted)", fontSize: 11.5 }}>
              Square 28×28 — pair with aria-label
            </span>
          </div>
        </div>
      </Story>
    </StoryGroup>
  );
}
