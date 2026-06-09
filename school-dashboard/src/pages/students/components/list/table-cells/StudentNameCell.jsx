import React from "react";
import { Pin } from "lucide-react";
import { Link } from "react-router-dom";
import PhotoAvatar from "../../../../../components/PhotoAvatar";

function StudentNameCell({ student, className, searchQuery }) {
    return (
        <td className={className}>
            <div className="flex items-center gap-3">
                <div onClick={(e) => e.stopPropagation()}>
                    <PhotoAvatar
                        src={student.photo}
                        alt={student.name}
                        name={student.name}
                        size="md"
                        type="student"
                    />
                </div>
                <div
                    className="flex flex-col min-w-0 select-text cursor-text"
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center gap-2">
                        <Link
                            to={`/students/${student.id}`}
                            className="text-default-900 font-medium text-base hover:text-primary transition-colors cursor-pointer truncate"
                        >
                            {student.name}
                        </Link>
                        {student.isPinned && (
                            <Pin size={14} className="text-primary flex-shrink-0" />
                        )}
                    </div>
                    <span className="text-fg-muted text-xs">
                        {student.admissionId || `ADM${String(student.id).padStart(4, "0")}`}
                    </span>
                    {searchQuery &&
                        student.parentName &&
                        !student.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
                        student.parentName.toLowerCase().includes(searchQuery.toLowerCase()) && (
                            <span className="text-xs text-primary-500 truncate">
                                Parent: {student.parentName}
                            </span>
                        )}
                </div>
            </div>
        </td>
    );
}

export default React.memo(StudentNameCell);
