import { Input, Select, SelectItem, Checkbox, Textarea, Button, cn } from "@heroui/react";
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
            <div key={`parent-${idx}`} className="p-4 bg-default-50 rounded-lg border border-default-200 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-default-700">
                  {idx === 0 ? "Primary Parent" : `Parent ${idx + 1}`}
                </span>
                {parents.length > 1 && (
                  <Button size="sm" variant="light" color="danger" onPress={() => removeParent(index)}>
                    <X size={14} /> Remove
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div ref={index === 0 ? parentNameRef : null}>
                  <Input
                    label={t('pages.fullName1')}
                    labelPlacement="outside"
                    placeholder={t('pages.parentName1')}
                    value={parent.name}
                    onValueChange={val => updateParent(index, "name", val)}
                    isInvalid={index === 0 && !!errors.parentName}
                    errorMessage={index === 0 ? errors.parentName : ""}
                    variant="bordered"
                    radius="sm"
                    isRequired={index === 0}
                    classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
                  />
                </div>
                <Select
                  label={t('pages.relationship')}
                  labelPlacement="outside"
                  placeholder={t('pages.select1')}
                  selectedKeys={parent.relationship ? [parent.relationship] : []}
                  onSelectionChange={keys => updateParent(index, "relationship", Array.from(keys)[0])}
                  variant="bordered"
                  radius="sm"
                  classNames={{ trigger: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
                >
                  {PARENT_RELATIONSHIPS.map(rel => <SelectItem key={rel}>{rel}</SelectItem>)}
                </Select>
                <div className="space-y-2" ref={index === 0 ? parentPhoneRef : null}>
                  <Input
                    label={t('pages.phoneNumber')}
                    labelPlacement="outside"
                    startContent={<span className="text-default-400 text-xs">+91</span>}
                    placeholder={t('students.form.phonePlaceholder')}
                    value={parent.phone}
                    onValueChange={val => {
                      // Only allow digits and limit to 10 characters
                      const digitsOnly = val.replace(/\D/g, '').slice(0, 10);
                      updateParent(index, "phone", digitsOnly);
                    }}
                    isInvalid={index === 0 && !!errors.parentPhone}
                    errorMessage={index === 0 ? errors.parentPhone : ""}
                    variant="bordered"
                    radius="sm"
                    isRequired={index === 0}
                    maxLength={10}
                    classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
                  />
                  <Checkbox size="sm" isSelected={parent.isWhatsapp} onValueChange={val => updateParent(index, "isWhatsapp", val)}
                    classNames={{ label: "text-xs text-default-500" }}>
                    Same as WhatsApp
                  </Checkbox>
                </div>
                <Input
                  label={t('pages.email1')}
                  labelPlacement="outside"
                  placeholder={t('students.form.parentEmailPlaceholder')}
                  value={parent.email}
                  onValueChange={val => updateParent(index, "email", val)}
                  variant="bordered"
                  radius="sm"
                  classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
                />
                <Input
                  label={t('pages.occupation')}
                  labelPlacement="outside"
                  placeholder={t('students.form.occupationPlaceholder')}
                  value={parent.occupation}
                  onValueChange={val => updateParent(index, "occupation", val)}
                  variant="bordered"
                  radius="sm"
                  className="col-span-2"
                  classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
                />
              </div>
            </div>
          )
        })}

        {parents.length < 2 && (
          <button
            className="text-sm font-medium text-primary hover:text-primary-600 transition-colors"
            onClick={() => {
              updateField("parents", [...formData.parents, { name: "", relationship: "Mother", phone: "", email: "", occupation: "", isWhatsapp: true, isParent: true }]);
            }}
          >
            + Add Another Parent
          </button>
        )}
      </div>

      {/* Guardian Details */}
      <div className="space-y-4 pt-5 border-t border-gray-100 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-fg">{t('pages.guardianDetails')}</h3>
          <span className="text-xs text-fg-faint">(Optional)</span>
        </div>

        {guardians.map((guardian, idx) => {
          const index = formData.parents.findIndex(entry => entry === guardian);
          return (
            <div key={`guardian-${idx}`} className="p-4 bg-default-50 rounded-lg border border-default-200 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-default-700">
                  Guardian {idx + 1}
                </span>
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
                  onValueChange={val => updateParent(index, "name", val)}
                  variant="bordered"
                  radius="sm"
                  classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
                />
                <Select
                  label={t('pages.relationship')}
                  labelPlacement="outside"
                  placeholder={t('pages.select1')}
                  selectedKeys={guardian.relationship ? [guardian.relationship] : []}
                  onSelectionChange={keys => updateParent(index, "relationship", Array.from(keys)[0])}
                  variant="bordered"
                  radius="sm"
                  classNames={{ trigger: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
                >
                  {GUARDIAN_RELATIONSHIPS.map(rel => <SelectItem key={rel}>{rel}</SelectItem>)}
                </Select>
                <div className="space-y-2">
                  <Input
                    label={t('pages.phoneNumber')}
                    labelPlacement="outside"
                    startContent={<span className="text-default-400 text-xs">+91</span>}
                    placeholder={t('students.form.phonePlaceholder')}
                    value={guardian.phone}
                    onValueChange={val => {
                      const digitsOnly = val.replace(/\D/g, '').slice(0, 10);
                      updateParent(index, "phone", digitsOnly);
                    }}
                    variant="bordered"
                    radius="sm"
                    maxLength={10}
                    classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
                  />
                  <Checkbox size="sm" isSelected={guardian.isWhatsapp} onValueChange={val => updateParent(index, "isWhatsapp", val)}
                    classNames={{ label: "text-xs text-default-500" }}>
                    Same as WhatsApp
                  </Checkbox>
                </div>
                <Input
                  label={t('pages.email1')}
                  labelPlacement="outside"
                  placeholder={t('students.form.guardianEmailPlaceholder')}
                  value={guardian.email}
                  onValueChange={val => updateParent(index, "email", val)}
                  variant="bordered"
                  radius="sm"
                  classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
                />
                <Input
                  label={t('pages.occupation')}
                  labelPlacement="outside"
                  placeholder={t('students.form.occupationPlaceholder')}
                  value={guardian.occupation}
                  onValueChange={val => updateParent(index, "occupation", val)}
                  variant="bordered"
                  radius="sm"
                  className="col-span-2"
                  classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
                />
              </div>
            </div>
          )
        })}

        {guardians.length === 0 && (
          <button
            className="text-sm font-medium text-primary hover:text-primary-600 transition-colors"
            onClick={() => {
              updateField("parents", [...formData.parents, { name: "", relationship: "Grandparent", phone: "", email: "", occupation: "", isWhatsapp: true, isParent: false }]);
            }}
          >
            + Add Guardian
          </button>
        )}
      </div>

      {/* Sibling Details */}
      <div className="space-y-4 pt-5 border-t border-gray-100 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-fg">{t('pages.siblingDetails')}</h3>
          <span className="text-xs text-fg-faint">(Siblings in same school only)</span>
        </div>

        {formData.siblings.map((sibling, idx) => (
          <div key={`sibling-${idx}`} className="p-4 bg-default-50 rounded-lg border border-default-200 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-default-700">
                Sibling {idx + 1}
              </span>
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
                onValueChange={val => updateSibling(idx, "name", val)}
                variant="bordered"
                radius="sm"
                classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
              />
              <div className="flex items-center gap-2 pt-6">
                <Checkbox size="sm"
                  isSelected={sibling.inSameSchool}
                  onValueChange={val => {
                    updateSibling(idx, "inSameSchool", val);
                    if (!val) updateSibling(idx, "classId", "");
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
                  onSelectionChange={keys => updateSibling(idx, "classId", Array.from(keys)[0])}
                  variant="bordered"
                  radius="sm"
                  classNames={{ trigger: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
                >
                  {classesWithTeachers.map(cls => (
                    <SelectItem key={cls.id}>
                      {cls.name} {cls.section}
                    </SelectItem>
                  ))}
                </Select>
              )}
            </div>
          </div>
        ))}

        <button
          className="text-sm font-medium text-primary hover:text-primary-600 transition-colors"
          onClick={addSibling}
        >
          + Add Sibling
        </button>
      </div>

      {/* Health & Safety */}
      <div className="space-y-3 pt-5 border-t border-gray-100 dark:border-zinc-700">
        <h3 className="text-sm font-medium text-fg">{t('pages.healthSafety')}</h3>
        <Textarea
          label={t('pages.medicalConditions1')}
          labelPlacement="outside"
          placeholder={t('pages.anyAllergiesMedicalConditionsOrSpecialNeedsOptional')}
          value={formData.medicalConditions}
          onValueChange={val => updateField("medicalConditions", val)}
          variant="bordered"
          radius="sm"
          minRows={2}
          classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300" }}
        />
      </div>

      {/* Transport & Hostel */}
      <div className="space-y-4 pt-5 border-t border-gray-100 dark:border-zinc-700">
        <h3 className="text-sm font-medium text-fg">{t('pages.additionalRequirements')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className={cn(
            "cursor-pointer rounded-xl border-2 p-4 flex items-center gap-3 transition-all",
            formData.transportRequired ? "border-primary bg-primary-50/20" : "border-default-200 hover:border-default-300"
          )} onClick={() => updateField("transportRequired", !formData.transportRequired)}>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              formData.transportRequired ? "bg-primary text-white" : "bg-default-100 text-default-400"
            )}>
              <Bus size={20} />
            </div>
            <div>
              <span className={cn("text-sm font-medium", formData.transportRequired ? "text-primary-700" : "text-default-600")}>
                Transport Required
              </span>
              <p className="text-xs text-default-500">{t('pages.schoolBusFacility')}</p>
            </div>
          </div>
          <div className={cn(
            "cursor-pointer rounded-xl border-2 p-4 flex items-center gap-3 transition-all",
            formData.hostelRequired ? "border-primary bg-primary-50/20" : "border-default-200 hover:border-default-300"
          )} onClick={() => updateField("hostelRequired", !formData.hostelRequired)}>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              formData.hostelRequired ? "bg-primary text-white" : "bg-default-100 text-default-400"
            )}>
              <Heart size={20} />
            </div>
            <div>
              <span className={cn("text-sm font-medium", formData.hostelRequired ? "text-primary-700" : "text-default-600")}>
                Hostel Required
              </span>
              <p className="text-xs text-default-500">{t('pages.boardingFacility')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Step2ParentsHealth;
