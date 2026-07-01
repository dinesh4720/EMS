import {
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
} from "@heroui/react";
import { RotateCcw, Trash2, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SkeletonTable } from "../../../../components/ui/Skeleton";
import {
  TYPE_LABELS,
  getTypeColor,
  getExpiryColor,
  getDaysRemaining,
  formatDate,
} from "../../utils/trashConstants";

const tableClassNames = {
  base: "overflow-visible",
  th: "bg-surface-2 text-fg-muted font-medium text-xs uppercase tracking-wider h-12 border-b border-border-token",
  td: "py-4 border-b border-divider transition-colors",
  tbody: "[&>tr:last-child>td]:border-none [&>tr[data-selected=true]>td]:bg-[var(--accent-bg)]",
  tr: "transition-colors hover:bg-surface-2 data-[selected=true]:bg-[var(--accent-bg)] dark:data-[selected=true]:bg-[var(--accent-bg)]",
};

/** Selectable trash table with row actions and Prev/Next pagination. */
export default function TrashTable({
  filteredItems,
  loading,
  selectedItems,
  setSelectedItems,
  actionInProgress,
  handleRestore,
  handlePermanentDelete,
  page,
  totalPages,
  hasMore,
  setPage,
}) {
  const { t } = useTranslation();
  return (
    <Card className="shadow-sm border border-border-token rounded-lg">
      <CardBody className="p-0">
        <Table
          aria-label={t('aria.tables.trashItems')}
          selectionMode="multiple"
          selectedKeys={selectedItems}
          onSelectionChange={setSelectedItems}
          removeWrapper
          classNames={tableClassNames}
        >
          <TableHeader>
            <TableColumn scope="col">{t('pages.nAME')}</TableColumn>
            <TableColumn scope="col">{t('pages.tYPE')}</TableColumn>
            <TableColumn scope="col">{t('pages.dELETEDBy')}</TableColumn>
            <TableColumn scope="col">{t('pages.dELETEDAt')}</TableColumn>
            <TableColumn scope="col">{t('pages.eXPIRESIn')}</TableColumn>
            <TableColumn align="end" scope="col">{t('pages.aCTIONS')}</TableColumn>
          </TableHeader>
          <TableBody
            items={filteredItems}
            emptyContent="No items in trash"
            loadingContent={<SkeletonTable columns={6} rows={5} />}
            isLoading={loading}
          >
            {(item) => {
              const daysRemaining = getDaysRemaining(item.expiresAt);
              // Backend returns itemName and itemType, handle both formats
              const itemName = item.itemName || item.name || 'Unknown';
              const itemType = item.itemType || item.type || 'Unknown';
              const deletedByName = item.deletedBy?.name || item.deletedBy || "Unknown";
              const itemId = item._id || item.id;

              return (
                <TableRow key={itemId}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-fg">
                        {itemName}
                      </p>
                      {item.description && (
                        <p className="text-xs text-fg-muted mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={getTypeColor(itemType)}
                    >
                      {TYPE_LABELS[itemType] || itemType}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-fg">
                      {deletedByName}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-fg-muted">
                      {formatDate(item.deletedAt)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={getExpiryColor(daysRemaining)}
                      startContent={
                        daysRemaining <= 3 ? (
                          <AlertTriangle size={14} />
                        ) : null
                      }
                    >
                      {daysRemaining === Infinity
                        ? "Never"
                        : `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}`}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-end">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="primary"
                        onPress={() => handleRestore(itemId)}
                        isLoading={actionInProgress}
                        aria-label={t('pages.restoreItem')}
                        title={t('pages.restoreItem')}
                        className="transition-all duration-200"
                      >
                        <RotateCcw size={16} aria-hidden="true" />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => handlePermanentDelete(itemId)}
                        isLoading={actionInProgress}
                        aria-label={t('pages.deletePermanently2')}
                        title={t('pages.deletePermanently2')}
                        className="transition-all duration-200"
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            }}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border-token">
            <div className="text-sm text-fg-muted">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="flat"
                isDisabled={page === 1}
                onPress={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="flat"
                isDisabled={!hasMore}
                onPress={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
