import { Plus, Trash2, Phone } from "lucide-react";
import {
  PARENT_RELATIONSHIPS,
  GUARDIAN_RELATIONSHIPS,
} from "../../../../../constants/studentConstants";
import SectionHead from "../SectionHead";
import ComposerField from "../ComposerField";

export default function ParentsSection({
  form,
  errors,
  registerField,
  classesWithTeachers,
  updateParent,
  addParent,
  removeParent,
  updateSibling,
  addSibling,
  removeSibling,
  done,
}) {
  const relationOptions = [...PARENT_RELATIONSHIPS, ...GUARDIAN_RELATIONSHIPS, "Guardian"];

  return (
    <section id="student-section-parents" className="section">
      <SectionHead
        title="Parents & siblings"
        hint="At least one parent or guardian is required."
        done={done}
      />

      {form.parents.map((p, idx) => {
        const isFirst = idx === 0;
        return (
          <div
            key={p._key}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 12,
              marginBottom: 10,
              background: "var(--surface)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <span style={{ fontWeight: 520, fontSize: 12.5 }}>
                {isFirst ? "Primary parent / guardian" : `Contact ${idx + 1}`}
              </span>
              {!isFirst && (
                <button
                  type="button"
                  className="btn btn--sm btn--ghost"
                  onClick={() => removeParent(idx)}
                  aria-label="Remove contact"
                >
                  <Trash2 size={11} aria-hidden /> Remove
                </button>
              )}
            </div>
            <div className="fgrid">
              <ComposerField
                label="Name"
                required={isFirst}
                name={isFirst ? "parentName" : undefined}
                error={isFirst ? errors.parentName : errors[`additionalParentName_${idx}`]}
                registerField={isFirst ? registerField : undefined}
              >
                <input
                  className={`input ${isFirst && errors.parentName ? "input--err" : ""}`}
                  value={p.name}
                  onChange={(e) => updateParent(idx, "name", e.target.value)}
                />
              </ComposerField>
              <ComposerField label="Relationship">
                <select
                  className="select"
                  value={p.relationship}
                  onChange={(e) => updateParent(idx, "relationship", e.target.value)}
                >
                  {relationOptions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </ComposerField>
              <ComposerField
                label="Phone"
                required={isFirst}
                name={isFirst ? "parentPhone" : undefined}
                error={isFirst ? errors.parentPhone : errors[`additionalParentPhone_${idx}`]}
                registerField={isFirst ? registerField : undefined}
              >
                <div className="field__icon-wrap">
                  <Phone size={12} className="field__icon" aria-hidden />
                  <input
                    className={`input input--with-icon mono tnum ${isFirst && errors.parentPhone ? "input--err" : ""}`}
                    value={p.phone}
                    onChange={(e) =>
                      updateParent(idx, "phone", e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="10-digit"
                  />
                </div>
              </ComposerField>
              <ComposerField
                label="Email"
                name={isFirst ? "parentEmail" : undefined}
                error={isFirst ? errors.parentEmail : errors[`additionalParentEmail_${idx}`]}
                registerField={isFirst ? registerField : undefined}
              >
                <input
                  type="email"
                  className="input"
                  value={p.email}
                  onChange={(e) => updateParent(idx, "email", e.target.value)}
                />
              </ComposerField>
              <ComposerField label="Occupation">
                <input
                  className="input"
                  value={p.occupation}
                  onChange={(e) => updateParent(idx, "occupation", e.target.value)}
                />
              </ComposerField>
              <ComposerField label="WhatsApp on this phone">
                <label className="row gap-2" style={{ alignItems: "center", height: 32 }}>
                  <input
                    type="checkbox"
                    checked={!!p.isWhatsapp}
                    onChange={(e) => updateParent(idx, "isWhatsapp", e.target.checked)}
                  />
                  <span className="subtle" style={{ fontSize: 12 }}>
                    Send updates via WhatsApp
                  </span>
                </label>
              </ComposerField>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        className="disclosure"
        onClick={addParent}
        style={{ marginTop: 4 }}
      >
        <Plus size={11} aria-hidden />
        Add another parent or guardian
      </button>

      <div style={{ marginTop: 18 }}>
        <div className="section__title" style={{ fontSize: 12.5, marginBottom: 6 }}>
          Siblings
        </div>
        {form.siblings.length === 0 && (
          <p className="subtle" style={{ fontSize: 12, marginBottom: 8 }}>
            Add siblings to keep family records linked.
          </p>
        )}
        {form.siblings.map((s, idx) => (
          <div
            key={s._key}
            className="fgrid fgrid--3"
            style={{
              marginBottom: 8,
              padding: 10,
              border: "1px solid var(--border)",
              borderRadius: 8,
              background: "var(--surface)",
            }}
          >
            <ComposerField label="Name">
              <input
                className="input"
                value={s.name}
                onChange={(e) => updateSibling(idx, "name", e.target.value)}
              />
            </ComposerField>
            <ComposerField label="Class (if same school)">
              <select
                className="select"
                value={s.classId}
                onChange={(e) => updateSibling(idx, "classId", e.target.value)}
                disabled={!s.inSameSchool}
              >
                <option value="">—</option>
                {classesWithTeachers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}-{c.section}
                  </option>
                ))}
              </select>
            </ComposerField>
            <ComposerField label="In this school">
              <div className="row gap-2" style={{ alignItems: "center", height: 32 }}>
                <label className="row gap-2" style={{ alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={!!s.inSameSchool}
                    onChange={(e) =>
                      updateSibling(idx, "inSameSchool", e.target.checked)
                    }
                  />
                  <span className="subtle" style={{ fontSize: 12 }}>
                    Yes
                  </span>
                </label>
                <button
                  type="button"
                  className="btn btn--sm btn--ghost"
                  onClick={() => removeSibling(idx)}
                  aria-label="Remove sibling"
                  style={{ marginLeft: "auto" }}
                >
                  <Trash2 size={11} aria-hidden />
                </button>
              </div>
            </ComposerField>
          </div>
        ))}
        <button
          type="button"
          className="disclosure"
          onClick={addSibling}
          style={{ marginTop: 4 }}
        >
          <Plus size={11} aria-hidden />
          Add sibling
        </button>
      </div>
    </section>
  );
}
