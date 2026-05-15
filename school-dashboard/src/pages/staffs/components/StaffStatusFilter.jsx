import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { ChevronDown, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

const STATUS_DOT_COLORS = {
    active: "bg-success-500",
    inactive: "bg-danger-500",
    "on-leave": "bg-warning-500",
    suspended: "bg-orange-500",
    terminated: "bg-gray-500",
};

const STATUS_ITEMS = [
    { key: "all",        label: "All Status",  dot: null },
    { key: "active",     label: "Active",      dot: "bg-success-500" },
    { key: "inactive",   label: "Inactive",    dot: "bg-danger-500" },
    { key: "on-leave",   label: "On Leave",    dot: "bg-warning-500" },
    { key: "suspended",  label: "Suspended",   dot: "bg-orange-500" },
    { key: "terminated", label: "Terminated",  dot: "bg-gray-500" },
];

/**
 * Toolbar status-filter dropdown for the staff list.
 *
 * @param {string}   statusFilter   - Currently active status key
 * @param {Function} onStatusChange - (newStatus: string) => void
 * @param {Object}   statusCounts   - { all, active, inactive, "on-leave", suspended, terminated }
 * @param {boolean}  isOpen         - Controlled open state
 * @param {Function} onOpenChange   - (isOpen: boolean) => void
 */
export default function StaffStatusFilter({
    statusFilter,
    onStatusChange,
    statusCounts,
    isOpen,
    onOpenChange,
}) {
    const { t } = useTranslation();

    const dotColor = STATUS_DOT_COLORS[statusFilter] ?? "bg-default-400";

    return (
        <Dropdown placement="bottom-start" isOpen={isOpen} onOpenChange={onOpenChange}>
            <DropdownTrigger>
                <button className="flex items-center gap-2 px-3 py-2.5 bg-surface rounded-lg border border-border-token hover:border-teal-500 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition-all duration-200 text-sm cursor-pointer whitespace-nowrap capitalize">
                    <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                    <span className="text-fg">{statusFilter}</span>
                    <span className="text-fg-muted">{statusCounts[statusFilter]}</span>
                    <ChevronDown size={14} className="text-fg-faint" />
                </button>
            </DropdownTrigger>

            <DropdownMenu
                aria-label={t("aria.menus.filterByStatus")}
                className="max-h-[400px] overflow-y-auto"
                onAction={(key) => {
                    onStatusChange(key);
                    onOpenChange(false);
                    toast.info(`Filter applied: ${key === "all" ? "All status" : key}`);
                }}
            >
                {STATUS_ITEMS.map(({ key, label, dot }) => (
                    <DropdownItem
                        key={key}
                        startContent={
                            statusFilter === key ? (
                                <Check size={14} className="text-primary" />
                            ) : (
                                <span className="w-3.5"></span>
                            )
                        }
                        endContent={
                            <span className="text-default-400 text-xs">{statusCounts[key]}</span>
                        }
                        className={key !== "all" ? "capitalize" : ""}
                    >
                        {dot ? (
                            <span className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${dot}`}></span>
                                {label}
                            </span>
                        ) : (
                            label
                        )}
                    </DropdownItem>
                ))}
            </DropdownMenu>
        </Dropdown>
    );
}
