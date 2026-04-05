import { useState, useCallback } from "react";
import { payrollApi } from "../../services/api";
import logger from "../../utils/logger";

const DEFAULT_SALARY_SETTINGS = {
  disburseDate: "",
  earnings: [
    { id: "basic", name: "Basic Salary" },
    { id: "hra", name: "HRA" },
    { id: "transport", name: "Transport Allowance" },
    { id: "special", name: "Special Allowance" },
  ],
  deductions: [
    { id: "pf", name: "Provident Fund" },
    { id: "pt", name: "Professional Tax" },
    { id: "tds", name: "TDS" },
  ],
};

export function useSalaryState() {
  // salarySettings stays local — no backend endpoint for salary component config yet
  const [salarySettings, setSalarySettings] = useState(DEFAULT_SALARY_SETTINGS);
  const [staffSalaries, setStaffSalaries] = useState({});
  const [payrollHistory, setPayrollHistory] = useState([]);

  const updateSalarySettings = (type, action, item) => {
    setSalarySettings((prev) => {
      if (action === "add") {
        return { ...prev, [type]: [...(prev[type] || []), { id: item.name.toLowerCase().replace(/\s+/g, ""), ...item }] };
      } else if (action === "remove") {
        return { ...prev, [type]: (prev[type] || []).filter((i) => i.id !== item.id) };
      } else if (action === "update") {
        return { ...prev, ...item };
      }
      return prev;
    });
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
    const result = await payrollApi.runPayroll(data);
    // Refresh history for the processed month
    if (data.month && data.year) {
      await fetchPayrollHistory({ month: data.month, year: data.year });
    }
    return result;
  };

  const getPayrollForMonth = (month) =>
    Array.isArray(payrollHistory) ? payrollHistory.find((p) => p.month === month) : undefined;

  return {
    salarySettings,
    staffSalaries,
    payrollHistory,
    updateSalarySettings,
    updateStaffSalary,
    processPayroll,
    fetchPayrollHistory,
    getPayrollForMonth,
  };
}
