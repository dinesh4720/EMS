import { useState, useEffect } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, Textarea,
} from "@heroui/react";
import { Search, Plus, Edit3, Trash2, Phone, Mail } from "lucide-react";
import { MinimalButton } from "../../components/ui";
import { inventoryApi } from "../../services/api";
import toast from "react-hot-toast";

const emptyForm = {
  name: "", contactPerson: "", phone: "", email: "", address: "", category: "", notes: "",
};

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const data = await inventoryApi.getVendors(search || undefined);
      setVendors(Array.isArray(data) ? data : []);
    } catch { toast.error("Failed to load vendors"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchVendors(); }, [search]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setIsOpen(true); };
  const openEdit = (v) => {
    setEditing(v);
    setForm({
      name: v.name || "", contactPerson: v.contactPerson || "", phone: v.phone || "",
      email: v.email || "", address: v.address || "", category: v.category || "", notes: v.notes || "",
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    try {
      setSaving(true);
      if (editing) {
        await inventoryApi.updateVendor(editing._id, form);
        toast.success("Vendor updated");
      } else {
        await inventoryApi.createVendor(form);
        toast.success("Vendor created");
      }
      setIsOpen(false);
      fetchVendors();
    } catch (err) {
      toast.error(err?.message || "Save failed");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this vendor?")) return;
    try {
      await inventoryApi.deleteVendor(id);
      toast.success("Vendor deleted");
      fetchVendors();
    } catch { toast.error("Delete failed"); }
  };

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 bg-gray-100 dark:bg-zinc-800 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendors..."
            className="pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 w-56"
          />
        </div>
        <MinimalButton variant="primary" size="sm" icon={<Plus size={16} />} onClick={openCreate}>
          Add Vendor
        </MinimalButton>
      </div>

      {/* Vendor Cards */}
      {vendors.length === 0 ? (
        <p className="text-center py-12 text-gray-500 dark:text-zinc-400">No vendors found</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((v) => (
            <div key={v._id} className="bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl p-5 shadow-sm dark:shadow-zinc-900/50">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-zinc-100">{v.name}</h4>
                  {v.contactPerson && <p className="text-xs text-gray-500 dark:text-zinc-400">{v.contactPerson}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(v)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400"><Edit3 size={14} /></button>
                  <button onClick={() => handleDelete(v._id)} className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950 text-gray-500 dark:text-zinc-400 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="space-y-1.5">
                {v.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-zinc-400">
                    <Phone size={12} /> {v.phone}
                  </div>
                )}
                {v.email && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-zinc-400">
                    <Mail size={12} /> {v.email}
                  </div>
                )}
                {v.category && (
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 mt-1">
                    {v.category}
                  </span>
                )}
              </div>
              {!v.isActive && (
                <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 mt-2">Inactive</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onOpenChange={setIsOpen} size="lg">
        <ModalContent>
          <ModalHeader>{editing ? "Edit Vendor" : "New Vendor"}</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Vendor Name" isRequired value={form.name} onValueChange={(v) => set("name", v)} />
              <Input label="Contact Person" value={form.contactPerson} onValueChange={(v) => set("contactPerson", v)} />
              <Input label="Phone" value={form.phone} onValueChange={(v) => set("phone", v)} />
              <Input label="Email" type="email" value={form.email} onValueChange={(v) => set("email", v)} />
              <Input label="Category" value={form.category} onValueChange={(v) => set("category", v)} />
            </div>
            <Textarea label="Address" value={form.address} onValueChange={(v) => set("address", v)} className="mt-2" />
            <Textarea label="Notes" value={form.notes} onValueChange={(v) => set("notes", v)} />
          </ModalBody>
          <ModalFooter>
            <MinimalButton variant="ghost" onClick={() => setIsOpen(false)}>Cancel</MinimalButton>
            <MinimalButton variant="primary" onClick={handleSave} loading={saving}>{editing ? "Update" : "Create"}</MinimalButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
