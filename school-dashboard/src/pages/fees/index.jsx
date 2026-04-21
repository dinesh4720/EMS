import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Breadcrumbs, BreadcrumbItem } from "@heroui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { IndianRupee, RotateCcw, Home, Download, AlertTriangle, Settings, Layers } from "lucide-react";
import { PageLayout, MinimalButton } from "../../components/ui";
import { TablePageSkeleton } from "../../components/skeletons/PageSkeletons";
import toast from "react-hot-toast";

const Payments = lazy(() => import("./Payments"));
const Refunds = lazy(() => import("./Refunds"));
const FeeTemplatesManagement = lazy(() => import("./FeeTemplatesManagement"));
const FeeDefaulters = lazy(() => import("./FeeDefaulters"));
import { feesApi } from "../../services/api";
import { useTranslation } from 'react-i18next';
import { getDateLocale } from '../../i18n/index';
import { formatShortDate, toTodayDateString } from '../../utils/dateFormatter';
import { useApp } from '../../context/AppContext';
import { useCurrency } from '../../context/hooks/useCurrency';
import logger from '../../utils/logger';


export default function FeesPage() {
  const { t } = useTranslation();
  const { currentAcademicYear, selectedAcademicYear } = useApp();
  const { currencySymbol } = useCurrency();
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    if (location.pathname.includes("/refunds")) return "refunds";
    if (location.pathname.includes("/templates")) return "templates";
    if (location.pathname.includes("/defaulters")) return "defaulters";
    return "payments";
  };

  const activeTab = getActiveTab();

  const handleDownloadReport = async () => {
    const loadingId = toast.loading('Generating fee report…');
    try {
      // Fetch all pages scoped to the current academic year
      const filters = { limit: 200 };
      if (selectedAcademicYear) filters.academicYear = selectedAcademicYear;
      let allPayments = [];
      let page = 1;
      let totalPages = 1;
      while (page <= totalPages) {
        const { payments: batch, pagination } = await feesApi.getPayments({ ...filters, page });
        if (batch) allPayments = allPayments.concat(batch);
        totalPages = pagination?.totalPages || 1;
        page++;
      }
      const payments = allPayments;
      if (!payments || payments.length === 0) {
        toast.dismiss(loadingId);
        toast.error('No payment data found to generate report.');
        return;
      }

      // Aggregate per-student totals
      const studentMap = {};
      payments.forEach(p => {
        const sid = p.studentId?._id || p.studentId || 'unknown';
        const name = p.studentId?.name || p.studentName || 'Unknown';
        const cls = p.studentId?.class || p.classId?.name || p.className || '';
        if (!studentMap[sid]) {
          studentMap[sid] = { name, class: cls, totalPaid: 0, lastPayment: null, modes: [] };
        }
        studentMap[sid].totalPaid += p.amount || 0;
        if (!studentMap[sid].lastPayment || new Date(p.paymentDate) > new Date(studentMap[sid].lastPayment)) {
          studentMap[sid].lastPayment = p.paymentDate;
        }
        if (p.paymentMode && !studentMap[sid].modes.includes(p.paymentMode)) {
          studentMap[sid].modes.push(p.paymentMode);
        }
      });

      const headers = ['Student', 'Class', `Total Paid (${currencySymbol})`, 'Last Payment Date', 'Payment Modes', 'Transactions'];
      const txCounts = {};
      payments.forEach(p => {
        const sid = p.studentId?._id || p.studentId || 'unknown';
        txCounts[sid] = (txCounts[sid] || 0) + 1;
      });

      const rows = Object.entries(studentMap).map(([sid, s]) => [
        s.name,
        s.class,
        s.totalPaid,
        s.lastPayment ? formatShortDate(s.lastPayment) : 'N/A',
        s.modes.join(' / ') || 'N/A',
        txCounts[sid] || 0,
      ]);

      const totalCollected = Object.values(studentMap).reduce((sum, s) => sum + s.totalPaid, 0);
      const summary = [
        [],
        ['--- Summary ---'],
        ['Total Students with Payments', Object.keys(studentMap).length],
        ['Total Transactions', payments.length],
        [`Total Collected (${currencySymbol})`, totalCollected],
        ['Report Generated', new Date().toLocaleString(getDateLocale())],
      ];

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(v => `"${v ?? ''}"`).join(',')),
        ...summary.map(row => row.map(v => `"${v ?? ''}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fee-report-${toTodayDateString()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.dismiss(loadingId);
      toast.success(`Fee report downloaded — ${payments.length} transactions`);
    } catch (err) {
      toast.dismiss(loadingId);
      toast.error('Failed to generate report. Please try again.');
      logger.error('Fee report error:', err);
    }
  };

  const tabs = [
    {
      key: "payments",
      title: (
        <div className="flex items-center gap-2">
          <IndianRupee size={16} />
          <span>{t('pages.payments')}</span>
        </div>
      ),
    },
    {
      key: "refunds",
      title: (
        <div className="flex items-center gap-2">
          <RotateCcw size={16} />
          <span>{t('pages.refunds1')}</span>
        </div>
      ),
    },
    {
      key: "templates",
      title: (
        <div className="flex items-center gap-2">
          <Layers size={16} />
          <span>{t('pages.templates1')}</span>
        </div>
      ),
    },
    {
      key: "defaulters",
      title: (
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>Defaulters</span>
        </div>
      ),
    },
  ];

  const handleTabChange = (key) => {
    if (key === "payments") navigate("/fees");
    else if (key === "refunds") navigate("/fees/refunds");
    else if (key === "templates") navigate("/fees/templates");
    else if (key === "defaulters") navigate("/fees/defaulters");
  };

  const getHeader = () => {
    if (activeTab === "payments") {
      return {
        title: "Fee Payments",
        description: "Collect fees, track payments, and manage defaulters",
      };
    }
    if (activeTab === "templates") {
      return {
        title: "Fee Templates",
        description: "Create and manage fee templates for different sections",
      };
    }
    if (activeTab === "defaulters") {
      return {
        title: "Fee Defaulters",
        description: "Students with unpaid or overdue fees",
      };
    }
    return {
      title: "Fee Refunds",
      description: "Process refunds and track refund history",
    };
  };

  const actions = (
    <>
      <MinimalButton
        variant="ghost"
        size="sm"
        icon={<Download size={16} />}
        onClick={handleDownloadReport}
      >
        Reports
      </MinimalButton>
      <MinimalButton
        variant="ghost"
        size="sm"
        icon={<Settings size={16} />}
        onClick={() => navigate("/settings/fee-heads")}
      >
        Fee Setup
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
          <BreadcrumbItem>{t('pages.fees1')}</BreadcrumbItem>
          {activeTab === "refunds" && <BreadcrumbItem>{t('pages.refunds1')}</BreadcrumbItem>}
          {activeTab === "templates" && <BreadcrumbItem>{t('pages.templates1')}</BreadcrumbItem>}
          {activeTab === "defaulters" && <BreadcrumbItem>Defaulters</BreadcrumbItem>}
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
        <div className="min-h-[500px] p-6">
          <Suspense fallback={<TablePageSkeleton kpiCards={3} columns={6} rows={8} />}>
            <Routes>
              <Route index element={<Payments />} />
              <Route path="refunds" element={<Refunds />} />
              <Route path="templates" element={<FeeTemplatesManagement />} />
              <Route path="defaulters" element={<FeeDefaulters />} />
            </Routes>
          </Suspense>
        </div>
      </PageLayout>
    </div>
  );
}
