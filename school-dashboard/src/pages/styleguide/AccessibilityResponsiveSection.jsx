import { Check, Smartphone, Tablet, Monitor, Tv } from "lucide-react";

import { Story, StoryGroup, Code } from "./shared";

/* ──────────────────────────────────────────────────────────────────
 * Accessibility & Responsive — operating principles + checklists.
 * ────────────────────────────────────────────────────────────────── */

const A11Y_ITEMS = [
  {
    title: "Semantic HTML first",
    sub: "Use <button>, <nav>, <main>, <header>, <h1-h3> before reaching for ARIA. ARIA only fills semantic gaps (modals, comboboxes, tabs).",
  },
  {
    title: "Keyboard operable",
    sub: "Every interactive element reachable by Tab. Logical tab order. No keyboard traps. Modals/drawers focus-trap and restore focus on close.",
  },
  {
    title: "Visible focus rings",
    sub: "All primitives ship focus-visible:ring-[var(--color-primary)]/30 with offset 2px. Never remove :focus-visible.",
  },
  {
    title: "Contrast ≥ AA",
    sub: "4.5:1 for body text, 3:1 for large text and UI controls. Decorative tokens (--fg-faint) are explicitly not for body text.",
  },
  {
    title: "Form labels are associated",
    sub: "Every <input> has a programmatically-associated <label> (or aria-label). FormField/Input wrappers handle this automatically.",
  },
  {
    title: "Errors announced via aria-live",
    sub: "Field errors use role=\"alert\". Toasts use role=\"status\" / role=\"alert\" depending on severity.",
  },
  {
    title: "Decorative icons are aria-hidden",
    sub: "Lucide icons next to text labels: aria-hidden. Standalone icon buttons: aria-label or wrap in Tooltip.",
  },
  {
    title: "Color is not the only signal",
    sub: "StatusBadge ships icons + text. Status pills ship a leading dot. Charts use distinguishable patterns + labels.",
  },
  {
    title: "prefers-reduced-motion respected",
    sub: "All design-system animations short-circuit when prefers-reduced-motion: reduce. Don't add ad-hoc CSS animations without checking.",
  },
  {
    title: "Touch targets ≥ 44×44",
    sub: "Buttons sm = 32, md = 36, lg = 44. On mobile screens prefer md+ for primary actions.",
  },
];

const BREAKPOINTS = [
  {
    name: "Mobile",
    range: "375px",
    icon: Smartphone,
    sub: "Test golden path here — reach + thumb zones",
    width: 375,
  },
  {
    name: "Tablet",
    range: "768px",
    icon: Tablet,
    sub: "Sidebar collapses · two-column layouts collapse to single",
    width: 768,
  },
  {
    name: "Desktop",
    range: "1280px",
    icon: Monitor,
    sub: "Default design target — full sidebar + content + drawer",
    width: 1280,
  },
  {
    name: "Wide",
    range: "1536px+",
    icon: Tv,
    sub: "Don't widen content past max-w-7xl — keep line lengths readable",
    width: 1536,
  },
];

