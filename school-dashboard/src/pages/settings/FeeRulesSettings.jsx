import { useState, useEffect } from "react";
import {
  Card, CardBody, CardHeader, Button, Input, Tabs, Tab,
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure,
  Select, SelectItem, Switch, Chip, Divider, Spinner
} from "@heroui/react";
import { Plus, Edit, Trash2, Settings, DollarSign, Calendar, CreditCard, AlertCircle, Save } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function FeeRulesSettings({ embedded = false }) {
  const [activeTab, setActiveTab] = useState("concessions");

  return (
    <div className={embedded ? "space-y-8" : "max-w-6xl mx-auto pb-10 space-y-8"}>
      {/* Header */}
      {!embedded && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-default-200 pb-6">
          <div>
            <h2 className="text-2xl font-bold text-default-900">Fee Rules & Configuration</h2>
            <p className="text-sm text-default-500 mt-1">Configure advanced fee management settings</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={setActiveTab}
        variant="underlined"
        classNames={{
          tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
          cursor: "w-full bg-primary",
          tab: "max-w-fit px-0 h-12",
          tabContent: "group-data-[selected=true]:text-primary"
        }}
      >
        <Tab
          key="concessions"
          title={
            <div className="flex items-center space-x-2">
              <DollarSign size={18} />
              <span>Concessions</span>
            </div>
          }
        >
          <ConcessionsTab />
        </Tab>
        
        <Tab
          key="late-fees"
          title={
            <div className="flex items-center space-x-2">
              <AlertCircle size={18} />
              <span>Late Fees</span>
            </div>
          }
        >
          <LateFeeTab />
        </Tab>
        
        <Tab
          key="payment-methods"
          title={
            <div className="flex items-center space-x-2">
              <CreditCard size={18} />
              <span>Payment Methods</span>
            </div>
          }
        >
          <PaymentMethodsTab />
        </Tab>
        
        <Tab
          key="collection-period"
          title={
            <div className="flex items-center space-x-2">
              <Calendar size={18} />
              <span>Collection Period</span>
            </div>
          }
        >
          <CollectionPeriodTab />
        </Tab>
        
        <Tab
          key="general-rules"
          title={
            <div className="flex items-center space-x-2">
              <Settings size={18} />
              <span>General Rules</span>
            </div>
          }
        >
          <GeneralRulesTab />
        </Tab>
      </Tabs>
    </div>
  );
}

// ============ CONCESSIONS TAB ============
export function ConcessionsTab() {
  const [concessions, setConcessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingConcession, setEditingConcession] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    discountType: "percentage",
    discountValue: 0,
    applicableOn: "entire_fee",
    approvalRequired: false,
    approverRole: "principal",
    eligibilityCriteria: {
      type: "custom",
      conditions: []
    },
    academicYear: "2024-25",
    isActive: true
  });

  useEffect(() => {
    fetchConcessions();
  }, []);

  const fetchConcessions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/fee-settings/concessions?academicYear=2024-25`);
      if (!response.ok) throw new Error('Failed to fetch concessions');
      const data = await response.json();
      setConcessions(data);
    } catch (error) {
      console.error('Error fetching concessions:', error);
      toast.error('Failed to load concessions');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (concession = null) => {
    if (concession) {
      setEditingConcession(concession);
      setFormData({
        name: concession.name,
        description: concession.description || "",
        discountType: concession.discountType,
        discountValue: concession.discountValue,
        applicableOn: concession.applicableOn,
        approvalRequired: concession.approvalRequired,
        approverRole: concession.approverRole,
        eligibilityCriteria: concession.eligibilityCriteria,
        academicYear: concession.academicYear,
        isActive: concession.isActive
      });
    } else {
      setEditingConcession(null);
      setFormData({
        name: "",
        description: "",
        discountType: "percentage",
        discountValue: 0,
        applicableOn: "entire_fee",
        approvalRequired: false,
        approverRole: "principal",
        eligibilityCriteria: {
          type: "custom",
          conditions: []
        },
        academicYear: "2024-25",
        isActive: true
      });
    }
    onOpen();
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Concession name is required');
      return;
    }

    try {
      const url = editingConcession
        ? `${API_URL}/fee-settings/concessions/${editingConcession._id}`
        : `${API_URL}/fee-settings/concessions`;

      const response = await fetch(url, {
        method: editingConcession ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save concession');

      toast.success(editingConcession ? 'Concession updated' : 'Concession created');
      await fetchConcessions();
      onClose();
    } catch (error) {
      console.error('Error saving concession:', error);
      toast.error('Failed to save concession');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this concession?')) return;

    try {
      const response = await fetch(`${API_URL}/fee-settings/concessions/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete concession');

      toast.success('Concession deleted');
      await fetchConcessions();
    } catch (error) {
      console.error('Error deleting concession:', error);
      toast.error('Failed to delete concession');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-default-600">
          Configure discount schemes for students based on eligibility criteria
        </p>
        <Button color="primary" startContent={<Plus size={18} />} onPress={() => handleOpen()}>
          Add Concession
        </Button>
      </div>

      <Card>
        <CardBody>
          <Table aria-label="Concessions table" removeWrapper>
            <TableHeader>
              <TableColumn>NAME</TableColumn>
              <TableColumn>TYPE</TableColumn>
              <TableColumn>VALUE</TableColumn>
              <TableColumn>ELIGIBILITY</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn align="end">ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No concessions configured">
              {concessions.map((concession) => (
                <TableRow key={concession._id}>
                  <TableCell>
                    <div>
                      <p className="font-semibold">{concession.name}</p>
                      {concession.description && (
                        <p className="text-xs text-default-400">{concession.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat">
                      {concession.discountType === 'percentage' ? 'Percentage' : 'Flat Amount'}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">
                      {concession.discountType === 'percentage' 
                        ? `${concession.discountValue}%` 
                        : `₹${concession.discountValue}`}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" variant="dot" color="primary">
                      {concession.eligibilityCriteria.type}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" color={concession.isActive ? "success" : "default"} variant="flat">
                      {concession.isActive ? 'Active' : 'Inactive'}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-end">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleOpen(concession)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => handleDelete(concession._id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Concession Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>{editingConcession ? 'Edit' : 'Add'} Concession</ModalHeader>
          <ModalBody className="gap-4">
            <Input
              label="Concession Name"
              placeholder="e.g., Sibling Discount"
              value={formData.name}
              onValueChange={(v) => setFormData({ ...formData, name: v })}
              variant="bordered"
              isRequired
            />
            
            <Input
              label="Description"
              placeholder="Brief description"
              value={formData.description}
              onValueChange={(v) => setFormData({ ...formData, description: v })}
              variant="bordered"
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Discount Type"
                selectedKeys={[formData.discountType]}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                variant="bordered"
              >
                <SelectItem key="percentage">Percentage</SelectItem>
                <SelectItem key="flat">Flat Amount</SelectItem>
              </Select>

              <Input
                label="Discount Value"
                type="number"
                value={formData.discountValue}
                onValueChange={(v) => setFormData({ ...formData, discountValue: parseFloat(v) || 0 })}
                startContent={formData.discountType === 'percentage' ? '%' : '₹'}
                variant="bordered"
                isRequired
              />
            </div>

            <Select
              label="Eligibility Type"
              selectedKeys={[formData.eligibilityCriteria.type]}
              onChange={(e) => setFormData({
                ...formData,
                eligibilityCriteria: { ...formData.eligibilityCriteria, type: e.target.value }
              })}
              variant="bordered"
            >
              <SelectItem key="sibling">Sibling</SelectItem>
              <SelectItem key="merit">Merit</SelectItem>
              <SelectItem key="financial">Financial</SelectItem>
              <SelectItem key="staff_ward">Staff Ward</SelectItem>
              <SelectItem key="sports">Sports</SelectItem>
              <SelectItem key="custom">Custom</SelectItem>
            </Select>

            <div className="flex items-center justify-between p-4 bg-default-50 rounded-lg">
              <div>
                <p className="font-semibold text-sm">Requires Approval</p>
                <p className="text-xs text-default-500">Concession needs approval before applying</p>
              </div>
              <Switch
                isSelected={formData.approvalRequired}
                onValueChange={(v) => setFormData({ ...formData, approvalRequired: v })}
              />
            </div>

            {formData.approvalRequired && (
              <Select
                label="Approver Role"
                selectedKeys={[formData.approverRole]}
                onChange={(e) => setFormData({ ...formData, approverRole: e.target.value })}
                variant="bordered"
              >
                <SelectItem key="principal">Principal</SelectItem>
                <SelectItem key="admin">Admin</SelectItem>
                <SelectItem key="accountant">Accountant</SelectItem>
                <SelectItem key="director">Director</SelectItem>
              </Select>
            )}

            <div className="flex items-center justify-between p-4 bg-default-50 rounded-lg">
              <div>
                <p className="font-semibold text-sm">Active Status</p>
                <p className="text-xs text-default-500">Enable or disable this concession</p>
              </div>
              <Switch
                isSelected={formData.isActive}
                onValueChange={(v) => setFormData({ ...formData, isActive: v })}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>Cancel</Button>
            <Button color="primary" onPress={handleSave}>
              {editingConcession ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

// ============ LATE FEE TAB ============
export function LateFeeTab() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    academicYear: "2024-25",
    enabled: false,
    gracePeriod: 0,
    fineType: "flat",
    perDayAmount: 0,
    flatAmount: 0,
    slabs: [],
    maximumCap: 0,
    description: ""
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/fee-settings/late-fee-rules?academicYear=2024-25`);
      if (!response.ok) throw new Error('Failed to fetch late fee rules');
      const data = await response.json();
      
      if (data.length > 0) {
        setConfig(data[0]);
        setFormData({
          academicYear: data[0].academicYear,
          enabled: data[0].enabled,
          gracePeriod: data[0].gracePeriod,
          fineType: data[0].fineType,
          perDayAmount: data[0].perDayAmount || 0,
          flatAmount: data[0].flatAmount || 0,
          slabs: data[0].slabs || [],
          maximumCap: data[0].maximumCap || 0,
          description: data[0].description || ""
        });
      }
    } catch (error) {
      console.error('Error fetching late fee config:', error);
      toast.error('Failed to load late fee configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/fee-settings/late-fee-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save late fee rules');

      toast.success('Late fee rules saved successfully');
      await fetchConfig();
    } catch (error) {
      console.error('Error saving late fee rules:', error);
      toast.error('Failed to save late fee rules');
    } finally {
      setSaving(false);
    }
  };

  const addSlab = () => {
    setFormData({
      ...formData,
      slabs: [...formData.slabs, { fromDay: 0, toDay: 0, amount: 0 }]
    });
  };

  const updateSlab = (index, field, value) => {
    const newSlabs = [...formData.slabs];
    newSlabs[index][field] = parseFloat(value) || 0;
    setFormData({ ...formData, slabs: newSlabs });
  };

  const removeSlab = (index) => {
    const newSlabs = formData.slabs.filter((_, i) => i !== index);
    setFormData({ ...formData, slabs: newSlabs });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-default-600">
          Configure late fee rules and penalties for delayed payments
        </p>
        <Button 
          color="primary" 
          startContent={<Save size={18} />} 
          onPress={handleSave}
          isLoading={saving}
        >
          Save Changes
        </Button>
      </div>

      <Card>
        <CardBody className="gap-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between p-4 bg-default-50 rounded-lg">
            <div>
              <p className="font-semibold text-sm">Enable Late Fee</p>
              <p className="text-xs text-default-500">Automatically apply late fees on overdue payments</p>
            </div>
            <Switch
              isSelected={formData.enabled}
              onValueChange={(v) => setFormData({ ...formData, enabled: v })}
            />
          </div>

          {formData.enabled && (
            <>
              {/* Grace Period */}
              <Input
                label="Grace Period (Days)"
                type="number"
                value={formData.gracePeriod}
                onValueChange={(v) => setFormData({ ...formData, gracePeriod: parseInt(v) || 0 })}
                description="Number of days after due date before late fee applies"
                variant="bordered"
              />

              {/* Fine Type */}
              <Select
                label="Late Fee Type"
                selectedKeys={[formData.fineType]}
                onChange={(e) => setFormData({ ...formData, fineType: e.target.value })}
                variant="bordered"
                description="Choose how late fees are calculated"
              >
                <SelectItem key="flat">Flat Amount (one-time charge)</SelectItem>
                <SelectItem key="per_day">Per Day (daily charge)</SelectItem>
                <SelectItem key="slab">Slab-based (different rates for different periods)</SelectItem>
              </Select>

              {/* Flat Amount */}
              {formData.fineType === 'flat' && (
                <Input
                  label="Flat Late Fee Amount"
                  type="number"
                  value={formData.flatAmount}
                  onValueChange={(v) => setFormData({ ...formData, flatAmount: parseFloat(v) || 0 })}
                  startContent="₹"
                  variant="bordered"
                />
              )}

              {/* Per Day Amount */}
              {formData.fineType === 'per_day' && (
                <Input
                  label="Per Day Late Fee Amount"
                  type="number"
                  value={formData.perDayAmount}
                  onValueChange={(v) => setFormData({ ...formData, perDayAmount: parseFloat(v) || 0 })}
                  startContent="₹"
                  description="Amount charged for each day after grace period"
                  variant="bordered"
                />
              )}

              {/* Slab Configuration */}
              {formData.fineType === 'slab' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-sm">Late Fee Slabs</p>
                      <p className="text-xs text-default-500">Configure different rates for different delay periods</p>
                    </div>
                    <Button size="sm" color="primary" variant="flat" onPress={addSlab}>
                      <Plus size={16} /> Add Slab
                    </Button>
                  </div>

                  {formData.slabs.map((slab, index) => (
                    <Card key={index} className="bg-default-50">
                      <CardBody>
                        <div className="flex gap-4 items-end">
                          <Input
                            label="From Day"
                            type="number"
                            value={slab.fromDay}
                            onValueChange={(v) => updateSlab(index, 'fromDay', v)}
                            size="sm"
                            variant="bordered"
                          />
                          <Input
                            label="To Day"
                            type="number"
                            value={slab.toDay}
                            onValueChange={(v) => updateSlab(index, 'toDay', v)}
                            size="sm"
                            variant="bordered"
                          />
                          <Input
                            label="Amount"
                            type="number"
                            value={slab.amount}
                            onValueChange={(v) => updateSlab(index, 'amount', v)}
                            startContent="₹"
                            size="sm"
                            variant="bordered"
                          />
                          <Button
                            isIconOnly
                            size="sm"
                            color="danger"
                            variant="flat"
                            onPress={() => removeSlab(index)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}

              {/* Maximum Cap */}
              <Input
                label="Maximum Late Fee Cap (Optional)"
                type="number"
                value={formData.maximumCap}
                onValueChange={(v) => setFormData({ ...formData, maximumCap: parseFloat(v) || 0 })}
                startContent="₹"
                description="Maximum late fee that can be charged (0 for no limit)"
                variant="bordered"
              />

              {/* Description */}
              <Input
                label="Description"
                value={formData.description}
                onValueChange={(v) => setFormData({ ...formData, description: v })}
                placeholder="Additional notes about late fee policy"
                variant="bordered"
              />
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

// ============ PAYMENT METHODS TAB ============
export function PaymentMethodsTab() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    academicYear: "2024-25",
    online: {
      enabled: true,
      bankTransfer: true,
      upi: true,
      debitCard: true,
      creditCard: true,
      emi: {
        enabled: false,
        providers: []
      }
    },
    offline: {
      enabled: true,
      cash: true,
      cheque: true,
      dd: true
    }
  });
  const [emiProvider, setEmiProvider] = useState("");

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/fee-settings/payment-methods?academicYear=2024-25`);
      if (!response.ok) throw new Error('Failed to fetch payment methods');
      const data = await response.json();
      
      if (data.length > 0) {
        setConfig(data[0]);
        setFormData(data[0]);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.error('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/fee-settings/payment-methods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save payment methods');

      toast.success('Payment methods saved successfully');
      await fetchConfig();
    } catch (error) {
      console.error('Error saving payment methods:', error);
      toast.error('Failed to save payment methods');
    } finally {
      setSaving(false);
    }
  };

  const addEmiProvider = () => {
    if (emiProvider.trim()) {
      setFormData({
        ...formData,
        online: {
          ...formData.online,
          emi: {
            ...formData.online.emi,
            providers: [...formData.online.emi.providers, emiProvider.trim()]
          }
        }
      });
      setEmiProvider("");
    }
  };

  const removeEmiProvider = (provider) => {
    setFormData({
      ...formData,
      online: {
        ...formData.online,
        emi: {
          ...formData.online.emi,
          providers: formData.online.emi.providers.filter(p => p !== provider)
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-default-600">
          Enable or disable payment methods for fee collection
        </p>
        <Button 
          color="primary" 
          startContent={<Save size={18} />} 
          onPress={handleSave}
          isLoading={saving}
        >
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Online Payments */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Online Payments</h3>
              <p className="text-xs text-default-500">Digital payment methods</p>
            </div>
            <Switch
              isSelected={formData.online.enabled}
              onValueChange={(v) => setFormData({
                ...formData,
                online: { ...formData.online, enabled: v }
              })}
            />
          </CardHeader>
          <Divider />
          <CardBody className="gap-4">
            {formData.online.enabled && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">UPI</p>
                    <p className="text-xs text-default-500">Google Pay, PhonePe, Paytm, etc.</p>
                  </div>
                  <Switch
                    isSelected={formData.online.upi}
                    onValueChange={(v) => setFormData({
                      ...formData,
                      online: { ...formData.online, upi: v }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Debit Card</p>
                    <p className="text-xs text-default-500">All major debit cards</p>
                  </div>
                  <Switch
                    isSelected={formData.online.debitCard}
                    onValueChange={(v) => setFormData({
                      ...formData,
                      online: { ...formData.online, debitCard: v }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Credit Card</p>
                    <p className="text-xs text-default-500">All major credit cards</p>
                  </div>
                  <Switch
                    isSelected={formData.online.creditCard}
                    onValueChange={(v) => setFormData({
                      ...formData,
                      online: { ...formData.online, creditCard: v }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Bank Transfer</p>
                    <p className="text-xs text-default-500">NEFT, RTGS, IMPS</p>
                  </div>
                  <Switch
                    isSelected={formData.online.bankTransfer}
                    onValueChange={(v) => setFormData({
                      ...formData,
                      online: { ...formData.online, bankTransfer: v }
                    })}
                  />
                </div>

                <Divider />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">EMI Options</p>
                      <p className="text-xs text-default-500">Enable installment payments through EMI providers</p>
                    </div>
                    <Switch
                      isSelected={formData.online.emi.enabled}
                      onValueChange={(v) => setFormData({
                        ...formData,
                        online: {
                          ...formData.online,
                          emi: { ...formData.online.emi, enabled: v }
                        }
                      })}
                    />
                  </div>

                  {formData.online.emi.enabled && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add EMI provider (e.g., Bajaj Finserv)"
                          value={emiProvider}
                          onValueChange={setEmiProvider}
                          size="sm"
                          variant="bordered"
                        />
                        <Button size="sm" color="primary" onPress={addEmiProvider}>
                          Add
                        </Button>
                      </div>

                      {formData.online.emi.providers.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.online.emi.providers.map((provider, index) => (
                            <Chip
                              key={index}
                              onClose={() => removeEmiProvider(provider)}
                              variant="flat"
                              color="primary"
                            >
                              {provider}
                            </Chip>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardBody>
        </Card>

        {/* Offline Payments */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Offline Payments</h3>
              <p className="text-xs text-default-500">Traditional payment methods</p>
            </div>
            <Switch
              isSelected={formData.offline.enabled}
              onValueChange={(v) => setFormData({
                ...formData,
                offline: { ...formData.offline, enabled: v }
              })}
            />
          </CardHeader>
          <Divider />
          <CardBody className="gap-4">
            {formData.offline.enabled && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Cash</p>
                    <p className="text-xs text-default-500">Accept cash payments at school office</p>
                  </div>
                  <Switch
                    isSelected={formData.offline.cash}
                    onValueChange={(v) => setFormData({
                      ...formData,
                      offline: { ...formData.offline, cash: v }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Cheque</p>
                    <p className="text-xs text-default-500">Accept cheque payments</p>
                  </div>
                  <Switch
                    isSelected={formData.offline.cheque}
                    onValueChange={(v) => setFormData({
                      ...formData,
                      offline: { ...formData.offline, cheque: v }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Demand Draft (DD)</p>
                    <p className="text-xs text-default-500">Accept DD payments</p>
                  </div>
                  <Switch
                    isSelected={formData.offline.dd}
                    onValueChange={(v) => setFormData({
                      ...formData,
                      offline: { ...formData.offline, dd: v }
                    })}
                  />
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

// ============ COLLECTION PERIOD TAB ============
export function CollectionPeriodTab() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    academicYear: "2024-25",
    collectionInterval: "yearly",
    installmentPlans: [],
    autoPay: {
      enabled: false,
      reminderDays: 3
    },
    interestOnDelay: {
      enabled: false,
      type: "rate",
      value: 0
    }
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/fee-settings/collection-period?academicYear=2024-25`);
      if (!response.ok) throw new Error('Failed to fetch collection period');
      const data = await response.json();
      
      if (data.length > 0) {
        setConfig(data[0]);
        setFormData(data[0]);
      }
    } catch (error) {
      console.error('Error fetching collection period:', error);
      toast.error('Failed to load collection period');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/fee-settings/collection-period`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save collection period');

      toast.success('Collection period saved successfully');
      await fetchConfig();
    } catch (error) {
      console.error('Error saving collection period:', error);
      toast.error('Failed to save collection period');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-default-600">
          Configure fee collection intervals and installment plans
        </p>
        <Button 
          color="primary" 
          startContent={<Save size={18} />} 
          onPress={handleSave}
          isLoading={saving}
        >
          Save Changes
        </Button>
      </div>

      <Card>
        <CardBody className="gap-6">
          {/* Collection Interval */}
          <Select
            label="Fee Collection Interval"
            selectedKeys={[formData.collectionInterval]}
            onChange={(e) => setFormData({ ...formData, collectionInterval: e.target.value })}
            variant="bordered"
            description="How often fees should be collected"
          >
            <SelectItem key="monthly">Monthly</SelectItem>
            <SelectItem key="quarterly">Quarterly</SelectItem>
            <SelectItem key="term-wise">Term-wise</SelectItem>
            <SelectItem key="yearly">Yearly</SelectItem>
          </Select>

          <Divider />

          {/* Auto-Pay */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-default-50 rounded-lg">
              <div>
                <p className="font-semibold text-sm">Auto-Pay Reminders</p>
                <p className="text-xs text-default-500">Send automatic payment reminders to parents</p>
              </div>
              <Switch
                isSelected={formData.autoPay.enabled}
                onValueChange={(v) => setFormData({
                  ...formData,
                  autoPay: { ...formData.autoPay, enabled: v }
                })}
              />
            </div>

            {formData.autoPay.enabled && (
              <Input
                label="Reminder Days Before Due Date"
                type="number"
                value={formData.autoPay.reminderDays}
                onValueChange={(v) => setFormData({
                  ...formData,
                  autoPay: { ...formData.autoPay, reminderDays: parseInt(v) || 0 }
                })}
                description="Number of days before due date to send reminder"
                variant="bordered"
              />
            )}
          </div>

          <Divider />

          {/* Interest on Delay */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-default-50 rounded-lg">
              <div>
                <p className="font-semibold text-sm">Interest on Delayed Payment</p>
                <p className="text-xs text-default-500">Charge interest on payments made after due date</p>
              </div>
              <Switch
                isSelected={formData.interestOnDelay.enabled}
                onValueChange={(v) => setFormData({
                  ...formData,
                  interestOnDelay: { ...formData.interestOnDelay, enabled: v }
                })}
              />
            </div>

            {formData.interestOnDelay.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Interest Type"
                  selectedKeys={[formData.interestOnDelay.type]}
                  onChange={(e) => setFormData({
                    ...formData,
                    interestOnDelay: { ...formData.interestOnDelay, type: e.target.value }
                  })}
                  variant="bordered"
                >
                  <SelectItem key="rate">Percentage Rate (per month)</SelectItem>
                  <SelectItem key="flat">Flat Amount (per month)</SelectItem>
                </Select>

                <Input
                  label="Interest Value"
                  type="number"
                  value={formData.interestOnDelay.value}
                  onValueChange={(v) => setFormData({
                    ...formData,
                    interestOnDelay: { ...formData.interestOnDelay, value: parseFloat(v) || 0 }
                  })}
                  startContent={formData.interestOnDelay.type === 'rate' ? '%' : '₹'}
                  variant="bordered"
                />
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

// ============ GENERAL RULES TAB ============
export function GeneralRulesTab() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    academicYear: "2024-25",
    newAdmission: {
      feeCalculation: "total",
      prorateFrom: "admission_date",
      prorateMethod: "monthly"
    },
    validTill: {
      type: "academic_year",
      date: ""
    },
    editApprovalControls: {
      feeHeadEdit: {
        requiresApproval: true,
        approverRole: "principal"
      },
      concessionApproval: {
        requiresApproval: true,
        approverRole: "principal"
      },
      feeWaiver: {
        requiresApproval: true,
        approverRole: "director",
        maxAmountWithoutApproval: 0
      }
    },
    allowPartialPayment: true,
    minimumPartialPaymentPercent: 0,
    refundPolicy: {
      enabled: false,
      processingDays: 7
    }
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/fee-settings/rules?academicYear=2024-25`);
      if (!response.ok) throw new Error('Failed to fetch fee rules');
      const data = await response.json();
      
      if (data.length > 0) {
        setConfig(data[0]);
        setFormData(data[0]);
      }
    } catch (error) {
      console.error('Error fetching fee rules:', error);
      toast.error('Failed to load fee rules');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/fee-settings/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save fee rules');

      toast.success('Fee rules saved successfully');
      await fetchConfig();
    } catch (error) {
      console.error('Error saving fee rules:', error);
      toast.error('Failed to save fee rules');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-default-600">
          Configure general fee rules and policies
        </p>
        <Button 
          color="primary" 
          startContent={<Save size={18} />} 
          onPress={handleSave}
          isLoading={saving}
        >
          Save Changes
        </Button>
      </div>

      <div className="space-y-6">
        {/* New Admission Rules */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">New Admission Fee Rules</h3>
          </CardHeader>
          <Divider />
          <CardBody className="gap-4">
            <Select
              label="Fee Calculation for New Admissions"
              selectedKeys={[formData.newAdmission.feeCalculation]}
              onChange={(e) => setFormData({
                ...formData,
                newAdmission: { ...formData.newAdmission, feeCalculation: e.target.value }
              })}
              variant="bordered"
              description="How to calculate fees for mid-year admissions"
            >
              <SelectItem key="total">Total Fee (full year)</SelectItem>
              <SelectItem key="prorated">Prorated Fee (proportional)</SelectItem>
            </Select>

            {formData.newAdmission.feeCalculation === 'prorated' && (
              <>
                <Select
                  label="Prorate From"
                  selectedKeys={[formData.newAdmission.prorateFrom]}
                  onChange={(e) => setFormData({
                    ...formData,
                    newAdmission: { ...formData.newAdmission, prorateFrom: e.target.value }
                  })}
                  variant="bordered"
                >
                  <SelectItem key="admission_date">Admission Date</SelectItem>
                  <SelectItem key="month_start">Start of Month</SelectItem>
                  <SelectItem key="quarter_start">Start of Quarter</SelectItem>
                </Select>

                <Select
                  label="Prorate Method"
                  selectedKeys={[formData.newAdmission.prorateMethod]}
                  onChange={(e) => setFormData({
                    ...formData,
                    newAdmission: { ...formData.newAdmission, prorateMethod: e.target.value }
                  })}
                  variant="bordered"
                >
                  <SelectItem key="monthly">Monthly (divide by months)</SelectItem>
                  <SelectItem key="daily">Daily (divide by days)</SelectItem>
                </Select>
              </>
            )}
          </CardBody>
        </Card>

        {/* Approval Controls */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Edit & Approval Controls</h3>
          </CardHeader>
          <Divider />
          <CardBody className="gap-6">
            {/* Fee Head Edit */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-default-50 rounded-lg">
                <div>
                  <p className="font-semibold text-sm">Fee Head Edit Approval</p>
                  <p className="text-xs text-default-500">Require approval for editing fee heads</p>
                </div>
                <Switch
                  isSelected={formData.editApprovalControls.feeHeadEdit.requiresApproval}
                  onValueChange={(v) => setFormData({
                    ...formData,
                    editApprovalControls: {
                      ...formData.editApprovalControls,
                      feeHeadEdit: { ...formData.editApprovalControls.feeHeadEdit, requiresApproval: v }
                    }
                  })}
                />
              </div>

              {formData.editApprovalControls.feeHeadEdit.requiresApproval && (
                <Select
                  label="Approver Role"
                  selectedKeys={[formData.editApprovalControls.feeHeadEdit.approverRole]}
                  onChange={(e) => setFormData({
                    ...formData,
                    editApprovalControls: {
                      ...formData.editApprovalControls,
                      feeHeadEdit: { ...formData.editApprovalControls.feeHeadEdit, approverRole: e.target.value }
                    }
                  })}
                  variant="bordered"
                  size="sm"
                >
                  <SelectItem key="principal">Principal</SelectItem>
                  <SelectItem key="admin">Admin</SelectItem>
                  <SelectItem key="director">Director</SelectItem>
                </Select>
              )}
            </div>

            <Divider />

            {/* Concession Approval */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-default-50 rounded-lg">
                <div>
                  <p className="font-semibold text-sm">Concession Approval</p>
                  <p className="text-xs text-default-500">Require approval for applying concessions</p>
                </div>
                <Switch
                  isSelected={formData.editApprovalControls.concessionApproval.requiresApproval}
                  onValueChange={(v) => setFormData({
                    ...formData,
                    editApprovalControls: {
                      ...formData.editApprovalControls,
                      concessionApproval: { ...formData.editApprovalControls.concessionApproval, requiresApproval: v }
                    }
                  })}
                />
              </div>

              {formData.editApprovalControls.concessionApproval.requiresApproval && (
                <Select
                  label="Approver Role"
                  selectedKeys={[formData.editApprovalControls.concessionApproval.approverRole]}
                  onChange={(e) => setFormData({
                    ...formData,
                    editApprovalControls: {
                      ...formData.editApprovalControls,
                      concessionApproval: { ...formData.editApprovalControls.concessionApproval, approverRole: e.target.value }
                    }
                  })}
                  variant="bordered"
                  size="sm"
                >
                  <SelectItem key="principal">Principal</SelectItem>
                  <SelectItem key="admin">Admin</SelectItem>
                  <SelectItem key="director">Director</SelectItem>
                </Select>
              )}
            </div>

            <Divider />

            {/* Fee Waiver */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-default-50 rounded-lg">
                <div>
                  <p className="font-semibold text-sm">Fee Waiver Approval</p>
                  <p className="text-xs text-default-500">Require approval for fee waivers</p>
                </div>
                <Switch
                  isSelected={formData.editApprovalControls.feeWaiver.requiresApproval}
                  onValueChange={(v) => setFormData({
                    ...formData,
                    editApprovalControls: {
                      ...formData.editApprovalControls,
                      feeWaiver: { ...formData.editApprovalControls.feeWaiver, requiresApproval: v }
                    }
                  })}
                />
              </div>

              {formData.editApprovalControls.feeWaiver.requiresApproval && (
                <>
                  <Select
                    label="Approver Role"
                    selectedKeys={[formData.editApprovalControls.feeWaiver.approverRole]}
                    onChange={(e) => setFormData({
                      ...formData,
                      editApprovalControls: {
                        ...formData.editApprovalControls,
                        feeWaiver: { ...formData.editApprovalControls.feeWaiver, approverRole: e.target.value }
                      }
                    })}
                    variant="bordered"
                    size="sm"
                  >
                    <SelectItem key="principal">Principal</SelectItem>
                    <SelectItem key="director">Director</SelectItem>
                  </Select>

                  <Input
                    label="Max Amount Without Approval"
                    type="number"
                    value={formData.editApprovalControls.feeWaiver.maxAmountWithoutApproval}
                    onValueChange={(v) => setFormData({
                      ...formData,
                      editApprovalControls: {
                        ...formData.editApprovalControls,
                        feeWaiver: { 
                          ...formData.editApprovalControls.feeWaiver, 
                          maxAmountWithoutApproval: parseFloat(v) || 0 
                        }
                      }
                    })}
                    startContent="₹"
                    description="Waivers below this amount don't need approval"
                    variant="bordered"
                    size="sm"
                  />
                </>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Partial Payment Rules */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Partial Payment Rules</h3>
          </CardHeader>
          <Divider />
          <CardBody className="gap-4">
            <div className="flex items-center justify-between p-4 bg-default-50 rounded-lg">
              <div>
                <p className="font-semibold text-sm">Allow Partial Payments</p>
                <p className="text-xs text-default-500">Students can pay fees in parts</p>
              </div>
              <Switch
                isSelected={formData.allowPartialPayment}
                onValueChange={(v) => setFormData({ ...formData, allowPartialPayment: v })}
              />
            </div>

            {formData.allowPartialPayment && (
              <Input
                label="Minimum Partial Payment (%)"
                type="number"
                value={formData.minimumPartialPaymentPercent}
                onValueChange={(v) => setFormData({
                  ...formData,
                  minimumPartialPaymentPercent: parseFloat(v) || 0
                })}
                endContent="%"
                description="Minimum percentage of total fee that must be paid (0 for no minimum)"
                variant="bordered"
              />
            )}
          </CardBody>
        </Card>

        {/* Refund Policy */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Refund Policy</h3>
          </CardHeader>
          <Divider />
          <CardBody className="gap-4">
            <div className="flex items-center justify-between p-4 bg-default-50 rounded-lg">
              <div>
                <p className="font-semibold text-sm">Enable Refunds</p>
                <p className="text-xs text-default-500">Allow fee refunds for eligible cases</p>
              </div>
              <Switch
                isSelected={formData.refundPolicy.enabled}
                onValueChange={(v) => setFormData({
                  ...formData,
                  refundPolicy: { ...formData.refundPolicy, enabled: v }
                })}
              />
            </div>

            {formData.refundPolicy.enabled && (
              <Input
                label="Processing Days"
                type="number"
                value={formData.refundPolicy.processingDays}
                onValueChange={(v) => setFormData({
                  ...formData,
                  refundPolicy: { ...formData.refundPolicy, processingDays: parseInt(v) || 0 }
                })}
                description="Number of days to process refund requests"
                variant="bordered"
              />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
