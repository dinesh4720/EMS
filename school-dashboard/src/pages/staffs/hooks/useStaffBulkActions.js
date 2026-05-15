import { useState } from "react";
import toast from "react-hot-toast";
import { getStoredUser } from "../../../utils/authSession";

/**
 * Custom hook encapsulating all bulk-action and single-delete logic for StaffList.
 *
 * @param {Set|string}  selectedStaff     - HeroUI selection state (Set of ids or "all")
 * @param {Function}    setSelectedStaff  - Setter for selectedStaff
 * @param {Array}       filteredItems     - Current filtered+sorted staff array
 * @param {Array}       staff             - Full staff array (for name lookups)
 * @param {Function}    updateStaff       - (staffId, payload) => Promise
 * @param {Function}    deleteStaff       - (staffId) => Promise
 */
export function useStaffBulkActions({
    selectedStaff,
    setSelectedStaff,
    filteredItems,
    staff,
    updateStaff,
    deleteStaff,
}) {
    const [deleteConfirm, setDeleteConfirm] = useState({
        isOpen: false,
        staffIds: [],
        staffNames: [],
        isDeleting: false,
    });

    const [bulkConfirm, setBulkConfirm] = useState({
        isOpen: false,
        type: "",
        value: "",
        ids: [],
        names: [],
        isProcessing: false,
        selfAdminWarning: false,
    });

    const getSelectedIds = () => {
        if (selectedStaff === "all") {
            return filteredItems.map((s) => s.id);
        }
        return Array.from(selectedStaff);
    };

    const selectedCount = selectedStaff === "all" ? filteredItems.length : selectedStaff.size;

    // ── Bulk status change ──────────────────────────────────────────────────
    const handleBulkStatusChange = (newStatus) => {
        if (selectedCount === 0) return;
        const ids = getSelectedIds();
        const names = ids.map((id) => {
            const s = staff.find((st) => st.id === id);
            return s?.name || id;
        });
        setBulkConfirm({ isOpen: true, type: "status", value: newStatus, ids, names, isProcessing: false, selfAdminWarning: false });
    };

    // ── Bulk role change ────────────────────────────────────────────────────
    const handleBulkRoleChange = (newRole) => {
        if (selectedCount === 0) return;
        const ids = getSelectedIds();
        const names = ids.map((id) => {
            const s = staff.find((st) => st.id === id);
            return s?.name || id;
        });

        // Warn if the current user is in the selection and losing their Admin role
        const storedUser = getStoredUser();
        const currentUserStaff = storedUser?.id ? staff.find((s) => s.id === storedUser.id) : null;
        const currentUserRoles = currentUserStaff
            ? Array.isArray(currentUserStaff.role)
                ? currentUserStaff.role
                : [currentUserStaff.role].filter(Boolean)
            : [];
        const selfAdminWarning = !!(
            currentUserStaff &&
            ids.includes(currentUserStaff.id) &&
            currentUserRoles.includes("Admin") &&
            newRole !== "Admin"
        );

        setBulkConfirm({ isOpen: true, type: "role", value: newRole, ids, names, isProcessing: false, selfAdminWarning });
    };

    // ── Confirm bulk action (status or role) ────────────────────────────────
    const confirmBulkAction = async () => {
        setBulkConfirm((prev) => ({ ...prev, isProcessing: true }));
        const { type, value, ids } = bulkConfirm;
        const updatePayload =
            type === "status" ? { status: value } : { role: Array.isArray(value) ? value : [value] };

        const results = await Promise.allSettled(ids.map((staffId) => updateStaff(staffId, updatePayload)));
        const failed = results.filter((r) => r.status === "rejected").length;

        if (failed === 0) {
            toast.success(
                `${type === "status" ? "Status" : "Role"} updated to ${value} for ${ids.length} staff members`
            );
        } else {
            toast.error(`${failed} of ${ids.length} updates failed`);
        }

        setBulkConfirm({ isOpen: false, type: "", value: "", ids: [], names: [], isProcessing: false, selfAdminWarning: false });
        setSelectedStaff(new Set());
    };

    const closeBulkConfirm = () => {
        if (bulkConfirm.isProcessing) return;
        setBulkConfirm({ isOpen: false, type: "", value: "", ids: [], names: [], isProcessing: false, selfAdminWarning: false });
    };

    // ── Bulk delete ─────────────────────────────────────────────────────────
    const handleBulkDelete = () => {
        if (selectedCount === 0) return;
        const ids = getSelectedIds();
        const names = ids.map((staffId) => {
            const s = staff.find((st) => st.id === staffId);
            return s?.name || staffId;
        });
        setDeleteConfirm({ isOpen: true, staffIds: ids, staffNames: names, isDeleting: false });
    };

    // ── Single delete ───────────────────────────────────────────────────────
    const handleSingleDelete = (staffMember) => {
        setDeleteConfirm({
            isOpen: true,
            staffIds: [staffMember.id],
            staffNames: [staffMember.name],
            isDeleting: false,
        });
    };

    // ── Confirm delete ──────────────────────────────────────────────────────
    const confirmDelete = async () => {
        setDeleteConfirm((prev) => ({ ...prev, isDeleting: true }));
        const { staffIds, staffNames } = deleteConfirm;

        const results = await Promise.allSettled(staffIds.map((staffId) => deleteStaff(staffId)));
        const failed = results.filter((r) => r.status === "rejected").length;

        if (failed === 0) {
            toast.success(
                staffIds.length === 1
                    ? `${staffNames[0]} deleted successfully`
                    : `${staffIds.length} staff members deleted successfully`
            );
        } else {
            toast.error(`${failed} of ${staffIds.length} deletions failed`);
        }

        setSelectedStaff(new Set());
        setDeleteConfirm({ isOpen: false, staffIds: [], staffNames: [], isDeleting: false });
    };

    const closeDeleteConfirm = () => {
        if (deleteConfirm.isDeleting) return;
        setDeleteConfirm({ isOpen: false, staffIds: [], staffNames: [], isDeleting: false });
    };

    return {
        // state
        deleteConfirm,
        bulkConfirm,
        selectedCount,
        // handlers
        handleBulkStatusChange,
        handleBulkRoleChange,
        confirmBulkAction,
        closeBulkConfirm,
        handleBulkDelete,
        handleSingleDelete,
        confirmDelete,
        closeDeleteConfirm,
    };
}
