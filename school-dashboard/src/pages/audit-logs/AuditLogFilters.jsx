import { useTranslation } from "react-i18next";
import DateRangePicker from "../../components/ui/DateRangePicker";
import Select from "../../components/ui/Select";

const ACTION_VALUES = [
  "",
  "created",
  "updated",
  "deleted",
  "login",
  "logout",
  "login_failed",
  "password_changed",
  "permission_changed",
  "settings_changed",
  "role_changed",
];

const ACTION_KEYS = {
  created: "created",
  updated: "updated",
  deleted: "deleted",
  login: "login",
  logout: "logout",
  login_failed: "loginFailed",
  password_changed: "passwordChanged",
  permission_changed: "permissionChanged",
  settings_changed: "settingsChanged",
  role_changed: "roleChanged",
};

const ENTITY_VALUES = ["", "student", "staff", "class", "fee", "auth"];

export default function AuditLogFilters({ filters, onChange }) {
  const { t } = useTranslation();

  const actionOptions = ACTION_VALUES.map((value) => ({
    value,
    label: value ? t(`auditLogs.actions.${ACTION_KEYS[value]}`, value) : t("auditLogs.allActions"),
  }));

  const entityOptions = ENTITY_VALUES.map((value) => ({
    value,
    label: value ? t(`auditLogs.entities.${value}`, value) : t("auditLogs.allEntities"),
  }));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="w-40">
        <Select
          size="sm"
          options={actionOptions}
          value={filters.action || ""}
          onChange={(e) => onChange({ action: e.target.value || undefined })}
          aria-label={t("auditLogs.filterActionAria")}
        />
      </div>
      <div className="w-40">
        <Select
          size="sm"
          options={entityOptions}
          value={filters.entity || ""}
          onChange={(e) => onChange({ entity: e.target.value || undefined })}
          aria-label={t("auditLogs.filterEntityAria")}
        />
      </div>
      <DateRangePicker
        startDate={filters.startDate}
        endDate={filters.endDate}
        onChange={({ start, end }) =>
          onChange({ startDate: start, endDate: end })
        }
        placeholder={t("auditLogs.dateRangePlaceholder")}
        className="h-8 text-sm"
      />
    </div>
  );
}
