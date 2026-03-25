import { useState, useEffect, useMemo, useRef } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, Select, SelectItem, Textarea, Button, Chip,
} from "@heroui/react";
import { Plus, Search, Pencil, Trash2, Download, X, ReceiptText } from "lucide-react";
import { expensesApi } from "../../services/api";
import { TablePageSkeleton } from "../../components/skeletons/PageSkeletons";
import { useApp } from "../../context/AppContext";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const CATEGORIES = [
  { key: "salaries", label: "Salaries" },
  { key: "utilities", label: "Utilities" },
  { key: "maintenance", label: "Maintenance" },
  { key: "supplies", label: "Supplies" },
  { key: "equipment", label: "Equipment" },
  { key: "events", label: "Events" },
  { key: "transport", label: "Transport" },
  { key: "marketing", label: "Marketing" },
  { key: "other", label: "Other" },
];

const PAYMENT_MODES = [
  { key: "cash", label: "Cash" },
  { key: "cheque", label: "Cheque" },
  { key: "bank_transfer", label: "Bank Transfer" },
  { key: "upi", label: "UPI" },
  { key: "other", label: "Other" },
];

const STATUS_COLORS = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

const EMPTY_FORM = {
  title: "",
  amount: "",
  category: "other",
  paymentMode: "cash",
  expenseDate: new Date().toISOString().split("T")[0],
  description: "",
  vendor: "",
};

function CategoryBadge({ category }) {
  const labels = {
    salaries: ["bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300", "Salaries"],
    utilities: ["bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300", "Utilities"],
    maintenance: ["bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300", "Maintenance"],
    supplies: ["bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300", "Supplies"],
    equipment: ["bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300", "Equipment"],
    events: ["bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300", "Events"],
    transport: ["bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300", "Transport"],
    marketing: ["bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300", "Marketing"],
    other: ["bg-gray-50 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300", "Other"],
  };
  const [cls, label] = labels[category] || labels.other;
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
}

