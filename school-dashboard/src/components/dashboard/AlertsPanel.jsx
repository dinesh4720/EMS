import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Bell,
  X,
  ChevronRight
} from 'lucide-react';

const iconByType = {
  critical: AlertTriangle,
  warning: Bell,
  success: CheckCircle2,
  info: Info,
};

const getAlertStyles = (type) => {
  switch (type) {
    case 'critical':
      return {
        dot: 'bg-gray-700'
      };
    case 'warning':
      return {
        dot: 'bg-gray-500'
      };
    case 'success':
      return {
        dot: 'bg-gray-400'
      };
    default:
      return {
        dot: 'bg-gray-400'
      };
  }
};

function AlertsPanel({ alerts = [] }) {
  const { t } = useTranslation();
  const [dismissedIds, setDismissedIds] = useState([]);

  const visibleAlerts = useMemo(
    () => alerts.filter((alert) => !dismissedIds.includes(alert.id)),
    [alerts, dismissedIds]
  );

  const handleDismiss = (id) => {
    setDismissedIds((current) => [...current, id]);
  };

  const criticalCount = visibleAlerts.filter((a) => a.type === 'critical').length;

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden sticky top-6">
      <div className="p-5 border-b border-gray-200 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('components.alerts')}</h3>
          {criticalCount > 0 && (
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 text-xs font-medium rounded-full">
              {criticalCount} urgent
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
          {criticalCount > 0 ? 'Requires your attention' : 'Live dashboard signals'}
        </p>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-zinc-800">
        {visibleAlerts.map((alert) => {
          const styles = getAlertStyles(alert.type);
          const Icon = alert.icon || iconByType[alert.type] || Info;

          return (
            <div
              key={alert.id}
              className="group p-4 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full ${styles.dot} mt-1.5 shrink-0`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400">
                        <Icon size={14} />
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                        {alert.title}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDismiss(alert.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded"
                    >
                      <X size={12} className="text-gray-400 dark:text-zinc-500" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2 line-clamp-2">
                    {alert.description}
                  </p>
                  {alert.time && <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1.5">{alert.time}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {visibleAlerts.length === 0 && (
        <div className="text-center py-8">
          <div className="w-10 h-10 mx-auto bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-3">
            <CheckCircle2 size={18} className="text-gray-500 dark:text-zinc-400" />
          </div>
          <p className="text-sm text-gray-600 dark:text-zinc-400">{t('components.allCaughtUp')}</p>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{t('components.noLiveIssuesNeedAttentionRightNow')}</p>
        </div>
      )}

      {visibleAlerts.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
          <button className="w-full py-2 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors flex items-center justify-center gap-1">
            Review alerts
            <ChevronRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

export default React.memo(AlertsPanel);
