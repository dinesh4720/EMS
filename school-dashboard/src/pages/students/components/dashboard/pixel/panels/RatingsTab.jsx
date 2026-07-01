import React, { useState } from "react";

import { RATING_DIMENSIONS, ACCENT } from "../sdData";

// Reads a 0–5 rating from either the app's { rating, comment } shape or a bare number.
function readRating(ratings, key) {
  const r = ratings?.[key];
  if (r == null) return 0;
  if (typeof r === "number") return r;
  return Number(r.rating) || 0;
}

export default function RatingsTab({ student, onSave }) {
  const [ratings, setRatings] = useState(() => {
    const src = student?.ratings || {};
    const out = {};
    for (const d of RATING_DIMENSIONS) out[d.key] = readRating(src, d.key);
    return out;
  });

  const setRating = (key, val) => {
    const next = { ...ratings, [key]: val };
    setRatings(next);
    // Persist in the app's { rating, comment } shape, preserving any comment.
    const payload = {};
    for (const d of RATING_DIMENSIONS) {
      const prev = student?.ratings?.[d.key];
      const comment = prev && typeof prev === "object" ? prev.comment || "" : "";
      payload[d.key] = { rating: next[d.key], comment };
    }
    onSave?.({ ratings: payload });
  };

  const vals = RATING_DIMENSIONS.map((d) => ratings[d.key]);
  const avg = vals.reduce((a, c) => a + c, 0) / (vals.length || 1);
  const avgRating = avg.toFixed(1);

  const Star = ({ filled, onClick, size }) => (
    <button type="button" className="sdx-star" onClick={onClick} style={{ color: filled ? "var(--warn)" : "var(--faint)", fontSize: size, lineHeight: 1 }}>
      {filled ? "★" : "☆"}
    </button>
  );

  return (
    <div className="sd-grid2" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {RATING_DIMENSIONS.map((d) => (
          <div key={d.key} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 0", borderBottom: "1px solid var(--divider)" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--tx-2)" }}>{d.label}</span>
              <span style={{ fontSize: 11.5, color: "var(--muted)" }}>{d.desc}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} filled={i <= ratings[d.key]} onClick={() => setRating(d.key, i)} size={18} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ border: "1px solid var(--border)", borderRadius: 13, padding: 22, background: ACCENT.band, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center" }}>
        <span style={{ fontSize: 11.5, fontWeight: 500, color: "var(--acc)", textTransform: "uppercase", letterSpacing: ".05em" }}>Overall rating</span>
        <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 46, fontWeight: 600, color: "var(--tx)", lineHeight: 1 }}>{avgRating}</span>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>out of 5.0 · {RATING_DIMENSIONS.length} dimensions</span>
        <div style={{ display: "flex", gap: 2, marginTop: 4 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} style={{ color: i <= Math.round(avg) ? "var(--warn)" : "var(--faint)", fontSize: 17 }}>
              {i <= Math.round(avg) ? "★" : "☆"}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
