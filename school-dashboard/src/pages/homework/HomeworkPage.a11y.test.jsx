/**
 * @vitest-environment jsdom
 *
 * Accessibility regression tests for the Homework module.
 *
 * These tests mount the Homework list and modals with realistic mocked data and
 * run axe-core via vitest-axe. They guard the fixes applied in DK-1002 (labels,
 * focus order, ARIA roles, contrast, motion) and catch regressions as the module
 * evolves.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, within, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { axe } from "vitest-axe";

const TRANSLATIONS = {
  "pages.homework": "Homework",
  "pages.total2": "Total",
  "pages.active": "Active",
  "pages.completed": "Completed",
  "pages.overdue1": "Overdue",
  "pages.viewDetails1": "View details",
  "pages.delete1": "Delete homework",
  "pages.title1": "Title",
  "pages.subject2": "Subject",
  "pages.class1": "Class",
  "pages.dueDate": "Due Date",
  "pages.description1": "Description",
  "pages.notifyParentsAboutThisHomework": "Notify parents about this homework",
  "pages.createHomework": "Create Homework",
  "pages.assignNewHomeworkToStudents": "Assign new homework to students",
  "homework.titlePlaceholder": "Enter homework title",
  "homework.totalMarksPlaceholder": "Enter total marks",
  "homework.fileNamePlaceholder": "File name",
  "homework.urlPlaceholder": "URL",
  "toast.error.failedToLoadHomework": "Failed to load homework",
  "toast.error.failedToLoadFormData": "Failed to load form data",
  "toast.error.pleaseFixTheErrorsInTheForm": "Please fix the errors in the form",
  "toast.success.homeworkCreatedSuccessfully": "Homework created successfully",
  "toast.success.homeworkUpdatedSuccessfully": "Homework updated successfully",
  "toast.success.homeworkDeletedSuccessfully": "Homework deleted successfully",
  "toast.error.failedToDeleteHomework": "Failed to delete homework",
};

vi.mock(import("react-i18next"), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key, fallback) => {
        if (TRANSLATIONS[key] !== undefined) return TRANSLATIONS[key];
        return typeof fallback === "string" ? fallback : key;
      },
      i18n: { language: "en" },
    }),
  };
});

vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() } }));

const mockClass10A = { _id: "class-001", name: "10", section: "A" };
const mockClass11A = { _id: "class-002", name: "11", section: "A" };
const mockStudent = { _id: "stu-001", name: "Aarav Kumar", rollNo: "101" };

const activeHomework = {
  _id: "hw-001",
  title: "Algebra Practice",
  description: "Solve exercises 1-10 from chapter 3",
  subject: "Mathematics",
  classId: mockClass10A,
  dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  totalMarks: 100,
  status: "active",
  submissions: [],
};

const completedHomework = {
  _id: "hw-002",
  title: "Essay Writing",
  description: "Write a 500-word essay on environmental conservation",
  subject: "English",
  classId: mockClass10A,
  dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  totalMarks: 100,
  status: "completed",
  submissions: [
    {
      _id: "sub-001",
      studentId: mockStudent,
      submittedAt: new Date().toISOString(),
      marks: 85,
      feedback: "Good work",
    },
  ],
};

const mockHomework = [activeHomework, completedHomework];
const mockClasses = [mockClass10A, mockClass11A];
const mockSubjects = [{ _id: "sub-001", name: "Mathematics" }, { _id: "sub-002", name: "English" }];

vi.mock("../../services/api", () => ({
  homeworkApi: {
    getAll: vi.fn(() => Promise.resolve(mockHomework)),
    create: vi.fn(() => Promise.resolve({ _id: "hw-new" })),
    update: vi.fn(() => Promise.resolve({})),
    delete: vi.fn(() => Promise.resolve({})),
  },
  classesApi: {
    getPublic: vi.fn(() => Promise.resolve(mockClasses)),
    getAll: vi.fn(() => Promise.resolve(mockClasses)),
  },
  subjectsApi: {
    getAll: vi.fn(() => Promise.resolve(mockSubjects)),
  },
  request: vi.fn((path) => {
    const id = path.replace("/homework/", "").split("/")[0];
    const found = mockHomework.find((hw) => hw._id === id);
    return Promise.resolve(found || null);
  }),
}));

import HomeworkPage from "./index";

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

describe("Homework module accessibility", () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("has no detectable axe violations on the list view", async () => {
    const { container } = renderInPageRoot(
      <MemoryRouter initialEntries={["/homework"]}>
        <HomeworkPage />
      </MemoryRouter>
    );

    await within(container).findByRole("heading", { name: "Algebra Practice" });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("exposes each homework card action button with an accessible name", async () => {
    const { container } = renderInPageRoot(
      <MemoryRouter initialEntries={["/homework"]}>
        <HomeworkPage />
      </MemoryRouter>
    );

    await within(container).findByRole("heading", { name: "Algebra Practice" });

    const viewButtons = within(container).getAllByRole("button", { name: "View details" });
    expect(viewButtons.length).toBeGreaterThanOrEqual(1);
    const editButtons = within(container).getAllByRole("button", { name: /Edit homework/i });
    expect(editButtons.length).toBeGreaterThanOrEqual(1);
    const deleteButtons = within(container).getAllByRole("button", { name: "Delete homework" });
    expect(deleteButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("has no detectable axe violations when the create modal is open", async () => {
    const { container } = renderInPageRoot(
      <MemoryRouter initialEntries={["/homework"]}>
        <HomeworkPage />
      </MemoryRouter>
    );

    await within(container).findByRole("heading", { name: "Algebra Practice" });
    const createBtn = within(container).getByRole("button", { name: /Create Homework/i });
    fireEvent.click(createBtn);

    const dialog = await screen.findByRole("dialog", { name: "Create Homework" });
    expect(dialog).toBeTruthy();
    expect(dialog).toHaveAttribute("aria-describedby");

    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });

  it("has no detectable axe violations in the create modal with attachments", async () => {
    const { container } = renderInPageRoot(
      <MemoryRouter initialEntries={["/homework"]}>
        <HomeworkPage />
      </MemoryRouter>
    );

    await within(container).findByRole("heading", { name: "Algebra Practice" });
    const createBtn = within(container).getByRole("button", { name: /Create Homework/i });
    fireEvent.click(createBtn);

    const dialog = await screen.findByRole("dialog", { name: "Create Homework" });
    const addAttachmentBtn = within(dialog).getByRole("button", { name: /Add Attachment/i });
    fireEvent.click(addAttachmentBtn);

    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });

  it("has no detectable axe violations when the detail modal is open", async () => {
    const { container } = renderInPageRoot(
      <MemoryRouter initialEntries={["/homework"]}>
        <HomeworkPage />
      </MemoryRouter>
    );

    await within(container).findByRole("heading", { name: "Algebra Practice" });
    const viewButtons = within(container).getAllByRole("button", { name: "View details" });
    fireEvent.click(viewButtons[0]);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeTruthy();

    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });

  it("has no detectable axe violations in the edit modal", async () => {
    const { container } = renderInPageRoot(
      <MemoryRouter initialEntries={["/homework"]}>
        <HomeworkPage />
      </MemoryRouter>
    );

    await within(container).findByRole("heading", { name: "Algebra Practice" });
    const editButtons = within(container).getAllByRole("button", { name: /Edit homework/i });
    fireEvent.click(editButtons[0]);

    const dialog = await screen.findByRole("dialog", { name: "Edit Homework" });
    expect(dialog).toBeTruthy();

    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });

  it("has no detectable axe violations in the detail modal with grading expanded", async () => {
    const { container } = renderInPageRoot(
      <MemoryRouter initialEntries={["/homework"]}>
        <HomeworkPage />
      </MemoryRouter>
    );

    await within(container).findByRole("heading", { name: "Essay Writing" });
    const viewButtons = within(container).getAllByRole("button", { name: "View details" });
    fireEvent.click(viewButtons[1]);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeTruthy();

    const gradeBtn = within(dialog).getByRole("button", { name: "Edit" });
    fireEvent.click(gradeBtn);

    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });

  it("renders the empty state without detectable axe violations", async () => {
    const { homeworkApi } = await import("../../services/api");
    homeworkApi.getAll.mockResolvedValueOnce([]);

    const { container } = renderInPageRoot(
      <MemoryRouter initialEntries={["/homework"]}>
        <HomeworkPage />
      </MemoryRouter>
    );

    await within(container).findByRole("button", { name: /Create First Homework/i });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
