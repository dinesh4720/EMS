import { useMemo, useState } from "react";
import { useApp } from "../../../context/AppContext";
import { useAuth } from "../../../context/AuthContext";
import useTodayPeriods from "../hooks/useTodayPeriods";
import ClassesToolbar from "../../../components/classes/ClassesToolbar";
import ClassTile from "../../../components/classes/ClassTile";

// Variation A body. Filtered tile grid.
// "Mine" segment is appended only when the current user teaches at least one
// class — see ClassesToolbar for the visibility rule.
export default function ByClassView() {
  const { classes = [], staff = [] } = useApp();
  const { user } = useAuth();
  const { periods } = useTodayPeriods();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  // Compute classesTaught — both as classTeacher and via assignedClasses.
  const userId = user?.id || user?._id;
  const classesTaught = useMemo(() => {
    if (!userId) return [];
    return classes.filter((c) => {
      const isClassTeacher = String(c.classTeacherId) === String(userId);
      const inAssigned = (user?.assignedClasses || []).some(
        (cid) =>
          String(cid) === String(c._id) || String(cid) === String(c.id)
      );
      return isClassTeacher || inAssigned;
    });
  }, [classes, userId, user]);
  const showMineFilter = classesTaught.length > 0;

  // Build per-class today's-attendance + current-period from `periods`.
  const classMeta = useMemo(() => {
    const map = new Map();
    for (const p of periods) {
      for (const slot of p.slots) {
        const cur = map.get(slot.classId) || {
          present: 0,
          total: 0,
          marked: 0,
          slotsToday: 0,
          unmarked: 0,
          currentPeriodLabel: null,
        };
        cur.slotsToday += 1;
        // Attendance is recorded once per class per day, so every period slot
        // for a class carries the same daily present/total — assign it once
        // rather than summing (which would multiply by the period count).
        if (slot.attendance?.total) {
          cur.present = slot.attendance.present || 0;
          cur.total = slot.attendance.total || 0;
        }
        if (slot.attendance?.marked) cur.marked += 1;
        else cur.unmarked += 1;
        if (p.state === "live" || p.state === "urgent") {
          cur.currentPeriodLabel = p.name || `Period ${p.number}`;
        }
        map.set(slot.classId, cur);
      }
    }
    return map;
  }, [periods]);

  const teacherById = useMemo(() => {
    const m = new Map();
    for (const s of staff) m.set(String(s._id || s.id), s);
    return m;
  }, [staff]);

  const visible = useMemo(() => {
    let list = classes;
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.section || "").toLowerCase().includes(q) ||
        (c.teacher || "").toLowerCase().includes(q)
      );
    }
    if (filter === "active") {
      list = list.filter((c) => {
        const meta = classMeta.get(c._id || c.id);
        return meta && meta.slotsToday > 0;
      });
    } else if (filter === "attention") {
      list = list.filter((c) => {
        const meta = classMeta.get(c._id || c.id);
        return meta && meta.unmarked > 0;
      });
    } else if (filter === "mine" && showMineFilter) {
      const taughtIds = new Set(
        classesTaught.map((c) => String(c._id || c.id))
      );
      list = list.filter((c) => taughtIds.has(String(c._id || c.id)));
    }
    return list;
  }, [classes, classMeta, classesTaught, filter, query, showMineFilter]);

  return (
    <>
      <ClassesToolbar
        query={query}
        onQueryChange={setQuery}
        filter={filter}
        onFilterChange={setFilter}
        showMineFilter={showMineFilter}
      />

      {visible.length === 0 ? (
        <div
          className="subtle"
          style={{ padding: 48, textAlign: "center", fontSize: 13 }}
        >
          {classes.length === 0
            ? "No classes yet."
            : "No classes match this filter."}
        </div>
      ) : (
        <div className="class-grid">
          {visible.map((c) => {
            const meta = classMeta.get(c._id || c.id);
            const teacher = teacherById.get(String(c.classTeacherId));
            const todayPct =
              meta && meta.total > 0
                ? Math.round((meta.present / meta.total) * 100)
                : null;
            return (
              <ClassTile
                key={c._id || c.id}
                classRecord={c}
                todayPct={todayPct}
                todayPresent={meta?.present || 0}
                todayTotal={meta?.total || 0}
                teacherName={teacher?.name || c.teacher || ""}
                currentPeriodLabel={meta?.currentPeriodLabel}
                unmarked={meta && meta.unmarked > 0}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
