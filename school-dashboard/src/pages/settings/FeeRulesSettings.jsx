import { request } from '../../services/api.js';
import { useState, useEffect, useCallback } from "react";
import logger from "../../utils/logger";
import {
  Button, Input, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure,
  Select, SelectItem, Switch
} from "@heroui/react";
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { Plus, Edit, Trash2, Save } from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "../../context/AppContext";
import { useTranslation } from 'react-i18next';
import HelpIcon from '../../components/ui/HelpIcon';


// ============ CONCESSIONS TAB ============
export function ConcessionsTab() {
  const { t } = useTranslation();
  const { currentAcademicYear } = useApp();
  const [concessions, setConcessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingConcession, setEditingConcession] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    discountType: "percentage",
    discountValue: 0,
    eligibilityType: "custom",
    isActive: true
  });

  const fetchConcessions = useCallback(async () => {
    setFetchError(null);
    try {
      setLoading(true);
      const data = await request(`/fee-settings/concessions?academicYear=${currentAcademicYear}`);
      setConcessions(data);
    } catch (error) {
      logger.error(error);
      setFetchError(error.message || 'Failed to load concessions');
    } finally {
      setLoading(false);
    }
  }, [currentAcademicYear]);

  useEffect(() => { fetchConcessions(); }, [fetchConcessions]);

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
    if (!formData.name.trim()) { toast.error(t('toast.error.nameRequired')); return; }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        eligibilityCriteria: { type: formData.eligibilityType, conditions: [] },
        academicYear: currentAcademicYear
      };
      const endpoint = editingConcession ? `/fee-settings/concessions/${editingConcession._id}` : `/fee-settings/concessions`;
      await request(endpoint, {
        method: editingConcession ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });
      toast.success(editingConcession ? 'Updated' : 'Created');
      fetchConcessions();
      onClose();
    } catch (error) {
      toast.error(error.message || t('toast.error.failedToSave'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('confirm.deleteConcession'))) return;
    try {
      await request(`/fee-settings/concessions/${id}`, { method: 'DELETE' });
      toast.success(t('toast.success.deleted'));
      fetchConcessions();
    } catch (error) {
      toast.error(error.message || t('toast.error.failedToDelete'));
    }
  };

  if (loading) return <TablePageSkeleton kpiCards={0} searchBar={false} rows={4} />;

  if (fetchError) return (
    <div className="flex flex-col items-center py-12 gap-4">
      <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">Failed to load concessions</p>
      <p className="text-xs text-gray-500 dark:text-zinc-400">{fetchError}</p>
      <button onClick={fetchConcessions} className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800">Retry</button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wider">{t('pages.concessionsDiscounts')}</h3>
        <button onClick={() => handleOpen()} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800">
          <Plus size={14} /> Add
        </button>
      </div>

      <div className="border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        <Table aria-label={t('aria.misc.concessions')} removeWrapper classNames={{ th: "bg-gray-50 dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 text-xs uppercase", td: "py-3" }}>
          <TableHeader>
            <TableColumn scope="col">{t('pages.nAME')}</TableColumn>
            <TableColumn scope="col">{t('pages.tYPE')}</TableColumn>
            <TableColumn scope="col">{t('pages.vALUE')}</TableColumn>
            <TableColumn scope="col">{t('pages.eLIGIBILITY')}</TableColumn>
            <TableColumn scope="col">{t('pages.sTATUS')}</TableColumn>
            <TableColumn align="end" scope="col">{t('pages.aCTIONS')}</TableColumn>
          </TableHeader>
          <TableBody emptyContent={<p className="text-gray-400 dark:text-zinc-500 text-sm py-8">{t('pages.noConcessions')}</p>}>
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
              <label className="text-xs text-gray-500 dark:text-zinc-400 uppercase mb-2 block">{t('pages.name1')}</label>
              <input type="text" placeholder={t('fees.concessionNamePlaceholder')} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-zinc-800 rounded-lg dark:bg-zinc-950 dark:text-zinc-100" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 dark:text-zinc-400 uppercase mb-2 block">{t('pages.type1')}</label>
                <Select size="sm" selectedKeys={[formData.discountType]} onChange={(e) => setFormData({ ...formData, discountType: e.target.value })} classNames={{ trigger: "bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800" }}>
                  <SelectItem key="percentage">{t('pages.percentage2')}</SelectItem>
                  <SelectItem key="flat">{t('pages.flatAmount')}</SelectItem>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-zinc-400 uppercase mb-2 block">{t('pages.value')}</label>
                <input type="number" value={formData.discountValue} onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-zinc-800 rounded-lg dark:bg-zinc-950 dark:text-zinc-100" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <label className="text-xs text-gray-500 dark:text-zinc-400 uppercase">{t('pages.eligibility')}</label>
                <HelpIcon
                  text="Determines which students automatically qualify for this concession. 'Sibling' applies to students with siblings already enrolled. 'Merit' is for academic performance. 'Financial' is for need-based assistance. 'Staff Ward' applies to children of school staff. 'Custom' lets you manually assign the concession per student."
                  size="sm"
                />
              </div>
              <Select size="sm" selectedKeys={[formData.eligibilityType]} onChange={(e) => setFormData({ ...formData, eligibilityType: e.target.value })} classNames={{ trigger: "bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800" }}>
                <SelectItem key="sibling">{t('pages.sibling')}</SelectItem>
                <SelectItem key="merit">{t('pages.merit')}</SelectItem>
                <SelectItem key="financial">{t('pages.financial')}</SelectItem>
                <SelectItem key="staff_ward">{t('pages.staffWard')}</SelectItem>
                <SelectItem key="custom">{t('pages.custom')}</SelectItem>
              </Select>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
              <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.active')}</span>
              <Switch size="sm" isSelected={formData.isActive} onValueChange={(v) => setFormData({ ...formData, isActive: v })} />
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-gray-200 dark:border-zinc-800 px-6 py-4 gap-3">
            <button onClick={onClose} disabled={saving} className="px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900 disabled:opacity-50">{t('pages.cancel2')}</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50">{saving ? 'Saving...' : t('pages.save')}</button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

// ============ LATE FEE TAB ============
export function LateFeeTab() {
  const { t } = useTranslation();
  const { currentAcademicYear } = useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ enabled: false, gracePeriod: 7, fineType: "flat", flatAmount: 100, perDayAmount: 10, maximumCap: 0 });

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const data = await request(`/fee-settings/late-fee-rules?academicYear=${currentAcademicYear}`);
      if (data.length > 0) setFormData(prev => ({ ...prev, ...data[0] }));
    } catch (error) { logger.error(error); }
    finally { setLoading(false); }
  }, [currentAcademicYear]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await request(`/fee-settings/late-fee-rules`, {
        method: 'POST',
        body: JSON.stringify({ ...formData, academicYear: currentAcademicYear })
      });
      toast.success(t('toast.success.saved'));
    } catch (error) { toast.error(error.message || t('toast.error.failedToSave')); }
    finally { setSaving(false); }
  };

  if (loading) return <TablePageSkeleton kpiCards={0} searchBar={false} rows={4} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wider">{t('pages.lateFeeRules')}</h3>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50">
          <Save size={14} /> Save
        </button>
      </div>

      <div className="border border-gray-200 dark:border-zinc-800 rounded-lg divide-y divide-gray-100 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.enableLateFee')}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.autoApplyLateFeesOnOverduePayments')}</p>
          </div>
          <Switch size="sm" isSelected={formData.enabled} onValueChange={(v) => setFormData({ ...formData, enabled: v })} />
        </div>

        {formData.enabled && (
          <>
            <div className="p-4">
              <label className="text-xs text-gray-500 dark:text-zinc-400 uppercase mb-2 block">{t('pages.gracePeriodDays')}</label>
              <input type="number" value={formData.gracePeriod} onChange={(e) => setFormData({ ...formData, gracePeriod: parseInt(e.target.value) || 0 })} className="w-32 px-3 py-2 text-sm border border-gray-200 dark:border-zinc-800 rounded-lg dark:bg-zinc-950 dark:text-zinc-100" />
            </div>

            <div className="p-4">
              <label className="text-xs text-gray-500 dark:text-zinc-400 uppercase mb-2 block">{t('pages.fineType')}</label>
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
                <label className="text-xs text-gray-500 dark:text-zinc-400 uppercase mb-2 block">{t('pages.flatAmount')}</label>
                <div className="relative w-40">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 text-sm">₹</span>
                  <input type="number" value={formData.flatAmount} onChange={(e) => setFormData({ ...formData, flatAmount: parseFloat(e.target.value) || 0 })} className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 dark:border-zinc-800 rounded-lg dark:bg-zinc-950 dark:text-zinc-100" />
                </div>
              </div>
            )}

            {formData.fineType === 'per_day' && (
              <div className="p-4">
                <label className="text-xs text-gray-500 dark:text-zinc-400 uppercase mb-2 block">{t('pages.perDayAmount')}</label>
                <div className="relative w-40">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 text-sm">₹</span>
                  <input type="number" value={formData.perDayAmount} onChange={(e) => setFormData({ ...formData, perDayAmount: parseFloat(e.target.value) || 0 })} className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 dark:border-zinc-800 rounded-lg dark:bg-zinc-950 dark:text-zinc-100" />
                </div>
              </div>
            )}

            <div className="p-4">
              <label className="text-xs text-gray-500 dark:text-zinc-400 uppercase mb-2 block">{t('pages.maximumCap0ForNoLimit')}</label>
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
  const { t } = useTranslation();
  const { currentAcademicYear } = useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    online: { enabled: true, upi: true, debitCard: true, creditCard: true, bankTransfer: true },
    offline: { enabled: true, cash: true, cheque: true, dd: true }
  });

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const data = await request(`/fee-settings/payment-methods?academicYear=${currentAcademicYear}`);
      if (data.length > 0) setFormData(data[0]);
    } catch (error) { logger.error(error); }
    finally { setLoading(false); }
  }, [currentAcademicYear]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await request(`/fee-settings/payment-methods`, {
        method: 'POST',
        body: JSON.stringify({ ...formData, academicYear: currentAcademicYear })
      });
      toast.success(t('toast.success.saved'));
    } catch (error) { toast.error(error.message || t('toast.error.failedToSave')); }
    finally { setSaving(false); }
  };

  if (loading) return <TablePageSkeleton kpiCards={0} searchBar={false} rows={4} />;

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
        <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wider">{t('pages.paymentMethods')}</h3>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50">
          <Save size={14} /> Save
        </button>
      </div>

      {/* Online Payments */}
      <div className="border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800">
          <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.onlinePayments')}</span>
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
          <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.offlinePayments')}</span>
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
  const { t } = useTranslation();
  const { currentAcademicYear } = useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ collectionInterval: "yearly", reminders: { enabled: true, daysBefore: 3 } });

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const data = await request(`/fee-settings/collection-period?academicYear=${currentAcademicYear}`);
      if (data.length > 0) setFormData({ collectionInterval: data[0].collectionInterval, reminders: data[0].autoPay || { enabled: true, daysBefore: 3 } });
    } catch (error) { logger.error(error); }
    finally { setLoading(false); }
  }, [currentAcademicYear]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const { reminders, ...rest } = formData;
      await request(`/fee-settings/collection-period`, {
        method: 'POST',
        body: JSON.stringify({ ...rest, academicYear: currentAcademicYear, autoPay: reminders })
      });
      toast.success(t('toast.success.saved'));
    } catch (error) { toast.error(error.message || t('toast.error.failedToSave')); }
    finally { setSaving(false); }
  };

  if (loading) return <TablePageSkeleton kpiCards={0} searchBar={false} rows={4} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wider">{t('pages.collectionSettings')}</h3>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50">
          <Save size={14} /> Save
        </button>
      </div>

      <div className="border border-gray-200 dark:border-zinc-800 rounded-lg divide-y divide-gray-100 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
        <div className="p-4">
          <label className="text-xs text-gray-500 dark:text-zinc-400 uppercase mb-2 block">{t('pages.collectionInterval')}</label>
          <Select size="sm" selectedKeys={[formData.collectionInterval]} onChange={(e) => setFormData({ ...formData, collectionInterval: e.target.value })} classNames={{ trigger: "bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 w-48" }}>
            <SelectItem key="monthly">{t('pages.monthly')}</SelectItem>
            <SelectItem key="quarterly">{t('pages.quarterly')}</SelectItem>
            <SelectItem key="yearly">{t('pages.yearly')}</SelectItem>
          </Select>
        </div>

        <div className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.paymentReminders')}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.autoSendRemindersBeforeDueDate')}</p>
          </div>
          <Switch size="sm" isSelected={formData.reminders.enabled} onValueChange={(v) => setFormData({ ...formData, reminders: { ...formData.reminders, enabled: v } })} />
        </div>

        {formData.reminders.enabled && (
          <div className="p-4">
            <label className="text-xs text-gray-500 dark:text-zinc-400 uppercase mb-2 block">{t('pages.daysBeforeDue')}</label>
            <input type="number" value={formData.reminders.daysBefore} onChange={(e) => setFormData({ ...formData, reminders: { ...formData.reminders, daysBefore: parseInt(e.target.value) || 0 } })} className="w-24 px-3 py-2 text-sm border border-gray-200 dark:border-zinc-800 rounded-lg dark:bg-zinc-950 dark:text-zinc-100" />
          </div>
        )}
      </div>
    </div>
  );
}

