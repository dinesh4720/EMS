import { useState, useEffect } from "react";
import logger from "../../../utils/logger";
import { Button } from "@heroui/react";
import {
  IndianRupee, AlertCircle, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { useTranslation } from 'react-i18next';
import { Bone } from './Bone';
import { useCurrency } from '../../../context/hooks/useCurrency';

export function FeesTab({ id, cls, classesEnhancedApi, navigate }) {
  const { t } = useTranslation();
  const { fmt } = useCurrency();
  const [feesOverview, setFeesOverview] = useState(null);
  const [feesLoading, setFeesLoading] = useState(true);
  const { students } = useApp();

  useEffect(() => {
    if (classesEnhancedApi && id) {
      setFeesLoading(true);
      classesEnhancedApi.getFeesOverview(id).then(setFeesOverview).catch(logger.error).finally(() => setFeesLoading(false));
    }
  }, [id, classesEnhancedApi]);

  const classStudents = students.filter(s =>
    String(s.classId?._id || s.classId) === String(cls?.id) && (s.status || 'active') === 'active' && s.isDeleted !== true
  );
  const pendingStudents = classStudents.filter(s => s.feeStatus !== 'paid');

  const stats = [
    { label: t('classes.collected', 'Collected'), value: fmt(feesOverview?.collected || 0), icon: CheckCircle2, bg: 'bg-green-50 dark:bg-green-950/30', iconColor: 'text-green-600 dark:text-green-400' },
    { label: t('classes.pending', 'Pending'), value: fmt(feesOverview?.pending || 0), icon: AlertCircle, bg: 'bg-amber-50 dark:bg-amber-950/30', iconColor: 'text-amber-600 dark:text-amber-400' },
    { label: t('classes.overdue', 'Overdue'), value: fmt(feesOverview?.overdue || 0), icon: AlertTriangle, bg: 'bg-red-50 dark:bg-red-950/30', iconColor: 'text-red-500 dark:text-red-400' },
  ];

  return (
    <div className="space-y-4">
      {/* Fee Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {feesLoading ? (
          [1, 2, 3].map(i => (
            <div key={`fee-stat-skeleton-${i}`} className="bg-surface rounded-lg p-4 border border-divider space-y-2">
              <Bone className="h-3 w-20" /><Bone className="h-6 w-16" />
            </div>
          ))
        ) : stats.map((stat) => (
          <div key={stat.label} className="bg-surface rounded-lg p-4 border border-divider hover:border-border-token transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon size={16} className={stat.iconColor} />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-fg">{stat.value}</h3>
            <p className="text-xs font-medium text-fg-muted mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Defaulters List */}
      <div className="bg-surface rounded-lg border border-border-token overflow-hidden">
        <div className="px-5 py-4 border-b border-divider flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-fg">{t('pages.defaultersList')}</h3>
            <p className="text-xs text-fg-muted mt-0.5">{t('classes.pendingPaymentsCount', '{{count}} pending payments', { count: pendingStudents.length })}</p>
          </div>
        </div>

        {pendingStudents.length > 0 ? (
          <div className="divide-y divide-divider">
            {pendingStudents.map(student => (
              <div key={student.id} className="px-5 py-3 flex items-center justify-between hover:bg-surface-2 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-surface-2 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {student.photo ? (
                      <img src={student.photo} alt={student.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    ) : (
                      <span className="text-xs font-medium text-fg-muted">{student.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-fg">{student.name}</p>
                    <p className="text-xs text-fg-muted">{t('classes.roll', 'Roll')} {student.rollNo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-fg">{fmt(student.pendingFees || 0)}</span>
                  <Button size="sm" variant="flat" className="bg-surface-2 text-fg" onPress={() => navigate(`/fees?student=${student.id}`)}>{t('pages.collect')}</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <IndianRupee size={32} className="mx-auto text-fg-faint mb-3" />
            <p className="text-sm font-medium text-fg mb-1">{t('classes.allFeesCollected', 'All fees collected!')}</p>
            <p className="text-xs text-fg-faint">{t('pages.noPendingFees')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
