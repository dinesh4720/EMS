import React from "react";
import {
    Button, Tooltip,
    Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection,
} from "@heroui/react";
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

    return (
        <td className={className}>
            <div className="flex items-center justify-end gap-1">
                {/* Pin / Unpin */}
                <Tooltip content={student.isPinned ? "Unpin student" : "Pin student"}>
                    <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        className={student.isPinned ? "text-primary" : "text-default-400"}
                        aria-label={student.isPinned ? "Unpin student" : "Pin student"}
                        onMouseDown={(e) => e.preventDefault()}
                        onPress={() => {
                            if (student.isPinned) {
                                handleUnpinStudent(student.id);
                            } else {
                                handlePinStudent(student.id);
                            }
                        }}
                    >
                        {student.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                    </Button>
                </Tooltip>

                {/* Edit */}
                <Tooltip content="Edit Details">
                    <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        className="text-default-400"
                        aria-label="Edit student details"
                        onMouseDown={(e) => e.preventDefault()}
                        onPress={() => {
                            setSelectedStudent(student);
                            setIsEditDrawerOpen(true);
                        }}
                    >
                        <Edit size={16} />
                    </Button>
                </Tooltip>

                {/* Per-row more-actions */}
                <Dropdown>
                    <DropdownTrigger>
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            className="text-default-400"
                            aria-label="More actions"
                            onMouseDown={(e) => e.preventDefault()}
                        >
                            <MoreVertical size={18} />
                        </Button>
                    </DropdownTrigger>
                    <DropdownMenu
                        aria-label={t("aria.menus.studentActions")}
                        className="max-h-[400px] overflow-y-auto"
                    >
                        <DropdownSection title={t("pages.statusActions")}>
                            <DropdownItem
                                key="inactive"
                                startContent={<UserX size={14} />}
                                onPress={() => {
                                    setStatusChangeData({
                                        student,
                                        newStatus: "inactive",
                                        action: "Mark as Inactive",
                                    });
                                    onStatusChangeOpen();
                                }}
                            >
                                Mark as Inactive
                            </DropdownItem>
                            <DropdownItem
                                key="alumni"
                                startContent={<GraduationCap size={14} />}
                                onPress={() => {
                                    setStatusChangeData({
                                        student,
                                        newStatus: "alumni",
                                        action: "Mark as Alumni",
                                    });
                                    onStatusChangeOpen();
                                }}
                            >
                                Mark as Alumni
                            </DropdownItem>
                        </DropdownSection>
                        <DropdownSection title={t("pages.academicActions")}>
                            <DropdownItem
                                key="promote"
                                startContent={<ArrowUpCircle size={14} />}
                                onPress={() => {
                                    setSelectedKeys(new Set([student.id.toString()]));
                                    onPromoteOpen();
                                }}
                            >
                                Promote Student
                            </DropdownItem>
                            <DropdownItem
                                key="tc"
                                startContent={<FileText size={14} />}
                                onPress={() => {
                                    setTcStudents([student]);
                                    onTcModalOpen();
                                }}
                            >
                                Generate/Issue TC
                            </DropdownItem>
                        </DropdownSection>
                        <DropdownSection title={t("pages.communication1")}>
                            <DropdownItem
                                key="message"
                                startContent={<MessageSquare size={14} />}
                                onPress={() => {
                                    setSelectedKeys(new Set([student.id.toString()]));
                                    handleBulkAction("message");
                                }}
                            >
                                Send Message to Parent
                            </DropdownItem>
                        </DropdownSection>
                        <DropdownSection title={t("pages.dangerZone")}>
                            <DropdownItem
                                key="delete"
                                className="text-danger"
                                color="danger"
                                startContent={<Trash2 size={14} />}
                                onPress={() => {
                                    setStudentToDelete(student);
                                    onDeleteOpen();
                                }}
                            >
                                Delete Student
                            </DropdownItem>
                        </DropdownSection>
                    </DropdownMenu>
                </Dropdown>
            </div>
        </td>
    );
}

export default React.memo(ActionsCell);
