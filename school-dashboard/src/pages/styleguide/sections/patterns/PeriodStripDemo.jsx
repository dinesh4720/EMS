import { Story } from "../../shared";

/* ──────────────────────────────────────────────────────────────────
 * Period strip — .period-strip + .period-cell. Phase 6 Classes
 * attendance. Tab list of period cells with state variants.
 * ────────────────────────────────────────────────────────────────── */
export default function PeriodStripDemo() {
  return (
    <Story title="Period cells with state variants" layout="plain">
      <div style={{ padding: 16 }}>
        <div className="period-strip" role="tablist" aria-label="Sample periods" style={{ "--period-count": 8 }}>
          <button type="button" role="tab" className="period-cell period-cell--marked is-selected">
            <span className="period-cell__top">
              <span className="period-cell__num">1</span>
              <span className="period-cell__time">08:00</span>
            </span>
            <span className="period-cell__bottom">
              <span className="dot" aria-hidden />
              <span>Marked</span>
            </span>
          </button>
          <button type="button" role="tab" className="period-cell period-cell--overdue">
            <span className="period-cell__top">
              <span className="period-cell__num">2</span>
              <span className="period-cell__time">08:45</span>
            </span>
            <span className="period-cell__bottom">
              <span className="dot" aria-hidden />
              <span>Overdue</span>
            </span>
          </button>
          <button type="button" role="tab" className="period-cell period-cell--skipped" disabled>
            <span className="period-cell__top">
              <span className="period-cell__num">3</span>
              <span className="period-cell__time">09:30</span>
            </span>
            <span className="period-cell__bottom">
              <span className="dot" aria-hidden />
              <span>Break</span>
            </span>
          </button>
          <button type="button" role="tab" className="period-cell period-cell--live">
            <span className="period-cell__top">
              <span className="period-cell__num">4</span>
              <span className="period-cell__time">09:45</span>
            </span>
            <span className="period-cell__bottom">
              <span className="dot" aria-hidden />
              <span>Live</span>
            </span>
          </button>
          <button type="button" role="tab" className="period-cell period-cell--urgent">
            <span className="period-cell__top">
              <span className="period-cell__num">5</span>
              <span className="period-cell__time">10:30</span>
            </span>
            <span className="period-cell__bottom">
              <span className="dot" aria-hidden />
              <span>Urgent</span>
            </span>
          </button>
          <button type="button" role="tab" className="period-cell period-cell--upcoming">
            <span className="period-cell__top">
              <span className="period-cell__num">6</span>
              <span className="period-cell__time">11:15</span>
            </span>
            <span className="period-cell__bottom">
              <span className="dot" aria-hidden />
              <span>Upcoming</span>
            </span>
          </button>
          <button type="button" role="tab" className="period-cell period-cell--upcoming">
            <span className="period-cell__top">
              <span className="period-cell__num">7</span>
              <span className="period-cell__time">12:00</span>
            </span>
            <span className="period-cell__bottom">
              <span className="dot" aria-hidden />
              <span>Upcoming</span>
            </span>
          </button>
          <button type="button" role="tab" className="period-cell period-cell--upcoming">
            <span className="period-cell__top">
              <span className="period-cell__num">8</span>
              <span className="period-cell__time">12:45</span>
            </span>
            <span className="period-cell__bottom">
              <span className="dot" aria-hidden />
              <span>Upcoming</span>
            </span>
          </button>
        </div>
      </div>
    </Story>
  );
}
