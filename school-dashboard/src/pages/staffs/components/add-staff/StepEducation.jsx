import { Input, Button, Chip, Autocomplete, AutocompleteItem } from "@heroui/react";
import { Plus, X, Upload, FileScan, Check, GraduationCap } from "lucide-react";
import { degreeOptions } from "./constants";
import { useTranslation } from "react-i18next";

const StepEducation = ({
  formData,
  errors,
  updateField,
  editingStaff,
  addQualification,
  removeQualification,
  updateQualification,
  handleQualificationDocUpload,
  removeQualificationDoc,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex justify-between items-end mb-2 border-b border-default-100 pb-2">
        <div>
          <h3 className="text-sm font-semibold text-default-900">{t('pages.educationDetails')}</h3>
          {!editingStaff && <p className="text-xs text-danger-500 mt-0.5">* At least one degree is required</p>}
          {editingStaff && <p className="text-xs text-default-400 mt-0.5">Optional — add or update qualifications</p>}
        </div>
        {(formData.professionalQualifications || []).length > 0 && (
          <button
            type="button"
            onClick={addQualification}
            className="h-8 text-xs font-medium text-primary hover:text-primary-600 hover:underline px-2 flex items-center gap-1 bg-transparent border-none cursor-pointer"
          >
            <Plus size={14} />
            Add Degree
          </button>
        )}
      </div>

      <div className="space-y-4">
        {(formData.professionalQualifications || []).map((qual, i) => (
          <div key={`qualification-${i}`} className="p-4 border border-default-200 rounded-xl space-y-4 relative group hover:border-default-300 transition-colors bg-default-50/20">
            <button
              className="absolute top-3 right-3 text-default-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-default-100 rounded-lg"
              onClick={() => removeQualification(i)}
            >
              <X size={14} />
            </button>

            <div className="grid grid-cols-12 gap-3 pr-8">
              <div className="col-span-8">
                <Autocomplete
                  label="Degree / Certificate"
                  labelPlacement="outside"
                  placeholder={t('pages.selectOrTypeDegree')}
                  defaultItems={degreeOptions}
                  inputValue={qual.name}
                  onInputChange={(v) => updateQualification(i, "name", v)}
                  allowsCustomValue
                  isRequired
                  variant="bordered"
                  radius="sm"
                  size="sm"
                  classNames={{
                    base: "max-w-full",
                    trigger: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-9 min-h-unit-8"
                  }}
                  isInvalid={!!errors[`qualName_${i}`]}
                  errorMessage={errors[`qualName_${i}`]}
                >
                  {(item) => <AutocompleteItem key={item.value}>{item.label}</AutocompleteItem>}
                </Autocomplete>
              </div>
              <div className="col-span-4">
                <Input
                  label={t('pages.year1')}
                  labelPlacement="outside"
                  placeholder="e.g. 2020"
                  value={qual.year}
                  onValueChange={v => {
                    if (v.length <= 4 && /^\d*$/.test(v)) updateQualification(i, "year", v);
                  }}
                  variant="bordered"
                  radius="sm"
                  size="sm"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min={1950}
                  max={new Date().getFullYear()}
                  isInvalid={!!errors[`qualYear_${i}`]}
                  errorMessage={errors[`qualYear_${i}`]}
                  classNames={{ inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-9" }}
                />
              </div>
            </div>

            {/* Document Upload for this qualification */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="flat"
                  className="h-8 text-xs bg-default-100 text-default-600 hover:bg-default-200"
                  onPress={() => document.getElementById(`qual-doc-${i}`).click()}
                  startContent={<Upload size={14} />}
                >
                  Upload Certificate
                </Button>
                {qual.documents && qual.documents.length > 0 && (
                  <Button
                    size="sm"
                    variant="light"
                    className="h-8 text-xs text-primary font-medium"
                    startContent={<FileScan size={14} />}
                    onPress={() => { /* Add logic later */ }}
                  >
                    Extract Info
                  </Button>
                )}
              </div>

              <input
                id={`qual-doc-${i}`}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => handleQualificationDocUpload(i, e.target.files)}
              />

              {qual.documents && qual.documents.length > 0 && (
                <div className="flex flex-wrap gap-1.5 align-middle ml-auto">
                  {qual.documents.map((file, docIdx) => (
                    <Chip
                      key={docIdx}
                      size="sm"
                      variant="flat"
                      onClose={() => removeQualificationDoc(i, docIdx)}
                      classNames={{ base: "h-6 text-xs bg-success-50 text-success-700" }}
                      startContent={<Check size={12} />}
                    >
                      {file.name}
                    </Chip>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {(formData.professionalQualifications || []).length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-default-200 rounded-xl bg-default-50/30 flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-default-100 flex items-center justify-center text-default-400">
              <GraduationCap size={20} />
            </div>
            <div className="text-xs text-default-500">
              No degrees added. <span className="text-danger">*Required</span>
            </div>
            <button
              type="button"
              onClick={addQualification}
              className="text-xs font-medium text-primary hover:text-primary-600 hover:underline bg-transparent border-none cursor-pointer"
            >
              Add Degree
            </button>
          </div>
        )}
        {errors.qualifications && <p className="text-xs text-danger">{errors.qualifications}</p>}
      </div>

      <div className="space-y-4 pt-6 border-t border-dashed border-default-200">
        <h4 className="text-sm font-semibold text-default-900">Work Experience</h4>

        <div className="space-y-3">
          {/* Row 1: Org Name (Flex) and Years (Fixed small width) */}
          <div className="flex gap-4">
            <Input
              label={t('pages.previousOrganization')}
              labelPlacement="outside"
              placeholder={t('pages.organizationName')}
              value={formData.previousOrganization}
              onValueChange={v => updateField("previousOrganization", v)}
              variant="bordered"
              radius="sm"
              className="flex-1"
              classNames={{ label: "text-xs font-medium text-default-600 mb-1", inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-10" }}
            />
            <Input
              label={t('pages.expYears')}
              labelPlacement="outside"
              placeholder={t('staff.form.experiencePlaceholder')}
              value={formData.totalExperience}
              onValueChange={v => {
                // Only allow numbers and limit to 2 digits
                const numericValue = v.replace(/\D/g, '').slice(0, 2);
                updateField("totalExperience", numericValue);
              }}
              variant="bordered"
              radius="sm"
              className="w-28"
              classNames={{ label: "text-xs font-medium text-default-600 mb-1", inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-10" }}
              maxLength={2}
            />
          </div>

          {/* Row 2: Role in Organization */}
          <Input
            label="Role / Designation"
            labelPlacement="outside"
            placeholder={t('staff.form.designationPlaceholder')}
            value={formData.roleInOrganization}
            onValueChange={v => updateField("roleInOrganization", v)}
            variant="bordered"
            radius="sm"
            classNames={{ label: "text-xs font-medium text-default-700 dark:text-default-400 mb-1", inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-10" }}
          />
        </div>
      </div>
    </div>
  );
};

export default StepEducation;
