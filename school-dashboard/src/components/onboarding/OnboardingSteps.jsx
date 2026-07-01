import { useMemo } from "react";
import { CLASS_ORDER } from "./useOnboardingState";

/* Boards — mirrors the design's option grid (BOARDS_OF_EDUCATION). */
const BOARDS = [
  { name: "CBSE", abbr: "CB", full: "Central Board" },
  { name: "ICSE", abbr: "IC", full: "CISCE" },
  { name: "State Board", abbr: "ST", full: "State" },
  { name: "IB", abbr: "IB", full: "Baccalaureate" },
  { name: "IGCSE", abbr: "IG", full: "Cambridge" },
  { name: "NIOS", abbr: "NI", full: "Open schooling" },
];

const STATES = ["Karnataka", "Maharashtra", "Tamil Nadu", "Delhi", "Kerala", "Telangana", "Uttar Pradesh", "Gujarat", "West Bengal", "Rajasthan", "Andhra Pradesh", "Punjab", "Haryana", "Bihar", "Madhya Pradesh"];

const SUGGESTED_SUBJECTS = ["Sanskrit", "Physical Education", "Art & Craft", "General Knowledge", "Music", "Kannada", "EVS"];

const Kicker = ({ n, children }) => (
  <div className="step-kicker"><span className="k-n">{n}</span> {children}</div>
);

