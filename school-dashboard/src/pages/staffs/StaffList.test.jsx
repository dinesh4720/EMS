/**
 * @vitest-environment jsdom
 *
 * Regression tests for the staff list page's search + filter pipeline.
 *
 * StaffList delegates all rendering to <StaffDataGrid/>; these tests mock that
 * grid and assert on the already-filtered `staff` prop it receives. That keeps
 * the tests focused on StaffList's own responsibility (search / role / tab
 * filtering via `searchMatch` + `useStaffFilters`) without coupling to the
 * grid's internal markup.
 *
 * Covers the DK-891 regression: role search must work whether `role` is an
 * array (`["Math Teacher"]`) or a string (`"Admin"`), and must not throw when
 * `role` is undefined. Also guards the historical TDZ crash by mounting with
 * empty data and asserting no throw.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mutable app context so each test can provide its own staff payload.
vi.mock("../../context/AppContext", () => {
  const mockUseApp = vi.fn(() => ({ staff: [], staffAttendance: {}, loading: false }));
  return { useApp: mockUseApp };
});

// Capture the props StaffList passes down to the grid (the filtered roster).
let gridProps;
vi.mock("./StaffDataGrid", () => ({
  default: function MockStaffDataGrid(props) {
    gridProps = props;
    return <div data-testid="staff-grid">{props.staff.length}</div>;
  },
}));

// The create-staff composer is irrelevant to the filter pipeline.
vi.mock("./CreateStaffComposer", () => ({ default: () => null }));

// API is only touched by event handlers, never during render.
vi.mock("../../services/api", () => ({
  staffAttendanceApi: { markBulk: vi.fn() },
}));

import { useApp } from "../../context/AppContext";
import StaffList from "./StaffList";

const STAFF_FIXTURE = [
  { id: 1, name: "Alice", role: ["Math Teacher"] },
  { id: 2, name: "Bob", role: "Admin" },
  { id: 3, name: "Carol", role: undefined },
];

function renderWithQuery(query) {
  const initialEntries = query ? [`/staffs?q=${encodeURIComponent(query)}`] : ["/staffs"];
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <StaffList onStaffClick={vi.fn()} onAddStaff={vi.fn()} />
    </MemoryRouter>
  );
}

const visibleNames = () => gridProps.staff.map((s) => s.name);

beforeEach(() => {
  gridProps = undefined;
  sessionStorage.clear(); // useStaffFilters persists pill filters here
});
afterEach(cleanup);

describe("StaffList search + filter pipeline", () => {
  it("renders without throwing on empty data and passes an empty roster down (TDZ regression)", () => {
    useApp.mockReturnValue({ staff: [], staffAttendance: {}, loading: false });
    expect(() => renderWithQuery(null)).not.toThrow();
    expect(gridProps.staff).toEqual([]);
    expect(gridProps.totalMembers).toBe(0);
  });

  it("searches by role when role is an array (DK-891 regression)", () => {
    useApp.mockReturnValue({ staff: STAFF_FIXTURE, staffAttendance: {}, loading: false });
    renderWithQuery("teacher");
    expect(visibleNames()).toEqual(["Alice"]);
  });

  it("still searches by role when role is a string", () => {
    useApp.mockReturnValue({ staff: STAFF_FIXTURE, staffAttendance: {}, loading: false });
    renderWithQuery("admin");
    expect(visibleNames()).toEqual(["Bob"]);
  });

  it("does not throw when role is undefined", () => {
    useApp.mockReturnValue({ staff: STAFF_FIXTURE, staffAttendance: {}, loading: false });
    expect(() => renderWithQuery("carol")).not.toThrow();
    expect(visibleNames()).toEqual(["Carol"]);
  });

  it("shows all staff when no search query is provided", () => {
    useApp.mockReturnValue({ staff: STAFF_FIXTURE, staffAttendance: {}, loading: false });
    renderWithQuery(null);
    expect(visibleNames()).toEqual(["Alice", "Bob", "Carol"]);
  });
});
