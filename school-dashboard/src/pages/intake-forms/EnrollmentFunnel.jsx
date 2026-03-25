import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Card, CardBody, Chip } from "@heroui/react";
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { Users, FileCheck, CheckCircle, XCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { intakeFormsApi } from "../../services/api";

const FUNNEL_STAGES = [
  { key: "assigned", label: "Assigned", icon: Users, color: "bg-blue-500" },
  { key: "in_progress", label: "In Progress", icon: Clock, color: "bg-amber-500" },
  { key: "submitted", label: "Submitted", icon: FileCheck, color: "bg-indigo-500" },
  { key: "approved", label: "Approved", icon: CheckCircle, color: "bg-emerald-500" },
  { key: "rejected", label: "Rejected", icon: XCircle, color: "bg-red-500" },
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

  if (loading) {
    return (
      <TablePageSkeleton />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">
          Enrollment Funnel
        </h2>
        <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
          Track the progress of form assignments through each stage
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {FUNNEL_STAGES.map((stage) => {
          const Icon = stage.icon;
          return (
            <Card key={stage.key} className="bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800">
              <CardBody className="p-4 text-center">
                <div className={`w-10 h-10 rounded-lg ${stage.color} bg-opacity-10 dark:bg-opacity-20 flex items-center justify-center mx-auto mb-2`}>
                  <Icon size={20} className={stage.color.replace("bg-", "text-")} />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
                  {stats[stage.key]}
                </p>
                <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">
                  {stage.label}
                </p>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Funnel Visualization */}
      <Card className="bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800">
        <CardBody className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-6">
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
                  <div className="w-28 text-sm font-medium text-gray-700 dark:text-zinc-300 text-right shrink-0">
                    {stage.label}
                  </div>
                  <div className="flex-1 relative">
                    <div className="h-10 bg-gray-50 dark:bg-zinc-900 rounded-lg overflow-hidden">
                      <div
                        className={`h-full ${stage.color} rounded-lg flex items-center justify-end pr-3 transition-all duration-500`}
                        style={{ width: `${width}%` }}
                      >
                        <span className="text-sm font-semibold text-white">
                          {stats[stage.key]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="w-16 text-right shrink-0">
                    <Chip
                      size="sm"
                      variant="flat"
                      className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300"
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
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-zinc-800">
              <div className="flex items-center gap-4">
                <div className="w-28 text-sm font-medium text-gray-700 dark:text-zinc-300 text-right shrink-0">
                  Rejected
                </div>
                <div className="flex-1 relative">
                  <div className="h-10 bg-gray-50 dark:bg-zinc-900 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-lg flex items-center justify-end pr-3 transition-all duration-500"
                      style={{
                        width: `${Math.max((stats.rejected / maxCount) * 100, 8)}%`,
                      }}
                    >
                      <span className="text-sm font-semibold text-white">
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
    </div>
  );
}
