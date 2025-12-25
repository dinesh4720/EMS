import { useState } from "react";
import { Card, CardBody, CardHeader, Button, Input, Divider, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip } from "@heroui/react";
import { Download, Calendar, TrendingUp } from "lucide-react";

export default function FeeReports() {
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  const dailyCollection = [
    { id: 1, date: "2024-12-16", cash: 45000, cheque: 20000, online: 15000, total: 80000 },
    { id: 2, date: "2024-12-15", cash: 38000, cheque: 25000, online: 12000, total: 75000 },
    { id: 3, date: "2024-12-14", cash: 52000, cheque: 18000, online: 20000, total: 90000 },
    { id: 4, date: "2024-12-13", cash: 41000, cheque: 22000, online: 17000, total: 80000 },
  ];

  const totalCollection = dailyCollection.reduce((sum, d) => sum + d.total, 0);

  return (
    <div className="space-y-3">
      <div className="flex justify-end mb-3">
        <Button size="sm" variant="flat" startContent={<Download size={14} />}>Export Report</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card shadow="sm" className="bg-success-50/50 border border-success-100">
          <CardBody className="p-4">
            <p className="text-sm font-medium text-success-600 mb-1">Today's Collection</p>
            <p className="text-2xl font-bold text-success-700">₹3,25,000</p>
          </CardBody>
        </Card>
        <Card shadow="sm" className="bg-primary-50/50 border border-primary-100">
          <CardBody className="p-4">
            <p className="text-sm font-medium text-primary-600 mb-1">This Week</p>
            <p className="text-2xl font-bold text-primary-700">₹12,50,000</p>
          </CardBody>
        </Card>
        <Card shadow="sm" className="bg-secondary-50/50 border border-secondary-100">
          <CardBody className="p-4">
            <p className="text-sm font-medium text-secondary-600 mb-1">This Month</p>
            <p className="text-2xl font-bold text-secondary-700">₹48,50,000</p>
          </CardBody>
        </Card>
        <Card shadow="sm" className="bg-danger-50/50 border border-danger-100">
          <CardBody className="p-4">
            <p className="text-sm font-medium text-danger-600 mb-1">Total Pending</p>
            <p className="text-2xl font-bold text-danger-700">₹8,75,000</p>
          </CardBody>
        </Card>
      </div>

      <Card className="shadow-sm border border-default-200 rounded-2xl">
        <CardHeader className="py-3 px-4 bg-default-50/50 border-b border-default-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary-100 text-primary rounded-lg">
              <Calendar size={18} />
            </div>
            <h3 className="text-sm font-semibold text-default-700">Daily Collection Report</h3>
          </div>
        </CardHeader>
        <CardBody className="p-4">
          <div className="flex gap-2 mb-4">
            <Input type="date" size="sm" label="From" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[150px]" variant="faded" />
            <Input type="date" size="sm" label="To" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[150px]" variant="faded" />
            <Button size="sm" color="primary" className="h-[48px]">Generate</Button>
          </div>

          <Table
            aria-label="Daily collection"
            radius="none"
            isStriped={false}
            removeWrapper
            classNames={{
              table: "w-full",
              th: "bg-transparent text-default-500 font-semibold text-xs uppercase tracking-wider h-12 border-b border-default-200",
              td: "py-4 border-b border-default-100",
              tr: "transition-opacity hover:bg-default-50/30",
              wrapper: "p-0"
            }}
          >
            <TableHeader>
              <TableColumn>DATE</TableColumn>
              <TableColumn>CASH</TableColumn>
              <TableColumn>CHEQUE</TableColumn>
              <TableColumn>ONLINE</TableColumn>
              <TableColumn>TOTAL</TableColumn>
            </TableHeader>
            <TableBody>
              {dailyCollection.map((item) => (
                <TableRow key={item.id} className="hover:bg-default-50 transition-colors">
                  <TableCell className="font-medium text-default-700">{item.date}</TableCell>
                  <TableCell className="text-default-600">₹{item.cash.toLocaleString()}</TableCell>
                  <TableCell className="text-default-600">₹{item.cheque.toLocaleString()}</TableCell>
                  <TableCell className="text-default-600">₹{item.online.toLocaleString()}</TableCell>
                  <TableCell className="font-bold text-success-600">₹{item.total.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-end mt-4 pt-4 border-t border-default-100">
            <div className="flex bg-success-50 px-3 py-1.5 rounded-lg border border-success-100">
              <span className="text-sm font-medium text-success-700">Total Collected: <span className="font-bold text-lg ml-1">₹{totalCollection.toLocaleString()}</span></span>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="shadow-sm border border-default-200 rounded-2xl">
        <CardHeader className="py-3 px-4 bg-default-50/50 border-b border-default-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-warning-50 text-warning-600 rounded-lg">
              <TrendingUp size={18} />
            </div>
            <h3 className="text-sm font-semibold text-default-700">Pending Summary</h3>
          </div>
        </CardHeader>
        <CardBody className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-default-50 rounded-xl border border-default-100 text-center">
              <p className="text-2xl font-bold text-default-800">45</p>
              <p className="text-tiny text-default-500 font-medium uppercase mt-1">Students Pending</p>
            </div>
            <div className="p-4 bg-warning-50/50 rounded-xl border border-warning-100 text-center">
              <p className="text-2xl font-bold text-warning-600">₹2.5L</p>
              <p className="text-tiny text-warning-600/70 font-medium uppercase mt-1">0-7 Days</p>
            </div>
            <div className="p-4 bg-danger-50/30 rounded-xl border border-danger-100/50 text-center">
              <p className="text-2xl font-bold text-danger-600">₹3.25L</p>
              <p className="text-tiny text-danger-600/70 font-medium uppercase mt-1">7-30 Days</p>
            </div>
            <div className="p-4 bg-danger-50 rounded-xl border border-danger-100 text-center">
              <p className="text-2xl font-bold text-danger-700">₹3.0L</p>
              <p className="text-tiny text-danger-700/70 font-medium uppercase mt-1">&gt;30 Days</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
