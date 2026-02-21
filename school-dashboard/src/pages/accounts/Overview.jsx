import { Card, CardBody } from "@heroui/react";
import { IndianRupee, TrendingUp, TrendingDown, FileText, Users, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function Overview() {
  // Mock data - in production this would come from API
  const stats = [
    {
      title: "Total Revenue",
      value: "₹24,50,000",
      change: "+12.5%",
      trend: "up",
      icon: IndianRupee,
      color: "bg-green-50 text-green-700",
      iconBg: "bg-green-100",
    },
    {
      title: "Pending Invoices",
      value: "₹3,85,000",
      change: "-8.2%",
      trend: "down",
      icon: FileText,
      color: "bg-amber-50 text-amber-700",
      iconBg: "bg-amber-100",
    },
    {
      title: "Total Expenses",
      value: "₹18,25,000",
      change: "+5.3%",
      trend: "up",
      icon: TrendingDown,
      color: "bg-rose-50 text-rose-700",
      iconBg: "bg-rose-100",
    },
    {
      title: "Payroll Due",
      value: "₹4,50,000",
      change: "0%",
      trend: "neutral",
      icon: Users,
      color: "bg-blue-50 text-blue-700",
      iconBg: "bg-blue-100",
    },
  ];

  const recentTransactions = [
    { id: 1, type: "income", description: "Fee Collection - Class 10-A", amount: "₹45,000", date: "2024-02-18", status: "completed" },
    { id: 2, type: "expense", description: "Office Supplies", amount: "₹12,500", date: "2024-02-17", status: "completed" },
    { id: 3, type: "income", description: "Fee Collection - Class 9-B", amount: "₹32,000", date: "2024-02-17", status: "completed" },
    { id: 4, type: "expense", description: "Salary Payment - Staff", amount: "₹2,50,000", date: "2024-02-15", status: "completed" },
    { id: 5, type: "income", description: "Fee Collection - Class 8-A", amount: "₹28,500", date: "2024-02-14", status: "pending" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <CardBody className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <div className={`flex items-center gap-1 mt-2 text-sm ${
                    stat.trend === "up" ? "text-green-600" : stat.trend === "down" ? "text-green-600" : "text-gray-500"
                  }`}>
                    {stat.trend === "up" && <ArrowUpRight size={14} />}
                    {stat.trend === "down" && <ArrowDownRight size={14} />}
                    <span>{stat.change}</span>
                    <span className="text-gray-400 ml-1">vs last month</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.iconBg}`}>
                  <stat.icon size={20} className={stat.color.replace("bg-", "").replace("text-", "")} />
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expenses Chart Placeholder */}
        <Card className="border border-gray-100 shadow-sm lg:col-span-2">
          <CardBody className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Income vs Expenses</h3>
                <p className="text-sm text-gray-500">Monthly financial overview</p>
              </div>
              <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
                <option>Last 6 months</option>
                <option>Last year</option>
                <option>All time</option>
              </select>
            </div>
            
            {/* Chart Placeholder */}
            <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200">
              <div className="text-center">
                <TrendingUp size={48} className="text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 font-medium">Financial Charts</p>
                <p className="text-sm text-gray-400">Charts will be rendered here</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <Card className="border border-gray-100 shadow-sm">
          <CardBody className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Create Invoice</p>
                  <p className="text-xs text-gray-500">Generate new invoice</p>
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <IndianRupee size={18} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Record Expense</p>
                  <p className="text-xs text-gray-500">Add new expense</p>
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Process Payroll</p>
                  <p className="text-xs text-gray-500">Process staff salaries</p>
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp size={18} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Generate Report</p>
                  <p className="text-xs text-gray-500">Create financial report</p>
                </div>
              </button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="border border-gray-100 shadow-sm">
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
              <p className="text-sm text-gray-500">Latest financial activities</p>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View All
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 border-b border-gray-100">
                  <th className="pb-3">Description</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          transaction.type === "income" ? "bg-green-100" : "bg-rose-100"
                        }`}>
                          {transaction.type === "income" ? (
                            <IndianRupee size={16} className="text-green-600" />
                          ) : (
                            <TrendingDown size={16} className="text-rose-600" />
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{transaction.description}</span>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-gray-600">{transaction.date}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        transaction.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className={`py-4 text-right text-sm font-semibold ${
                      transaction.type === "income" ? "text-green-600" : "text-rose-600"
                    }`}>
                      {transaction.type === "income" ? "+" : "-"}{transaction.amount}
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