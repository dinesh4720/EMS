import PropTypes from "prop-types";
import { Plus, Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Button,
  EmptyState,
  Input,
  Modal,
  Select,
  Textarea,
} from "../../../components/ui";
import { useApp } from "../../../context/AppContext";
import { useCurrency } from "../../../context/hooks/useCurrency";
import FeeHeadEditorRow from "./FeeHeadEditorRow";

const SECTIONS = [
  { value: "primary", label: "Primary Section (Classes 1-5)" },
  { value: "middle", label: "Middle School (Classes 6-8)" },
  { value: "secondary", label: "Secondary School (Classes 9-10)" },
  { value: "senior", label: "Senior Secondary (Classes 11-12)" },
];

export default function FeeTemplateModal({
  isOpen,
  onClose,
  editing,
  formData,
  setFormData,
  saving,
  onSave,
  totalAnnualFee,
  onAddFeeHead,
  onUpdateFeeHead,
  onRemoveFeeHead,
}) {
  const { t } = useTranslation();
  const { currentAcademicYear } = useApp();
  const { fmt } = useCurrency();

  const sectionOptions = SECTIONS.map((sec) => ({
    value: sec.value,
    label: t(`fees.section.${sec.value}`, sec.label),
  }));

  const isSubmitDisabled =
    !formData.name.trim() || formData.feeHeads.length === 0 || saving;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? t("pages.editFeeTemplate", "Edit Fee Template") : t("pages.createFeeTemplate", "Create Fee Template")}
      description={t("pages.defineFeeStructureForASection", "Define the fee structure for a section")}
      size="4xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            variant="primary"
            disabled={isSubmitDisabled}
            loading={saving}
            icon={<Save size={16} />}
            onClick={onSave}
          >
            {editing ? t("pages.updateTemplate", "Update Template") : t("pages.createTemplate", "Create Template")}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t("pages.templateName", "Template Name")}
            placeholder={`e.g., Primary Section ${currentAcademicYear || ""}`}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Select
            label={t("pages.section1", "Section")}
            value={formData.section}
            onChange={(e) => setFormData({ ...formData, section: e.target.value })}
            options={sectionOptions}
          />
        </div>

        <Textarea
          label={t("pages.description1", "Description")}
          placeholder={t("pages.briefDescriptionOfThisFeeTemplate", "Brief description of this fee template")}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
        />

        <div className="border-t border-divider pt-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-fg">
                {t("pages.feeHeads1", "Fee Heads")}
              </h4>
              <p className="text-xs text-fg-muted">
                {t("pages.defineAllFeeComponents", "Define all fee components")}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<Plus size={14} />}
              onClick={onAddFeeHead}
            >
              {t("pages.addFeeHead", "Add Fee Head")}
            </Button>
          </div>

          {formData.feeHeads.length === 0 ? (
            <div className="border-2 border-dashed border-border-token rounded-lg">
              <EmptyState
                size="sm"
                title={t("fees.noFeeHeadsAdded", "No fee heads added yet")}
                description={t("fees.noFeeHeadsAddedHint", 'Click "Add Fee Head" to get started.')}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {formData.feeHeads.map((head, index) => (
                <FeeHeadEditorRow
                  key={head._id || `${head.name}-${index}`}
                  index={index}
                  head={head}
                  onUpdate={onUpdateFeeHead}
                  onRemove={onRemoveFeeHead}
                />
              ))}
            </div>
          )}

          {formData.feeHeads.length > 0 && (
            <div className="mt-4 p-4 bg-surface-2 rounded-lg border border-divider">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-fg">
                    {t("pages.totalAnnualFee", "Total Annual Fee")}
                  </p>
                  <p className="text-xs text-fg-muted">
                    {t("pages.sumOfAllFeeHeadsAnnualized", "Sum of all fee heads, annualized")}
                  </p>
                </div>
                <p className="text-2xl font-bold font-mono text-fg">
                  {fmt(totalAnnualFee)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

FeeTemplateModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  editing: PropTypes.object,
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  onSave: PropTypes.func.isRequired,
  totalAnnualFee: PropTypes.number.isRequired,
  onAddFeeHead: PropTypes.func.isRequired,
  onUpdateFeeHead: PropTypes.func.isRequired,
  onRemoveFeeHead: PropTypes.func.isRequired,
};
