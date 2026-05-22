import {
  Story,
  StoryGroup,
  Swatch,
  ScaleRow,
  Code,
} from "./shared";

/* ──────────────────────────────────────────────────────────────────
 * Tokens — every token in the system, browsable + copyable.
 * ────────────────────────────────────────────────────────────────── */

const COLOR_GROUPS = [
  {
    title: "Surfaces",
    sub: "Page chrome backgrounds — bg < surface < surface-2 < surface-hover",
    tokens: [
      { varName: "--bg", label: "App background" },
      { varName: "--surface", label: "Surface" },
      { varName: "--surface-2", label: "Surface raised" },
      { varName: "--surface-hover", label: "Surface hover" },
    ],
  },
  {
    title: "Foreground",
    sub: "Text colors — primary > muted > subtle > faint (decorative only)",
    tokens: [
      { varName: "--fg", label: "Primary text", tone: "fg" },
      { varName: "--fg-muted", label: "Muted text", tone: "fg" },
      { varName: "--fg-subtle", label: "Subtle text", tone: "fg" },
      { varName: "--fg-faint", label: "Faint text", tone: "fg" },
    ],
  },
  {
    title: "Borders & dividers",
    sub: "Use `border` for cards, `border-strong` for emphasis, `divider` between rows",
    tokens: [
      { varName: "--border-token", label: "Border" },
      { varName: "--border-strong", label: "Border strong" },
      { varName: "--divider", label: "Divider" },
    ],
  },
  {
    title: "Accent",
    sub: "Single indigo accent — used sparingly for primary actions, links, focus rings",
    tokens: [
      { varName: "--accent", label: "Accent" },
      { varName: "--accent-hover", label: "Accent hover" },
      { varName: "--accent-bg", label: "Accent background" },
      { varName: "--accent-border", label: "Accent border" },
      { varName: "--accent-fg", label: "Accent foreground" },
    ],
  },
  {
    title: "Semantic — Success",
    tokens: [
      { varName: "--ok", label: "OK" },
      { varName: "--ok-bg", label: "OK background" },
      { varName: "--ok-border", label: "OK border" },
      { varName: "--ok-hover", label: "OK hover" },
    ],
  },
  {
    title: "Semantic — Warning",
    tokens: [
      { varName: "--warn", label: "Warn" },
      { varName: "--warn-bg", label: "Warn background" },
      { varName: "--warn-border", label: "Warn border" },
      { varName: "--warn-hover", label: "Warn hover" },
    ],
  },
  {
    title: "Semantic — Danger",
    tokens: [
      { varName: "--danger", label: "Danger" },
      { varName: "--danger-bg", label: "Danger background" },
      { varName: "--danger-border", label: "Danger border" },
      { varName: "--danger-hover", label: "Danger hover" },
    ],
  },
  {
    title: "Semantic — Info",
    tokens: [
      { varName: "--info", label: "Info" },
      { varName: "--info-bg", label: "Info background" },
      { varName: "--info-border", label: "Info border" },
      { varName: "--info-hover", label: "Info hover" },
    ],
  },
  {
    title: "Chart palette",
    sub: "Data visualization — indigo accent + semantic spectrum + grid/axis neutrals",
    tokens: [
      { varName: "--chart-c1", label: "Chart C1 (indigo)" },
      { varName: "--chart-c2", label: "Chart C2 (blue)" },
      { varName: "--chart-c3", label: "Chart C3 (green)" },
      { varName: "--chart-c4", label: "Chart C4 (amber)" },
      { varName: "--chart-c5", label: "Chart C5 (magenta)" },
      { varName: "--chart-grid", label: "Chart grid" },
      { varName: "--chart-axis", label: "Chart axis" },
    ],
  },
  {
    title: "Glass",
    sub: "Backdrop-filter overlays — frosted overlay base",
    tokens: [
      { varName: "--glass-bg", label: "Glass background" },
      { varName: "--glass-border", label: "Glass border" },
      { varName: "--glass-blur", label: "Glass blur filter" },
    ],
  },
];

const TYPE_SCALE = [
  { name: "3xs", value: "9px", code: "text-3xs", sample: "Aa Micro" },
  { name: "2xs", value: "10px", code: "text-2xs", sample: "Aa Dense" },
  { name: "xs", value: "12px", code: "text-xs", sample: "Aa Caption" },
  { name: "sm", value: "14px", code: "text-sm", sample: "Aa Body" },
  { name: "base", value: "16px", code: "text-base", sample: "Aa Body lg" },
  { name: "lg", value: "18px", code: "text-lg", sample: "Aa Subheading" },
  { name: "xl", value: "20px", code: "text-xl", sample: "Aa Section" },
  { name: "2xl", value: "24px", code: "text-2xl", sample: "Aa Page title" },
  { name: "3xl", value: "30px", code: "text-3xl", sample: "Aa Hero" },
];

