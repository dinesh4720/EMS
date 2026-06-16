import { Tabs, Tab } from "@heroui/react";
import { Settings, Users, FileText, Wallet } from "lucide-react";
import StaffPayroll from "../../pages/staffs/StaffPayroll";
import SalaryTemplates from "./SalaryTemplates";
import { useTranslation } from "react-i18next";
import {
  GeneralPayrollSettings,
  SalaryComponents,
} from "./components/payroll";

export default function PayrollSettings() {
  const { t } = useTranslation();
  return (
    <div className="w-full flex flex-col animate-fade-in">
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-fg">
          {t("pages.payrollConfiguration")}
        </h2>
        <p className="text-sm text-fg-muted mt-1">
          Manage payroll schedules, salary structures, templates, and
          components
        </p>
      </div>

      <Tabs
        size="md"
        variant="underlined"
        color="primary"
        classNames={{
          tabList:
            "gap-6 w-full relative rounded-none p-0 border-b border-divider",
          cursor: "w-full bg-primary",
          tab: "max-w-fit px-0 h-10",
          tabContent:
            "group-data-[selected=true]:text-primary text-fg-muted font-medium",
        }}
      >
        <Tab
          key="general"
          title={
            <div className="flex items-center gap-2">
              <Settings size={16} />
              <span>{t("pages.generalSettings")}</span>
            </div>
          }
        >
          <div className="pt-4">
            <GeneralPayrollSettings />
          </div>
        </Tab>
        <Tab
          key="salaries"
          title={
            <div className="flex items-center gap-2">
              <Users size={16} />
              <span>{t("pages.staffSalariesCtc")}</span>
            </div>
          }
        >
          <div className="pt-4">
            <StaffPayroll />
          </div>
        </Tab>
        <Tab
          key="templates"
          title={
            <div className="flex items-center gap-2">
              <FileText size={16} />
              <span>{t("pages.salaryTemplates")}</span>
            </div>
          }
        >
          <div className="pt-4">
            <SalaryTemplates />
          </div>
        </Tab>
        <Tab
          key="components"
          title={
            <div className="flex items-center gap-2">
              <Wallet size={16} />
              <span>{t("pages.salaryComponents")}</span>
            </div>
          }
        >
          <div className="pt-4">
            <SalaryComponents />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
