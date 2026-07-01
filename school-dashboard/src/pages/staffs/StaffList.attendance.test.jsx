/**
 * @vitest-environment jsdom
 *
 * Regression test for STUB-02 (SCH-45): the single-staff "Mark attendance"
 * action used to fake success with a toast and never persist anything. The
 * redesign's StaffList wires the per-row "Mark present" button directly to
 * the real `staffAttendanceApi.markBulk(...)` endpoint — no status picker
 * (leave/absent from the list is a follow-up), but the core regression
 * (persisting via the real API instead of faking success) is covered here.
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

// Keep the DataGrid out of the equation — we only need to assert the wire-up.
// Expose the row's mark-present handler via a stable label so the test can fire it.
vi.mock("./StaffDataGrid", () => ({
  default: function MockDataGrid({ onMarkPresent, staff }) {
    return (
      <div data-testid="staff-grid">
        {staff.map((s) => (
          <button key={s._id} type="button" onClick={() => onMarkPresent(s)}>
            mark-present-{s.name}
          </button>
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
  it("persists today's 'present' status via the real API instead of faking success", async () => {
    renderList();

    fireEvent.click(screen.getByText("mark-present-Ananya"));

    expect(markBulk.markBulk).toHaveBeenCalledTimes(1);
    const payload = markBulk.markBulk.mock.calls[0][0];
    expect(payload.staffIds).toEqual(["staff-001"]);
    expect(payload.status).toBe("present");
    expect(payload.date).toBe(today);
  });
});
