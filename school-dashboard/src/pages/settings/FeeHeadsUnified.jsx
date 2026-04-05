import { request } from '../../services/api.js';
import { useState, useEffect, useRef, useMemo } from "react";
import { z } from "zod";
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
  List,
  LayoutGrid,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useConfirmDialog from '../../hooks/useConfirmDialog';


const categories = ["Academic", "Transport", "Extra-curricular", "Hostel", "Other"];

const feeHeadSchema = z.object({
  name: z.string().min(1, "Fee head name is required").max(100, "Name too long"),
  category: z.enum(["Academic", "Transport", "Extra-curricular", "Hostel", "Other"]),
  amount: z.number().min(0, "Amount must be non-negative"),
  applicableClasses: z.array(z.string()).min(1, "Select at least one class"),
  frequency: z.enum(["monthly", "quarterly", "yearly"]),
  mandatory: z.boolean(),
  autoApply: z.boolean(),
  description: z.string(),
});

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
  const { t } = useTranslation();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();
  const [viewMode, setViewMode] = useState("fee-heads"); // "fee-heads" | "by-class"
  const [expandedClasses, setExpandedClasses] = useState(new Set());
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
    isRequired: true,
    autoApply: true
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
      const data = await request('/fee-heads');
      setFeeHeads(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching fee heads:', error);
      toast.error(t('toast.error.failedToLoadFeeHeads'));
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
        isRequired: feeHead.mandatory !== undefined ? feeHead.mandatory : true,
        autoApply: feeHead.autoApply !== undefined ? feeHead.autoApply : true
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
        isRequired: true,
        autoApply: true
      });
      setClassRangeInput("");
    }
    onOpen();
  };

  const handleSave = async () => {
    const payload = {
      name: formData.name.trim(),
      category: formData.category,
      amount: formData.amount,
      applicableClasses: formData.applicableClasses,
      frequency: formData.frequency,
      mandatory: formData.isRequired,
      autoApply: formData.autoApply,
      description: ""
    };

    const result = feeHeadSchema.safeParse(payload);
    if (!result.success) {
      const firstError = result.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    setSaving(true);
    try {

      const endpoint = editingFeeHead
        ? `/fee-heads/${editingFeeHead._id}`
        : `/fee-heads`;

      await request(endpoint, {
        method: editingFeeHead ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });

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

  // AUDIT-124: Added dependency check before delete
  const handleDelete = (id) => {
    showConfirm({
      title: 'Delete Fee Head',
      message: t('confirm.deleteFeeHead'),
      variant: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        setDeletingId(id);
        try {
          // Check if fee head is in use before deleting
          const depCheck = await request(`/fee-heads/${id}/dependencies`).catch(() => null);
          if (depCheck?.inUse) {
            toast.error(`Cannot delete: fee head is assigned to ${depCheck.studentCount || 'some'} student(s). Remove assignments first.`);
            setDeletingId(null);
            return;
          }
          await request(`/fee-heads/${id}`, { method: 'DELETE' });
          setFeeHeads(prev => prev.filter(fh => fh._id !== id));
          toast.success(t('toast.success.feeHeadDeleted'));
        } catch (error) {
          toast.error(t('toast.error.failedToDeleteFeeHead'));
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  // AUDIT-124: Added confirmation before bulk apply
  const handleApplyToStudents = (id) => {
    showConfirm({
      title: 'Apply Fee Head',
      message: 'Apply this fee head to all applicable students? This will create fee structures for students who do not have them yet.',
      variant: 'warning',
      confirmText: 'Apply',
      onConfirm: async () => {
        try {
          await request(`/fee-heads/${id}/apply`, { method: 'POST' });
          toast.success(t('toast.success.feeHeadAppliedToStudents'));
        } catch (error) {
          toast.error(t('toast.error.failedToApplyFeeHead'));
        }
      },
    });
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

  // Group fee heads by class for "View by Class" mode
  const classFeeData = useMemo(() => {
    const classMap = {};
    for (let c = 1; c <= 12; c++) {
      const key = String(c);
      const heads = feeHeads.filter(fh => fh.applicableClasses?.includes(key));
      if (heads.length > 0) {
        const totalRequired = heads.filter(h => h.mandatory).reduce((s, h) => s + (h.amount || 0), 0);
        const totalOptional = heads.filter(h => !h.mandatory).reduce((s, h) => s + (h.amount || 0), 0);
        classMap[key] = { heads, totalRequired, totalOptional, total: totalRequired + totalOptional };
      }
    }
    return classMap;
  }, [feeHeads]);

  const classKeys = useMemo(() => Object.keys(classFeeData).sort((a, b) => Number(a) - Number(b)), [classFeeData]);

  const toggleClassExpand = (classKey) => {
    setExpandedClasses(prev => {
      const next = new Set(prev);
      if (next.has(classKey)) next.delete(classKey);
      else next.add(classKey);
      return next;
    });
  };

  const expandAllClasses = () => setExpandedClasses(new Set(classKeys));
  const collapseAllClasses = () => setExpandedClasses(new Set());

  if (loading) {
    return (
      <TablePageSkeleton />
    );
  }

  return (
    <div className={embedded ? "space-y-6" : "max-w-5xl mx-auto pb-10 space-y-6"}>
      {/* Header */}
      {!embedded && (
        <div className="border-b border-gray-200 dark:border-zinc-800 pb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">{t('pages.feeHeads1')}</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{t('pages.configureFeeStructuresForClasses')}</p>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950">
          <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{t('pages.totalHeads')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mt-1">{feeHeads.length}</p>
        </div>
        <div className="p-4 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950">
          <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{t('pages.required1')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mt-1">{feeHeads.filter(fh => fh.mandatory).length}</p>
        </div>
        <div className="p-4 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950">
          <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{t('pages.totalAmount')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mt-1">₹{totalFees.toLocaleString()}</p>
        </div>
      </div>

      {/* View Toggle + Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-zinc-900 rounded-lg">
          <button
            onClick={() => setViewMode("fee-heads")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              viewMode === "fee-heads"
                ? "bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 shadow-sm"
                : "text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
            }`}
          >
            <List size={14} />
            View by Fee Heads
          </button>
          <button
            onClick={() => setViewMode("by-class")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              viewMode === "by-class"
                ? "bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 shadow-sm"
                : "text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
            }`}
          >
            <LayoutGrid size={14} />
            View by Class
          </button>
        </div>
        <button
          onClick={() => handleOpen()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-gray-900 rounded-lg hover:bg-gray-800 transition-all"
        >
          <Plus size={16} />
          Add Fee Head
        </button>
      </div>

      {/* View by Class */}
      {viewMode === "by-class" && (
        <div className="space-y-3">
          {/* Expand/Collapse controls */}
          <div className="flex gap-2 justify-end">
            <button onClick={expandAllClasses} className="text-xs text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300">
              Expand All
            </button>
            <span className="text-xs text-gray-300 dark:text-zinc-700">|</span>
            <button onClick={collapseAllClasses} className="text-xs text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300">
              Collapse All
            </button>
          </div>

          {classKeys.length === 0 ? (
            <div className="text-center py-8 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950">
              <p className="text-gray-400 dark:text-zinc-500 text-sm">{t('pages.noFeeHeadsConfigured')}</p>
            </div>
          ) : (
            classKeys.map((classKey) => {
              const data = classFeeData[classKey];
              const isExpanded = expandedClasses.has(classKey);
              return (
                <div key={classKey} className="border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 overflow-hidden">
                  {/* Class Header */}
                  <button
                    onClick={() => toggleClassExpand(classKey)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                      <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Class {classKey}</span>
                      <span className="text-xs text-gray-400 dark:text-zinc-500">
                        {data.heads.length} fee {data.heads.length === 1 ? "head" : "heads"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-500 dark:text-zinc-400">
                        Required: <span className="font-mono font-medium text-gray-900 dark:text-zinc-100">₹{data.totalRequired.toLocaleString()}</span>
                      </span>
                      {data.totalOptional > 0 && (
                        <span className="text-xs text-gray-500 dark:text-zinc-400">
                          Optional: <span className="font-mono font-medium text-gray-900 dark:text-zinc-100">₹{data.totalOptional.toLocaleString()}</span>
                        </span>
                      )}
                      <span className="text-xs font-medium text-gray-900 dark:text-zinc-100 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                        Total ₹{data.total.toLocaleString()}
                      </span>
                    </div>
                  </button>

                  {/* Expanded: fee head list */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-zinc-800">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-zinc-900">
                            <th className="text-left px-4 py-2 text-xs text-gray-500 dark:text-zinc-400 font-medium uppercase tracking-wider">Fee Head</th>
                            <th className="text-left px-4 py-2 text-xs text-gray-500 dark:text-zinc-400 font-medium uppercase tracking-wider">Category</th>
                            <th className="text-right px-4 py-2 text-xs text-gray-500 dark:text-zinc-400 font-medium uppercase tracking-wider">Amount</th>
                            <th className="text-left px-4 py-2 text-xs text-gray-500 dark:text-zinc-400 font-medium uppercase tracking-wider">Type</th>
                            <th className="text-right px-4 py-2 text-xs text-gray-500 dark:text-zinc-400 font-medium uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.heads.map((fh) => (
                            <tr key={fh._id} className="border-t border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900">
                              <td className="px-4 py-2.5">
                                <p className="font-medium text-gray-900 dark:text-zinc-100">{fh.name}</p>
                                <p className="text-xs text-gray-400 dark:text-zinc-500">{fh.frequency}</p>
                              </td>
                              <td className="px-4 py-2.5 text-gray-600 dark:text-zinc-400">{fh.category}</td>
                              <td className="px-4 py-2.5 text-right font-mono text-gray-900 dark:text-zinc-100">₹{fh.amount?.toLocaleString() || 0}</td>
                              <td className="px-4 py-2.5">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border border-gray-200 dark:border-zinc-800 rounded bg-gray-50 dark:bg-zinc-900">
                                  <span className={`w-1.5 h-1.5 rounded-full ${fh.mandatory ? "bg-gray-400" : "bg-gray-300"}`}></span>
                                  {fh.mandatory ? "Required" : "Optional"}
                                </span>
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="flex gap-1 justify-end">
                                  <button
                                    onClick={() => handleOpen(fh)}
                                    className="p-1.5 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-all"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(fh._id)}
                                    disabled={deletingId === fh._id}
                                    className={`p-1.5 rounded transition-all ${
                                      deletingId === fh._id
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : 'text-gray-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                                    }`}
                                  >
                                    {deletingId === fh._id ? (
                                      <span className="inline-block w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                                    ) : (
                                      <Trash2 size={14} />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Table (View by Fee Heads) */}
      {viewMode === "fee-heads" && <div className="border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-950">
        <Table
          aria-label={t('aria.misc.feeHeads')}
          removeWrapper
          classNames={{
            th: "bg-gray-50 dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 font-medium text-xs uppercase tracking-wider h-11 border-b border-gray-200 dark:border-zinc-800",
            td: "py-3 border-b border-gray-100 dark:border-zinc-800",
          }}
        >
          <TableHeader>
            <TableColumn scope="col">{t('pages.fEEHead')}</TableColumn>
            <TableColumn scope="col">{t('pages.aMOUNT')}</TableColumn>
            <TableColumn scope="col">{t('pages.cLASSES')}</TableColumn>
            <TableColumn scope="col">{t('pages.tYPE')}</TableColumn>
            <TableColumn align="end" scope="col">{t('pages.aCTIONS')}</TableColumn>
          </TableHeader>
          <TableBody
            emptyContent={
              <div className="text-center py-8">
                <p className="text-gray-400 dark:text-zinc-500 text-sm">{t('pages.noFeeHeadsConfigured')}</p>
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
                      title={t('pages.applyToStudents')}
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
            <span className="text-gray-400 dark:text-zinc-500 text-xs">{t('pages.allFeeHeadsLoaded')}</span>
          )}
        </div>
      </div>}

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
                    placeholder={t('fees.feeHeadNamePlaceholder')}
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
                        placeholder={t('fees.amountPlaceholder')}
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
                    placeholder={t('fees.classRangePlaceholder')}
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
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.requiredFee')}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.isThisFeeRequiredForAllStudents')}</p>
                  </div>
                  <Switch
                    size="sm"
                    isSelected={formData.isRequired}
                    onValueChange={(v) => setFormData({ ...formData, isRequired: v })}
                  />
                </div>

                {/* Auto Apply Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.autoApply')}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.autoAppliedToAllStudentsInSelectedClasses')}</p>
                  </div>
                  <Switch
                    size="sm"
                    isSelected={formData.autoApply}
                    onValueChange={(v) => setFormData({ ...formData, autoApply: v })}
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

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </div>
  );
}
