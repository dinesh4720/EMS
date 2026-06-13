import { Button } from "@heroui/react";
import { Trash2, GripVertical } from "lucide-react";
import { Reorder, useDragControls } from "framer-motion";
import { useTranslation } from "react-i18next";

const DraggableFieldItem = ({
  field,
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
      {/* Floating toolbar — sibling of the content so interactive controls are not nested inside the selectable surface */}
      <div className="flex items-center justify-between mb-4 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100 transition-opacity absolute -top-3 right-4 bg-surface shadow-sm border border-divider rounded-full px-2 py-1 z-20">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="cursor-move p-1 text-fg-faint hover:text-fg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onPointerDown={(e) => controls.start(e)}
            aria-label={t('pages.dragToReorder', { label: field.label })}
          >
            <GripVertical size={14} />
          </button>
          <div className="h-4 w-px bg-surface-2 mx-1"></div>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            aria-label={t('pages.moveFieldUp')}
            className="h-6 w-6 min-w-[44px] min-h-[44px]"
            onPress={() => onMove("up")}
            isDisabled={isFirst}
          >
            ↑
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            aria-label={t('pages.moveFieldDown')}
            className="h-6 w-6 min-w-[44px] min-h-[44px]"
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
            aria-label={t('pages.deleteField')}
            className="h-6 w-6 min-w-[44px] min-h-[44px]"
            onPress={onDelete}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {/* Selectable content surface */}
      <button
        type="button"
        className={`w-full text-left p-4 rounded-xl motion-safe:transition-all motion-safe:duration-200 group relative border-2 ${isSelected
          ? "border-primary bg-surface shadow-lg shadow-primary/5 z-10"
          : "border-transparent hover:border-border-token hover:bg-surface bg-transparent"
          }`}
        aria-pressed={isSelected}
        aria-label={t('pages.fieldItemLabel', { label: field.label, type: field.type, defaultValue: `${field.label} ${field.type} field` })}
        onClick={onSelect}
      >
        {/* Field Content - rendered to look exactly like the final form */}
        <div className={isSelected ? "" : "pointer-events-none"}>
          {renderPreview(field)}
        </div>
      </button>
    </Reorder.Item>
  );
};

export default DraggableFieldItem;
