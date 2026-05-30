import { useMemo } from "react";
import { Button } from "@heroui/react";
import { RotateCcw } from "lucide-react";
import FilterBar from "../../components/ui/FilterBar";
import DateRangePicker from "../../components/ui/DateRangePicker";
import Select from "../../components/ui/Select";

const ACTION_OPTIONS = [
  { value: "", label: "All actions" },
  { value: "created", label: "Created" },
  { value: "updated", label: "Updated" },
  { value: "deleted", label: "Deleted" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "login_failed", label: "Login Failed" },
  { value: "password_changed", label: "Password Changed" },
  { value: "permission_changed", label: "Permission Changed" },
  { value: "settings_changed", label: "Settings Changed" },
  { value: "role_changed", label: "Role Changed" },
];

const ENTITY_OPTIONS = [
  { value: "", label: "All entities" },
  { value: "student", label: "Student" },
  { value: "staff", label: "Staff" },
  { value: "class", label: "Class" },
  { value: "fee", label: "Fee" },
  { value: "auth", label: "Auth" },
];

export default function AuditLogFilters({ filters, onChange, onReset }) {
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.action) count += 1;
    if (filters.entity) count += 1;
    if (filters.startDate || filters.endDate) count += 1;
    return count;
  }, [filters]);

  return (
    <FilterBar
      activeFilterCount={activeFilterCount}
      onReset={onReset}
      filters={
        <>
          <div className="w-40">
            <Select
              size="sm"
              options={ACTION_OPTIONS}
              value={filters.action || ""}
              onChange={(e) => onChange({ action: e.target.value || undefined })}
              aria-label="Filter by action"
            />
          </div>
          <div className="w-40">
            <Select
              size="sm"
              options={ENTITY_OPTIONS}
              value={filters.entity || ""}
              onChange={(e) => onChange({ entity: e.target.value || undefined })}
              aria-label="Filter by entity"
            />
          </div>
          <DateRangePicker
            startDate={filters.startDate}
            endDate={filters.endDate}
            onChange={({ start, end }) =>
              onChange({ startDate: start, endDate: end })
            }
            placeholder="Date range"
            className="h-8 text-sm"
          />
        </>
      }
      actions={
        activeFilterCount > 0 && (
          <Button
            size="sm"
            variant="flat"
            onPress={onReset}
            startContent={<RotateCcw size={14} />}
          >
            Reset
          </Button>
        )
      }
    />
  );
}
