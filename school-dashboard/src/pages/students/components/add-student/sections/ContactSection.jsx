import { Mail, Phone } from "lucide-react";
import SectionHead from "../SectionHead";
import ComposerField from "../ComposerField";

export default function ContactSection({ form, set, errors, registerField, done }) {
  return (
    <section id="student-section-contact" className="section">
      <SectionHead
        title="Contact"
        hint="Used for the parent portal invite & emergency calls."
        done={done}
      />
      <div className="fgrid">
        <ComposerField
          label="Student mobile"
          name="mobile"
          error={errors.mobile}
          registerField={registerField}
          hint="Optional · for older students"
        >
          <div className="field__icon-wrap">
            <Phone size={12} className="field__icon" aria-hidden />
            <input
              className={`input input--with-icon mono tnum ${errors.mobile ? "input--err" : ""}`}
              value={form.mobile}
              onChange={(e) =>
                set("mobile", e.target.value.replace(/\D/g, ""))
              }
              placeholder="10-digit"
            />
          </div>
        </ComposerField>
        <ComposerField
          label="Email"
          name="email"
          error={errors.email}
          registerField={registerField}
        >
          <div className="field__icon-wrap">
            <Mail size={12} className="field__icon" aria-hidden />
            <input
              type="email"
              className={`input input--with-icon ${errors.email ? "input--err" : ""}`}
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="optional@school.edu"
            />
          </div>
        </ComposerField>
        <ComposerField label="Address" className="span-2">
          <textarea
            className="textarea"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            placeholder="Street, area"
          />
        </ComposerField>
        <ComposerField label="City">
          <input
            className="input"
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
          />
        </ComposerField>
        <ComposerField label="State">
          <input
            className="input"
            value={form.state}
            onChange={(e) => set("state", e.target.value)}
          />
        </ComposerField>
        <ComposerField
          label="PIN code"
          name="zipCode"
          error={errors.zipCode}
          registerField={registerField}
        >
          <input
            inputMode="numeric"
            maxLength={6}
            className={`input mono tnum ${errors.zipCode ? "input--err" : ""}`}
            value={form.zipCode}
            onChange={(e) =>
              set("zipCode", e.target.value.replace(/\D/g, ""))
            }
            placeholder="6 digits"
          />
        </ComposerField>
        <ComposerField label="Alternate phone">
          <input
            className="input mono tnum"
            value={form.alternatePhone}
            onChange={(e) =>
              set("alternatePhone", e.target.value.replace(/\D/g, ""))
            }
          />
        </ComposerField>
      </div>
    </section>
  );
}
