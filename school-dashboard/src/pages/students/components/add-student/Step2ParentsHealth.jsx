import { Input, Select, Checkbox, Textarea, Button } from "../../../../components/ui";
import { cn } from "../../../../utils/cn";
import { X, Bus, Heart } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { PARENT_RELATIONSHIPS, GUARDIAN_RELATIONSHIPS } from "../../../../constants/studentConstants";

function Step2ParentsHealth({
  formData,
  errors,
  updateField,
  updateParent,
  removeParent,
  updateSibling,
  addSibling,
  removeSibling,
  classesWithTeachers,
  // Refs
  parentNameRef,
  parentPhoneRef,
}) {
  const { t } = useTranslation();

  const parents = formData.parents.filter(entry => entry.isParent);
  const guardians = formData.parents.filter(entry => !entry.isParent);

  return (
    <div className="space-y-5 animate-fade-in text-left">
      {/* Parent Details */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-fg">{t('pages.parentDetails')}</h3>

        {parents.map((parent, idx) => {
          const index = formData.parents.findIndex(entry => entry === parent);
          return (
            <div key={`parent-${idx}`} className="p-4 bg-surface-2 rounded-lg border border-divider space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-fg">
                  {idx === 0 ? "Primary Parent" : `Parent ${idx + 1}`}
                </span>
                {parents.length > 1 && (
                  <Button size="sm" variant="danger" onClick={() => removeParent(index)}>
                    <X size={14} /> Remove
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div ref={index === 0 ? parentNameRef : null}>
                  <Input
                    label={t('pages.fullName1')}
                    placeholder={t('pages.parentName1')}
                    value={parent.name}
                    onChange={e => { const val = e.target.value; updateParent(index, "name", val); }}
                    error={index === 0 ? errors.parentName : ""}
                    required={index === 0}
                  />
                </div>
                <Select
                  label={t('pages.relationship')}
                  placeholder={t('pages.select1')}
                  value={parent.relationship || ""}
                  onChange={e => { const val = e.target.value; updateParent(index, "relationship", val); }}
                  options={PARENT_RELATIONSHIPS.map(rel => ({ value: rel, label: rel }))}
                />
                <div className="space-y-2" ref={index === 0 ? parentPhoneRef : null}>
                  <Input
                    label={t('pages.phoneNumber')}
                    startContent={<span className="text-fg-faint text-xs">+91</span>}
                    placeholder={t('students.form.phonePlaceholder')}
                    value={parent.phone}
                    onChange={e => {
                      const val = e.target.value;
                      const digitsOnly = val.replace(/\D/g, '').slice(0, 10);
                      updateParent(index, "phone", digitsOnly);
                    }}
                    error={index === 0 ? errors.parentPhone : ""}
                    required={index === 0}
                    maxLength={10}
                  />
                  <Checkbox size="sm" checked={parent.isWhatsapp} onChange={e => { const val = e.target.checked; updateParent(index, "isWhatsapp", val); }}
                    label="Same as WhatsApp" />
                </div>
                <Input
                  label={t('pages.email1')}
                  placeholder={t('students.form.parentEmailPlaceholder')}
                  value={parent.email}
                  onChange={e => { const val = e.target.value; updateParent(index, "email", val); }}
                />
                <Input
                  label={t('pages.occupation')}
                  placeholder={t('students.form.occupationPlaceholder')}
                  value={parent.occupation}
                  onChange={e => { const val = e.target.value; updateParent(index, "occupation", val); }}
                  className="col-span-2"
                />
              </div>
            </div>
          )
        })}

        {parents.length < 2 && (
          <button
            className="text-sm font-medium text-primary hover:text-[var(--accent)] transition-colors"
            onClick={() => {
              updateField("parents", [...formData.parents, { name: "", relationship: "Mother", phone: "", email: "", occupation: "", isWhatsapp: true, isParent: true }]);
            }}
          >
            + Add Another Parent
          </button>
        )}
      </div>

      {/* Guardian Details */}
      <div className="space-y-4 pt-5 border-t border-border-token">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-fg">{t('pages.guardianDetails')}</h3>
          <span className="text-xs text-fg-faint">(Optional)</span>
        </div>

        {guardians.map((guardian, idx) => {
          const index = formData.parents.findIndex(entry => entry === guardian);
          return (
            <div key={`guardian-${idx}`} className="p-4 bg-surface-2 rounded-lg border border-divider space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-fg">
                  Guardian {idx + 1}
                </span>
                <Button size="sm" variant="danger" onClick={() => removeParent(index)}>
                  <X size={14} /> Remove
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t('pages.fullName1')}
                  placeholder={t('pages.guardianName')}
                  value={guardian.name}
                  onChange={e => { const val = e.target.value; updateParent(index, "name", val); }}
                />
                <Select
                  label={t('pages.relationship')}
                  placeholder={t('pages.select1')}
                  value={guardian.relationship || ""}
                  onChange={e => { const val = e.target.value; updateParent(index, "relationship", val); }}
                  options={GUARDIAN_RELATIONSHIPS.map(rel => ({ value: rel, label: rel }))}
                />
                <div className="space-y-2">
                  <Input
                    label={t('pages.phoneNumber')}
                    startContent={<span className="text-fg-faint text-xs">+91</span>}
                    placeholder={t('students.form.phonePlaceholder')}
                    value={guardian.phone}
                    onChange={e => {
                      const val = e.target.value;
                      const digitsOnly = val.replace(/\D/g, '').slice(0, 10);
                      updateParent(index, "phone", digitsOnly);
                    }}
                    maxLength={10}
                  />
                  <Checkbox size="sm" checked={guardian.isWhatsapp} onChange={e => { const val = e.target.checked; updateParent(index, "isWhatsapp", val); }}
                    label="Same as WhatsApp" />
                </div>
                <Input
                  label={t('pages.email1')}
                  placeholder={t('students.form.guardianEmailPlaceholder')}
                  value={guardian.email}
                  onChange={e => { const val = e.target.value; updateParent(index, "email", val); }}
                />
                <Input
                  label={t('pages.occupation')}
                  placeholder={t('students.form.occupationPlaceholder')}
                  value={guardian.occupation}
                  onChange={e => { const val = e.target.value; updateParent(index, "occupation", val); }}
                  className="col-span-2"
                />
              </div>
            </div>
          )
        })}

        {guardians.length === 0 && (
          <button
            className="text-sm font-medium text-primary hover:text-[var(--accent)] transition-colors"
            onClick={() => {
              updateField("parents", [...formData.parents, { name: "", relationship: "Grandparent", phone: "", email: "", occupation: "", isWhatsapp: true, isParent: false }]);
            }}
          >
            + Add Guardian
          </button>
        )}
      </div>

      {/* Sibling Details */}
      <div className="space-y-4 pt-5 border-t border-border-token">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-fg">{t('pages.siblingDetails')}</h3>
          <span className="text-xs text-fg-faint">(Siblings in same school only)</span>
        </div>

        {formData.siblings.map((sibling, idx) => (
          <div key={`sibling-${idx}`} className="p-4 bg-surface-2 rounded-lg border border-divider space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-fg">
                Sibling {idx + 1}
              </span>
              <Button size="sm" variant="danger" onClick={() => removeSibling(idx)}>
                <X size={14} /> Remove
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('pages.siblingName')}
                placeholder={t('pages.siblingSFullName')}
                value={sibling.name}
                onChange={e => { const val = e.target.value; updateSibling(idx, "name", val); }}
              />
              <div className="flex items-center gap-2 pt-6">
                <Checkbox size="sm"
                  checked={sibling.inSameSchool}
                  onChange={e => {
                    const val = e.target.checked;
                    updateSibling(idx, "inSameSchool", val);
                    if (!val) updateSibling(idx, "classId", "");
                  }}
                  label={<span className="text-sm text-fg">{t('pages.isSiblingInThisSchool')}</span>}
                />
              </div>
              {sibling.inSameSchool && (
                <Select
                  label={t('pages.class1')}
                  placeholder={t('pages.selectClass2')}
                  value={sibling.classId || ""}
                  onChange={e => { const val = e.target.value; updateSibling(idx, "classId", val); }}
                  options={classesWithTeachers.map(cls => ({ value: cls.id, label: `${cls.name} ${cls.section}` }))}
                />
              )}
            </div>
          </div>
        ))}

        <button
          className="text-sm font-medium text-primary hover:text-[var(--accent)] transition-colors"
          onClick={addSibling}
        >
          + Add Sibling
        </button>
      </div>

      {/* Health & Safety */}
      <div className="space-y-3 pt-5 border-t border-border-token">
        <h3 className="text-sm font-medium text-fg">{t('pages.healthSafety')}</h3>
        <Textarea
          label={t('pages.medicalConditions1')}
          placeholder={t('pages.anyAllergiesMedicalConditionsOrSpecialNeedsOptional')}
          value={formData.medicalConditions}
          onChange={e => { const val = e.target.value; updateField("medicalConditions", val); }}
          rows={2}
        />
      </div>

      {/* Transport & Hostel */}
      <div className="space-y-4 pt-5 border-t border-border-token">
        <h3 className="text-sm font-medium text-fg">{t('pages.additionalRequirements')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className={cn(
            "cursor-pointer rounded-xl border-2 p-4 flex items-center gap-3 transition-all",
            formData.transportRequired ? "border-primary bg-[var(--accent-bg)]/20" : "border-divider hover:border-border-token"
          )} onClick={() => updateField("transportRequired", !formData.transportRequired)}>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              formData.transportRequired ? "bg-primary text-white" : "bg-surface-2 text-fg-faint"
            )}>
              <Bus size={20} />
            </div>
            <div>
              <span className={cn("text-sm font-medium", formData.transportRequired ? "text-[var(--accent)]" : "text-fg-muted")}>
                Transport Required
              </span>
              <p className="text-xs text-fg-muted">{t('pages.schoolBusFacility')}</p>
            </div>
          </div>
          <div className={cn(
            "cursor-pointer rounded-xl border-2 p-4 flex items-center gap-3 transition-all",
            formData.hostelRequired ? "border-primary bg-[var(--accent-bg)]/20" : "border-divider hover:border-border-token"
          )} onClick={() => updateField("hostelRequired", !formData.hostelRequired)}>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              formData.hostelRequired ? "bg-primary text-white" : "bg-surface-2 text-fg-faint"
            )}>
              <Heart size={20} />
            </div>
            <div>
              <span className={cn("text-sm font-medium", formData.hostelRequired ? "text-[var(--accent)]" : "text-fg-muted")}>
                Hostel Required
              </span>
              <p className="text-xs text-fg-muted">{t('pages.boardingFacility')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Step2ParentsHealth;