export default function Expenses() {
  const { t } = useTranslation();
  const { currentAcademicYear } = useApp();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Lazy loading
  const ITEMS_PER_LOAD = 20;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const loaderRef = useRef(null);

  useEffect(() => { fetchExpenses(); }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const data = await expensesApi.getAll({ academicYear: currentAcademicYear });
      setExpenses(Array.isArray(data?.expenses) ? data.expenses : Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return expenses.filter(e => {
      const matchSearch = !searchQuery ||
        e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.vendor?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === "all" || e.category === categoryFilter;
      const matchStatus = statusFilter === "all" || e.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [expenses, searchQuery, categoryFilter, statusFilter]);

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

  useEffect(() => { setVisibleCount(ITEMS_PER_LOAD); }, [searchQuery, categoryFilter, statusFilter]);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setVisibleCount(prev => prev + ITEMS_PER_LOAD);
      }
    }, { threshold: 0.1 });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore]);

  const totalAmount = filtered.reduce((sum, e) => sum + (e.amount || 0), 0);

  const openAdd = () => {
    setEditingExpense(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (expense) => {
    setEditingExpense(expense);
    setForm({
      title: expense.title || "",
      amount: String(expense.amount ?? ""),
      category: expense.category || "other",
      paymentMode: expense.paymentMode || "cash",
      expenseDate: expense.expenseDate ? new Date(expense.expenseDate).toISOString().split("T")[0] : "",
      description: expense.description || "",
      vendor: expense.vendor || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.amount || !form.expenseDate || !form.category) {
      toast.error("Please fill in all required fields");
      return;
    }
    const parsedAmount = parseFloat(form.amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      toast.error("Amount must be a non-negative number");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, amount: parsedAmount };
      if (editingExpense) {
        await expensesApi.update(editingExpense._id, payload);
        toast.success("Expense updated");
      } else {
        await expensesApi.create({ ...payload, academicYear: currentAcademicYear });
        toast.success("Expense recorded");
      }
      setModalOpen(false);
      fetchExpenses();
    } catch (err) {
      toast.error(err?.message || "Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId || deleting) return;
    setDeleting(true);
    try {
      await expensesApi.delete(deleteId);
      toast.success("Expense deleted");
      setDeleteId(null);
      fetchExpenses();
    } catch {
      toast.error("Failed to delete expense");
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = () => {
    if (!filtered.length) { toast.error("No data to export"); return; }
    const headers = ["Date", "Title", "Category", "Vendor", "Amount (₹)", "Payment Mode", "Status"];
    const rows = filtered.map(e => [
      e.expenseDate ? new Date(e.expenseDate).toLocaleDateString() : "",
      e.title,
      e.category,
      e.vendor || "",
      e.amount,
      e.paymentMode,
      e.status,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Expenses exported");
  };

  if (loading) return <TablePageSkeleton kpiCards={3} columns={6} rows={10} />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
            <ReceiptText size={20} className="text-gray-500 dark:text-zinc-400" />
            Expense Tracker
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">Record and categorise school expenditures</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all"
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all"
          >
            <Plus size={14} />
            Add Expense
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">₹{totalAmount.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Total Records</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{filtered.length}</p>
        </div>
        <div className="p-4 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Pending Approval</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {filtered.filter(e => e.status === "pending").length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center border-b border-gray-200 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 w-56">
          <Search size={14} className="text-gray-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search title or vendor…"
            className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}>
              <X size={13} className="text-gray-400" />
            </button>
          )}
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg text-gray-700 dark:text-zinc-300"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg text-gray-700 dark:text-zinc-300"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-xl">
          <ReceiptText size={40} className="text-gray-300 dark:text-zinc-600 mb-3" />
          <p className="text-gray-500 dark:text-zinc-400 font-medium mb-1">No expenses found</p>
          <p className="text-sm text-gray-400 dark:text-zinc-500 mb-4">
            {searchQuery || categoryFilter !== "all" || statusFilter !== "all"
              ? "Try adjusting your filters"
              : "Add your first expense to get started"}
          </p>
          <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800">
            <Plus size={14} /> Add Expense
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Vendor</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {visible.map(exp => (
                <tr key={exp._id} className="hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
                  <td className="px-4 py-3 text-gray-500 dark:text-zinc-400 whitespace-nowrap">
                    {exp.expenseDate ? new Date(exp.expenseDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-zinc-100">{exp.title}</p>
                    {exp.description && <p className="text-xs text-gray-400 dark:text-zinc-500 truncate max-w-xs">{exp.description}</p>}
                  </td>
                  <td className="px-4 py-3"><CategoryBadge category={exp.category} /></td>
                  <td className="px-4 py-3 text-gray-500 dark:text-zinc-400">{exp.vendor || "—"}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900 dark:text-zinc-100">
                    ₹{(exp.amount || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <Chip size="sm" color={STATUS_COLORS[exp.status] || "default"} variant="flat">
                      {exp.status}
                    </Chip>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(exp)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteId(exp._id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div ref={loaderRef} className="flex justify-center py-3 border-t border-gray-100 dark:border-zinc-800">
            {hasMore && <span className="text-xs text-gray-400 dark:text-zinc-500">Loading more…</span>}
            {!hasMore && filtered.length > ITEMS_PER_LOAD && (
              <span className="text-xs text-gray-400 dark:text-zinc-500">All {filtered.length} records shown</span>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        <ModalContent>
          <ModalHeader className="border-b border-gray-200 dark:border-zinc-800">
            {editingExpense ? "Edit Expense" : "Add Expense"}
          </ModalHeader>
          <ModalBody className="py-4 space-y-4">
            <Input
              label="Title *"
              placeholder="e.g. Electricity bill — March"
              value={form.title}
              onValueChange={v => setForm(f => ({ ...f, title: v }))}
              variant="bordered"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="Amount (₹) *"
                placeholder="0"
                value={form.amount}
                onValueChange={v => setForm(f => ({ ...f, amount: v }))}
                variant="bordered"
                min={0}
              />
              <Input
                type="date"
                label="Expense Date *"
                value={form.expenseDate}
                onValueChange={v => setForm(f => ({ ...f, expenseDate: v }))}
                variant="bordered"
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Category *"
                selectedKeys={[form.category]}
                onSelectionChange={keys => setForm(f => ({ ...f, category: [...keys][0] || "other" }))}
                variant="bordered"
              >
                {CATEGORIES.map(c => <SelectItem key={c.key}>{c.label}</SelectItem>)}
              </Select>
              <Select
                label="Payment Mode"
                selectedKeys={[form.paymentMode]}
                onSelectionChange={keys => setForm(f => ({ ...f, paymentMode: [...keys][0] || "cash" }))}
                variant="bordered"
              >
                {PAYMENT_MODES.map(m => <SelectItem key={m.key}>{m.label}</SelectItem>)}
              </Select>
            </div>
            <Input
              label="Vendor / Supplier"
              placeholder="e.g. BESCOM, ABC Stationery"
              value={form.vendor}
              onValueChange={v => setForm(f => ({ ...f, vendor: v }))}
              variant="bordered"
            />
            <Textarea
              label="Description (optional)"
              placeholder="Additional notes about this expense"
              value={form.description}
              onValueChange={v => setForm(f => ({ ...f, description: v }))}
              variant="bordered"
              minRows={2}
            />
          </ModalBody>
          <ModalFooter className="border-t border-gray-200 dark:border-zinc-800">
            <Button variant="flat" onPress={() => setModalOpen(false)}>Cancel</Button>
            <Button className="bg-gray-900 text-white" isLoading={saving} onPress={handleSave}>
              {editingExpense ? "Update" : "Save Expense"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} size="sm">
        <ModalContent>
          <ModalHeader>Delete Expense</ModalHeader>
          <ModalBody>
            <p className="text-sm text-gray-600 dark:text-zinc-300">
              This expense record will be permanently removed. This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setDeleteId(null)} isDisabled={deleting}>Cancel</Button>
            <Button color="danger" isLoading={deleting} isDisabled={deleting} onPress={handleDelete}>Delete</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
