import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  Bell,
  X,
  ChevronRight
} from 'lucide-react';

const alertsData = [
  {
    id: 1,
    type: 'critical',
    title: 'Staff Absentees',
    description: '5 teachers absent today - substitution needed.',
    time: '2h ago',
    icon: AlertTriangle
  },
  {
    id: 2,
    type: 'warning',
    title: 'Fee Deadline',
    description: 'Term 2 fees submission deadline tomorrow.',
    time: '5h ago',
    icon: Bell
  },
  {
    id: 3,
    type: 'info',
    title: 'Policy Update',
    description: 'Updated leave policy document available.',
    time: '1d ago',
    icon: Info
  },
  {
    id: 4,
    type: 'success',
    title: 'Audit Completed',
    description: 'Annual financial audit passed successfully.',
    time: '2d ago',
    icon: CheckCircle2
  }
];

const getAlertStyles = (type) => {
  // All use gray tones for minimal design
  switch (type) {
    case 'critical':
      return {
        icon: 'text-gray-600 bg-gray-100',
        dot: 'bg-gray-700'
      };
    case 'warning':
      return {
        icon: 'text-gray-600 bg-gray-100',
        dot: 'bg-gray-500'
      };
    case 'success':
      return {
        icon: 'text-gray-600 bg-gray-100',
        dot: 'bg-gray-400'
      };
    default:
      return {
        icon: 'text-gray-600 bg-gray-100',
        dot: 'bg-gray-400'
      };
  }
};

function AlertsPanel() {
  const [alerts, setAlerts] = useState(alertsData);

  const handleDismiss = (id) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const criticalCount = alerts.filter(a => a.type === 'critical').length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden sticky top-6">
      {/* Header */}
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 text-sm">Alerts</h3>
          {criticalCount > 0 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
              {criticalCount} urgent
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {criticalCount > 0 ? 'Requires your attention' : 'All systems normal'}
        </p>
      </div>

      {/* Alerts List */}
      <div className="divide-y divide-gray-200">
        {alerts.map((alert) => {
          const styles = getAlertStyles(alert.type);
          const Icon = alert.icon;

          return (
            <div
              key={alert.id}
              className="group p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Status Dot */}
                <div className={`w-2 h-2 rounded-full ${styles.dot} mt-1.5 shrink-0`} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      {alert.title}
                    </p>
                    <button
                      onClick={() => handleDismiss(alert.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                    >
                      <X size={12} className="text-gray-400" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                    {alert.description}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1.5">{alert.time}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {alerts.length === 0 && (
        <div className="text-center py-8">
          <div className="w-10 h-10 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <CheckCircle2 size={18} className="text-gray-500" />
          </div>
          <p className="text-sm text-gray-600">All caught up!</p>
          <p className="text-xs text-gray-400 mt-0.5">No pending alerts</p>
        </div>
      )}

      {/* Footer */}
      {alerts.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <button className="w-full py-2 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center justify-center gap-1">
            View all alerts
            <ChevronRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

export default React.memo(AlertsPanel);
