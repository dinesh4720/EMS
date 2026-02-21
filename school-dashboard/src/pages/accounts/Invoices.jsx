import { Card, CardBody, Button } from "@heroui/react";
import { FileText, Plus, Download, Search, Filter } from "lucide-react";

export default function Invoices() {
  const mockInvoices = [
    { id: "INV-001", client: "John Smith", amount: "₹15,000", date: "2024-02-18", status: "paid" },
    { id: "INV-002", client: "Jane Doe", amount: "₹22,500", date: "2024-02-17", status: "pending" },
    { id: "INV-003", client: "Acme Corp", amount: "₹45,000", date: "2024-02-16", status: "paid" },
    { id: "INV-004", client: "Tech Solutions", amount: "₹18,750", date: "2024-02-15", status: "overdue" },
    { id: "INV-005", client: "Global Systems", amount: "₹32,000", date: "2024-02-14", status: "paid" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoices..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="flat" size="sm" startContent={<Filter size={16} />}>
            Filter
          </Button>
          <Button variant="flat" size="sm" startContent={<Download size={16} />}>
            Export
          </Button>
          <Button color="primary" size="sm" startContent={<Plus size={16} />}>
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-gray-100">
          <CardBody className="p-4">
            <p className="text-sm text-gray-500">Total Invoices</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">156</p>
          </CardBody>
        </Card>
        <Card className="border border-gray-100">
          <CardBody className="p-4">
            <p className="text-sm text-gray-500">Paid Amount</p>
            <p className="text-2xl font-bold text-green-600 mt-1">₹18,45,000</p>
          </CardBody>
        </Card>
        <Card className="border border-gray-100">
          <CardBody className="p-4">
            <p className="text-sm text-gray-500">Pending Amount</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">₹3,85,000</p>
          </CardBody>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card className="border border-gray-100">
        <CardBody className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 border-b border-gray-100">
                  <th className="pb-3">Invoice ID</th>
                  <th className="pb-3">Client</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <FileText size={16} className="text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{invoice.id}</span>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-gray-700">{invoice.client}</td>
                    <td className="py-4 text-sm font-semibold text-gray-900">{invoice.amount}</td>
                    <td className="py-4 text-sm text-gray-600">{invoice.date}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        invoice.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : invoice.status === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700"
                      }`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
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