import { useState, useEffect, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { z } from "zod";
import { Plus, List, LayoutGrid, IndianRupee } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { request } from "../../services/api.js";
import { useEntityFetch } from "../../hooks/useEntityFetch";
import useConfirmDialog from "../../hooks/useConfirmDialog";
import logger from "../../utils/logger";
import { useCurrency } from "../../context/hooks/useCurrency";
import {
  Button,
  ConfirmDialog,
  ErrorState,
  MinimalTabs,
  PageHeader,
  SkeletonTable,
  StatCard,
} from "../../components/ui";

import FeeHeadModal from "./feeHeads/FeeHeadModal";
import FeeHeadsListView from "./feeHeads/FeeHeadsListView";
import FeeHeadsByClassView from "./feeHeads/FeeHeadsByClassView";

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

const ITEMS_PER_LOAD = 10;

const parseClassRange = (input) => {
  if (!input.trim()) return [];
  const classes = new Set();
  const parts = input.split(",").map((part) => part.trim());
  for (const part of parts) {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map((piece) => parseInt(piece.trim(), 10));
      if (!Number.isNaN(start) && !Number.isNaN(end)) {
        for (let i = start; i <= end; i++) {
          if (i >= 1 && i <= 12) classes.add(String(i));
        }
      }
    } else {
      const num = parseInt(part, 10);
      if (!Number.isNaN(num) && num >= 1 && num <= 12) {
        classes.add(String(num));
      }
    }
  }
  return Array.from(classes).sort((left, right) => parseInt(left, 10) - parseInt(right, 10));
};

const emptyForm = {
  name: "",
  category: "Academic",
  amount: 0,
  applicableClasses: [],
  frequency: "yearly",
  isRequired: true,
  autoApply: true,
};

