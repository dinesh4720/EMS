import { useState } from "react";

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
