/**
 * @vitest-environment jsdom
 *
 * Unit test for the AttendancePanel "Full log →" link (NAV-04 / SCH-22).
 *
 * The dashboard audit flagged that this link pointed at
 * `/students/:id/attendance` — a 3-segment path the students router does
 * not recognize — so clicks fell through to StudentsList instead of
 * opening the attendance roster. The fix routes to the registered
 * `/students/attendance` route, carrying the student id as a query
 * parameter. This test pins the corrected href so the regression cannot
 * silently return.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Heavy sibling components are irrelevant to the link assertion — stub them
// so the test stays focused on AttendancePanel's own markup.
vi.mock("../../../../components/students/AttendanceHeatmap", () => ({
  default: () => <div data-testid="attendance-heatmap" />,
}));
vi.mock("../../../../components/ui/EmptyState", () => ({
  default: (props) => <div data-testid="empty-state">{props.title}</div>,
}));
vi.mock("../../../../components/ui/ErrorState", () => ({
  default: () => <div data-testid="error-state" />,
}));

import AttendancePanel from "./AttendancePanel";

function renderPanel(props) {
  return render(
    <MemoryRouter>
      <AttendancePanel {...props} />
    </MemoryRouter>
  );
}

describe("AttendancePanel — Full log link (NAV-04)", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("links to /students/attendance?student=:id (registered 2-segment route)", () => {
    const STUDENT_ID = "64b100000000000000000201";
    renderPanel({
      studentId: STUDENT_ID,
      attendanceData: [],
      attendanceStats: { percentage: 92, present: 23, absent: 2 },
      loading: false,
      error: null,
      refetch: () => {},
    });

    const fullLogLink = screen.getByRole("link", { name: /Full log/i });
    expect(fullLogLink).toBeTruthy();
    expect(fullLogLink.getAttribute("href")).toBe(
      `/students/attendance?student=${STUDENT_ID}`
    );
  });

  it("does NOT link to the unregistered 3-segment /students/:id/attendance path", () => {
    const STUDENT_ID = "64b100000000000000000201";
    renderPanel({
      studentId: STUDENT_ID,
      attendanceData: [],
      attendanceStats: null,
      loading: false,
      error: null,
      refetch: () => {},
    });

    const fullLogLink = screen.getByRole("link", { name: /Full log/i });
    // The pre-fix href was `/students/${studentId}/attendance` — assert it
    // is gone so a future edit cannot reintroduce the dead route.
    expect(fullLogLink.getAttribute("href")).not.toContain(
      `/students/${STUDENT_ID}/attendance`
    );
    expect(fullLogLink.getAttribute("href")).not.toMatch(
      /^\/students\/[^?]+\/attendance$/
    );
  });
});
