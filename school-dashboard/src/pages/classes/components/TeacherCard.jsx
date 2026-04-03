import { Checkbox, Badge } from "@heroui/react";
import { Check, User, Hand } from "lucide-react";
import PhotoAvatar from "../../../components/PhotoAvatar";
import { useTranslation } from 'react-i18next';

/**
 * TeacherCard - Displays teacher information with assignment status
 *
 * Props:
 * - teacher: Staff object
 * - currentAssignment: Class object | null (the class this teacher is assigned to)
 * - isAvailable: boolean (true if not assigned as class teacher)
 * - isSelected: boolean (for multi-select)
 * - onSelect: () => void
 * - onClick: () => void
 * - showCheckbox: boolean
 * - isSwapTarget: boolean (whether this teacher is the target for swap)
 * - actionHint: string (hint text to show on hover)
 */
export default function TeacherCard({
  teacher,
  currentAssignment,
  isAvailable,
  isSelected = false,
  onSelect,
  onClick,
  showCheckbox = false,
  isSwapTarget = false,
  actionHint = "Click to assign",
}) {
  return (
    <div
      className={`teacher-card group relative flex items-center gap-3 p-3 rounded-lg transition-all duration-200 cursor-pointer
        ${isAvailable
          ? 'bg-success-50/50 hover:bg-success-100 dark:hover:bg-success-900/30 border-l-4 border-success-400 hover:shadow-md hover:scale-[1.02]'
          : 'bg-warning-50/50 hover:bg-warning-100 dark:hover:bg-warning-900/30 border-l-4 border-warning-400 hover:shadow-md hover:scale-[1.02]'
        }
        ${isSwapTarget ? 'ring-2 ring-primary ring-offset-2 shadow-lg' : ''}
      `}
      onClick={() => !showCheckbox && onClick?.(teacher)}
    >
      {/* Checkbox for bulk selection */}
      {showCheckbox && (
        <div
          className="flex-shrink-0 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(teacher);
          }}
        >
          <Checkbox
            size="sm"
            isSelected={isSelected}
            onValueChange={() => onSelect?.(teacher)}
            color="primary"
          />
        </div>
      )}

      {/* Teacher Avatar */}
      <div className="flex-shrink-0">
        <PhotoAvatar
          src={teacher.picture || teacher.photoURL}
          alt={teacher.name}
          name={teacher.name}
          size="sm"
          type="staff"
        />
      </div>

      {/* Teacher Info */}
      <div className="flex-1 min-w-0">
        {/* Name */}
        <h4 className="text-sm font-semibold text-default-800 truncate">
          {teacher.name}
        </h4>

        {/* Department */}
        {teacher.department && (
          <p className="text-xs text-default-500 truncate">
            {teacher.department}
          </p>
        )}

        {/* Status Badge */}
        <div className="mt-1.5">
          {currentAssignment ? (
            <Badge
              color="warning"
              variant="flat"
              size="sm"
              className="text-xs"
            >
              Class Teacher: {currentAssignment.name}-{currentAssignment.section}
            </Badge>
          ) : (
            <Badge
              color="success"
              variant="flat"
              size="sm"
              className="text-xs"
            >
              Available
            </Badge>
          )}
        </div>
      </div>

      {/* Selection indicator for non-checkbox mode */}
      {!showCheckbox && isSelected && (
        <div className="flex-shrink-0">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <Check size={14} className="text-white" />
          </div>
        </div>
      )}

      {/* Action hint on hover - shows when not in selection mode */}
      {!showCheckbox && (
        <div className="absolute inset-0 bg-primary/90 dark:bg-primary/95 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none flex items-center justify-center">
          <div className="flex items-center gap-2 text-white">
            <Hand size={16} />
            <span className="text-sm font-medium">{actionHint}</span>
          </div>
        </div>
      )}
    </div>
  );
}
