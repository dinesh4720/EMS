import {
    Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection,
} from "@heroui/react";
import { ChevronDown, Users, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Bulk-actions dropdown shown when one or more staff rows are selected.
 *
 * @param {number}   selectedCount           - Number of selected staff
 * @param {Array}    roles                   - Array of role strings
 * @param {boolean}  isOpen                  - Controlled open state
 * @param {Function} onOpenChange            - (isOpen: boolean) => void
 * @param {Function} onBulkStatusChange      - (status: string) => void
 * @param {Function} onBulkRoleChange        - (role: string) => void
 * @param {Function} onBulkDelete            - () => void
 */
export default function StaffBulkActionsDropdown({
    selectedCount,
    roles,
    isOpen,
    onOpenChange,
    onBulkStatusChange,
    onBulkRoleChange,
    onBulkDelete,
}) {
    const { t } = useTranslation();

    if (selectedCount === 0) return null;

    return (
        <div className="relative">
            <Dropdown isOpen={isOpen} onOpenChange={onOpenChange}>
                <DropdownTrigger>
                    <button className="flex items-center gap-2 px-3 py-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 text-sm cursor-pointer whitespace-nowrap text-default-900">
                        <Users size={16} className="text-default-400" />
                        <span>{t("pages.bulkActions1")}</span>
                        <span className="text-default-500">({selectedCount})</span>
                        <ChevronDown size={14} className="text-default-400" />
                    </button>
                </DropdownTrigger>
                <DropdownMenu aria-label={t("aria.menus.bulkActions")} className="max-h-[400px] overflow-y-auto relative">
                    <DropdownSection title={t("pages.changeStatus1")} showDivider>
                        <DropdownItem key="status-active" onPress={() => onBulkStatusChange("active")} startContent={<span className="w-2 h-2 rounded-full bg-success-500"></span>}>Set as Active</DropdownItem>
                        <DropdownItem key="status-inactive" onPress={() => onBulkStatusChange("inactive")} startContent={<span className="w-2 h-2 rounded-full bg-danger-500"></span>}>Set as Inactive</DropdownItem>
                        <DropdownItem key="status-on-leave" onPress={() => onBulkStatusChange("on-leave")} startContent={<span className="w-2 h-2 rounded-full bg-warning-500"></span>}>Set as On Leave</DropdownItem>
                        <DropdownItem key="status-suspended" onPress={() => onBulkStatusChange("suspended")} startContent={<span className="w-2 h-2 rounded-full bg-orange-500"></span>}>Set as Suspended</DropdownItem>
                        <DropdownItem key="status-terminated" onPress={() => onBulkStatusChange("terminated")} startContent={<span className="w-2 h-2 rounded-full bg-gray-500"></span>}>Set as Terminated</DropdownItem>
                    </DropdownSection>
                    <DropdownSection title={t("pages.changeRole")} showDivider>
                        {roles.map((role) => (
                            <DropdownItem key={`role-${role}`} onPress={() => onBulkRoleChange(role)}>
                                Set as {role}
                            </DropdownItem>
                        ))}
                    </DropdownSection>
                    <DropdownSection title={t("pages.actions1")}>
                        <DropdownItem key="delete" className="text-danger" color="danger" onPress={onBulkDelete} startContent={<Trash2 size={14} />}>
                            Delete Selected
                        </DropdownItem>
                    </DropdownSection>
                </DropdownMenu>
            </Dropdown>
        </div>
    );
}
