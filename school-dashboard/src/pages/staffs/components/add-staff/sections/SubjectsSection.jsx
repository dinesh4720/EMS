import { X, Check } from "lucide-react";
import { ComposerField } from "../ComposerPrimitives";
import { ROLE_OPTIONS, SUBJECT_OPTIONS } from "../composerConstants";

export default function SubjectsSection({
  form,
  set,
  errors,
  registerField,
  departments,
  classDraft,
  setClassDraft,
  addClass,
  removeClass,
  availableClasses,
}) {
  return (
    <section id="composer-section-role" className="section">
      <div className="section__head">
        <div>
          <div className="section__title">Role &amp; teaching</div>
          <div className="section__hint">
            Choose role first — fields below adjust to match.
          </div>
        </div>
      </div>

      <div className="optgrid" style={{ marginBottom: 14 }}>
        {ROLE_OPTIONS.map((r) => (
          <button
            key={r.value}
            type="button"
            className={`opt ${form.role === r.value ? "is-active" : ""}`}
            aria-pressed={form.role === r.value}
            onClick={() => set("role", r.value)}
          >
            <span className="opt__icon">
              <r.icon size={12} strokeWidth={2} />
            </span>
            <span
              className="col"
              style={{ gap: 1, minWidth: 0, alignItems: "flex-start" }}
            >
              <span style={{ fontWeight: 520 }}>{r.label}</span>
              <span className="subtle" style={{ fontSize: 11 }}>{r.sub}</span>
            </span>
            <span className="opt__check">
              <Check size={8} strokeWidth={3} />
            </span>
          </button>
        ))}
      </div>

      <div className="fgrid">
        <ComposerField
          label="Subject"
          required={form.role === "Teaching"}
          name="subject"
          error={errors.subject}
          registerField={registerField}
        >
          <select
            className={`select ${errors.subject ? "input--err" : ""}`}
            value={form.subject}
            onChange={(e) => set("subject", e.target.value)}
            disabled={form.role !== "Teaching"}
            aria-invalid={errors.subject ? "true" : undefined}
          >
            <option value="">
              {form.role === "Teaching"
                ? "Select a subject…"
                : "—"}
            </option>
            {SUBJECT_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </ComposerField>
        <ComposerField label="Department">
          <select
            className="select"
            value={form.dept}
            onChange={(e) => set("dept", e.target.value)}
          >
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </ComposerField>
        <ComposerField
          label="Assigned classes"
          hint="They can take attendance and post grades for these"
          className="span-2"
        >
          <div className="taginput">
            {form.classes.map((c) => (
              <span key={c} className="tagchip">
                {c}
                <button
                  type="button"
                  onClick={() => removeClass(c)}
                  aria-label={`Remove ${c}`}
                >
                  <X size={9} />
                </button>
              </span>
            ))}
            <input
              value={classDraft}
              list="staff-composer-class-options"
              onChange={(e) => setClassDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addClass(classDraft);
                } else if (
                  e.key === "Backspace" &&
                  !classDraft &&
                  form.classes.length
                ) {
                  removeClass(form.classes[form.classes.length - 1]);
                }
              }}
              onBlur={() => addClass(classDraft)}
              placeholder={
                form.classes.length
                  ? "Add another · type 10-C…"
                  : "Add class · type 10-C…"
              }
            />
            <datalist id="staff-composer-class-options">
              {availableClasses.map((c) => (
                <option
                  key={c.id || c.displayName}
                  value={c.displayName || c.id}
                />
              ))}
            </datalist>
          </div>
        </ComposerField>
      </div>
    </section>
  );
}