/* ───────────────────────── Welcome ───────────────────────── */
export function WelcomeStep({ data, maxStep, onResume, onStartFresh }) {
  const schoolName = data.schoolName?.trim() || "your school";
  const started = maxStep > 0;
  const labels = ["School profile", "Academic session", "Timings & working days", "Classes & sections", "Subjects", "Review & launch"];
  const checks = labels.map((label, i) => {
    const n = i + 1;
    const status = !started ? "todo" : n < maxStep ? "done" : n === maxStep ? "prog" : "todo";
    return { label, n, status };
  });
  const doneCount = checks.filter((c) => c.status === "done").length;
  const pct = Math.round((doneCount / 6) * 100);

  return (
    <div className="wel">
      <div className="wel-badge"><span className="d"></span> Workspace ready · {data.schoolName?.trim() || "New school"}</div>
      <h1 className="wel-h">Let's get <span className="accent">{schoolName}</span> set up on EMS.</h1>
      <p className="wel-sub">A short guided setup covers everything your school needs to go live — profile, academic session, timings, classes and subjects. You can skip any step and finish it later.</p>

      <div className="resume">
        <div className="resume__head">
          <div>
            <div className="rt">{started ? "Resume where you left off" : "Your setup checklist"}</div>
            <div className="rs">{doneCount} of 6 steps complete{started ? " · pick up where you stopped" : " · about 10 minutes"}</div>
          </div>
          <div className="resume__pct">{pct}%</div>
        </div>
        <div className="rchecks">
          {checks.map((c) => (
            <div key={c.n} className={`rcheck rcheck--${c.status}`}>
              <span className="rcheck__ic">{c.status === "done" ? "✓" : c.n}</span>
              <span className="rcheck__t">{c.label}</span>
              <span className="rcheck__s">{c.status === "done" ? "Done" : c.status === "prog" ? "In progress" : "Not started"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="wel-cta">
        <button className="btn btn--accent btn--lg" onClick={onResume}>{started ? "Resume setup" : "Start setup"} →</button>
        {started && <button className="btn btn--lg" onClick={onStartFresh}>Start from the top</button>}
      </div>
      <div className="wel-meta">
        <span>◷ About 10 minutes</span>
        <span>↻ Auto-saved as you go</span>
        <span>⤓ Skip &amp; return anytime</span>
      </div>
    </div>
  );
}

/* ───────────────────────── Step 1 · Profile ───────────────────────── */
export function ProfileStep({ data, setField, onPickLogo }) {
  return (
    <div>
      <Kicker n="01">School profile</Kicker>
      <h1 className="step-h">Tell us about your institution</h1>
      <p className="step-sub">This identity appears on report cards, fee receipts, transfer certificates and every official document EMS generates.</p>

      <div className="section">
        <div className="section__head"><span className="section__title"><span className="s-ic">◳</span> Logo &amp; identity</span></div>
        <div className="logo-up" style={{ marginBottom: 16 }}>
          <div className="logo-up__c">
            {data.logo ? <img src={data.logo} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 13 }} /> : <span className="ph">school<br />logo</span>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 560, marginBottom: 3 }}>Institution logo</div>
            <div style={{ fontSize: 11.5, color: "var(--fg-muted)", marginBottom: 10 }}>PNG or SVG, square, at least 200×200px. Used on documents &amp; the parent app.</div>
            <button className="btn btn--sm" onClick={onPickLogo}>⤒ Upload logo</button>
          </div>
        </div>
        <div className="fgrid">
          <label className="field span-2">
            <span className="field__label">Institution name <span className="req">*</span></span>
            <input className="input" value={data.schoolName} onChange={(e) => setField("schoolName", e.target.value)} placeholder="e.g. Greenwood High School" />
          </label>
          <label className="field">
            <span className="field__label">UDISE+ code</span>
            <input className="input input--mono" value={data.udise} onChange={(e) => setField("udise", e.target.value.replace(/\D/g, "").slice(0, 11))} maxLength={11} placeholder="29010102345" />
            <span className="field__hint">11-digit national school code</span>
          </label>
          <label className="field">
            <span className="field__label">Affiliation / registration no.</span>
            <input className="input input--mono" value={data.affiliation} onChange={(e) => setField("affiliation", e.target.value)} placeholder="830142" />
          </label>
        </div>
      </div>

      <div className="section">
        <div className="section__head"><span className="section__title"><span className="s-ic">◈</span> Board of education <span className="req" style={{ color: "var(--warn)" }}>*</span></span></div>
        <div className="optgrid">
          {BOARDS.map((b) => (
            <button key={b.name} className={"opt" + (data.board === b.name ? " is-active" : "")} onClick={() => setField("board", b.name)}>
              <span className="opt__ic">{b.abbr}</span>
              <span><span style={{ display: "block" }}>{b.name}</span><span className="opt__sub">{b.full}</span></span>
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section__head"><span className="section__title"><span className="s-ic">✉</span> Contact &amp; address</span></div>
        <div className="fgrid">
          <label className="field"><span className="field__label">Email address</span><input className="input" value={data.email} onChange={(e) => setField("email", e.target.value)} placeholder="office@school.edu.in" /></label>
          <label className="field"><span className="field__label">Phone</span><div className="ipre"><span className="ipre__tag">+91</span><input className="input" value={data.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="80 4123 7788" /></div></label>
          <label className="field span-2"><span className="field__label">Street address</span><input className="input" value={data.street} onChange={(e) => setField("street", e.target.value)} placeholder="14, Sarjapur Main Road, Bellandur" /></label>
          <label className="field"><span className="field__label">City</span><input className="input" value={data.city} onChange={(e) => setField("city", e.target.value)} placeholder="Bengaluru" /></label>
          <label className="field"><span className="field__label">State</span>
            <select className="select" value={data.state} onChange={(e) => setField("state", e.target.value)}>
              {STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="field"><span className="field__label">PIN code</span><input className="input input--mono" value={data.pin} onChange={(e) => setField("pin", e.target.value.replace(/\D/g, "").slice(0, 6))} maxLength={6} placeholder="560103" /></label>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Step 2 · Session ───────────────────────── */
export function SessionStep({ data, setField, derived }) {
  return (
    <div>
      <Kicker n="02">Academic session</Kicker>
      <h1 className="step-h">Set your current academic year</h1>
      <p className="step-sub">Attendance, fees, exams and analytics are all organised around this session. Most Indian schools run April–March.</p>

      <div className="section">
        <div className="fgrid">
          <label className="field span-2"><span className="field__label">Session name <span className="req">*</span></span><input className="input" value={data.sessionName} onChange={(e) => setField("sessionName", e.target.value)} placeholder="2025–26" /><span className="field__hint">Shown on all reports &amp; documents — e.g. 2025–26</span></label>
          <label className="field"><span className="field__label">Session starts <span className="req">*</span></span><input className="input" type="date" value={data.sessionStart} onChange={(e) => setField("sessionStart", e.target.value)} /></label>
          <label className="field"><span className="field__label">Session ends <span className="req">*</span></span><input className="input" type="date" value={data.sessionEnd} onChange={(e) => setField("sessionEnd", e.target.value)} /></label>
        </div>
      </div>

      <div className="statstrip" style={{ marginBottom: 22 }}>
        <div className="statcell"><div className="sv">{derived.months || "—"} <span className="u">months</span></div><div className="sl">Session length</div></div>
        <div className="statcell"><div className="sv">{derived.workingDays ? `~${derived.workingDays}` : "—"}</div><div className="sl">Working days (est.)</div></div>
        <div className="statcell"><div className="sv">4</div><div className="sl">Terms / quarters</div></div>
      </div>

      <div className="toggle-row" style={{ marginBottom: 14 }}>
        <div className="toggle-row__t"><div className="tt">Set this as the active session</div><div className="td">New admissions, attendance and fees default to this year.</div></div>
        <button className={"switch" + (data.setActive ? " is-on" : "")} onClick={() => setField("setActive", !data.setActive)} aria-pressed={data.setActive}></button>
      </div>
      <div className="toggle-row">
        <div className="toggle-row__t"><div className="tt">Import a previous session</div><div className="td">Bring in last year's data for historical reports &amp; promotions.</div></div>
        <button className={"switch" + (data.importPrev ? " is-on" : "")} onClick={() => setField("importPrev", !data.importPrev)} aria-pressed={data.importPrev}></button>
      </div>

      <div className="note" style={{ marginTop: 20 }}><span>◔</span><span><b>Heads up.</b> Session dates can be edited later in Settings → Academics, but changing them after marking attendance will re-bucket existing records.</span></div>
    </div>
  );
}

/* ───────────────────────── Step 3 · Timings ───────────────────────── */
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function periodStrip(start, periods, length, breaks) {
  // Build a simple period preview: insert a short break after P2 and lunch
  // after P4 (mirrors the design), the rest are teaching periods.
  const [sh, sm] = String(start || "08:00").split(":").map(Number);
  let t = (isNaN(sh) ? 8 : sh) * 60 + (isNaN(sm) ? 0 : sm);
  const fmt = (x) => `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`;
  const out = [];
  const P = Math.max(1, Math.min(12, Number(periods) || 8));
  const L = Math.max(20, Math.min(90, Number(length) || 45));
  const breakAfter = breaks >= 2 ? [2, 4] : breaks === 1 ? [3] : [];
  let pNo = 0;
  for (let i = 1; i <= P; i++) {
    pNo++;
    out.push({ n: `P${pNo}`, t: fmt(t), brk: false });
    t += L;
    if (breakAfter.includes(pNo)) {
      const label = pNo === 4 ? "Lunch" : "Break";
      out.push({ n: label, t: fmt(t), brk: true });
      t += pNo === 4 ? 45 : 15;
    }
  }
  return out;
}

export function TimingsStep({ data, setField, toggleDay }) {
  const strip = useMemo(() => periodStrip(data.schoolStart, data.periodsPerDay, data.periodLength, Number(data.breaksPerDay)), [data.schoolStart, data.periodsPerDay, data.periodLength, data.breaksPerDay]);
  return (
    <div>
      <Kicker n="03">Timings &amp; week</Kicker>
      <h1 className="step-h">When does school run?</h1>
      <p className="step-sub">These hours drive the timetable, period-wise attendance and substitution planning.</p>

      <div className="section">
        <div className="section__head"><span className="section__title"><span className="s-ic">◷</span> School hours</span></div>
        <div className="fgrid">
          <label className="field"><span className="field__label">School starts</span><input className="input" type="time" value={data.schoolStart} onChange={(e) => setField("schoolStart", e.target.value)} /></label>
          <label className="field"><span className="field__label">School ends</span><input className="input" type="time" value={data.schoolEnd} onChange={(e) => setField("schoolEnd", e.target.value)} /></label>
        </div>
      </div>

      <div className="section">
        <div className="section__head"><span className="section__title"><span className="s-ic">▦</span> Periods</span><span className="section__hint">{data.periodsPerDay} periods · {data.periodLength} min each</span></div>
        <div className="fgrid--3" style={{ display: "grid", gap: 16, marginBottom: 16 }}>
          <label className="field"><span className="field__label">Periods / day</span><input className="input input--mono" value={data.periodsPerDay} onChange={(e) => setField("periodsPerDay", e.target.value.replace(/\D/g, "").slice(0, 2))} /></label>
          <label className="field"><span className="field__label">Period length</span><div className="ipre"><input className="input" value={data.periodLength} onChange={(e) => setField("periodLength", e.target.value.replace(/\D/g, "").slice(0, 3))} style={{ paddingLeft: 11 }} /><span className="ipre__tag" style={{ left: "auto", right: 11 }}>min</span></div></label>
          <label className="field"><span className="field__label">Breaks / day</span><input className="input input--mono" value={data.breaksPerDay} onChange={(e) => setField("breaksPerDay", e.target.value.replace(/\D/g, "").slice(0, 1))} /></label>
        </div>
        <div className="pstrip">
          {strip.map((b, i) => (
            <div key={i} className={"pblock" + (b.brk ? " pblock--break" : "")}><span className="pn">{b.n}</span><span className="pt">{b.t}</span></div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section__head"><span className="section__title"><span className="s-ic">▤</span> Working days</span><span className="section__hint">Tap to toggle</span></div>
        <div className="dayrow">
          {DAYS.map((d) => (
            <button key={d} className={"daychip" + (data.days[d] ? " is-on" : "")} onClick={() => toggleDay(d)}>{d}</button>
          ))}
        </div>
        <div className="toggle-row" style={{ marginTop: 14 }}>
          <div className="toggle-row__t"><div className="tt">2nd &amp; 4th Saturday holiday</div><div className="td">Common for CBSE schools — auto-marks those Saturdays as holidays.</div></div>
          <button className={"switch" + (data.satHoliday ? " is-on" : "")} onClick={() => setField("satHoliday", !data.satHoliday)} aria-pressed={data.satHoliday}></button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Step 4 · Classes ───────────────────────── */
export function ClassesStep({ data, derived, toggleClass, setClasses, addSection, removeSection }) {
  const presets = {
    pre: () => { const m = {}; CLASS_ORDER.forEach((k) => (m[k] = k !== "11" && k !== "12")); setClasses(m); },
    all: () => { const m = {}; CLASS_ORDER.forEach((k) => (m[k] = true)); setClasses(m); },
    clear: () => { const m = {}; CLASS_ORDER.forEach((k) => (m[k] = false)); setClasses(m); },
  };
  return (
    <div>
      <Kicker n="04">Classes &amp; sections</Kicker>
      <h1 className="step-h">Which grades do you run?</h1>
      <p className="step-sub">Enable the classes your school offers, then add sections. You can fine-tune capacity and class teachers later.</p>

      <div className="preset-row">
        <button className="preset" onClick={presets.pre}>⊕ Pre-primary → 10</button>
        <button className="preset" onClick={presets.all}>⊕ Nursery → 12</button>
        <button className="preset" onClick={presets.clear}>⊘ Clear all</button>
      </div>

      <div className="cgrid" style={{ marginBottom: 20 }}>
        {CLASS_ORDER.map((k) => {
          const on = !!data.classes[k];
          const label = /^\d+$/.test(k) ? "Class " + k : k;
          return (
            <button key={k} className={"ctile " + (on ? "is-on" : "is-off")} onClick={() => toggleClass(k)}>
              <div className="ctile__top">
                <span className="ctile__name">{label}</span>
                <span className="ctile__tick">✓</span>
              </div>
              {on ? (
                <div className="ctile__secs">
                  {(data.sections[k] || []).map((sec) => (
                    <span
                      key={sec}
                      className="secchip"
                      role="button"
                      tabIndex={-1}
                      title={`Remove section ${sec}`}
                      onClick={(e) => { e.stopPropagation(); removeSection(k, sec); }}
                    >{sec}</span>
                  ))}
                  <span
                    className="secchip secchip--add"
                    role="button"
                    tabIndex={-1}
                    title="Add a section"
                    onClick={(e) => { e.stopPropagation(); addSection(k); }}
                  >+</span>
                </div>
              ) : (
                <span className="ctile__off">Not offered</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="statstrip">
        <div className="statcell"><div className="sv tnum">{derived.classCount}</div><div className="sl">Classes enabled</div></div>
        <div className="statcell"><div className="sv tnum">{derived.sectionCount}</div><div className="sl">Sections</div></div>
        <div className="statcell"><div className="sv tnum">~{derived.capacity}</div><div className="sl">Seat capacity (est.)</div></div>
      </div>
    </div>
  );
}

/* ───────────────────────── Step 5 · Subjects ───────────────────────── */
export function SubjectsStep({ data, setField, addSubject, removeSubject }) {
  const suggested = SUGGESTED_SUBJECTS.filter((s) => !data.subjects.some((x) => x.toLowerCase() === s.toLowerCase()));
  return (
    <div>
      <Kicker n="05">Subjects</Kicker>
      <h1 className="step-h">What does {data.schoolName?.trim() || "your school"} teach?</h1>
      <p className="step-sub">Add the subjects offered across your school. You'll map them to specific classes and teachers when you build timetables.</p>

      <div className="section">
        <div className="section__head"><span className="section__title"><span className="s-ic">▣</span> Core subjects</span><span className="section__hint">{data.subjects.length} added</span></div>
        <div className="taginput">
          {data.subjects.map((name) => (
            <span key={name} className="tagchip">{name} <button onClick={() => removeSubject(name)} aria-label={`Remove ${name}`}>×</button></span>
          ))}
          <input
            placeholder="Add a subject…"
            value={data.subjectDraft}
            onChange={(e) => setField("subjectDraft", e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubject(e.target.value); } }}
          />
        </div>
        <div className="preset-row" style={{ marginTop: 14 }}>
          {suggested.map((name) => (
            <button key={name} className="preset" onClick={() => addSubject(name)}>⊕ {name}</button>
          ))}
        </div>
      </div>

      <div className="note"><span>◆</span><span><b>Tip.</b> Languages like Hindi, Kannada &amp; Sanskrit count as separate subjects — add each one your school offers so report cards print correctly.</span></div>
    </div>
  );
}

/* ───────────────────────── Step 6 · Review ───────────────────────── */
export function ReviewStep({ data, derived, goTo }) {
  const subjectsPreview = data.subjects.slice(0, 3).join(", ") + (data.subjects.length > 3 ? " +" + (data.subjects.length - 3) : "");
  const cityLine = [data.city, data.state].filter(Boolean).join(", ") || "—";
  const fmtDate = (d) => { if (!d) return "—"; const dt = new Date(d); return isNaN(dt) ? "—" : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }); };
  return (
    <div>
      <Kicker n="06">Review &amp; launch</Kicker>
      <h1 className="step-h">Everything's ready 🎉</h1>
      <p className="step-sub">Here's a snapshot of your setup. Review it, then launch your dashboard — you can edit any of this in Settings later.</p>

      <div className="rev-grid">
        <div className="rev-card">
          <div className="rev-card__h"><span className="rev-card__t"><span className="ric">◳</span> School profile</span><button className="rev-edit" onClick={() => goTo(1)}>Edit</button></div>
          <dl className="kv">
            <dt>Name</dt><dd>{data.schoolName || "—"}</dd>
            <dt>Board</dt><dd>{data.board}</dd>
            <dt>UDISE+</dt><dd className="mono">{data.udise || "—"}</dd>
            <dt>City</dt><dd>{cityLine}</dd>
          </dl>
        </div>
        <div className="rev-card">
          <div className="rev-card__h"><span className="rev-card__t"><span className="ric">◷</span> Session &amp; timings</span><button className="rev-edit" onClick={() => goTo(2)}>Edit</button></div>
          <dl className="kv">
            <dt>Session</dt><dd>{data.sessionName || "—"}</dd>
            <dt>Dates</dt><dd className="mono">{fmtDate(data.sessionStart)} – {fmtDate(data.sessionEnd)}</dd>
            <dt>Hours</dt><dd className="mono">{data.schoolStart}–{data.schoolEnd}</dd>
            <dt>Periods</dt><dd>{data.periodsPerDay} × {data.periodLength} min</dd>
          </dl>
        </div>
        <div className="rev-card">
          <div className="rev-card__h"><span className="rev-card__t"><span className="ric">▦</span> Classes</span><button className="rev-edit" onClick={() => goTo(4)}>Edit</button></div>
          <dl className="kv">
            <dt>Classes</dt><dd>{derived.classCount} enabled</dd>
            <dt>Sections</dt><dd>{derived.sectionCount}</dd>
            <dt>Capacity</dt><dd>~{derived.capacity} seats</dd>
            <dt>Week</dt><dd>{derived.dayCount} days/wk</dd>
          </dl>
        </div>
        <div className="rev-card">
          <div className="rev-card__h"><span className="rev-card__t"><span className="ric">▣</span> Subjects</span><button className="rev-edit" onClick={() => goTo(5)}>Edit</button></div>
          <dl className="kv">
            <dt>Total</dt><dd>{data.subjects.length} subjects</dd>
            <dt>Sample</dt><dd>{subjectsPreview || "—"}</dd>
          </dl>
        </div>
      </div>

      <div className="rev-next">
        <div className="rev-next__t">What's next after launch</div>
        <div className="rev-next__d">Optional, but most schools tackle these in week one:</div>
        <div className="nextlist">
          <div className="nextitem"><span className="ni">✉</span> Invite teachers &amp; assign class teachers</div>
          <div className="nextitem"><span className="ni">⤓</span> Import students from a CSV or admission forms</div>
          <div className="nextitem"><span className="ni">₹</span> Set up fee heads &amp; structures</div>
        </div>
      </div>
    </div>
  );
}
