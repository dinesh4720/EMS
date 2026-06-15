import React from "react";
import { Star } from "lucide-react";

function StarRating({ rating, onRate, dimension, readOnly = false }) {
  return (
    <div className="row gap-1" role="group" aria-label={`${dimension} rating`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readOnly && onRate?.(star)}
          aria-label={`Rate ${dimension.toLowerCase()} ${star} out of 5`}
          className="iconbtn"
          style={{ width: 24, height: 24, padding: 0 }}
          disabled={readOnly}
        >
          <Star
            size={16}
            aria-hidden
            fill={star <= rating ? "var(--warn)" : "none"}
            color={star <= rating ? "var(--warn)" : "var(--fg-faint)"}
          />
        </button>
      ))}
    </div>
  );
}

export default StarRating;
