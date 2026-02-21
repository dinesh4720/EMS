import { useState, useEffect, useMemo } from "react";
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
  Spinner,
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

// Trash API - Add this to api.js when integrating
export const trashApi = {
  getAll: async (page = 1, limit = 50) => {
    const response = await request(`/trash?page=${page}&limit=${limit}`);
    // Backend returns { success: true, data: trashItems, total, pagination }
    return {
      items: response.data || [],
      total: response.total || 0,
      pagination: response.pagination || { page, limit, totalPages: 1, hasMore: false }
    };
  },
  getStats: async () => {
    const response = await request("/trash/stats");
    // Backend returns { success: true, byType, totalExpiring }
    return response.byType || response;
  },
  restore: (id) => request(`/trash/${id}/restore`, { method: "POST" }),
  restoreBulk: (ids) => request("/trash/restore-bulk", {
    method: "POST",
    body: JSON.stringify({ ids })
  }),
  permanentDelete: (id) => request(`/trash/${id}/permanent`, { method: "DELETE" }),
  permanentDeleteBulk: (ids) => request("/trash/permanent-bulk", {
    method: "DELETE",
    body: JSON.stringify({ ids })
  }),
};

// Import request function
import { request } from "../../services/api";

export default function TrashSettings() {
  // State management
  const [trashItems, setTrashItems] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    expiringSoon: 0,
    students: 0,
    staff: 0,
    classes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [actionInProgress, setActionInProgress] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'restore' or 'delete'
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();

  // Load trash data on mount and when page changes
  useEffect(() => {
    loadTrashData();
  }, [page]);

  // Load trash items and statistics
  const loadTrashData = async () => {
    try {
      setLoading(true);
      const [itemsData, statsData] = await Promise.all([
        trashApi.getAll(page, limit),
        trashApi.getStats(),
      ]);

      // Handle paginated response
      setTrashItems(itemsData.items || []);
      setTotalPages(itemsData.pagination?.totalPages || 1);
      setHasMore(itemsData.pagination?.hasMore || false);
      
      // Transform backend stats format to frontend format
      // Backend returns: { Student: { count, expiringSoon }, Staff: {...} }
      // Frontend expects: { total, expiringSoon, students, staff, classes }
      const transformedStats = statsData ? {
        total: itemsData.total || Object.values(statsData).reduce((sum, type) => sum + (type.count || 0), 0),
        expiringSoon: statsData.totalExpiring || Object.values(statsData).reduce((sum, type) => sum + (type.expiringSoon || 0), 0),
        students: statsData.Student?.count || 0,
        staff: statsData.Staff?.count || 0,
        classes: statsData.Class?.count || 0,
      } : {
        total: 0,
        expiringSoon: 0,
        students: 0,
        staff: 0,
        classes: 0,
      };
      setStats(transformedStats);
    } catch (error) {
      console.error("Failed to load trash data:", error);
      toast.error("Failed to load trash data");
    } finally {
      setLoading(false);
    }
  };

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

  // Get type icon/color mapping
  const getTypeColor = (type) => {
    const colors = {
      Student: "primary",
      Staff: "secondary",
      Class: "success",
    };
    return colors[type] || "default";
  };

  // Filter trash items based on search and type filter
  const filteredItems = useMemo(() => {
    // Safety check: ensure trashItems is an array
    if (!Array.isArray(trashItems)) {
      console.warn('⚠️ trashItems is not an array:', trashItems);
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
  const handleRestore = async (id) => {
    try {
      setActionInProgress(true);
      await trashApi.restore(id);
      toast.success("Item restored successfully");
      await loadTrashData();
      setSelectedItems(new Set());
    } catch (error) {
      console.error("Failed to restore item:", error);
      toast.error(error.message || "Failed to restore item");
    } finally {
      setActionInProgress(false);
    }
  };

  // Handle permanent delete of single item
  const handlePermanentDelete = async (id) => {
    if (!confirm("Are you sure you want to permanently delete this item? This action cannot be undone.")) {
      return;
    }

    try {
      setActionInProgress(true);
      await trashApi.permanentDelete(id);
      toast.success("Item permanently deleted");
      await loadTrashData();
      setSelectedItems(new Set());
    } catch (error) {
      console.error("Failed to permanently delete item:", error);
      toast.error(error.message || "Failed to delete item");
    } finally {
      setActionInProgress(false);
    }
  };

  // Handle bulk action (restore or delete)
  const handleBulkAction = (action) => {
    if (selectedItems.size === 0) return;

    setPendingAction(action);
    onOpen();
  };

  // Confirm and execute bulk action
  const confirmBulkAction = async () => {
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
      console.error("Failed to execute bulk action:", error);
      toast.error(error.message || "Failed to complete action");
    } finally {
      setActionInProgress(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-default-200 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-default-900">Trash Management</h2>
          <p className="text-sm text-default-500 mt-1">
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
        <Card className="shadow-sm border border-default-200 rounded-lg">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-default-100 rounded-lg">
                <Trash2 size={20} className="text-default-600" />
              </div>
              <div>
                <p className="text-xs text-default-500 uppercase tracking-wider font-medium">
                  Total Items
                </p>
                <p className="text-2xl font-semibold text-default-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Expiring Soon */}
        <Card className="shadow-sm border border-danger-200 rounded-lg bg-danger-50/50">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-danger-100 rounded-lg">
                <AlertTriangle size={20} className="text-danger-600" />
              </div>
              <div>
                <p className="text-xs text-danger-700 uppercase tracking-wider font-medium">
                  Expiring Soon
                </p>
                <p className="text-2xl font-semibold text-danger-700">
                  {stats.expiringSoon}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Students */}
        <Card className="shadow-sm border border-primary-200 rounded-lg bg-primary-50/50">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-100 rounded-lg">
                <span className="text-lg font-semibold text-primary-700">S</span>
              </div>
              <div>
                <p className="text-xs text-primary-700 uppercase tracking-wider font-medium">
                  Students
                </p>
                <p className="text-2xl font-semibold text-primary-700">
                  {stats.students}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Staff */}
        <Card className="shadow-sm border border-secondary-200 rounded-lg bg-secondary-50/50">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-secondary-100 rounded-lg">
                <span className="text-lg font-semibold text-secondary-700">T</span>
              </div>
              <div>
                <p className="text-xs text-secondary-700 uppercase tracking-wider font-medium">
                  Staff
                </p>
                <p className="text-2xl font-semibold text-secondary-700">
                  {stats.staff}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters Card */}
      <Card className="shadow-sm border border-default-200 rounded-lg">
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <Input
              size="sm"
              placeholder="Search by name or deleted by..."
              startContent={<Search size={16} className="text-default-400" />}
              value={searchTerm}
              onValueChange={setSearchTerm}
              variant="bordered"
              classNames={{
                base: "flex-1",
                inputWrapper: "bg-white",
              }}
            />

            {/* Type Filter */}
            <Select
              size="sm"
              placeholder="Filter by type"
              selectedKeys={[typeFilter]}
              onChange={(e) => setTypeFilter(e.target.value)}
              variant="bordered"
              className="max-w-xs"
              classNames={{
                trigger: "bg-white",
              }}
            >
              <SelectItem key="all" value="all">
                All Types
              </SelectItem>
              <SelectItem key="Student" value="Student">
                Students
              </SelectItem>
              <SelectItem key="Staff" value="Staff">
                Staff
              </SelectItem>
              <SelectItem key="Class" value="Class">
                Classes
              </SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Bulk Actions Toolbar */}
      {selectedItems.size > 0 && (
        <Card className="shadow-sm border border-primary-200 rounded-lg bg-primary-50/50">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Trash2 size={18} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary-900">
                    {selectedItems.size} item(s) selected
                  </p>
                  <p className="text-xs text-primary-700">
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
      <Card className="shadow-sm border border-default-200 rounded-lg">
        <CardBody className="p-0">
          <Table
            aria-label="Trash items table"
            selectionMode="multiple"
            selectedKeys={selectedItems}
            onSelectionChange={setSelectedItems}
            removeWrapper
            classNames={{
              base: "overflow-visible",
              th: "bg-default-50 text-default-500 font-medium text-xs uppercase tracking-wider h-12 border-b border-default-200",
              td: "py-4 border-b border-default-100",
              tbody: "[&>tr:last-child>td]:border-none",
            }}
          >
            <TableHeader>
              <TableColumn>NAME</TableColumn>
              <TableColumn>TYPE</TableColumn>
              <TableColumn>DELETED BY</TableColumn>
              <TableColumn>DELETED AT</TableColumn>
              <TableColumn>EXPIRES IN</TableColumn>
              <TableColumn align="end">ACTIONS</TableColumn>
            </TableHeader>
            <TableBody
              items={filteredItems}
              emptyContent={loading ? "Loading..." : "No items in trash"}
              loadingContent={<Spinner size="lg" color="primary" />}
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
                        <p className="font-medium text-default-900">
                          {itemName}
                        </p>
                        {item.description && (
                          <p className="text-xs text-default-500 mt-0.5">
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
                        {itemType}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-default-700">
                        {deletedByName}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-default-600">
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
                          title="Restore item"
                          className="transition-all duration-200"
                        >
                          <RotateCcw size={16} />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => handlePermanentDelete(itemId)}
                          isLoading={actionInProgress}
                          title="Delete permanently"
                          className="transition-all duration-200"
                        >
                          <Trash2 size={16} />
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
            <div className="flex items-center justify-between px-4 py-3 border-t border-default-200">
              <div className="text-sm text-default-500">
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
                  <div className="p-2 bg-primary-100 rounded-lg mt-0.5">
                    <RotateCcw size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-default-900">
                      Restore {selectedItems.size} item(s)
                    </p>
                    <p className="text-sm text-default-600 mt-1">
                      These items will be restored to their original location
                      and will no longer appear in trash.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-danger-100 rounded-lg mt-0.5">
                    <AlertTriangle size={20} className="text-danger-600" />
                  </div>
                  <div>
                    <p className="font-medium text-default-900">
                      Permanently delete {selectedItems.size} item(s)
                    </p>
                    <p className="text-sm text-default-600 mt-1">
                      <strong className="text-danger-600">
                        This action cannot be undone.
                      </strong>{" "}
                      These items will be permanently removed from the system.
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-default-100 rounded-lg p-3">
                <p className="text-xs text-default-600 font-medium mb-2">
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
                          className="text-xs text-default-700"
                        >
                          • {itemName}
                        </p>
                      ) : null;
                    })}
                  {selectedItems.size > 5 && (
                    <p className="text-xs text-default-500 italic">
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
    </div>
  );
}
