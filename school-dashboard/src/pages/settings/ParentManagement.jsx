import { useState, useEffect, useCallback, useRef } from "react";
import logger from "../../utils/logger";
import { parentApi } from "../../services/api";
import { getDateLocale } from '../../i18n/index';
import { useTranslation } from 'react-i18next';
import toast from "react-hot-toast";
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useConfirmDialog from '../../hooks/useConfirmDialog';
import StatusBadge from '../../components/ui/StatusBadge';

import {
  Search,
  RefreshCw,
  Users,
  Eye,
  KeyRound,
  Power,
  PowerOff,
  X,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";

export default function ParentManagement() {
  const { t } = useTranslation();
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();
  const [parents, setParents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const copiedPasswordTimeoutRef = useRef(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    return () => {
      if (copiedPasswordTimeoutRef.current) clearTimeout(copiedPasswordTimeoutRef.current);
    };
  }, []);

  const fetchParents = useCallback(async (page = 1, signal) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const response = await parentApi.getAll(params, { signal });
      if (signal?.aborted) return;
      if (response.success) {
        setParents(response.data.parents);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      logger.error("Error fetching parents:", error);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const controller = new AbortController();
    fetchParents(1, controller.signal);
    return () => controller.abort();
  }, [fetchParents]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchParents(1);
  };

  const handleViewDetails = async (parent) => {
    try {
      const response = await parentApi.getById(parent._id);
      if (response.success) {
        setSelectedParent(response.data);
        setDrawerOpen(true);
        setGeneratedPassword(null);
      }
    } catch (error) {
      logger.error("Error fetching parent details:", error);
    }
  };

  // AUDIT-131: Added confirmation before password reset
  const handleResetPassword = (parentId) => {
    showConfirm({
      title: 'Reset Password',
      message: 'Are you sure you want to reset this parent\'s password? Their current password will stop working.',
      variant: 'warning',
      confirmText: 'Reset',
      onConfirm: async () => {
        setActionLoading(parentId);
        try {
          const response = await parentApi.resetPassword(parentId);
          if (response.success) {
            setGeneratedPassword(response.data.generatedPassword);
            setCopiedPassword(false);
          }
        } catch (error) {
          logger.error("Error resetting password:", error);
          toast.error("Failed to reset password");
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleToggleStatus = async (parentId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    setActionLoading(parentId);
    try {
      const response = await parentApi.updateStatus(parentId, newStatus);
      if (response.success) {
        fetchParents(pagination.page);
        if (selectedParent?._id === parentId) {
          setSelectedParent(prev => ({ ...prev, status: newStatus }));
        }
      }
    } catch (error) {
      logger.error("Error updating status:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkCreate = () => {
    showConfirm({
      title: 'Bulk Create Parent Accounts',
      message: t('confirm.createParentAccounts'),
      variant: 'info',
      confirmText: 'Create',
      onConfirm: async () => {
        setBulkLoading(true);
        try {
          const response = await parentApi.bulkCreate();
          if (response.success) {
            toast.success(`Bulk creation complete: ${response.data.created} created, ${response.data.skipped} skipped, ${response.data.errors} errors`);
            fetchParents(1);
          }
        } catch (error) {
          logger.error("Error bulk creating:", error);
        } finally {
          setBulkLoading(false);
        }
      },
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedPassword(true);
    if (copiedPasswordTimeoutRef.current) clearTimeout(copiedPasswordTimeoutRef.current);
    copiedPasswordTimeoutRef.current = setTimeout(() => setCopiedPassword(false), 2000);
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-fg">{t('pages.parentAccounts')}</h2>
          <p className="text-sm text-fg-muted mt-1">
            Manage parent login credentials and account status
          </p>
        </div>
        <button
          onClick={handleBulkCreate}
          disabled={bulkLoading}
          className="flex items-center gap-2 px-4 py-2 bg-surface dark:bg-surface-2 text-white rounded-lg text-sm font-medium hover:bg-surface-2 dark:hover:bg-surface-2 disabled:opacity-50"
        >
          <Users size={16} />
          {bulkLoading ? "Creating..." : "Bulk Create Accounts"}
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('pages.searchByNamePhoneOrEmail')}
            className="w-full pl-9 pr-4 py-2 border border-border-token rounded-lg text-sm bg-surface text-fg focus:outline-none focus:ring-1 focus:ring-border-strong"
          />
        </form>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-border-token rounded-lg text-sm bg-surface text-fg focus:outline-none focus:ring-1 focus:ring-border-strong"
        >
          <option value="">{t('pages.allStatus1')}</option>
          <option value="active">{t('pages.active')}</option>
          <option value="inactive">{t('pages.inactive')}</option>
          <option value="suspended">{t('pages.suspended')}</option>
        </select>
        <button
          onClick={() => fetchParents(pagination.page)}
          className="p-2 border border-border-token rounded-lg hover:bg-surface-2-2"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border-token rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-divider bg-surface-2">
              <th className="text-left px-4 py-3 text-xs font-medium text-fg-muted uppercase">{t('pages.name1')}</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-fg-muted uppercase">{t('pages.phone1')}</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-fg-muted uppercase">{t('pages.email1')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-fg-muted uppercase">{t('pages.children')}</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-fg-muted uppercase">{t('pages.lastLogin1')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-fg-muted uppercase">{t('pages.status2')}</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-fg-muted uppercase">{t('pages.actions1')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-fg-faint text-sm">{t('pages.loading')}</td>
              </tr>
            ) : parents.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-fg-faint text-sm">{t('pages.noParentAccountsFound')}</td>
              </tr>
            ) : (
              parents.map((parent) => (
                <tr key={parent._id} className="hover:bg-surface-2/50 /50">
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-fg">{parent.name}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-fg-muted">{parent.phone}</td>
                  <td className="px-4 py-3 text-sm text-fg-muted">{parent.email || "-"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm text-fg-muted">{parent.children?.length || 0}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-fg-muted">
                    {parent.lastLogin
                      ? new Date(parent.lastLogin).toLocaleDateString(getDateLocale(), { day: "numeric", month: "short", year: "numeric" })
                      : "Never"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={parent.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleViewDetails(parent)}
                        className="p-1.5 rounded hover:bg-surface-2 text-fg-muted"
                        aria-label={t('pages.viewDetails2')}
                        title={t('pages.viewDetails2')}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResetPassword(parent._id)}
                        disabled={actionLoading === parent._id}
                        className="p-1.5 rounded hover:bg-surface-2 text-fg-muted"
                        aria-label={t('pages.resetPassword1')}
                        title={t('pages.resetPassword1')}
                      >
                        <KeyRound size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(parent._id, parent.status)}
                        disabled={actionLoading === parent._id}
                        className="p-1.5 rounded hover:bg-surface-2 text-fg-muted"
                        aria-label={parent.status === "active" ? "Deactivate" : "Activate"}
                        title={parent.status === "active" ? "Deactivate" : "Activate"}
                      >
                        {parent.status === "active" ? <PowerOff size={15} /> : <Power size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-divider">
            <span className="text-sm text-fg-muted">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchParents(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 text-sm border border-border-token rounded hover:bg-surface-2-2 disabled:opacity-50 text-fg"
              >
                Previous
              </button>
              <button
                onClick={() => fetchParents(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-1.5 text-sm border border-border-token rounded hover:bg-surface-2-2 disabled:opacity-50 text-fg"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Generated Password Modal */}
      {generatedPassword && !drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setGeneratedPassword(null)}>
          <div className="bg-surface rounded-xl p-6 w-full max-w-[400px] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-fg">{t('pages.passwordReset')}</h3>
              <button onClick={() => setGeneratedPassword(null)} className="text-fg-faint hover:text-fg">
                <X size={18} />
              </button>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-200">{t('pages.shareThisPasswordWithTheParentItWillNotBeShownAgain')}</p>
            </div>
            <div className="flex items-center gap-2 bg-surface-2 rounded-lg px-4 py-3">
              <code className="flex-1 text-sm font-mono font-medium text-fg">{generatedPassword}</code>
              <button
                onClick={() => copyToClipboard(generatedPassword)}
                className="p-1.5 rounded hover:bg-surface-2"
              >
                {copiedPassword ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-fg-muted" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {drawerOpen && selectedParent && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => { setDrawerOpen(false); setGeneratedPassword(null); }}>
          <div className="bg-black/20 absolute inset-0" />
          <div className="relative bg-surface w-full sm:w-[480px] sm:max-w-[100vw] h-full shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-surface border-b border-divider px-6 py-4 flex items-center justify-between z-10">
              <h3 className="font-semibold text-fg">{t('pages.parentDetails')}</h3>
              <button onClick={() => { setDrawerOpen(false); setGeneratedPassword(null); }} className="text-fg-faint hover:text-fg">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Parent Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-fg">{selectedParent.name}</h4>
                  <StatusBadge status={selectedParent.status} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-fg-muted">{t('pages.phone1')}</span>
                    <p className="font-medium text-fg">{selectedParent.phone}</p>
                  </div>
                  <div>
                    <span className="text-fg-muted">{t('pages.email1')}</span>
                    <p className="font-medium text-fg">{selectedParent.email || "-"}</p>
                  </div>
                  <div>
                    <span className="text-fg-muted">{t('pages.lastLogin1')}</span>
                    <p className="font-medium text-fg">
                      {selectedParent.lastLogin
                        ? new Date(selectedParent.lastLogin).toLocaleString(getDateLocale())
                        : "Never"}
                    </p>
                  </div>
                  <div>
                    <span className="text-fg-muted">{t('pages.created')}</span>
                    <p className="font-medium text-fg">
                      {selectedParent.createdAt ? new Date(selectedParent.createdAt).toLocaleDateString(getDateLocale()) : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleResetPassword(selectedParent._id)}
                  disabled={actionLoading === selectedParent._id}
                  className="flex items-center gap-2 px-3 py-2 border border-border-token rounded-lg text-sm hover:bg-surface-2-2 text-fg"
                >
                  <KeyRound size={14} />
                  Reset Password
                </button>
                <button
                  onClick={() => handleToggleStatus(selectedParent._id, selectedParent.status)}
                  disabled={actionLoading === selectedParent._id}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm ${
                    selectedParent.status === "active"
                      ? "border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                      : "border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20"
                  }`}
                >
                  {selectedParent.status === "active" ? <PowerOff size={14} /> : <Power size={14} />}
                  {selectedParent.status === "active" ? "Deactivate" : "Activate"}
                </button>
              </div>

              {/* Generated Password */}
              {generatedPassword && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-medium text-amber-800 dark:text-amber-200">{t('pages.newPasswordGenerated')}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-surface rounded-lg px-3 py-2">
                    <code className="flex-1 text-sm font-mono font-medium">{generatedPassword}</code>
                    <button onClick={() => copyToClipboard(generatedPassword)} className="p-1 rounded hover:bg-surface-2">
                      {copiedPassword ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-fg-muted" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Children */}
              <div>
                <h4 className="text-sm font-medium text-fg-muted uppercase tracking-wider mb-3">
                  Children ({selectedParent.children?.length || 0})
                </h4>
                <div className="space-y-3">
                  {selectedParent.children?.map((child, idx) => (
                    <div key={child.studentId || idx} className="bg-surface-2 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-fg">{child.name}</span>
                        <span className="text-xs px-2 py-0.5 bg-surface-2 rounded-full text-fg-muted">
                          {child.relationship}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-fg-muted">
                        <div>Admission: <span className="text-fg">{child.admissionId || "-"}</span></div>
                        <div>Roll No: <span className="text-fg">{child.rollNo || "-"}</span></div>
                        <div>
                          Class: <span className="text-fg">
                            {child.class ? `${child.class.name} ${child.class.section}` : "-"}
                          </span>
                        </div>
                        <div>Status: <span className="text-fg">{child.status || "-"}</span></div>
                      </div>
                    </div>
                  ))}
                  {(!selectedParent.children || selectedParent.children.length === 0) && (
                    <p className="text-sm text-fg-faint text-center py-4">{t('pages.noChildrenLinked')}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </div>
  );
}
