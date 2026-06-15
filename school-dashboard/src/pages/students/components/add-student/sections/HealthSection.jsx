import { Plus, Trash2, Phone } from "lucide-react";
import SectionHead from "../SectionHead";
import ComposerField from "../ComposerField";

export default function HealthSection({
  form,
  set,
  updateHealthInfoItem,
  addHealthInfoItem,
  removeHealthInfoItem,
  done,
}) {
  return (
    <section id="student-section-health" className="section">
      <SectionHead
        title="Health & safety"
        hint="Used for emergency dispatch and medical alerts."
        done={done}
      />
      <div className="fgrid">
        <ComposerField label="Medical conditions / allergies" className="span-2">
          <textarea
            className="textarea"
            value={form.medicalConditions}
            onChange={(e) => set("medicalConditions", e.target.value)}
            placeholder="None — or list allergies, conditions, medications…"
          />
        </ComposerField>
        <ComposerField label="Emergency contact name">
          <input
            className="input"
            value={form.emergencyContactName}
            onChange={(e) => set("emergencyContactName", e.target.value)}
          />
        </ComposerField>
        <ComposerField label="Emergency contact phone">
          <div className="field__icon-wrap">
            <Phone size={12} className="field__icon" aria-hidden />
            <input
              className="input input--with-icon mono tnum"
              value={form.emergencyContactPhone}
              onChange={(e) =>
                set(
                  "emergencyContactPhone",
                  e.target.value.replace(/\D/g, "")
                )
              }
              placeholder="10-digit"
            />
          </div>
        </ComposerField>
      </div>

      <div style={{ marginTop: 18 }}>
        <div className="section__title" style={{ fontSize: 12.5, marginBottom: 6 }}>
          Allergies
        </div>
        {form.healthInfo?.allergies?.length === 0 && (
          <p className="subtle" style={{ fontSize: 12, marginBottom: 8 }}>
            Add allergies for medical alerts.
          </p>
        )}
        {form.healthInfo?.allergies?.map((a, idx) => (
          <div
            key={a._key}
            className="fgrid fgrid--2"
            style={{
              marginBottom: 8,
              padding: 10,
              border: "1px solid var(--border)",
              borderRadius: 8,
              background: "var(--surface)",
            }}
          >
            <ComposerField label={`Allergy ${idx + 1} name`}>
              <input
                className="input"
                value={a.name}
                onChange={(e) =>
                  updateHealthInfoItem("allergies", idx, "name", e.target.value)
                }
                placeholder="e.g. Peanuts"
              />
            </ComposerField>
            <ComposerField label="Type">
              <select
                className="select"
                value={a.type}
                onChange={(e) =>
                  updateHealthInfoItem("allergies", idx, "type", e.target.value)
                }
              >
                <option value="">—</option>
                <option value="food">Food</option>
                <option value="medication">Medication</option>
                <option value="environmental">Environmental</option>
                <option value="insect">Insect</option>
                <option value="latex">Latex</option>
                <option value="other">Other</option>
              </select>
            </ComposerField>
            <ComposerField label="Severity">
              <select
                className="select"
                value={a.severity}
                onChange={(e) =>
                  updateHealthInfoItem("allergies", idx, "severity", e.target.value)
                }
              >
                <option value="">—</option>
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
                <option value="life-threatening">Life-threatening</option>
              </select>
            </ComposerField>
            <ComposerField label="Reaction">
              <input
                className="input"
                value={a.reaction}
                onChange={(e) =>
                  updateHealthInfoItem("allergies", idx, "reaction", e.target.value)
                }
                placeholder="e.g. Skin rash"
              />
            </ComposerField>
            <ComposerField label="Notes" className="span-2">
              <input
                className="input"
                value={a.notes}
                onChange={(e) =>
                  updateHealthInfoItem("allergies", idx, "notes", e.target.value)
                }
                placeholder="Additional notes"
              />
            </ComposerField>
            <div className="span-2" style={{ textAlign: "right" }}>
              <button
                type="button"
                className="btn btn--sm btn--ghost"
                onClick={() => removeHealthInfoItem("allergies", idx)}
                aria-label={`Remove allergy ${idx + 1}`}
              >
                <Trash2 size={11} aria-hidden />
                Remove
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="disclosure"
          onClick={() =>
            addHealthInfoItem("allergies", {
              name: "",
              type: "",
              severity: "",
              reaction: "",
              notes: "",
            })
          }
          style={{ marginTop: 4 }}
        >
          <Plus size={11} aria-hidden />
          Add allergy
        </button>
      </div>

      <div style={{ marginTop: 18 }}>
        <div className="section__title" style={{ fontSize: 12.5, marginBottom: 6 }}>
          Medications
        </div>
        {form.healthInfo?.medications?.length === 0 && (
          <p className="subtle" style={{ fontSize: 12, marginBottom: 8 }}>
            Add ongoing medications.
          </p>
        )}
        {form.healthInfo?.medications?.map((m, idx) => (
          <div
            key={m._key}
            className="fgrid fgrid--2"
            style={{
              marginBottom: 8,
              padding: 10,
              border: "1px solid var(--border)",
              borderRadius: 8,
              background: "var(--surface)",
            }}
          >
            <ComposerField label={`Medication ${idx + 1} name`}>
              <input
                className="input"
                value={m.name}
                onChange={(e) =>
                  updateHealthInfoItem("medications", idx, "name", e.target.value)
                }
                placeholder="e.g. Paracetamol"
              />
            </ComposerField>
            <ComposerField label="Dosage">
              <input
                className="input"
                value={m.dosage}
                onChange={(e) =>
                  updateHealthInfoItem("medications", idx, "dosage", e.target.value)
                }
                placeholder="e.g. 500mg"
              />
            </ComposerField>
            <ComposerField label="Frequency">
              <input
                className="input"
                value={m.frequency}
                onChange={(e) =>
                  updateHealthInfoItem("medications", idx, "frequency", e.target.value)
                }
                placeholder="e.g. Twice daily"
              />
            </ComposerField>
            <ComposerField label="Prescribed by">
              <input
                className="input"
                value={m.prescribedBy}
                onChange={(e) =>
                  updateHealthInfoItem("medications", idx, "prescribedBy", e.target.value)
                }
                placeholder="Doctor name"
              />
            </ComposerField>
            <ComposerField label="Start date">
              <input
                className="input"
                value={m.startDate}
                onChange={(e) =>
                  updateHealthInfoItem("medications", idx, "startDate", e.target.value)
                }
                placeholder="DD/MM/YYYY"
              />
            </ComposerField>
            <ComposerField label="End date">
              <input
                className="input"
                value={m.endDate}
                onChange={(e) =>
                  updateHealthInfoItem("medications", idx, "endDate", e.target.value)
                }
                placeholder="DD/MM/YYYY"
              />
            </ComposerField>
            <ComposerField label="Notes" className="span-2">
              <input
                className="input"
                value={m.notes}
                onChange={(e) =>
                  updateHealthInfoItem("medications", idx, "notes", e.target.value)
                }
                placeholder="Additional notes"
              />
            </ComposerField>
            <div className="span-2" style={{ textAlign: "right" }}>
              <button
                type="button"
                className="btn btn--sm btn--ghost"
                onClick={() => removeHealthInfoItem("medications", idx)}
                aria-label={`Remove medication ${idx + 1}`}
              >
                <Trash2 size={11} aria-hidden />
                Remove
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="disclosure"
          onClick={() =>
            addHealthInfoItem("medications", {
              name: "",
              dosage: "",
              frequency: "",
              startDate: "",
              endDate: "",
              prescribedBy: "",
              notes: "",
            })
          }
          style={{ marginTop: 4 }}
        >
          <Plus size={11} aria-hidden />
          Add medication
        </button>
      </div>

      <div style={{ marginTop: 18 }}>
        <div className="section__title" style={{ fontSize: 12.5, marginBottom: 6 }}>
          Health emergency contacts
        </div>
        {form.healthInfo?.emergencyContacts?.length === 0 && (
          <p className="subtle" style={{ fontSize: 12, marginBottom: 8 }}>
            Add contacts for medical emergencies.
          </p>
        )}
        {form.healthInfo?.emergencyContacts?.map((c, idx) => (
          <div
            key={c._key}
            className="fgrid fgrid--2"
            style={{
              marginBottom: 8,
              padding: 10,
              border: "1px solid var(--border)",
              borderRadius: 8,
              background: "var(--surface)",
            }}
          >
            <ComposerField label={`Contact ${idx + 1} name`}>
              <input
                className="input"
                value={c.name}
                onChange={(e) =>
                  updateHealthInfoItem("emergencyContacts", idx, "name", e.target.value)
                }
                placeholder="Contact name"
              />
            </ComposerField>
            <ComposerField label="Relationship">
              <input
                className="input"
                value={c.relationship}
                onChange={(e) =>
                  updateHealthInfoItem("emergencyContacts", idx, "relationship", e.target.value)
                }
                placeholder="e.g. Uncle"
              />
            </ComposerField>
            <ComposerField label="Phone">
              <div className="field__icon-wrap">
                <Phone size={12} className="field__icon" aria-hidden />
                <input
                  className="input input--with-icon mono tnum"
                  value={c.phone}
                  onChange={(e) =>
                    updateHealthInfoItem(
                      "emergencyContacts",
                      idx,
                      "phone",
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                  placeholder="10-digit"
                />
              </div>
            </ComposerField>
            <ComposerField label="Alternate phone">
              <div className="field__icon-wrap">
                <Phone size={12} className="field__icon" aria-hidden />
                <input
                  className="input input--with-icon mono tnum"
                  value={c.alternatePhone}
                  onChange={(e) =>
                    updateHealthInfoItem(
                      "emergencyContacts",
                      idx,
                      "alternatePhone",
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                  placeholder="10-digit"
                />
              </div>
            </ComposerField>
            <ComposerField label="Email">
              <input
                className="input"
                value={c.email}
                onChange={(e) =>
                  updateHealthInfoItem("emergencyContacts", idx, "email", e.target.value)
                }
                placeholder="Email address"
              />
            </ComposerField>
            <ComposerField label="Priority">
              <input
                className="input"
                type="number"
                value={c.priority ?? ""}
                onChange={(e) =>
                  updateHealthInfoItem(
                    "emergencyContacts",
                    idx,
                    "priority",
                    e.target.value ? parseInt(e.target.value) : ""
                  )
                }
                placeholder="e.g. 1"
              />
            </ComposerField>
            <div className="span-2" style={{ textAlign: "right" }}>
              <button
                type="button"
                className="btn btn--sm btn--ghost"
                onClick={() => removeHealthInfoItem("emergencyContacts", idx)}
                aria-label={`Remove emergency contact ${idx + 1}`}
              >
                <Trash2 size={11} aria-hidden />
                Remove
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="disclosure"
          onClick={() =>
            addHealthInfoItem("emergencyContacts", {
              name: "",
              relationship: "",
              phone: "",
              alternatePhone: "",
              email: "",
              priority: 1,
            })
          }
          style={{ marginTop: 4 }}
        >
          <Plus size={11} aria-hidden />
          Add emergency contact
        </button>
      </div>

      <div className="fgrid" style={{ marginTop: 12 }}>
        <ComposerField label="Services">
          <div className="row gap-2" style={{ alignItems: "center", height: 32 }}>
            <label className="row gap-2" style={{ alignItems: "center" }}>
              <input
                type="checkbox"
                checked={!!form.transportRequired}
                onChange={(e) => set("transportRequired", e.target.checked)}
              />
              <span className="subtle" style={{ fontSize: 12 }}>
                Transport
              </span>
            </label>
            <label className="row gap-2" style={{ alignItems: "center" }}>
              <input
                type="checkbox"
                checked={!!form.hostelRequired}
                onChange={(e) => set("hostelRequired", e.target.checked)}
              />
              <span className="subtle" style={{ fontSize: 12 }}>
                Hostel
              </span>
            </label>
          </div>
        </ComposerField>
      </div>
    </section>
  );
}
