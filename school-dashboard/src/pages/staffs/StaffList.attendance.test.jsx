/**
 * @vitest-environment jsdom
 *
 * Regression test for STUB-02 (SCH-45): the single-staff "Mark attendance"
 * action used to fake success with a toast and never persist anything. It now
 * opens a status picker in the detail pane and records the chosen status via
 * the shared optimistic `markStaffAttendance` flow.
 *
 * The picker UI itself lives in StaffDetailPane; here we mock that pane down to
 * raw status buttons and assert StaffList wires the chosen status through to
 * `markStaffAttendance(id, today, status, checkIn)`.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const { markStaffAttendance } = vi.hoisted(() => ({
  markStaffAttendance: vi.fn(),
}));

vi.mock("../../context/AppContext", () => ({
  useApp: () => ({
    staff: [
      { _id: "staff-001", id: "staff-001", name: "Ananya", role: ["Teacher"] },
    ],
    staffAttendance: {},
    loading: false,
    markStaffAttendance,
  }),
}));

// Reduce the detail pane to the status buttons under test.
vi.mock("./StaffDetailPane", () => ({
  default: function MockDetailPane({ staff, onMarkAttendance }) {
    if (!staff) return null;
    return (
      <div data-testid="detail-pane">
        <button type="button" onClick={() => onMarkAttendance("present")}>
          pick-present
        </button>
        <button type="button" onClick={() => onMarkAttendance("leave")}>
          pick-leave
        </button>
      </div>
    );
  },
}));

vi.mock("./StaffListRow", () => ({
  default: function MockRow({ staff }) {
    return <div data-testid="staff-row">{staff.name}</div>;
  },
}));

vi.mock("../../components/ui/PrintPreviewModal", () => ({ default: () => null }));

vi.mock("../../services/api", () => ({
  staffAttendanceApi: { markBulk: vi.fn() },
  staffApi: { list: vi.fn().mockResolvedValue({ data: [], pagination: {}, facets: {} }) },
}));

// SCH-193: the page consumes the server-driven `useStaffList` hook for rows;
// provide a deterministic page for the attendance test so the detail pane
// appears when the URL selects staff-001.
vi.mock("./hooks/useStaffList", () => ({
  useStaffList: () => ({
    data: [
      { _id: "staff-001", id: "staff-001", name: "Ananya", role: ["Teacher"] },
    ],
    pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
    facets: { role: [], department: [], employmentType: [], gender: [] },
    loading: false,
    error: null,
    clampedPage: 1,
    reload: vi.fn(),
  }),
}));

import StaffList from "./StaffList";

const today = new Date().toISOString().slice(0, 10);

function renderSelected() {
  return render(
    <MemoryRouter initialEntries={["/staffs?id=staff-001"]}>
      <StaffList onStaffClick={vi.fn()} onAddStaff={vi.fn()} />
    </MemoryRouter>
  );
}

beforeEach(() => markStaffAttendance.mockClear());
afterEach(cleanup);

describe("StaffList — single-staff mark attendance (STUB-02)", () => {
  it("records the picked status for today instead of faking success", () => {
    renderSelected();

    fireEvent.click(screen.getByText("pick-present"));

    expect(markStaffAttendance).toHaveBeenCalledTimes(1);
    const [id, date, status, checkIn] = markStaffAttendance.mock.calls[0];
    expect(id).toBe("staff-001");
    expect(date).toBe(today);
    expect(status).toBe("present");
    // "present" stamps a real HH:MM check-in time, never a placeholder.
    expect(checkIn).toMatch(/^\d{2}:\d{2}$/);
  });

  it("uses a placeholder check-in for non-present statuses", () => {
    renderSelected();

    fireEvent.click(screen.getByText("pick-leave"));

    expect(markStaffAttendance).toHaveBeenCalledWith(
      "staff-001",
      today,
      "leave",
      "-"
    );
  });
});