export default function AccessibilityResponsiveSection() {
  return (
    <>
      <StoryGroup
        id="a11y"
        title="Accessibility"
        sub="Every primitive ships at WCAG 2.1 AA — preserve the bar when composing. Run this checklist on every new screen."
      >
        <Story title="Checklist" layout="plain">
          <div className="sg-a11y-list">
            {A11Y_ITEMS.map((item) => (
              <div key={item.title} className="sg-a11y-item">
                <span className="sg-a11y-item__check" aria-hidden>
                  <Check size={11} />
                </span>
                <div className="sg-a11y-item__body">
                  <p className="sg-a11y-item__title">{item.title}</p>
                  <p className="sg-a11y-item__sub">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </Story>

        <Story title="Focus ring — try tabbing through" sub="Every interactive primitive should look like this when focused">
          <button
            className="btn"
            type="button"
            style={{ outline: "none" }}
          >
            Tab to focus me
          </button>
          <button
            className="btn btn--accent"
            type="button"
            style={{ outline: "none" }}
          >
            Then me
          </button>
          <input
            type="text"
            placeholder="Then me"
            style={{
              padding: "6px 10px",
              border: "1px solid var(--border-token)",
              borderRadius: 6,
              fontSize: 12,
            }}
          />
        </Story>

        <Story title="Tools" layout="col">
          <ul style={{ fontSize: 13, color: "var(--fg-muted)", lineHeight: 1.7, paddingLeft: 20 }}>
            <li>
              <strong style={{ color: "var(--fg)" }}>Axe DevTools</strong> — automated audit in
              Chrome devtools. Run before every PR.
            </li>
            <li>
              <strong style={{ color: "var(--fg)" }}>Keyboard-only pass</strong> — disconnect
              your mouse and traverse the screen end-to-end.
            </li>
            <li>
              <strong style={{ color: "var(--fg)" }}>VoiceOver / NVDA</strong> — read every
              new flow aloud. Roles, labels, and order should make sense.
            </li>
            <li>
              <strong style={{ color: "var(--fg)" }}>Forced colors mode</strong> — preview at
              Windows High Contrast (Edge: emulate forced-colors).
            </li>
          </ul>
        </Story>
      </StoryGroup>

      <StoryGroup
        id="responsive"
        title="Responsive"
        sub="Verify every screen at 375 / 768 / 1280. The dashboard does not target widths < 320px or watch screens."
      >
        <Story title="Breakpoints" layout="col">
          {BREAKPOINTS.map((b) => {
            const Icon = b.icon;
            const pct = Math.round((b.width / BREAKPOINTS[BREAKPOINTS.length - 1].width) * 100);
            return (
              <div key={b.name} className="sg-breakpoint-row">
                <Icon size={16} style={{ color: "var(--fg-muted)" }} aria-hidden />
                <div style={{ minWidth: 110 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>{b.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--fg-subtle)" }}>{b.range}</div>
                </div>
                <div
                  className="sg-breakpoint-row__bar"
                  style={{ "--bar-width": `${pct}%` }}
                  aria-hidden
                />
                <span style={{ fontSize: 12, color: "var(--fg-muted)", minWidth: 280 }}>
                  {b.sub}
                </span>
              </div>
            );
          })}
        </Story>

        <Story title="Layout patterns" layout="col">
          <ul style={{ fontSize: 13, color: "var(--fg-muted)", lineHeight: 1.7, paddingLeft: 20 }}>
            <li>
              <strong style={{ color: "var(--fg)" }}>Sidebar</strong> — collapses to icon-only
              at &lt; 1024px, drawer at &lt; 768px. Width tokens:{" "}
              <Code>--sidebar-w</Code> / <Code>--sidebar-w-collapsed</Code>.
            </li>
            <li>
              <strong style={{ color: "var(--fg)" }}>Tables</strong> — fall back to stacked
              card-rows below 768px when columns &gt; 4. Use{" "}
              <Code>VirtualizedTable</Code> for &gt; 200 rows.
            </li>
            <li>
              <strong style={{ color: "var(--fg)" }}>Drawers</strong> — full-bleed sheets on
              mobile, fixed-width side panels on desktop. Default width{" "}
              <Code>--panel-width-md</Code>.
            </li>
            <li>
              <strong style={{ color: "var(--fg)" }}>Charts</strong> — height tokens (
              <Code>--chart-height-sm/md/lg</Code>) so charts scale proportionally without
              arbitrary <Code>h-[*]</Code> values.
            </li>
          </ul>
        </Story>

        <Story title="Container queries" sub="Prefer for layout where the parent context drives the breakpoint">
          <pre className="sg-story__code" style={{ background: "var(--surface)" }}>
{`/* Use container queries for component-local responsiveness */
.card-grid {
  container-type: inline-size;
}

@container (min-width: 480px) {
  .card-grid > .card { grid-column: span 2; }
}`}
          </pre>
        </Story>
      </StoryGroup>
    </>
  );
}
