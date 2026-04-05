import React from "react";

function ClassCell({ student, className }) {
    return (
        <td className={className}>
            <div className="flex items-center">
                <span className="text-sm font-medium text-default-600 bg-default-100 group-hover:bg-default-200 transition-colors px-2.5 py-1 rounded-md">
                    {student.class}
                </span>
            </div>
        </td>
    );
}

export default React.memo(ClassCell);
