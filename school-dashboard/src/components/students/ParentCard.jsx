import { MessageSquare, Mail, Phone } from "lucide-react";
import PhotoAvatar from "../PhotoAvatar";

export default function ParentCard({ parent, onSms, onEmail, onCall }) {
  const p = parent || {};
  const phone = p.phone || "";
  const email = p.email || "";

  return (
    <div className="card">
      <div className="card__head">
        <span className="card__title">Parent / guardian</span>
      </div>
      <div className="card__body">
        <div className="row gap-3">
          <PhotoAvatar
            src={p.picture || p.photo}
            alt={p.name || "Parent"}
            name={p.name || "—"}
            size="md"
            type="parent"
          />
          <div className="col" style={{ lineHeight: 1.3, minWidth: 0 }}>
            <span style={{ fontWeight: 520 }}>{p.name || "—"}</span>
            <span className="subtle" style={{ fontSize: 12 }}>
              {p.relation || "Guardian"}
            </span>
          </div>
        </div>

        <div className="dp-kv" style={{ marginTop: 12 }}>
          <span className="subtle">Phone</span>
          <span className="mono tnum">{phone || "—"}</span>
        </div>
        <div className="dp-kv">
          <span className="subtle">Email</span>
          <span className="mono tnum" style={{ fontSize: 12 }}>
            {email || "—"}
          </span>
        </div>

        <div className="row gap-2" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="btn btn--sm"
            style={{ flex: 1 }}
            onClick={onSms}
            disabled={!phone}
          >
            <MessageSquare size={12} aria-hidden /> SMS
          </button>
          <button
            type="button"
            className="btn btn--sm"
            style={{ flex: 1 }}
            onClick={onEmail}
            disabled={!email}
          >
            <Mail size={12} aria-hidden /> Email
          </button>
          <button
            type="button"
            className="btn btn--sm"
            style={{ flex: 1 }}
            onClick={onCall}
            disabled={!phone}
          >
            <Phone size={12} aria-hidden /> Call
          </button>
        </div>
      </div>
    </div>
  );
}
