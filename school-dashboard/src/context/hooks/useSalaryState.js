import { useState } from "react";

// TODO [AUDIT-156]: This entire hook is LOCAL-ONLY — all salary state is held
// in React state and is lost on page refresh. There is no backend persistence.
//
// The backend *does* have payroll endpoints (see payrollApi in services/api/fees.js):
//   - GET  /payroll/dashboard/:month/:year
//   - POST /payroll/run
//   - POST /payroll/records/bulk-pay
//   - etc.
//
// This hook was likely a prototype/placeholder. It should be replaced with
// React Query hooks that call the payroll API, or removed entirely if
// the payroll pages already use payrollApi directly.
//
// Until then, consumers of this hook (StaffContext) should be aware that:
//   1. salarySettings, staffSalaries, payrollHistory are ephemeral
//   2. processPayroll() does NOT call the backend — it only updates local state
//   3. Data will be empty after every page reload

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
  // TODO [AUDIT-156]: Replace local state with React Query hooks backed by payroll API
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

  // TODO [AUDIT-156]: This does NOT call the backend payroll API.
  // It only creates a local record that will be lost on refresh.
  // Replace with: payrollApi.runPayroll({ month, staffList })
  const processPayroll = (month, staffList) => {
    const newRecord = {
      id: Date.now(),
      month,
      totalStaff: staffList.length,
      totalPayout: staffList.reduce((acc, curr) => acc + curr.netSalary, 0),
      status: "completed",
      date: new Date().toISOString().split("T")[0],
      details: staffList,
    };
    setPayrollHistory((prev) => [newRecord, ...prev]);
    return newRecord;
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
    getPayrollForMonth,
  };
}
