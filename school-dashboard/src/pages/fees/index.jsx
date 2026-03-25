import { Routes, Route } from "react-router-dom";
import { Breadcrumbs, BreadcrumbItem } from "@heroui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { IndianRupee, RotateCcw, Home, Download, AlertTriangle, Settings, Layers } from "lucide-react";
import { PageLayout, MinimalButton } from "../../components/ui";
import Payments from "./Payments";
import Refunds from "./Refunds";
import FeeTemplatesManagement from "./FeeTemplatesManagement";
import toast from "react-hot-toast";
import { feesApi } from "../../services/api";
import { useTranslation } from 'react-i18next';

export default function FeesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    if (location.pathname.includes("/refunds")) return "refunds";
    if (location.pathname.includes("/templates")) return "templates";
    return "payments";
  };

  const activeTab = getActiveTab();

  const handleDownloadReport = async () => {
    const loadingId = toast.loading('Generating fee report…');
    try {
      const payments = await feesApi.getPayments({});
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

      const headers = ['Student', 'Class', 'Total Paid (₹)', 'Last Payment Date', 'Payment Modes', 'Transactions'];
      const txCounts = {};
      payments.forEach(p => {
        const sid = p.studentId?._id || p.studentId || 'unknown';
        txCounts[sid] = (txCounts[sid] || 0) + 1;
      });

      const rows = Object.entries(studentMap).map(([sid, s]) => [
        s.name,
        s.class,
        s.totalPaid,
        s.lastPayment ? new Date(s.lastPayment).toLocaleDateString() : 'N/A',
        s.modes.join(' / ') || 'N/A',
        txCounts[sid] || 0,
      ]);

      const totalCollected = Object.values(studentMap).reduce((sum, s) => sum + s.totalPaid, 0);
      const summary = [
        [],
        ['--- Summary ---'],
        ['Total Students with Payments', Object.keys(studentMap).length],
        ['Total Transactions', payments.length],
        ['Total Collected (₹)', totalCollected],
        ['Report Generated', new Date().toLocaleString()],
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
      a.download = `fee-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.dismiss(loadingId);
      toast.success(`Fee report downloaded — ${payments.length} transactions`);
    } catch (err) {
      toast.dismiss(loadingId);
      toast.error('Failed to generate report. Please try again.');
      console.error('Fee report error:', err);
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
  ];

  const handleTabChange = (key) => {
    if (key === "payments") navigate("/fees");
    else if (key === "refunds") navigate("/fees/refunds");
    else if (key === "templates") navigate("/fees/templates");
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
        icon={<AlertTriangle size={16} />}
        onClick={() => navigate("/fees/defaulters")}
      >
        Defaulters
      </MinimalButton>
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
          <Routes>
            <Route index element={<Payments />} />
            <Route path="refunds" element={<Refunds />} />
            <Route path="templates" element={<FeeTemplatesManagement />} />
          </Routes>
        </div>
      </PageLayout>
    </div>
  );
}
