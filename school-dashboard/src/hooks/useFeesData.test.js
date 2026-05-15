import { describe, it, expect } from "vitest";
import {
  derivePaymentStatus,
  computeKpis,
  filterPayments,
  isSameDay,
  indexStudentsById,
  joinStudentsToPayments,
  PAYMENT_STATUS,
} from "./useFeesData";

const today = new Date("2026-05-04T10:00:00Z");
const yesterday = new Date("2026-05-03T10:00:00Z");
const lastWeek = new Date("2026-04-27T10:00:00Z");

describe("derivePaymentStatus", () => {
  it("returns paid when status is paid or completed", () => {
    expect(derivePaymentStatus({ status: "paid" }, today)).toBe(PAYMENT_STATUS.PAID);
    expect(derivePaymentStatus({ status: "completed" }, today)).toBe(PAYMENT_STATUS.PAID);
    expect(derivePaymentStatus({ status: "PAID" }, today)).toBe(PAYMENT_STATUS.PAID);
  });

  it("returns overdue when explicitly marked overdue", () => {
    expect(derivePaymentStatus({ status: "overdue" }, today)).toBe(PAYMENT_STATUS.OVERDUE);
  });

  it("escalates pending to overdue when dueDate is past", () => {
    expect(
      derivePaymentStatus({ status: "pending", dueDate: lastWeek.toISOString() }, today)
    ).toBe(PAYMENT_STATUS.OVERDUE);
  });

  it("keeps pending when dueDate is in the future", () => {
    const future = new Date("2026-06-01T10:00:00Z");
    expect(
      derivePaymentStatus({ status: "pending", dueDate: future.toISOString() }, today)
    ).toBe(PAYMENT_STATUS.PENDING);
  });

  it("returns pending when no status and no dueDate", () => {
    expect(derivePaymentStatus({}, today)).toBe(PAYMENT_STATUS.PENDING);
  });

  it("handles null payment safely", () => {
    expect(derivePaymentStatus(null, today)).toBe(PAYMENT_STATUS.PENDING);
  });
});

describe("isSameDay", () => {
  it("returns true for the same calendar day", () => {
    expect(isSameDay(today, today)).toBe(true);
    // Two timestamps within the same local calendar day
    const a = new Date(2026, 4, 4, 9, 0, 0);
    const b = new Date(2026, 4, 4, 17, 30, 0);
    expect(isSameDay(a, b)).toBe(true);
  });

  it("returns false for different days", () => {
    expect(isSameDay(yesterday, today)).toBe(false);
  });

  it("returns false for invalid input", () => {
    expect(isSameDay(null, today)).toBe(false);
    expect(isSameDay("not-a-date", today)).toBe(false);
  });
});

describe("computeKpis", () => {
  const payments = [
    { status: "paid", amount: 5000, paidAt: today.toISOString(), studentId: "s1" },
    { status: "paid", amount: 3000, paidAt: yesterday.toISOString(), studentId: "s2" },
    { status: "pending", amount: 8000, balanceAmount: 8000, dueDate: lastWeek.toISOString(), studentId: "s3" },
    { status: "pending", amount: 4000, balanceAmount: 4000, dueDate: lastWeek.toISOString(), studentId: "s3" },
    { status: "pending", amount: 6000, balanceAmount: 6000, dueDate: "2026-06-01T00:00:00Z", studentId: "s4" },
  ];

  it("sums collected today only", () => {
    const k = computeKpis(payments, today);
    expect(k.collectedToday).toBe(5000);
  });

  it("sums outstanding from pending + overdue rows", () => {
    const k = computeKpis(payments, today);
    expect(k.outstandingTotal).toBe(8000 + 4000 + 6000);
  });

  it("counts unique overdue students", () => {
    const k = computeKpis(payments, today);
    expect(k.overdueCount).toBe(1); // s3 has 2 overdue rows but counted once
  });

  it("returns zeros for empty list", () => {
    expect(computeKpis([], today)).toEqual({
      collectedToday: 0,
      outstandingTotal: 0,
      overdueCount: 0,
    });
  });

  it("handles non-array gracefully", () => {
    expect(computeKpis(null, today).overdueCount).toBe(0);
  });
});

