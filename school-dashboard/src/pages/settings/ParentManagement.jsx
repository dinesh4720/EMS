import { useState, useEffect, useCallback } from "react";
import { parentApi } from "../../services/api";
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
  const [actionLoading, setActionLoading] = useState(null);

  const fetchParents = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const response = await parentApi.getAll(params);
      if (response.success) {
        setParents(response.data.parents);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching parents:", error);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchParents();
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
      console.error("Error fetching parent details:", error);
    }
  };

  const handleResetPassword = async (parentId) => {
    setActionLoading(parentId);
    try {
      const response = await parentApi.resetPassword(parentId);
      if (response.success) {
        setGeneratedPassword(response.data.generatedPassword);
        setCopiedPassword(false);
      }
    } catch (error) {
      console.error("Error resetting password:", error);
    } finally {
      setActionLoading(null);
    }
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
      console.error("Error updating status:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkCreate = async () => {
    if (!confirm("This will create parent accounts for all students that don't have one. Continue?")) return;
    setBulkLoading(true);
    try {
      const response = await parentApi.bulkCreate();
      if (response.success) {
        alert(`Bulk creation complete: ${response.data.created} created, ${response.data.skipped} skipped, ${response.data.errors} errors`);
        fetchParents(1);
      }
    } catch (error) {
      console.error("Error bulk creating:", error);
    } finally {
      setBulkLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const StatusBadge = ({ status }) => {
    const colors = {
      active: "bg-green-50 text-green-700",
      inactive: "bg-gray-50 text-gray-600",
      suspended: "bg-red-50 text-red-700",
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.inactive}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Parent Accounts</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage parent login credentials and account status
          </p>
        </div>
        <button
          onClick={handleBulkCreate}
          disabled={bulkLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          <Users size={16} />
          {bulkLoading ? "Creating..." : "Bulk Create Accounts"}
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or email..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
        </form>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        <button
          onClick={() => fetchParents(pagination.page)}
          className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Children</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Last Login</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">Loading...</td>
              </tr>
            ) : parents.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">No parent accounts found</td>
              </tr>
            ) : (
              parents.map((parent) => (
                <tr key={parent._id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-gray-900">{parent.name}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{parent.phone}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{parent.email || "-"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm text-gray-600">{parent.children?.length || 0}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {parent.lastLogin
                      ? new Date(parent.lastLogin).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                      : "Never"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={parent.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleViewDetails(parent)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                        title="View details"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => handleResetPassword(parent._id)}
                        disabled={actionLoading === parent._id}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                        title="Reset password"
                      >
                        <KeyRound size={15} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(parent._id, parent.status)}
                        disabled={actionLoading === parent._id}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchParents(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => fetchParents(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Generated Password Modal */}
      {generatedPassword && !drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setGeneratedPassword(null)}>
          <div className="bg-white rounded-xl p-6 w-[400px] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Password Reset</h3>
              <button onClick={() => setGeneratedPassword(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">Share this password with the parent. It will not be shown again.</p>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3">
              <code className="flex-1 text-sm font-mono font-medium text-gray-900">{generatedPassword}</code>
              <button
                onClick={() => copyToClipboard(generatedPassword)}
                className="p-1.5 rounded hover:bg-gray-200"
              >
                {copiedPassword ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-gray-500" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {drawerOpen && selectedParent && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => { setDrawerOpen(false); setGeneratedPassword(null); }}>
          <div className="bg-black/20 absolute inset-0" />
          <div className="relative bg-white w-[480px] h-full shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="font-semibold text-gray-900">Parent Details</h3>
              <button onClick={() => { setDrawerOpen(false); setGeneratedPassword(null); }} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Parent Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-gray-900">{selectedParent.name}</h4>
                  <StatusBadge status={selectedParent.status} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Phone</span>
                    <p className="font-medium text-gray-900">{selectedParent.phone}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Email</span>
                    <p className="font-medium text-gray-900">{selectedParent.email || "-"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Login</span>
                    <p className="font-medium text-gray-900">
                      {selectedParent.lastLogin
                        ? new Date(selectedParent.lastLogin).toLocaleString("en-IN")
                        : "Never"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Created</span>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedParent.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleResetPassword(selectedParent._id)}
                  disabled={actionLoading === selectedParent._id}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
                >
                  <KeyRound size={14} />
                  Reset Password
                </button>
                <button
                  onClick={() => handleToggleStatus(selectedParent._id, selectedParent.status)}
                  disabled={actionLoading === selectedParent._id}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm ${
                    selectedParent.status === "active"
                      ? "border-red-200 text-red-700 hover:bg-red-50"
                      : "border-green-200 text-green-700 hover:bg-green-50"
                  }`}
                >
                  {selectedParent.status === "active" ? <PowerOff size={14} /> : <Power size={14} />}
                  {selectedParent.status === "active" ? "Deactivate" : "Activate"}
                </button>
              </div>

              {/* Generated Password */}
              {generatedPassword && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">New Password Generated</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2">
                    <code className="flex-1 text-sm font-mono font-medium">{generatedPassword}</code>
                    <button onClick={() => copyToClipboard(generatedPassword)} className="p-1 rounded hover:bg-gray-100">
                      {copiedPassword ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-gray-500" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Children */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Children ({selectedParent.children?.length || 0})
                </h4>
                <div className="space-y-3">
                  {selectedParent.children?.map((child, idx) => (
                    <div key={child.studentId || idx} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{child.name}</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-200 rounded-full text-gray-600">
                          {child.relationship}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                        <div>Admission: <span className="text-gray-700">{child.admissionId || "-"}</span></div>
                        <div>Roll No: <span className="text-gray-700">{child.rollNo || "-"}</span></div>
                        <div>
                          Class: <span className="text-gray-700">
                            {child.class ? `${child.class.name} ${child.class.section}` : "-"}
                          </span>
                        </div>
                        <div>Status: <span className="text-gray-700">{child.status || "-"}</span></div>
                      </div>
                    </div>
                  ))}
                  {(!selectedParent.children || selectedParent.children.length === 0) && (
                    <p className="text-sm text-gray-400 text-center py-4">No children linked</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
