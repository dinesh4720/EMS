import React from "react";
import { Progress } from "../../../../components/ui";
import { useTranslation } from "react-i18next";
import { getAttendanceColor as getAttendanceColorUtil } from "../../../../../utils/grading";

const getAttendanceColor = getAttendanceColorUtil;

function AttendanceCell({ attendance, className }) {
    const { t } = useTranslation();
    const isInvalid = attendance === null || attendance === undefined || isNaN(attendance);

    const textColor = (() => {
        if (isInvalid) return "text-fg-faint";
        const c = getAttendanceColor(attendance);
        if (c === "success") return "text-ok";
        if (c === "warning") return "text-warn";
        if (c === "danger") return "text-danger";
        return "text-fg";
    })();

    return (
        <td className={className}>
            <div className="flex flex-col gap-1">
                <span className={`text-xs font-semibold ${textColor}`}>
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
