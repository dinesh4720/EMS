import React from "react";
import { Tooltip } from "../../../../components/ui";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../../../../../utils/numberFormatter";

function getFeeStatusStyle(status) {
    switch (status) {
        case "paid":    return "bg-[var(--ok-bg)] border-[var(--ok)]/20 text-[var(--ok)]";
        case "pending": return "bg-[var(--warn-bg)] border-[var(--warn)]/20 text-[var(--warn)]";
        case "overdue": return "bg-[var(--danger-bg)] border-[var(--danger)]/20 text-[var(--danger)]";
        case "partial": return "bg-[var(--accent-bg)] border-[var(--accent)]/20 text-[var(--accent)]";
        default:        return "bg-surface-2 border-divider text-fg-muted";
    }
}

function FeeStatusCell({ student, className, studentFeeStructures, currentAcademicYear }) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const feeStructure = studentFeeStructures[student.id];
    const hasFeeStructure = feeStructure && feeStructure._exists !== false;

    const details = hasFeeStructure
        ? {
              total: formatCurrency(feeStructure.totalFee || 0),
              paid: formatCurrency(feeStructure.totalPaid || 0),
              pending: formatCurrency(feeStructure.totalBalance || 0),
              date: feeStructure.totalBalance > 0 ? `Due: ${currentAcademicYear}` : null,
              status: feeStructure.overallStatus || student.feeStatus,
              exists: true,
          }
        : {
              total: "Not initialized",
              paid: "\u2014",
              pending: "\u2014",
              date: null,
              status: "not-initialized",
              exists: false,
          };

    return (
        <td className={className}>
            <Tooltip
                content={
                    <div className="px-3 py-3">
                        <div className="text-base font-semibold mb-3 text-fg">
                            Fee Structure ({currentAcademicYear})
                        </div>
                        {details.exists ? (
                            <>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-fg-muted mb-3">
                                    <span>{t("pages.totalFee2")}</span>
                                    <span className="text-right text-fg">{details.total}</span>
                                    <span>{t("pages.paid3")}</span>
                                    <span className="text-right text-ok">{details.paid}</span>
                                    <span>{t("pages.pending3")}</span>
                                    <span className="text-right text-danger">{details.pending}</span>
                                </div>
                                {details.date && (
                                    <div className="mb-3 text-sm text-warn border-t border-divider pt-2">
                                        {details.date}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-sm text-fg-muted mb-3">
                                <p className="mb-2 text-warn">
                                    {t("pages.feeStructureNotInitialized")}
                                </p>
                                <p className="text-xs">
                                    Click &quot;View Details&quot; to set up fees for {student.name}
                                </p>
                            </div>
                        )}
                        <div className="pt-2 border-t border-divider">
                            <button
                                className="text-accent text-sm hover:text-accent/80 transition-colors w-full text-left"
                                onClick={() => navigate(`/students/${student.id}?tab=fees`)}
                            >
                                View full fee details &rarr;
                            </button>
                        </div>
                    </div>
                }
                placement="bottom"
                closeDelay={0}
            >
                <div
                    className={`inline-flex items-center px-2 py-1 rounded-lg border text-xs font-medium capitalize cursor-default ${
                        details.status === "not-initialized"
                            ? "bg-[var(--warn-bg)] border-[var(--warn)]/20 text-[var(--warn)]"
                            : getFeeStatusStyle(details.status)
                    }`}
                >
                    {details.status === "not-initialized" ? "Not Set" : details.status}
                </div>
            </Tooltip>
        </td>
    );
}

export default React.memo(FeeStatusCell);
