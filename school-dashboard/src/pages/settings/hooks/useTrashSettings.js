/**
 * useTrashSettings
 * State, data-loading, filtering and bulk/single action handlers for the Trash
 * settings screen. Logic transplanted verbatim from the former TrashSettings.jsx
 * monolith — behaviour is unchanged.
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { useDisclosure } from "@heroui/react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import logger from "../../../utils/logger";
import useConfirmDialog from "../../../hooks/useConfirmDialog";
import { trashApi } from "../utils/trashApi";

export function useTrashSettings() {
  const { t } = useTranslation();
  // State management
  const [trashItems, setTrashItems] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    expiringSoon: 0,
    byType: {}, // dynamic: { Student: { count, expiringSoon }, ... }
  });
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [actionInProgress, setActionInProgress] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'restore' or 'delete'
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();

  // Load trash items and statistics
  const loadTrashData = useCallback(async (signal) => {
    try {
      setLoading(true);
      const [itemsData, statsData] = await Promise.all([
        trashApi.getAll(page, limit, { signal }),
        trashApi.getStats({ signal }),
      ]);
      if (signal?.aborted) return;

      // Handle paginated response
      setTrashItems(itemsData.items || []);
      setTotalPages(itemsData.pagination?.totalPages || 1);
      setHasMore(itemsData.pagination?.hasMore || false);

      // Transform backend stats format
      // Backend returns: { Student: { count, expiringSoon }, Staff: {...}, ... }
      const transformedStats = statsData ? {
        total: itemsData.total || Object.values(statsData).reduce((sum, type) => sum + (type.count || 0), 0),
        expiringSoon: statsData.totalExpiring || Object.values(statsData).reduce((sum, type) => sum + (type.expiringSoon || 0), 0),
        byType: statsData || {},
      } : {
        total: 0,
        expiringSoon: 0,
        byType: {},
      };
      setStats(transformedStats);
    } catch (error) {
      if (error.name === 'AbortError') return;
      logger.error("Failed to load trash data:", error);
      toast.error(t('toast.error.failedToLoadTrashData'));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [page, limit, t]);

  // Load trash data on mount and when page changes
  useEffect(() => {
    const controller = new AbortController();
    loadTrashData(controller.signal);
    return () => controller.abort();
  }, [loadTrashData]);

  // Filter trash items based on search and type filter
  const filteredItems = useMemo(() => {
    // Safety check: ensure trashItems is an array
    if (!Array.isArray(trashItems)) {
      logger.warn('⚠️ trashItems is not an array:', trashItems);
      return [];
    }

    return trashItems.filter((item) => {
      // Backend returns itemName and itemType, not name and type
      const itemName = item.itemName || item.name || '';
      const itemType = item.itemType || item.type || '';
      const deletedByName = item.deletedBy?.name || item.deletedBy || '';

      const matchesSearch =
        itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deletedByName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType =
        typeFilter === "all" || itemType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [trashItems, searchTerm, typeFilter]);

  // Handle single item restore
  const handleRestore = useCallback(async (id) => {
    try {
      setActionInProgress(true);
      await trashApi.restore(id);
      toast.success(t('toast.success.itemRestoredSuccessfully'));
      await loadTrashData();
      setSelectedItems(new Set());
    } catch (error) {
      logger.error("Failed to restore item:", error);
      toast.error(error.message || "Failed to restore item");
    } finally {
      setActionInProgress(false);
    }
  }, [loadTrashData, t]);

  // Handle permanent delete of single item
  const handlePermanentDelete = useCallback((id) => {
    showConfirm({
      title: 'Delete Permanently',
      message: t('confirm.deletePermanently'),
      variant: 'danger',
      confirmText: 'Delete Permanently',
      onConfirm: async () => {
        try {
          setActionInProgress(true);
          await trashApi.permanentDelete(id);
          toast.success(t('toast.success.itemPermanentlyDeleted'));
          await loadTrashData();
          setSelectedItems(new Set());
        } catch (error) {
          logger.error("Failed to permanently delete item:", error);
          toast.error(error.message || "Failed to delete item");
        } finally {
          setActionInProgress(false);
        }
      },
    });
  }, [showConfirm, loadTrashData, t]);

  // Handle bulk action (restore or delete)
  const handleBulkAction = useCallback((action) => {
    if (selectedItems.size === 0) return;

    setPendingAction(action);
    onOpen();
  }, [selectedItems.size, onOpen]);

  // Confirm and execute bulk action
  const confirmBulkAction = useCallback(async () => {
    try {
      setActionInProgress(true);
      const ids = Array.from(selectedItems);

      if (pendingAction === "restore") {
        await trashApi.restoreBulk(ids);
        toast.success(`Restored ${ids.length} item(s) successfully`);
      } else if (pendingAction === "delete") {
        await trashApi.permanentDeleteBulk(ids);
        toast.success(`Permanently deleted ${ids.length} item(s)`);
      }

      onClose();
      await loadTrashData();
      setSelectedItems(new Set());
      setPendingAction(null);
    } catch (error) {
      logger.error("Failed to execute bulk action:", error);
      toast.error(error.message || "Failed to complete action");
    } finally {
      setActionInProgress(false);
    }
  }, [pendingAction, selectedItems, loadTrashData, onClose, t]);

  const topTypeStats = useMemo(() => {
    return Object.entries(stats.byType)
      .sort(([, a], [, b]) => (b.count || 0) - (a.count || 0))
      .slice(0, 2);
  }, [stats.byType]);

  return {
    // data + status
    trashItems, stats, loading, filteredItems, topTypeStats,
    // selection + filters
    selectedItems, setSelectedItems,
    searchTerm, setSearchTerm,
    typeFilter, setTypeFilter,
    actionInProgress, pendingAction,
    // pagination
    page, setPage, totalPages, hasMore,
    // bulk modal + confirm dialog
    isOpen, onClose,
    confirmState, closeConfirm,
    // actions
    loadTrashData,
    handleRestore, handlePermanentDelete,
    handleBulkAction, confirmBulkAction,
  };
}
