import { useState } from "react";
import {
  Plus, Search, Mail, MoreHorizontal, Filter, Trash2, Info, ChevronRight, Send, Edit3,
  Download, Wallet, GraduationCap, Building2, Users, Sparkles, Check, X, Lightbulb,
  IndianRupee, ChevronDown,
} from "lucide-react";

import Button from "../../components/ui/Button";
import IconButton from "../../components/ui/IconButton";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Avatar from "../../components/ui/Avatar";
import Chip from "../../components/ui/Chip";
import Tag from "../../components/ui/Tag";
import StatusBadge from "../../components/ui/StatusBadge";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Checkbox from "../../components/ui/Checkbox";
import Radio, { RadioGroup } from "../../components/ui/Radio";
import Switch from "../../components/ui/Switch";
import Alert from "../../components/ui/Alert";
import FormField from "../../components/ui/FormField";
import FormErrorSummary from "../../components/ui/FormErrorSummary";
import useFormErrors from "../../hooks/useFormErrors";
import Skeleton, {
  SkeletonText,
  SkeletonRow,
  SkeletonCard,
} from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import Progress, { CircularProgress } from "../../components/ui/Progress";
import Tabs from "../../components/ui/Tabs";
import Breadcrumbs from "../../components/ui/Breadcrumbs";
import Modal from "../../components/ui/Modal";
import Drawer from "../../components/ui/Drawer";
import Tooltip from "../../components/ui/Tooltip";
import Popover from "../../components/ui/Popover";
import DropdownMenu from "../../components/ui/DropdownMenu";
import ExportMenu from "../../components/ui/ExportMenu";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import toast from "../../components/ui/toast";
import Pagination from "../../components/common/Pagination";
import ActivityFeed from "../../components/ui/ActivityFeed";
import { UserPlus, CreditCard, MessageSquare, ShieldAlert } from "lucide-react";

import { Story, StoryGroup, PropTable } from "./shared";

/* ──────────────────────────────────────────────────────────────────
 * Primitives — every UI primitive in src/components/ui showcased
 * with state variations and copy-paste-ready code.
 * ────────────────────────────────────────────────────────────────── */

function ButtonsSection() {
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

function FormsSection() {
  const [text, setText] = useState("");
  const [agree, setAgree] = useState(true);
  const [plan, setPlan] = useState("pro");
  const [enabled, setEnabled] = useState(true);

  return (
    <StoryGroup
      id="prim-forms"
      title="Forms"
      sub="Inputs share label / description / error / hint slots. Always wrap in <FormField> when the layout demands consistent label-on-top spacing."
    >
      <Story title="Input — sizes" layout="col">
        <div className="sg-form-grid">
          <Input size="sm" label="Small" placeholder="Short field" />
          <Input size="md" label="Medium" placeholder="Default size" />
          <Input size="lg" label="Large" placeholder="Spacious" />
        </div>
      </Story>

      <Story
        title="Input — states"
        sub="default · hover · focus · error · disabled"
        layout="col"
      >
        <div className="sg-form-grid">
          <Input
            label="With description"
            description="Used to identify the student"
            placeholder="Type here"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Input
            label="With start icon"
            startContent={<Search size={14} />}
            placeholder="Search students"
          />
          <Input label="Error" placeholder="Required" error="This field is required" />
          <Input label="Disabled" placeholder="Read only" disabled />
        </div>
      </Story>

      <Story title="Textarea" layout="col">
        <Textarea
          label="Remarks"
          description="Visible to parents in the app"
          placeholder="Type a short note about this student…"
          rows={4}
        />
      </Story>

      <Story
        title="Checkbox"
        sub="default · checked · indeterminate · disabled"
        layout="col"
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 32 }}>
          <Checkbox label="Default" />
          <Checkbox
            label="Email me a copy"
            description="We'll send to the registered email"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          <Checkbox label="Indeterminate" indeterminate />
          <Checkbox label="Disabled" disabled />
          <Checkbox label="Disabled & checked" disabled checked readOnly />
        </div>
      </Story>

      <Story
        title="Radio group"
        sub="The selected option shows a filled dot. Click any row to switch."
        layout="col"
      >
        <RadioGroup
          label="Plan"
          value={plan}
          onChange={setPlan}
          name="sg-plan"
        >
          <Radio value="starter" label="Starter" description="Up to 100 students" />
          <Radio value="pro" label="Pro" description="Up to 1,000 students" />
          <Radio value="scale" label="Scale" description="Unlimited" />
        </RadioGroup>
      </Story>

      <Story
        title="Form validation UX — inline + summary + scroll-to-error"
        sub="useFormErrors() gives every form the same error UX: inline FieldError under the input (aria-invalid + aria-describedby), an optional FormErrorSummary banner at the top, scroll + focus to the first invalid field on submit, error clears on field change, and server errors map back onto the right field. Submit empty to see it in action."
        layout="col"
      >
        <ValidationDemo />
      </Story>

      <Story
        title="Switch"
        sub="On/off — prefer over a checkbox for settings that take effect immediately"
        layout="col"
      >
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <Switch
            label="Parent app notifications"
            description="Send a push when results are published"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <Switch
            label="Auto-publish"
            description="Defaults off — flip to publish immediately on save"
          />
          <Switch label="Disabled" disabled />
          <Switch label="Disabled (on)" disabled checked readOnly />
        </div>
      </Story>
    </StoryGroup>
  );
}

