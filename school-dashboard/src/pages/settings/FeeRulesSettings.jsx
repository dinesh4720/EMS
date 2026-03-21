import { useState, useEffect } from "react";
import {
  Button, Input, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure,
  Select, SelectItem, Switch, Spinner
} from "@heroui/react";
import { Plus, Edit, Trash2, Save } from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "../../context/AppContext";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// ============ CONCESSIONS TAB ============
export function ConcessionsTab() {
  const { currentAcademicYear } = useApp();
  const [concessions, setConcessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingConcession, setEditingConcession] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    discountType: "percentage",
    discountValue: 0,
    eligibilityType: "custom",
    isActive: true
  });

  useEffect(() => { fetchConcessions(); }, [currentAcademicYear]);

  const fetchConcessions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/fee-settings/concessions?academicYear=${currentAcademicYear}`);
      if (!response.ok) throw new Error('Failed to fetch');
      setConcessions(await response.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (concession = null) => {
    if (concession) {
      setEditingConcession(concession);
      setFormData({
        name: concession.name,
        discountType: concession.discountType,
        discountValue: concession.discountValue,
        eligibilityType: concession.eligibilityCriteria?.type || "custom",
        isActive: concession.isActive
      });
    } else {
      setEditingConcession(null);
      setFormData({ name: "", discountType: "percentage", discountValue: 0, eligibilityType: "custom", isActive: true });
    }
    onOpen();
  };

  const handleSave = async () => {
    if (!formData.name.trim()) { toast.error('Name required'); return; }
    try {
      const payload = {
        ...formData,
        eligibilityCriteria: { type: formData.eligibilityType, conditions: [] },
        academicYear: currentAcademicYear
      };
      const url = editingConcession ? `${API_URL}/fee-settings/concessions/${editingConcession._id}` : `${API_URL}/fee-settings/concessions`;
      const response = await fetch(url, {
        method: editingConcession ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Failed');
      toast.success(editingConcession ? 'Updated' : 'Created');
      fetchConcessions();
      onClose();
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this concession?')) return;
    try {
      await fetch(`${API_URL}/fee-settings/concessions/${id}`, { method: 'DELETE' });
      toast.success('Deleted');
      fetchConcessions();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wider">Concessions & Discounts</h3>
        <button onClick={() => handleOpen()} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800">
          <Plus size={14} /> Add
        </button>
      </div>

      <div className="border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        <Table aria-label="Concessions" removeWrapper classNames={{ th: "bg-gray-50 dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 text-xs uppercase", td: "py-3" }}>
          <TableHeader>
            <TableColumn>NAME</TableColumn>
            <TableColumn>TYPE</TableColumn>
            <TableColumn>VALUE</TableColumn>
            <TableColumn>ELIGIBILITY</TableColumn>
            <TableColumn>STATUS</TableColumn>
            <TableColumn align="end">ACTIONS</TableColumn>
          </TableHeader>
          <TableBody emptyContent={<p className="text-gray-400 dark:text-zinc-500 text-sm py-8">No concessions</p>}>
            {concessions.map((c) => (
              <TableRow key={c._id} className="hover:bg-gray-50 dark:hover:bg-zinc-900">
                <TableCell><span className="font-medium text-gray-900 dark:text-zinc-100">{c.name}</span></TableCell>
                <TableCell><span className="text-sm text-gray-600 dark:text-zinc-400">{c.discountType === 'percentage' ? 'Percentage' : 'Flat'}</span></TableCell>
                <TableCell><span className="font-mono text-gray-900 dark:text-zinc-100">{c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`}</span></TableCell>
                <TableCell><span className="text-sm text-gray-600 dark:text-zinc-400 capitalize">{c.eligibilityCriteria?.type || 'custom'}</span></TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border border-gray-200 dark:border-zinc-800 rounded bg-gray-50 dark:bg-zinc-900">
                    <span className={`w-1.5 h-1.5 rounded-full ${c.isActive ? "bg-gray-400" : "bg-gray-300"}`}></span>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => handleOpen(c)} className="p-1.5 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"><Edit size={14} /></button>
                    <button onClick={() => handleDelete(c._id)} className="p-1.5 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"><Trash2 size={14} /></button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalContent>
          <ModalHeader className="border-b border-gray-200 dark:border-zinc-800 px-6 py-4">{editingConcession ? 'Edit' : 'Add'} Concession</ModalHeader>
          <ModalBody className="p-6 space-y-4">
            <div>
              <label className="text-xs text-gray-500 dark:text-zinc-400 uppercase mb-2 block">Name</label>
              <input type="text" placeholder="e.g., Sibling Discount" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-zinc-800 rounded-lg dark:bg-zinc-950 dark:text-zinc-100" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 dark:text-zinc-400 uppercase mb-2 block">Type</label>
                <Select size="sm" selectedKeys={[formData.discountType]} onChange={(e) => setFormData({ ...formData, discountType: e.target.value })} classNames={{ trigger: "bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800" }}>
                  <SelectItem key="percentage">Percentage</SelectItem>
                  <SelectItem key="flat">Flat Amount</SelectItem>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-zinc-400 uppercase mb-2 block">Value</label>
                <input type="number" value={formData.discountValue} onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-zinc-800 rounded-lg dark:bg-zinc-950 dark:text-zinc-100" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-zinc-400 uppercase mb-2 block">Eligibility</label>
              <Select size="sm" selectedKeys={[formData.eligibilityType]} onChange={(e) => setFormData({ ...formData, eligibilityType: e.target.value })} classNames={{ trigger: "bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800" }}>
                <SelectItem key="sibling">Sibling</SelectItem>
                <SelectItem key="merit">Merit</SelectItem>
                <SelectItem key="financial">Financial</SelectItem>
                <SelectItem key="staff_ward">Staff Ward</SelectItem>
                <SelectItem key="custom">Custom</SelectItem>
              </Select>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
              <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">Active</span>
              <Switch size="sm" isSelected={formData.isActive} onValueChange={(v) => setFormData({ ...formData, isActive: v })} />
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-gray-200 dark:border-zinc-800 px-6 py-4 gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-gray-800">Save</button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