const RADIUS_SCALE = [
  { name: "sm", value: "4px", code: "rounded-sm" },
  { name: "md", value: "6px", code: "rounded-md" },
  { name: "lg", value: "8px", code: "rounded-lg" },
  { name: "xl", value: "12px", code: "rounded-xl" },
  { name: "2xl", value: "16px", code: "rounded-2xl" },
  { name: "full", value: "9999px", code: "rounded-full" },
];

const SHADOW_SCALE = [
  { name: "xs", code: "shadow-xs", value: "var(--shadow-xs)" },
  { name: "sm", code: "shadow-sm", value: "var(--shadow-sm)" },
  { name: "md", code: "shadow-md", value: "var(--shadow-md)" },
  { name: "lg", code: "shadow-lg", value: "var(--shadow-lg)" },
  { name: "xl", code: "shadow-xl", value: "var(--shadow-xl)" },
  { name: "focus", code: "shadow-focus", value: "var(--shadow-focus)" },
];

const SPACING_SCALE = [
  { name: "1", value: "4px" },
  { name: "2", value: "8px" },
  { name: "3", value: "12px" },
  { name: "4", value: "16px" },
  { name: "5", value: "20px" },
  { name: "6", value: "24px" },
  { name: "8", value: "32px" },
  { name: "10", value: "40px" },
  { name: "12", value: "48px" },
];

const MOTION_DURATIONS = [
  { name: "instant", value: "75ms", code: "duration-instant" },
  { name: "fast", value: "100ms", code: "duration-fast" },
  { name: "base", value: "150ms", code: "duration-base" },
  { name: "slow", value: "200ms", code: "duration-slow" },
  { name: "slower", value: "300ms", code: "duration-slower" },
];

