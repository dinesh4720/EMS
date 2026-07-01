import { Cake, ArrowRight } from "lucide-react";
import PhotoAvatar from "../../../components/PhotoAvatar";
import EmptyState from "../../../components/ui/EmptyState";

/**
 * MomentsList — birthdays + quick human moments.
 * Compact list of people celebrating today.
 */
export default function MomentsList({ birthdays = [], emptyMessage = "No birthdays today" }) {
  if (!birthdays.length) {
    return (
      <div className="moments-panel__empty">
        <EmptyState icon={Cake} message={emptyMessage} />
      </div>
    );
  }
  return (
    <div className="moments-panel">
      <div className="moments-panel__head">
        <Cake size={13} className="moments-panel__icon" />
        <span className="moments-panel__label">
          {birthdays.length} birthday{birthdays.length === 1 ? "" : "s"} today
        </span>
      </div>
      <ul className="moments-panel__list">
        {birthdays.slice(0, 4).map((person) => (
          <li key={person.id} className="moments-panel__row">
            <PhotoAvatar
              name={person.name}
              src={person.photo || person.picture}
              size="sm"
              type={person.type}
            />
            <div className="moments-panel__name">{person.name}</div>
            <div className="moments-panel__meta">{person.sub}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
