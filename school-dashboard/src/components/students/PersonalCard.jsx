function KV({ label, value, mono = true }) {
  return (
    <div className="dp-kv">
      <span className="subtle">{label}</span>
      <span className={mono ? "mono tnum" : undefined}>
        {value || "—"}
      </span>
    </div>
  );
}

export default function PersonalCard({
  dob,
  age,
  gender,
  bloodGroup,
  admissionDate,
}) {
  return (
    <div className="card">
      <div className="card__head">
        <span className="card__title">Personal</span>
      </div>
      <div className="card__body">
        <KV label="Date of birth" value={dob} />
        <KV label="Age" value={age} />
        <KV label="Gender" value={gender} mono={false} />
        <KV label="Blood" value={bloodGroup} />
        <KV label="Admitted" value={admissionDate} />
      </div>
    </div>
  );
}
