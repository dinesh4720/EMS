import { Card, CardBody, CardHeader, Progress, Chip, Divider } from "@heroui/react";
import { TrendingUp, Target, UserPlus, UserMinus } from "lucide-react";

export default function QuickStats({ data }) {
  const feeProgress = Math.round((data.monthlyFeeCollected / data.monthlyFeeTarget) * 100);

  return (
    <Card className="shadow-sm border border-default-200 bg-content1/50 backdrop-blur-sm rounded-md">
      <CardHeader className="flex gap-3 px-5 py-4">
        <div className="p-1.5 bg-success/10 rounded text-success">
          <TrendingUp size={18} />
        </div>
        <div className="flex flex-col">
          <p className="text-base font-medium text-default-900">Quick Stats</p>
          <p className="text-tiny text-default-500">Weekly performance metrics</p>
        </div>
      </CardHeader>
      <Divider className="bg-default-200" />
      <CardBody className="p-5 gap-5">
        <div className="p-4 rounded-md border border-default-200 bg-background/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                <Target size={16} />
              </div>
              <span className="text-sm font-medium text-default-600">Monthly Fee Collection</span>
            </div>
            <Chip size="sm" color={feeProgress >= 80 ? "success" : "warning"} variant="flat" className="font-medium">
              {feeProgress}%
            </Chip>
          </div>
          <Progress
            aria-label="Monthly fee collection progress"
            size="sm"
            radius="md"
            value={feeProgress}
            color={feeProgress >= 80 ? "success" : "warning"}
            className="mb-3"
            classNames={{
              indicator: "bg-gradient-to-r"
            }}
          />
          <div className="flex justify-between text-xs text-default-500 font-medium">
            <span>Collected: <span className="text-default-900">₹{data.monthlyFeeCollected.toLocaleString()}</span></span>
            <span>Target: <span className="text-default-900">₹{data.monthlyFeeTarget.toLocaleString()}</span></span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 rounded-md border border-default-200 bg-background/50 text-center hover:border-default-300 transition-colors">
            <p className="text-xl font-medium text-primary tracking-tight">{data.avgAttendance}%</p>
            <p className="text-[10px] font-medium text-default-500 uppercase tracking-wide mt-1">Avg Dept</p>
          </div>
          <div className="p-3 rounded-md border border-default-200 bg-background/50 text-center hover:border-default-300 transition-colors">
            <div className="flex items-center justify-center gap-1">
              <UserPlus size={14} className="text-success" />
              <p className="text-xl font-medium text-success tracking-tight">{data.newAdmissions}</p>
            </div>
            <p className="text-[10px] font-medium text-default-500 uppercase tracking-wide mt-1">New Admins</p>
          </div>
          <div className="p-3 rounded-md border border-default-200 bg-background/50 text-center hover:border-default-300 transition-colors">
            <div className="flex items-center justify-center gap-1">
              <UserMinus size={14} className="text-warning" />
              <p className="text-xl font-medium text-warning tracking-tight">{data.staffOnLeave}</p>
            </div>
            <p className="text-[10px] font-medium text-default-500 uppercase tracking-wide mt-1">On Leave</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
