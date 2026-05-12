import { describe, it, expect } from "vitest";
import {
  summarizeKpis,
  combineActivity,
  filterActivity,
  toActivityRow,
  ACTIVITY_TYPES,
} from "./useFrontDeskData";

const today = new Date("2026-05-04T10:00:00Z");
const earlier = new Date("2026-05-04T08:00:00Z");

describe("summarizeKpis", () => {
  it("counts visitors checked-in vs out", () => {
    const k = summarizeKpis({
      visitors: [{ checkInTime: today, checkOutTime: today }, { checkInTime: today }],
    });
    expect(k.visitorsToday).toBe(2);
    expect(k.visitorsCheckedIn).toBe(1);
  });

  it("counts pending gate passes (case-insensitive)", () => {
    const k = summarizeKpis({
      gatePasses: [{ approvalStatus: "PENDING" }, { approvalStatus: "approved" }, { status: "pending" }],
    });
    expect(k.gatePassesToday).toBe(3);
    expect(k.gatePassesPending).toBe(2);
  });

  it("counts open feedbacks", () => {
    const k = summarizeKpis({
      feedbacks: [{ status: "open" }, { status: "RESOLVED" }, {}],
    });
    expect(k.feedbacksOpen).toBe(2); // missing status defaults to "open"
  });

  it("returns zeros for empty input", () => {
    expect(summarizeKpis({})).toEqual({
      visitorsToday: 0,
      visitorsCheckedIn: 0,
      gatePassesToday: 0,
      gatePassesPending: 0,
      appointmentsCount: 0,
      feedbacksOpen: 0,
      callsCount: 0,
    });
  });
});

describe("toActivityRow", () => {
  it("normalizes a visitor", () => {
    const row = toActivityRow(
      { _id: "v1", name: "Asha", purpose: "Parent meeting", checkInTime: today },
      ACTIVITY_TYPES.VISITOR
    );
    expect(row.name).toBe("Asha");
    expect(row.sub).toBe("Parent meeting");
    expect(row.status).toBe("in");
  });

  it("marks visitor checked-out when checkOutTime present", () => {
    const row = toActivityRow(
      { _id: "v1", name: "Asha", checkInTime: earlier, checkOutTime: today },
      ACTIVITY_TYPES.VISITOR
    );
    expect(row.status).toBe("checked-out");
  });

  it("normalizes a gate pass with student", () => {
    const row = toActivityRow(
      { _id: "g1", studentName: "Aarav", reason: "Doctor", approvalStatus: "PENDING" },
      ACTIVITY_TYPES.GATE_PASS
    );
    expect(row.name).toBe("Aarav");
    expect(row.status).toBe("pending");
  });

  it("returns null for unknown type", () => {
    expect(toActivityRow({}, "unknown")).toBeNull();
  });
});

describe("combineActivity", () => {
  it("merges + sorts by time desc", () => {
    const rows = combineActivity({
      visitors: [{ _id: "v1", name: "Asha", checkInTime: earlier }],
      gatePasses: [{ _id: "g1", studentName: "Aarav", leavingDateTime: today }],
    });
    expect(rows).toHaveLength(2);
    expect(rows[0].name).toBe("Aarav"); // newer
    expect(rows[1].name).toBe("Asha");
  });

  it("filters out null entities", () => {
    const rows = combineActivity({ visitors: [null, { _id: "v1", name: "X" }] });
    expect(rows).toHaveLength(1);
  });
});

describe("filterActivity", () => {
  const rows = [
    { id: "1", type: "visitors", name: "Asha", sub: "Parent" },
    { id: "2", type: "gate-passes", name: "Aarav", sub: "Doctor" },
    { id: "3", type: "visitors", name: "Riya", sub: "" },
  ];

  it("filters by type", () => {
    expect(filterActivity(rows, { type: "visitors" })).toHaveLength(2);
  });

  it("filters by search across name + sub", () => {
    expect(filterActivity(rows, { search: "doctor" })).toHaveLength(1);
    expect(filterActivity(rows, { search: "ash" })).toHaveLength(1);
  });

  it("combines type + search", () => {
    expect(filterActivity(rows, { type: "visitors", search: "ash" })).toHaveLength(1);
    expect(filterActivity(rows, { type: "gate-passes", search: "ash" })).toHaveLength(0);
  });

  it("returns all for type=all + empty search", () => {
    expect(filterActivity(rows, {})).toHaveLength(3);
  });

  it("handles non-array safely", () => {
    expect(filterActivity(null, {})).toEqual([]);
  });
});
