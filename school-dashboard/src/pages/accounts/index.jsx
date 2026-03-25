import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Breadcrumbs, BreadcrumbItem } from "@heroui/react";
import { Home, LayoutDashboard, FileSpreadsheet, Briefcase, PieChart, Users } from "lucide-react";
import { PageLayout, MinimalButton } from "../../components/ui";
import Overview from "./Overview";
import Invoices from "./Invoices";
import Expenses from "./Expenses";
import Reports from "./Reports";
import Payroll from "./Payroll";
import { useTranslation } from 'react-i18next';

export default function AccountsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    if (location.pathname.includes("/invoices")) return "invoices";
    if (location.pathname.includes("/expenses")) return "expenses";
    if (location.pathname.includes("/reports")) return "reports";
    if (location.pathname.includes("/payroll")) return "payroll";
    return "overview";
  };

  const activeTab = getActiveTab();

  const tabs = [
    {
      key: "overview",
      title: (
        <div className="flex items-center gap-2">
          <LayoutDashboard size={16} />
          <span>{t('pages.overview1')}</span>
        </div>
      ),
    },
    {
      key: "invoices",
      title: (
        <div className="flex items-center gap-2">
          <FileSpreadsheet size={16} />
          <span>{t('pages.invoices')}</span>
        </div>
      ),
    },
    {
      key: "expenses",
      title: (
        <div className="flex items-center gap-2">
          <Briefcase size={16} />
          <span>{t('pages.expenses')}</span>
        </div>
      ),
    },
    {
      key: "reports",
      title: (
        <div className="flex items-center gap-2">
          <PieChart size={16} />
          <span>{t('pages.reports1')}</span>
        </div>
      ),
    },
    {
      key: "payroll",
      title: (
        <div className="flex items-center gap-2">
          <Users size={16} />
          <span>{t('pages.payroll1')}</span>
        </div>
      ),
    },
  ];

  const handleTabChange = (key) => {
    if (key === "overview") navigate("/accounts");
    else if (key === "invoices") navigate("/accounts/invoices");
    else if (key === "expenses") navigate("/accounts/expenses");
    else if (key === "reports") navigate("/accounts/reports");
    else if (key === "payroll") navigate("/accounts/payroll");
  };

  const getHeader = () => {
    if (activeTab === "overview") {
      return {
        title: "Accounts Overview",
        description: "Monitor your financial health with key metrics and insights",
      };
    }
    if (activeTab === "invoices") {
      return {
        title: "Invoice Management",
        description: "Create, track, and manage all invoices",
      };
    }
    if (activeTab === "expenses") {
      return {
        title: "Expense Tracking",
        description: "Record and categorize all expenses",
      };
    }
    if (activeTab === "reports") {
      return {
        title: "Financial Reports",
        description: "Generate and analyze financial reports",
      };
    }
    if (activeTab === "payroll") {
      return {
        title: "Payroll Management",
        description: "Manage staff salaries and payments",
      };
    }
    return {
      title: "Accounts",
      description: "Financial management dashboard",
    };
  };

  const actions = (
    <>
      <MinimalButton
        variant="ghost"
        size="sm"
        onClick={() => navigate("/fees")}
      >
        Fee Collection
      </MinimalButton>
    </>
  );

  return (
    <div className="animate-fade-in">
      {/* Breadcrumbs Section */}
      <div className="mb-4">
        <Breadcrumbs size="sm">
          <BreadcrumbItem startContent={<Home size={14} />} onPress={() => navigate("/")}>
            Home
          </BreadcrumbItem>
          <BreadcrumbItem>{t('pages.accounts')}</BreadcrumbItem>
          {activeTab === "invoices" && <BreadcrumbItem>{t('pages.invoices')}</BreadcrumbItem>}
          {activeTab === "expenses" && <BreadcrumbItem>{t('pages.expenses')}</BreadcrumbItem>}
          {activeTab === "reports" && <BreadcrumbItem>{t('pages.reports1')}</BreadcrumbItem>}
          {activeTab === "payroll" && <BreadcrumbItem>{t('pages.payroll1')}</BreadcrumbItem>}
        </Breadcrumbs>
      </div>

      {/* Page Layout with Tabs */}
      <PageLayout
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        header={getHeader()}
        actions={actions}
        noPadding
      >
        <div className="min-h-[500px]">
          <Routes>
            <Route index element={<Overview />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="reports" element={<Reports />} />
            <Route path="payroll" element={<Payroll />} />
          </Routes>
        </div>
      </PageLayout>
    </div>
  );
}