import PropTypes from "prop-types";
import { ChevronDown, ChevronRight, Edit, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge, Button, EmptyState, IconButton } from "../../../components/ui";
import { useCurrency } from "../../../context/hooks/useCurrency";

export default function FeeHeadsByClassView({
  classKeys,
  classFeeData,
  expandedClasses,
  onToggleExpand,
  onExpandAll,
  onCollapseAll,
  deletingId,
  onEdit,
  onDelete,
}) {
  const { t } = useTranslation();
  const { fmt } = useCurrency();

  if (classKeys.length === 0) {
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
    <div className="space-y-3">
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" onClick={onExpandAll}>
          {t("common.expandAll", "Expand All")}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCollapseAll}>
          {t("common.collapseAll", "Collapse All")}
        </Button>
      </div>

      {classKeys.map((classKey) => {
        const data = classFeeData[classKey];
        const isExpanded = expandedClasses.has(classKey);
        return (
          <div
            key={classKey}
            className="rounded-lg border border-divider bg-surface overflow-hidden"
          >
            <button
              type="button"
              onClick={() => onToggleExpand(classKey)}
              aria-expanded={isExpanded}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-2-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:ring-inset"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown size={16} className="text-fg-faint" />
                ) : (
                  <ChevronRight size={16} className="text-fg-faint" />
                )}
                <span className="text-sm font-semibold text-fg">
                  {t("pages.classN", { class: classKey, defaultValue: `Class ${classKey}` })}
                </span>
                <span className="text-xs text-fg-faint">
                  {data.heads.length} {data.heads.length === 1 ? "fee head" : "fee heads"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-fg-muted">
                  {t("pages.required1", "Required")}:{" "}
                  <span className="font-mono font-medium text-fg">
                    {fmt(data.totalRequired)}
                  </span>
                </span>
                {data.totalOptional > 0 && (
                  <span className="text-xs text-fg-muted">
                    {t("common.optional", "Optional")}:{" "}
                    <span className="font-mono font-medium text-fg">
                      {fmt(data.totalOptional)}
                    </span>
                  </span>
                )}
                <Badge color="neutral">
                  Total {fmt(data.total)}
                </Badge>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-divider overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-2">
                      <th scope="col" className="text-left px-4 py-2 text-xs font-medium text-fg-muted uppercase tracking-wider">
                        {t("pages.fEEHead", "Fee Head")}
                      </th>
                      <th scope="col" className="text-left px-4 py-2 text-xs font-medium text-fg-muted uppercase tracking-wider">
                        {t("pages.category1", "Category")}
                      </th>
                      <th scope="col" className="text-right px-4 py-2 text-xs font-medium text-fg-muted uppercase tracking-wider">
                        {t("pages.aMOUNT", "Amount")}
                      </th>
                      <th scope="col" className="text-left px-4 py-2 text-xs font-medium text-fg-muted uppercase tracking-wider">
                        {t("pages.tYPE", "Type")}
                      </th>
                      <th scope="col" className="text-right px-4 py-2 text-xs font-medium text-fg-muted uppercase tracking-wider">
                        {t("pages.aCTIONS", "Actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.heads.map((fh) => (
                      <tr
                        key={fh._id}
                        className="border-t border-divider hover:bg-surface-2-2"
                      >
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-fg">{fh.name}</p>
                          <p className="text-xs text-fg-faint">{fh.frequency}</p>
                        </td>
                        <td className="px-4 py-2.5 text-fg-muted">
                          {fh.category}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-fg">
                          {fmt(fh.amount || 0)}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge color="neutral" variant="outline" dot>
                            {fh.mandatory ? t("pages.required1", "Required") : t("common.optional", "Optional")}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex gap-1 justify-end">
                            <IconButton
                              icon={<Edit size={14} />}
                              aria-label={t("common.edit", "Edit")}
                              size="sm"
                              onClick={() => onEdit(fh)}
                            />
                            <IconButton
                              icon={<Trash2 size={14} />}
                              aria-label={t("common.delete", "Delete")}
                              size="sm"
                              variant="danger"
                              disabled={deletingId === fh._id}
                              onClick={() => onDelete(fh._id)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

FeeHeadsByClassView.propTypes = {
  classKeys: PropTypes.array.isRequired,
  classFeeData: PropTypes.object.isRequired,
  expandedClasses: PropTypes.instanceOf(Set).isRequired,
  onToggleExpand: PropTypes.func.isRequired,
  onExpandAll: PropTypes.func.isRequired,
  onCollapseAll: PropTypes.func.isRequired,
  deletingId: PropTypes.string,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
