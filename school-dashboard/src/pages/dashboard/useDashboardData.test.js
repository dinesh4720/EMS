/**
 * @vitest-environment jsdom
 *
 * [SCH-211] The dashboard's student KPIs (active-student count + per-class
 * attendance snapshot) must come from the server analytics summary, not the
 * PAG-05-emptied AppContext roster. These tests lock that wiring in.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

vi.mock("../../services/api", () => ({
  announcementsApi: { getAll: vi.fn() },
  attendanceApi: { getTodaySnapshot: vi.fn() },
  dashboardApi: { getAnalyticsSummary: vi.fn() },
  feesApi: { getPayments: vi.fn() },
  ptmApi: { getAll: vi.fn() },
  studentFeesApi: { getAll: vi.fn() },
  substitutionAlertsApi: { getAlerts: vi.fn() },
}));

vi.mock("../../context/PermissionContext", () => ({
  usePermissions: () => ({ ready: true, isModuleEnabled: () => true }),
}));

import {
  announcementsApi,
  attendanceApi,
  dashboardApi,
  feesApi,
  ptmApi,
  studentFeesApi,
  substitutionAlertsApi,
} from "../../services/api";
import useDashboardData from "./useDashboardData";

// The roster is always empty under PAG-05 — the hook must not rely on it.
const EMPTY_ROSTER_PROPS = {
  students: [],
  staff: [],
  staffAttendance: {},
  currentAcademicYear: "2025-26",
};

beforeEach(() => {
  vi.clearAllMocks();
  feesApi.getPayments.mockResolvedValue({ payments: [] });
  announcementsApi.getAll.mockResolvedValue([]);
  studentFeesApi.getAll.mockResolvedValue([]);
  attendanceApi.getTodaySnapshot.mockResolvedValue({ classes: {} });
  substitutionAlertsApi.getAlerts.mockResolvedValue({ alerts: [] });
  ptmApi.getAll.mockResolvedValue([]);
  dashboardApi.getAnalyticsSummary.mockResolvedValue({
    students: { total: 0, active: 0 },
    fees: {},
    classDistribution: [],
  });
});

describe("useDashboardData — student KPIs (SCH-211)", () => {
  it("sources active-student totals from the analytics summary", async () => {
    dashboardApi.getAnalyticsSummary.mockResolvedValue({
      students: { total: 120, active: 108 },
      fees: {},
      classDistribution: [],
    });

    const { result } = renderHook(() => useDashboardData(EMPTY_ROSTER_PROPS));

    await waitFor(() =>
      expect(result.current.studentStats).toEqual({ total: 120, active: 108 })
    );
    expect(dashboardApi.getAnalyticsSummary).toHaveBeenCalled();
  });

  it("computes the per-class attendance snapshot from classDistribution, not the empty roster", async () => {
    dashboardApi.getAnalyticsSummary.mockResolvedValue({
      students: { total: 50, active: 50 },
      fees: {},
      classDistribution: [
        { classId: "c1", name: "1 A", count: 30 },
        { classId: "c2", name: "2 B", count: 20 },
      ],
    });
    attendanceApi.getTodaySnapshot.mockResolvedValue({
      classes: {
        c1: { total: 30, present: 27 },
        c2: { total: 20, present: 18 },
      },
    });

    const { result } = renderHook(() => useDashboardData(EMPTY_ROSTER_PROPS));

    await waitFor(() =>
      expect(result.current.attendanceSnapshot.studentTotal).toBe(50)
    );
    const snap = result.current.attendanceSnapshot;
    expect(snap.studentPresent).toBe(45);
    expect(snap.markedClasses).toBe(2);
    expect(snap.totalClasses).toBe(2);
    // 45 / 50 = 90%
    expect(snap.studentRate).toBe(90);
  });

  it("only counts classes that actually have attendance marked", async () => {
    dashboardApi.getAnalyticsSummary.mockResolvedValue({
      students: { total: 50, active: 50 },
      fees: {},
      classDistribution: [
        { classId: "c1", name: "1 A", count: 30 },
        { classId: "c2", name: "2 B", count: 20 },
      ],
    });
    // Only c1 has been marked today.
    attendanceApi.getTodaySnapshot.mockResolvedValue({
      classes: { c1: { total: 30, present: 30 } },
    });

    const { result } = renderHook(() => useDashboardData(EMPTY_ROSTER_PROPS));

    await waitFor(() =>
      expect(result.current.attendanceSnapshot.markedClasses).toBe(1)
    );
    const snap = result.current.attendanceSnapshot;
    expect(snap.studentTotal).toBe(30);
    expect(snap.studentPresent).toBe(30);
    expect(snap.totalClasses).toBe(2); // both classes have students
    expect(snap.studentRate).toBe(100);
  });

  it("degrades gracefully (zeros, no dashboard error) when the summary call fails", async () => {
    dashboardApi.getAnalyticsSummary.mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useDashboardData(EMPTY_ROSTER_PROPS));

    await waitFor(() => expect(result.current.dashboardLoading).toBe(false));
    expect(result.current.studentStats).toEqual({ total: 0, active: 0 });
    expect(result.current.attendanceSnapshot.studentPresent).toBe(0);
    expect(result.current.attendanceSnapshot.studentRate).toBeNull();
    expect(result.current.attendanceSnapshot.totalClasses).toBe(0);
    // The summary failing must NOT surface a full-dashboard error state.
    expect(result.current.dashboardError).toBeNull();
  });
});
