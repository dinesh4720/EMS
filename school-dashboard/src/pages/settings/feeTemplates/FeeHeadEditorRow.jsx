import PropTypes from "prop-types";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { IconButton, Input, Select, Switch } from "../../../components/ui";
import { useCurrency } from "../../../context/hooks/useCurrency";

const CATEGORIES = ["Academic", "Transport", "Extra-curricular", "Hostel", "Other"];

const FREQUENCIES = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "term", label: "Term-wise" },
  { value: "yearly", label: "Yearly (One-time)" },
  { value: "one-time", label: "One-time (Admission)" },
];

export default function FeeHeadEditorRow({ index, head, onUpdate, onRemove }) {
  const { t } = useTranslation();
  const { currencySymbol } = useCurrency();

  const categoryLabels = {
    Academic: t("fees.category.academic", "Academic"),
    Transport: t("fees.category.transport", "Transport"),
    "Extra-curricular": t("fees.category.extraCurricular", "Extra-curricular"),
    Hostel: t("fees.category.hostel", "Hostel"),
    Other: t("fees.category.other", "Other"),
  };

  return (
    <div className="p-4 bg-surface-2 rounded-lg border border-divider">
      <div className="flex items-center justify-between mb-3">
        <h5 className="text-sm font-semibold text-fg">
          {t("fees.feeHeadNum", { num: index + 1, defaultValue: `Fee Head #${index + 1}` })}
        </h5>
        <IconButton
          icon={<Trash2 size={14} />}
          aria-label={t("common.remove", "Remove")}
          size="sm"
          variant="danger"
          onClick={() => onRemove(index)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input
          label={t("pages.feeHeadName", "Fee Head Name")}
          placeholder={t("fees.feeHeadNamePlaceholder", "e.g. Tuition Fee")}
          value={head.name}
          onChange={(e) => onUpdate(index, "name", e.target.value)}
        />
        <Select
          label={t("pages.category1", "Category")}
          value={head.category}
          onChange={(e) => onUpdate(index, "category", e.target.value)}
          options={CATEGORIES.map((cat) => ({ value: cat, label: categoryLabels[cat] || cat }))}
        />
        <Select
          label={t("pages.frequency", "Frequency")}
          value={head.frequency}
          onChange={(e) => onUpdate(index, "frequency", e.target.value)}
          options={FREQUENCIES}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
        <Input
          type="number"
          label={t("fees.amountLabel", "Amount")}
          placeholder={t("fees.amountPlaceholder", "0")}
          value={head.amount}
          onChange={(e) => onUpdate(index, "amount", Math.max(0, parseInt(e.target.value, 10) || 0))}
          startContent={<span className="text-sm">{currencySymbol}</span>}
          min={0}
        />
        <Input
          type="number"
          label={t("pages.dueDay", "Due Day")}
          placeholder={t("fees.dueDayPlaceholder", "10")}
          value={head.dueDay}
          onChange={(e) => onUpdate(index, "dueDay", parseInt(e.target.value, 10) || 10)}
          min={1}
          max={28}
        />
        <div className="flex items-center justify-between p-3 rounded-lg border border-border-token bg-surface">
          <span className="text-xs font-medium text-fg">
            {t("pages.mandatory", "Mandatory")}
          </span>
          <Switch
            checked={head.mandatory}
            onChange={(e) => onUpdate(index, "mandatory", e.target.checked)}
          />
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg border border-border-token bg-surface">
          <span className="text-xs font-medium text-fg">
            {t("pages.refundable", "Refundable")}
          </span>
          <Switch
            checked={head.refundable}
            onChange={(e) => onUpdate(index, "refundable", e.target.checked)}
          />
        </div>
      </div>
    </div>
  );
}

FeeHeadEditorRow.propTypes = {
  index: PropTypes.number.isRequired,
  head: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};
