import { Card, CardBody, Chip } from "@heroui/react";
import { Trash2, AlertTriangle } from "lucide-react";
import { TYPE_LABELS, getTypeColor } from "../../utils/trashConstants";

/** Summary cards: total, expiring-soon, and the top two entity types by count. */
export default function TrashStatsCards({ stats, topTypeStats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Total Items */}
      <Card className="shadow-sm border border-border-token rounded-lg">
        <CardBody className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-surface-2 rounded-lg">
              <Trash2 size={20} className="text-fg-muted" />
            </div>
            <div>
              <p className="text-xs text-fg-muted uppercase tracking-wider font-medium">
                Total Items
              </p>
              <p className="text-2xl font-semibold text-fg">
                {stats.total}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Expiring Soon */}
      <Card className="shadow-sm border border-[var(--danger-border)] rounded-lg bg-[var(--danger-bg)]">
        <CardBody className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--danger-bg)] rounded-lg">
              <AlertTriangle size={20} className="text-[var(--danger)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--danger)] uppercase tracking-wider font-medium">
                Expiring Soon
              </p>
              <p className="text-2xl font-semibold text-[var(--danger)]">
                {stats.expiringSoon}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Dynamic type breakdown — show top types with counts */}
      {topTypeStats.map(([typeName, typeStats]) => (
        <Card key={typeName} className="shadow-sm border border-border-token rounded-lg">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-surface-2 rounded-lg">
                <Chip size="sm" variant="flat" color={getTypeColor(typeName)} className="min-w-0">
                  {(TYPE_LABELS[typeName] || typeName).charAt(0)}
                </Chip>
              </div>
              <div>
                <p className="text-xs text-fg-muted uppercase tracking-wider font-medium">
                  {TYPE_LABELS[typeName] || typeName}
                </p>
                <p className="text-2xl font-semibold text-fg">
                  {typeStats.count || 0}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
