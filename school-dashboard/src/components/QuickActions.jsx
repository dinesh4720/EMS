import { Card, CardBody, CardHeader, Button, Divider } from "@heroui/react";
import { Zap, CheckSquare, IndianRupee, Megaphone, AlertCircle, FileText } from "lucide-react";

export default function QuickActions({ onAction }) {
  const actions = [
    {
      icon: <CheckSquare size={20} />,
      label: "Mark Attendance",
      color: "primary",
      action: "attendance"
    },
    {
      icon: <IndianRupee size={20} />,
      label: "Collect Fee",
      color: "success",
      action: "collectFee"
    },
    {
      icon: <Megaphone size={20} />,
      label: "Send Announcement",
      color: "secondary",
      action: "announcement"
    },
    {
      icon: <AlertCircle size={20} />,
      label: "View Defaulters",
      color: "danger",
      action: "defaulters"
    },
    {
      icon: <FileText size={20} />,
      label: "Generate Report",
      color: "warning",
      action: "report"
    }
  ];

  return (
    <Card>
      <CardHeader className="flex gap-2 bg-warning-50 py-2 px-3">
        <Zap className="text-warning" size={18} />
        <h3 className="text-sm font-semibold">Quick Actions</h3>
      </CardHeader>
      <Divider />
      <CardBody className="p-3">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              color={action.color}
              variant="flat"
              size="sm"
              className="h-auto py-2 flex-col gap-1"
              onPress={() => onAction?.(action.action)}
            >
              {action.icon}
              <span className="text-[10px]">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
