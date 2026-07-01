/**
 * @vitest-environment jsdom
 *
 * Accessibility regression tests for the Staffs list page.
 *
 * StaffList renders the <StaffDataGrid/> data grid — a semantic <table> labelled
 * "Staff list", with a labelled tablist for the status filters and a "Select X"
 * checkbox on every row. These tests mount it with realistic mocked data, assert
 * that accessible structure, and run axe-core via vitest-axe to catch a11y
 * regressions as the module evolves (originally DK-1011).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { axe } from "vitest-axe";

vi.mock("../../context/AppContext", () => ({
  useApp: () => ({
    staff: [
      {
        _id: "staff-001",
        id: "staff-001",
        name: "Ananya Sharma",
        staffNumber: "EMP001",
        role: ["Teacher"],
        department: "Science",
        employmentType: "Full-time",
        gender: "Female",
        status: "active",
        email: "ananya@schoolsync.test",
        phone: "9876543210",
      },
      {
        _id: "staff-002",
        id: "staff-002",
        name: "Ravi Menon",
        staffNumber: "EMP002",
        role: ["Teacher", "Admin"],
        department: "Mathematics",
        employmentType: "Full-time",
        gender: "Male",
        status: "active",
        email: "ravi@schoolsync.test",
        phone: "9876543211",
      },
    ],
    staffAttendance: {},
    loading: false,
  }),
}));

vi.mock("../../components/ui/PrintPreviewModal", () => ({ default: () => null }));

vi.mock("../../services/api", () => ({
  staffAttendanceApi: { markBulk: vi.fn() },
}));

import StaffList from "./StaffList";

function renderStaffList() {
  return render(
    <MemoryRouter initialEntries={["/staffs"]}>
      <StaffList onStaffClick={vi.fn()} onAddStaff={vi.fn()} />
    </MemoryRouter>
  );
}

afterEach(cleanup);

describe("StaffList accessibility", () => {
  it("has no detectable axe violations with populated data", async () => {
    const { container } = renderStaffList();

    // The grid should render the mocked staff.
    expect(screen.getByText("Ananya Sharma")).toBeTruthy();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("exposes the staff grid as a labelled table", () => {
    renderStaffList();
    const table = screen.getByRole("table", { name: "Staff list" });
    expect(table).toBeTruthy();
  });

  it("gives every staff row a labelled selection checkbox", () => {
    renderStaffList();
    const selectToggles = screen
      .getAllByRole("checkbox")
      .filter((el) => (el.getAttribute("aria-label") || "").startsWith("Select "));
    // one "Select all staff" header toggle + one per staff member (2 in fixture)
    expect(selectToggles.length).toBeGreaterThanOrEqual(3);
    expect(screen.getByLabelText("Select Ananya Sharma")).toBeTruthy();
    expect(screen.getByLabelText("Select Ravi Menon")).toBeTruthy();
  });

  it("renders the status filters as a labelled tablist", () => {
    renderStaffList();
    const tablist = screen.getByRole("tablist", { name: "Filter staff" });
    expect(tablist).toBeTruthy();
    expect(within(tablist).getAllByRole("tab").length).toBeGreaterThanOrEqual(3);
  });
});
