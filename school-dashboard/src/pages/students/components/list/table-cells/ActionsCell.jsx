import React from "react";
import {
    IconButton, Tooltip, DropdownMenu
} from "../../../../components/ui";
import {
    Edit, Trash2, Pin, PinOff,
    ArrowUpCircle, MessageSquare,
    UserX, FileText, MoreVertical,
} from "lucide-react";
import { GraduationCap } from "lucide-react";
import { useTranslation } from "react-i18next";

function ActionsCell({
    student,
    className,
    handlePinStudent,
    handleUnpinStudent,
    setSelectedStudent,
    setIsEditDrawerOpen,
    setStudentToDelete,
    onDeleteOpen,
    setStatusChangeData,
    onStatusChangeOpen,
    setSelectedKeys,
    onPromoteOpen,
    setTcStudents,
    onTcModalOpen,
    handleBulkAction,
}) {
    const { t } = useTranslation();

    const dropdownSections = [
        {
            title: t("pages.statusActions"),
            items: [
                {
                    key: "inactive",
                    label: "Mark as Inactive",
                    icon: <UserX size={14} />,
                    onClick: () => {
                        setStatusChangeData({
                            student,
                            newStatus: "inactive",
                            action: "Mark as Inactive",
                        });
                        onStatusChangeOpen();
                    },
                },
                {
                    key: "alumni",
                    label: "Mark as Alumni",
                    icon: <GraduationCap size={14} />,
                    onClick: () => {
                        setStatusChangeData({
                            student,
                            newStatus: "alumni",
                            action: "Mark as Alumni",
                        });
                        onStatusChangeOpen();
                    },
                },
            ],
        },
        {
            title: t("pages.academicActions"),
            items: [
                {
                    key: "promote",
                    label: "Promote Student",
                    icon: <ArrowUpCircle size={14} />,
                    onClick: () => {
                        setSelectedKeys(new Set([student.id.toString()]));
                        onPromoteOpen();
                    },
                },
                {
                    key: "tc",
                    label: "Generate/Issue TC",
                    icon: <FileText size={14} />,
                    onClick: () => {
                        setTcStudents([student]);
                        onTcModalOpen();
                    },
                },
            ],
        },
        {
            title: t("pages.communication1"),
            items: [
                {
                    key: "message",
                    label: "Send Message to Parent",
                    icon: <MessageSquare size={14} />,
                    onClick: () => {
                        setSelectedKeys(new Set([student.id.toString()]));
                        handleBulkAction("message");
                    },
                },
            ],
        },
        {
            title: t("pages.dangerZone"),
            items: [
                {
                    key: "delete",
                    label: "Delete Student",
                    icon: <Trash2 size={14} />,
                    isDestructive: true,
                    onClick: () => {
                        setStudentToDelete(student);
                        onDeleteOpen();
                    },
                },
            ],
        },
    ];

    return (
        <td className={className}>
            <div className="flex items-center justify-end gap-1">
                {/* Pin / Unpin */}
                <Tooltip content={student.isPinned ? "Unpin student" : "Pin student"}>
                    <IconButton
                        size="sm"
                        variant="ghost"
                        className={student.isPinned ? "text-primary" : "text-fg-faint"}
                        aria-label={student.isPinned ? "Unpin student" : "Pin student"}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                            if (student.isPinned) {
                                handleUnpinStudent(student.id);
                            } else {
                                handlePinStudent(student.id);
                            }
                        }}
                        icon={student.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                    />
                </Tooltip>

                {/* Edit */}
                <Tooltip content="Edit Details">
                    <IconButton
                        size="sm"
                        variant="ghost"
                        className="text-fg-faint"
                        aria-label="Edit student details"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                            setSelectedStudent(student);
                            setIsEditDrawerOpen(true);
                        }}
                        icon={<Edit size={16} />}
                    />
                </Tooltip>

                {/* Per-row more-actions */}
                <DropdownMenu
                    ariaLabel={t("aria.menus.studentActions")}
                    menuClassName="max-h-[400px] overflow-y-auto"
                    trigger={
                        <IconButton
                            size="sm"
                            variant="ghost"
                            className="text-fg-faint"
                            aria-label="More actions"
                            onMouseDown={(e) => e.preventDefault()}
                            icon={<MoreVertical size={18} />}
                        />
                    }
                    sections={dropdownSections}
                />
            </div>
        </td>
    );
}

export default React.memo(ActionsCell);
