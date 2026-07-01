/**
 * TrashSettings — deleted-items management screen.
 *
 * Composition root only. State, data-loading and actions live in the
 * `useTrashSettings` hook; pure helpers/labels in `utils/trashConstants`; each
 * visual section is its own component under `components/trash/`. Behaviour is
 * identical to the former 806-line monolith.
 */
import { Button } from "@heroui/react";
import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TablePageSkeleton } from "../../components/skeletons/PageSkeletons";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useTrashSettings } from "./hooks/useTrashSettings";
import TrashStatsCards from "./components/trash/TrashStatsCards";
import TrashFilters from "./components/trash/TrashFilters";
import TrashBulkToolbar from "./components/trash/TrashBulkToolbar";
import TrashTable from "./components/trash/TrashTable";
import TrashBulkActionModal from "./components/trash/TrashBulkActionModal";

// Backward-compatibility: `trashApi` was historically exported from this file.
export { trashApi } from "./utils/trashApi";

export default function TrashSettings() {
  const { t } = useTranslation();
  const ts = useTrashSettings();

  if (ts.loading) {
    return <TablePageSkeleton />;
  }

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-border-token pb-6">
        <div>
          <h2 className="text-2xl font-bold text-fg">{t('pages.trashManagement')}</h2>
          <p className="text-sm text-fg-muted mt-1">
            View and manage deleted items. Items are permanently deleted after 30 days.
          </p>
        </div>
        <Button
          color="primary"
          variant="flat"
          size="sm"
          startContent={<RefreshCw size={16} />}
          onPress={ts.loadTrashData}
          isLoading={ts.loading}
          className="transition-all duration-200"
        >
          Refresh
        </Button>
      </div>

      <TrashStatsCards stats={ts.stats} topTypeStats={ts.topTypeStats} />

      <TrashFilters
        searchTerm={ts.searchTerm}
        setSearchTerm={ts.setSearchTerm}
        typeFilter={ts.typeFilter}
        setTypeFilter={ts.setTypeFilter}
        setPage={ts.setPage}
      />

      <TrashBulkToolbar
        selectedCount={ts.selectedItems.size}
        actionInProgress={ts.actionInProgress}
        handleBulkAction={ts.handleBulkAction}
      />

      <TrashTable
        filteredItems={ts.filteredItems}
        loading={ts.loading}
        selectedItems={ts.selectedItems}
        setSelectedItems={ts.setSelectedItems}
        actionInProgress={ts.actionInProgress}
        handleRestore={ts.handleRestore}
        handlePermanentDelete={ts.handlePermanentDelete}
        page={ts.page}
        totalPages={ts.totalPages}
        hasMore={ts.hasMore}
        setPage={ts.setPage}
      />

      <TrashBulkActionModal
        isOpen={ts.isOpen}
        onClose={ts.onClose}
        pendingAction={ts.pendingAction}
        selectedItems={ts.selectedItems}
        trashItems={ts.trashItems}
        actionInProgress={ts.actionInProgress}
        confirmBulkAction={ts.confirmBulkAction}
      />

      <ConfirmDialog {...ts.confirmState} onClose={ts.closeConfirm} />
    </div>
  );
}
