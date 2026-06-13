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
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useConfirmDialog from '../../hooks/useConfirmDialog';
import { useCurrency } from '../../context/hooks/useCurrency';


// ============ CONCESSIONS TAB ============
export function ConcessionsTab() {
  const { t } = useTranslation();
  const { fmt } = useCurrency();
  const { currentAcademicYear } = useApp();
  const [concessions, setConcessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();
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
      setConcessions(Array.isArray(data) ? data : []);
    } catch (error) {
      logger.error(error);
      setFetchError(error.message || 'Failed to load concessions');
    } finally {
      setLoading(false);
    }
  }, [currentAcademicYear]);

  useEffect(() => { fetchConcessions(); }, [fetchConcessions]);

  const handleOpen = useCallback((concession = null) => {
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
  }, [onOpen]);

  // AUDIT-129: Added validation for discount value
  const handleSave = async () => {
    if (!formData.name.trim()) { toast.error(t('toast.error.nameRequired')); return; }
    if (formData.discountType === 'percentage' && (formData.discountValue < 0 || formData.discountValue > 100)) {
      toast.error('Discount percentage must be between 0 and 100'); return;
    }
    if (formData.discountType === 'fixed' && formData.discountValue < 0) {
      toast.error('Discount amount cannot be negative'); return;
    }
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

  const handleDelete = (id) => {
    showConfirm({
      title: 'Delete Concession',
      message: t('confirm.deleteConcession'),
      variant: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await request(`/fee-settings/concessions/${id}`, { method: 'DELETE' });
          toast.success(t('toast.success.deleted'));
          fetchConcessions();
        } catch (error) {
          toast.error(error.message || t('toast.error.failedToDelete'));
        }
      },
    });
  };

  if (loading) return <TablePageSkeleton kpiCards={0} searchBar={false} rows={4} />;

  if (fetchError) return (
    <div className="flex flex-col items-center py-12 gap-4">
      <p className="text-sm font-medium text-fg">Failed to load concessions</p>
      <p className="text-xs text-fg-muted">{fetchError}</p>
      <button onClick={fetchConcessions} className="px-3 py-1.5 text-sm font-medium text-fg bg-surface rounded-lg hover:bg-surface-2">Retry</button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-fg uppercase tracking-wider">{t('pages.concessionsDiscounts')}</h3>
        <button onClick={() => handleOpen()} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-fg bg-surface rounded-lg hover:bg-surface-2">
          <Plus size={14} /> Add
        </button>
      </div>

      <div className="border border-border-token rounded-lg overflow-hidden">
        <Table aria-label={t('aria.misc.concessions')} removeWrapper classNames={{ th: "bg-surface-2 text-fg-muted text-xs uppercase", td: "py-3" }}>
          <TableHeader>
            <TableColumn scope="col">{t('pages.nAME')}</TableColumn>
            <TableColumn scope="col">{t('pages.tYPE')}</TableColumn>
            <TableColumn scope="col">{t('pages.vALUE')}</TableColumn>
            <TableColumn scope="col">{t('pages.eLIGIBILITY')}</TableColumn>
            <TableColumn scope="col">{t('pages.sTATUS')}</TableColumn>
            <TableColumn align="end" scope="col">{t('pages.aCTIONS')}</TableColumn>
          </TableHeader>
          <TableBody emptyContent={<p className="text-fg-faint text-sm py-8">{t('pages.noConcessions')}</p>}>
            {concessions.map((c) => (
              <TableRow key={c._id} className="hover:bg-surface-2">
                <TableCell><span className="font-medium text-fg">{c.name}</span></TableCell>
                <TableCell><span className="text-sm text-fg-muted">{c.discountType === 'percentage' ? 'Percentage' : 'Flat'}</span></TableCell>
                <TableCell><span className="font-mono text-fg">{c.discountType === 'percentage' ? `${c.discountValue}%` : fmt(c.discountValue)}</span></TableCell>
                <TableCell><span className="text-sm text-fg-muted capitalize">{c.eligibilityCriteria?.type || 'custom'}</span></TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border border-border-token rounded bg-surface-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${c.isActive ? "bg-fg-faint" : "bg-surface-2"}`}></span>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 justify-end">
                    <button aria-label="Edit fee rule" onClick={() => handleOpen(c)} className="p-1.5 text-fg-faint hover:text-fg"><Edit size={14} /></button>
                    <button aria-label="Delete fee rule" onClick={() => handleDelete(c._id)} className="p-1.5 text-fg-faint hover:text-fg"><Trash2 size={14} /></button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalContent>
          <ModalHeader className="border-b border-border-token px-6 py-4">{editingConcession ? 'Edit' : 'Add'} Concession</ModalHeader>
          <ModalBody className="p-6 space-y-4">
            <div>
              <label htmlFor="fee-concession-name" className="text-xs text-fg-muted uppercase mb-2 block">{t('pages.name1')}</label>
              <input id="fee-concession-name" type="text" placeholder={t('fees.concessionNamePlaceholder')} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-token rounded-lg" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-fg-muted uppercase mb-2 block">{t('pages.type1')}</label>
                <Select size="sm" selectedKeys={[formData.discountType]} onChange={(e) => setFormData({ ...formData, discountType: e.target.value })} classNames={{ trigger: "bg-surface border-border-token" }}>
                  <SelectItem key="percentage">{t('pages.percentage2')}</SelectItem>
                  <SelectItem key="flat">{t('pages.flatAmount')}</SelectItem>
                </Select>
              </div>
              <div>
                <label htmlFor="fee-concession-value" className="text-xs text-fg-muted uppercase mb-2 block">{t('pages.value')}</label>
                <input id="fee-concession-value" type="number" value={formData.discountValue} onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 text-sm border border-border-token rounded-lg" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <label className="text-xs text-fg-muted uppercase">{t('pages.eligibility')}</label>
                <HelpIcon
                  text="Determines which students automatically qualify for this concession. 'Sibling' applies to students with siblings already enrolled. 'Merit' is for academic performance. 'Financial' is for need-based assistance. 'Staff Ward' applies to children of school staff. 'Custom' lets you manually assign the concession per student."
                  size="sm"
                />
              </div>
              <Select size="sm" selectedKeys={[formData.eligibilityType]} onChange={(e) => setFormData({ ...formData, eligibilityType: e.target.value })} classNames={{ trigger: "bg-surface border-border-token" }}>
                <SelectItem key="sibling">{t('pages.sibling')}</SelectItem>
                <SelectItem key="merit">{t('pages.merit')}</SelectItem>
                <SelectItem key="financial">{t('pages.financial')}</SelectItem>
                <SelectItem key="staff_ward">{t('pages.staffWard')}</SelectItem>
                <SelectItem key="custom">{t('pages.custom')}</SelectItem>
              </Select>
            </div>
            <div className="flex items-center justify-between p-4 bg-surface-2 rounded-lg border border-border-token">
              <span className="text-sm font-medium text-fg">{t('pages.active')}</span>
              <Switch size="sm" isSelected={formData.isActive} onValueChange={(v) => setFormData({ ...formData, isActive: v })} />
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-border-token px-6 py-4 gap-3">
            <button onClick={onClose} disabled={saving} className="px-4 py-2 text-sm text-fg bg-surface border border-border-token rounded-lg hover:bg-surface-2 disabled:opacity-50">{t('pages.cancel2')}</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm text-fg bg-surface rounded-lg hover:bg-surface-2 disabled:opacity-50">{saving ? 'Saving...' : t('pages.save')}</button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </div>
  );
}

// ============ LATE FEE TAB ============
export function LateFeeTab() {
  const { t } = useTranslation();
  const { currencySymbol } = useCurrency();
  const { currentAcademicYear } = useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [formData, setFormData] = useState({ enabled: false, gracePeriod: 7, fineType: "flat", flatAmount: 100, perDayAmount: 10, maximumCap: 0 });

  const fetchConfig = useCallback(async () => {
    setFetchError(null);
    try {
      setLoading(true);
      const data = await request(`/fee-settings/late-fee-rules?academicYear=${currentAcademicYear}`);
      const items = Array.isArray(data) ? data : [];
      if (items.length > 0) setFormData(prev => ({ ...prev, ...items[0] }));
    } catch (error) {
      logger.error(error);
      setFetchError(error.message || 'Failed to load late fee rules');
    } finally { setLoading(false); }
  }, [currentAcademicYear]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  // AUDIT-129: Added validation for late fee amounts
  const handleSave = async () => {
    if (formData.enabled) {
      if (formData.gracePeriod < 0) { toast.error('Grace period cannot be negative'); return; }
      if (formData.fineType === 'flat' && formData.flatAmount <= 0) { toast.error('Flat amount must be greater than 0'); return; }
      if (formData.fineType === 'per_day' && formData.perDayAmount <= 0) { toast.error('Per day amount must be greater than 0'); return; }
      if (formData.maximumCap < 0) { toast.error('Maximum cap cannot be negative'); return; }
    }
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

  if (fetchError) return (
    <div className="flex flex-col items-center py-12 gap-4">
      <p className="text-sm font-medium text-fg">Failed to load late fee rules</p>
      <p className="text-xs text-fg-muted">{fetchError}</p>
      <button onClick={fetchConfig} className="px-3 py-1.5 text-sm font-medium text-fg bg-surface rounded-lg hover:bg-surface-2">Retry</button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-fg uppercase tracking-wider">{t('pages.lateFeeRules')}</h3>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-fg bg-surface rounded-lg hover:bg-surface-2 disabled:opacity-50">
          <Save size={14} /> Save
        </button>
      </div>

      <div className="border border-border-token rounded-lg divide-y divide-divider bg-surface">
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium text-fg">{t('pages.enableLateFee')}</p>
            <p className="text-xs text-fg-muted">{t('pages.autoApplyLateFeesOnOverduePayments')}</p>
          </div>
          <Switch size="sm" isSelected={formData.enabled} onValueChange={(v) => setFormData({ ...formData, enabled: v })} />
        </div>

        {formData.enabled && (
          <>
            <div className="p-4">
              <label htmlFor="late-fee-grace-period" className="text-xs text-fg-muted uppercase mb-2 block">{t('pages.gracePeriodDays')}</label>
              <input id="late-fee-grace-period" type="number" value={formData.gracePeriod} onChange={(e) => setFormData({ ...formData, gracePeriod: parseInt(e.target.value) || 0 })} className="w-32 px-3 py-2 text-sm border border-border-token rounded-lg" />
            </div>

            <div className="p-4">
              <label className="text-xs text-fg-muted uppercase mb-2 block">{t('pages.fineType')}</label>
              <div className="flex gap-2">
                {[
                  { key: 'flat', label: 'Flat Amount' },
                  { key: 'per_day', label: 'Per Day' }
                ].map(type => (
                  <button key={type.key} onClick={() => setFormData({ ...formData, fineType: type.key })} className={`px-4 py-2 text-sm rounded-lg border ${formData.fineType === type.key ? 'bg-surface text-fg border-border-token' : 'bg-surface text-fg-muted border-border-token hover:border-border-strong'}`}>
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {formData.fineType === 'flat' && (
              <div className="p-4">
                <label htmlFor="late-fee-flat-amount" className="text-xs text-fg-muted uppercase mb-2 block">{t('pages.flatAmount')}</label>
                <div className="relative w-40">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint text-sm">{currencySymbol}</span>
                  <input id="late-fee-flat-amount" type="number" value={formData.flatAmount} onChange={(e) => setFormData({ ...formData, flatAmount: parseFloat(e.target.value) || 0 })} className="w-full pl-7 pr-3 py-2 text-sm border border-border-token rounded-lg" />
                </div>
              </div>
            )}

            {formData.fineType === 'per_day' && (
              <div className="p-4">
                <label htmlFor="late-fee-per-day" className="text-xs text-fg-muted uppercase mb-2 block">{t('pages.perDayAmount')}</label>
                <div className="relative w-40">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint text-sm">{currencySymbol}</span>
                  <input id="late-fee-per-day" type="number" value={formData.perDayAmount} onChange={(e) => setFormData({ ...formData, perDayAmount: parseFloat(e.target.value) || 0 })} className="w-full pl-7 pr-3 py-2 text-sm border border-border-token rounded-lg" />
                </div>
              </div>
            )}

            <div className="p-4">
              <label htmlFor="late-fee-max-cap" className="text-xs text-fg-muted uppercase mb-2 block">{t('pages.maximumCap0ForNoLimit')}</label>
              <div className="relative w-40">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint text-sm">₹</span>
                <input id="late-fee-max-cap" type="number" value={formData.maximumCap} onChange={(e) => setFormData({ ...formData, maximumCap: parseFloat(e.target.value) || 0 })} className="w-full pl-7 pr-3 py-2 text-sm border border-border-token rounded-lg" />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const ONLINE_METHODS = [
  { key: 'upi', label: 'UPI', desc: 'Google Pay, PhonePe, etc.' },
  { key: 'debitCard', label: 'Debit Card', desc: 'All major cards' },
  { key: 'creditCard', label: 'Credit Card', desc: 'All major cards' },
  { key: 'bankTransfer', label: 'Bank Transfer', desc: 'NEFT, RTGS, IMPS' }
];

const OFFLINE_METHODS = [
  { key: 'cash', label: 'Cash', desc: 'At school office' },
  { key: 'cheque', label: 'Cheque', desc: 'Cheque payments' },
  { key: 'dd', label: 'Demand Draft', desc: 'DD payments' }
];

const PAYMENT_METHODS_DEFAULT = {
  online: { enabled: true, upi: true, debitCard: true, creditCard: true, bankTransfer: true },
  offline: { enabled: true, cash: true, cheque: true, dd: true }
};

// ============ PAYMENT METHODS TAB ============
export function PaymentMethodsTab() {
  const { t } = useTranslation();
  const { currentAcademicYear } = useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [formData, setFormData] = useState(PAYMENT_METHODS_DEFAULT);

  const fetchConfig = useCallback(async () => {
    setFetchError(null);
    try {
      setLoading(true);
      const data = await request(`/fee-settings/payment-methods?academicYear=${currentAcademicYear}`);
      const items = Array.isArray(data) ? data : [];
      if (items.length > 0) {
        const config = items[0];
        setFormData({
          online: { ...PAYMENT_METHODS_DEFAULT.online, ...config.online },
          offline: { ...PAYMENT_METHODS_DEFAULT.offline, ...config.offline }
        });
      }
    } catch (error) {
      logger.error(error);
      setFetchError(error.message || 'Failed to load payment methods');
    } finally { setLoading(false); }
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

  if (fetchError) return (
    <div className="flex flex-col items-center py-12 gap-4">
      <p className="text-sm font-medium text-fg">Failed to load payment methods</p>
      <p className="text-xs text-fg-muted">{fetchError}</p>
      <button onClick={fetchConfig} className="px-3 py-1.5 text-sm font-medium text-fg bg-surface rounded-lg hover:bg-surface-2">Retry</button>
    </div>
  );



  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-fg uppercase tracking-wider">{t('pages.paymentMethods')}</h3>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-fg bg-surface rounded-lg hover:bg-surface-2 disabled:opacity-50">
          <Save size={14} /> Save
        </button>
      </div>

      {/* Online Payments */}
      <div className="border border-border-token rounded-lg bg-surface">
        <div className="flex items-center justify-between p-4 border-b border-divider">
          <span className="text-sm font-medium text-fg">{t('pages.onlinePayments')}</span>
          <Switch size="sm" isSelected={formData.online.enabled} onValueChange={(v) => setFormData({ ...formData, online: { ...formData.online, enabled: v } })} />
        </div>
        {formData.online.enabled && (
          <div className="divide-y divide-divider">
            {ONLINE_METHODS.map(m => (
              <div key={m.key} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-fg">{m.label}</p>
                  <p className="text-xs text-fg-muted">{m.desc}</p>
                </div>
                <Switch size="sm" isSelected={formData.online[m.key]} onValueChange={(v) => setFormData({ ...formData, online: { ...formData.online, [m.key]: v } })} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Offline Payments */}
      <div className="border border-border-token rounded-lg bg-surface">
        <div className="flex items-center justify-between p-4 border-b border-divider">
          <span className="text-sm font-medium text-fg">{t('pages.offlinePayments')}</span>
          <Switch size="sm" isSelected={formData.offline.enabled} onValueChange={(v) => setFormData({ ...formData, offline: { ...formData.offline, enabled: v } })} />
        </div>
        {formData.offline.enabled && (
          <div className="divide-y divide-divider">
            {OFFLINE_METHODS.map(m => (
              <div key={m.key} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-fg">{m.label}</p>
                  <p className="text-xs text-fg-muted">{m.desc}</p>
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
  const [fetchError, setFetchError] = useState(null);
  const [formData, setFormData] = useState({ collectionInterval: "yearly", reminders: { enabled: true, daysBefore: 3 } });

  const fetchConfig = useCallback(async () => {
    setFetchError(null);
    try {
      setLoading(true);
      const data = await request(`/fee-settings/collection-period?academicYear=${currentAcademicYear}`);
      const items = Array.isArray(data) ? data : [];
      if (items.length > 0) setFormData({ collectionInterval: items[0].collectionInterval || "yearly", reminders: items[0].autoPay || { enabled: true, daysBefore: 3 } });
    } catch (error) {
      logger.error(error);
      setFetchError(error.message || 'Failed to load collection settings');
    } finally { setLoading(false); }
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

  if (fetchError) return (
    <div className="flex flex-col items-center py-12 gap-4">
      <p className="text-sm font-medium text-fg">Failed to load collection settings</p>
      <p className="text-xs text-fg-muted">{fetchError}</p>
      <button onClick={fetchConfig} className="px-3 py-1.5 text-sm font-medium text-fg bg-surface rounded-lg hover:bg-surface-2">Retry</button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-fg uppercase tracking-wider">{t('pages.collectionSettings')}</h3>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-fg bg-surface rounded-lg hover:bg-surface-2 disabled:opacity-50">
          <Save size={14} /> Save
        </button>
      </div>

      <div className="border border-border-token rounded-lg divide-y divide-divider bg-surface">
        <div className="p-4">
          <label className="text-xs text-fg-muted uppercase mb-2 block">{t('pages.collectionInterval')}</label>
          <Select size="sm" selectedKeys={[formData.collectionInterval]} onChange={(e) => setFormData({ ...formData, collectionInterval: e.target.value })} classNames={{ trigger: "bg-surface border-border-token w-48" }}>
            <SelectItem key="monthly">{t('pages.monthly')}</SelectItem>
            <SelectItem key="quarterly">{t('pages.quarterly')}</SelectItem>
            <SelectItem key="yearly">{t('pages.yearly')}</SelectItem>
          </Select>
        </div>

        <div className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium text-fg">{t('pages.paymentReminders')}</p>
            <p className="text-xs text-fg-muted">{t('pages.autoSendRemindersBeforeDueDate')}</p>
          </div>
          <Switch size="sm" isSelected={formData.reminders.enabled} onValueChange={(v) => setFormData({ ...formData, reminders: { ...formData.reminders, enabled: v } })} />
        </div>

        {formData.reminders.enabled && (
          <div className="p-4">
            <label htmlFor="reminder-days-before" className="text-xs text-fg-muted uppercase mb-2 block">{t('pages.daysBeforeDue')}</label>
            <input id="reminder-days-before" type="number" value={formData.reminders.daysBefore} onChange={(e) => setFormData({ ...formData, reminders: { ...formData.reminders, daysBefore: parseInt(e.target.value) || 0 } })} className="w-24 px-3 py-2 text-sm border border-border-token rounded-lg" />
          </div>
        )}
      </div>
    </div>
  );
}

const GENERAL_RULES_DEFAULT = {
  newAdmission: { feeCalculation: "total" },
  allowPartialPayment: true,
  minimumPartialPaymentPercent: 0,
  refundPolicy: { enabled: false, processingDays: 7 }
};

// ============ GENERAL RULES TAB ============
export function GeneralRulesTab() {
  const { t } = useTranslation();
  const { currentAcademicYear } = useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [formData, setFormData] = useState(GENERAL_RULES_DEFAULT);

  const fetchConfig = useCallback(async () => {
    setFetchError(null);
    try {
      setLoading(true);
      const data = await request(`/fee-settings/rules?academicYear=${currentAcademicYear}`);
      const items = Array.isArray(data) ? data : [];
      if (items.length > 0) {
        const config = items[0];
        setFormData({
          newAdmission: { ...GENERAL_RULES_DEFAULT.newAdmission, ...config.newAdmission },
          allowPartialPayment: config.allowPartialPayment ?? GENERAL_RULES_DEFAULT.allowPartialPayment,
          minimumPartialPaymentPercent: config.minimumPartialPaymentPercent ?? GENERAL_RULES_DEFAULT.minimumPartialPaymentPercent,
          refundPolicy: { ...GENERAL_RULES_DEFAULT.refundPolicy, ...config.refundPolicy }
        });
      }
    } catch (error) {
      logger.error(error);
      setFetchError(error.message || 'Failed to load fee rules');
    } finally { setLoading(false); }
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

  if (fetchError) return (
    <div className="flex flex-col items-center py-12 gap-4">
      <p className="text-sm font-medium text-fg">Failed to load fee rules</p>
      <p className="text-xs text-fg-muted">{fetchError}</p>
      <button onClick={fetchConfig} className="px-3 py-1.5 text-sm font-medium text-fg bg-surface rounded-lg hover:bg-surface-2">Retry</button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-fg uppercase tracking-wider">{t('pages.feeRules')}</h3>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-fg bg-surface rounded-lg hover:bg-surface-2 disabled:opacity-50">
          <Save size={14} /> Save
        </button>
      </div>

      <div className="border border-border-token rounded-lg divide-y divide-divider bg-surface">
        {/* New Admission */}
        <div className="p-4">
          <label className="text-xs text-fg-muted uppercase mb-2 block">{t('pages.newAdmissionFeeCalculation')}</label>
          <Select size="sm" selectedKeys={[formData.newAdmission.feeCalculation]} onChange={(e) => setFormData({ ...formData, newAdmission: { feeCalculation: e.target.value } })} classNames={{ trigger: "bg-surface border-border-token w-48" }}>
            <SelectItem key="total">{t('pages.fullYearFee')}</SelectItem>
            <SelectItem key="prorated">{t('pages.proratedFee')}</SelectItem>
          </Select>
        </div>

        {/* Partial Payment */}
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium text-fg">{t('pages.allowPartialPayments')}</p>
            <p className="text-xs text-fg-muted">{t('pages.studentsCanPayInInstallments')}</p>
          </div>
          <Switch size="sm" isSelected={formData.allowPartialPayment} onValueChange={(v) => setFormData({ ...formData, allowPartialPayment: v })} />
        </div>

        {formData.allowPartialPayment && (
          <div className="p-4">
            <label htmlFor="partial-payment-min-pct" className="text-xs text-fg-muted uppercase mb-2 block">Minimum Payment %</label>
            <input id="partial-payment-min-pct" type="number" min={0} max={100} value={formData.minimumPartialPaymentPercent} onChange={(e) => { const v = parseFloat(e.target.value); setFormData({ ...formData, minimumPartialPaymentPercent: isNaN(v) ? 0 : Math.min(100, Math.max(0, v)) }); }} className="w-24 px-3 py-2 text-sm border border-border-token rounded-lg" />
          </div>
        )}

        {/* Refund Policy */}
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium text-fg">{t('pages.enableRefunds')}</p>
            <p className="text-xs text-fg-muted">{t('pages.allowFeeRefundRequests')}</p>
          </div>
          <Switch size="sm" isSelected={formData.refundPolicy.enabled} onValueChange={(v) => setFormData({ ...formData, refundPolicy: { ...formData.refundPolicy, enabled: v } })} />
        </div>

        {formData.refundPolicy.enabled && (
          <div className="p-4">
            <label htmlFor="refund-processing-days" className="text-xs text-fg-muted uppercase mb-2 block">{t('pages.processingDays')}</label>
            <input id="refund-processing-days" type="number" value={formData.refundPolicy.processingDays} onChange={(e) => setFormData({ ...formData, refundPolicy: { ...formData.refundPolicy, processingDays: parseInt(e.target.value) || 0 } })} className="w-24 px-3 py-2 text-sm border border-border-token rounded-lg" />
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
        <div className="border-b border-border-token pb-4">
          <h2 className="text-xl font-bold text-fg">{t('pages.feeRules')}</h2>
          <p className="text-sm text-fg-muted mt-1">{t('pages.configurePoliciesAndSettings')}</p>
        </div>
      )}
      <p className="text-sm text-fg-muted">{t('pages.accessTheseSettingsFromFeeManagementPage')}</p>
    </div>
  );
}
