import { Button } from "@heroui/react";
import { Trash2, GripVertical } from "lucide-react";
import { Reorder, useDragControls } from "framer-motion";
import { useTranslation } from "react-i18next";

const DraggableFieldItem = ({
  field,
  index,
  isSelected,
  onSelect,
  onMove,
  onDelete,
  renderPreview,
  isFirst,
  isLast,
}) => {
  const { t } = useTranslation();
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={field}
      dragListener={false}
      dragControls={controls}
      className={`relative mb-3 ${field.width === "half"
        ? "w-[calc(50%-0.5rem)] inline-block align-top mr-2"
        : "w-full block"
        }`}
    >
      <div
        className={`p-4 rounded-xl transition-all duration-200 group relative border-2 ${isSelected
          ? "border-primary bg-surface shadow-lg shadow-primary/5 z-10"
          : "border-transparent hover:border-border-token hover:bg-surface bg-transparent"
          }`}
        onClick={onSelect}
      >
        <div className="flex items-center justify-between mb-4 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-3 right-4 bg-surface shadow-sm border border-divider rounded-full px-2 py-1 z-20">
          <div className="flex items-center gap-1">
            <div
              className="cursor-move p-1 text-fg-faint hover:text-fg transition-colors"
              onPointerDown={(e) => controls.start(e)}
            >
              <GripVertical size={14} />
            </div>
            <div className="h-4 w-px bg-surface-2 mx-1"></div>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              aria-label="Move field up"
              className="h-6 w-6 min-w-0"
              onPress={() => onMove("up")}
              isDisabled={isFirst}
            >
              ↑
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              aria-label="Move field down"
              className="h-6 w-6 min-w-0"
              onPress={() => onMove("down")}
              isDisabled={isLast}
            >
              ↓
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="danger"
              aria-label="Delete field"
              className="h-6 w-6 min-w-0"
              onPress={onDelete}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>

        {/* Field Content - rendered to look exactly like the final form */}
        <div className={isSelected ? "" : "pointer-events-none"}>
          {renderPreview(field)}
        </div>
      </div>
    </Reorder.Item>
  );
};

export default DraggableFieldItem;
