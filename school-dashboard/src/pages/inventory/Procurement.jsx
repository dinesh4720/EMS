import { useState, useEffect } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, Select, SelectItem, Textarea,
} from "@heroui/react";
import { Plus, Edit3, Trash2, CheckCircle, XCircle } from "lucide-react";
import { MinimalButton } from "../../components/ui";
import { inventoryApi } from "../../services/api";
import toast from "react-hot-toast";

const CATEGORIES = ["FURNITURE", "ELECTRONICS", "LAB_EQUIPMENT", "SPORTS", "STATIONERY", "VEHICLE", "OTHER"];
const STATUSES = ["PENDING", "APPROVED", "REJECTED", "PURCHASED"];

const statusColors = {
  PENDING: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  APPROVED: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400",
  REJECTED: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
  PURCHASED: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
};

const emptyForm = {
  itemName: "", category: "FURNITURE", quantity: 1, estimatedCost: "",
  justification: "", vendorId: "", notes: "",
};

export default function Procurement() {
  const [requests, setRequests] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqData, vendorData] = await Promise.all([
        inventoryApi.getProcurement(filterStatus !== "all" ? filterStatus : undefined),
        inventoryApi.getVendors(),
      ]);
      setRequests(Array.isArray(reqData) ? reqData : []);
      setVendors(Array.isArray(vendorData) ? vendorData : []);
    } catch { toast.error("Failed to load procurement data"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filterStatus]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setIsOpen(true); };
  const openEdit = (r) => {
    setEditing(r);
    setForm({
      itemName: r.itemName || "", category: r.category || "FURNITURE",
      quantity: r.quantity ?? 1, estimatedCost: r.estimatedCost ?? "",
      justification: r.justification || "", vendorId: r.vendorId?._id || r.vendorId || "",
      notes: r.notes || "",
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!form.itemName.trim()) return toast.error("Item name is required");
    try {
      setSaving(true);
      const payload = {
        ...form,
        quantity: Number(form.quantity),
        estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : undefined,
        vendorId: form.vendorId || undefined,
      };
      if (editing) {
        await inventoryApi.updateProcurement(editing._id, payload);
        toast.success("Request updated");
      } else {
        await inventoryApi.createProcurement(payload);
        toast.success("Request created");
      }
      setIsOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err?.message || "Save failed");
    } finally { setSaving(false); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await inventoryApi.updateProcurement(id, { status });
      toast.success(`Request ${status.toLowerCase()}`);
      fetchData();
    } catch { toast.error("Update failed"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this request?")) return;
    try {
      await inventoryApi.deleteProcurement(id);
      toast.success("Request deleted");
      fetchData();
    } catch { toast.error("Delete failed"); }
  };

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 dark:bg-zinc-800 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 px-3 py-2"
        >
          <option value="all">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <MinimalButton variant="primary" size="sm" icon={<Plus size={16} />} onClick={openCreate}>
          New Request
        </MinimalButton>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl shadow-sm dark:shadow-zinc-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
                {["Item", "Category", "Qty", "Est. Cost", "Requested By", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-500 dark:text-zinc-400">No procurement requests</td></tr>
              ) : (
                requests.map((r) => (
                  <tr key={r._id} className="border-b border-gray-50 dark:border-zinc-800 hover:bg-gray-50/50 dark:hover:bg-zinc-900/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-zinc-100">{r.itemName}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400">{r.category?.replace(/_/g, " ")}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-zinc-300">{r.quantity}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-zinc-300">{r.estimatedCost != null ? `₹${r.estimatedCost.toLocaleString()}` : "—"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-zinc-400">{r.requestedBy?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[r.status] || ""}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {r.status === "PENDING" && (
                          <>
                            <button onClick={() => handleStatusChange(r._id, "APPROVED")} className="p-1.5 rounded-md hover:bg-green-50 dark:hover:bg-green-950 text-gray-500 dark:text-zinc-400 hover:text-green-600" title="Approve">
                              <CheckCircle size={14} />
                            </button>
                            <button onClick={() => handleStatusChange(r._id, "REJECTED")} className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950 text-gray-500 dark:text-zinc-400 hover:text-red-600" title="Reject">
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                        <button onClick={() => openEdit(r)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400"><Edit3 size={14} /></button>
                        <button onClick={() => handleDelete(r._id)} className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950 text-gray-500 dark:text-zinc-400 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onOpenChange={setIsOpen} size="lg">
        <ModalContent>
          <ModalHeader>{editing ? "Edit Request" : "New Procurement Request"}</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Item Name" isRequired value={form.itemName} onValueChange={(v) => set("itemName", v)} />
              <Select label="Category" selectedKeys={[form.category]} onSelectionChange={(keys) => set("category", [...keys][0])}>
                {CATEGORIES.map((c) => <SelectItem key={c}>{c.replace(/_/g, " ")}</SelectItem>)}
              </Select>
              <Input label="Quantity" isRequired type="number" value={String(form.quantity)} onValueChange={(v) => set("quantity", v)} />
              <Input label="Estimated Cost" type="number" value={String(form.estimatedCost)} onValueChange={(v) => set("estimatedCost", v)} startContent="₹" />
              <Select label="Vendor" selectedKeys={form.vendorId ? [form.vendorId] : []} onSelectionChange={(keys) => set("vendorId", [...keys][0] || "")} className="sm:col-span-2">
                {vendors.map((v) => <SelectItem key={v._id}>{v.name}</SelectItem>)}
              </Select>
            </div>
            <Textarea label="Justification" value={form.justification} onValueChange={(v) => set("justification", v)} className="mt-2" />
            <Textarea label="Notes" value={form.notes} onValueChange={(v) => set("notes", v)} />
          </ModalBody>
          <ModalFooter>
            <MinimalButton variant="ghost" onClick={() => setIsOpen(false)}>Cancel</MinimalButton>
            <MinimalButton variant="primary" onClick={handleSave} loading={saving}>{editing ? "Update" : "Submit"}</MinimalButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