// ============ GENERAL RULES TAB ============
export function GeneralRulesTab() {
  const { t } = useTranslation();
  const { currentAcademicYear } = useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    newAdmission: { feeCalculation: "total" },
    allowPartialPayment: true,
    minimumPartialPaymentPercent: 0,
    refundPolicy: { enabled: false, processingDays: 7 }
  });

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const data = await request(`/fee-settings/rules?academicYear=${currentAcademicYear}`);
      if (data.length > 0) setFormData(data[0]);
    } catch (error) { logger.error(error); }
    finally { setLoading(false); }
  }, [currentAcademicYear]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await request(`/fee-settings/rules`, {
        method: 'POST',
        body: JSON.stringify({ ...formData, academicYear: currentAcademicYear })
      });
      toast.success(t('toast.success.saved'));
    } catch (error) { toast.error(error.message || t('toast.error.failedToSave')); }
    finally { setSaving(false); }
  };

  if (loading) return <TablePageSkeleton kpiCards={0} searchBar={false} rows={4} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wider">{t('pages.feeRules')}</h3>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50">
          <Save size={14} /> Save
        </button>
      </div>

      <div className="border border-gray-200 dark:border-zinc-800 rounded-lg divide-y divide-gray-100 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
        {/* New Admission */}
        <div className="p-4">
          <label className="text-xs text-gray-500 dark:text-zinc-400 uppercase mb-2 block">{t('pages.newAdmissionFeeCalculation')}</label>
          <Select size="sm" selectedKeys={[formData.newAdmission.feeCalculation]} onChange={(e) => setFormData({ ...formData, newAdmission: { feeCalculation: e.target.value } })} classNames={{ trigger: "bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 w-48" }}>
            <SelectItem key="total">{t('pages.fullYearFee')}</SelectItem>
            <SelectItem key="prorated">{t('pages.proratedFee')}</SelectItem>
          </Select>
        </div>

        {/* Partial Payment */}
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.allowPartialPayments')}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.studentsCanPayInInstallments')}</p>
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
            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.enableRefunds')}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.allowFeeRefundRequests')}</p>
          </div>
          <Switch size="sm" isSelected={formData.refundPolicy.enabled} onValueChange={(v) => setFormData({ ...formData, refundPolicy: { ...formData.refundPolicy, enabled: v } })} />
        </div>

        {formData.refundPolicy.enabled && (
          <div className="p-4">
            <label className="text-xs text-gray-500 dark:text-zinc-400 uppercase mb-2 block">{t('pages.processingDays')}</label>
            <input type="number" value={formData.refundPolicy.processingDays} onChange={(e) => setFormData({ ...formData, refundPolicy: { ...formData.refundPolicy, processingDays: parseInt(e.target.value) || 0 } })} className="w-24 px-3 py-2 text-sm border border-gray-200 dark:border-zinc-800 rounded-lg dark:bg-zinc-950 dark:text-zinc-100" />
          </div>
        )}
      </div>
    </div>
  );
}

// Default export with tabs
export default function FeeRulesSettings({ embedded = false }) {
  const { t } = useTranslation();
  return (
    <div className={embedded ? "space-y-6" : "max-w-5xl mx-auto pb-10 space-y-6"}>
      {!embedded && (
        <div className="border-b border-gray-200 dark:border-zinc-800 pb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">{t('pages.feeRules')}</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{t('pages.configurePoliciesAndSettings')}</p>
        </div>
      )}
      <p className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.accessTheseSettingsFromFeeManagementPage')}</p>
    </div>
  );
}
