/**
 * @vitest-environment jsdom
 *
 * Regression test for STUB-02 (SCH-45): the single-staff "Mark attendance"
 * action used to fake success with a toast and never persist anything. The
 * redesign's StaffList now offers a status picker (Present / On leave / Absent)
 * in the row kebab menu, each wired to the real `staffAttendanceApi.markBulk`
 * endpoint with the chosen status — no faking, no hardcoded "present".
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const markBulk = vi.hoisted(() => ({
  markBulk: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("../../context/AppContext", () => ({
  useApp: () => ({
    staff: [
      { _id: "staff-001", id: "staff-001", name: "Ananya", role: ["Teacher"], status: "active" },
    ],
    staffAttendance: {},
    loading: false,
    addStaff: vi.fn(),
  }),
}));

vi.mock("../../services/api", () => ({
  staffAttendanceApi: { markBulk: markBulk.markBulk },
}));

// Expose each status picker button via a stable label so the test can fire it.
vi.mock("./StaffDataGrid", () => ({
  default: function MockDataGrid({ onMarkAttendance, staff }) {
    return (
      <div data-testid="staff-grid">
        {staff.map((s) => (
          <div key={s._id} data-testid={`row-${s._id}`}>
            <button type="button" onClick={() => onMarkAttendance(s, "present")}>
              mark-present-{s.name}
            </button>
            <button type="button" onClick={() => onMarkAttendance(s, "leave")}>
              mark-leave-{s.name}
            </button>
            <button type="button" onClick={() => onMarkAttendance(s, "absent")}>
              mark-absent-{s.name}
            </button>
          </div>
        ))}
      </div>
    );
  },
}));

vi.mock("./CreateStaffComposer", () => ({
  default: () => null,
}));

import StaffList from "./StaffList";

const today = new Date().toISOString().slice(0, 10);

function renderList() {
  return render(
    <MemoryRouter>
      <StaffList onStaffClick={vi.fn()} onAddStaff={vi.fn()} />
    </MemoryRouter>
  );
}

beforeEach(() => markBulk.markBulk.mockClear());
afterEach(cleanup);

describe("StaffList — single-staff mark attendance (STUB-02)", () => {
  it("persists 'present' via the real API instead of faking success", async () => {
    renderList();

    fireEvent.click(screen.getByText("mark-present-Ananya"));

    expect(markBulk.markBulk).toHaveBeenCalledTimes(1);
    const payload = markBulk.markBulk.mock.calls[0][0];
    expect(payload.staffIds).toEqual(["staff-001"]);
    expect(payload.status).toBe("present");
    expect(payload.date).toBe(today);
  });

  it("persists 'leave' via the real API", async () => {
    renderList();

    fireEvent.click(screen.getByText("mark-leave-Ananya"));

    expect(markBulk.markBulk).toHaveBeenCalledTimes(1);
    const payload = markBulk.markBulk.mock.calls[0][0];
    expect(payload.staffIds).toEqual(["staff-001"]);
    expect(payload.status).toBe("leave");
    expect(payload.date).toBe(today);
  });

  it("persists 'absent' via the real API", async () => {
    renderList();

    fireEvent.click(screen.getByText("mark-absent-Ananya"));

    expect(markBulk.markBulk).toHaveBeenCalledTimes(1);
    const payload = markBulk.markBulk.mock.calls[0][0];
    expect(payload.staffIds).toEqual(["staff-001"]);
    expect(payload.status).toBe("absent");
    expect(payload.date).toBe(today);
  });
});
