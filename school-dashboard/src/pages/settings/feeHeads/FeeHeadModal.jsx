import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Button,
  Input,
  Select,
  Switch,
} from "../../../components/ui";
import { useCurrency } from "../../../context/hooks/useCurrency";

const CATEGORIES = ["Academic", "Transport", "Extra-curricular", "Hostel", "Other"];

const FREQUENCIES = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

const CLASS_PRESETS = {
  all: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
  primary: ["1", "2", "3", "4", "5"],
  secondary: ["6", "7", "8", "9", "10"],
  senior: ["11", "12"],
};

const PRESET_OPTIONS = [
  { key: "all", label: "All" },
  { key: "primary", label: "Primary (1-5)" },
  { key: "secondary", label: "Secondary (6-10)" },
  { key: "senior", label: "Senior (11-12)" },
];

export default function FeeHeadModal({
  isOpen,
  onClose,
  editing,
  formData,
  setFormData,
  classRangeInput,
  onClassRangeChange,
  saving,
  onSave,
}) {
  const { t } = useTranslation();
  const { currencySymbol } = useCurrency();

  const handlePresetClick = (presetKey) => {
    const classes = CLASS_PRESETS[presetKey];
    setFormData({ ...formData, applicableClasses: classes });
    onClassRangeChange(classes.join(","), { skipParse: true });
  };

  const isPresetSelected = (presetKey) =>
    JSON.stringify(formData.applicableClasses) ===
    JSON.stringify(CLASS_PRESETS[presetKey]);

  const isSubmitDisabled =
    !formData.name.trim() ||
    formData.applicableClasses.length === 0 ||
    saving;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? t("pages.editFeeHead", "Edit Fee Head") : t("pages.addFeeHead", "Add Fee Head")}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            variant="primary"
            disabled={isSubmitDisabled}
            loading={saving}
            onClick={onSave}
          >
            {editing ? t("pages.update", "Update") : t("pages.create", "Create")}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Input
          label={t("pages.feeHeadName", "Fee Head Name")}
          placeholder={t("fees.feeHeadNamePlaceholder")}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t("pages.amount1", "Amount")}
            type="number"
            placeholder={t("fees.amountPlaceholder")}
            value={formData.amount || ""}
            onChange={(e) =>
              setFormData({ ...formData, amount: parseInt(e.target.value, 10) || 0 })
            }
            startContent={<span className="text-sm">{currencySymbol}</span>}
            min={0}
          />
          <Select
            label={t("pages.frequency", "Frequency")}
            value={formData.frequency}
            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
            options={FREQUENCIES}
          />
        </div>

        <Select
          label={t("pages.category1", "Category")}
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          options={CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
        />

        <div className="space-y-3">
          <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
            {t("pages.applicableClasses", "Applicable Classes")}
          </label>

          <div className="flex flex-wrap gap-2">
            {PRESET_OPTIONS.map((preset) => (
              <Button
                key={preset.key}
                size="sm"
                variant={isPresetSelected(preset.key) ? "primary" : "outline"}
                onClick={() => handlePresetClick(preset.key)}
                type="button"
              >
                {preset.label}
              </Button>
            ))}
          </div>

          <Input
            placeholder={t("fees.classRangePlaceholder")}
            value={classRangeInput}
            onChange={(e) => onClassRangeChange(e.target.value)}
            hint={
              formData.applicableClasses.length > 0
                ? `Selected: ${formData.applicableClasses.join(", ")}`
                : "Selected: None"
            }
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-border-token bg-surface-2">
          <div>
            <p className="text-sm font-medium text-fg">
              {t("pages.requiredFee", "Required Fee")}
            </p>
            <p className="text-xs text-fg-muted">
              {t("pages.isThisFeeRequiredForAllStudents")}
            </p>
          </div>
          <Switch
            checked={formData.isRequired}
            onChange={(e) =>
              setFormData({ ...formData, isRequired: e.target.checked })
            }
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-border-token bg-surface-2">
          <div>
            <p className="text-sm font-medium text-fg">
              {t("pages.autoApply", "Auto Apply")}
            </p>
            <p className="text-xs text-fg-muted">
              {t("pages.autoAppliedToAllStudentsInSelectedClasses")}
            </p>
          </div>
          <Switch
            checked={formData.autoApply}
            onChange={(e) =>
              setFormData({ ...formData, autoApply: e.target.checked })
            }
          />
        </div>
      </div>
    </Modal>
  );
}

FeeHeadModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  editing: PropTypes.object,
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired,
  classRangeInput: PropTypes.string.isRequired,
  onClassRangeChange: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  onSave: PropTypes.func.isRequired,
};
