import React, { useMemo, useState } from "react";
import { Edit3 } from "lucide-react";

import StarRating from "./StarRating";

const RATING_DIMENSIONS = [
  { key: "behaviour", label: "Behaviour" },
  { key: "academics", label: "Academics" },
  { key: "extraCurricular", label: "Extra Curricular" },
  { key: "attendance", label: "Attendance" },
  { key: "discipline", label: "Discipline" },
];

function RatingsPanel({ student, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempRatings, setTempRatings] = useState(() => {
    const r = student?.ratings || {};
    const defaults = {};
    for (const dim of RATING_DIMENSIONS) {
      defaults[dim.key] = { rating: 3, comment: "", ...(r[dim.key] || {}) };
    }
    return defaults;
  });

  const currentRatings = student?.ratings || {};

  const overall = useMemo(() => {
    const values = RATING_DIMENSIONS.map((d) => currentRatings[d.key]?.rating).filter(Number.isFinite);
    if (values.length === 0) return null;
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  }, [currentRatings]);

  const handleEdit = () => {
    const r = student?.ratings || {};
    const defaults = {};
    for (const dim of RATING_DIMENSIONS) {
      defaults[dim.key] = { rating: 3, comment: "", ...(r[dim.key] || {}) };
    }
    setTempRatings(defaults);
    setIsEditing(true);
  };

  const handleSave = async () => {
    await onUpdate?.({ ratings: tempRatings });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const setRating = (key, value) => {
    setTempRatings((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), rating: value },
    }));
  };

  const ratingsToShow = isEditing ? tempRatings : currentRatings;

  return (
    <div className="col gap-4">
      <div className="card">
        <div className="card__head">
          <div>
            <span className="card__title">Student Rating</span>
            <p className="subtle" style={{ fontSize: 12, marginTop: 2 }}>
              Overall performance across five dimensions
            </p>
          </div>
          {!isEditing && (
            <button type="button" className="btn" onClick={handleEdit}>
              <Edit3 size={13} aria-hidden /> Edit Ratings
            </button>
          )}
        </div>
        <div style={{ padding: "16px 20px" }}>
          {overall != null && (
            <div className="row gap-3" style={{ marginBottom: 20, alignItems: "center" }}>
              <span
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: "var(--accent)",
                  lineHeight: 1,
                }}
              >
                {overall}
              </span>
              <StarRating rating={Math.round(Number(overall))} dimension="overall" readOnly />
            </div>
          )}

          <div className="col gap-3">
            {RATING_DIMENSIONS.map((dim) => {
              const r = ratingsToShow[dim.key];
              const value = r?.rating ?? 0;
              return (
                <div
                  key={dim.key}
                  className="row gap-3"
                  style={{
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom: "1px solid var(--divider)",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 500, textTransform: "capitalize" }}>
                    {dim.label}
                  </span>
                  <StarRating
                    rating={value}
                    dimension={dim.label}
                    onRate={(v) => setRating(dim.key, v)}
                    readOnly={!isEditing}
                  />
                </div>
              );
            })}
          </div>

          {isEditing && (
            <div className="row gap-2" style={{ marginTop: 20, justifyContent: "flex-end" }}>
              <button type="button" className="btn" onClick={handleCancel}>
                Cancel
              </button>
              <button type="button" className="btn btn--accent" onClick={handleSave}>
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RatingsPanel;
