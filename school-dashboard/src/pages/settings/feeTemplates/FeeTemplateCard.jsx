import PropTypes from "prop-types";
import { Edit, Trash2, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge, Chip, IconButton } from "../../../components/ui";
import { useCurrency } from "../../../context/hooks/useCurrency";

export default function FeeTemplateCard({ template, onEdit, onDuplicate, onDelete }) {
  const { t } = useTranslation();
  const { fmt } = useCurrency();

  return (
    <div className="p-4 bg-surface border border-divider rounded-lg hover:border-border-strong transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-fg truncate">
              {template.name}
            </h4>
            <Badge color={template.isActive ? "success" : "neutral"} dot>
              {template.isActive ? t("pages.active", "Active") : t("pages.inactive", "Inactive")}
            </Badge>
          </div>
          {template.description && (
            <p className="text-xs text-fg-muted mt-1 line-clamp-2">
              {template.description}
            </p>
          )}
        </div>
        <div className="flex gap-1 ml-2">
          <IconButton
            icon={<Edit size={14} />}
            aria-label={t("common.edit", "Edit")}
            size="sm"
            onClick={() => onEdit(template)}
          />
          <IconButton
            icon={<Copy size={14} />}
            aria-label={t("pages.duplicate", "Duplicate")}
            size="sm"
            onClick={() => onDuplicate(template)}
          />
          <IconButton
            icon={<Trash2 size={14} />}
            aria-label={t("common.delete", "Delete")}
            size="sm"
            variant="danger"
            onClick={() => onDelete(template._id)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-surface-2 rounded-md p-3">
          <p className="text-xs text-fg-muted uppercase tracking-wider mb-1">
            {t("pages.feeHeads1", "Fee Heads")}
          </p>
          <p className="text-lg font-semibold text-fg">
            {template.feeHeads?.length || 0}
          </p>
        </div>
        <div className="bg-surface-2 rounded-md p-3">
          <p className="text-xs text-fg-muted uppercase tracking-wider mb-1">
            {t("pages.annualFee", "Annual Fee")}
          </p>
          <p className="text-lg font-semibold font-mono text-fg">
            {fmt(template.totalAnnualFee || 0)}
          </p>
        </div>
      </div>

      {template.feeHeads?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {template.feeHeads.slice(0, 3).map((head) => (
            <Chip key={head._id || head.name} size="sm" color="neutral">
              {head.name}
            </Chip>
          ))}
          {template.feeHeads.length > 3 && (
            <Chip size="sm" color="neutral">
              {t("fees.moreCount", { count: template.feeHeads.length - 3, defaultValue: `+${template.feeHeads.length - 3} more` })}
            </Chip>
          )}
        </div>
      )}
    </div>
  );
}

FeeTemplateCard.propTypes = {
  template: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDuplicate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
