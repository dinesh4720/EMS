import { useState, useEffect, useMemo, useCallback } from "react";
import logger from "../../utils/logger";
import {
  Card,
  CardBody,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Search,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';

// Trash API - Add this to api.js when integrating
export const trashApi = {
  getAll: async (page = 1, limit = 50, options = {}) => {
    const response = await request(`/trash?page=${page}&limit=${limit}`, options);
    // Backend returns { success: true, data: trashItems, total, pagination }
    return {
      items: response.data || [],
      total: response.total || 0,
      pagination: response.pagination || { page, limit, totalPages: 1, hasMore: false }
    };
  },
  getStats: async (options = {}) => {
    const response = await request("/trash/stats", options);
    // Backend returns { success: true, byType, totalExpiring }
    return response.byType || response;
  },
  restore: (id) => request(`/trash/${id}/restore`, { method: "POST" }),
  restoreBulk: (ids) => request("/trash/bulk-restore", {
    method: "POST",
    body: JSON.stringify({ trashItemIds: ids })
  }),
  permanentDelete: (id) => request(`/trash/${id}`, { method: "DELETE" }),
  permanentDeleteBulk: (ids) => request("/trash/bulk-delete", {
    method: "DELETE",
    body: JSON.stringify({ trashItemIds: ids })
  }),
};

// Import request function
import { request } from "../../services/api";
import { getDateLocale } from '../../i18n/index';
import { useTranslation } from 'react-i18next';
import { SkeletonTable } from '../../components/ui/Skeleton';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useConfirmDialog from '../../hooks/useConfirmDialog';


export default function TrashSettings() {
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

  // Calculate days remaining until permanent deletion
  const getDaysRemaining = (expiresAt) => {
    if (!expiresAt) return Infinity;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Get chip color based on days remaining
  const getExpiryColor = (days) => {
    if (days <= 3) return "danger";
    if (days <= 7) return "warning";
    return "success";
  };

  // Friendly display labels for entity types
  const TYPE_LABELS = {
    Student: 'Student',
    Staff: 'Staff',
    Class: 'Class',
    Exam: 'Exam',
    ExamSchedule: 'Exam Schedule',
    Homework: 'Homework',
    CBSEReportCard: 'CBSE Report Card',
    CCEConfig: 'CCE Config',
    FeeHead: 'Fee Head',
    FeeTemplate: 'Fee Template',
    FeeRefund: 'Fee Refund',
    FeeRule: 'Fee Rule',
    Announcement: 'Announcement',
    Admission: 'Admission',
    CallLog: 'Call Log',
    Feedback: 'Feedback',
    Appointment: 'Appointment',
    GatePass: 'Gate Pass',
    Visitor: 'Visitor',
    Asset: 'Asset',
    AssetCategory: 'Asset Category',
    Vendor: 'Vendor',
    MaintenanceLog: 'Maintenance Log',
    ProcurementRequest: 'Procurement',
    AssetAudit: 'Asset Audit',
    Hostel: 'Hostel',
    HostelRoom: 'Hostel Room',
    TransportRoute: 'Transport Route',
    Vehicle: 'Vehicle',
    Book: 'Book',
    IntakeForm: 'Intake Form',
    FormAssignment: 'Form Assignment',
    FormSubmission: 'Form Submission',
    EmailCampaign: 'Email Campaign',
    Coupon: 'Coupon',
    Changelog: 'Changelog',
    BulkCleanup: 'Bulk Cleanup',
  };

  // Grouped type options for the filter dropdown
  const TYPE_GROUPS = [
    { label: 'Core', types: ['Student', 'Staff', 'Class'] },
    { label: 'Academic', types: ['Exam', 'ExamSchedule', 'Homework', 'CBSEReportCard', 'CCEConfig'] },
    { label: 'Financial', types: ['FeeHead', 'FeeTemplate', 'FeeRefund', 'FeeRule'] },
    { label: 'Operations', types: ['Announcement', 'GatePass', 'Visitor'] },
    { label: 'Front Desk', types: ['Admission', 'CallLog', 'Feedback', 'Appointment'] },
    { label: 'Inventory', types: ['Asset', 'AssetCategory', 'Vendor', 'MaintenanceLog', 'ProcurementRequest', 'AssetAudit'] },
    { label: 'Facilities', types: ['Hostel', 'HostelRoom', 'TransportRoute', 'Vehicle', 'Book'] },
    { label: 'Forms', types: ['IntakeForm', 'FormAssignment', 'FormSubmission'] },
    { label: 'Other', types: ['EmailCampaign', 'Coupon', 'Changelog', 'BulkCleanup'] },
  ];

  // Get type icon/color mapping
  const getTypeColor = (type) => {
    const colors = {
      Student: "primary",
      Staff: "secondary",
      Class: "success",
      Exam: "warning",
      ExamSchedule: "warning",
      Homework: "warning",
      CBSEReportCard: "warning",
      CCEConfig: "warning",
      FeeHead: "danger",
      FeeTemplate: "danger",
      FeeRefund: "danger",
      FeeRule: "danger",
      Announcement: "primary",
      Admission: "secondary",
      CallLog: "secondary",
      Feedback: "secondary",
      Appointment: "secondary",
      GatePass: "secondary",
      Visitor: "secondary",
      Asset: "success",
      AssetCategory: "success",
      Vendor: "success",
      MaintenanceLog: "success",
      ProcurementRequest: "success",
      AssetAudit: "success",
      Hostel: "default",
      HostelRoom: "default",
      TransportRoute: "default",
      Vehicle: "default",
      Book: "default",
      IntakeForm: "primary",
      FormAssignment: "primary",
      FormSubmission: "primary",
      EmailCampaign: "warning",
      Coupon: "danger",
      Changelog: "default",
      BulkCleanup: "default",
    };
    return colors[type] || "default";
  };

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
  }, [pendingAction, selectedItems, loadTrashData, onClose]); // eslint-disable-line react-hooks/exhaustive-deps

  const topTypeStats = useMemo(() => {
    return Object.entries(stats.byType)
      .sort(([, a], [, b]) => (b.count || 0) - (a.count || 0))
      .slice(0, 2);
  }, [stats.byType]);

  const tableClassNames = useMemo(() => ({
    base: "overflow-visible",
    th: "bg-surface-2 text-fg-muted font-medium text-xs uppercase tracking-wider h-12 border-b border-border-token",
    td: "py-4 border-b border-divider transition-colors",
    tbody: "[&>tr:last-child>td]:border-none [&>tr[data-selected=true]>td]:bg-[var(--accent-bg)]",
    tr: "transition-colors hover:bg-surface-2 data-[selected=true]:bg-[var(--accent-bg)] dark:data-[selected=true]:bg-[var(--accent-bg)]",
  }), []);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString(getDateLocale(), {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <TablePageSkeleton />
    );
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
          onPress={loadTrashData}
          isLoading={loading}
          className="transition-all duration-200"
        >
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Items */}
        <Card className="shadow-sm border border-border-token rounded-lg">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-surface-2 rounded-lg">
                <Trash2 size={20} className="text-fg-muted" />
              </div>
              <div>
                <p className="text-xs text-fg-muted uppercase tracking-wider font-medium">
                  Total Items
                </p>
                <p className="text-2xl font-semibold text-fg">
                  {stats.total}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Expiring Soon */}
        <Card className="shadow-sm border border-[var(--danger-border)] rounded-lg bg-[var(--danger-bg)]">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[var(--danger-bg)] rounded-lg">
                <AlertTriangle size={20} className="text-[var(--danger)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--danger)] uppercase tracking-wider font-medium">
                  Expiring Soon
                </p>
                <p className="text-2xl font-semibold text-[var(--danger)]">
                  {stats.expiringSoon}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Dynamic type breakdown — show top types with counts */}
        {topTypeStats.map(([typeName, typeStats]) => (
            <Card key={typeName} className="shadow-sm border border-border-token rounded-lg">
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-surface-2 rounded-lg">
                    <Chip size="sm" variant="flat" color={getTypeColor(typeName)} className="min-w-0">
                      {(TYPE_LABELS[typeName] || typeName).charAt(0)}
                    </Chip>
                  </div>
                  <div>
                    <p className="text-xs text-fg-muted uppercase tracking-wider font-medium">
                      {TYPE_LABELS[typeName] || typeName}
                    </p>
                    <p className="text-2xl font-semibold text-fg">
                      {typeStats.count || 0}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
      </div>

      {/* Filters Card */}
      <Card className="shadow-sm border border-border-token rounded-lg">
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <Input
              size="sm"
              placeholder={t('pages.searchByNameOrDeletedBy')}
              startContent={<Search size={16} className="text-fg-faint" />}
              value={searchTerm}
              onValueChange={setSearchTerm}
              variant="bordered"
              classNames={{
                base: "flex-1",
                inputWrapper: "bg-surface",
              }}
            />

            {/* Type Filter */}
            <Select
              size="sm"
              placeholder={t('pages.filterByType')}
              selectedKeys={[typeFilter]}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              variant="bordered"
              className="max-w-xs"
              classNames={{
                trigger: "bg-surface",
              }}
            >
              <SelectItem key="all" value="all">
                All Types
              </SelectItem>
              {TYPE_GROUPS.flatMap((group) =>
                group.types.map((type) => (
                  <SelectItem key={type} value={type} textValue={TYPE_LABELS[type] || type}>
                    <span className="text-xs text-fg-faint mr-1">{group.label}:</span>
                    {TYPE_LABELS[type] || type}
                  </SelectItem>
                ))
              )}
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Bulk Actions Toolbar */}
      {selectedItems.size > 0 && (
        <Card className="shadow-sm border border-[var(--accent-border)] rounded-lg bg-[var(--accent-bg)]">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--accent-bg)] rounded-lg">
                  <Trash2 size={18} className="text-[var(--accent)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--accent)]">
                    {selectedItems.size} item(s) selected
                  </p>
                  <p className="text-xs text-[var(--accent)]">
                    Choose an action below
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  color="primary"
                  size="sm"
                  variant="flat"
                  startContent={<RotateCcw size={16} />}
                  onPress={() => handleBulkAction("restore")}
                  isLoading={actionInProgress}
                  className="transition-all duration-200"
                >
                  Restore Selected
                </Button>
                <Button
                  color="danger"
                  size="sm"
                  variant="flat"
                  startContent={<Trash2 size={16} />}
                  onPress={() => handleBulkAction("delete")}
                  isLoading={actionInProgress}
                  className="transition-all duration-200"
                >
                  Delete Permanently
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Main Table */}
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

      {/* Bulk Action Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalContent>
          <ModalHeader>
            {pendingAction === "restore"
              ? "Restore Selected Items"
              : "Permanently Delete Selected Items"}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {pendingAction === "restore" ? (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-[var(--accent-bg)] rounded-lg mt-0.5">
                    <RotateCcw size={20} className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <p className="font-medium text-fg">
                      Restore {selectedItems.size} item(s)
                    </p>
                    <p className="text-sm text-fg-muted mt-1">
                      These items will be restored to their original location
                      and will no longer appear in trash.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-[var(--danger-bg)] rounded-lg mt-0.5">
                    <AlertTriangle size={20} className="text-[var(--danger)]" />
                  </div>
                  <div>
                    <p className="font-medium text-fg">
                      Permanently delete {selectedItems.size} item(s)
                    </p>
                    <p className="text-sm text-fg-muted mt-1">
                      <strong className="text-[var(--danger)]">
                        This action cannot be undone.
                      </strong>{" "}
                      These items will be permanently removed from the system.
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-surface-2 rounded-lg p-3">
                <p className="text-xs text-fg-muted font-medium mb-2">
                  Selected items:
                </p>
                <div className="space-y-1">
                  {Array.from(selectedItems)
                    .slice(0, 5)
                    .map((id) => {
                      const item = trashItems.find((i) => (i._id || i.id) === id);
                      const itemName = item?.itemName || item?.name || 'Unknown';
                      return item ? (
                        <p
                          key={id}
                          className="text-xs text-fg"
                        >
                          • {itemName}
                        </p>
                      ) : null;
                    })}
                  {selectedItems.size > 5 && (
                    <p className="text-xs text-fg-muted italic">
                      ... and {selectedItems.size - 5} more
                    </p>
                  )}
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={onClose}
              className="transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              color={pendingAction === "restore" ? "primary" : "danger"}
              onPress={confirmBulkAction}
              isLoading={actionInProgress}
              className="transition-all duration-200"
            >
              {pendingAction === "restore" ? "Restore" : "Delete Permanently"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </div>
  );
}
