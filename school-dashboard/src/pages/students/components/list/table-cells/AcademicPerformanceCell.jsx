import React from "react";
import { Chip, Tooltip } from "@heroui/react";
import {
    getGradeFromPercentage as getAcademicGrade,
    getGradeColor,
} from "../../../../../utils/grading";

function AcademicPerformanceCell({ student, className }) {
    const grade = getAcademicGrade(student.latestResultPercentage);
    const gradeTooltip = grade
        ? `Performance: ${grade}${student.latestResultPercentage != null ? ` (${student.latestResultPercentage}%)` : ""}`
        : null;

    return (
        <td className={className}>
            {grade ? (
                <Tooltip content={gradeTooltip}>
                    <Chip
                        size="sm"
                        variant="flat"
                        color={getGradeColor(grade)}
                        className="font-semibold"
                    >
                        {grade}
                    </Chip>
                </Tooltip>
            ) : (
                <span className="text-xs text-default-400">No data</span>
            )}
        </td>
    );
}

export default React.memo(AcademicPerformanceCell);
