import { Check } from "lucide-react";

/**
 * AllClear — shown when the attention queue is empty.
 * Celebratory, calm, confirms everything is handled.
 */
export default function AllClear({ message = "You're all caught up" }) {
  return (
    <div className="all-clear">
      <div className="all-clear__icon">
        <Check size={20} strokeWidth={2.6} />
      </div>
      <div className="all-clear__text">
        <div className="all-clear__title">{message}</div>
        <div className="all-clear__sub">Nothing needs your attention right now</div>
      </div>
    </div>
  );
}
