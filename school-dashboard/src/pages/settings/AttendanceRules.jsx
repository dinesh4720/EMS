import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardBody, CardHeader, Button, Input, Switch, Divider, Select, SelectItem, Spinner } from "@heroui/react";
import { Save, AlertCircle } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { settingsApi } from "../../services/api";

const DEFAULT_PERMISSIONS = [
  { role: "Super Admin", canMark: true, canEdit: true, canLock: true },
  { role: "Admin", canMark: true, canEdit: true, canLock: true },
  { role: "Teacher", canMark: true, canEdit: false, canLock: false },
];

const DEFAULT_RULES = {
  defaulterThreshold: 75,
  lockTime: "16:00",
  allowEdit: true,
  editWindow: 24,
  notifyAbsent: true,
  notifyDefaulter: true,
  lateWeight: 100,
  permissions: DEFAULT_PERMISSIONS,
};

export default function AttendanceRules() {
  const { t } = useTranslation();
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [editingSection, setEditingSection] = useState(null);
  const [tempRules, setTempRules] = useState(DEFAULT_RULES);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);
  const saveMessageTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (saveMessageTimeoutRef.current) clearTimeout(saveMessageTimeoutRef.current);
    };
  }, []);

  // Fetch attendance rules from backend on mount
  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await settingsApi.getAttendanceRules();
      const merged = { ...DEFAULT_RULES, ...data };
      setRules(merged);
      setTempRules(merged);
    } catch (err) {
      console.error('Failed to fetch attendance rules:', err);
      setError('Failed to load attendance rules. Using defaults.');
      // Keep defaults on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  // Save to backend
  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      // Build only the fields relevant to the editing section
      let payload = {};
      if (editingSection === 'defaulter') {
        payload = { defaulterThreshold: Number(tempRules.defaulterThreshold), lateWeight: Number(tempRules.lateWeight) };
      } else if (editingSection === 'lock') {
        payload = {
          lockTime: tempRules.lockTime,
          allowEdit: tempRules.allowEdit,
          editWindow: Number(tempRules.editWindow),
        };
      } else if (editingSection === 'notifications') {
        payload = {
          notifyAbsent: tempRules.notifyAbsent,
          notifyDefaulter: tempRules.notifyDefaulter,
        };
      } else if (editingSection === 'permissions') {
        payload = {
          permissions: tempRules.permissions,
        };
      }

      const updated = await settingsApi.updateAttendanceRules(payload);
      const merged = { ...DEFAULT_RULES, ...updated };
      setRules(merged);
      setTempRules(merged);
      setSaveMessage({ type: 'success', text: 'Settings saved successfully' });
      setEditingSection(null);
      if (saveMessageTimeoutRef.current) clearTimeout(saveMessageTimeoutRef.current);
      saveMessageTimeoutRef.current = setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error('Failed to save attendance rules:', err);
      setSaveMessage({ type: 'error', text: err.message || 'Failed to save settings' });
      if (saveMessageTimeoutRef.current) clearTimeout(saveMessageTimeoutRef.current);
      saveMessageTimeoutRef.current = setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setTempRules(rules); // Revert
    setEditingSection(null);
  };

  // AUDIT-121: Moved from render-phase to useEffect to avoid state update during render
  useEffect(() => {
    if (editingSection === null) {
      setTempRules(rules);
    }
  }, [rules, editingSection]);

  // AUDIT-127: Warn before leaving with unsaved edits
  useEffect(() => {
    const handler = (e) => { if (editingSection) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [editingSection]);

  const SectionHeader = ({ title, section }) => (
    <div className="flex justify-between items-center py-4 px-4 bg-default-50/50 border-b border-default-100">
      <h3 className="text-sm font-semibold text-default-700">{title}</h3>
      {editingSection === section ? (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="light" color="danger" onPress={handleCancel} isDisabled={saving} className="h-8 min-w-0 px-2 text-xs">{t('pages.cancel2')}</Button>
          <Button size="sm" color="primary" onPress={handleSave} isLoading={saving} className="h-8 min-w-0 px-3 text-xs" startContent={!saving && <Save size={12} />}>
            Save
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="light" color="primary" onPress={() => { setTempRules(rules); setEditingSection(section); }} isDisabled={editingSection !== null || loading} className="h-8 min-w-0 px-2 text-xs">
          Edit
        </Button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-12 space-y-3">
        <Spinner size="lg" color="primary" />
        <p className="text-sm text-default-500">Loading attendance rules...</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col space-y-4">

      {error && (
        <div className="flex items-center gap-2 p-3 bg-warning-50 border border-warning-200 rounded-lg">
          <AlertCircle size={16} className="text-warning-600" />
          <span className="text-sm text-warning-700">{error}</span>
        </div>
      )}

      {saveMessage && (
        <div className={`flex items-center gap-2 p-3 rounded-lg border ${saveMessage.type === 'success' ? 'bg-success-50 border-success-200' : 'bg-danger-50 border-danger-200'}`}>
          <span className={`text-sm font-medium ${saveMessage.type === 'success' ? 'text-success-700' : 'text-danger-700'}`}>{saveMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className={`shadow-sm border transition-all duration-200 ${editingSection === 'defaulter' ? 'border-primary ring-1 ring-primary' : 'border-default-200'}`}>
          <SectionHeader title={t('pages.defaulterSettings')} section="defaulter" />
          <CardBody className="p-4 space-y-4">
            {editingSection === 'defaulter' ? (
              <>
                <Input
                  size="sm"
                  type="number"
                  label="Defaulter Threshold (%)"
                  value={tempRules.defaulterThreshold}
                  onChange={(e) => setTempRules({ ...tempRules, defaulterThreshold: e.target.value })}
                  description="Students below this % are marked as defaulters"
                  variant="bordered"
                />
                <Input
                  size="sm"
                  type="number"
                  label="Late Arrival Weight (%)"
                  value={tempRules.lateWeight}
                  onChange={(e) => {
                    const v = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                    setTempRules({ ...tempRules, lateWeight: v });
                  }}
                  description="How much a 'Late' counts toward attendance (100% = fully present, 50% = half, 0% = absent)"
                  variant="bordered"
                  min={0}
                  max={100}
                />
              </>
            ) : (
              <>
                <div className="flex justify-between items-center p-2">
                  <span className="text-sm text-default-600">{t('pages.threshold')}</span>
                  <span className="text-lg font-bold text-default-900">{rules.defaulterThreshold}%</span>
                </div>
                <div className="flex justify-between items-center p-2">
                  <span className="text-sm text-default-600">Late Arrival Weight</span>
                  <span className="text-lg font-bold text-default-900">{rules.lateWeight}%</span>
                </div>
              </>
            )}
            <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
              <p className="text-xs text-warning-700 font-medium">
                Students with attendance below {editingSection === 'defaulter' ? tempRules.defaulterThreshold : rules.defaulterThreshold}% will be flagged as attendance defaulters.
                {' '}Late arrivals count as {editingSection === 'defaulter' ? tempRules.lateWeight : rules.lateWeight}% present.
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className={`shadow-sm border transition-all duration-200 ${editingSection === 'lock' ? 'border-primary ring-1 ring-primary' : 'border-default-200'}`}>
          <SectionHeader title={t('pages.lockSettings')} section="lock" />
          <CardBody className="p-4 space-y-4">
            {editingSection === 'lock' ? (
              <Input
                size="sm"
                type="time"
                label={t('pages.autoLockTime')}
                value={tempRules.lockTime}
                onChange={(e) => setTempRules({ ...tempRules, lockTime: e.target.value })}
                description="Attendance locked after this time"
                variant="bordered"
              />
            ) : (
              <div className="flex justify-between items-center p-2 border-b border-default-100">
                <span className="text-sm text-default-600">{t('pages.autoLockTime')}</span>
                <span className="text-lg font-bold text-default-900">{rules.lockTime}</span>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-default-50 rounded-lg border border-default-200">
              <div>
                <p className="text-sm font-medium text-default-700">{t('pages.allowEditAfterLock')}</p>
                <p className="text-xs text-default-500">{t('pages.adminsCanEditLockedAttendance')}</p>
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
                  label={t('pages.editWindowHours')}
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
                  <span className="text-sm text-default-600">{t('pages.editWindow')}</span>
                  <span className="text-sm font-semibold text-default-900">{rules.editWindow} hours</span>
                </div>
              )
            )}
          </CardBody>
        </Card>

        <Card className={`shadow-sm border transition-all duration-200 ${editingSection === 'notifications' ? 'border-primary ring-1 ring-primary' : 'border-default-200'}`}>
          <SectionHeader title={t('pages.notifications')} section="notifications" />
          <CardBody className="p-4 space-y-4">
            <div className="flex items-center justify-between p-3 bg-default-50 rounded-lg border border-default-200">
              <div>
                <p className="text-sm font-medium text-default-700">{t('pages.notifyOnAbsence')}</p>
                <p className="text-xs text-default-500">{t('pages.sendSmsWhenAbsent')}</p>
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
                <p className="text-sm font-medium text-default-700">{t('pages.notifyDefaulters')}</p>
                <p className="text-xs text-default-500">{t('pages.weeklyDefaulterAlert')}</p>
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

        <Card className={`shadow-sm border transition-all duration-200 ${editingSection === 'permissions' ? 'border-primary ring-1 ring-primary' : 'border-default-200'}`}>
          <SectionHeader title={t('pages.editPermissions')} section="permissions" />
          <CardBody className="p-4 space-y-3">
            {(editingSection === 'permissions' ? tempRules.permissions : rules.permissions).map((item, i) => (
              <div key={item.role} className="flex items-center justify-between p-4 bg-default-50 rounded-lg border border-default-200">
                <span className="text-sm font-medium text-default-800">{item.role}</span>
                {editingSection === 'permissions' ? (
                  <div className="flex gap-3">
                    {['canMark', 'canEdit', 'canLock'].map((perm) => (
                      <label key={perm} className="flex items-center gap-1.5 text-xs font-medium text-default-600">
                        <Switch
                          size="sm"
                          isSelected={item[perm]}
                          onValueChange={(v) => {
                            const updated = [...tempRules.permissions];
                            updated[i] = { ...updated[i], [perm]: v };
                            setTempRules({ ...tempRules, permissions: updated });
                          }}
                        />
                        {perm === 'canMark' ? 'Mark' : perm === 'canEdit' ? 'Edit' : 'Lock'}
                      </label>
                    ))}
                  </div>
                ) : (
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
                )}
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
