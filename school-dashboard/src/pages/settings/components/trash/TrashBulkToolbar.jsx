import { Card, CardBody, Button } from "@heroui/react";
import { Trash2, RotateCcw } from "lucide-react";

/** Appears when rows are selected: bulk restore / permanent-delete actions. */
export default function TrashBulkToolbar({ selectedCount, actionInProgress, handleBulkAction }) {
  if (selectedCount === 0) return null;
  return (
    <Card className="shadow-sm border border-[var(--accent-border)] rounded-lg bg-[var(--accent-bg)]">
      <CardBody className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--accent-bg)] rounded-lg">
              <Trash2 size={18} className="text-[var(--accent)]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--accent)]">
                {selectedCount} item(s) selected
              </p>
              <p className="text-xs text-[var(--accent)]">
                Choose an action below
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              color="primary"
              size="sm"
              variant="flat"
              startContent={<RotateCcw size={16} />}
              onPress={() => handleBulkAction("restore")}
              isLoading={actionInProgress}
              className="transition-all duration-200"
            >
              Restore Selected
            </Button>
            <Button
              color="danger"
              size="sm"
              variant="flat"
              startContent={<Trash2 size={16} />}
              onPress={() => handleBulkAction("delete")}
              isLoading={actionInProgress}
              className="transition-all duration-200"
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
