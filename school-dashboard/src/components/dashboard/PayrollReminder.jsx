import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, X } from "lucide-react";
import { settingsApi } from "../../services/api";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import logger from '../../utils/logger';


/**
 * PayrollReminder Component
 *
 * Automatically checks and displays a payroll reminder notification
 * when it's 5 days or less before the payroll disbursement date.
 *
 * This component should be placed in the main layout or dashboard
 * to ensure it runs on every page load.
 */
export default function PayrollReminder() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [reminder, setReminder] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkReminder = async () => {
      try {
        const data = await settingsApi.getPayrollReminder();
        if (data.shouldShow) {
          setReminder(data);
          // Show toast notification
          toast.custom((toastInstance) => (
            <div className="bg-surface border-l-4 border-warning shadow-lg rounded-lg p-4 max-w-md flex items-start gap-3">
              <AlertCircle className="text-warning flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="font-semibold text-sm text-fg">{t('components.payrollReminder')}</p>
                <p className="text-xs text-fg-muted mt-1">{data.message}</p>
              </div>
              <button
                onClick={() => toast.dismiss(toastInstance.id)}
                className="text-fg-faint hover:text-fg-muted transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ), { duration: 10000, id: 'payroll-reminder' });
        }
      } catch (error) {
        logger.error('Failed to check payroll reminder:', error);
      } finally {
        setLoading(false);
      }
    };

    // Check reminder on component mount
    checkReminder();

    // Check reminder every hour (in case the user keeps the app open)
    const interval = setInterval(checkReminder, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Don't render anything if there's no reminder or if it's dismissed
  if (loading || !reminder || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-slide-up">
      <div className="bg-surface border border-warning shadow-xl rounded-lg overflow-hidden">
        <div className="bg-warning/10 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="text-warning flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-warning-900">{t('components.payrollDisbursementReminder')}</p>
            <p className="text-xs text-warning-800 mt-1">{reminder.message}</p>
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => setDismissed(true)}
                className="text-xs bg-warning text-warning-900 px-3 py-1.5 rounded-md font-medium hover:bg-warning/80 transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={() => navigate('/settings?tab=payroll')}
                className="text-xs text-warning-700 hover:text-warning-900 font-medium transition-colors"
              >
                Go to Payroll Settings
              </button>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-warning-600 hover:text-warning-900 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Custom hook for checking payroll reminder
export function usePayrollReminder() {
  const [reminder, setReminder] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkReminder = async () => {
    try {
      const data = await settingsApi.getPayrollReminder();
      setReminder(data);
      setLoading(false);
      return data;
    } catch (error) {
      logger.error('Failed to check payroll reminder:', error);
      setLoading(false);
      return null;
    }
  };

  useEffect(() => {
    checkReminder();
  }, []);

  return { reminder, loading, checkReminder };
}
