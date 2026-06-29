/**
 * @vitest-environment jsdom
 *
 * Accessibility regression tests for the Staffs list page.
 *
 * These tests mount StaffList with realistic mocked data and run axe-core
 * via vitest-axe. They guard the fixes applied in DK-1011 (labels, focus
 * order, ARIA roles, contrast, motion) and catch regressions as the module
 * evolves.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
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
  staffApi: { list: vi.fn().mockResolvedValue({ data: [], pagination: {}, facets: {} }) },
}));

// SCH-193: page reads rows from the server-driven useStaffList hook.
vi.mock("./hooks/useStaffList", () => ({
  useStaffList: () => ({
    data: [
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
    pagination: { page: 1, limit: 25, total: 2, totalPages: 1 },
    facets: {
      role: [{ value: "Teacher", count: 2 }, { value: "Admin", count: 1 }],
      department: [{ value: "Science", count: 1 }, { value: "Mathematics", count: 1 }],
      employmentType: [{ value: "Full-time", count: 2 }],
      gender: [{ value: "Female", count: 1 }, { value: "Male", count: 1 }],
    },
    loading: false,
    error: null,
    clampedPage: 1,
    reload: vi.fn(),
  }),
}));

import StaffList from "./StaffList";

function getFirstByRole(role, options) {
  const elements = screen.getAllByRole(role, options);
  expect(elements.length).toBeGreaterThanOrEqual(1);
  return elements[0];
}

describe("StaffList accessibility", () => {
  it("has no detectable axe violations with populated data", async () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/staffs"]}>
        <StaffList onStaffClick={vi.fn()} onAddStaff={vi.fn()} />
      </MemoryRouter>
    );

    // The list should render the mocked staff.
    expect(screen.getByText("Ananya Sharma")).toBeTruthy();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("exposes the staff list as a labelled list", () => {
    render(
      <MemoryRouter initialEntries={["/staffs"]}>
        <StaffList onStaffClick={vi.fn()} onAddStaff={vi.fn()} />
      </MemoryRouter>
    );

    const list = getFirstByRole("list", { name: "Staff list" });
    expect(list).toBeTruthy();
  });

  it("renders each staff member as a listitem with a labelled selection toggle", () => {
    render(
      <MemoryRouter initialEntries={["/staffs"]}>
        <StaffList onStaffClick={vi.fn()} onAddStaff={vi.fn()} />
      </MemoryRouter>
    );

    const list = getFirstByRole("list", { name: "Staff list" });
    const items = within(list).getAllByRole("listitem");
    expect(items.length).toBeGreaterThanOrEqual(2);
    items.forEach((item) => {
      const toggle = within(item).getByRole("button", { pressed: false });
      expect(toggle).toHaveAttribute("aria-label", expect.stringContaining("Select "));
    });
  });

  it("renders the filter tabs with proper tablist semantics", () => {
    render(
      <MemoryRouter initialEntries={["/staffs"]}>
        <StaffList onStaffClick={vi.fn()} onAddStaff={vi.fn()} />
      </MemoryRouter>
    );

    const tablist = getFirstByRole("tablist", { name: "Filter staff" });
    expect(tablist).toBeTruthy();
    expect(within(tablist).getAllByRole("tab").length).toBeGreaterThanOrEqual(3);
  });
});
