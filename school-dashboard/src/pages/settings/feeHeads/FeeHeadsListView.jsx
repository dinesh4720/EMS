import PropTypes from "prop-types";
import { Edit, Trash2, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge, EmptyState, IconButton } from "../../../components/ui";
import { useCurrency } from "../../../context/hooks/useCurrency";

export default function FeeHeadsListView({
  feeHeads,
  visibleFeeHeads,
  hasMore,
  isLoadingMore,
  loaderRef,
  itemsPerLoad,
  deletingId,
  onEdit,
  onDelete,
  onApply,
}) {
  const { t } = useTranslation();
  const { fmt } = useCurrency();

  if (feeHeads.length === 0) {
    return (
      <div className="rounded-lg border border-divider bg-surface">
        <EmptyState
          title={t("pages.noFeeHeadsConfigured", "No fee heads configured")}
          description={t(
            "fees.noFeeHeadsHint",
            "Create your first fee head to start configuring fees for classes.",
          )}
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-divider overflow-hidden overflow-x-auto bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-2 border-b border-divider">
            <th scope="col" className="text-left px-4 py-3 text-xs font-medium text-fg-muted uppercase tracking-wider">
              {t("pages.fEEHead", "Fee Head")}
            </th>
            <th scope="col" className="text-left px-4 py-3 text-xs font-medium text-fg-muted uppercase tracking-wider">
              {t("pages.aMOUNT", "Amount")}
            </th>
            <th scope="col" className="text-left px-4 py-3 text-xs font-medium text-fg-muted uppercase tracking-wider">
              {t("pages.cLASSES", "Classes")}
            </th>
            <th scope="col" className="text-left px-4 py-3 text-xs font-medium text-fg-muted uppercase tracking-wider">
              {t("pages.tYPE", "Type")}
            </th>
            <th scope="col" className="text-right px-4 py-3 text-xs font-medium text-fg-muted uppercase tracking-wider">
              {t("pages.aCTIONS", "Actions")}
            </th>
          </tr>
        </thead>
        <tbody>
          {visibleFeeHeads.map((feeHead) => (
            <tr
              key={feeHead._id}
              className="border-b border-divider last:border-0 hover:bg-surface-2-2"
            >
              <td className="px-4 py-3">
                <p className="font-medium text-fg">{feeHead.name}</p>
                <p className="text-xs text-fg-muted">
                  {feeHead.category} • {feeHead.frequency}
                </p>
              </td>
              <td className="px-4 py-3 font-mono text-fg">
                {fmt(feeHead.amount || 0)}
              </td>
              <td className="px-4 py-3 text-fg-muted">
                {feeHead.applicableClasses?.length > 0
                  ? feeHead.applicableClasses.length === 12
                    ? t("pages.allClasses", "All Classes")
                    : t("fees.classCount", { count: feeHead.applicableClasses.length, defaultValue: `${feeHead.applicableClasses.length} classes` })
                  : "—"}
              </td>
              <td className="px-4 py-3">
                <Badge
                  color={feeHead.mandatory ? "neutral" : "neutral"}
                  variant="outline"
                  dot
                >
                  {feeHead.mandatory ? t("pages.required1", "Required") : t("common.optional", "Optional")}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1 justify-end">
                  <IconButton
                    icon={<Users size={14} />}
                    aria-label={t("pages.applyToStudents", "Apply to students")}
                    size="sm"
                    onClick={() => onApply(feeHead._id)}
                  />
                  <IconButton
                    icon={<Edit size={14} />}
                    aria-label={t("common.edit", "Edit")}
                    size="sm"
                    onClick={() => onEdit(feeHead)}
                  />
                  <IconButton
                    icon={<Trash2 size={14} />}
                    aria-label={t("common.delete", "Delete")}
                    size="sm"
                    variant="danger"
                    disabled={deletingId === feeHead._id}
                    onClick={() => onDelete(feeHead._id)}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div
        ref={loaderRef}
        className="flex justify-center py-3 bg-surface-2 border-t border-divider"
      >
        {isLoadingMore && (
          <span className="text-xs text-fg-muted">
            {t("pages.loading", "Loading…")}
          </span>
        )}
        {!hasMore && feeHeads.length > itemsPerLoad && (
          <span className="text-xs text-fg-faint">
            {t("pages.allFeeHeadsLoaded", "All fee heads loaded")}
          </span>
        )}
      </div>
    </div>
  );
}

FeeHeadsListView.propTypes = {
  feeHeads: PropTypes.array.isRequired,
  visibleFeeHeads: PropTypes.array.isRequired,
  hasMore: PropTypes.bool,
  isLoadingMore: PropTypes.bool,
  loaderRef: PropTypes.any,
  itemsPerLoad: PropTypes.number.isRequired,
  deletingId: PropTypes.string,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
};
