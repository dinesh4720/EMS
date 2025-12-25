import { useState } from "react";
import { Card, CardBody, CardHeader, Button, Input, Switch, Divider, Select, SelectItem } from "@heroui/react";
import { Save } from "lucide-react";

export default function AttendanceRules() {
  const [rules, setRules] = useState({
    defaulterThreshold: 75,
    lockTime: "16:00",
    allowEdit: true,
    editWindow: 24,
    notifyAbsent: true,
    notifyDefaulter: true
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Button color="primary" size="sm" startContent={<Save size={14} />}>Save Changes</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-sm border border-default-200 rounded-2xl">
          <CardHeader className="py-4 px-4 bg-default-50/50 border-b border-default-100">
            <h3 className="text-sm font-semibold text-default-700">Defaulter Settings</h3>
          </CardHeader>
          <CardBody className="p-4 space-y-4">
            <Input
              size="sm"
              type="number"
              label="Defaulter Threshold (%)"
              value={rules.defaulterThreshold}
              onChange={(e) => setRules({ ...rules, defaulterThreshold: e.target.value })}
              description="Students below this attendance % are marked as defaulters"
              variant="faded"
            />
            <div className="p-4 bg-warning-50 rounded-xl border border-warning-100">
              <p className="text-xs text-warning-700 font-medium">Students with attendance below {rules.defaulterThreshold}% will be flagged as attendance defaulters.</p>
            </div>
          </CardBody>
        </Card>

        <Card className="shadow-sm border border-default-200 rounded-2xl">
          <CardHeader className="py-4 px-4 bg-default-50/50 border-b border-default-100">
            <h3 className="text-sm font-semibold text-default-700">Lock Settings</h3>
          </CardHeader>
          <CardBody className="p-4 space-y-4">
            <Input
              size="sm"
              type="time"
              label="Auto-Lock Time"
              value={rules.lockTime}
              onChange={(e) => setRules({ ...rules, lockTime: e.target.value })}
              description="Attendance will be locked after this time"
              variant="faded"
            />
            <div className="flex items-center justify-between p-1">
              <div>
                <p className="text-sm font-medium text-default-700">Allow Edit After Lock</p>
                <p className="text-tiny text-default-500">Admins can edit locked attendance</p>
              </div>
              <Switch size="sm" isSelected={rules.allowEdit} onValueChange={(v) => setRules({ ...rules, allowEdit: v })} />
            </div>
            {rules.allowEdit && (
              <Select size="sm" label="Edit Window (hours)" variant="faded" selectedKeys={[rules.editWindow.toString()]} onChange={(e) => setRules({ ...rules, editWindow: parseInt(e.target.value) })}>
                <SelectItem key="12" textValue="12 hours">12 hours</SelectItem>
                <SelectItem key="24" textValue="24 hours">24 hours</SelectItem>
                <SelectItem key="48" textValue="48 hours">48 hours</SelectItem>
              </Select>
            )}
          </CardBody>
        </Card>

        <Card className="shadow-sm border border-default-200 rounded-2xl">
          <CardHeader className="py-4 px-4 bg-default-50/50 border-b border-default-100">
            <h3 className="text-sm font-semibold text-default-700">Notifications</h3>
          </CardHeader>
          <CardBody className="p-4 space-y-4">
            <div className="flex items-center justify-between p-1">
              <div>
                <p className="text-sm font-medium text-default-700">Notify on Absence</p>
                <p className="text-tiny text-default-500">Send SMS to parents when student is absent</p>
              </div>
              <Switch size="sm" isSelected={rules.notifyAbsent} onValueChange={(v) => setRules({ ...rules, notifyAbsent: v })} />
            </div>
            <Divider className="my-1" />
            <div className="flex items-center justify-between p-1">
              <div>
                <p className="text-sm font-medium text-default-700">Notify Defaulters</p>
                <p className="text-tiny text-default-500">Weekly notification to parents of defaulters</p>
              </div>
              <Switch size="sm" isSelected={rules.notifyDefaulter} onValueChange={(v) => setRules({ ...rules, notifyDefaulter: v })} />
            </div>
          </CardBody>
        </Card>

        <Card className="shadow-sm border border-default-200 rounded-2xl">
          <CardHeader className="py-4 px-4 bg-default-50/50 border-b border-default-100">
            <h3 className="text-sm font-semibold text-default-700">Edit Permissions</h3>
          </CardHeader>
          <CardBody className="p-4 space-y-2">
            {[
              { role: "Super Admin", canMark: true, canEdit: true, canLock: true },
              { role: "Admin", canMark: true, canEdit: true, canLock: true },
              { role: "Teacher", canMark: true, canEdit: false, canLock: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-default-50 rounded-xl border border-default-100">
                <span className="text-sm font-medium text-default-800">{item.role}</span>
                <div className="flex gap-2 text-xs font-medium">
                  <span className={item.canMark ? "text-success bg-success-50 px-2 py-0.5 rounded-md" : "text-default-400 opacity-50"}>Mark</span>
                  <span className={item.canEdit ? "text-success bg-success-50 px-2 py-0.5 rounded-md" : "text-default-400 opacity-50"}>Edit</span>
                  <span className={item.canLock ? "text-success bg-success-50 px-2 py-0.5 rounded-md" : "text-default-400 opacity-50"}>Lock</span>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
