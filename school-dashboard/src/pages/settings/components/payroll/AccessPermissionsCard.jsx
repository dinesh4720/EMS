import { Card, CardBody, Chip } from "@heroui/react";
import { Shield, Lock } from "lucide-react";

const ACCESS_ROLES = [
  {
    role: "Admin",
    access: "Full Access",
    color: "success",
    desc: "Run, approve, reverse payroll",
  },
  {
    role: "Accountant",
    access: "View & Run",
    color: "primary",
    desc: "Run payroll, view records",
  },
  {
    role: "Teacher",
    access: "View Own",
    color: "warning",
    desc: "View own payslips only",
  },
  {
    role: "Staff",
    access: "View Own",
    color: "warning",
    desc: "View own payslips only",
  },
];

export default function AccessPermissionsCard() {
  return (
    <Card className="shadow-sm border border-border-token">
      <CardBody className="p-6">
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-danger/10 text-danger">
              <Shield size={22} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-fg">
                Access & Permissions
              </h3>
              <p className="text-xs text-fg-muted mt-0.5">
                Who can view and manage payroll
              </p>
            </div>
          </div>
          <Chip size="sm" variant="flat" color="default" startContent={<Lock size={12} />}>
            System Managed
          </Chip>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ACCESS_ROLES.map((item) => (
            <div
              key={item.role}
              className="p-3.5 rounded-xl border border-divider bg-surface-2/50"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-fg">
                  {item.role}
                </span>
                <Chip size="sm" color={item.color} variant="flat">
                  {item.access}
                </Chip>
              </div>
              <p className="text-xs text-fg-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
