import { describe, it, expect } from "vitest";
import {
  deriveExamStatus,
  summarizeExamKpis,
  filterExams,
  EXAM_STATUS,
} from "./useAcademicsData";

describe("deriveExamStatus", () => {
  it("normalizes case", () => {
    expect(deriveExamStatus({ status: "SCHEDULED" })).toBe("scheduled");
    expect(deriveExamStatus({ status: "Results_Published" })).toBe("results_published");
  });

  it("falls back to scheduled when missing", () => {
    expect(deriveExamStatus({})).toBe("scheduled");
    expect(deriveExamStatus(null)).toBe("scheduled");
  });
});

describe("summarizeExamKpis", () => {
  const exams = [
    { status: "scheduled" },
    { status: "scheduled", avgPercentage: 70 },
    { status: "ongoing", avgPercentage: 80 },
    { status: "results_published", avgPercentage: 90 },
    { status: "completed" },
  ];

  it("counts upcoming + published correctly", () => {
    const k = summarizeExamKpis(exams);
    expect(k.upcomingCount).toBe(3);
    expect(k.publishedCount).toBe(1);
    expect(k.totalCount).toBe(5);
  });

  it("computes mean of avgPercentage where present", () => {
    const k = summarizeExamKpis(exams);
    expect(k.averagePerformance).toBe(80); // (70+80+90)/3
  });

  it("returns null avg when no rows have avgPercentage", () => {
    const k = summarizeExamKpis([{ status: "scheduled" }]);
    expect(k.averagePerformance).toBeNull();
  });

  it("zeros for empty input", () => {
    expect(summarizeExamKpis([])).toEqual({
      upcomingCount: 0,
      publishedCount: 0,
      averagePerformance: null,
      totalCount: 0,
    });
  });

  it("handles non-array safely", () => {
    expect(summarizeExamKpis(null).totalCount).toBe(0);
  });
});

describe("filterExams", () => {
  const exams = [
    { _id: "e1", name: "Maths Term 1", subject: "Math", status: "scheduled" },
    { _id: "e2", name: "Science Term 1", subject: "Science", status: "results_published" },
    { _id: "e3", name: "English Term 2", subject: "English", status: "draft" },
  ];

  it("returns all for status=all", () => {
    expect(filterExams(exams, { status: "all" })).toHaveLength(3);
  });

  it("filters published only", () => {
    const r = filterExams(exams, { status: "published" });
    expect(r).toHaveLength(1);
    expect(r[0]._id).toBe("e2");
  });

  it("filters upcoming (scheduled + ongoing)", () => {
    const r = filterExams(exams, { status: "upcoming" });
    expect(r).toHaveLength(1);
    expect(r[0]._id).toBe("e1");
  });

  it("filters drafts (draft + scheduled)", () => {
    const r = filterExams(exams, { status: "drafts" });
    expect(r).toHaveLength(2);
  });

  it("filters by search across name + subject", () => {
    expect(filterExams(exams, { search: "math" })).toHaveLength(1);
    expect(filterExams(exams, { search: "term 1" })).toHaveLength(2);
  });

  it("combines status + search", () => {
    expect(
      filterExams(exams, { status: "published", search: "science" })
    ).toHaveLength(1);
    expect(
      filterExams(exams, { status: "published", search: "math" })
    ).toHaveLength(0);
  });

  it("handles non-array safely", () => {
    expect(filterExams(null, {})).toEqual([]);
  });
});
