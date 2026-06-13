import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Card, CardBody, Chip } from "@heroui/react";
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import PageHeader from '../../components/ui/PageHeader';
import { Users, FileCheck, CheckCircle, XCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { intakeFormsApi } from "../../services/api";

const FUNNEL_STAGES = [
  { key: "assigned", label: "Assigned", icon: Users, barColor: "bg-accent", iconBgColor: "bg-accent-bg", iconTextColor: "text-accent" },
  { key: "in_progress", label: "In Progress", icon: Clock, barColor: "bg-warn", iconBgColor: "bg-warn-bg", iconTextColor: "text-warn" },
  { key: "submitted", label: "Submitted", icon: FileCheck, barColor: "bg-info-token", iconBgColor: "bg-info-bg", iconTextColor: "text-info-token" },
  { key: "approved", label: "Approved", icon: CheckCircle, barColor: "bg-ok", iconBgColor: "bg-ok-bg", iconTextColor: "text-ok" },
  { key: "rejected", label: "Rejected", icon: XCircle, barColor: "bg-danger-token", iconBgColor: "bg-danger-bg", iconTextColor: "text-danger-token" },
];

export default function EnrollmentFunnel() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    assigned: 0,
    in_progress: 0,
    submitted: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    fetchFunnelData();
  }, []);

  const fetchFunnelData = async () => {
    try {
      setLoading(true);
      const [assignments, submissions] = await Promise.all([
        intakeFormsApi.getAssignments(null, null),
        intakeFormsApi.getSubmissions(null, null),
      ]);

      const counts = {
        assigned: assignments.length,
        in_progress: assignments.filter((a) => a.status === "in_progress").length,
        submitted: submissions.length,
        approved: submissions.filter((s) => s.reviewStatus === "approved").length,
        rejected: submissions.filter((s) => s.reviewStatus === "rejected").length,
      };
      setStats(counts);
    } catch (error) {
      toast.error(t('toast.error.failedToLoadFunnelData'));
    } finally {
      setLoading(false);
    }
  };

  const maxCount = Math.max(...Object.values(stats), 1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enrollment Funnel"
        description="Track the progress of form assignments through each stage"
        bordered={false}
        size="lg"
      />

      {loading ? (
        <TablePageSkeleton title={false} searchBar={false} kpiCards={5} columns={3} rows={4} />
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {FUNNEL_STAGES.map((stage) => {
              const Icon = stage.icon;
              return (
                <Card key={stage.key} className="bg-surface border border-divider">
                  <CardBody className="p-4 text-center">
                    <div className={`w-10 h-10 rounded-lg ${stage.iconBgColor} flex items-center justify-center mx-auto mb-2`}>
                      <Icon size={20} className={stage.iconTextColor} />
                    </div>
                    <p className="text-2xl font-bold text-fg">
                      {stats[stage.key]}
                    </p>
                    <p className="text-xs text-fg-muted mt-1">
                      {stage.label}
                    </p>
                  </CardBody>
                </Card>
              );
            })}
          </div>

          {/* Funnel Visualization */}
          <Card className="bg-surface border border-divider">
            <CardBody className="p-6">
              <h3 className="text-lg font-semibold text-fg mb-6">
                Conversion Funnel
              </h3>
              <div className="space-y-3">
                {FUNNEL_STAGES.filter((s) => s.key !== "rejected").map((stage, index) => {
                  const width = maxCount > 0 ? Math.max((stats[stage.key] / maxCount) * 100, 8) : 8;
                  const conversionRate =
                    index > 0
                      ? stats[FUNNEL_STAGES[index - 1].key] > 0
                        ? ((stats[stage.key] / stats[FUNNEL_STAGES[index - 1].key]) * 100).toFixed(1)
                        : "0.0"
                      : "100.0";

                  return (
                    <div key={stage.key} className="flex items-center gap-4">
                      <div className="w-28 text-sm font-medium text-fg text-right shrink-0">
                        {stage.label}
                      </div>
                      <div className="flex-1 relative">
                        <div className="h-10 bg-surface-2 rounded-lg overflow-hidden">
                          <div
                            className={`h-full ${stage.barColor} rounded-lg flex items-center justify-end pr-3 transition-all duration-500`}
                            style={{ width: `${width}%` }}
                          >
                            <span className="text-sm font-semibold text-accent-fg">
                              {stats[stage.key]}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="w-16 text-right shrink-0">
                        <Chip
                          size="sm"
                          variant="flat"
                          className="bg-surface-2 text-fg"
                        >
                          {conversionRate}%
                        </Chip>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rejected count */}
              {stats.rejected > 0 && (
                <div className="mt-6 pt-4 border-t border-border-token">
                  <div className="flex items-center gap-4">
                    <div className="w-28 text-sm font-medium text-fg text-right shrink-0">
                      Rejected
                    </div>
                    <div className="flex-1 relative">
                      <div className="h-10 bg-surface-2 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-danger-token rounded-lg flex items-center justify-end pr-3 transition-all duration-500"
                          style={{
                            width: `${Math.max((stats.rejected / maxCount) * 100, 8)}%`,
                          }}
                        >
                          <span className="text-sm font-semibold text-accent-fg">
                            {stats.rejected}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-16 text-right shrink-0">
                      <Chip
                        size="sm"
                        variant="flat"
                        color="danger"
                      >
                        {stats.submitted > 0
                          ? ((stats.rejected / stats.submitted) * 100).toFixed(1)
                          : "0.0"}
                        %
                      </Chip>
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
