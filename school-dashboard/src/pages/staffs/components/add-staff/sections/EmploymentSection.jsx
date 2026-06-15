import {
  Check,
  Calendar as CalendarIcon,
  IndianRupee,
  Plus,
  Mail,
  Phone,
} from "lucide-react";
import toast from "react-hot-toast";
import { ComposerField } from "../ComposerPrimitives";
import { EMPLOYMENT_OPTIONS } from "../composerConstants";

function ContactSubsection({ form, set, errors, registerField, sectionStatusIndex }) {
  return (
    <section id="composer-section-contact" className="section">
      <div className="section__head">
        <div>
          <div className="section__title">Contact</div>
          <div className="section__hint">
            Used for the invite email and SMS confirmations.
          </div>
        </div>
        {sectionStatusIndex.done ? (
          <span className="chip chip--ok">
            <Check size={9} strokeWidth={2.5} aria-hidden /> Looks good
          </span>
        ) : sectionStatusIndex.filled < sectionStatusIndex.total ? (
          <span className="chip chip--warn">
            {sectionStatusIndex.total - sectionStatusIndex.filled} missing
          </span>
        ) : null}
      </div>

      <div className="fgrid">
        <ComposerField
          label="Email"
          required
          hint="Invite goes here"
          name="email"
          error={errors.email}
          registerField={registerField}
        >
          <div className="field__icon-wrap">
            <Mail size={12} className="field__icon" aria-hidden />
            <input
              className={`input input--with-icon ${errors.email ? "input--err" : ""}`}
              value={form.email}
              type="email"
              onChange={(e) => set("email", e.target.value)}
              placeholder="anika.rao@school.edu"
              aria-invalid={errors.email ? "true" : undefined}
            />
          </div>
        </ComposerField>
        <ComposerField
          label="Phone"
          required
          name="phone"
          error={errors.phone}
          registerField={registerField}
        >
          <div className="field__icon-wrap">
            <Phone size={12} className="field__icon" aria-hidden />
            <input
              className={`input input--with-icon mono tnum ${errors.phone ? "input--err" : ""}`}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+91 98765 12345"
              aria-invalid={errors.phone ? "true" : undefined}
            />
          </div>
        </ComposerField>
        <ComposerField label="Emergency contact" hint="Name and phone">
          <input
            className="input"
            value={form.emergencyContact}
            onChange={(e) => set("emergencyContact", e.target.value)}
            placeholder="—"
          />
        </ComposerField>
        <ComposerField label="Address" className="span-2">
          <textarea
            className="textarea"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            placeholder="Optional · used on official letters"
          />
        </ComposerField>
      </div>
    </section>
  );
}

function EmploymentSubsection({ form, set }) {
  return (
    <section id="composer-section-employment" className="section">
      <div className="section__head">
        <div>
          <div className="section__title">Employment</div>
          <div className="section__hint">
            Payroll uses these. You can edit later.
          </div>
        </div>
      </div>

      <div className="fgrid fgrid--3">
        <ComposerField label="Joining date" required>
          <div className="field__icon-wrap">
            <CalendarIcon size={12} className="field__icon" aria-hidden />
            <input
              type="date"
              className="input input--with-icon mono tnum"
              value={form.joinDate}
              onChange={(e) => set("joinDate", e.target.value)}
            />
          </div>
        </ComposerField>
        <ComposerField label="Employment type">
          <select
            className="select"
            value={form.employmentType}
            onChange={(e) => set("employmentType", e.target.value)}
          >
            {EMPLOYMENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </ComposerField>
        <ComposerField label="Monthly salary" hint="Gross · INR">
          <div className="field__icon-wrap">
            <IndianRupee size={12} className="field__icon" aria-hidden />
            <input
              className="input input--with-icon input--with-suffix mono tnum"
              value={form.salary}
              onChange={(e) => set("salary", e.target.value)}
              placeholder="58000"
            />
            <span className="field__suffix">/ month</span>
          </div>
        </ComposerField>
      </div>

      <div className="row gap-2" style={{ marginTop: 12 }}>
        <button
          type="button"
          className="disclosure"
          onClick={() =>
            toast(
              "Bank, PAN, and PF details — open the Edit drawer after invite."
            )
          }
        >
          <Plus size={11} aria-hidden />
          Add bank, PAN, and PF details
        </button>
      </div>
    </section>
  );
}

export default function EmploymentSection(props) {
  return (
    <>
      <ContactSubsection {...props} />
      <EmploymentSubsection {...props} />
    </>
  );
}
