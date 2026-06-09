/**
 * @vitest-environment jsdom
 *
 * Regression test for the staff list page.
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
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Empty, non-loading app context — enough to exercise the full render path.
vi.mock("../../context/AppContext", () => ({
  useApp: () => ({ staff: [], staffAttendance: {}, loading: false }),
}));

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

// API is only touched by event handlers, never during render.
vi.mock("../../services/api", () => ({
  staffAttendanceApi: { markBulk: vi.fn() },
}));

import StaffList from "./StaffList";

describe("StaffList", () => {
  it("renders the empty state without throwing (TDZ regression)", () => {
    expect(() =>
      render(
        <MemoryRouter initialEntries={["/staffs"]}>
          <StaffList onStaffClick={vi.fn()} onAddStaff={vi.fn()} />
        </MemoryRouter>
      )
    ).not.toThrow();

    // The page shell title and the empty-state copy both render.
    expect(screen.getByText("Staff")).toBeTruthy();
    expect(screen.getByText("No staff yet")).toBeTruthy();
  });
});
