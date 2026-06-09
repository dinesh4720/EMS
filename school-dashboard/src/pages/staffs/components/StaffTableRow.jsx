import {
    TableRow, TableCell,
    Button,
    Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
} from "@heroui/react";
import { Edit, Trash2, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PhotoAvatar from "../../../components/PhotoAvatar";

const STATUS_STYLES = {
    active:     "bg-success-50 border-success-200 text-success-700",
    inactive:   "bg-danger-50 border-danger-200 text-danger-700",
    "on-leave": "bg-warning-50 border-warning-200 text-warning-700",
    suspended:  "bg-orange-50 border-orange-200 text-orange-700",
    terminated: "bg-surface-2 border-border-token text-fg-muted",
};

const STATUS_MENU_ITEMS = [
    { key: "active",     label: "Active",     dot: "bg-teal-500" },
    { key: "inactive",   label: "Inactive",   dot: "bg-red-500" },
    { key: "on-leave",   label: "On Leave",   dot: "bg-warning-500" },
    { key: "suspended",  label: "Suspended",  dot: "bg-orange-500" },
    { key: "terminated", label: "Terminated", dot: "bg-gray-500" },
];

/**
 * A single row in the staff list table.
 *
 * @param {Object}   s                    - Staff document
 * @param {Function} onStaffClick         - (staffId) => void — row-level navigation
 * @param {Function} onStaffEdit          - (staffId) => void — edit button
 * @param {Function} onStatusChange       - (staffId, newStatus) => void
 * @param {Function} onDelete             - (staffMember) => void
 * @param {Function} getAttendancePercentage - (staffId) => number
 */
export default function StaffTableRow({
    s,
    onStaffClick,
    onStaffEdit,
    onStatusChange,
    onDelete,
    getAttendancePercentage,
}) {
    const { t } = useTranslation();
    const statusStyle = STATUS_STYLES[s.status] ?? "bg-default-100 border-default-200 text-default-600";
    const attendance = getAttendancePercentage(s.id);

    return (
        <TableRow
            key={s.id}
            onClick={(e) => {
                if (
                    e.target.closest("button") ||
                    e.target.closest("label") ||
                    e.target.closest("input") ||
                    e.target.closest("a")
                ) return;
                const selection = window.getSelection();
                if (selection && selection.toString().length > 0) return;
                onStaffClick(s.id);
            }}
        >
            {/* Name */}
            <TableCell key="name">
                <div className="flex items-center gap-3">
                    <div onClick={(e) => e.stopPropagation()}>
                        <PhotoAvatar src={s.picture || s.photo} alt={s.name} name={s.name} size="md" type="staff" />
                    </div>
                    <div className="flex flex-col">
                        <Link
                            to={`/staffs/${s.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-fg font-medium text-base hover:text-teal-600 transition-colors cursor-pointer"
                        >
                            {s.name}
                        </Link>
                        <span className="text-fg-muted text-xs">{s.code}</span>
                    </div>
                </div>
            </TableCell>

            {/* Role */}
            <TableCell key="role">
                <div className="flex flex-wrap gap-1">
                    {Array.isArray(s.role) ? (
                        s.role.map((r) => (
                            <span key={r} className="px-2 py-1 bg-surface-2 text-fg text-xs rounded-md capitalize">
                                {r}
                            </span>
                        ))
                    ) : (
                        <span className="text-fg text-sm">{s.role}</span>
                    )}
                </div>
            </TableCell>

            {/* Contact */}
            <TableCell key="contact">
                <div className="flex flex-col gap-1">
                    <span className="text-fg text-xs">{s.phone || "N/A"}</span>
                    <span className="text-fg-muted text-xs">{s.email}</span>
                </div>
            </TableCell>

            {/* Attendance */}
            <TableCell key="attendance">
                <div className="flex items-center gap-2">
                    <div className="flex-1 bg-surface-2 rounded-full h-1.5 w-16">
                        <div className="bg-teal-500 h-1.5 rounded-full transition-all" style={{ width: `${attendance}%` }} />
                    </div>
                    <span className="text-fg text-xs font-medium min-w-[35px]">{attendance}%</span>
                </div>
            </TableCell>

            {/* Status */}
            <TableCell key="status">
                <div onClick={(e) => e.stopPropagation()}>
                    <Dropdown>
                        <DropdownTrigger>
                            <button className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer ${statusStyle}`}>
                                <span className="capitalize">{s.status}</span>
                                <ChevronDown size={12} />
                            </button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label={t("aria.misc.changeStatus")} onAction={(key) => onStatusChange(s.id, key)}>
                            {STATUS_MENU_ITEMS.map(({ key, label, dot }) => (
                                <DropdownItem key={key}>
                                    <span className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${dot}`}></span>
                                        {label}
                                    </span>
                                </DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                </div>
            </TableCell>

            {/* Actions */}
            <TableCell key="actions">
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                        isIconOnly size="sm" variant="light"
                        aria-label="Edit staff member"
                        className="text-fg-faint hover:text-teal-600"
                        onPress={() => onStaffEdit ? onStaffEdit(s.id) : onStaffClick(s.id)}
                    >
                        <Edit size={16} />
                    </Button>
                    <Button
                        isIconOnly size="sm" variant="light"
                        aria-label="Delete staff member"
                        className="text-fg-faint hover:text-red-600"
                        onPress={() => onDelete(s)}
                    >
                        <Trash2 size={16} />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}
