/**
 * @vitest-environment jsdom
 *
 * Accessibility regression tests for the PTM (Parent-Teacher Meeting) module.
 *
 * These tests mount the PTM list and modals with realistic mocked data and run
 * axe-core via vitest-axe. They guard the fixes applied in DK-1008 (labels,
 * focus order, ARIA roles, contrast, motion) and catch regressions as the
 * module evolves.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, within, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { axe } from "vitest-axe";

vi.mock(import("react-i18next"), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key, fallback) => fallback || key,
      i18n: { language: "en" },
    }),
  };
});

vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() } }));

const mockSessions = [
  {
    _id: "ptm-001",
    title: "Term 1 PTM",
    description: "Discuss term 1 progress",
    sessionDate: "2026-06-20",
    startTime: "09:00",
    endTime: "12:00",
    slotDuration: 15,
    venue: "Main Hall",
    status: "scheduled",
    classId: { _id: "class-001", name: "10", section: "A" },
    staffId: { _id: "staff-001", name: "Ananya Sharma" },
    slots: [
      {
        _id: "slot-001",
        parentName: "Ravi Kumar",
        studentId: { _id: "student-001", name: "Aarav Kumar" },
        scheduledTime: "09:15",
        status: "booked",
        notes: "",
      },
    ],
  },
  {
    _id: "ptm-002",
    title: "Term 2 PTM",
    description: "",
    sessionDate: "2026-05-15",
    startTime: "10:00",
    endTime: "13:00",
    slotDuration: 20,
    venue: "Conference Room A",
    status: "completed",
    classId: { _id: "class-002", name: "11", section: "B" },
    staffId: { _id: "staff-002", name: "Ravi Menon" },
    slots: [],
  },
];

const mockClasses = [
  { _id: "class-001", name: "10", section: "A" },
  { _id: "class-002", name: "11", section: "B" },
];

const mockStaff = [
  { _id: "staff-001", name: "Ananya Sharma" },
  { _id: "staff-002", name: "Ravi Menon" },
];

const mockStudents = [
  { _id: "student-001", name: "Aarav Kumar", rollNo: "101" },
  { _id: "student-002", name: "Diya Patel", rollNo: "102" },
];

vi.mock("../../services/api", () => ({
  ptmApi: {
    getAll: vi.fn(() => Promise.resolve(mockSessions)),
    getById: vi.fn((id) => Promise.resolve(mockSessions.find((session) => session._id === id))),
    create: vi.fn(() => Promise.resolve({ _id: "ptm-new" })),
    update: vi.fn(() => Promise.resolve({})),
    delete: vi.fn(() => Promise.resolve({})),
    addSlot: vi.fn(() => Promise.resolve({})),
  },
  classesApi: {
    getAll: vi.fn(() => Promise.resolve(mockClasses)),
  },
  staffApi: {
    getAll: vi.fn(() => Promise.resolve(mockStaff)),
  },
  studentsApi: {
    getAll: vi.fn(() => Promise.resolve(mockStudents)),
  },
}));

import PTMPage from "./index";

function setupPageRoot() {
  const existing = document.getElementById("root");
  if (existing) return existing;
  const root = document.createElement("div");
  root.id = "root";
  document.body.appendChild(root);
  return root;
}

function renderInPageRoot(ui) {
  setupPageRoot();
  return render(ui, { container: document.getElementById("root") });
}

describe("PTM module accessibility", () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });


  it("has no detectable axe violations on the list view", async () => {
    const { container } = renderInPageRoot(
      <MemoryRouter initialEntries={["/ptm"]}>
        <PTMPage />
      </MemoryRouter>
    );

    await within(container).findByRole("heading", { name: "Term 1 PTM" });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders the status filter as a tablist with labelled tabs", async () => {
    const { container } = renderInPageRoot(
      <MemoryRouter initialEntries={["/ptm"]}>
        <PTMPage />
      </MemoryRouter>
    );

    await within(container).findByRole("heading", { name: "Term 1 PTM" });

    const tablist = within(container).getByRole("tablist", { name: "Filter by status" });
    expect(tablist).toBeTruthy();
    const tabs = within(tablist).getAllByRole("tab");
    expect(tabs.length).toBe(5);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
  });

  it("exposes each session card action button with an accessible name", async () => {
    const { container } = renderInPageRoot(
      <MemoryRouter initialEntries={["/ptm"]}>
        <PTMPage />
      </MemoryRouter>
    );

    await within(container).findByRole("heading", { name: "Term 1 PTM" });

    const viewBtn = within(container).getAllByRole("button", { name: "View session details" });
    expect(viewBtn.length).toBe(2);
    const cancelBtn = within(container).getAllByRole("button", { name: "Cancel session" });
    expect(cancelBtn.length).toBe(2);
  });

  it("has no detectable axe violations when the create modal is open", async () => {
    const { container } = renderInPageRoot(
      <MemoryRouter initialEntries={["/ptm"]}>
        <PTMPage />
      </MemoryRouter>
    );

    await within(container).findByRole("heading", { name: "Term 1 PTM" });
    const createBtn = within(container).getByRole("button", { name: "New PTM Session" });
    fireEvent.click(createBtn);

    const dialog = await screen.findByRole("dialog", { name: "New PTM Session" });
    expect(dialog).toBeTruthy();
    expect(dialog).toHaveAttribute("aria-describedby");

    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });

  it("has no detectable axe violations when the detail modal is open", async () => {
    const { container } = renderInPageRoot(
      <MemoryRouter initialEntries={["/ptm"]}>
        <PTMPage />
      </MemoryRouter>
    );

    await within(container).findByRole("heading", { name: "Term 1 PTM" });
    const viewBtn = within(container).getAllByRole("button", { name: "View session details" });
    fireEvent.click(viewBtn[0]);

    const dialog = await screen.findByRole("dialog", { name: "Term 1 PTM" });
    expect(dialog).toBeTruthy();

    const statusBtn = within(dialog).getByRole("button", { name: "Change session status to ongoing" });
    expect(statusBtn).toBeTruthy();

    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
});
