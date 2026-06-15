import { useState } from "react";
import {
  Search,
  Check,
  X,
  Lightbulb,
  IndianRupee,
  ChevronDown,
  GraduationCap,
  Building2,
  Users,
  Sparkles,
} from "lucide-react";

import { Story, StoryGroup } from "../../shared";

export default function ComposerAtomsSection() {
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