// ============ LATE FEE TAB ============
export function LateFeeTab() {
  const { currentAcademicYear } = useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ enabled: false, gracePeriod: 7, fineType: "flat", flatAmount: 100, perDayAmount: 10, maximumCap: 0 });

  useEffect(() => { fetchConfig(); }, [currentAcademicYear]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/fee-settings/late-fee-rules?academicYear=${currentAcademicYear}`);
      const data = await response.json();
      if (data.length > 0) setFormData({ ...formData, ...data[0] });
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await fetch(`${API_URL}/fee-settings/late-fee-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, academicYear: currentAcademicYear })
      });
      toast.success('Saved');
    } catch (error) { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wider">Late Fee Rules</h3>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50">
          <Save size={14} /> Save
        </button>
      </div>

      <div className="border border-gray-200 dark:border-zinc-800 rounded-lg divide-y divide-gray-100 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">Enable Late Fee</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">Auto-apply late fees on overdue payments</p>
          </div>
          <Switch size="sm" isSelected={formData.enabled} onValueChange={(v) => setFormData({ ...formData, enabled: v })} />
        </div>

        {formData.enabled && (
          <>
            <div className="p-4">
              <label className="text-xs text-gray-500 dark:text-zinc-400 uppercase mb-2 block">Grace Period (Days)</label>
              <input type="number" value={formData.gracePeriod} onChange={(e) => setFormData({ ...formData, gracePeriod: parseInt(e.target.value) || 0 })} className="w-32 px-3 py-2 text-sm border border-gray-200 dark:border-zinc-800 rounded-lg dark:bg-zinc-950 dark:text-zinc-100" />
            </div>

            <div className="p-4">
              <label className="text-xs text-gray-500 dark:text-zinc-400 uppercase mb-2 block">Fine Type</label>
              <div className="flex gap-2">
                {[
                  { key: 'flat', label: 'Flat Amount' },
                  { key: 'per_day', label: 'Per Day' }
                ].map(type => (
                  <button key={type.key} onClick={() => setFormData({ ...formData, fineType: type.key })} className={`px-4 py-2 text-sm rounded-lg border ${formData.fineType === type.key ? 'bg-gray-900 text-white border-gray-900' : 'bg-white dark:bg-zinc-950 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-600'}`}>
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {formData.fineType === 'flat' && (
              <div className="p-4">
                <label className="text-xs text-gray-500 dark:text-zinc-400 uppercase mb-2 block">Flat Amount</label>
                <div className="relative w-40">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 text-sm">₹</span>
                  <input type="number" value={formData.flatAmount} onChange={(e) => setFormData({ ...formData, flatAmount: parseFloat(e.target.value) || 0 })} className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 dark:border-zinc-800 rounded-lg dark:bg-zinc-950 dark:text-zinc-100" />
                </div>
              </div>
            )}

            {formData.fineType === 'per_day' && (
              <div className="p-4">
                <label className="text-xs text-gray-500 dark:text-zinc-400 uppercase mb-2 block">Per Day Amount</label>
                <div className="relative w-40">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 text-sm">₹</span>
                  <input type="number" value={formData.perDayAmount} onChange={(e) => setFormData({ ...formData, perDayAmount: parseFloat(e.target.value) || 0 })} className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 dark:border-zinc-800 rounded-lg dark:bg-zinc-950 dark:text-zinc-100" />
                </div>
              </div>
            )}

            <div className="p-4">
              <label className="text-xs text-gray-500 dark:text-zinc-400 uppercase mb-2 block">Maximum Cap (0 for no limit)</label>
              <div className="relative w-40">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 text-sm">₹</span>
                <input type="number" value={formData.maximumCap} onChange={(e) => setFormData({ ...formData, maximumCap: parseFloat(e.target.value) || 0 })} className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 dark:border-zinc-800 rounded-lg dark:bg-zinc-950 dark:text-zinc-100" />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============ PAYMENT METHODS TAB ============
export function PaymentMethodsTab() {
  const { currentAcademicYear } = useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    online: { enabled: true, upi: true, debitCard: true, creditCard: true, bankTransfer: true },
    offline: { enabled: true, cash: true, cheque: true, dd: true }
  });

  useEffect(() => { fetchConfig(); }, [currentAcademicYear]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/fee-settings/payment-methods?academicYear=${currentAcademicYear}`);
      const data = await response.json();
      if (data.length > 0) setFormData(data[0]);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await fetch(`${API_URL}/fee-settings/payment-methods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, academicYear: currentAcademicYear })
      });
      toast.success('Saved');
    } catch (error) { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  const onlineMethods = [
    { key: 'upi', label: 'UPI', desc: 'Google Pay, PhonePe, etc.' },
    { key: 'debitCard', label: 'Debit Card', desc: 'All major cards' },
    { key: 'creditCard', label: 'Credit Card', desc: 'All major cards' },
    { key: 'bankTransfer', label: 'Bank Transfer', desc: 'NEFT, RTGS, IMPS' }
  ];

  const offlineMethods = [
    { key: 'cash', label: 'Cash', desc: 'At school office' },
    { key: 'cheque', label: 'Cheque', desc: 'Cheque payments' },
    { key: 'dd', label: 'Demand Draft', desc: 'DD payments' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wider">Payment Methods</h3>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50">
          <Save size={14} /> Save
        </button>
      </div>

      {/* Online Payments */}
      <div className="border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800">
          <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">Online Payments</span>
          <Switch size="sm" isSelected={formData.online.enabled} onValueChange={(v) => setFormData({ ...formData, online: { ...formData.online, enabled: v } })} />
        </div>
        {formData.online.enabled && (
          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            {onlineMethods.map(m => (
              <div key={m.key} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-gray-900 dark:text-zinc-100">{m.label}</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">{m.desc}</p>
                </div>
                <Switch size="sm" isSelected={formData.online[m.key]} onValueChange={(v) => setFormData({ ...formData, online: { ...formData.online, [m.key]: v } })} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Offline Payments */}
      <div className="border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800">
          <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">Offline Payments</span>
          <Switch size="sm" isSelected={formData.offline.enabled} onValueChange={(v) => setFormData({ ...formData, offline: { ...formData.offline, enabled: v } })} />
        </div>
        {formData.offline.enabled && (
          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            {offlineMethods.map(m => (
              <div key={m.key} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-gray-900 dark:text-zinc-100">{m.label}</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">{m.desc}</p>
                </div>
                <Switch size="sm" isSelected={formData.offline[m.key]} onValueChange={(v) => setFormData({ ...formData, offline: { ...formData.offline, [m.key]: v } })} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ COLLECTION PERIOD TAB ============
export function CollectionPeriodTab() {
  const { currentAcademicYear } = useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ collectionInterval: "yearly", reminders: { enabled: true, daysBefore: 3 } });

  useEffect(() => { fetchConfig(); }, [currentAcademicYear]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/fee-settings/collection-period?academicYear=${currentAcademicYear}`);
      const data = await response.json();
      if (data.length > 0) setFormData({ collectionInterval: data[0].collectionInterval, reminders: data[0].autoPay || { enabled: true, daysBefore: 3 } });
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await fetch(`${API_URL}/fee-settings/collection-period`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, academicYear: currentAcademicYear, autoPay: formData.reminders })
      });
      toast.success('Saved');
    } catch (error) { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wider">Collection Settings</h3>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50">
          <Save size={14} /> Save
        </button>
      </div>

      <div className="border border-gray-200 dark:border-zinc-800 rounded-lg divide-y divide-gray-100 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
        <div className="p-4">
          <label className="text-xs text-gray-500 dark:text-zinc-400 uppercase mb-2 block">Collection Interval</label>
          <Select size="sm" selectedKeys={[formData.collectionInterval]} onChange={(e) => setFormData({ ...formData, collectionInterval: e.target.value })} classNames={{ trigger: "bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 w-48" }}>
            <SelectItem key="monthly">Monthly</SelectItem>
            <SelectItem key="quarterly">Quarterly</SelectItem>
            <SelectItem key="yearly">Yearly</SelectItem>
          </Select>
        </div>

        <div className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">Payment Reminders</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">Auto-send reminders before due date</p>
          </div>
          <Switch size="sm" isSelected={formData.reminders.enabled} onValueChange={(v) => setFormData({ ...formData, reminders: { ...formData.reminders, enabled: v } })} />
        </div>

        {formData.reminders.enabled && (
          <div className="p-4">
            <label className="text-xs text-gray-500 dark:text-zinc-400 uppercase mb-2 block">Days Before Due</label>
            <input type="number" value={formData.reminders.daysBefore} onChange={(e) => setFormData({ ...formData, reminders: { ...formData.reminders, daysBefore: parseInt(e.target.value) || 0 } })} className="w-24 px-3 py-2 text-sm border border-gray-200 dark:border-zinc-800 rounded-lg dark:bg-zinc-950 dark:text-zinc-100" />
          </div>
        )}
      </div>
    </div>
  );
}

// ============ GENERAL RULES TAB ============
export function GeneralRulesTab() {
  const { currentAcademicYear } = useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    newAdmission: { feeCalculation: "total" },
    allowPartialPayment: true,
    minimumPartialPaymentPercent: 0,
    refundPolicy: { enabled: false, processingDays: 7 }
  });

  useEffect(() => { fetchConfig(); }, [currentAcademicYear]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/fee-settings/rules?academicYear=${currentAcademicYear}`);
      const data = await response.json();
      if (data.length > 0) setFormData(data[0]);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await fetch(`${API_URL}/fee-settings/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, academicYear: currentAcademicYear })
      });
      toast.success('Saved');
    } catch (error) { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wider">Fee Rules</h3>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50">
          <Save size={14} /> Save
        </button>
      </div>

      <div className="border border-gray-200 dark:border-zinc-800 rounded-lg divide-y divide-gray-100 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
        {/* New Admission */}
        <div className="p-4">
          <label className="text-xs text-gray-500 dark:text-zinc-400 uppercase mb-2 block">New Admission Fee Calculation</label>
          <Select size="sm" selectedKeys={[formData.newAdmission.feeCalculation]} onChange={(e) => setFormData({ ...formData, newAdmission: { feeCalculation: e.target.value } })} classNames={{ trigger: "bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 w-48" }}>
            <SelectItem key="total">Full Year Fee</SelectItem>
            <SelectItem key="prorated">Prorated Fee</SelectItem>
          </Select>
        </div>

        {/* Partial Payment */}
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">Allow Partial Payments</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">Students can pay in installments</p>
          </div>
          <Switch size="sm" isSelected={formData.allowPartialPayment} onValueChange={(v) => setFormData({ ...formData, allowPartialPayment: v })} />
        </div>

        {formData.allowPartialPayment && (
          <div className="p-4">
            <label className="text-xs text-gray-500 dark:text-zinc-400 uppercase mb-2 block">Minimum Payment %</label>
            <input type="number" value={formData.minimumPartialPaymentPercent} onChange={(e) => setFormData({ ...formData, minimumPartialPaymentPercent: parseFloat(e.target.value) || 0 })} className="w-24 px-3 py-2 text-sm border border-gray-200 dark:border-zinc-800 rounded-lg dark:bg-zinc-950 dark:text-zinc-100" />
          </div>
        )}

        {/* Refund Policy */}
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">Enable Refunds</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">Allow fee refund requests</p>
          </div>
          <Switch size="sm" isSelected={formData.refundPolicy.enabled} onValueChange={(v) => setFormData({ ...formData, refundPolicy: { ...formData.refundPolicy, enabled: v } })} />
        </div>

        {formData.refundPolicy.enabled && (
          <div className="p-4">
            <label className="text-xs text-gray-500 dark:text-zinc-400 uppercase mb-2 block">Processing Days</label>
            <input type="number" value={formData.refundPolicy.processingDays} onChange={(e) => setFormData({ ...formData, refundPolicy: { ...formData.refundPolicy, processingDays: parseInt(e.target.value) || 0 } })} className="w-24 px-3 py-2 text-sm border border-gray-200 dark:border-zinc-800 rounded-lg dark:bg-zinc-950 dark:text-zinc-100" />
          </div>
        )}
      </div>
    </div>
  );
}

// Default export with tabs
export default function FeeRulesSettings({ embedded = false }) {
  return (
    <div className={embedded ? "space-y-6" : "max-w-5xl mx-auto pb-10 space-y-6"}>
      {!embedded && (
        <div className="border-b border-gray-200 dark:border-zinc-800 pb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">Fee Rules</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Configure policies and settings</p>
        </div>
      )}
      <p className="text-sm text-gray-500 dark:text-zinc-400">Access these settings from Fee Management page.</p>
    </div>
  );
}