const MOTION_EASING = [
  { name: "linear", value: "linear" },
  { name: "in", value: "cubic-bezier(0.4, 0, 1, 1)" },
  { name: "out", value: "cubic-bezier(0, 0, 0.2, 1)" },
  { name: "in-out", value: "cubic-bezier(0.4, 0, 0.2, 1)" },
  { name: "spring", value: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
];

const Z_INDEX = [
  { name: "z-dropdown", value: 60, sub: "Menus, tooltips, popovers" },
  { name: "z-sticky", value: 80, sub: "Sticky headers, sticky topbars" },
  { name: "z-fixed", value: 100, sub: "Fixed panels, drawers" },
  { name: "z-overlay", value: 200, sub: "Page overlays, backdrops" },
  { name: "z-modal", value: 300, sub: "Modal dialogs" },
  { name: "z-toast", value: 400, sub: "Toasts, snackbars" },
  { name: "z-alert", value: 600, sub: "System banners" },
  { name: "z-photo", value: 9999, sub: "Full-screen photo / editor" },
];

export default function TokensSection() {
  return (
    <>
      {COLOR_GROUPS.map((group) => (
        <StoryGroup
          key={group.title}
          id={`tokens-color-${group.title.toLowerCase().replace(/[^a-z]+/g, "-")}`}
          title={group.title}
          sub={group.sub}
        >
          <Story title="Token swatches" layout="grid">
            {group.tokens.map((t) => (
              <Swatch key={t.varName} {...t} />
            ))}
          </Story>
        </StoryGroup>
      ))}

      <StoryGroup
        id="tokens-typography"
        title="Typography"
        sub="Inter sans + JetBrains mono · 14px base · tabular nums for numbers"
      >
        <Story title="Type scale" layout="col">
          {TYPE_SCALE.map((t) => (
            <ScaleRow
              key={t.name}
              label={t.name}
              value={t.value}
              code={t.code}
              sample={
                <span style={{ fontSize: t.value, color: "var(--fg)" }}>
                  {t.sample}
                </span>
              }
            />
          ))}
        </Story>

        <Story title="Font weights" layout="col">
          {[
            { name: "regular", value: 400 },
            { name: "medium", value: 500 },
            { name: "semibold", value: 600 },
            { name: "bold", value: 700 },
          ].map((w) => (
            <ScaleRow
              key={w.name}
              label={w.name}
              value={String(w.value)}
              code={`font-${w.name}`}
              sample={
                <span
                  style={{ fontSize: 16, fontWeight: w.value, color: "var(--fg)" }}
                >
                  Sphinx of black quartz, judge my vow
                </span>
              }
            />
          ))}
        </Story>

        <Story title="Numerical / mono" layout="col">
          <ScaleRow
            label="Tabular nums"
            code="tnum"
            sample={
              <span className="tnum" style={{ fontSize: 14, color: "var(--fg)" }}>
                ₹1,234,567 · 09:55:42 · 99.9%
              </span>
            }
          />
          <ScaleRow
            label="Mono"
            code="mono"
            sample={
              <span className="mono" style={{ fontSize: 13, color: "var(--fg)" }}>
                schoolId · req.user.schoolId
              </span>
            }
          />
          <ScaleRow
            label="Eyebrow"
            code="text-2xs uppercase tracking-wide"
            sample={
              <span
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "var(--fg-subtle)",
                }}
              >
                Section eyebrow
              </span>
            }
          />
        </Story>
      </StoryGroup>

      <StoryGroup
        id="tokens-radius"
        title="Radius"
        sub="Match the component scale: chips (sm) · inputs (md) · cards (lg) · panels (xl) · hero (2xl) · pills (full)"
      >
        <Story title="Radius scale" layout="col">
          {RADIUS_SCALE.map((r) => (
            <ScaleRow
              key={r.name}
              label={r.name}
              value={r.value}
              code={r.code}
              sample={
                <div
                  className="sg-radius-box"
                  style={{ borderRadius: r.value }}
                  aria-hidden
                />
              }
            />
          ))}
        </Story>
      </StoryGroup>

      <StoryGroup
        id="tokens-shadow"
        title="Elevation"
        sub="Minimalist scale — barely-there. Cards default to flat (no shadow); reserve shadow-md+ for floating overlays."
      >
        <Story title="Shadow scale" layout="col">
          {SHADOW_SCALE.map((s) => (
            <ScaleRow
              key={s.name}
              label={s.name}
              code={s.code}
              sample={<div className="sg-shadow-box" style={{ boxShadow: s.value }} />}
            />
          ))}
        </Story>
      </StoryGroup>

      <StoryGroup
        id="tokens-spacing"
        title="Spacing"
        sub="4px base unit — Tailwind p-*, m-*, gap-* multiply by 4. Semantic aliases: --spacing-content (24), --spacing-section (32), --spacing-gutter (16)."
      >
        <Story title="Spacing scale" layout="col">
          {SPACING_SCALE.map((s) => (
            <ScaleRow
              key={s.name}
              label={`p-${s.name} / gap-${s.name}`}
              value={s.value}
              sample={
                <div
                  className="sg-spacing-bar"
                  style={{ width: s.value }}
                  aria-hidden
                />
              }
            />
          ))}
        </Story>
      </StoryGroup>

      <StoryGroup
        id="tokens-motion"
        title="Motion"
        sub="Short, purposeful, reduced-motion safe. Use these tokens — never ad-hoc durations."
      >
        <Story title="Durations" layout="col">
          {MOTION_DURATIONS.map((d) => (
            <ScaleRow
              key={d.name}
              label={d.name}
              value={d.value}
              code={d.code}
              sample={
                <div className="sg-motion-track" aria-hidden>
                  <span
                    className="sg-motion-dot"
                    style={{ animationDuration: `${parseInt(d.value) * 12}ms` }}
                  />
                </div>
              }
            />
          ))}
        </Story>

        <Story title="Easings" layout="col">
          {MOTION_EASING.map((e) => (
            <ScaleRow
              key={e.name}
              label={e.name}
              code={`ease-${e.name}`}
              sample={
                <div className="sg-motion-track" aria-hidden>
                  <span
                    className="sg-motion-dot"
                    style={{ animationTimingFunction: e.value, animationDuration: "1800ms" }}
                  />
                </div>
              }
            />
          ))}
        </Story>
      </StoryGroup>

      <StoryGroup
        id="tokens-zindex"
        title="Z-index"
        sub="Documented stacking order — never use arbitrary z-[9999]. Each layer has a purpose."
      >
        <Story title="Z-index ladder" layout="plain">
          <div className="sg-z-stack" aria-hidden>
            {Z_INDEX.map((z, i) => (
              <div
                key={z.name}
                className="sg-z-card"
                style={{
                  top: 12 + i * 18,
                  left: 12 + i * 22,
                  zIndex: z.value,
                }}
              >
                {z.name} <span style={{ color: "var(--fg-subtle)" }}>· {z.value}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: 16 }}>
            <div className="sg-prop-table">
              <div className="sg-prop-table__head">
                <span>Token</span>
                <span>Use case</span>
                <span>Value</span>
              </div>
              {Z_INDEX.map((z) => (
                <div key={z.name} className="sg-prop-table__row">
                  <span className="mono sg-prop-table__name">{z.name}</span>
                  <span className="sg-prop-table__type" style={{ color: "var(--fg-muted)", fontFamily: "inherit" }}>
                    {z.sub}
                  </span>
                  <span className="mono sg-prop-table__default">{z.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Story>
      </StoryGroup>

      <StoryGroup
        id="tokens-density"
        title="Density"
        sub="Compact density modifier — toggled via [data-density='compact'] on body."
      >
        <Story
          title="Row & topbar heights"
          sub="Toggle density in the toolbar to preview"
          layout="col"
        >
          <ScaleRow
            label="Default"
            sample={
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Code>--row-h: 36px</Code>
                <Code>--topbar-h: 44px</Code>
              </div>
            }
          />
          <ScaleRow
            label="Compact"
            sample={
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Code>--row-h: 32px</Code>
                <Code>--topbar-h: 40px</Code>
              </div>
            }
          />
        </Story>
      </StoryGroup>
    </>
  );
}