function ValidationDemo() {
  const [form, setForm] = useState({ name: "", email: "" });
  const {
    errors,
    setErrors,
    clearFieldError,
    registerField,
    focusFirstError,
  } = useFormErrors();

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    clearFieldError(key);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = "Required";
    if (!form.email.trim()) next.email = "Required";
    else if (!/.+@.+\..+/.test(form.email)) next.email = "Enter a valid email";
    setErrors(next);
    if (Object.keys(next).length === 0) {
      toast.success("Validated! (this is a demo — nothing was submitted)");
    } else {
      focusFirstError(next);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: 14 }}
      noValidate
    >
      <FormErrorSummary
        errors={errors}
        labels={{ name: "Name", email: "Email" }}
        onFocusField={(name) => focusFirstError({ [name]: errors[name] })}
      />
      <FormField
        label="Name"
        required
        name="name"
        registerField={registerField}
        error={errors.name}
      >
        <Input
          placeholder="Ada Lovelace"
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          error={errors.name}
        />
      </FormField>
      <FormField
        label="Email"
        required
        name="email"
        registerField={registerField}
        error={errors.email}
      >
        <Input
          type="email"
          placeholder="ada@school.edu"
          value={form.email}
          onChange={(e) => setField("email", e.target.value)}
          error={errors.email}
        />
      </FormField>
      <div style={{ display: "flex", gap: 8 }}>
        <Button type="submit">Validate</Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setForm({ name: "", email: "" });
            setErrors({});
          }}
        >
          Reset
        </Button>
      </div>
    </form>
  );
}

