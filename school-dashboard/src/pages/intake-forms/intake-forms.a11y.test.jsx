/**
 * @vitest-environment jsdom
 *
 * Accessibility regression tests for the Intake Forms module.
 *
 * Guards the a11y fixes applied in DK-1004: progressbar roles on funnel bars,
 * labelled icon-only buttons, exposed button states, and keyboard-accessible
 * form-builder controls.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Reorder } from "framer-motion";

vi.mock(import("react-i18next"), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key, vars) => {
        let result = vars?.defaultValue || key;
        if (vars) {
          Object.entries(vars).forEach(([k, v]) => {
            if (k !== "defaultValue") {
              result = result.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v ?? "");
            }
          });
        }
        return result;
      },
      i18n: { language: "en" },
    }),
  };
});

vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() } }));

const mockForms = [
  { _id: "if-1", formName: "Student Admission Form", formType: "student", status: "active", fields: [], submissionCount: 0 },
];

const mockAssignments = [
  { _id: "ifa-1", formId: mockForms[0], assignedToEmail: "parent1@example.com", assignedBy: { name: "Admin" }, status: "pending", assignedAt: "2026-03-15T00:00:00Z", expiresAt: "2026-04-15T00:00:00Z", accessToken: "token-1" },
];

const mockSubmissions = [
  { _id: "ifs-1", formId: mockForms[0], formName: "Student Admission Form", submittedByEmail: "parent2@example.com", submittedAt: "2026-03-16T00:00:00Z", reviewStatus: "pending", reviewedBy: "-" },
];

vi.mock("../../services/api", () => ({
  intakeFormsApi: {
    getAll: vi.fn(() => Promise.resolve(mockForms)),
    getAssignments: vi.fn(() => Promise.resolve(mockAssignments)),
    getSubmissions: vi.fn(() => Promise.resolve(mockSubmissions)),
    listSubmissions: vi.fn(() =>
      Promise.resolve({
        data: mockSubmissions,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: mockSubmissions.length,
          itemsPerPage: 10,
          hasNextPage: false,
          hasPrevPage: false,
        },
      })
    ),
    getSubmission: vi.fn(() => Promise.resolve(mockSubmissions[0])),
  },
}));

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1", name: "Admin" } }),
}));

import EnrollmentFunnel from "./EnrollmentFunnel";
import FormAssignments from "./FormAssignments";
import FormSubmissions from "./FormSubmissions";
import DraggableFieldItem from "../settings/components/intake-forms/DraggableFieldItem";
import FieldPreviewRenderer from "../settings/components/intake-forms/FieldPreviewRenderer";

describe("Intake Forms module accessibility", () => {
  afterEach(() => {
    cleanup();
  });

  it("EnrollmentFunnel exposes funnel bars as progressbars", async () => {
    render(
      <MemoryRouter>
        <EnrollmentFunnel />
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

  it("FormAssignments filter buttons expose their pressed state", async () => {
    render(
      <MemoryRouter>
        <FormAssignments />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /intakeForms\.assignments\.status\.all/i })).toHaveAttribute("aria-pressed", "true");
    });

    const filters = ["all", "pending", "submitted", "approved", "rejected"];
    filters.forEach((status) => {
      const btn = screen.getByRole("button", { name: new RegExp(`intakeForms\\.assignments\\.status\\.${status}`, "i") });
      expect(btn).toHaveAttribute("aria-pressed", status === "all" ? "true" : "false");
    });
  });

  it("FormSubmissions filter buttons expose their pressed state", async () => {
    render(
      <MemoryRouter>
        <FormSubmissions />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /intakeForms\.submissions\.status\.pending/i })).toHaveAttribute("aria-pressed", "true");
    });

    const filters = ["pending", "approved", "rejected", "needs_revision", "all"];
    filters.forEach((status) => {
      const key = status.replace(/_(.)/g, (_, c) => c.toUpperCase());
      const btn = screen.getByRole("button", { name: new RegExp(`intakeForms\\.submissions\\.status\\.${key}`, "i") });
      expect(btn).toHaveAttribute("aria-pressed", status === "pending" ? "true" : "false");
    });
  });

  it("DraggableFieldItem exposes a selectable button with pressed state", () => {
    const field = { id: "f-1", type: "text", label: "Full Name", width: "full", required: false, options: [] };
    render(
      <Reorder.Group axis="y" values={[field]} onReorder={vi.fn()}>
        <DraggableFieldItem
          field={field}
          isSelected={true}
          onSelect={vi.fn()}
          onMove={vi.fn()}
          onDelete={vi.fn()}
          renderPreview={(f) => <span>{f.label}</span>}
          isFirst={false}
          isLast={false}
        />
      </Reorder.Group>
    );

    const btn = screen.getByRole("button", { name: /Full Name text field/i });
    expect(btn).toHaveAttribute("aria-pressed", "true");
    btn.focus();
    expect(btn).toHaveFocus();
  });

  it("FieldPreviewRenderer renders real radio inputs for radio fields", () => {
    render(
      <FieldPreviewRenderer
        field={{ id: "f-2", type: "radio", label: "Gender", width: "full", required: true, options: ["Male", "Female"] }}
      />
    );

    const radios = screen.getAllByRole("radio");
    expect(radios.length).toBe(2);
    radios.forEach((radio) => expect(radio).toBeDisabled());
  });
});
