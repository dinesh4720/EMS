import { Inbox } from "lucide-react";
import EmptyState from "../../components/ui/EmptyState";

export default function RefundsEmptyState({ searchQuery, statusFilter, t }) {
  const hasFilter = !!searchQuery || statusFilter !== "all";
  return (
    <EmptyState
      icon={Inbox}
      title={t("pages.noRefundRecords", "No refund records found.")}
      description={
        hasFilter
          ? t("pages.tryAdjustingFilters", "Try adjusting your search or filters.")
          : t("pages.noRefundsYetDescription", "Refund requests will appear here once created.")
      }
      size="md"
    />
  );
}