function ComposerAtomsSection() {
  const [role, setRole] = useState("Teaching");
  const [tags, setTags] = useState(["Mathematics", "Physics"]);
  const [tagDraft, setTagDraft] = useState("");
  const [helpOpen, setHelpOpen] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const addTag = () => {
    const v = tagDraft.trim();
    if (!v || tags.includes(v)) {
      setTagDraft("");
      return;
    }
    setTags((t) => [...t, v]);
    setTagDraft("");
  };

  const removeTag = (t) => setTags((prev) => prev.filter((x) => x !== t));

  return (
    <StoryGroup
      id="prim-composer-atoms"
      title="Composer atoms — bare classes"
      sub=".field / .input / .select / .textarea / .optgrid / .taginput / .help-banner / .disclosure — the form-level primitives used inside the composer overlay, the drawer, and the detail pane. Drop straight into JSX, no React wrapper needed."
    >
      <Story
        title=".field — label · input · hint"
        sub="Stacked label-on-top with required marker and optional hint line"
        code={`<label className="field">
  <span className="field__label">Email <span className="req">*</span></span>
  <input className="input" type="email" placeholder="you@school.in" />
  <span className="field__hint">We use this for password resets only.</span>
</label>`}
        layout="col"
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, width: "100%" }}>
          <label className="field">
            <span className="field__label">Email <span className="req">*</span></span>
            <input className="input" type="email" placeholder="you@school.in" />
            <span className="field__hint">We use this for password resets only.</span>
          </label>
          <label className="field">
            <span className="field__label">Staff code</span>
            <div className="field__icon-wrap">
              <span className="field__icon"><Search size={13} aria-hidden /></span>
              <input className="input input--with-icon" placeholder="EMP001" />
            </div>
          </label>
          <label className="field">
            <span className="field__label">Monthly salary</span>
            <div className="field__icon-wrap">
              <span className="field__icon"><IndianRupee size={13} aria-hidden /></span>
              <input className="input input--with-icon input--with-suffix" placeholder="35,000" />
              <span className="field__suffix">INR</span>
            </div>
          </label>
          <label className="field">
            <span className="field__label">Department</span>
            <select className="select" defaultValue="Teaching">
              <option>Teaching</option>
              <option>Admin</option>
              <option>Support</option>
            </select>
          </label>
        </div>
      </Story>

      <Story
        title=".textarea"
        sub="Resizable, same border / focus halo as .input"
        layout="col"
      >
        <label className="field" style={{ maxWidth: 460 }}>
          <span className="field__label">Address</span>
          <textarea className="textarea" rows={3} placeholder="Line 1, area, city, PIN…" />
        </label>
      </Story>

      <Story
        title=".optgrid — segmented option picker"
        sub="Iconography-led choices; reach for this over a radio group when the option set is visual"
        code={`<div className="optgrid">
  <button className="opt is-active" type="button">
    <span className="opt__icon"><GraduationCap size={14} /></span>
    Teaching
    <span className="opt__check"><Check size={10} /></span>
  </button>
  <button className="opt" type="button">…</button>
</div>`}
      >
        <div className="optgrid" style={{ width: "100%" }}>
          {[
            { key: "Teaching", icon: GraduationCap, sub: "Has classes" },
            { key: "Admin", icon: Building2, sub: "Office staff" },
            { key: "Support", icon: Users, sub: "Lab, library" },
            { key: "Leadership", icon: Sparkles, sub: "HoD, principal" },
          ].map(({ key, icon: Icon }) => (
            <button
              key={key}
              type="button"
              className={`opt${role === key ? " is-active" : ""}`}
              onClick={() => setRole(key)}
            >
              <span className="opt__icon" aria-hidden><Icon size={14} /></span>
              {key}
              <span className="opt__check" aria-hidden><Check size={10} /></span>
            </button>
          ))}
        </div>
      </Story>

      <Story
        title=".taginput · .tagchip"
        sub="Press Enter to add · ⌫ removes the last tag"
        code={`<div className="taginput">
  {tags.map(t => (
    <span key={t} className="tagchip">
      {t}
      <button onClick={() => remove(t)} aria-label={\`Remove \${t}\`}><X size={11}/></button>
    </span>
  ))}
  <input value={draft} onChange={…} onKeyDown={addOnEnter} placeholder="Add subject…" />
</div>`}
      >
        <div
          className="taginput"
          style={{ maxWidth: 460, width: "100%" }}
          onClick={(e) => {
            if (e.target.tagName !== "INPUT") {
              e.currentTarget.querySelector("input")?.focus();
            }
          }}
        >
          {tags.map((t) => (
            <span key={t} className="tagchip">
              {t}
              <button
                type="button"
                onClick={() => removeTag(t)}
                aria-label={`Remove ${t}`}
              >
                <X size={11} aria-hidden />
              </button>
            </span>
          ))}
          <input
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              } else if (e.key === "Backspace" && !tagDraft && tags.length) {
                setTags((prev) => prev.slice(0, -1));
              }
            }}
            placeholder={tags.length === 0 ? "Add subject…" : ""}
          />
        </div>
      </Story>

      <Story
        title=".help-banner"
        sub="Warm-amber inline tip — distinct from accent so it doesn't compete with primary actions"
        code={`<div className="help-banner">
  <Lightbulb size={14} aria-hidden />
  <span><b>Tip.</b> Fill what you have — you can complete the rest later.</span>
  <button className="help-banner__close" aria-label="Dismiss">×</button>
</div>`}
      >
        {helpOpen ? (
          <div className="help-banner" style={{ width: "100%", maxWidth: 540 }}>
            <Lightbulb size={14} aria-hidden style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ flex: 1 }}>
              <b>Tip.</b> Fill what you have — you can complete the rest later. Identity and Role are
              the only required sections.
            </span>
            <button
              type="button"
              className="help-banner__close"
              aria-label="Dismiss tip"
              onClick={() => setHelpOpen(false)}
            >
              <X size={12} aria-hidden />
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn--sm" onClick={() => setHelpOpen(true)}>
            Re-open help banner
          </button>
        )}
      </Story>

      <Story
        title=".disclosure"
        sub="Inline accent link for progressive disclosure inside composer / drawer bodies"
        code={`<button className="disclosure" onClick={() => setOpen(v => !v)}>
  {open ? "Hide" : "Show"} advanced fields <ChevronDown size={11} />
</button>`}
        layout="col"
      >
        <button
          type="button"
          className="disclosure"
          onClick={() => setShowAdvanced((v) => !v)}
          aria-expanded={showAdvanced}
        >
          {showAdvanced ? "Hide" : "Show"} advanced fields
          <ChevronDown
            size={11}
            aria-hidden
            style={{
              transition: "transform 150ms",
              transform: showAdvanced ? "rotate(180deg)" : "none",
            }}
          />
        </button>
        {showAdvanced && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, width: "100%" }}>
            <label className="field">
              <span className="field__label">PAN</span>
              <input className="input" placeholder="ABCDE1234F" />
            </label>
            <label className="field">
              <span className="field__label">Aadhaar</span>
              <input className="input" placeholder="1234 5678 9012" />
            </label>
          </div>
        )}
      </Story>
    </StoryGroup>
  );
}

