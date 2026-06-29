import SectionHead from "../SectionHead";
import ComposerField from "../ComposerField";

export default function ClassSection({
  form,
  set,
  errors,
  registerField,
  uniqueClassNames,
  availableSections,
  done,
}) {
  return (
    <section id="student-section-class" className="section">
      <SectionHead
        title="Class & roll"
        hint="Roll number auto-suggests once class is picked."
        done={done}
      />
      <div className="fgrid fgrid--3">
        <ComposerField
          label="Class"
          required
          name="classGrade"
          error={errors.classGrade}
          registerField={registerField}
        >
          <select
            className={`select ${errors.classGrade ? "input--err" : ""}`}
            value={form.classGrade}
            onChange={(e) => {
              set("classGrade", e.target.value);
              set("section", "");
            }}
          >
            <option value="">Select class</option>
            {uniqueClassNames.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </ComposerField>
        <ComposerField
          label="Section"
          required
          name="section"
          error={errors.section}
          registerField={registerField}
        >
          <select
            className={`select ${errors.section ? "input--err" : ""}`}
            value={form.section}
            onChange={(e) => set("section", e.target.value)}
            disabled={!form.classGrade}
          >
            <option value="">Select section</option>
            {availableSections.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </ComposerField>
        <ComposerField label="Roll number" hint="Auto-suggested · editable">
          <input
            className="input mono tnum"
            value={form.rollNumber}
            onChange={(e) =>
              set("rollNumber", e.target.value.replace(/\D/g, ""))
            }
            inputMode="numeric"
          />
        </ComposerField>
      </div>

      <div className="fgrid cmp-mt12">
        <ComposerField label="Previous school" hint="If transferring in">
          <input
            className="input"
            value={form.previousSchool}
            onChange={(e) => set("previousSchool", e.target.value)}
          />
        </ComposerField>
        <ComposerField label="TC number" hint="From the previous school">
          <input
            className="input mono"
            value={form.tcNumber}
            onChange={(e) => set("tcNumber", e.target.value)}
          />
        </ComposerField>
      </div>
    </section>
  );
}
