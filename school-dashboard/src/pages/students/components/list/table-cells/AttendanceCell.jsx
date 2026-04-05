import React from "react";
import { Progress } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { getAttendanceColor as getAttendanceColorUtil } from "../../../../../utils/grading";

const getAttendanceColor = getAttendanceColorUtil;

function AttendanceCell({ attendance, className }) {
    const { t } = useTranslation();
    const isInvalid = attendance === null || attendance === undefined || isNaN(attendance);

    return (
        <td className={className}>
            <div className="flex flex-col gap-1">
                <span
                    className={`text-xs font-semibold ${
                        isInvalid
                            ? "text-default-400"
                            : getAttendanceColor(attendance) === "success"
                              ? "text-success"
                              : getAttendanceColor(attendance) === "warning"
                                ? "text-warning"
                                : "text-danger"
                    }`}
                >
                    {isInvalid ? "No data" : `${attendance}%`}
                </span>
                {!isInvalid && (
                    <Progress
                        aria-label={t("aria.misc.studentAttendanceProgress")}
                        size="sm"
                        value={attendance}
                        color={getAttendanceColor(attendance)}
                        className="max-w-[60px]"
                    />
                )}
            </div>
        </td>
    );
}

export default React.memo(AttendanceCell);
