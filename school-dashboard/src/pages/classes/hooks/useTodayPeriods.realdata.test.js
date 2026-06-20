import { describe, it, expect } from "vitest";
import {
  buildClassAttendanceMap,
  buildSlotsForPeriod,
} from "./useTodayPeriods";

describe("buildClassAttendanceMap", () => {
  it("returns an empty map for missing / empty snapshots", () => {
    expect(buildClassAttendanceMap(undefined).size).toBe(0);
    expect(buildClassAttendanceMap(null).size).toBe(0);
    expect(buildClassAttendanceMap({}).size).toBe(0);
    expect(buildClassAttendanceMap({ classes: {} }).size).toBe(0);
  });

  it("marks a class as recorded when it has any rows for the day", () => {
    const map = buildClassAttendanceMap({
      date: "2026-06-21",
      classes: {
        c1: { present: 28, absent: 2, late: 0, leave: 0, halfday: 0, total: 30 },
      },
    });
    expect(map.get("c1")).toEqual({ present: 28, total: 30, marked: true });
  });

  it("treats an all-absent class (present 0, total > 0) as marked", () => {
    const map = buildClassAttendanceMap({
      classes: { c2: { present: 0, absent: 30, total: 30 } },
    });
    expect(map.get("c2")).toEqual({ present: 0, total: 30, marked: true });
  });

  it("treats total 0 as not marked", () => {
    const map = buildClassAttendanceMap({
      classes: { c3: { present: 0, total: 0 } },
    });
    expect(map.get("c3")).toEqual({ present: 0, total: 0, marked: false });
  });
});

describe("buildSlotsForPeriod", () => {
  const staff = [
    { _id: "t1", name: "Asha Rao" },
    { _id: "t2", name: "Vikram Mehta" },
  ];
  const teacherById = new Map(staff.map((s) => [String(s._id), s]));

  // Two classes, period index 0 = Monday first period.
  const timetables = [
    {
      classId: { _id: "c1", name: "10", section: "A" },
      periods: [{ name: "Period 1" }, { name: "Period 2" }],
      schedule: {
        Monday: [
          { subject: "Math", teacherId: "t1", room: "204" },
          { subject: "", teacherId: null, room: "" }, // free period
        ],
        Tuesday: [{ subject: "", teacherId: null, room: "" }],
      },
    },
    {
      classId: { _id: "c2", name: "9", section: "B" },
      periods: [{ name: "Period 1" }, { name: "Period 2" }],
      schedule: {
        Monday: [
          { subject: "Science", teacherId: "t2", room: "Lab 1" },
          { subject: "English", teacherId: "t1", room: "110" },
        ],
      },
    },
  ];

  it("surfaces only classes with a real subject this period", () => {
    const attendance = new Map([
      ["c1", { present: 27, total: 30, marked: true }],
    ]);
    const slots = buildSlotsForPeriod(0, "Monday", timetables, teacherById, attendance);
    expect(slots).toHaveLength(2);

    const c1 = slots.find((s) => s.classId === "c1");
    expect(c1).toMatchObject({
      className: "10 A",
      subject: "Math",
      teacherName: "Asha Rao",
      room: "204",
    });
    expect(c1.attendance).toEqual({ marked: true, present: 27, total: 30 });

    const c2 = slots.find((s) => s.classId === "c2");
    expect(c2).toMatchObject({
      className: "9 B",
      subject: "Science",
      teacherName: "Vikram Mehta",
      room: "Lab 1",
    });
    // No snapshot entry → defaults, not fabricated marked state.
    expect(c2.attendance).toEqual({ marked: false, present: 0, total: 0 });
  });

  it("skips empty/free slots (c1 is free in period 2)", () => {
    const slots = buildSlotsForPeriod(1, "Monday", timetables, teacherById, new Map());
    expect(slots.map((s) => s.classId)).toEqual(["c2"]);
    expect(slots[0].subject).toBe("English");
  });

  it("returns nothing when no class is scheduled that day", () => {
    const slots = buildSlotsForPeriod(0, "Sunday", timetables, teacherById, new Map());
    expect(slots).toEqual([]);
  });

  it("is safe for out-of-range period indices and missing teachers", () => {
    const slots = buildSlotsForPeriod(0, "Tuesday", timetables, teacherById, new Map());
    expect(slots).toEqual([]); // c1 Tuesday[0] is empty, c2 has no Tuesday
  });
});
