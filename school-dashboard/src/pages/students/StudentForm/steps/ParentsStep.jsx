import { useRef } from "react";
import { Input, Select, Checkbox, Textarea, Button } from "../../../../components/ui";
import { X, Users } from "lucide-react";
import { PARENT_RELATIONSHIPS, GUARDIAN_RELATIONSHIPS } from "../../../../constants/studentConstants";
import { useTranslation } from 'react-i18next';

/**
 * Parents and Guardians Step for Student Form
 * Extracted from AddStudent.jsx
 */
export default function ParentsStep({
  formData,
  errors,
  updateParent,
  addParent,
  removeParent,
  updateSibling,
  addSibling,
  removeSibling,
  updateField,
  classesWithTeachers,
  parentNameRef,
  parentPhoneRef,
  updateHealthInfoItem,
  addHealthInfoItem,
  removeHealthInfoItem,
}) {
  const { t } = useTranslation();
  const parents = formData.parents.filter((p) => p.isParent);
  const guardians = formData.parents.filter((p) => !p.isParent);

  return (
    <div className="space-y-5 animate-fade-in text-left">
      {/* Parent Details */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold text-fg">{t('pages.parentDetails')}</label>
        </div>

        {parents.map((parent, idx) => {
          const index = formData.parents.findIndex((p) => p === parent);
          return (
            <ParentCard
              key={`parent-${idx}`}
              parent={parent}
              index={index}
              idx={idx}
              errors={errors}
              updateParent={updateParent}
              removeParent={removeParent}
              canRemove={parents.length > 1}
              parentNameRef={idx === 0 ? parentNameRef : null}
              parentPhoneRef={idx === 0 ? parentPhoneRef : null}
            />
          );
        })}

        {parents.length < 2 && (
          <button
            className="text-sm font-medium text-primary hover:text-[var(--accent)] transition-colors"
            onClick={addParent}
          >
            + Add Another Parent
          </button>
        )}
      </div>

      {/* Guardian Details */}
      <GuardiansSection
        guardians={guardians}
        formData={formData}
        updateParent={updateParent}
        removeParent={removeParent}
        addGuardian={() => addParent({ isParent: false, relationship: "Guardian" })}
      />

      {/* Sibling Details */}
      <SiblingsSection
        siblings={formData.siblings}
        updateSibling={updateSibling}
        addSibling={addSibling}
        removeSibling={removeSibling}
        classesWithTeachers={classesWithTeachers}
      />

      {/* Health & Safety */}
      <HealthSection
        formData={formData}
        updateField={updateField}
        updateHealthInfoItem={updateHealthInfoItem}
        addHealthInfoItem={addHealthInfoItem}
        removeHealthInfoItem={removeHealthInfoItem}
      />

      {/* Transport & Hostel */}
      <TransportSection formData={formData} updateField={updateField} />
    </div>
  );
}

function ParentCard({
  parent,
  index,
  idx,
  errors,
  updateParent,
  removeParent,
  canRemove,
  parentNameRef,
  parentPhoneRef,
}) {
  const { t } = useTranslation();
  return (
    <div className="p-4 bg-surface-2 rounded-lg border border-divider space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-fg">
          {idx === 0 ? "Primary Parent" : `Parent ${idx + 1}`}
        </span>
        {canRemove && (
          <Button size="sm" variant="danger" onClick={() => removeParent(index)}>
            <X size={14} /> Remove
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div ref={parentNameRef}>
          <Input
            label={t('pages.fullName1')}
            placeholder={t('pages.parentName1')}
            value={parent.name}
            onChange={(e) => { const v = e.target.value; updateParent(index, "name", v); }}
            error={idx === 0 ? errors.parentName : ""}
            required={idx === 0}
          />
        </div>
        <Select
          label={t('pages.relationship')}
          placeholder={t('pages.select1')}
          value={parent.relationship || ""}
          onChange={(e) => { const v = e.target.value; updateParent(index, "relationship", v); }}
          options={PARENT_RELATIONSHIPS.map((r) => ({ value: r, label: r }))}
        />
        <div className="space-y-2" ref={parentPhoneRef}>
          <Input
            label={t('pages.phoneNumber')}
            startContent={<span className="text-fg-faint text-xs">+91</span>}
            placeholder={t('students.form.phonePlaceholder')}
            value={parent.phone}
            onChange={(e) => {
              const v = e.target.value;
              const digitsOnly = v.replace(/\D/g, "").slice(0, 10);
              updateParent(index, "phone", digitsOnly);
            }}
            error={idx === 0 ? errors.parentPhone : ""}
            required={idx === 0}
            maxLength={10}
          />
          <Checkbox
            size="sm"
            checked={parent.isWhatsapp}
            onChange={(e) => { const v = e.target.checked; updateParent(index, "isWhatsapp", v); }}
            label="Same as WhatsApp"
          />
        </div>
        <Input
          label={t('pages.email1')}
          placeholder={t('students.form.parentEmailPlaceholder')}
          value={parent.email}
          onChange={(e) => { const v = e.target.value; updateParent(index, "email", v); }}
        />
        <Input
          label={t('pages.occupation')}
          placeholder={t('students.form.occupationPlaceholder')}
          value={parent.occupation}
          onChange={(e) => { const v = e.target.value; updateParent(index, "occupation", v); }}
          className="col-span-2"
        />
      </div>
    </div>
  );
}

function GuardiansSection({ guardians, formData, updateParent, removeParent, addGuardian }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4 pt-2 border-t border-solid border-divider">
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold text-fg">{t('pages.guardianDetails')}</label>
        <span className="text-xs text-fg-muted">(Optional)</span>
      </div>

      {guardians.map((guardian, idx) => {
        const index = formData.parents.findIndex((p) => p === guardian);
        return (
          <div key={`parent-${idx}`} className="p-4 bg-surface-2 rounded-lg border border-divider space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-fg">Guardian {idx + 1}</span>
              <Button size="sm" variant="danger" onClick={() => removeParent(index)}>
                <X size={14} /> Remove
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('pages.fullName1')}
                placeholder={t('pages.guardianName')}
                value={guardian.name}
                onChange={(e) => { const v = e.target.value; updateParent(index, "name", v); }}
              />
              <Select
                label={t('pages.relationship')}
                placeholder={t('pages.select1')}
                value={guardian.relationship || ""}
                onChange={(e) => { const v = e.target.value; updateParent(index, "relationship", v); }}
                options={GUARDIAN_RELATIONSHIPS.map((r) => ({ value: r, label: r }))}
              />
            </div>
          </div>
        );
      })}

      {guardians.length === 0 && (
        <button
          className="text-sm font-medium text-primary hover:text-[var(--accent)] transition-colors"
          onClick={addGuardian}
        >
          + Add Guardian
        </button>
      )}
    </div>
  );
}

function SiblingsSection({ siblings, updateSibling, addSibling, removeSibling, classesWithTeachers }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4 pt-2 border-t border-solid border-divider">
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold text-fg">{t('pages.siblingDetails')}</label>
        <span className="text-xs text-fg-muted">(Optional — same school only)</span>
      </div>

      {siblings.length === 0 && (
        <p className="text-xs text-fg-faint">No siblings added yet. Use the button below to add siblings enrolled in this school.</p>
      )}

      {siblings.map((sibling, idx) => (
        <div key={`sibling-${idx}`} className="p-4 bg-surface-2 rounded-lg border border-divider space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-fg">Sibling {idx + 1}</span>
            <Button size="sm" variant="danger" onClick={() => removeSibling(idx)}>
              <X size={14} /> Remove
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('pages.siblingName')}
              placeholder={t('pages.siblingSFullName')}
              value={sibling.name}
              onChange={(e) => { const v = e.target.value; updateSibling(idx, "name", v); }}
            />
            <div className="flex items-center gap-2 pt-6">
              <Checkbox size="sm"
                checked={sibling.inSameSchool}
                onChange={(e) => {
                  const v = e.target.checked;
                  updateSibling(idx, "inSameSchool", v);
                  if (!v) updateSibling(idx, "classId", "");
                }}
                label={<span className="text-sm text-fg">{t('pages.isSiblingInThisSchool')}</span>}
              />
            </div>
            {sibling.inSameSchool && (
              <Select
                label={t('pages.class1')}
                placeholder={t('pages.selectClass2')}
                value={sibling.classId || ""}
                onChange={(e) => { const v = e.target.value; updateSibling(idx, "classId", v); }}
                options={classesWithTeachers.map((c) => ({ value: c.id, label: `${c.name} ${c.section}` }))}
              />
            )}
          </div>
        </div>
      ))}

      <button className="text-sm font-medium text-primary hover:text-[var(--accent)] transition-colors" onClick={addSibling}>
        + Add Sibling
      </button>
    </div>
  );
}

