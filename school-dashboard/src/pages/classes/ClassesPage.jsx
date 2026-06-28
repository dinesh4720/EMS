import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";

import Skeleton from "../../components/ui/Skeleton";
import { useApp } from "../../context/AppContext";
import { CreateDrawer } from "../../components/create/CreateDrawer";
import { Field } from "../../components/create/Field";
import useTodayPeriods from "./hooks/useTodayPeriods";
import TodayView from "./views/TodayView";
import ByClassView from "./views/ByClassView";
import { PageShell } from "../../components/ui";

// REVAMP-19 — Classes hub shell. Today view (period-led) + By-class tile grid
// behind a segmented toggle, URL state via ?view=. Period strip / fallthrough
// rules live in TodayView; this file owns the page chrome only.
function ClassesPageSkeleton() {
  return (
    <div className="page" style={{ paddingBottom: 24 }}>
      <div className="page__head">
        <div className="space-y-2">
          <Skeleton variant="text" className="h-7 w-32" />
          <Skeleton variant="text" className="h-4 w-48" />
        </div>
        <Skeleton variant="rect" className="h-9 w-36 rounded-md" />
      </div>
      <Skeleton variant="rect" className="h-12 w-full rounded-lg" />
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={`class-skeleton-${i}`} variant="rect" className="h-40 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function ClassesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view") === "class" ? "class" : "today";

  const { loading } = useApp();
  const { dayMeta } = useTodayPeriods();

  const [isAddOpen, setIsAddOpen] = useState(false);

  if (loading) return <ClassesPageSkeleton />;

  const setView = (next) => {
    setSearchParams(
      (prev) => {
        const out = new URLSearchParams(prev);
        if (next === "today") out.delete("view");
        else out.set("view", next);
        out.delete("period");
        return out;
      },
      { replace: false }
    );
  };

  const subLine = (() => {
    if (dayMeta.isWeekendOrHoliday) {
      return `${dayMeta.fullDayName || dayMeta.dayName} · School closed`;
    }
    if (dayMeta.isSchoolDayComplete) {
      return `${dayMeta.todayLabel} · School day complete`;
    }
    if (view === "class") {
      return `${dayMeta.totalScheduled} sessions today`;
    }
    return `${dayMeta.todayLabel} · Period ${
      dayMeta.activePeriodNumber || "—"
    } of ${dayMeta.totalPeriodsScheduled || 0} active`;
  })();

  return (
    <PageShell
      title="Classes"
      description={subLine}
      actions={
        <div className="row gap-2">
          <div className="seg" role="tablist" aria-label="Classes view">
            <button
              type="button"
              role="tab"
              aria-selected={view === "today"}
              className={`seg__btn${view === "today" ? " is-active" : ""}`}
              onClick={() => setView("today")}
            >
              Today
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "class"}
              className={`seg__btn${view === "class" ? " is-active" : ""}`}
              onClick={() => setView("class")}
            >
              By class
            </button>
          </div>
          <button
            type="button"
            className="btn btn--accent"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus size={13} aria-hidden /> Add class
          </button>
        </div>
      }
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Classes" },
      ]}
      bodyPadding="none"
    >
      <div className="flex flex-col" style={{ paddingBottom: 24 }}>
        {view === "today" ? (
          <TodayView retrospectiveOverride={false} />
        ) : (
          <ByClassView />
        )}
      </div>

      <AddClassDrawer
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />
    </PageShell>
  );
}

