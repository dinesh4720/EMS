import { useState } from "react";
import { Card, CardBody, CardHeader, Button, Input, Switch, Divider, Select, SelectItem, Spinner } from "@heroui/react";
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
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // API call will be added in Phase 2
      await new Promise(resolve => setTimeout(resolve, 500));
      // Show success notification
    } catch (error) {
      console.error('Failed to save attendance rules:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full flex flex-col">
      <div className="flex justify-end mb-6">
        <Button 
          color="primary" 
          size="sm" 
          startContent={<Save size={16} />}
          onPress={handleSave}
          isLoading={saving}
          className="transition-all duration-200"
        >
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-sm border border-default-200 rounded-lg">
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
              variant="bordered"
            />
            <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
              <p className="text-xs text-warning-700 font-medium">
                Students with attendance below {rules.defaulterThreshold}% will be flagged as attendance defaulters.
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="shadow-sm border border-default-200 rounded-lg">
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
              variant="bordered"
            />
            <div className="flex items-center justify-between p-3 bg-default-50 rounded-lg border border-default-200">
              <div>
                <p className="text-sm font-medium text-default-700">Allow Edit After Lock</p>
                <p className="text-xs text-default-500">Admins can edit locked attendance</p>
              </div>
              <Switch size="sm" isSelected={rules.allowEdit} onValueChange={(v) => setRules({ ...rules, allowEdit: v })} />
            </div>
            {rules.allowEdit && (
              <Select 
                size="sm" 
                label="Edit Window (hours)" 
                variant="bordered" 
                selectedKeys={[rules.editWindow.toString()]} 
                onChange={(e) => setRules({ ...rules, editWindow: parseInt(e.target.value) })}
              >
                <SelectItem key="12" textValue="12 hours">12 hours</SelectItem>
                <SelectItem key="24" textValue="24 hours">24 hours</SelectItem>
                <SelectItem key="48" textValue="48 hours">48 hours</SelectItem>
              </Select>
            )}
          </CardBody>
        </Card>

        <Card className="shadow-sm border border-default-200 rounded-lg">
          <CardHeader className="py-4 px-4 bg-default-50/50 border-b border-default-100">
            <h3 className="text-sm font-semibold text-default-700">Notifications</h3>
          </CardHeader>
          <CardBody className="p-4 space-y-4">
            <div className="flex items-center justify-between p-3 bg-default-50 rounded-lg border border-default-200">
              <div>
                <p className="text-sm font-medium text-default-700">Notify on Absence</p>
                <p className="text-xs text-default-500">Send SMS to parents when student is absent</p>
              </div>
              <Switch size="sm" isSelected={rules.notifyAbsent} onValueChange={(v) => setRules({ ...rules, notifyAbsent: v })} />
            </div>
            <Divider />
            <div className="flex items-center justify-between p-3 bg-default-50 rounded-lg border border-default-200">
              <div>
                <p className="text-sm font-medium text-default-700">Notify Defaulters</p>
                <p className="text-xs text-default-500">Weekly notification to parents of defaulters</p>
              </div>
              <Switch size="sm" isSelected={rules.notifyDefaulter} onValueChange={(v) => setRules({ ...rules, notifyDefaulter: v })} />
            </div>
          </CardBody>
        </Card>

        <Card className="shadow-sm border border-default-200 rounded-lg">
          <CardHeader className="py-4 px-4 bg-default-50/50 border-b border-default-100">
            <h3 className="text-sm font-semibold text-default-700">Edit Permissions</h3>
          </CardHeader>
          <CardBody className="p-4 space-y-3">
            {[
              { role: "Super Admin", canMark: true, canEdit: true, canLock: true },
              { role: "Admin", canMark: true, canEdit: true, canLock: true },
              { role: "Teacher", canMark: true, canEdit: false, canLock: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-default-50 rounded-lg border border-default-200">
                <span className="text-sm font-medium text-default-800">{item.role}</span>
                <div className="flex gap-2 text-xs font-medium">
                  <span className={item.canMark ? "text-success-700 bg-success-50 px-2 py-1 rounded-md border border-success-200" : "text-default-400 opacity-50"}>
                    Mark
                  </span>
                  <span className={item.canEdit ? "text-success-700 bg-success-50 px-2 py-1 rounded-md border border-success-200" : "text-default-400 opacity-50"}>
                    Edit
                  </span>
                  <span className={item.canLock ? "text-success-700 bg-success-50 px-2 py-1 rounded-md border border-success-200" : "text-default-400 opacity-50"}>
                    Lock
                  </span>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