function HealthSection({ formData, updateField, updateHealthInfoItem, addHealthInfoItem, removeHealthInfoItem }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4 pt-2 border-t border-solid border-divider">
      <label className="text-sm font-semibold text-fg block mt-2">{t('pages.healthSafety')}</label>
      <Textarea
        label={t('pages.medicalConditions1')}
        placeholder={t('pages.anyAllergiesMedicalConditionsOrSpecialNeedsOptional')}
        value={formData.medicalConditions}
        onChange={(e) => { const v = e.target.value; updateField("medicalConditions", v); }}
        rows={2}
      />

      {/* Allergies */}
      <div className="space-y-3 pt-3 border-t border-dashed border-divider">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-fg">Allergies</label>
          <span className="text-xs text-fg-faint">(Optional)</span>
        </div>
        {(formData.healthInfo?.allergies || []).map((allergy, idx) => (
          <div key={`allergy-${idx}`} className="p-3 bg-surface-2 rounded-lg border border-divider space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-fg-muted">Allergy {idx + 1}</span>
              <Button size="sm" variant="danger" onClick={() => removeHealthInfoItem("allergies", idx)}>
                <X size={14} /> Remove
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Name"
                placeholder="e.g. Peanuts"
                value={allergy.name || ""}
                onChange={(e) => { const v = e.target.value; updateHealthInfoItem("allergies", idx, "name", v); }}
              />
              <Select
                label="Type"
                placeholder="Select type"
                value={allergy.type || ""}
                onChange={(e) => { const v = e.target.value; updateHealthInfoItem("allergies", idx, "type", v); }}
                options={["food", "medication", "environmental", "insect", "latex", "other"].map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
              />
              <Select
                label="Severity"
                placeholder="Select severity"
                value={allergy.severity || ""}
                onChange={(e) => { const v = e.target.value; updateHealthInfoItem("allergies", idx, "severity", v); }}
                options={["mild", "moderate", "severe", "life-threatening"].map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
              />
              <Input
                label="Reaction"
                placeholder="e.g. Skin rash"
                value={allergy.reaction || ""}
                onChange={(e) => { const v = e.target.value; updateHealthInfoItem("allergies", idx, "reaction", v); }}
              />
              <Input
                label="Notes"
                placeholder="Additional notes"
                value={allergy.notes || ""}
                onChange={(e) => { const v = e.target.value; updateHealthInfoItem("allergies", idx, "notes", v); }}
                className="col-span-2"
              />
            </div>
          </div>
        ))}
        <button
          className="text-sm font-medium text-primary hover:text-[var(--accent)] transition-colors"
          onClick={() => addHealthInfoItem("allergies", { name: "", type: "", severity: "", reaction: "", notes: "" })}
        >
          + Add Allergy
        </button>
      </div>

      {/* Medications */}
      <div className="space-y-3 pt-3 border-t border-dashed border-divider">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-fg">Medications</label>
          <span className="text-xs text-fg-faint">(Optional)</span>
        </div>
        {(formData.healthInfo?.medications || []).map((med, idx) => (
          <div key={`med-${idx}`} className="p-3 bg-surface-2 rounded-lg border border-divider space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-fg-muted">Medication {idx + 1}</span>
              <Button size="sm" variant="danger" onClick={() => removeHealthInfoItem("medications", idx)}>
                <X size={14} /> Remove
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Name"
                placeholder="e.g. Paracetamol"
                value={med.name || ""}
                onChange={(e) => { const v = e.target.value; updateHealthInfoItem("medications", idx, "name", v); }}
              />
              <Input
                label="Dosage"
                placeholder="e.g. 500mg"
                value={med.dosage || ""}
                onChange={(e) => { const v = e.target.value; updateHealthInfoItem("medications", idx, "dosage", v); }}
              />
              <Input
                label="Frequency"
                placeholder="e.g. Twice daily"
                value={med.frequency || ""}
                onChange={(e) => { const v = e.target.value; updateHealthInfoItem("medications", idx, "frequency", v); }}
              />
              <Input
                label="Prescribed By"
                placeholder="Doctor name"
                value={med.prescribedBy || ""}
                onChange={(e) => { const v = e.target.value; updateHealthInfoItem("medications", idx, "prescribedBy", v); }}
              />
              <Input
                label="Start Date"
                placeholder="DD/MM/YYYY"
                value={med.startDate || ""}
                onChange={(e) => { const v = e.target.value; updateHealthInfoItem("medications", idx, "startDate", v); }}
              />
              <Input
                label="End Date"
                placeholder="DD/MM/YYYY"
                value={med.endDate || ""}
                onChange={(e) => { const v = e.target.value; updateHealthInfoItem("medications", idx, "endDate", v); }}
              />
              <Input
                label="Notes"
                placeholder="Additional notes"
                value={med.notes || ""}
                onChange={(e) => { const v = e.target.value; updateHealthInfoItem("medications", idx, "notes", v); }}
                className="col-span-2"
              />
            </div>
          </div>
        ))}
        <button
          className="text-sm font-medium text-primary hover:text-[var(--accent)] transition-colors"
          onClick={() => addHealthInfoItem("medications", { name: "", dosage: "", frequency: "", startDate: "", endDate: "", prescribedBy: "", notes: "" })}
        >
          + Add Medication
        </button>
      </div>

      {/* Health Emergency Contacts */}
      <div className="space-y-3 pt-3 border-t border-dashed border-divider">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-fg">Health Emergency Contacts</label>
          <span className="text-xs text-fg-faint">(Optional)</span>
        </div>
        {(formData.healthInfo?.emergencyContacts || []).map((contact, idx) => (
          <div key={`he-contact-${idx}`} className="p-3 bg-surface-2 rounded-lg border border-divider space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-fg-muted">Emergency Contact {idx + 1}</span>
              <Button size="sm" variant="danger" onClick={() => removeHealthInfoItem("emergencyContacts", idx)}>
                <X size={14} /> Remove
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Name"
                placeholder="Contact name"
                value={contact.name || ""}
                onChange={(e) => { const v = e.target.value; updateHealthInfoItem("emergencyContacts", idx, "name", v); }}
              />
              <Input
                label="Relationship"
                placeholder="e.g. Uncle"
                value={contact.relationship || ""}
                onChange={(e) => { const v = e.target.value; updateHealthInfoItem("emergencyContacts", idx, "relationship", v); }}
              />
              <Input
                label="Phone"
                startContent={<span className="text-fg-faint text-xs">+91</span>}
                placeholder="10-digit mobile"
                value={contact.phone || ""}
                onChange={(e) => {
                  const v = e.target.value;
                  const digitsOnly = v.replace(/\D/g, "").slice(0, 10);
                  updateHealthInfoItem("emergencyContacts", idx, "phone", digitsOnly);
                }}
                maxLength={10}
              />
              <Input
                label="Alternate Phone"
                startContent={<span className="text-fg-faint text-xs">+91</span>}
                placeholder="10-digit mobile"
                value={contact.alternatePhone || ""}
                onChange={(e) => {
                  const v = e.target.value;
                  const digitsOnly = v.replace(/\D/g, "").slice(0, 10);
                  updateHealthInfoItem("emergencyContacts", idx, "alternatePhone", digitsOnly);
                }}
                maxLength={10}
              />
              <Input
                label="Email"
                placeholder="Email address"
                value={contact.email || ""}
                onChange={(e) => { const v = e.target.value; updateHealthInfoItem("emergencyContacts", idx, "email", v); }}
              />
              <Input
                label="Priority"
                placeholder="e.g. 1"
                type="number"
                value={contact.priority?.toString() || ""}
                onChange={(e) => {
                  const v = e.target.value;
                  updateHealthInfoItem("emergencyContacts", idx, "priority", v ? parseInt(v) : "");
                }}
              />
            </div>
          </div>
        ))}
        <button
          className="text-sm font-medium text-primary hover:text-[var(--accent)] transition-colors"
          onClick={() => addHealthInfoItem("emergencyContacts", { name: "", relationship: "", phone: "", alternatePhone: "", email: "", priority: 1 })}
        >
          + Add Emergency Contact
        </button>
      </div>
    </div>
  );
}

function TransportSection({ formData, updateField }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4 pt-2 border-t border-solid border-divider">
      <label className="text-sm font-semibold text-fg block mt-2">{t('pages.additionalRequirements')}</label>
      <div className="grid grid-cols-2 gap-4">
        <div
          className={`cursor-pointer rounded-xl border-2 p-4 flex items-center gap-3 transition-all ${
            formData.transportRequired ? "border-primary bg-[var(--accent-bg)]/20 dark:bg-primary-900/20" : "border-divider hover:border-border-token"
          }`}
          onClick={() => updateField("transportRequired", !formData.transportRequired)}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              formData.transportRequired ? "bg-primary text-white" : "bg-surface-2 text-fg-faint"
            }`}
          >
            <Users size={20} />
          </div>
          <div>
            <span className={`text-sm font-medium ${formData.transportRequired ? "text-[var(--accent)] dark:text-primary-300" : "text-fg-muted"}`}>
              Transport Required
            </span>
            <p className="text-xs text-fg-muted">{t('pages.schoolBusFacility')}</p>
          </div>
        </div>
        <div
          className={`cursor-pointer rounded-xl border-2 p-4 flex items-center gap-3 transition-all ${
            formData.hostelRequired ? "border-primary bg-[var(--accent-bg)]/20 dark:bg-primary-900/20" : "border-divider hover:border-border-token"
          }`}
          onClick={() => updateField("hostelRequired", !formData.hostelRequired)}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              formData.hostelRequired ? "bg-primary text-white" : "bg-surface-2 text-fg-faint"
            }`}
          >
            <Users size={20} />
          </div>
          <div>
            <span className={`text-sm font-medium ${formData.hostelRequired ? "text-[var(--accent)] dark:text-primary-300" : "text-fg-muted"}`}>
              Hostel Required
            </span>
            <p className="text-xs text-fg-muted">{t('pages.boardingFacility')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
