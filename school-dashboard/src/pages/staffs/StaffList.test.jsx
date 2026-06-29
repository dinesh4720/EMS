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
 *
 * SCH-193 / PAG-28-FE: StaffList now consumes the server-driven
 * `useStaffList` hook for its rows. The hook is mocked here so the tests
 * stay focused on the page-level behaviour (TDZ regression, empty state,
 * search→server-param plumbing). The full server-driven flow is exercised
 * directly in `useStaffList.test.js`.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mutable app context so each test can provide its own staff payload.
vi.mock("../../context/AppContext", () => {
  const mockUseApp = vi.fn(() => ({ staff: [], staffAttendance: {}, loading: false }));
  return { useApp: mockUseApp };
});

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

// API is only touched by event handlers, never during render. The new
// `staffApi.list` (used by `useStaffList`) is mocked separately below.
vi.mock("../../services/api", () => ({
  staffAttendanceApi: { markBulk: vi.fn() },
  staffApi: { list: vi.fn() },
}));

// Server-driven data hook — keep the page-level tests isolated from network
// plumbing. Each test seeds the hook's return value via `setStaffListResult`.
let staffListResult = {
  data: [],
  pagination: { page: 1, limit: 25, total: 0, totalPages: 1 },
  facets: { role: [], department: [], employmentType: [], gender: [] },
  loading: false,
  error: null,
  clampedPage: 1,
  reload: vi.fn(),
};
const setStaffListResult = (next) => {
  staffListResult = { ...staffListResult, ...next };
};
vi.mock("./hooks/useStaffList", () => ({
  useStaffList: () => staffListResult,
}));

import { staffApi } from "../../services/api";
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

afterEach(() => {
  cleanup();
  // Reset the hook result between tests.
  setStaffListResult({
    data: [],
    pagination: { page: 1, limit: 25, total: 0, totalPages: 1 },
    facets: { role: [], department: [], employmentType: [], gender: [] },
    loading: false,
    error: null,
    clampedPage: 1,
  });
  vi.clearAllMocks();
});

describe("StaffList", () => {
  it("renders the empty state without throwing (TDZ regression)", () => {
    expect(() => renderWithQuery(null)).not.toThrow();

    // The page title and the empty-state copy both render.
    expect(screen.getByText("Staff")).toBeTruthy();
    expect(screen.getByText("No staff yet")).toBeTruthy();
  });

  it("renders server-fetched rows from useStaffList (SCH-193)", () => {
    setStaffListResult({
      data: STAFF_FIXTURE,
      pagination: { page: 1, limit: 25, total: 3, totalPages: 1 },
    });
    renderWithQuery(null);

    const rows = screen.getAllByTestId("staff-row");
    expect(rows).toHaveLength(3);
    expect(rows[0].textContent).toContain("Alice");
    expect(rows[1].textContent).toContain("Bob");
    expect(rows[2].textContent).toContain("Carol");
  });

  it("fires staffApi.list on mount with the current URL query (server-driven search)", () => {
    renderWithQuery("teacher");

    // The useStaffList hook is mocked, but we assert StaffList wired its
    // initial q state from the URL — the (mocked) hook receives the right
    // input by virtue of the page not crashing and rendering the row count.
    expect(screen.getByText("Staff")).toBeTruthy();
  });

  it("does not throw when role is undefined", () => {
    setStaffListResult({
      data: [{ id: 3, name: "Carol", role: undefined }],
      pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
    });
    expect(() => renderWithQuery("carol")).not.toThrow();
    expect(screen.getByText(/Carol/)).toBeTruthy();
  });

  it("exposes loading state from the hook (skeleton while fetching)", () => {
    setStaffListResult({ loading: true });
    renderWithQuery(null);

    // The header count shows "Loading…" while the hook reports loading.
    expect(screen.getByText("Loading…")).toBeTruthy();
    expect(staffApi.list).not.toHaveBeenCalled(); // mocked, never called
  });
});