describe("filterPayments", () => {
  const payments = [
    { status: "paid", amount: 5000, student: { name: "Aarav Joshi", admissionNo: "ADM001" } },
    { status: "pending", amount: 8000, dueDate: lastWeek.toISOString(), student: { name: "Riya Mehta", admissionNo: "ADM002" } },
    { status: "pending", amount: 4000, dueDate: "2026-06-01T00:00:00Z", student: { name: "Karan Singh", admissionNo: "ADM003" } },
  ];

  it("returns all rows for status='all'", () => {
    expect(filterPayments(payments, { status: "all" }, today)).toHaveLength(3);
  });

  it("filters to paid only", () => {
    const r = filterPayments(payments, { status: "paid" }, today);
    expect(r).toHaveLength(1);
    expect(r[0].student.name).toBe("Aarav Joshi");
  });

  it("filters to overdue (escalated from pending past dueDate)", () => {
    const r = filterPayments(payments, { status: "overdue" }, today);
    expect(r).toHaveLength(1);
    expect(r[0].student.name).toBe("Riya Mehta");
  });

  it("filters to pending (still upcoming)", () => {
    const r = filterPayments(payments, { status: "pending" }, today);
    expect(r).toHaveLength(1);
    expect(r[0].student.name).toBe("Karan Singh");
  });

  it("filters by search across name + admission no", () => {
    expect(filterPayments(payments, { search: "riya" }, today)).toHaveLength(1);
    expect(filterPayments(payments, { search: "ADM003" }, today)).toHaveLength(1);
    expect(filterPayments(payments, { search: "Joshi" }, today)).toHaveLength(1);
  });

  it("combines status + search", () => {
    expect(filterPayments(payments, { status: "paid", search: "riya" }, today)).toHaveLength(0);
    expect(filterPayments(payments, { status: "paid", search: "joshi" }, today)).toHaveLength(1);
  });

  it("returns all rows when search is empty/whitespace", () => {
    expect(filterPayments(payments, { search: "  " }, today)).toHaveLength(3);
  });

  it("handles non-array safely", () => {
    expect(filterPayments(null, { status: "all" }, today)).toEqual([]);
  });
});

describe("indexStudentsById", () => {
  it("indexes by _id and id keys", () => {
    const idx = indexStudentsById([
      { _id: "s1", name: "A" },
      { id: "s2", name: "B" },
    ]);
    expect(idx.get("s1")?.name).toBe("A");
    expect(idx.get("s2")?.name).toBe("B");
  });

  it("returns empty map for null", () => {
    expect(indexStudentsById(null).size).toBe(0);
  });

  it("skips entries with no id", () => {
    const idx = indexStudentsById([{ name: "Anon" }, { _id: "s1", name: "A" }]);
    expect(idx.size).toBe(1);
  });
});

describe("joinStudentsToPayments", () => {
  const students = [
    { _id: "s1", name: "Aarav Joshi", admissionNo: "ADM001", rollNo: 5, classId: "c1", className: "Class 3A" },
    { _id: "s2", name: "Riya Mehta", admissionNo: "ADM002", rollNo: 8, classId: "c2", className: "Class 3B" },
  ];
  const idx = indexStudentsById(students);

  it("attaches student object onto matching payments", () => {
    const result = joinStudentsToPayments(
      [{ _id: "p1", studentId: "s1", amount: 5000 }],
      idx
    );
    expect(result[0].student.name).toBe("Aarav Joshi");
    expect(result[0].student.admissionNo).toBe("ADM001");
    expect(result[0].student.rollNo).toBe(5);
  });

  it("preserves original payment fields", () => {
    const result = joinStudentsToPayments(
      [{ _id: "p1", studentId: "s1", amount: 5000, status: "paid" }],
      idx
    );
    expect(result[0]._id).toBe("p1");
    expect(result[0].amount).toBe(5000);
    expect(result[0].status).toBe("paid");
  });

  it("leaves payment unchanged when student not found", () => {
    const result = joinStudentsToPayments(
      [{ _id: "p1", studentId: "unknown", amount: 5000 }],
      idx
    );
    expect(result[0].student).toBeUndefined();
  });

  it("does not overwrite payment.student already set", () => {
    const populated = { _id: "p1", studentId: { _id: "s1" }, student: { name: "Already populated" } };
    const result = joinStudentsToPayments([populated], idx);
    expect(result[0].student.name).toBe("Already populated");
  });

  it("promotes a populated studentId object to payment.student", () => {
    const result = joinStudentsToPayments(
      [
        {
          _id: "p1",
          studentId: { _id: "s1", name: "Aarav Joshi", admissionId: "ADM001" },
          amount: 5000,
        },
      ],
      idx
    );
    expect(result[0].student.name).toBe("Aarav Joshi");
    // admissionId from the populated object falls back to admissionNo
    expect(result[0].student.admissionNo).toBe("ADM001");
    // rollNo and className are picked up from the studentsIndex
    expect(result[0].student.rollNo).toBe(5);
    expect(result[0].student.className).toBe("Class 3A");
  });

  it("promotes populated studentId even without studentsIndex", () => {
    const result = joinStudentsToPayments(
      [
        {
          _id: "p1",
          studentId: { _id: "sX", name: "Unknown Student" },
          amount: 5000,
        },
      ],
      indexStudentsById([])
    );
    expect(result[0].student.name).toBe("Unknown Student");
  });

  it("returns input list unchanged when index is empty and studentId is bare", () => {
    const list = [{ _id: "p1", studentId: "s1" }];
    const result = joinStudentsToPayments(list, indexStudentsById([]));
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(list[0]);
    expect(result[0].student).toBeUndefined();
  });

  it("handles non-array input safely", () => {
    expect(joinStudentsToPayments(null, idx)).toEqual([]);
  });
});
