import { useRef } from "react";
import { Input, Select, SelectItem, Checkbox, Textarea, Button } from "@heroui/react";
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
          <label className="text-sm font-semibold text-default-900">{t('pages.parentDetails')}</label>
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
            className="text-sm font-medium text-primary hover:text-primary-600 transition-colors"
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
  return (
    <div className="p-4 bg-default-50 rounded-lg border border-default-200 space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-default-700">
          {idx === 0 ? "Primary Parent" : `Parent ${idx + 1}`}
        </span>
        {canRemove && (
          <Button size="sm" variant="light" color="danger" onPress={() => removeParent(index)}>
            <X size={14} /> Remove
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div ref={parentNameRef}>
          <Input
            label={t('pages.fullName1')}
            labelPlacement="outside"
            placeholder={t('pages.parentName1')}
            value={parent.name}
            onValueChange={(v) => updateParent(index, "name", v)}
            isInvalid={idx === 0 && !!errors.parentName}
            errorMessage={idx === 0 ? errors.parentName : ""}
            variant="bordered"
            radius="sm"
            isRequired={idx === 0}
            classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
          />
        </div>
        <Select
          label={t('pages.relationship')}
          labelPlacement="outside"
          placeholder={t('pages.select1')}
          selectedKeys={parent.relationship ? [parent.relationship] : []}
          onSelectionChange={(keys) => updateParent(index, "relationship", Array.from(keys)[0])}
          variant="bordered"
          radius="sm"
          classNames={{ trigger: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
        >
          {PARENT_RELATIONSHIPS.map((r) => (
            <SelectItem key={r}>{r}</SelectItem>
          ))}
        </Select>
        <div className="space-y-2" ref={parentPhoneRef}>
          <Input
            label={t('pages.phoneNumber')}
            labelPlacement="outside"
            startContent={<span className="text-default-400 text-xs">+91</span>}
            placeholder={t('students.form.phonePlaceholder')}
            value={parent.phone}
            onValueChange={(v) => {
              const digitsOnly = v.replace(/\D/g, "").slice(0, 10);
              updateParent(index, "phone", digitsOnly);
            }}
            isInvalid={idx === 0 && !!errors.parentPhone}
            errorMessage={idx === 0 ? errors.parentPhone : ""}
            variant="bordered"
            radius="sm"
            isRequired={idx === 0}
            maxLength={10}
            classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
          />
          <Checkbox
            size="sm"
            isSelected={parent.isWhatsapp}
            onValueChange={(v) => updateParent(index, "isWhatsapp", v)}
            classNames={{ label: "text-xs text-default-500" }}
          >
            Same as WhatsApp
          </Checkbox>
        </div>
        <Input
          label={t('pages.email1')}
          labelPlacement="outside"
          placeholder={t('students.form.parentEmailPlaceholder')}
          value={parent.email}
          onValueChange={(v) => updateParent(index, "email", v)}
          variant="bordered"
          radius="sm"
          classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
        />
        <Input
          label={t('pages.occupation')}
          labelPlacement="outside"
          placeholder={t('students.form.occupationPlaceholder')}
          value={parent.occupation}
          onValueChange={(v) => updateParent(index, "occupation", v)}
          variant="bordered"
          radius="sm"
          className="col-span-2"
          classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
        />
      </div>
    </div>
  );
}

function GuardiansSection({ guardians, formData, updateParent, removeParent, addGuardian }) {
  return (
    <div className="space-y-4 pt-2 border-t border-solid border-default-200">
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold text-default-900">{t('pages.guardianDetails')}</label>
        <span className="text-xs text-default-500">(Optional)</span>
      </div>

      {guardians.map((guardian, idx) => {
        const index = formData.parents.findIndex((p) => p === guardian);
        return (
          <div key={`parent-${idx}`} className="p-4 bg-default-50 rounded-lg border border-default-200 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-default-700">Guardian {idx + 1}</span>
              <Button size="sm" variant="light" color="danger" onPress={() => removeParent(index)}>
                <X size={14} /> Remove
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('pages.fullName1')}
                labelPlacement="outside"
                placeholder={t('pages.guardianName')}
                value={guardian.name}
                onValueChange={(v) => updateParent(index, "name", v)}
                variant="bordered"
                radius="sm"
                classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
              />
              <Select
                label={t('pages.relationship')}
                labelPlacement="outside"
                placeholder={t('pages.select1')}
                selectedKeys={guardian.relationship ? [guardian.relationship] : []}
                onSelectionChange={(keys) => updateParent(index, "relationship", Array.from(keys)[0])}
                variant="bordered"
                radius="sm"
                classNames={{ trigger: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
              >
                {GUARDIAN_RELATIONSHIPS.map((r) => (
                  <SelectItem key={r}>{r}</SelectItem>
                ))}
              </Select>
            </div>
          </div>
        );
      })}

      {guardians.length === 0 && (
        <button
          className="text-sm font-medium text-primary hover:text-primary-600 transition-colors"
          onClick={addGuardian}
        >
          + Add Guardian
        </button>
      )}
    </div>
  );
}

function SiblingsSection({ siblings, updateSibling, addSibling, removeSibling, classesWithTeachers }) {
  return (
    <div className="space-y-4 pt-2 border-t border-solid border-default-200">
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold text-default-900">{t('pages.siblingDetails')}</label>
        <span className="text-xs text-default-500">(Optional — same school only)</span>
      </div>

      {siblings.length === 0 && (
        <p className="text-xs text-default-400">No siblings added yet. Use the button below to add siblings enrolled in this school.</p>
      )}

      {siblings.map((sibling, idx) => (
        <div key={`sibling-${idx}`} className="p-4 bg-default-50 rounded-lg border border-default-200 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-default-700">Sibling {idx + 1}</span>
            <Button size="sm" variant="light" color="danger" onPress={() => removeSibling(idx)}>
              <X size={14} /> Remove
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('pages.siblingName')}
              labelPlacement="outside"
              placeholder={t('pages.siblingSFullName')}
              value={sibling.name}
              onValueChange={(v) => updateSibling(idx, "name", v)}
              variant="bordered"
              radius="sm"
              classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
            />
            <div className="flex items-center gap-2 pt-6">
              <Checkbox size="sm"
                isSelected={sibling.inSameSchool}
                onValueChange={(v) => {
                  updateSibling(idx, "inSameSchool", v);
                  if (!v) updateSibling(idx, "classId", "");
                }}
              >
                <span className="text-sm text-default-700">{t('pages.isSiblingInThisSchool')}</span>
              </Checkbox>
            </div>
            {sibling.inSameSchool && (
              <Select
                label={t('pages.class1')}
                labelPlacement="outside"
                placeholder={t('pages.selectClass2')}
                selectedKeys={sibling.classId ? [sibling.classId] : []}
                onSelectionChange={(keys) => updateSibling(idx, "classId", Array.from(keys)[0])}
                variant="bordered"
                radius="sm"
                classNames={{ trigger: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
              >
                {classesWithTeachers.map((c) => (
                  <SelectItem key={c.id}>
                    {c.name} {c.section}
                  </SelectItem>
                ))}
              </Select>
            )}
          </div>
        </div>
      ))}

      <button className="text-sm font-medium text-primary hover:text-primary-600 transition-colors" onClick={addSibling}>
        + Add Sibling
      </button>
    </div>
  );
}

function HealthSection({ formData, updateField, updateHealthInfoItem, addHealthInfoItem, removeHealthInfoItem }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4 pt-2 border-t border-solid border-default-200">
      <label className="text-sm font-semibold text-default-900 block mt-2">{t('pages.healthSafety')}</label>
      <Textarea
        label={t('pages.medicalConditions1')}
        labelPlacement="outside"
        placeholder={t('pages.anyAllergiesMedicalConditionsOrSpecialNeedsOptional')}
        value={formData.medicalConditions}
        onValueChange={(v) => updateField("medicalConditions", v)}
        variant="bordered"
        radius="sm"
        minRows={2}
        classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300" }}
      />

      {/* Allergies */}
      <div className="space-y-3 pt-3 border-t border-dashed border-default-200">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-default-700">Allergies</label>
          <span className="text-xs text-default-400">(Optional)</span>
        </div>
        {(formData.healthInfo?.allergies || []).map((allergy, idx) => (
          <div key={`allergy-${idx}`} className="p-3 bg-default-50 rounded-lg border border-default-200 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-default-600">Allergy {idx + 1}</span>
              <Button size="sm" variant="light" color="danger" onPress={() => removeHealthInfoItem("allergies", idx)}>
                <X size={14} /> Remove
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Name"
                labelPlacement="outside"
                placeholder="e.g. Peanuts"
                value={allergy.name || ""}
                onValueChange={(v) => updateHealthInfoItem("allergies", idx, "name", v)}
                variant="bordered"
                radius="sm"
                classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
              />
              <Select
                label="Type"
                labelPlacement="outside"
                placeholder="Select type"
                selectedKeys={allergy.type ? [allergy.type] : []}
                onSelectionChange={(keys) => updateHealthInfoItem("allergies", idx, "type", Array.from(keys)[0])}
                variant="bordered"
                radius="sm"
                classNames={{ trigger: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
              >
                {["food", "medication", "environmental", "insect", "latex", "other"].map((t) => (
                  <SelectItem key={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                ))}
              </Select>
              <Select
                label="Severity"
                labelPlacement="outside"
                placeholder="Select severity"
                selectedKeys={allergy.severity ? [allergy.severity] : []}
                onSelectionChange={(keys) => updateHealthInfoItem("allergies", idx, "severity", Array.from(keys)[0])}
                variant="bordered"
                radius="sm"
                classNames={{ trigger: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
              >
                {["mild", "moderate", "severe", "life-threatening"].map((s) => (
                  <SelectItem key={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                ))}
              </Select>
              <Input
                label="Reaction"
                labelPlacement="outside"
                placeholder="e.g. Skin rash"
                value={allergy.reaction || ""}
                onValueChange={(v) => updateHealthInfoItem("allergies", idx, "reaction", v)}
                variant="bordered"
                radius="sm"
                classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
              />
              <Input
                label="Notes"
                labelPlacement="outside"
                placeholder="Additional notes"
                value={allergy.notes || ""}
                onValueChange={(v) => updateHealthInfoItem("allergies", idx, "notes", v)}
                variant="bordered"
                radius="sm"
                className="col-span-2"
                classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
              />
            </div>
          </div>
        ))}
        <button
          className="text-sm font-medium text-primary hover:text-primary-600 transition-colors"
          onClick={() => addHealthInfoItem("allergies", { name: "", type: "", severity: "", reaction: "", notes: "" })}
        >
          + Add Allergy
        </button>
      </div>

      {/* Medications */}
      <div className="space-y-3 pt-3 border-t border-dashed border-default-200">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-default-700">Medications</label>
          <span className="text-xs text-default-400">(Optional)</span>
        </div>
        {(formData.healthInfo?.medications || []).map((med, idx) => (
          <div key={`med-${idx}`} className="p-3 bg-default-50 rounded-lg border border-default-200 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-default-600">Medication {idx + 1}</span>
              <Button size="sm" variant="light" color="danger" onPress={() => removeHealthInfoItem("medications", idx)}>
                <X size={14} /> Remove
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Name"
                labelPlacement="outside"
                placeholder="e.g. Paracetamol"
                value={med.name || ""}
                onValueChange={(v) => updateHealthInfoItem("medications", idx, "name", v)}
                variant="bordered"
                radius="sm"
                classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
              />
              <Input
                label="Dosage"
                labelPlacement="outside"
                placeholder="e.g. 500mg"
                value={med.dosage || ""}
                onValueChange={(v) => updateHealthInfoItem("medications", idx, "dosage", v)}
                variant="bordered"
                radius="sm"
                classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
              />
              <Input
                label="Frequency"
                labelPlacement="outside"
                placeholder="e.g. Twice daily"
                value={med.frequency || ""}
                onValueChange={(v) => updateHealthInfoItem("medications", idx, "frequency", v)}
                variant="bordered"
                radius="sm"
                classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
              />
              <Input
                label="Prescribed By"
                labelPlacement="outside"
                placeholder="Doctor name"
                value={med.prescribedBy || ""}
                onValueChange={(v) => updateHealthInfoItem("medications", idx, "prescribedBy", v)}
                variant="bordered"
                radius="sm"
                classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
              />
              <Input
                label="Start Date"
                labelPlacement="outside"
                placeholder="DD/MM/YYYY"
                value={med.startDate || ""}
                onValueChange={(v) => updateHealthInfoItem("medications", idx, "startDate", v)}
                variant="bordered"
                radius="sm"
                classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
              />
              <Input
                label="End Date"
                labelPlacement="outside"
                placeholder="DD/MM/YYYY"
                value={med.endDate || ""}
                onValueChange={(v) => updateHealthInfoItem("medications", idx, "endDate", v)}
                variant="bordered"
                radius="sm"
                classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
              />
              <Input
                label="Notes"
                labelPlacement="outside"
                placeholder="Additional notes"
                value={med.notes || ""}
                onValueChange={(v) => updateHealthInfoItem("medications", idx, "notes", v)}
                variant="bordered"
                radius="sm"
                className="col-span-2"
                classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
              />
            </div>
          </div>
        ))}
        <button
          className="text-sm font-medium text-primary hover:text-primary-600 transition-colors"
          onClick={() => addHealthInfoItem("medications", { name: "", dosage: "", frequency: "", startDate: "", endDate: "", prescribedBy: "", notes: "" })}
        >
          + Add Medication
        </button>
      </div>

      {/* Health Emergency Contacts */}
      <div className="space-y-3 pt-3 border-t border-dashed border-default-200">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-default-700">Health Emergency Contacts</label>
          <span className="text-xs text-default-400">(Optional)</span>
        </div>
        {(formData.healthInfo?.emergencyContacts || []).map((contact, idx) => (
          <div key={`he-contact-${idx}`} className="p-3 bg-default-50 rounded-lg border border-default-200 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-default-600">Emergency Contact {idx + 1}</span>
              <Button size="sm" variant="light" color="danger" onPress={() => removeHealthInfoItem("emergencyContacts", idx)}>
                <X size={14} /> Remove
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Name"
                labelPlacement="outside"
                placeholder="Contact name"
                value={contact.name || ""}
                onValueChange={(v) => updateHealthInfoItem("emergencyContacts", idx, "name", v)}
                variant="bordered"
                radius="sm"
                classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
              />
              <Input
                label="Relationship"
                labelPlacement="outside"
                placeholder="e.g. Uncle"
                value={contact.relationship || ""}
                onValueChange={(v) => updateHealthInfoItem("emergencyContacts", idx, "relationship", v)}
                variant="bordered"
                radius="sm"
                classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
              />
              <Input
                label="Phone"
                labelPlacement="outside"
                startContent={<span className="text-default-400 text-xs">+91</span>}
                placeholder="10-digit mobile"
                value={contact.phone || ""}
                onValueChange={(v) => {
                  const digitsOnly = v.replace(/\D/g, "").slice(0, 10);
                  updateHealthInfoItem("emergencyContacts", idx, "phone", digitsOnly);
                }}
                variant="bordered"
                radius="sm"
                maxLength={10}
                classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
              />
              <Input
                label="Alternate Phone"
                labelPlacement="outside"
                startContent={<span className="text-default-400 text-xs">+91</span>}
                placeholder="10-digit mobile"
                value={contact.alternatePhone || ""}
                onValueChange={(v) => {
                  const digitsOnly = v.replace(/\D/g, "").slice(0, 10);
                  updateHealthInfoItem("emergencyContacts", idx, "alternatePhone", digitsOnly);
                }}
                variant="bordered"
                radius="sm"
                maxLength={10}
                classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
              />
              <Input
                label="Email"
                labelPlacement="outside"
                placeholder="Email address"
                value={contact.email || ""}
                onValueChange={(v) => updateHealthInfoItem("emergencyContacts", idx, "email", v)}
                variant="bordered"
                radius="sm"
                classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
              />
              <Input
                label="Priority"
                labelPlacement="outside"
                placeholder="e.g. 1"
                type="number"
                value={contact.priority?.toString() || ""}
                onValueChange={(v) => updateHealthInfoItem("emergencyContacts", idx, "priority", v ? parseInt(v) : "")}
                variant="bordered"
                radius="sm"
                classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
              />
            </div>
          </div>
        ))}
        <button
          className="text-sm font-medium text-primary hover:text-primary-600 transition-colors"
          onClick={() => addHealthInfoItem("emergencyContacts", { name: "", relationship: "", phone: "", alternatePhone: "", email: "", priority: 1 })}
        >
          + Add Emergency Contact
        </button>
      </div>
    </div>
  );
}

function TransportSection({ formData, updateField }) {
  return (
    <div className="space-y-4 pt-2 border-t border-solid border-default-200">
      <label className="text-sm font-semibold text-default-900 block mt-2">{t('pages.additionalRequirements')}</label>
      <div className="grid grid-cols-2 gap-4">
        <div
          className={`cursor-pointer rounded-xl border-2 p-4 flex items-center gap-3 transition-all ${
            formData.transportRequired ? "border-primary bg-primary-50/20 dark:bg-primary-900/20" : "border-default-200 hover:border-default-300"
          }`}
          onClick={() => updateField("transportRequired", !formData.transportRequired)}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              formData.transportRequired ? "bg-primary text-white" : "bg-default-100 text-default-400"
            }`}
          >
            <Users size={20} />
          </div>
          <div>
            <span className={`text-sm font-medium ${formData.transportRequired ? "text-primary-700 dark:text-primary-300" : "text-default-600"}`}>
              Transport Required
            </span>
            <p className="text-xs text-default-500">{t('pages.schoolBusFacility')}</p>
          </div>
        </div>
        <div
          className={`cursor-pointer rounded-xl border-2 p-4 flex items-center gap-3 transition-all ${
            formData.hostelRequired ? "border-primary bg-primary-50/20 dark:bg-primary-900/20" : "border-default-200 hover:border-default-300"
          }`}
          onClick={() => updateField("hostelRequired", !formData.hostelRequired)}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              formData.hostelRequired ? "bg-primary text-white" : "bg-default-100 text-default-400"
            }`}
          >
            <Users size={20} />
          </div>
          <div>
            <span className={`text-sm font-medium ${formData.hostelRequired ? "text-primary-700 dark:text-primary-300" : "text-default-600"}`}>
              Hostel Required
            </span>
            <p className="text-xs text-default-500">{t('pages.boardingFacility')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
