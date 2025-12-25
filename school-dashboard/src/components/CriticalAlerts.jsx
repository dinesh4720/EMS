import { Card, CardBody, CardHeader, Chip, Divider } from "@heroui/react";
import { AlertTriangle, Users, IndianRupee, ClipboardCheck, ArrowRight } from "lucide-react";

export default function CriticalAlerts({ data }) {
  const alerts = [
    {
      icon: <Users size={18} />,
      label: "Pending Staff Attendance",
      value: data.pendingStaffAttendance,
      color: "warning",
      desc: "Requires immediate attention"
    },
    {
      icon: <Users size={18} />,
      label: "Pending Student Attendance",
      value: data.pendingStudentAttendance,
      color: "warning",
      desc: "Update before 10:00 AM"
    },
    {
      icon: <ClipboardCheck size={18} />,
      label: "Pending Approvals",
      value: data.pendingApprovals,
      color: "secondary",
      desc: "Review required"
    }
  ];

  return (
    <Card className="shadow-sm border border-default-200 bg-content1/50 backdrop-blur-sm rounded-2xl">
      <CardHeader className="flex gap-3 px-5 py-4">
        <div className="p-1.5 bg-danger/10 rounded-lg text-danger animate-pulse">
          <AlertTriangle size={18} />
        </div>
        <div>
          <h3 className="text-base font-medium text-default-900">Action Required</h3>
          <p className="text-tiny text-default-500">Items requiring your immediate attention</p>
        </div>
      </CardHeader>
      <Divider className="bg-default-200" />
      <CardBody className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className="group flex flex-col p-3 rounded-xl border border-default-200 hover:border-danger-300 hover:bg-danger-50/10 cursor-pointer transition-all bg-background/50"
            >
              <div className="flex justify-between items-start">
                <div className={`p-1.5 rounded-md bg-${alert.color}/10 text-${alert.color}`}>
                  {alert.icon}
                </div>
                <Chip size="sm" color={alert.color} variant="flat" className="font-medium">
                  {alert.value}
                </Chip>
              </div>
              <p className="text-sm font-medium text-default-900 mt-2">{alert.label}</p>
              <div className="flex justify-between items-center mt-1">
                <p className="text-[10px] text-default-500 font-medium uppercase tracking-wide">{alert.desc}</p>
                <ArrowRight size={14} className="text-default-400 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
