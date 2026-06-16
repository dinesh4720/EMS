import { Story } from "../../shared";

/* ──────────────────────────────────────────────────────────────────
 * Calendar grid — .calendar-month + .calendar-event. Phase 8.
 * Monthly grid with event tones.
 * ────────────────────────────────────────────────────────────────── */
const CAL_DAY_EVENTS = {
  5:  [{ kind: "exam",    text: "Maths" }],
  12: [{ kind: "meeting", text: "PTM" }],
  18: [{ kind: "holiday", text: "Holiday" }],
};

export default function CalendarGridDemo() {
  return (
    <Story title="Monthly grid with event tones" layout="plain">
      <div style={{ padding: 16 }}>
        <div className="calendar-month">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="calendar-month__header">{d}</div>
          ))}
          {Array.from({ length: 28 }).map((_, i) => {
            const day = i + 1;
            const isToday = day === 12;
            const events = CAL_DAY_EVENTS[day] || [];
            return (
              <div
                key={`cal-day-${day}`}
                className={`calendar-month__cell${isToday ? " is-today" : ""}`}
              >
                <div className="calendar-month__date">{day}</div>
                {events.map((e) => (
                  <div key={`cal-event-${day}-${e.kind}`} className={`calendar-event calendar-event--${e.kind}`}>
                    {e.text}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </Story>
  );
}
