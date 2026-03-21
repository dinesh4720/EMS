import { useState, useEffect, useRef, useMemo } from "react";
import {
  Button,
  Input,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Select,
  SelectItem,
  Switch,
  Spinner,
} from "@heroui/react";
import {
  Plus,
  Edit,
  Trash2,
  IndianRupee,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const categories = ["Academic", "Transport", "Extra-curricular", "Hostel", "Other"];

const frequencies = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" }
];

// Quick select presets
const CLASS_PRESETS = {
  all: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
  primary: ["1", "2", "3", "4", "5"],
  secondary: ["6", "7", "8", "9", "10"],
  senior: ["11", "12"]
};

export default function FeeHeadsUnified({ embedded = false }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingFeeHead, setEditingFeeHead] = useState(null);
  const [feeHeads, setFeeHeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    category: "Academic",
    amount: 0,
    applicableClasses: [],
    frequency: "yearly",
    isRequired: true
  });

  // Class range input
  const [classRangeInput, setClassRangeInput] = useState("");

  // Lazy loading
  const ITEMS_PER_LOAD = 10;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef(null);

  useEffect(() => {
    fetchFeeHeads();
  }, []);

  const fetchFeeHeads = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/fee-heads`);
      if (!response.ok) throw new Error('Failed to fetch fee heads');
      const data = await response.json();
      setFeeHeads(data);
    } catch (error) {
      console.error('Error fetching fee heads:', error);
      toast.error('Failed to load fee heads');
    } finally {
      setLoading(false);
    }
  };

  const visibleFeeHeads = useMemo(
    () => feeHeads.slice(0, visibleCount),
    [feeHeads, visibleCount]
  );

  const hasMore = visibleCount < feeHeads.length;

  useEffect(() => {
    setVisibleCount(ITEMS_PER_LOAD);
  }, [feeHeads.length]);

  // Lazy loading observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount(prev => prev + ITEMS_PER_LOAD);
            setIsLoadingMore(false);
          }, 300);
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore]);

  // Parse class range input (e.g., "1-5" or "6,7,8")
  const parseClassRange = (input) => {
    if (!input.trim()) return [];

    const classes = new Set();

    // Split by comma
    const parts = input.split(',').map(s => s.trim());

    for (const part of parts) {
      // Check if it's a range (e.g., "1-5")
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(s => parseInt(s.trim()));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) {
            if (i >= 1 && i <= 12) classes.add(String(i));
          }
        }
      } else {
        const num = parseInt(part);
        if (!isNaN(num) && num >= 1 && num <= 12) {
          classes.add(String(num));
        }
      }
    }

    return Array.from(classes).sort((a, b) => parseInt(a) - parseInt(b));
  };

  const handleOpen = (feeHead = null) => {
    if (feeHead) {
      setEditingFeeHead(feeHead);
      setFormData({
        name: feeHead.name,
        category: feeHead.category,
        amount: feeHead.amount,
        applicableClasses: feeHead.applicableClasses || [],
        frequency: feeHead.frequency || "yearly",
        isRequired: feeHead.mandatory !== undefined ? feeHead.mandatory : true
      });
      setClassRangeInput(feeHead.applicableClasses?.join(',') || "");
    } else {
      setEditingFeeHead(null);
      setFormData({
        name: "",
        category: "Academic",
        amount: 0,
        applicableClasses: [],
        frequency: "yearly",
        isRequired: true
      });
      setClassRangeInput("");
    }
    onOpen();
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Fee head name is required');
      return;
    }
    if (formData.applicableClasses.length === 0) {
      toast.error('Please select at least one class');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        category: formData.category,
        amount: formData.amount,
        applicableClasses: formData.applicableClasses,
        frequency: formData.frequency,
        mandatory: formData.isRequired,
        autoApply: formData.isRequired,
        description: ""
      };

      const url = editingFeeHead
        ? `${API_URL}/fee-heads/${editingFeeHead._id}`
        : `${API_URL}/fee-heads`;

      const response = await fetch(url, {
        method: editingFeeHead ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save fee head');
      }

      toast.success(editingFeeHead ? 'Fee head updated' : 'Fee head created');
      await fetchFeeHeads();
      onClose();
    } catch (error) {
      console.error('Failed to save fee head:', error);
      toast.error(error.message || 'Failed to save fee head');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this fee head? It will be removed from all students.")) return;

    // Optimistically remove from UI immediately
    const feeHeadToDelete = feeHeads.find(fh => fh._id === id);
    setFeeHeads(prev => prev.filter(fh => fh._id !== id));
    setDeletingId(id);

    try {
      const response = await fetch(`${API_URL}/fee-heads/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete fee head');
      toast.success('Fee head deleted');
    } catch (error) {
      toast.error('Failed to delete fee head');
      // Restore the deleted item on error
      if (feeHeadToDelete) {
        setFeeHeads(prev => [...prev, feeHeadToDelete].sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        ));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleApplyToStudents = async (id) => {
    try {
      const response = await fetch(`${API_URL}/fee-heads/${id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to apply fee head');
      toast.success('Fee head applied to students');
    } catch (error) {
      toast.error('Failed to apply fee head');
    }
  };

  const handlePresetClick = (preset) => {
    const classes = CLASS_PRESETS[preset];
    setFormData({ ...formData, applicableClasses: classes });
    setClassRangeInput(classes.join(','));
  };

  const handleClassRangeChange = (value) => {
    setClassRangeInput(value);
    const parsed = parseClassRange(value);
    setFormData({ ...formData, applicableClasses: parsed });
  };

  const totalFees = feeHeads.reduce((sum, fh) => sum + (fh.mandatory ? fh.amount : 0), 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={embedded ? "space-y-6" : "max-w-5xl mx-auto pb-10 space-y-6"}>
      {/* Header */}
      {!embedded && (
        <div className="border-b border-gray-200 dark:border-zinc-800 pb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">Fee Heads</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Configure fee structures for classes</p>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950">
          <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Total Heads</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mt-1">{feeHeads.length}</p>
        </div>
        <div className="p-4 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950">
          <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Required</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mt-1">{feeHeads.filter(fh => fh.mandatory).length}</p>
        </div>
        <div className="p-4 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950">
          <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Total Amount</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mt-1">₹{totalFees.toLocaleString()}</p>
        </div>
      </div>

      {/* Add Button */}
      <div className="flex justify-end">
        <button
          onClick={() => handleOpen()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-gray-900 rounded-lg hover:bg-gray-800 transition-all"
        >
          <Plus size={16} />
          Add Fee Head
        </button>
      </div>

      {/* Table */}
      <div className="border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-950">
        <Table
          aria-label="Fee Heads"
          removeWrapper
          classNames={{
            th: "bg-gray-50 dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 font-medium text-xs uppercase tracking-wider h-11 border-b border-gray-200 dark:border-zinc-800",
            td: "py-3 border-b border-gray-100 dark:border-zinc-800",
          }}
        >
          <TableHeader>
            <TableColumn>FEE HEAD</TableColumn>
            <TableColumn>AMOUNT</TableColumn>
            <TableColumn>CLASSES</TableColumn>
            <TableColumn>TYPE</TableColumn>
            <TableColumn align="end">ACTIONS</TableColumn>
          </TableHeader>
          <TableBody
            emptyContent={
              <div className="text-center py-8">
                <p className="text-gray-400 dark:text-zinc-500 text-sm">No fee heads configured</p>
              </div>
            }
          >
            {visibleFeeHeads.map((feeHead) => (
              <TableRow key={feeHead._id} className="hover:bg-gray-50 dark:hover:bg-zinc-900">
                <TableCell>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-zinc-100">{feeHead.name}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{feeHead.category} • {feeHead.frequency}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-gray-900 dark:text-zinc-100">₹{feeHead.amount?.toLocaleString() || 0}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600 dark:text-zinc-400">
                    {feeHead.applicableClasses?.length > 0
                      ? feeHead.applicableClasses.length === 12
                        ? "All Classes"
                        : `${feeHead.applicableClasses.length} classes`
                      : "—"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border border-gray-200 dark:border-zinc-800 rounded bg-gray-50 dark:bg-zinc-900">
                    <span className={`w-1.5 h-1.5 rounded-full ${feeHead.mandatory ? "bg-gray-400" : "bg-gray-300"}`}></span>
                    {feeHead.mandatory ? "Required" : "Optional"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 justify-end">
                    <button
                      onClick={() => handleApplyToStudents(feeHead._id)}
                      className="p-1.5 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-all"
                      title="Apply to students"
                    >
                      <Users size={14} />
                    </button>
                    <button
                      onClick={() => handleOpen(feeHead)}
                      className="p-1.5 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-all"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(feeHead._id)}
                      disabled={deletingId === feeHead._id}
                      className={`p-1.5 rounded transition-all ${
                        deletingId === feeHead._id
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {deletingId === feeHead._id ? (
                        <span className="inline-block w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Load more */}
        <div ref={loaderRef} className="flex justify-center py-3 bg-gray-50 dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800">
          {isLoadingMore && <Spinner size="sm" />}
          {!hasMore && feeHeads.length > ITEMS_PER_LOAD && (
            <span className="text-gray-400 dark:text-zinc-500 text-xs">All fee heads loaded</span>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="border-b border-gray-200 dark:border-zinc-800 px-6 py-4">
                <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">
                  {editingFeeHead ? "Edit Fee Head" : "Add Fee Head"}
                </h3>
              </ModalHeader>
              <ModalBody className="p-6 space-y-5">
                {/* Name */}
                <div>
                  <label className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">
                    Fee Head Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Tuition Fee, Lab Fee, Transport..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-gray-400 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>

                {/* Amount and Frequency */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">
                      Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 text-sm">₹</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={formData.amount || ""}
                        onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
                        className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-gray-400 dark:bg-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">
                      Frequency
                    </label>
                    <Select
                      size="sm"
                      selectedKeys={[formData.frequency]}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                      classNames={{
                        trigger: "h-9 bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800",
                      }}
                    >
                      {frequencies.map(freq => (
                        <SelectItem key={freq.value}>{freq.label}</SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">
                    Category
                  </label>
                  <Select
                    size="sm"
                    selectedKeys={[formData.category]}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    classNames={{ trigger: "h-9 bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800" }}
                  >
                    {categories.map(cat => (
                      <SelectItem key={cat}>{cat}</SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Applicable Classes */}
                <div>
                  <label className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">
                    Applicable Classes
                  </label>

                  {/* Quick select buttons */}
                  <div className="flex gap-2 mb-3">
                    {[
                      { key: 'all', label: 'All' },
                      { key: 'primary', label: 'Primary (1-5)' },
                      { key: 'secondary', label: 'Secondary (6-10)' },
                      { key: 'senior', label: 'Senior (11-12)' }
                    ].map(preset => (
                      <button
                        key={preset.key}
                        onClick={() => handlePresetClick(preset.key)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${
                          JSON.stringify(formData.applicableClasses) === JSON.stringify(CLASS_PRESETS[preset.key])
                            ? "bg-gray-900 text-white border-gray-900"
                            : "bg-white dark:bg-zinc-950 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-600"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Class range input */}
                  <input
                    type="text"
                    placeholder="Or enter range: 1-5 or 6,7,8,9"
                    value={classRangeInput}
                    onChange={(e) => handleClassRangeChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-gray-400 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                    Selected: {formData.applicableClasses.length > 0 ? formData.applicableClasses.join(', ') : 'None'}
                  </p>
                </div>

                {/* Required Fee Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">Required Fee</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">Auto-applied to all students in selected classes</p>
                  </div>
                  <Switch
                    size="sm"
                    isSelected={formData.isRequired}
                    onValueChange={(v) => setFormData({ ...formData, isRequired: v })}
                  />
                </div>
              </ModalBody>
              <ModalFooter className="border-t border-gray-200 dark:border-zinc-800 px-6 py-4 gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formData.name.trim() || formData.applicableClasses.length === 0 || saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-gray-900 rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving && <Spinner size="sm" color="white" />}
                  {saving ? "Saving..." : (editingFeeHead ? "Update" : "Create")}
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
