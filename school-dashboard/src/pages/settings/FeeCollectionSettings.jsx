import { useState, useEffect } from "react";
import { Card, CardBody, Input, Button, Switch, Select, SelectItem, Divider, Slider, Chip, Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/react";
import { Layers, Calendar, AlertCircle, DollarSign, Save, CheckCircle, Info } from "lucide-react";
import toast from "react-hot-toast";
import { getAuthHeaders } from "../../utils/authSession";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function FeeCollectionSettings() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    collectionMode: 'term',
    numberOfTerms: 2,
    terms: [],
    lateFeeEnabled: false,
    lateFeeAmount: 100,
    gracePeriodDays: 7,
    discountEnabled: true,
    discountRequireApproval: true,
    maxDiscountPercentage: 10,
    paymentModes: ['cash', 'cheque', 'online', 'bank']
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/school-settings`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      
      if (data && data.feeCollection) {
        setSettings({
          collectionMode: data.feeCollection.collectionMode || 'term',
          numberOfTerms: data.feeCollection.numberOfTerms || 2,
          terms: data.feeCollection.terms || [],
          lateFeeEnabled: data.lateFee?.enabled || false,
          lateFeeAmount: data.lateFee?.amount || 100,
          gracePeriodDays: data.lateFee?.gracePeriodDays || 7,
          discountEnabled: data.discount?.enabled || true,
          discountRequireApproval: data.discount?.requireApproval || true,
          maxDiscountPercentage: data.discount?.maxDiscountPercentage || 10,
          paymentModes: data.paymentModes?.filter(m => m.enabled).map(m => m.name.toLowerCase()) || ['cash', 'cheque', 'online', 'bank']
        });
      }

      // Generate default terms if none exist
      if ((!data || !data.feeCollection || !data.feeCollection.terms || data.feeCollection.terms.length === 0) && (!settings || settings.terms.length === 0)) {
        generateTerms(2);
      }
    } catch (error) {
      console.error('Failed to fetch fee settings:', error);
      // Generate default terms on error
      generateTerms(2);
    } finally {
      setLoading(false);
    }
  };

  const generateTerms = (numberOfTerms) => {
    const terms = [];
    const currentYear = new Date().getFullYear();
    
    for (let i = 0; i < numberOfTerms; i++) {
      const startMonth = i === 0 ? 3 : (i === 1 ? 9 : (i === 2 ? 1 : 6));
      const startDate = new Date(currentYear + (i >= 2 ? 1 : 0), startMonth - 1, 1);
      const endDate = new Date(currentYear + (i >= 2 ? 1 : 0), startMonth + 2, 30);
      
      terms.push({
        name: `Term ${i + 1}`,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dueDate: new Date(currentYear + (i >= 2 ? 1 : 0), startMonth - 1, 15).toISOString().split('T')[0]
      });
    }
    
    setSettings({ ...settings, terms, numberOfTerms });
  };

  const updateTerm = (index, field, value) => {
    const updatedTerms = [...settings.terms];
    updatedTerms[index][field] = value;
    setSettings({ ...settings, terms: updatedTerms });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/school-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          feeCollection: {
            collectionMode: settings.collectionMode,
            numberOfTerms: settings.numberOfTerms,
            terms: settings.terms
          },
          lateFee: {
            enabled: settings.lateFeeEnabled,
            amount: settings.lateFeeAmount,
            gracePeriodDays: settings.gracePeriodDays
          },
          discount: {
            enabled: settings.discountEnabled,
            requireApproval: settings.discountRequireApproval,
            maxDiscountPercentage: settings.maxDiscountPercentage
          },
          paymentModes: settings.paymentModes.map(mode => ({ 
            name: mode.charAt(0).toUpperCase() + mode.slice(1), 
            enabled: true 
          }))
        })
      });

      if (!response.ok) throw new Error('Failed to save fee settings');

      toast.success('Fee collection settings saved successfully');
    } catch (error) {
      console.error('Failed to save fee settings:', error);
      toast.error('Failed to save fee settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <p className="text-default-500">Loading fee settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-default-200 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-default-900">Fee Collection Settings</h2>
          <p className="text-sm text-default-500 mt-1">Configure how fees are collected, late fees, and discount policies</p>
        </div>
        <Button
          color="primary"
          size="lg"
          className="shadow-md font-medium px-8"
          onPress={handleSave}
          isLoading={saving}
          startContent={<Save size={18} />}
        >
          Save Settings
        </Button>
      </div>

      {/* Collection Mode */}
      <Card className="border border-default-200 shadow-sm">
        <CardBody className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Layers size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-default-900">Collection Mode</h3>
              <p className="text-sm text-default-500">Configure how fees will be collected from students</p>
            </div>
          </div>

          <Divider />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-default-600 block">Collection Frequency</label>
              <Select
                selectedKeys={[settings.collectionMode]}
                onChange={(e) => {
                  const mode = e.target.value;
                  setSettings({ ...settings, collectionMode: mode });
                  if (mode === 'term') {
                    generateTerms(settings.numberOfTerms);
                  }
                }}
                variant="bordered"
                classNames={{ trigger: "bg-white dark:bg-zinc-950" }}
              >
                <SelectItem key="term" value="term">
                  <div className="flex flex-col">
                    <span className="font-medium">Term-wise</span>
                    <span className="text-xs text-default-500">Fees divided by academic terms (most common in India)</span>
                  </div>
                </SelectItem>
                <SelectItem key="monthly" value="monthly">
                  <div className="flex flex-col">
                    <span className="font-medium">Monthly</span>
                    <span className="text-xs text-default-500">12 monthly installments</span>
                  </div>
                </SelectItem>
                <SelectItem key="quarterly" value="quarterly">
                  <div className="flex flex-col">
                    <span className="font-medium">Quarterly</span>
                    <span className="text-xs text-default-500">4 quarterly installments</span>
                  </div>
                </SelectItem>
                <SelectItem key="yearly" value="yearly">
                  <div className="flex flex-col">
                    <span className="font-medium">Yearly (One-time)</span>
                    <span className="text-xs text-default-500">Full payment at admission</span>
                  </div>
                </SelectItem>
              </Select>
            </div>

            {settings.collectionMode === 'term' && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-default-600 block">Number of Terms</label>
                <div className="flex items-center gap-4">
                  <Slider
                    size="md"
                    step={1}
                    minValue={2}
                    maxValue={4}
                    value={settings.numberOfTerms}
                    onChange={(value) => generateTerms(value)}
                    className="flex-1"
                    color="primary"
                    showSteps={true}
                  />
                  <div className="w-16 text-center">
                    <span className="text-2xl font-bold text-primary">{settings.numberOfTerms}</span>
                    <p className="text-xs text-default-500">terms</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Term Configuration */}
      {settings.collectionMode === 'term' && settings.terms.length > 0 && (
        <Card className="border border-default-200 shadow-sm">
          <CardBody className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Calendar size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-default-900">Term Schedule</h3>
                <p className="text-sm text-default-500">Configure start and end dates for each term</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {settings.terms.map((term, index) => (
                <div key={term.name || index} className="p-4 bg-default-50 rounded-xl border border-default-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-default-900">Term {index + 1}</h4>
                    <Chip size="sm" color="primary" variant="flat">{term.name}</Chip>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-default-500 block">Start Date</label>
                      <Input
                        type="date"
                        value={term.startDate}
                        onChange={(e) => updateTerm(index, 'startDate', e.target.value)}
                        size="sm"
                        variant="bordered"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-default-500 block">End Date</label>
                      <Input
                        type="date"
                        value={term.endDate}
                        onChange={(e) => updateTerm(index, 'endDate', e.target.value)}
                        size="sm"
                        variant="bordered"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-default-500 block">Fee Due Date</label>
                    <Input
                      type="date"
                      value={term.dueDate}
                      onChange={(e) => updateTerm(index, 'dueDate', e.target.value)}
                      size="sm"
                      variant="bordered"
                      description="Payment deadline for this term"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Late Fee Configuration */}
      <Card className="border border-default-200 shadow-sm">
        <CardBody className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg text-warning">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-default-900">Late Fee Settings</h3>
                <p className="text-sm text-default-500">Configure penalties for late payments</p>
              </div>
            </div>
            <Switch
              isSelected={settings.lateFeeEnabled}
              onValueChange={(v) => setSettings({ ...settings, lateFeeEnabled: v })}
              color="warning"
            />
          </div>

          {settings.lateFeeEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-3">
                <label className="text-sm font-medium text-default-600 block">Late Fee Amount (₹)</label>
                <Input
                  type="number"
                  value={settings.lateFeeAmount}
                  onValueChange={(v) => setSettings({ ...settings, lateFeeAmount: parseInt(v) || 0 })}
                  variant="bordered"
                  startContent={<span className="text-default-400">₹</span>}
                  description="Amount charged per overdue period"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-default-600 block">Grace Period (Days)</label>
                <Input
                  type="number"
                  value={settings.gracePeriodDays}
                  onValueChange={(v) => setSettings({ ...settings, gracePeriodDays: parseInt(v) || 0 })}
                  variant="bordered"
                  description="Days after due date before late fee applies"
                />
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Discount Configuration */}
      <Card className="border border-default-200 shadow-sm">
        <CardBody className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg text-success">
                <DollarSign size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-default-900">Discount Settings</h3>
                <p className="text-sm text-default-500">Configure fee discount rules and approval workflow</p>
              </div>
            </div>
            <Switch
              isSelected={settings.discountEnabled}
              onValueChange={(v) => setSettings({ ...settings, discountEnabled: v })}
              color="success"
            />
          </div>

          {settings.discountEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-3">
                <label className="text-sm font-medium text-default-600 block">Maximum Discount (%)</label>
                <div className="flex items-center gap-4">
                  <Slider
                    size="md"
                    step={1}
                    minValue={0}
                    maxValue={50}
                    value={settings.maxDiscountPercentage}
                    onChange={(value) => setSettings({ ...settings, maxDiscountPercentage: value })}
                    className="flex-1"
                    color="success"
                  />
                  <div className="w-20 text-center">
                    <span className="text-2xl font-bold text-success">{settings.maxDiscountPercentage}%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-default-600 block">Approval Required</label>
                <div className="p-4 bg-default-50 rounded-xl border border-default-200">
                  <Switch
                    isSelected={settings.discountRequireApproval}
                    onValueChange={(v) => setSettings({ ...settings, discountRequireApproval: v })}
                  >
                    <span className="text-sm text-default-700">
                      {settings.discountRequireApproval ? 'Yes' : 'No'}
                    </span>
                  </Switch>
                  <p className="text-xs text-default-500 mt-2">
                    {settings.discountRequireApproval 
                      ? 'Admin approval required for all discounts'
                      : 'Staff can apply discounts directly'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Payment Modes */}
      <Card className="border border-default-200 shadow-sm">
        <CardBody className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <DollarSign size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-default-900">Accepted Payment Modes</h3>
              <p className="text-sm text-default-500">Select which payment methods are accepted</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {[
              { key: 'cash', label: 'Cash', icon: '💵', desc: 'Physical currency' },
              { key: 'cheque', label: 'Cheque', icon: '📝', desc: 'Bank cheques' },
              { key: 'online', label: 'Online/UPI', icon: '📱', desc: 'Digital payments' },
              { key: 'card', label: 'Card', icon: '💳', desc: 'Credit/Debit cards' },
              { key: 'bank', label: 'Bank Transfer', icon: '🏦', desc: 'NEFT/RTGS/IMPS' }
            ].map((mode) => (
              <div
                key={mode.key}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${settings.paymentModes.includes(mode.key) 
                  ? 'bg-primary-50 border-primary-300' 
                  : 'bg-white dark:bg-zinc-950 border-default-200 hover:border-default-300'}`}
                onClick={() => {
                  const updated = settings.paymentModes.includes(mode.key)
                    ? settings.paymentModes.filter(m => m !== mode.key)
                    : [...settings.paymentModes, mode.key];
                  setSettings({ ...settings, paymentModes: updated });
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{mode.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-default-900">{mode.label}</p>
                    <p className="text-xs text-default-500">{mode.desc}</p>
                  </div>
                  {settings.paymentModes.includes(mode.key) && (
                    <CheckCircle size={20} className="text-primary flex-shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Info Box */}
      <div className="p-4 bg-info-50 rounded-xl border border-info-200 flex items-start gap-3">
        <Info size={20} className="text-info-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-info-900">About Fee Collection Settings</p>
          <p className="text-xs text-info-700 mt-1">
            These settings will be used as defaults when creating fee templates and structures. 
            You can customize these for individual classes or students as needed.
          </p>
        </div>
      </div>
    </div>
  );
}
