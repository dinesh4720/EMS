import React from "react";
import { Button } from "@heroui/react";
import { useTranslation } from "react-i18next";

function isValidPhone(phone) {
    if (!phone) return false;
    const str = phone.toString();
    // Reject ObjectIDs, hashes, tokens (hex strings longer than 15 chars with no spaces)
    if (/^[a-f0-9.]{20,}$/i.test(str)) return false;
    // Must contain mostly digits
    const digits = str.replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 15;
}

function formatPhoneNumber(phone) {
    if (!phone) return "N/A";
    const cleaned = phone.toString().replace(/\D/g, "");
    if (cleaned.length === 10) {
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    return phone;
}

function ParentInfoCell({
    student,
    className,
    editingPhoneId,
    phoneInput,
    setPhoneInput,
    setEditingPhoneId,
    handleSavePhone,
}) {
    const { t } = useTranslation();

    return (
        <td className={className}>
            <div
                className="flex flex-col gap-1 select-text cursor-text max-w-[200px]"
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                <span className="text-default-900 text-sm font-medium truncate">
                    {student.parentName || "Parent"}
                </span>
                {editingPhoneId === student.id ? (
                    <div className="flex items-center gap-1">
                        <input
                            type="text"
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleSavePhone(student.id);
                                } else if (e.key === "Escape") {
                                    e.preventDefault();
                                    setEditingPhoneId(null);
                                    setPhoneInput("");
                                }
                            }}
                            placeholder={t("pages.enterPhone")}
                            className="text-xs px-2 py-1 border border-border-token rounded w-28 focus:outline-none focus:border-primary"
                            onClick={(e) => e.stopPropagation()}
                            aria-label={t("pages.enterPhone")}
                            autoFocus
                        />
                        <Button
                            size="sm"
                            color="primary"
                            className="h-6 min-w-12 text-xs"
                            onPress={() => handleSavePhone(student.id)}
                        >
                            Save
                        </Button>
                        <Button
                            size="sm"
                            variant="light"
                            className="h-6 min-w-12 text-xs"
                            onPress={() => {
                                setEditingPhoneId(null);
                                setPhoneInput("");
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                ) : student.parentPhone && isValidPhone(student.parentPhone) ? (
                    <span className="text-fg-muted text-sm">
                        {formatPhoneNumber(student.parentPhone)}
                    </span>
                ) : (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setEditingPhoneId(student.id);
                            setPhoneInput("");
                        }}
                        className="text-primary text-xs hover:underline text-left"
                    >
                        + Add phone number
                    </button>
                )}
            </div>
        </td>
    );
}

export default React.memo(ParentInfoCell);
