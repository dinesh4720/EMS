/* ──────────────────────────────────────────────────────────────────
 * Sticky head + foot — scroll body with pinned chrome. The recipe
 * used inside .detail-pane, .composer, and .drawer. Body gets
 * overflow:auto + min-height:0; head and foot are position:sticky.
 * ────────────────────────────────────────────────────────────────── */
export default function StickyHeadFootDemo() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: 240,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <header
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid var(--divider)",
          background: "var(--surface)",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--fg)",
          position: "sticky",
          top: 0,
          zIndex: 1,
        }}
      >
        Header — stays pinned
      </header>
      <div style={{ flex: 1, overflow: "auto", padding: "14px", minHeight: 0 }}>
        {Array.from({ length: 24 }).map((_, i) => (
          <p
            key={`scroll-row-${i}`}
            style={{
              fontSize: 12.5,
              color: "var(--fg-muted)",
              margin: "0 0 10px",
            }}
          >
            Row {i + 1} — scroll the body and watch the header / footer stay in place.
          </p>
        ))}
      </div>
      <footer
        style={{
          padding: "10px 14px",
          borderTop: "1px solid var(--divider)",
          background: "var(--surface)",
          display: "flex",
          gap: 8,
          justifyContent: "flex-end",
          position: "sticky",
          bottom: 0,
          zIndex: 1,
        }}
      >
        <button type="button" className="btn btn--sm">Cancel</button>
        <button type="button" className="btn btn--accent btn--sm">Confirm</button>
      </footer>
    </div>
  );
}