export default function FeeHeadsUnified({ embedded = false }) {
  const { t } = useTranslation();
  const { fmt } = useCurrency();
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();

  const [viewMode, setViewMode] = useState("fee-heads");
  const [expandedClasses, setExpandedClasses] = useState(new Set());
  const [editingFeeHead, setEditingFeeHead] = useState(null);
  const [feeHeads, setFeeHeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [classRangeInput, setClassRangeInput] = useState("");

  const { visibleItems: visibleFeeHeads, hasMore, isLoadingMore, loaderRef } =
    useEntityFetch(feeHeads, [feeHeads.length]);

  const fetchFeeHeads = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await request("/fee-heads");
      setFeeHeads(Array.isArray(data) ? data : []);
    } catch (error) {
      logger.error("Error fetching fee heads:", error);
      setLoadError(error);
      toast.error(t("toast.error.failedToLoadFeeHeads"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchFeeHeads();
  }, [fetchFeeHeads]);

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
        autoApply: feeHead.autoApply !== undefined ? feeHead.autoApply : true,
      });
      setClassRangeInput(feeHead.applicableClasses?.join(",") || "");
    } else {
      setEditingFeeHead(null);
      setFormData(emptyForm);
      setClassRangeInput("");
    }
    setIsModalOpen(true);
  };

  const handleClassRangeChange = (value, options = {}) => {
    setClassRangeInput(value);
    if (!options.skipParse) {
      const parsed = parseClassRange(value);
      setFormData((prev) => ({ ...prev, applicableClasses: parsed }));
    }
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
      description: "",
    };

    const result = feeHeadSchema.safeParse(payload);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setSaving(true);
    try {
      const endpoint = editingFeeHead
        ? `/fee-heads/${editingFeeHead._id}`
        : `/fee-heads`;
      await request(endpoint, {
        method: editingFeeHead ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      toast.success(
        editingFeeHead
          ? t("toast.success.feeHeadUpdated", "Fee head updated")
          : t("toast.success.feeHeadCreated", "Fee head created"),
      );
      await fetchFeeHeads();
      setIsModalOpen(false);
    } catch (error) {
      logger.error("Failed to save fee head:", error);
      toast.error(error.message || t("toast.error.failedToSaveFeeHead", "Failed to save fee head"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    showConfirm({
      title: t("pages.deleteFeeHead", "Delete Fee Head"),
      message: t("confirm.deleteFeeHead"),
      variant: "danger",
      confirmText: t("common.delete", "Delete"),
      onConfirm: async () => {
        setDeletingId(id);
        try {
          const depCheck = await request(`/fee-heads/${id}/dependencies`).catch(() => null);
          if (depCheck?.inUse) {
            toast.error(
              t("fees.cannotDeleteAssigned", {
                count: depCheck.studentCount || 0,
                defaultValue: `Cannot delete: fee head is assigned to ${depCheck.studentCount || "some"} student(s). Remove assignments first.`,
              }),
            );
            setDeletingId(null);
            return;
          }
          await request(`/fee-heads/${id}`, { method: "DELETE" });
          setFeeHeads((prev) => prev.filter((fh) => fh._id !== id));
          toast.success(t("toast.success.feeHeadDeleted"));
        } catch (error) {
          logger.error("Failed to delete fee head:", error);
          toast.error(t("toast.error.failedToDeleteFeeHead"));
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const handleApplyToStudents = (id) => {
    showConfirm({
      title: t("pages.applyFeeHead", "Apply Fee Head"),
      message: t(
        "confirm.applyFeeHead",
        "Apply this fee head to all applicable students? This will create fee structures for students who do not have them yet.",
      ),
      variant: "warning",
      confirmText: t("pages.apply", "Apply"),
      onConfirm: async () => {
        try {
          await request(`/fee-heads/${id}/apply`, { method: "POST" });
          toast.success(t("toast.success.feeHeadAppliedToStudents"));
        } catch (error) {
          logger.error("Failed to apply fee head:", error);
          toast.error(t("toast.error.failedToApplyFeeHead"));
        }
      },
    });
  };

  const totalFees = useMemo(
    () => feeHeads.reduce((sum, fh) => sum + (fh.mandatory ? fh.amount : 0), 0),
    [feeHeads],
  );

  const classFeeData = useMemo(() => {
    const classMap = {};
    for (let cls = 1; cls <= 12; cls++) {
      const key = String(cls);
      const heads = feeHeads.filter((fh) => fh.applicableClasses?.includes(key));
      if (heads.length > 0) {
        const totalRequired = heads
          .filter((head) => head.mandatory)
          .reduce((sum, head) => sum + (head.amount || 0), 0);
        const totalOptional = heads
          .filter((head) => !head.mandatory)
          .reduce((sum, head) => sum + (head.amount || 0), 0);
        classMap[key] = {
          heads,
          totalRequired,
          totalOptional,
          total: totalRequired + totalOptional,
        };
      }
    }
    return classMap;
  }, [feeHeads]);

  const classKeys = useMemo(
    () => Object.keys(classFeeData).sort((left, right) => Number(left) - Number(right)),
    [classFeeData],
  );

  const toggleClassExpand = (classKey) => {
    setExpandedClasses((prev) => {
      const next = new Set(prev);
      if (next.has(classKey)) next.delete(classKey);
      else next.add(classKey);
      return next;
    });
  };

  const containerClass = embedded
    ? "space-y-6"
    : "max-w-5xl mx-auto pb-10 space-y-6";

  return (
    <div className={containerClass}>
      {!embedded && (
        <PageHeader
          title={t("pages.feeHeads1", "Fee Heads")}
          description={t("pages.configureFeeStructuresForClasses", "Configure fee structures for classes")}
          bordered={false}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label={t("pages.totalHeads", "Total Heads")}
          value={feeHeads.length}
          icon={List}
          color="gray"
          isLoading={loading}
        />
        <StatCard
          label={t("pages.required1", "Required")}
          value={feeHeads.filter((fh) => fh.mandatory).length}
          icon={LayoutGrid}
          color="dark"
          isLoading={loading}
        />
        <StatCard
          label={t("pages.totalAmount", "Total Amount")}
          value={fmt(totalFees)}
          icon={IndianRupee}
          color="success"
          isLoading={loading}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <MinimalTabs
          activeKey={viewMode}
          onChange={setViewMode}
          tabs={[
            { key: "fee-heads", title: t("fees.viewByFeeHeads", "View by Fee Heads"), icon: <List size={14} /> },
            { key: "by-class", title: t("fees.viewByClass", "View by Class"), icon: <LayoutGrid size={14} /> },
          ]}
        />
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => handleOpen()}
        >
          {t("pages.addFeeHead", "Add Fee Head")}
        </Button>
      </div>

      {loading ? (
        <SkeletonTable rows={6} columns={5} />
      ) : loadError ? (
        <ErrorState
          title={t("toast.error.failedToLoadFeeHeads", "Failed to load fee heads")}
          error={loadError}
          onRetry={fetchFeeHeads}
        />
      ) : viewMode === "by-class" ? (
        <FeeHeadsByClassView
          classKeys={classKeys}
          classFeeData={classFeeData}
          expandedClasses={expandedClasses}
          onToggleExpand={toggleClassExpand}
          onExpandAll={() => setExpandedClasses(new Set(classKeys))}
          onCollapseAll={() => setExpandedClasses(new Set())}
          deletingId={deletingId}
          onEdit={handleOpen}
          onDelete={handleDelete}
        />
      ) : (
        <FeeHeadsListView
          feeHeads={feeHeads}
          visibleFeeHeads={visibleFeeHeads}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          loaderRef={loaderRef}
          itemsPerLoad={ITEMS_PER_LOAD}
          deletingId={deletingId}
          onEdit={handleOpen}
          onDelete={handleDelete}
          onApply={handleApplyToStudents}
        />
      )}

      <FeeHeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editing={editingFeeHead}
        formData={formData}
        setFormData={setFormData}
        classRangeInput={classRangeInput}
        onClassRangeChange={handleClassRangeChange}
        saving={saving}
        onSave={handleSave}
      />

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </div>
  );
}

FeeHeadsUnified.propTypes = {
  embedded: PropTypes.bool,
};