function SurfacesSection() {
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

function FeedbackSection() {
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

function PaginationDemo() {
  const [page, setPage] = useState(3);
  return (
    <div style={{ width: "100%" }}>
      <Pagination
        currentPage={page}
        totalPages={12}
        onPageChange={setPage}
        totalItems={240}
        itemLabel="students"
      />
    </div>
  );
}

function NavigationSection() {
  const [tab, setTab] = useState("overview");
  const [tabUnderline, setTabUnderline] = useState("overview");

  return (
    <StoryGroup
      id="prim-navigation"
      title="Navigation"
      sub="Tabs (pills + underline) and Breadcrumbs."
    >
      <Story title="Tabs — pills" layout="col">
        <Tabs
          variant="pills"
          activeKey={tab}
          onChange={setTab}
          tabs={[
            { key: "overview", title: "Overview" },
            { key: "fees", title: "Fees" },
            { key: "results", title: "Results" },
            { key: "remarks", title: "Remarks" },
          ]}
        />
      </Story>

      <Story title="Tabs — underline" layout="col">
        <Tabs
          variant="underline"
          activeKey={tabUnderline}
          onChange={setTabUnderline}
          tabs={[
            { key: "overview", title: "Overview" },
            { key: "fees", title: "Fees" },
            { key: "results", title: "Results" },
            { key: "remarks", title: "Remarks", icon: <Mail size={14} /> },
          ]}
        />
      </Story>

      <Story title="Breadcrumbs">
        <Breadcrumbs
          showHomeIcon
          items={[
            { label: "Dashboard", href: "/" },
            { label: "Classes", href: "/classes" },
            { label: "Class 3-A", href: "/classes/3a" },
            { label: "Attendance" },
          ]}
        />
      </Story>
    </StoryGroup>
  );
}

function OverlaysSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <StoryGroup
      id="prim-overlays"
      title="Overlays"
      sub="Tooltip · Popover · DropdownMenu · Modal · Drawer · Dialog · ConfirmDialog. REVAMP-05: all overlays now use frosted glass (--glass-bg / --glass-blur / --shadow-glass), close on ESC and backdrop click, trap focus, and lock body scroll. Choose by hierarchy: tooltip < popover < dropdown < dialog/modal/drawer."
    >
      <Story title="Tooltip · Popover" sub="Hover/focus to reveal — keep tooltips < 8 words">
        <Tooltip content="Add a new student to the class">
          <Button variant="ghost" size="sm" icon={<Plus size={14} />}>Hover me</Button>
        </Tooltip>
        <Tooltip content="Critical action — destroys the record" variant="danger">
          <Button variant="ghost" size="sm">Danger tooltip</Button>
        </Tooltip>
        <Popover
          trigger={<Button variant="ghost" size="sm" icon={<Info size={14} />}>Open popover</Button>}
        >
          <div style={{ maxWidth: 240 }}>
            <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}>Quick info</p>
            <p style={{ fontSize: 12, color: "var(--fg-muted)", margin: 0 }}>
              Popovers are for richer content — multi-line, links, sample charts.
            </p>
          </div>
        </Popover>
      </Story>

      <Story title="DropdownMenu" sub="Use for contextual actions on rows or page-level overflow">
        <DropdownMenu
          trigger={
            <Button variant="ghost" size="sm" icon={<MoreHorizontal size={14} />}>
              Actions
            </Button>
          }
          items={[
            { key: "edit", label: "Edit", icon: <Edit3 size={14} />, shortcut: "⌘E" },
            { key: "send", label: "Send to parent", icon: <Send size={14} /> },
            {
              key: "delete",
              label: "Delete row",
              icon: <Trash2 size={14} />,
              isDestructive: true,
              shortcut: "⌫",
            },
          ]}
        />
      </Story>

      <Story
        title="ExportMenu"
        sub="REVAMP-106 · Standard CSV/Excel/PDF/Print dropdown. Caller passes filtered rows + column descriptors; the primitive handles escaping, filenames (with tabular-nums date), and progress toast."
        code={`<ExportMenu
  filename="students"
  title="Students"
  rows={filteredItems}
  columns={[
    { key: "name", label: "Name" },
    { key: "code", label: "Roll No" },
    { key: "status", label: "Status" },
  ]}
/>`}
      >
        <ExportMenu
          filename="styleguide-sample"
          title="Sample export"
          rows={[
            { name: "Aarav Sharma", code: "S-001", status: "Active" },
            { name: "Diya Patel", code: "S-002", status: "Active" },
            { name: "Kabir Singh", code: "S-003", status: "Inactive" },
          ]}
          columns={[
            { key: "name", label: "Name" },
            { key: "code", label: "Roll No" },
            { key: "status", label: "Status" },
          ]}
        />
      </Story>

      <Story title="Modal" sub="Frosted glass · centered · ESC closes · backdrop click closes · focus trap">
        <Button variant="primary" onClick={() => setModalOpen(true)}>Open modal</Button>
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Promote students to next class"
          description="This will copy active students from the current academic year to the next."
          size="md"
          footer={
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setModalOpen(false)}>Promote</Button>
            </div>
          }
        >
          <p style={{ fontSize: 13, color: "var(--fg-muted)" }}>
            Sample modal body — uses the design-system <code>Modal</code> wrapper around HeroUI.
            Body scrolls inside; footer stays sticky.
          </p>
        </Modal>
      </Story>

      <Story title="Drawer" sub="Right-side default · use for filters and detail editors">
        <Button variant="primary" onClick={() => setDrawerOpen(true)}>Open drawer</Button>
        <Drawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Filter students"
          description="Narrow the list by class, status, or fee state"
          size="md"
          footer={
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Button variant="ghost" onClick={() => setDrawerOpen(false)}>Reset</Button>
              <Button variant="primary" onClick={() => setDrawerOpen(false)}>Apply</Button>
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input label="Class" placeholder="3-A" />
            <Input label="Status" placeholder="Active" />
            <Input label="Fee state" placeholder="Outstanding" />
          </div>
        </Drawer>
      </Story>

      <Story title="ConfirmDialog" sub="alertdialog · Discard / Keep pattern · destructive actions get a built-in confirmation">
        <Button variant="danger" onClick={() => setConfirmOpen(true)} icon={<Trash2 size={14} />}>
          Delete student
        </Button>
        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            toast.success("Deleted (demo)");
          }}
          title="Discard unsaved changes?"
          message="You have unsaved edits. Close without saving?"
          confirmText="Discard"
          cancelText="Keep editing"
          variant="danger"
        />
      </Story>
    </StoryGroup>
  );
}

