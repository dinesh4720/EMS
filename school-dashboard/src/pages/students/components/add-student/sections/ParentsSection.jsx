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
            className="cmp-repeat cmp-repeat--parent"
          >
            <div className="cmp-repeat__head">
              <span className="cmp-repeat__label">
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
                <label className="cmp-checkrow cmp-checkrow--field">
                  <input
                    type="checkbox"
                    checked={!!p.isWhatsapp}
                    onChange={(e) => updateParent(idx, "isWhatsapp", e.target.checked)}
                  />
                  <span className="subtle subtle--sm">
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
        className="disclosure disclosure--mt"
        onClick={addParent}
      >
        <Plus size={11} aria-hidden />
        Add another parent or guardian
      </button>

      <div className="cmp-mt18">
        <div className="section__title section__title--sm">
          Siblings
        </div>
        {form.siblings.length === 0 && (
          <p className="subtle subtle--sm subtle--mb8">
            Add siblings to keep family records linked.
          </p>
        )}
        {form.siblings.map((s, idx) => (
          <div
            key={s._key}
            className="fgrid fgrid--3 cmp-repeat"
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
              <div className="cmp-checkrow cmp-checkrow--field">
                <label className="cmp-checkrow">
                  <input
                    type="checkbox"
                    checked={!!s.inSameSchool}
                    onChange={(e) =>
                      updateSibling(idx, "inSameSchool", e.target.checked)
                    }
                  />
                  <span className="subtle subtle--sm">
                    Yes
                  </span>
                </label>
                <button
                  type="button"
                  className="btn btn--sm btn--ghost cmp-ml-auto"
                  onClick={() => removeSibling(idx)}
                  aria-label="Remove sibling"
                >
                  <Trash2 size={11} aria-hidden />
                </button>
              </div>
            </ComposerField>
          </div>
        ))}
        <button
          type="button"
          className="disclosure disclosure--mt"
          onClick={addSibling}
        >
          <Plus size={11} aria-hidden />
          Add sibling
        </button>
      </div>
    </section>
  );
}
