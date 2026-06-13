import React from "react";
import { Chip, Tooltip } from "../../../../components/ui";
import {
    getGradeFromPercentage as getAcademicGrade,
    getGradeColor,
} from "../../../../../utils/grading";

function AcademicPerformanceCell({ student, className }) {
    const grade = getAcademicGrade(student.latestResultPercentage);
    const gradeTooltip = grade
        ? `Performance: ${grade}${student.latestResultPercentage != null ? ` (${student.latestResultPercentage}%)` : ""}`
        : null;

    const chipColor = (() => {
        const c = getGradeColor(grade);
        if (c === 'default') return 'neutral';
        return c;
    })();

    return (
        <td className={className}>
            {grade ? (
                <Tooltip content={gradeTooltip}>
                    <Chip
                        size="sm"
                        color={chipColor}
                        className="font-semibold"
                    >
                        {grade}
                    </Chip>
                </Tooltip>
            ) : (
                <span className="text-xs text-fg-faint">No data</span>
            )}
        </td>
    );
}

export default React.memo(AcademicPerformanceCell);
