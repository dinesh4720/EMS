import { ChevronLeft, Mail, Phone, MoreHorizontal } from "lucide-react";

/* ──────────────────────────────────────────────────────────────────
 * Detail pane — right rail of the two-pane shell. Head + foot are
 * sticky so primary actions stay reachable while the body scrolls.
 * ────────────────────────────────────────────────────────────────── */
export default function DetailPaneMini({ staff, onClear }) {
  return (
    <aside className="detail-pane" aria-label={`Demo profile for ${staff.name}`}>
      <div className="detail-pane__head">
        <button
          type="button"
          className="iconbtn"
          style={{ width: 22, height: 22 }}
          onClick={onClear}
          aria-label="Back"
        >
          <ChevronLeft size={13} aria-hidden />
        </button>
        <span className="subtle mono tnum" style={{ fontSize: 11 }}>EMP-{staff.id.toUpperCase()}</span>
        <div style={{ flex: 1 }} />
        <button type="button" className="iconbtn" style={{ width: 22, height: 22 }} aria-label="Email">
          <Mail size={13} aria-hidden />
        </button>
        <button type="button" className="iconbtn" style={{ width: 22, height: 22 }} aria-label="Call">
          <Phone size={13} aria-hidden />
        </button>
        <button type="button" className="iconbtn" style={{ width: 22, height: 22 }} aria-label="More">
          <MoreHorizontal size={14} aria-hidden />
        </button>
      </div>
      <div className="detail-pane__hero" style={{ padding: "16px 16px 12px" }}>
        <span
          className="avatar"
          style={{ width: 44, height: 44, fontSize: 15 }}
          aria-hidden
        >
          {staff.initials}
        </span>
        <div className="col" style={{ gap: 2, minWidth: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em" }}>{staff.name}</span>
          <span className="subtle" style={{ fontSize: 12 }}>{staff.role}</span>
          <div className="row gap-2" style={{ marginTop: 4 }}>
            <span className={`status status--${staff.status}`}>
              <span className="dot" aria-hidden />
              {staff.status === "ok" ? "Active" : staff.status === "warn" ? "On leave" : "Inactive"}
            </span>
            <span className="chip mono tnum">3-A</span>
          </div>
        </div>
      </div>
      <div className="detail-pane__metrics" style={{ margin: "0 16px" }}>
        <div className="dp-metric">
          <span className="dp-metric__label">Attendance</span>
          <span className="dp-metric__value mono tnum">94%</span>
        </div>
        <div className="dp-metric">
          <span className="dp-metric__label">Check-in</span>
          <span className="dp-metric__value mono tnum">08:42</span>
        </div>
        <div className="dp-metric">
          <span className="dp-metric__label">Joined</span>
          <span className="dp-metric__value mono tnum" style={{ fontSize: 13 }}>2024-07</span>
        </div>
      </div>
      <div className="detail-pane__section" style={{ padding: "16px" }}>
        <div className="card__title" style={{ marginBottom: 8 }}>Recent activity</div>
        <ul className="dp-feed">
          <li><span className="dp-feed__time mono tnum">09:12</span><span>Checked in</span></li>
          <li><span className="dp-feed__time mono tnum">Mon</span><span>Marked attendance for 3-A</span></li>
          <li><span className="dp-feed__time mono tnum">Mar 14</span><span>Sent term-end remarks</span></li>
        </ul>
      </div>
      <div className="detail-pane__section" style={{ padding: "16px" }}>
        <div className="card__title" style={{ marginBottom: 8 }}>Contact</div>
        <div className="dp-kv"><span className="subtle">Email</span><span className="mono">asha@school.in</span></div>
        <div className="dp-kv"><span className="subtle">Phone</span><span className="mono tnum">+91 98xxx-12345</span></div>
      </div>
      <div className="detail-pane__foot">
        <button type="button" className="btn">View profile</button>
        <button type="button" className="btn btn--accent" style={{ flex: 1 }}>Mark attendance</button>
      </div>
    </aside>
  );
}
