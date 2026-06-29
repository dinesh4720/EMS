import { describe, it, expect } from "vitest";

import { buildUpcoming } from "./utils";

const TODAY = new Date("2026-06-28T10:00:00");
const ISO = (d) => new Date(d).toISOString();

describe("buildUpcoming", () => {
  it("returns [] for non-array / empty input", () => {
    expect(buildUpcoming(undefined, TODAY)).toEqual([]);
    expect(buildUpcoming(null, TODAY)).toEqual([]);
    expect(buildUpcoming([], TODAY)).toEqual([]);
  });

  it("filters to scheduled/ongoing exams on or after today", () => {
    const exams = [
      { name: "Past quiz", status: "scheduled", startDate: ISO("2026-06-01") },
      { name: "Future final", status: "scheduled", startDate: ISO("2026-07-15") },
      { name: "Ongoing lab", status: "ongoing", startDate: ISO("2026-06-28") },
      { name: "Already done", status: "completed", startDate: ISO("2026-08-01") },
      { name: "Draft", status: "draft", startDate: ISO("2026-09-01") },
      { name: "Published", status: "results_published", startDate: ISO("2026-09-02") },
    ];
    const result = buildUpcoming(exams, TODAY);
    expect(result.map((r) => r.title)).toEqual([
      "Ongoing lab",
      "Future final",
    ]);
  });

  it("sorts ascending by start date and maps to UpcomingCard shape", () => {
    const exams = [
      { name: "B", status: "scheduled", startDate: ISO("2026-07-15") },
      { name: "A", status: "scheduled", startDate: ISO("2026-07-01") },
      { name: "C", status: "scheduled", startDate: ISO("2026-07-30") },
    ];
    const result = buildUpcoming(exams, TODAY);
    expect(result).toEqual([
      { date: "Jul 01", title: "A", meta: "" },
      { date: "Jul 15", title: "B", meta: "" },
      { date: "Jul 30", title: "C", meta: "" },
    ]);
  });

  it("builds meta from subject/class/term and dedupes the title", () => {
    const exams = [
      {
        name: "Algebra",
        subjectName: "Mathematics",
        className: "10-A",
        term: "Term 1",
        status: "scheduled",
        startDate: ISO("2026-07-01"),
      },
    ];
    const [item] = buildUpcoming(exams, TODAY);
    expect(item.title).toBe("Algebra");
    expect(item.meta).toBe("Mathematics · 10-A · Term 1");
  });

  it("falls back to subject when name is missing and avoids echoing title in meta", () => {
    const exams = [
      {
        // No name → title comes from subjectName, which is then dropped from meta
        subjectName: "Mathematics",
        className: "10-A",
        status: "scheduled",
        startDate: ISO("2026-07-01"),
      },
    ];
    const [item] = buildUpcoming(exams, TODAY);
    expect(item.title).toBe("Mathematics");
    expect(item.meta).toBe("10-A");
  });

  it("caps the result at 5 items", () => {
    const exams = Array.from({ length: 8 }, (_, i) => ({
      name: `Exam ${i + 1}`,
      status: "scheduled",
      startDate: ISO(`2026-07-0${i + 1}`),
    }));
    expect(buildUpcoming(exams, TODAY)).toHaveLength(5);
  });

  it("treats a start date earlier today as upcoming (same-day inclusive)", () => {
    const earlierToday = new Date(TODAY);
    earlierToday.setHours(0, 0, 0, 0);
    const exams = [
      { name: "Same-day", status: "ongoing", startDate: ISO(earlierToday) },
    ];
    expect(buildUpcoming(exams, TODAY)).toHaveLength(1);
  });

  it("ignores exams with an unparseable start date", () => {
    const exams = [
      { name: "Bad date", status: "scheduled", startDate: "not-a-date" },
      { name: "Good", status: "scheduled", startDate: ISO("2026-07-01") },
    ];
    const result = buildUpcoming(exams, TODAY);
    expect(result.map((r) => r.title)).toEqual(["Good"]);
  });
});
