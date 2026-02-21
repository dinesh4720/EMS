import { Card, CardBody, Button } from "@heroui/react";
import { Briefcase, Plus, Search, Filter, TrendingDown } from "lucide-react";

export default function Expenses() {
  const mockExpenses = [
    { id: "EXP-001", category: "Office Supplies", amount: "₹12,500", date: "2024-02-18", status: "approved" },
    { id: "EXP-002", category: "Utilities", amount: "₹8,750", date: "2024-02-17", status: "approved" },
    { id: "EXP-003", category: "Maintenance", amount: "₹25,000", date: "2024-02-16", status: "pending" },
    { id: "EXP-004", category: "Transportation", amount: "₹15,200", date: "2024-02-15", status: "approved" },
    { id: "EXP-005", category: "Equipment", amount: "₹45,000", date: "2024-02-14", status: "pending" },
  ];

  const categoryData = [
    { name: "Office Supplies", amount: "₹1,25,000", percentage: 35 },
    { name: "Utilities", amount: "₹85,000", percentage: 24 },
    { name: "Maintenance", amount: "₹65,000", percentage: 18 },
    { name: "Transportation", amount: "₹55,000", percentage: 15 },
    { name: "Equipment", amount: "₹26,000", percentage: 8 },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search expenses..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="flat" size="sm" startContent={<Filter size={16} />}>
            Filter
          </Button>
          <Button color="primary" size="sm" startContent={<Plus size={16} />}>
            Add Expense
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-gray-100">
          <CardBody className="p-4">
            <p className="text-sm text-gray-500">Total Expenses</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">₹3,56,000</p>
          </CardBody>
        </Card>
        <Card className="border border-gray-100">
          <CardBody className="p-4">
            <p className="text-sm text-gray-500">This Month</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">₹85,000</p>
          </CardBody>
        </Card>
        <Card className="border border-gray-100">
          <CardBody className="p-4">
            <p className="text-sm text-gray-500">Pending Approval</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">₹70,000</p>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expense by Category */}
        <Card className="border border-gray-100 lg:col-span-1">
          <CardBody className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense by Category</h3>
            <div className="space-y-4">
              {categoryData.map((category) => (
                <div key={category.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{category.name}</span>
                    <span className="text-sm font-semibold text-gray-900">{category.amount}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Recent Expenses */}
        <Card className="border border-gray-100 lg:col-span-2">
          <CardBody className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Expenses</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 border-b border-gray-100">
                    <th className="pb-3">Expense ID</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mockExpenses.map((expense) => (
                    <tr key={expense.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-rose-50 rounded-lg">
                            <Briefcase size={16} className="text-rose-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{expense.id}</span>
                        </div>
                      </td>
                      <td className="py-4 text-sm text-gray-700">{expense.category}</td>
                      <td className="py-4 text-sm font-semibold text-rose-600">{expense.amount}</td>
                      <td className="py-4 text-sm text-gray-600">{expense.date}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          expense.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}