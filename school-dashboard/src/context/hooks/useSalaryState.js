import { useState, useCallback, useEffect, useRef } from "react";
import { payrollApi, settingsApi } from "../../services/api";
import logger from "../../utils/logger";
import toast from "react-hot-toast";

const DEFAULT_SALARY_SETTINGS = {
  disburseDate: "",
  earnings: [],
  deductions: [],
};

export function useSalaryState() {
  const [salarySettings, setSalarySettings] = useState(DEFAULT_SALARY_SETTINGS);
  const [staffSalaries, setStaffSalaries] = useState({});
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [loadingSalarySettings, setLoadingSalarySettings] = useState(false);
  const prevSettingsRef = useRef(null);

  // Fetch salary components from backend on mount
  useEffect(() => {
    let cancelled = false;
    const fetchSalaryComponents = async () => {
      try {
        setLoadingSalarySettings(true);
        const res = await settingsApi.getSalaryComponents();
        if (!cancelled) {
          const data = res?.data;
          if (data && (Array.isArray(data.earnings) || Array.isArray(data.deductions))) {
            setSalarySettings((prev) => ({
              ...prev,
              earnings: Array.isArray(data.earnings) ? data.earnings : prev.earnings,
              deductions: Array.isArray(data.deductions) ? data.deductions : prev.deductions,
            }));
          }
        }
      } catch (err) {
        logger.error("Failed to fetch salary components:", err);
        // Keep empty defaults until the API succeeds; no hardcoded fallback data.
      } finally {
        if (!cancelled) setLoadingSalarySettings(false);
      }
    };
    fetchSalaryComponents();
    return () => { cancelled = true; };
  }, []);

  const updateSalarySettings = async (type, action, item) => {
    let nextState;
    // Use functional update to avoid stale closure on concurrent edits
    setSalarySettings((prev) => {
      nextState = { ...prev };
      if (action === "add") {
        const newItem = { id: item.name.toLowerCase().replace(/\s+/g, ""), ...item };
        nextState[type] = [...(nextState[type] || []), newItem];
      } else if (action === "remove") {
        nextState[type] = (nextState[type] || []).filter((i) => i.id !== item.id);
      } else if (action === "update") {
        Object.assign(nextState, item);
      }
      prevSettingsRef.current = prev;
      return nextState;
    });

    try {
      // Persist to backend — read from ref since React state may not be flushed yet
      const payload = nextState || salarySettings;
      await settingsApi.updateSalaryComponents({
        earnings: payload.earnings,
        deductions: payload.deductions,
      });
    } catch (err) {
      logger.error("Failed to persist salary components:", err);
      toast.error("Failed to save salary component. Changes reverted.");
      // Rollback on error
      if (prevSettingsRef.current) {
        setSalarySettings(prevSettingsRef.current);
      }
      throw err;
    }
  };

  const updateStaffSalary = (staffId, salaryData) => {
    setStaffSalaries((prev) => ({ ...prev, [staffId]: salaryData }));
  };

  // Fetch payroll records from the backend for a specific employee or all
  const fetchPayrollHistory = useCallback(async (params = {}) => {
    try {
      const res = await payrollApi.getRecords(params);
      const records = res?.data || res || [];
      setPayrollHistory(Array.isArray(records) ? records : []);
      return records;
    } catch (err) {
      logger.error("Failed to fetch payroll history:", err);
      return [];
    }
  }, []);

  // Calls the backend payroll API to run payroll and refreshes history
  const processPayroll = async (data) => {
    try {
      const result = await payrollApi.runPayroll(data);
      // Refresh history for the processed month
      if (data.month && data.year) {
        await fetchPayrollHistory({ month: data.month, year: data.year });
      }
      return result;
    } catch (err) {
      logger.error("Failed to process payroll:", err);
      toast.error(err.message || "Failed to process payroll");
      throw err;
    }
  };

  const getPayrollForMonth = (month) =>
    Array.isArray(payrollHistory) ? payrollHistory.find((p) => p.month === month) : undefined;

  return {
    salarySettings,
    staffSalaries,
    payrollHistory,
    loadingSalarySettings,
    updateSalarySettings,
    updateStaffSalary,
    processPayroll,
    fetchPayrollHistory,
    getPayrollForMonth,
  };
}
