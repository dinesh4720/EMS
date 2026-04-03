import { useState, useEffect } from "react";
import logger from "../../../utils/logger";
import { Button } from "@heroui/react";
import {
  IndianRupee, AlertCircle, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { useTranslation } from 'react-i18next';
import { Bone } from './Bone';

export function FeesTab({ id, cls, classesEnhancedApi, navigate }) {
  const { t } = useTranslation();
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
    { label: t('classes.collected', 'Collected'), value: `₹${feesOverview?.collected?.toLocaleString('en-IN') || "0"}`, icon: CheckCircle2, bg: 'bg-green-50 dark:bg-green-950/30', iconColor: 'text-green-600 dark:text-green-400' },
    { label: t('classes.pending', 'Pending'), value: `₹${feesOverview?.pending?.toLocaleString('en-IN') || "0"}`, icon: AlertCircle, bg: 'bg-amber-50 dark:bg-amber-950/30', iconColor: 'text-amber-600 dark:text-amber-400' },
    { label: t('classes.overdue', 'Overdue'), value: `₹${feesOverview?.overdue?.toLocaleString('en-IN') || "0"}`, icon: AlertTriangle, bg: 'bg-red-50 dark:bg-red-950/30', iconColor: 'text-red-500 dark:text-red-400' },
  ];

  return (
    <div className="space-y-4">
      {/* Fee Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {feesLoading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-gray-100 dark:border-zinc-800 space-y-2">
              <Bone className="h-3 w-20" /><Bone className="h-6 w-16" />
            </div>
          ))
        ) : stats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon size={16} className={stat.iconColor} />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-zinc-200">{stat.value}</h3>
            <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Defaulters List */}
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{t('pages.defaultersList')}</h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{t('classes.pendingPaymentsCount', '{{count}} pending payments', { count: pendingStudents.length })}</p>
          </div>
        </div>

        {pendingStudents.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-zinc-800">
            {pendingStudents.map(student => (
              <div key={student.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-zinc-900 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {student.photo ? (
                      <img src={student.photo} alt={student.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    ) : (
                      <span className="text-xs font-medium text-gray-600 dark:text-zinc-400">{student.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{student.name}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{t('classes.roll', 'Roll')} {student.rollNo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">₹{student.pendingFees ? Number(student.pendingFees).toLocaleString('en-IN') : "0"}</span>
                  <Button size="sm" variant="flat" className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300" onPress={() => navigate(`/fees/collect?student=${student.id}`)}>{t('pages.collect')}</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <IndianRupee size={32} className="mx-auto text-gray-200 dark:text-zinc-700 mb-3" />
            <p className="text-sm font-medium text-gray-600 dark:text-zinc-300 mb-1">{t('classes.allFeesCollected', 'All fees collected!')}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">{t('pages.noPendingFees')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
