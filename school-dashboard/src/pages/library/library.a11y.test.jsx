/**
 * @vitest-environment jsdom
 *
 * Accessibility regression tests for the Library module.
 *
 * Guards the a11y fixes applied in DK-1006: table semantics, labelled inputs,
 * progressbar roles, and accessible combobox selectors.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock(import("react-i18next"), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key) => key,
      i18n: { language: "en" },
    }),
  };
});

vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() } }));

const mockBooks = [
  { _id: "book-001", title: "Introduction to Physics", author: "H.C. Verma", isbn: "978-1", category: "textbook", totalCopies: 10, availableCopies: 7 },
  { _id: "book-002", title: "NCERT Mathematics", author: "NCERT", isbn: "978-2", category: "textbook", totalCopies: 15, availableCopies: 12 },
];

const mockIssues = [
  { _id: "issue-001", bookId: mockBooks[0], studentId: { _id: "student-001", name: "Aarav Kumar", admissionNo: "1001" }, issueDate: "2026-03-01", dueDate: "2026-03-28", status: "issued" },
];

vi.mock("../../services/api", () => ({
  libraryApi: {
    getBooks: vi.fn(() => Promise.resolve({ books: mockBooks, total: mockBooks.length })),
    getIssues: vi.fn(() => Promise.resolve({ issues: mockIssues, total: mockIssues.length })),
    getStats: vi.fn(() => Promise.resolve({ totalBooks: 2, totalCopies: 25, availableCopies: 19, issued: 1, overdue: 0, reserved: 0, lowStock: 0, totalAccruedFines: 0 })),
    getReports: vi.fn(() => Promise.resolve({ mostBorrowed: [{ _id: "book-001", bookTitle: "Introduction to Physics", count: 5 }], categoryStats: [], overdueByStudent: [], unpaidFines: { total: 0, count: 0 } })),
  },
  studentsApi: {
    getAll: vi.fn(() => Promise.resolve({ students: [] })),
  },
}));

import LibraryDashboard from "./LibraryDashboard";
import BooksList from "./BooksList";
import IssuedBooksList from "./IssuedBooksList";
import IssueBookModal from "./IssueBookModal";

describe("Library module accessibility", () => {
  afterEach(() => {
    cleanup();
  });

  it("LibraryDashboard exposes most-borrowed bars as progressbars", async () => {
    render(
      <MemoryRouter>
        <LibraryDashboard />
      </MemoryRouter>
    );

    const bars = await screen.findAllByRole("progressbar");
    expect(bars.length).toBeGreaterThanOrEqual(1);
    bars.forEach((bar) => {
      expect(bar).toHaveAttribute("aria-valuemin", "0");
      expect(bar).toHaveAttribute("aria-valuemax");
      expect(bar).toHaveAttribute("aria-valuenow");
      expect(bar).toHaveAttribute("aria-label");
    });
  });

  it("BooksList renders a real table, not a listbox", async () => {
    render(
      <MemoryRouter>
        <BooksList />
      </MemoryRouter>
    );

    const table = await screen.findByRole("table");
    expect(table).toBeInTheDocument();
    expect(table).toHaveAttribute("aria-label");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("IssuedBooksList search input has an accessible name", async () => {
    render(
      <MemoryRouter>
        <IssuedBooksList />
      </MemoryRouter>
    );

    const table = await screen.findByRole("table");
    expect(table).toBeInTheDocument();

    const searchInput = screen.getByLabelText(/search issued books/i);
    expect(searchInput).toBeInTheDocument();
  });

  it("IssueBookModal exposes combobox selectors with listbox popups", async () => {
    render(
      <MemoryRouter>
        <IssueBookModal isOpen onClose={vi.fn()} />
      </MemoryRouter>
    );

    const comboboxes = await screen.findAllByRole("combobox");
    expect(comboboxes.length).toBeGreaterThanOrEqual(2);

    comboboxes.forEach((combo) => {
      expect(combo).toHaveAttribute("aria-expanded");
      expect(combo).toHaveAttribute("aria-controls");
      expect(combo).toHaveAttribute("aria-haspopup", "listbox");
    });
  });
});
