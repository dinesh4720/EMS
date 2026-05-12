import { useState, useId } from "react";
import { Check, Copy } from "lucide-react";

/* ──────────────────────────────────────────────────────────────────
 * Style guide shared helpers — keeps section files terse.
 * ────────────────────────────────────────────────────────────────── */

export function CopyButton({ value, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignore */
    }
  };
  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={copied ? "Copied" : label}
      className="sg-copy"
    >
      {copied ? <Check size={11} aria-hidden /> : <Copy size={11} aria-hidden />}
      <span>{copied ? "Copied" : label}</span>
    </button>
  );
}

export function Code({ children }) {
  return (
    <code className="mono sg-code-inline">
      {children}
    </code>
  );
}

export function Story({ id, title, sub, code, children, layout = "row" }) {
  return (
    <article className="sg-story" id={id ? `sg-${id}` : undefined}>
      <header className="sg-story__head">
        <div className="sg-story__title-row">
          <h3 className="sg-story__title">{title}</h3>
          {sub && <span className="sg-story__sub">{sub}</span>}
        </div>
        {code && (
          <CopyButton value={typeof code === "string" ? code : String(code)} />
        )}
      </header>
      <div
        className={`sg-story__canvas sg-story__canvas--${layout}`}
        role="group"
        aria-label={typeof title === "string" ? title : undefined}
      >
        {children}
      </div>
      {code && (
        <pre className="sg-story__code">
          <code>{code}</code>
        </pre>
      )}
    </article>
  );
}

export function StoryGroup({ id, title, sub, children, columns }) {
  return (
    <section className="sg-group" id={id}>
      <header className="sg-group__head">
        <h2 className="sg-group__title">{title}</h2>
        {sub && <p className="sg-group__sub">{sub}</p>}
      </header>
      <div
        className="sg-group__grid"
        style={
          columns
            ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
            : undefined
        }
      >
        {children}
      </div>
    </section>
  );
}

export function Swatch({ varName, label, tone, customBg }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(`var(${varName})`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      className="sg-swatch"
      aria-label={`Copy ${varName}`}
    >
      <span
        className="sg-swatch__chip"
        style={{
          background: customBg ?? `var(${varName})`,
          border: tone === "fg" ? "1px solid var(--border-token)" : undefined,
        }}
      />
      <span className="sg-swatch__meta">
        <span className="sg-swatch__label">{label}</span>
        <span className="sg-swatch__var mono">{varName}</span>
      </span>
      <span className="sg-swatch__copy-hint" aria-hidden>
        {copied ? <Check size={11} /> : <Copy size={11} />}
      </span>
    </button>
  );
}

export function ScaleRow({ label, value, sample, code }) {
  return (
    <div className="sg-scale-row">
      <div className="sg-scale-row__label">
        <span className="sg-scale-row__name">{label}</span>
        {value && <span className="sg-scale-row__value mono">{value}</span>}
      </div>
      <div className="sg-scale-row__sample">{sample}</div>
      {code && <Code>{code}</Code>}
    </div>
  );
}

export function StatePills({ states }) {
  return (
    <div className="sg-state-pills">
      {states.map((s) => (
        <span key={s} className="sg-state-pill">
          {s}
        </span>
      ))}
    </div>
  );
}

export function PropTable({ rows }) {
  return (
    <div className="sg-prop-table">
      <div className="sg-prop-table__head">
        <span>Prop</span>
        <span>Type</span>
        <span>Default</span>
      </div>
      {rows.map((row) => (
        <div key={row.name} className="sg-prop-table__row">
          <span className="mono sg-prop-table__name">{row.name}</span>
          <span className="mono sg-prop-table__type">{row.type}</span>
          <span className="mono sg-prop-table__default">
            {row.default ?? "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Demo({ children, label }) {
  const id = useId();
  return (
    <div className="sg-demo" aria-labelledby={label ? id : undefined}>
      {label && (
        <div id={id} className="sg-demo__label">
          {label}
        </div>
      )}
      <div className="sg-demo__body">{children}</div>
    </div>
  );
}
