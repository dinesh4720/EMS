import { describe, it, expect } from "vitest";
import {
  getStudentIdFromSearch,
  withStudentId,
  nextRowIndex,
  prevRowIndex,
  isOverlayViewport,
  OVERLAY_MIN_WIDTH,
} from "./useStudentOverlay";

describe("getStudentIdFromSearch", () => {
  it("returns null when ?student is absent", () => {
    expect(getStudentIdFromSearch("")).toBeNull();
    expect(getStudentIdFromSearch("?other=1")).toBeNull();
  });

  it("reads the value when present", () => {
    expect(getStudentIdFromSearch("?student=stu_42")).toBe("stu_42");
    expect(getStudentIdFromSearch("?other=1&student=abc")).toBe("abc");
  });

  it("accepts a URLSearchParams instance directly", () => {
    const sp = new URLSearchParams("?student=xyz&period=4");
    expect(getStudentIdFromSearch(sp)).toBe("xyz");
  });
});

describe("withStudentId", () => {
  it("appends student when adding to empty search", () => {
    const next = withStudentId("", "stu_1");
    expect(next.toString()).toBe("student=stu_1");
  });

  it("preserves other params when setting", () => {
    const next = withStudentId("period=4", "stu_1");
    expect(next.get("period")).toBe("4");
    expect(next.get("student")).toBe("stu_1");
  });

  it("removes student when id is null", () => {
    const next = withStudentId("?student=stu_1&period=4", null);
    expect(next.has("student")).toBe(false);
    expect(next.get("period")).toBe("4");
  });

  it("overwrites existing student value", () => {
    const next = withStudentId("?student=old", "new");
    expect(next.get("student")).toBe("new");
  });
});

describe("nextRowIndex", () => {
  it("returns 0 when nothing selected", () => {
    expect(nextRowIndex(null, 5)).toBe(0);
    expect(nextRowIndex(-1, 5)).toBe(0);
  });

  it("advances by one in the middle", () => {
    expect(nextRowIndex(2, 5)).toBe(3);
  });

  it("wraps from last to first", () => {
    expect(nextRowIndex(4, 5)).toBe(0);
  });

  it("returns null for empty list", () => {
    expect(nextRowIndex(0, 0)).toBeNull();
    expect(nextRowIndex(null, 0)).toBeNull();
  });
});

describe("prevRowIndex", () => {
  it("returns last index when nothing selected", () => {
    expect(prevRowIndex(null, 5)).toBe(4);
  });

  it("decrements by one in the middle", () => {
    expect(prevRowIndex(2, 5)).toBe(1);
  });

  it("wraps from first to last", () => {
    expect(prevRowIndex(0, 5)).toBe(4);
  });

  it("returns null for empty list", () => {
    expect(prevRowIndex(0, 0)).toBeNull();
  });
});

describe("isOverlayViewport", () => {
  it("returns true at and above the breakpoint", () => {
    expect(isOverlayViewport(OVERLAY_MIN_WIDTH)).toBe(true);
    expect(isOverlayViewport(1280)).toBe(true);
  });

  it("returns false below the breakpoint", () => {
    expect(isOverlayViewport(OVERLAY_MIN_WIDTH - 1)).toBe(false);
    expect(isOverlayViewport(375)).toBe(false);
  });

  it("returns false for non-finite inputs", () => {
    expect(isOverlayViewport(NaN)).toBe(false);
    expect(isOverlayViewport(undefined)).toBe(false);
  });
});
