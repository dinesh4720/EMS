import { Calendar as CalendarIcon, Hash, Plus, Upload } from "lucide-react";
import { BLOOD_GROUPS, GENDERS, RELIGIONS, CATEGORIES } from "../../../../../constants/studentConstants";
import SectionHead from "../SectionHead";
import ComposerField from "../ComposerField";
import ComposerAvatar from "../ComposerAvatar";

export default function IdentitySection({
  form,
  set,
  errors,
  dobValidation,
  registerField,
  pictureInputRef,
  picturePreviewUrl,
  initials,
  fullName,
  done,
  handleFile,
}) {
  return (
    <section id="student-section-identity" className="section">
      <SectionHead title="Identity" hint="How they appear on the roster" done={done} />

      <div className="avatar-up cmp-mb14">
        <ComposerAvatar previewUrl={picturePreviewUrl} initials={initials} name={fullName} />
        <div className="avatar-up__body">
          <span className="avatar-up__title">Profile photo</span>
          <span className="subtle subtle--sm">
            JPG or PNG · square · max 5 MB. Initials are used if none.
          </span>
          <div className="avatar-up__row">
            <button
              type="button"
              className="btn btn--sm"
              onClick={() => pictureInputRef.current?.click()}
            >
              <Upload size={11} aria-hidden /> Upload
            </button>
            <button
              type="button"
              className="btn btn--sm btn--ghost subtle"
              onClick={() => set("picture", null)}
            >
              Use initials
            </button>
          </div>
          <input
            ref={pictureInputRef}
            type="file"
            accept="image/*"
            className="hidden-file-input"
            onChange={(e) => handleFile("picture", e.target.files?.[0])}
          />
        </div>
      </div>

      <div className="fgrid">
        <ComposerField
          label="Full name"
          required
          name="fullName"
          error={errors.fullName}
          registerField={registerField}
          className="span-2"
        >
          <input
            className={`input ${errors.fullName ? "input--err" : ""}`}
            value={form.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            placeholder="As on records"
            aria-invalid={errors.fullName ? "true" : undefined}
          />
        </ComposerField>

        <ComposerField
          label="Date of birth"
          required
          name="dateOfBirth"
          error={errors.dateOfBirth || dobValidation?.error}
          hint={dobValidation?.warning}
          registerField={registerField}
        >
          <div className="field__icon-wrap">
            <CalendarIcon size={12} className="field__icon" aria-hidden />
            <input
              type="date"
              className={`input input--with-icon mono tnum ${errors.dateOfBirth ? "input--err" : ""}`}
              value={form.dateOfBirth || ""}
              max={new Date().toISOString().slice(0, 10)}
              min="1900-01-01"
              onChange={(e) => set("dateOfBirth", e.target.value)}
            />
          </div>
        </ComposerField>

        <ComposerField
          label="Gender"
          required
          name="gender"
          error={errors.gender}
          registerField={registerField}
        >
          <select
            className={`select ${errors.gender ? "input--err" : ""}`}
            value={form.gender}
            onChange={(e) => set("gender", e.target.value)}
          >
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </ComposerField>

        <ComposerField
          label="Aadhaar"
          name="aadhaarNumber"
          error={errors.aadhaarNumber}
          hint="12 digits · optional"
          registerField={registerField}
        >
          <div className="field__icon-wrap">
            <Hash size={12} className="field__icon" aria-hidden />
            <input
              inputMode="numeric"
              maxLength={12}
              className={`input input--with-icon mono tnum ${errors.aadhaarNumber ? "input--err" : ""}`}
              value={form.aadhaarNumber}
              onChange={(e) =>
                set("aadhaarNumber", e.target.value.replace(/\D/g, ""))
              }
              placeholder="0000 0000 0000"
            />
          </div>
        </ComposerField>

        <ComposerField label="Blood group">
          <select
            className="select"
            value={form.bloodGroup}
            onChange={(e) => set("bloodGroup", e.target.value)}
          >
            <option value="">—</option>
            {BLOOD_GROUPS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </ComposerField>
      </div>

      <details className="disclosure-block disclosure-block--mt">
        <summary className="disclosure">
          <Plus size={11} aria-hidden />
          Religion, category, nationality &amp; more
        </summary>
        <div className="fgrid cmp-mt12">
          <ComposerField label="Religion">
            <select
              className="select"
              value={form.religion}
              onChange={(e) => set("religion", e.target.value)}
            >
              <option value="">—</option>
              {RELIGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </ComposerField>
          <ComposerField label="Category">
            <select
              className="select"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            >
              <option value="">—</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </ComposerField>
          <ComposerField label="Nationality">
            <input
              className="input"
              value={form.nationality}
              onChange={(e) => set("nationality", e.target.value)}
              placeholder="Indian"
            />
          </ComposerField>
          <ComposerField label="Mother tongue">
            <input
              className="input"
              value={form.motherTongue}
              onChange={(e) => set("motherTongue", e.target.value)}
            />
          </ComposerField>
          <ComposerField label="House">
            <input
              className="input"
              value={form.house}
              onChange={(e) => set("house", e.target.value)}
              placeholder="Red / Green / Blue…"
            />
          </ComposerField>
          <ComposerField label="Medium of instruction">
            <input
              className="input"
              value={form.mediumOfInstruction}
              onChange={(e) => set("mediumOfInstruction", e.target.value)}
              placeholder="English"
            />
          </ComposerField>
        </div>
      </details>
    </section>
  );
}
