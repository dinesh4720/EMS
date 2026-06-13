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
    active:     "bg-ok-bg border-ok/20 text-ok",
    inactive:   "bg-danger-bg border-danger-token/20 text-danger-token",
    "on-leave": "bg-warn-bg border-warn/20 text-warn",
    suspended:  "bg-info-bg border-info/20 text-info",
    terminated: "bg-surface-2 border-border-token text-fg-muted",
};

const STATUS_MENU_ITEMS = [
    { key: "active",     label: "Active",     dot: "bg-ok" },
    { key: "inactive",   label: "Inactive",   dot: "bg-danger-token" },
    { key: "on-leave",   label: "On Leave",   dot: "bg-warn" },
    { key: "suspended",  label: "Suspended",  dot: "bg-info" },
    { key: "terminated", label: "Terminated", dot: "bg-fg-subtle" },
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
    const statusStyle = STATUS_STYLES[s.status] ?? "bg-surface-2 border-border-token text-fg-muted";
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
                            className="text-fg font-medium text-base hover:text-accent transition-colors cursor-pointer"
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
                        <div className="bg-ok h-1.5 rounded-full transition-all" style={{ width: `${attendance}%` }} />
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
                        className="text-fg-faint hover:text-accent"
                        onPress={() => onStaffEdit ? onStaffEdit(s.id) : onStaffClick(s.id)}
                    >
                        <Edit size={16} />
                    </Button>
                    <Button
                        isIconOnly size="sm" variant="light"
                        aria-label="Delete staff member"
                        className="text-fg-faint hover:text-danger-token"
                        onPress={() => onDelete(s)}
                    >
                        <Trash2 size={16} />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}