// Native+styled Add Class drawer. Replaces the HeroUI Drawer/Input/Select
// shells with the design-system CreateDrawer + .input / .select / .btn
// primitives. Validation + submit logic preserved from the prior version.
function AddClassDrawer({ isOpen, onClose }) {
  const { staff = [], addClass, refetch, schoolSettings } = useApp();
  const [formData, setFormData] = useState({
    name: "",
    section: "",
    strength: "",
    teacherId: "",
    room: "",
    block: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => {
    setFormData({
      name: "",
      section: "",
      strength: "",
      teacherId: "",
      room: "",
      block: "",
    });
    setErrors({});
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const validate = () => {
    const next = {};
    if (!formData.name.trim()) next.name = "Class name is required";
    if (!formData.section.trim()) next.section = "Section is required";
    if (!formData.strength) next.strength = "Capacity is required";
    else if (
      Number.isNaN(Number(formData.strength)) ||
      parseInt(formData.strength, 10) <= 0
    ) {
      next.strength = "Capacity must be a positive number";
    } else if (parseInt(formData.strength, 10) > 200) {
      next.strength = "Capacity cannot exceed 200";
    }
    if (!formData.teacherId) next.teacherId = "Class teacher is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const teacher = staff.find(
        (s) =>
          String(s.id) === String(formData.teacherId) ||
          String(s._id) === String(formData.teacherId)
      );
      if (!teacher) {
        toast.error("Selected teacher not found");
        setIsSubmitting(false);
        return;
      }
      const cap = parseInt(formData.strength, 10);
      const defaultSubjects = (schoolSettings?.subjects || [])
        .map((s) => (typeof s === "string" ? s : s.name))
        .filter(Boolean);

      await addClass({
        name: formData.name,
        section: formData.section,
        strengthLimit: { current: cap, default: cap },
        classTeacherId: String(formData.teacherId),
        teacher: teacher.name,
        teacherPhoto: teacher.picture || teacher.photo,
        subjects: defaultSubjects,
        ...(formData.room && { room: formData.room }),
        ...(formData.block && { block: formData.block }),
      });
      if (refetch) refetch(true).catch(() => {});
      toast.success("Class created");
      reset();
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to create class");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CreateDrawer
      open={isOpen}
      onClose={handleClose}
      title="Add class"
      subtitle="Create a new class section"
      footer={
        <>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <div style={{ marginLeft: "auto" }}>
            <button
              type="button"
              className="btn btn--accent"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating…" : "Create class"}
            </button>
          </div>
        </>
      }
    >
      <form
        className="grid"
        style={{ gap: 14 }}
        onSubmit={handleSave}
      >
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field
            label="Class name"
            required
            error={errors.name}
          >
            <input
              className="input"
              placeholder="e.g. 10"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              aria-invalid={!!errors.name}
            />
          </Field>
          <Field
            label="Section"
            required
            error={errors.section}
          >
            <input
              className="input"
              placeholder="e.g. A"
              value={formData.section}
              onChange={(e) =>
                setFormData({ ...formData, section: e.target.value })
              }
              aria-invalid={!!errors.section}
            />
          </Field>
        </div>

        <Field
          label="Capacity"
          required
          error={errors.strength}
        >
          <input
            className="input"
            type="number"
            min="1"
            max="200"
            placeholder="e.g. 30"
            value={formData.strength}
            onChange={(e) =>
              setFormData({ ...formData, strength: e.target.value })
            }
            aria-invalid={!!errors.strength}
          />
        </Field>

        <Field
          label="Class teacher"
          required
          error={errors.teacherId}
        >
          <select
            className="select"
            value={formData.teacherId}
            onChange={(e) =>
              setFormData({ ...formData, teacherId: e.target.value })
            }
            aria-invalid={!!errors.teacherId}
          >
            <option value="">Select a teacher</option>
            {staff.map((s) => (
              <option key={String(s._id || s.id)} value={String(s._id || s.id)}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Room (optional)">
            <input
              className="input"
              placeholder="e.g. 204"
              value={formData.room}
              onChange={(e) =>
                setFormData({ ...formData, room: e.target.value })
              }
            />
          </Field>
          <Field label="Block (optional)">
            <input
              className="input"
              placeholder="e.g. North"
              value={formData.block}
              onChange={(e) =>
                setFormData({ ...formData, block: e.target.value })
              }
            />
          </Field>
        </div>
      </form>
    </CreateDrawer>
  );
}
