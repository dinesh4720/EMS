export default function TimelineRow({ time, title, meta, status, mine, now, done }) {
  return (
    <div
      className={`trow${mine ? " trow--mine" : ""}${now ? " trow--now" : ""}${done ? " trow--done" : ""}`}
      aria-current={now ? "true" : undefined}
    >
      <div className="trow__time">{time}</div>
      <div className="trow__content">
        <div className="trow__top">
          <span className="trow__title">
            {title}
            {mine && <span className="trow__mine-tag">YOU</span>}
          </span>
          {status}
        </div>
        {meta && <div className="trow__meta">{meta}</div>}
      </div>
    </div>
  );
}
