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
  const [editingSection, setEditingSection] = useState(null);
  const [tempRules, setTempRules] = useState(rules); // Temporary state for editing
  const [saving, setSaving] = useState(false);

  // Mock save with delay
  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setRules(tempRules); // Commit changes
      setSaving(false);
      setEditingSection(null);
    }, 800);
  };

  const handleCancel = () => {
    setTempRules(rules); // Revert
    setEditingSection(null);
  };

  // Sync tempRules when entering edit mode or when rules change
  if (editingSection === null && tempRules !== rules) {
    setTempRules(rules);
  }

  const SectionHeader = ({ title, section }) => (
    <div className="flex justify-between items-center py-4 px-4 bg-default-50/50 border-b border-default-100">
      <h3 className="text-sm font-semibold text-default-700">{title}</h3>
      {editingSection === section ? (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="light" color="danger" onPress={handleCancel} disabled={saving} className="h-8 min-w-0 px-2 text-xs">Cancel</Button>
          <Button size="sm" color="primary" onPress={handleSave} isLoading={saving} className="h-8 min-w-0 px-3 text-xs" startContent={!saving && <Save size={12} />}>
            Save
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="light" color="primary" onPress={() => { setTempRules(rules); setEditingSection(section); }} isDisabled={editingSection !== null} className="h-8 min-w-0 px-2 text-xs">
          Edit
        </Button>
      )}
    </div>
  );

  return (
    <div className="w-full flex flex-col space-y-4">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className={`shadow-sm border transition-all duration-200 ${editingSection === 'defaulter' ? 'border-primary ring-1 ring-primary' : 'border-default-200'}`}>
          <SectionHeader title="Defaulter Settings" section="defaulter" />
          <CardBody className="p-4 space-y-4">
            {editingSection === 'defaulter' ? (
              <Input
                size="sm"
                type="number"
                label="Defaulter Threshold (%)"
                value={tempRules.defaulterThreshold}
                onChange={(e) => setTempRules({ ...tempRules, defaulterThreshold: e.target.value })}
                description="Students below this % are marked as defaulters"
                variant="bordered"
              />
            ) : (
              <div className="flex justify-between items-center p-2">
                <span className="text-sm text-default-600">Threshold</span>
                <span className="text-lg font-bold text-default-900">{rules.defaulterThreshold}%</span>
              </div>
            )}
            <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
              <p className="text-xs text-warning-700 font-medium">
                Students with attendance below {editingSection === 'defaulter' ? tempRules.defaulterThreshold : rules.defaulterThreshold}% will be flagged as attendance defaulters.
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className={`shadow-sm border transition-all duration-200 ${editingSection === 'lock' ? 'border-primary ring-1 ring-primary' : 'border-default-200'}`}>
          <SectionHeader title="Lock Settings" section="lock" />
          <CardBody className="p-4 space-y-4">
            {editingSection === 'lock' ? (
              <Input
                size="sm"
                type="time"
                label="Auto-Lock Time"
                value={tempRules.lockTime}
                onChange={(e) => setTempRules({ ...tempRules, lockTime: e.target.value })}
                description="Attendance locked after this time"
                variant="bordered"
              />
            ) : (
              <div className="flex justify-between items-center p-2 border-b border-default-100">
                <span className="text-sm text-default-600">Auto-Lock Time</span>
                <span className="text-lg font-bold text-default-900">{rules.lockTime}</span>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-default-50 rounded-lg border border-default-200">
              <div>
                <p className="text-sm font-medium text-default-700">Allow Edit After Lock</p>
                <p className="text-xs text-default-500">Admins can edit locked attendance</p>
              </div>
              <Switch
                size="sm"
                isSelected={editingSection === 'lock' ? tempRules.allowEdit : rules.allowEdit}
                onValueChange={(v) => editingSection === 'lock' && setTempRules({ ...tempRules, allowEdit: v })}
                isDisabled={editingSection !== 'lock'}
              />
            </div>

            {(editingSection === 'lock' ? tempRules.allowEdit : rules.allowEdit) && (
              editingSection === 'lock' ? (
                <Select
                  size="sm"
                  label="Edit Window (hours)"
                  variant="bordered"
                  selectedKeys={[tempRules.editWindow.toString()]}
                  onChange={(e) => setTempRules({ ...tempRules, editWindow: parseInt(e.target.value) })}
                >
                  <SelectItem key="12" textValue="12 hours">12 hours</SelectItem>
                  <SelectItem key="24" textValue="24 hours">24 hours</SelectItem>
                  <SelectItem key="48" textValue="48 hours">48 hours</SelectItem>
                </Select>
              ) : (
                <div className="flex justify-between items-center p-2">
                  <span className="text-sm text-default-600">Edit Window</span>
                  <span className="text-sm font-semibold text-default-900">{rules.editWindow} hours</span>
                </div>
              )
            )}
          </CardBody>
        </Card>

        <Card className={`shadow-sm border transition-all duration-200 ${editingSection === 'notifications' ? 'border-primary ring-1 ring-primary' : 'border-default-200'}`}>
          <SectionHeader title="Notifications" section="notifications" />
          <CardBody className="p-4 space-y-4">
            <div className="flex items-center justify-between p-3 bg-default-50 rounded-lg border border-default-200">
              <div>
                <p className="text-sm font-medium text-default-700">Notify on Absence</p>
                <p className="text-xs text-default-500">Send SMS when absent</p>
              </div>
              <Switch
                size="sm"
                isSelected={editingSection === 'notifications' ? tempRules.notifyAbsent : rules.notifyAbsent}
                onValueChange={(v) => editingSection === 'notifications' && setTempRules({ ...tempRules, notifyAbsent: v })}
                isDisabled={editingSection !== 'notifications'}
              />
            </div>
            <Divider />
            <div className="flex items-center justify-between p-3 bg-default-50 rounded-lg border border-default-200">
              <div>
                <p className="text-sm font-medium text-default-700">Notify Defaulters</p>
                <p className="text-xs text-default-500">Weekly defaulter alert</p>
              </div>
              <Switch
                size="sm"
                isSelected={editingSection === 'notifications' ? tempRules.notifyDefaulter : rules.notifyDefaulter}
                onValueChange={(v) => editingSection === 'notifications' && setTempRules({ ...tempRules, notifyDefaulter: v })}
                isDisabled={editingSection !== 'notifications'}
              />
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
              <div key={item.role} className="flex items-center justify-between p-4 bg-default-50 rounded-lg border border-default-200">
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
