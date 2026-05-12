import {
  IndianRupee,
  Sparkles,
  Check,
  Flag,
} from "lucide-react";

const ICON_BY_KIND = {
  fee: IndianRupee,
  grade: Sparkles,
  att: Check,
  note: Flag,
};

export default function ActivityTimeline({ days }) {
  const list = Array.isArray(days) ? days : [];
  if (list.length === 0) {
    return (
      <div className="card">
        <div className="card__head">
          <span className="card__title">Activity</span>
        </div>
        <div
          className="subtle"
          style={{ padding: 24, textAlign: "center", fontSize: 13 }}
        >
          No recent activity.
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card__head">
        <span className="card__title">Activity</span>
      </div>
      <div className="card__body" style={{ padding: 0 }}>
        {list.map((day, di) => (
          <div key={`${day.day}-${di}`}>
            <div className="timeline__day">{day.day}</div>
            {(day.items || []).map((it, ii) => {
              const Icon = ICON_BY_KIND[it.kind] || Flag;
              return (
                <div key={`${di}-${ii}`} className="timeline__item">
                  <div className="timeline__time mono tnum">{it.time}</div>
                  <div className={`timeline__icon timeline__icon--${it.kind}`}>
                    <Icon size={12} aria-hidden />
                  </div>
                  <div
                    className="col"
                    style={{ flex: 1, lineHeight: 1.3, minWidth: 0 }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 460 }}>
                      {it.text}
                    </span>
                    {it.meta && (
                      <span className="subtle" style={{ fontSize: 11.5 }}>
                        {it.meta}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
