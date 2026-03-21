import { Card, CardBody, Button, Progress } from "@heroui/react";
import { Users, Plus, Search, Filter, Wallet, Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function Payroll() {
  const mockPayroll = [
    { id: "PAY-001", employee: "John Smith", role: "Teacher", amount: "₹45,000", status: "paid", date: "2024-02-15" },
    { id: "PAY-002", employee: "Jane Doe", role: "Admin", amount: "₹35,000", status: "paid", date: "2024-02-15" },
    { id: "PAY-003", employee: "Mike Johnson", role: "Teacher", amount: "₹42,000", status: "pending", date: "2024-02-28" },
    { id: "PAY-004", employee: "Sarah Wilson", role: "Staff", amount: "₹28,000", status: "pending", date: "2024-02-28" },
    { id: "PAY-005", employee: "David Brown", role: "Teacher", amount: "₹48,000", status: "processing", date: "2024-02-28" },
  ];

  const payrollSummary = [
    { label: "Total Payroll", value: "₹4,50,000", icon: Wallet, color: "bg-blue-100 text-blue-700" },
    { label: "Paid This Month", value: "₹2,85,000", icon: CheckCircle, color: "bg-green-100 text-green-700" },
    { label: "Pending Payment", value: "₹1,65,000", icon: Clock, color: "bg-amber-100 text-amber-700" },
    { label: "Overdue", value: "₹0", icon: AlertCircle, color: "bg-rose-100 text-rose-700" },
  ];

  const upcomingPayslips = [
    { employee: "Mike Johnson", amount: "₹42,000", dueDate: "Feb 28, 2024", daysLeft: 10 },
    { employee: "Sarah Wilson", amount: "₹28,000", dueDate: "Feb 28, 2024", daysLeft: 10 },
    { employee: "David Brown", amount: "₹48,000", dueDate: "Feb 28, 2024", daysLeft: 10 },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search payroll records..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-zinc-800 rounded-lg text-sm bg-white dark:bg-zinc-950 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="flat" size="sm" startContent={<Filter size={16} />}>
            Filter
          </Button>
          <Button color="primary" size="sm" startContent={<Plus size={16} />}>
            Process Payroll
          </Button>
        </div>
      </div>

      {/* Payroll Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {payrollSummary.map((summary) => (
          <Card key={summary.label} className="border border-gray-100 dark:border-zinc-800">
            <CardBody className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-zinc-400">{summary.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mt-1">{summary.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${summary.color.split(' ')[0]}`}>
                  <summary.icon size={20} className={summary.color.split(' ')[1]} />
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payroll Progress */}
        <Card className="border border-gray-100 dark:border-zinc-800 lg:col-span-1">
          <CardBody className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Monthly Progress</h3>
              <Calendar size={18} className="text-gray-400 dark:text-zinc-500" />
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">Completed</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">65%</span>
                </div>
                <Progress value={65} color="success" className="h-2" />
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">₹2,85,000 of ₹4,50,000</p>
              </div>
              <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">Pending</span>
                  <span className="text-sm font-semibold text-amber-600">35%</span>
                </div>
                <Progress value={35} color="warning" className="h-2" />
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">₹1,65,000 remaining</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Upcoming Payments */}
        <Card className="border border-gray-100 dark:border-zinc-800 lg:col-span-2">
          <CardBody className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-4">Upcoming Payments</h3>
            <div className="space-y-3">
              {upcomingPayslips.map((payslip) => (
                <div key={payslip._id || `${payslip.employee}-${payslip.dueDate}`} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Users size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{payslip.employee}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">Due: {payslip.dueDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{payslip.amount}</p>
                      <p className="text-xs text-amber-600">{payslip.daysLeft} days left</p>
                    </div>
                    <Button variant="flat" size="sm">Process</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Payroll Records Table */}
      <Card className="border border-gray-100 dark:border-zinc-800">
        <CardBody className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-4">Payroll Records</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 dark:text-zinc-400 border-b border-gray-100 dark:border-zinc-800">
                  <th className="pb-3">Payroll ID</th>
                  <th className="pb-3">Employee</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockPayroll.map((record) => (
                  <tr key={record.id} className="border-b border-gray-50 dark:border-zinc-800 last:border-0 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-50 rounded-lg">
                          <Wallet size={16} className="text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{record.id}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-zinc-700 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600 dark:text-zinc-400">
                            {record.employee.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="text-sm text-gray-700 dark:text-zinc-300">{record.employee}</span>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-gray-600 dark:text-zinc-400">{record.role}</td>
                    <td className="py-4 text-sm font-semibold text-gray-900 dark:text-zinc-100">{record.amount}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        record.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : record.status === "processing"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-gray-600 dark:text-zinc-400">{record.date}</td>
                    <td className="py-4 text-right">
                      <Button variant="light" size="sm">View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
