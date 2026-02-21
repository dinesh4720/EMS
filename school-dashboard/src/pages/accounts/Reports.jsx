import { Card, CardBody, Button } from "@heroui/react";
import { PieChart, Download, FileText, TrendingUp, TrendingDown, Calendar } from "lucide-react";

export default function Reports() {
  const mockReports = [
    { id: "RPT-001", name: "Monthly Financial Summary", type: "Financial", generated: "2024-02-18", status: "completed" },
    { id: "RPT-002", name: "Expense Analysis Q1", type: "Expense", generated: "2024-02-15", status: "completed" },
    { id: "RPT-003", name: "Revenue Report", type: "Revenue", generated: "2024-02-10", status: "completed" },
    { id: "RPT-004", name: "Payroll Summary", type: "Payroll", generated: "2024-02-08", status: "processing" },
    { id: "RPT-005", name: "Annual Budget Review", type: "Budget", generated: "2024-02-01", status: "completed" },
  ];

  const quickStats = [
    { label: "Total Reports", value: "156", icon: FileText, color: "bg-blue-100 text-blue-700" },
    { label: "Revenue Growth", value: "+12.5%", icon: TrendingUp, color: "bg-green-100 text-green-700" },
    { label: "Expense Reduction", value: "-5.2%", icon: TrendingDown, color: "bg-rose-100 text-rose-700" },
  ];

  const reportTypes = [
    { name: "Financial Summary", description: "Complete financial overview" },
    { name: "Revenue Report", description: "Income and revenue analysis" },
    { name: "Expense Analysis", description: "Detailed expense breakdown" },
    { name: "Payroll Report", description: "Staff salary details" },
    { name: "Budget Report", description: "Budget vs actual comparison" },
    { name: "Cash Flow Statement", description: "Cash flow tracking" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search reports..."
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="flat" size="sm" startContent={<Calendar size={16} />}>
            Date Range
          </Button>
          <Button color="primary" size="sm" startContent={<FileText size={16} />}>
            Generate Report
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickStats.map((stat) => (
          <Card key={stat.label} className="border border-gray-100">
            <CardBody className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color.split(' ')[0]}`}>
                  <stat.icon size={20} className={stat.color.split(' ')[1]} />
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Types */}
        <Card className="border border-gray-100 lg:col-span-1">
          <CardBody className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Types</h3>
            <div className="space-y-3">
              {reportTypes.map((type) => (
                <button
                  key={type.name}
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">{type.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Recent Reports */}
        <Card className="border border-gray-100 lg:col-span-2">
          <CardBody className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 border-b border-gray-100">
                    <th className="pb-3">Report ID</th>
                    <th className="pb-3">Report Name</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Generated</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockReports.map((report) => (
                    <tr key={report.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-purple-50 rounded-lg">
                            <PieChart size={16} className="text-purple-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{report.id}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <p className="text-sm font-medium text-gray-900">{report.name}</p>
                      </td>
                      <td className="py-4 text-sm text-gray-600">{report.type}</td>
                      <td className="py-4 text-sm text-gray-600">{report.generated}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          report.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <Button variant="light" size="sm" startContent={<Download size={14} />}>
                          Download
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Scheduled Reports */}
      <Card className="border border-gray-100">
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Scheduled Reports</h3>
            <Button variant="flat" size="sm">Add Schedule</Button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Monthly Financial Summary</p>
                <p className="text-xs text-gray-500">Every 1st of the month at 9:00 AM</p>
              </div>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Active</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Weekly Expense Analysis</p>
                <p className="text-xs text-gray-500">Every Friday at 5:00 PM</p>
              </div>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Active</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Quarterly Revenue Report</p>
                <p className="text-xs text-gray-500">Every quarter end</p>
              </div>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Active</span>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}