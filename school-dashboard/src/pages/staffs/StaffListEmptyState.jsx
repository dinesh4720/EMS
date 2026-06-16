import { Users } from "lucide-react";
import EmptyState from "../../components/ui/EmptyState";

/**
 * Empty state for the staff list. Distinguishes "no staff at all" (offers Add
 * staff) from "no staff matched the current search/filters" (offers Clear
 * filters). `isFiltered` is true when a search query or pill filter is active.
 */
export default function StaffListEmptyState({
  staffCount,
  isFiltered,
  onAddStaff,
  onClearFilters,
}) {
  const empty = staffCount === 0;
  return (
    <EmptyState
      icon={Users}
      title={empty ? "No staff yet" : "No staff matched"}
      description={
        empty
          ? "Get started by adding your first staff member."
          : isFiltered
          ? "Try adjusting your filters or search query."
          : "No staff found for the current view."
      }
      actionLabel={empty ? "Add staff" : "Clear filters"}
      onAction={() => {
        if (empty) onAddStaff?.();
        else onClearFilters?.();
      }}
      size="md"
    />
  );
}
