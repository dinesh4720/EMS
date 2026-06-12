/**
 * @vitest-environment jsdom
 *
 * Regression tests for the staff list page.
 *
 * StaffList previously crashed on every render with
 *   "ReferenceError: Cannot access 'paginatedVisible' before initialization"
 * because `moveSelection` (a useCallback near the top of the component) read
 * `paginatedVisible` in its body and dependency array, while the
 * `paginatedVisible` useMemo was declared ~115 lines lower. A useCallback's
 * dependency array is evaluated eagerly during render, so reading the
 * not-yet-initialized `const` hit the temporal dead zone and threw — which
 * React surfaced as the global "Something went wrong / Try again" boundary.
 *
 * This test mounts the component with empty data and asserts it renders the
 * empty state instead of throwing. The crash happens at the top of render,
 * independent of any fetched data, so empty context is enough to reproduce it.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mutable app context so each test can provide its own staff payload.
vi.mock("../../context/AppContext", () => {
  const mockUseApp = vi.fn(() => ({ staff: [], staffAttendance: {}, loading: false }));
  return { useApp: mockUseApp };
});

// Stub the page chrome so the test focuses on StaffList's own render body.
// Rendering `children` lets the empty-state inside the list area show through;
// the toolbar/actions props (which hold heavier components) are intentionally
// not rendered.
vi.mock("../../components/ui", () => ({
  PageShell: ({ title, children }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

// Closed modal — render nothing to avoid portal noise in jsdom.
vi.mock("../../components/ui/PrintPreviewModal", () => ({ default: () => null }));

// Render a minimal row so tests can assert on which staff made it through
// the search/filter pipeline without exercising PhotoAvatar, badges, etc.
vi.mock("./StaffListRow", () => ({
  default: function MockStaffListRow({ staff }) {
    return (
      <div data-testid="staff-row">
        {staff.name} /{" "}
        {Array.isArray(staff.role) ? staff.role.join(", ") : staff.role || "—"}
      </div>
    );
  },
}));

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

afterEach(cleanup);

describe("StaffList", () => {
  it("renders the empty state without throwing (TDZ regression)", () => {
    expect(() => renderWithQuery(null)).not.toThrow();

    // The page shell title and the empty-state copy both render.
    expect(screen.getByText("Staff")).toBeTruthy();
    expect(screen.getByText("No staff yet")).toBeTruthy();
  });

  it("searches by role when role is an array (DK-891 regression)", () => {
    useApp.mockReturnValue({ staff: STAFF_FIXTURE, staffAttendance: {}, loading: false });
    renderWithQuery("teacher");

    const rows = screen.getAllByTestId("staff-row");
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain("Alice");
  });

  it("still searches by role when role is a string", () => {
    useApp.mockReturnValue({ staff: STAFF_FIXTURE, staffAttendance: {}, loading: false });
    renderWithQuery("admin");

    expect(screen.getByText("Bob / Admin")).toBeTruthy();
    expect(screen.queryByText("Alice / Math Teacher")).toBeNull();
  });

  it("does not throw when role is undefined", () => {
    useApp.mockReturnValue({ staff: STAFF_FIXTURE, staffAttendance: {}, loading: false });
    expect(() => renderWithQuery("carol")).not.toThrow();
    expect(screen.getByText(/Carol/)).toBeTruthy();
  });

  it("shows all staff when no search query is provided", () => {
    useApp.mockReturnValue({ staff: STAFF_FIXTURE, staffAttendance: {}, loading: false });
    renderWithQuery(null);

    expect(screen.getByText("Alice / Math Teacher")).toBeTruthy();
    expect(screen.getByText("Bob / Admin")).toBeTruthy();
    expect(screen.getByText(/Carol/)).toBeTruthy();
  });
});