function PropTablesSection() {
  return (
    <StoryGroup
      id="prim-prop-tables"
      title="Reference"
      sub="Common props for the most-used primitives. Full prop docs live alongside each component file."
    >
      <Story title="Button" layout="col">
        <PropTable
          rows={[
            { name: "variant", type: '"primary"|"accent"|"secondary"|"ghost"|"outline"|"danger"', default: '"primary"' },
            { name: "size", type: '"sm"|"md"|"lg"', default: '"md"' },
            { name: "icon", type: "ReactNode", default: "—" },
            { name: "iconPosition", type: '"left"|"right"', default: '"left"' },
            { name: "loading", type: "boolean", default: "false" },
            { name: "disabled", type: "boolean", default: "false" },
            { name: "fullWidth", type: "boolean", default: "false" },
          ]}
        />
      </Story>

      <Story title="Input" layout="col">
        <PropTable
          rows={[
            { name: "label", type: "ReactNode", default: "—" },
            { name: "description", type: "ReactNode", default: "—" },
            { name: "error", type: "ReactNode", default: "—" },
            { name: "hint", type: "ReactNode", default: "—" },
            { name: "startContent / endContent", type: "ReactNode", default: "—" },
            { name: "size", type: '"sm"|"md"|"lg"', default: '"md"' },
            { name: "required", type: "boolean", default: "false" },
          ]}
        />
      </Story>

      <Story title="Card" layout="col">
        <PropTable
          rows={[
            { name: "padding", type: '"none"|"sm"|"md"|"lg"', default: '"md"' },
            { name: "radius", type: '"md"|"lg"', default: '"md"' },
            { name: "elevation", type: '"flat"|"raised"|"elevated"', default: '"flat"' },
            { name: "border", type: "boolean", default: "true" },
            { name: "interactive", type: "boolean", default: "false" },
            { name: "as", type: "ElementType", default: '"div"' },
          ]}
        />
      </Story>

      <Story title="Avatar" layout="col">
        <PropTable
          rows={[
            { name: "src", type: "string", default: "—" },
            { name: "name", type: "string", default: "—" },
            { name: "size", type: '"xs"|"sm"|"md"|"lg"|"xl"', default: '"md"' },
            { name: "shape", type: '"circle"|"square"', default: '"circle"' },
            { name: "status", type: '"online"|"offline"|"away"|"busy"', default: "—" },
          ]}
        />
      </Story>
    </StoryGroup>
  );
}

export default function PrimitivesSection() {
  return (
    <>
      <ButtonsSection />
      <FormsSection />
      <ComposerAtomsSection />
      <SurfacesSection />
      <FeedbackSection />
      <NavigationSection />
      <OverlaysSection />
      <PropTablesSection />
    </>
  );
}
