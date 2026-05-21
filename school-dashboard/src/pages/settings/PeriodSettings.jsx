import { useState, useCallback, useMemo } from "react";
import { Input, Button, Select, SelectItem, Chip } from "@heroui/react";
import { Clock, Plus, Trash2, RefreshCw, Save, Coffee, UtensilsCrossed, Info } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { timetableApi } from "../../services/api";
import { DEFAULT_PERIODS } from "../../utils/constants";
import { TablePageSkeleton } from "../../components/skeletons/PageSkeletons";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import logger from '../../utils/logger';


// Helper: add minutes to a HH:MM time string
function addMinutes(time, mins) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

// Helper: get duration in minutes between two HH:MM strings
function durationBetween(start, end) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

export default function PeriodSettings() {
  const { t } = useTranslation();
  const { classesWithTeachers } = useApp();

  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

  // Configuration inputs
  const [config, setConfig] = useState({
    startTime: "08:00",
    numPeriods: 6,
    periodDuration: 45,
    shortBreakAfter: 2,
    shortBreakDuration: 15,
    lunchAfter: 4,
    lunchDuration: 45,
  });

  // Generated/editable periods
  const [periods, setPeriods] = useState([]);

  // Computed summary
  const summary = useMemo(() => {
    if (periods.length === 0) return null;
    const instructional = periods.filter((p) => !p.isBreak);
    const breaks = periods.filter((p) => p.isBreak);
    const totalMins = periods.reduce((sum, p) => sum + durationBetween(p.startTime, p.endTime), 0);
    const instrMins = instructional.reduce((sum, p) => sum + durationBetween(p.startTime, p.endTime), 0);
    const breakMins = breaks.reduce((sum, p) => sum + durationBetween(p.startTime, p.endTime), 0);
    const endTime = periods[periods.length - 1]?.endTime || "--:--";
    return {
      totalPeriods: instructional.length,
      totalBreaks: breaks.length,
      totalMins,
      instrMins,
      breakMins,
      startTime: periods[0]?.startTime || "--:--",
      endTime,
    };
  }, [periods]);

  // Load existing periods for selected class
  const loadClassPeriods = useCallback(async (classId) => {
    if (!classId) return;
    setLoading(true);
    try {
      const timetable = await timetableApi.getByClass(classId);
      if (timetable?.periods?.length > 0) {
        setPeriods(timetable.periods.map((p, i) => ({ ...p, _key: i })));
        setHasExisting(true);
      } else {
        setPeriods(DEFAULT_PERIODS.map((p, i) => ({ ...p, _key: i })));
        setHasExisting(false);
      }
    } catch (error) {
      if (error?.status === 404) {
        // No timetable exists yet — use defaults
        setPeriods(DEFAULT_PERIODS.map((p, i) => ({ ...p, _key: i })));
        setHasExisting(false);
      } else {
        logger.error("Failed to load periods:", error);
        toast.error(error?.message || "Failed to load period settings");
        setPeriods([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleClassChange = (e) => {
    const classId = e.target.value;
    setSelectedClass(classId);
    if (classId) loadClassPeriods(classId);
    else setPeriods([]);
  };

  // Generate periods from configuration
  const handleGenerate = () => {
    const { startTime, numPeriods, periodDuration, shortBreakAfter, shortBreakDuration, lunchAfter, lunchDuration } = config;
    const generated = [];
    let currentTime = startTime;
    let periodCount = 0;
    let keyCounter = 0;

    for (let i = 0; i < numPeriods; i++) {
      periodCount++;

      // Insert short break before this period if needed
      if (shortBreakAfter > 0 && periodCount === shortBreakAfter + 1 && lunchAfter !== shortBreakAfter) {
        const breakEnd = addMinutes(currentTime, shortBreakDuration);
        generated.push({
          name: "Break",
          startTime: currentTime,
          endTime: breakEnd,
          isBreak: true,
          _key: keyCounter++,
        });
        currentTime = breakEnd;
      }

      // Insert lunch break before this period if needed
      if (lunchAfter > 0 && periodCount === lunchAfter + 1) {
        const lunchEnd = addMinutes(currentTime, lunchDuration);
        generated.push({
          name: "Lunch",
          startTime: currentTime,
          endTime: lunchEnd,
          isBreak: true,
          _key: keyCounter++,
        });
        currentTime = lunchEnd;
      }

      const periodEnd = addMinutes(currentTime, periodDuration);
      generated.push({
        name: `Period ${periodCount}`,
        startTime: currentTime,
        endTime: periodEnd,
        isBreak: false,
        _key: keyCounter++,
      });
      currentTime = periodEnd;
    }

    setPeriods(generated);
    toast.success(`Generated ${numPeriods} periods`);
  };

  // Period editing helpers
  const updatePeriod = (index, field, value) => {
    const updated = [...periods];
    updated[index] = { ...updated[index], [field]: value };
    setPeriods(updated);
  };

  const removePeriod = (index) => {
    if (periods.length <= 1) return;
    setPeriods(periods.filter((_, i) => i !== index));
  };

  const addPeriod = () => {
    const last = periods[periods.length - 1];
    const start = last ? last.endTime : "08:00";
    setPeriods([
      ...periods,
      {
        name: `Period ${periods.filter((p) => !p.isBreak).length + 1}`,
        startTime: start,
        endTime: addMinutes(start, config.periodDuration),
        isBreak: false,
        _key: Date.now(),
      },
    ]);
  };

  const addBreak = () => {
    const last = periods[periods.length - 1];
    const start = last ? last.endTime : "08:00";
    setPeriods([
      ...periods,
      {
        name: "Break",
        startTime: start,
        endTime: addMinutes(start, 15),
        isBreak: true,
        _key: Date.now(),
      },
    ]);
  };

  // Save to backend
  const handleSave = async () => {
    if (!selectedClass) {
      toast.error("Please select a class first");
      return;
    }
    if (periods.length === 0) {
      toast.error("Please add at least one period");
      return;
    }

    // Validate times
    for (let i = 0; i < periods.length; i++) {
      const p = periods[i];
      if (!p.name?.trim()) {
        toast.error(`Period ${i + 1} needs a name`);
        return;
      }
      if (!p.startTime || !p.endTime) {
        toast.error(`${p.name} needs start and end times`);
        return;
      }
      if (durationBetween(p.startTime, p.endTime) <= 0) {
        toast.error(`${p.name}: end time must be after start time`);
        return;
      }
    }

    // AUDIT-130: Check for time overlaps between periods
    for (let i = 0; i < periods.length; i++) {
      for (let j = i + 1; j < periods.length; j++) {
        const a = periods[i];
        const b = periods[j];
        if (a.startTime < b.endTime && b.startTime < a.endTime) {
          toast.error(`"${a.name}" and "${b.name}" have overlapping times`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      // Strip _key before sending to API
      const cleanPeriods = periods.map(({ _key, ...rest }) => rest);
      await timetableApi.updatePeriods(selectedClass, { periods: cleanPeriods });
      setHasExisting(true);
      toast.success("Period timings saved successfully");
    } catch (error) {
      logger.error("Failed to save periods:", error);
      toast.error(error?.message || "Failed to save period timings");
    } finally {
      setSaving(false);
    }
  };

  const sortedClasses = useMemo(() => {
    return [...(classesWithTeachers || [])].sort((a, b) => {
      const nameA = `${a.name}-${a.section}`;
      const nameB = `${b.name}-${b.section}`;
      return nameA.localeCompare(nameB, undefined, { numeric: true });
    });
  }, [classesWithTeachers]);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="border-b border-border-token pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-[var(--info-bg)] text-[var(--info)]">
            <Clock size={22} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-fg">Period Timings</h2>
            <p className="text-sm text-fg-muted">
              Configure the number of periods, duration, and breaks for each class
            </p>
          </div>
        </div>
      </div>

      {/* Class Selector */}
      <div className="rounded-xl border border-border-token bg-surface p-5">
        <label className="text-sm font-medium text-fg mb-2 block">Select Class</label>
        <Select
          selectedKeys={selectedClass ? [selectedClass] : []}
          onChange={handleClassChange}
          placeholder="Choose a class to configure periods"
          variant="bordered"
          size="sm"
          className="max-w-xs"
          aria-label="Select class"
        >
          {sortedClasses.map((c) => (
            <SelectItem key={c.id || c._id} textValue={`${c.name}-${c.section}`}>
              {c.name}-{c.section}
            </SelectItem>
          ))}
        </Select>
      </div>

      {loading && <TablePageSkeleton />}

      {selectedClass && !loading && (
        <>
          {/* Configuration Card */}
          <div className="rounded-xl border border-border-token bg-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-fg uppercase tracking-wider">Schedule Configuration</h3>
              <Button
                size="sm"
                color="primary"
                variant="flat"
                startContent={<RefreshCw size={14} />}
                onPress={handleGenerate}
              >
                Generate Schedule
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <Input
                type="time"
                label="School Start Time"
                value={config.startTime}
                onValueChange={(v) => setConfig({ ...config, startTime: v })}
                variant="bordered"
                size="sm"
                labelPlacement="outside"
              />
              <Input
                type="number"
                label="No. of Periods"
                value={String(config.numPeriods)}
                onValueChange={(v) => setConfig({ ...config, numPeriods: Math.max(1, Math.min(12, Number(v) || 1)) })}
                variant="bordered"
                size="sm"
                labelPlacement="outside"
                min={1}
                max={12}
              />
              <Input
                type="number"
                label="Period Duration (min)"
                value={String(config.periodDuration)}
                onValueChange={(v) => setConfig({ ...config, periodDuration: Math.max(15, Math.min(120, Number(v) || 45)) })}
                variant="bordered"
                size="sm"
                labelPlacement="outside"
                min={15}
                max={120}
              />
              <div /> {/* spacer */}
              <Input
                type="number"
                label="Short Break After Period"
                value={String(config.shortBreakAfter)}
                onValueChange={(v) => setConfig({ ...config, shortBreakAfter: Math.max(0, Math.min(12, Number(v) || 0)) })}
                variant="bordered"
                size="sm"
                labelPlacement="outside"
                description="0 = no short break"
                min={0}
                max={12}
              />
              <Input
                type="number"
                label="Short Break (min)"
                value={String(config.shortBreakDuration)}
                onValueChange={(v) => setConfig({ ...config, shortBreakDuration: Math.max(5, Math.min(60, Number(v) || 15)) })}
                variant="bordered"
                size="sm"
                labelPlacement="outside"
                min={5}
                max={60}
              />
              <Input
                type="number"
                label="Lunch After Period"
                value={String(config.lunchAfter)}
                onValueChange={(v) => setConfig({ ...config, lunchAfter: Math.max(0, Math.min(12, Number(v) || 0)) })}
                variant="bordered"
                size="sm"
                labelPlacement="outside"
                description="0 = no lunch break"
                min={0}
                max={12}
              />
              <Input
                type="number"
                label="Lunch Duration (min)"
                value={String(config.lunchDuration)}
                onValueChange={(v) => setConfig({ ...config, lunchDuration: Math.max(15, Math.min(90, Number(v) || 45)) })}
                variant="bordered"
                size="sm"
                labelPlacement="outside"
                min={15}
                max={90}
              />
            </div>
          </div>

          {/* Summary Card */}
          {summary && (
            <div className="rounded-xl border border-[var(--info-border)] bg-[var(--info-bg)]/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Info size={16} className="text-[var(--info)]" />
                <span className="text-sm font-medium text-[var(--info)]">Schedule Summary</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-[var(--info)] uppercase tracking-wider">Periods</p>
                  <p className="text-lg font-semibold text-[var(--info)]">{summary.totalPeriods}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--info)] uppercase tracking-wider">Breaks</p>
                  <p className="text-lg font-semibold text-[var(--info)]">{summary.totalBreaks}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--info)] uppercase tracking-wider">School Hours</p>
                  <p className="text-lg font-semibold text-[var(--info)]">{summary.startTime} – {summary.endTime}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--info)] uppercase tracking-wider">Instructional Time</p>
                  <p className="text-lg font-semibold text-[var(--info)]">
                    {Math.floor(summary.instrMins / 60)}h {summary.instrMins % 60}m
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Editable Period List */}
          <div className="rounded-xl border border-border-token bg-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-fg uppercase tracking-wider">Period Slots</h3>
              {hasExisting && (
                <Chip size="sm" variant="flat" color="success">Saved</Chip>
              )}
            </div>

            {periods.length === 0 ? (
              <div className="text-center py-10 text-fg-faint">
                <Clock size={32} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">No periods configured. Use "Generate Schedule" above or add manually.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Header */}
                <div className="hidden sm:grid grid-cols-[1fr_120px_120px_80px_40px] gap-2 px-1 pb-1 border-b border-divider">
                  <span className="text-xs font-medium text-fg-muted uppercase">Name</span>
                  <span className="text-xs font-medium text-fg-muted uppercase">Start</span>
                  <span className="text-xs font-medium text-fg-muted uppercase">End</span>
                  <span className="text-xs font-medium text-fg-muted uppercase">Type</span>
                  <span />
                </div>

                {periods.map((period, i) => (
                  <div
                    key={period._key ?? i}
                    className={`grid grid-cols-1 sm:grid-cols-[1fr_120px_120px_80px_40px] gap-2 items-center p-2 rounded-lg transition-colors ${
                      period.isBreak
                        ? "bg-[var(--warn-bg)] border border-[var(--warn-border)]"
                        : "hover:bg-surface-2"
                    }`}
                  >
                    <Input
                      size="sm"
                      value={period.name}
                      onValueChange={(v) => updatePeriod(i, "name", v)}
                      variant="bordered"
                      aria-label="Period name"
                      startContent={
                        period.isBreak ? (
                          period.name.toLowerCase().includes("lunch") ? (
                            <UtensilsCrossed size={14} className="text-[var(--warn)]" />
                          ) : (
                            <Coffee size={14} className="text-[var(--warn)]" />
                          )
                        ) : (
                          <span className="text-xs font-semibold text-fg-faint w-4 text-center">
                            {periods.filter((p, j) => j <= i && !p.isBreak).length || ""}
                          </span>
                        )
                      }
                    />
                    <Input
                      size="sm"
                      type="time"
                      value={period.startTime}
                      onValueChange={(v) => updatePeriod(i, "startTime", v)}
                      variant="bordered"
                      aria-label="Start time"
                    />
                    <Input
                      size="sm"
                      type="time"
                      value={period.endTime}
                      onValueChange={(v) => updatePeriod(i, "endTime", v)}
                      variant="bordered"
                      aria-label="End time"
                    />
                    <button
                      onClick={() => updatePeriod(i, "isBreak", !period.isBreak)}
                      className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                        period.isBreak
                          ? "bg-[var(--warn-bg)] border-[var(--warn-border)] text-[var(--warn)]"
                          : "bg-surface-2 border-border-token text-fg-muted hover:bg-surface-2"
                      }`}
                    >
                      {period.isBreak ? "Break" : "Class"}
                    </button>
                    <Button
                      isIconOnly
                      size="sm"
                      color="danger"
                      variant="light"
                      onPress={() => removePeriod(i)}
                      isDisabled={periods.length <= 1}
                      aria-label="Remove period"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add buttons */}
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="flat" startContent={<Plus size={14} />} onPress={addPeriod}>
                Add Period
              </Button>
              <Button size="sm" variant="flat" color="warning" startContent={<Coffee size={14} />} onPress={addBreak}>
                Add Break
              </Button>
            </div>
          </div>

          {/* Save */}
          {periods.length > 0 && (
            <div className="flex justify-end">
              <Button
                color="primary"
                startContent={<Save size={16} />}
                onPress={handleSave}
                isLoading={saving}
                size="lg"
              >
                Save Period Timings
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
