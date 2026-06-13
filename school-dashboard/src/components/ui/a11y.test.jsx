/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { Check } from "lucide-react";
import IconButton from "./IconButton";
import MinimalButton from "./MinimalButton";
import EmptyState from "./EmptyState";
import Badge from "./Badge";
import Combobox from "./Combobox";
import MultiSelect from "./MultiSelect";

// Suppress dev-only console noise from the intentional a11y warnings.
const originalError = console.error;
const originalWarn = console.warn;
beforeAll(() => {
  console.error = vi.fn();
  console.warn = vi.fn();
});
afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

describe("IconButton a11y", () => {
  it("renders with aria-label", () => {
    render(<IconButton aria-label="Close dialog" icon={<Check size={16} />} />);
    expect(screen.getByRole("button", { name: "Close dialog" })).toBeInTheDocument();
  });

  it("has minimum touch target size", () => {
    render(<IconButton aria-label="Close" icon={<Check size={16} />} />);
    const btn = screen.getByRole("button", { name: "Close" });
    expect(btn).toHaveClass("min-h-[44px]");
    expect(btn).toHaveClass("min-w-[44px]");
  });
});

describe("MinimalButton a11y", () => {
  it("icon-only variant requires an accessible name", () => {
    render(<MinimalButton aria-label="Add item" icon={<Check size={16} />} />);
    expect(screen.getByRole("button", { name: "Add item" })).toBeInTheDocument();
  });

  it("visible text variant does not need aria-label", () => {
    render(<MinimalButton>Save</MinimalButton>);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });
});

describe("EmptyState a11y", () => {
  it("renders actionLabel as a visible labelled button", () => {
    render(<EmptyState title="No data" actionLabel="Create" onAction={() => {}} />);
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  });

  it("keeps backwards-compatible action prop", () => {
    render(<EmptyState title="No data" action={<button>Legacy</button>} />);
    expect(screen.getByRole("button", { name: "Legacy" })).toBeInTheDocument();
  });
});

describe("Badge token compliance", () => {
  it("does not contain hardcoded Tailwind colour classes", () => {
    const { container } = render(<Badge color="warning">Warn</Badge>);
    const badge = container.firstChild;
    expect(badge.className).not.toMatch(/\b(amber|yellow|red|green|blue|gray)-/);
  });
});

describe("Combobox a11y", () => {
  const options = [
    { value: "a", label: "Apple" },
    { value: "b", label: "Banana" },
  ];

  it("has combobox role and listbox controls", () => {
    render(<Combobox options={options} value="a" onChange={() => {}} label="Fruit" />);
    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveAttribute("aria-controls");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});

describe("MultiSelect a11y", () => {
  const options = [
    { value: "a", label: "Apple" },
    { value: "b", label: "Banana" },
  ];

  it("has listbox popup and controls", () => {
    render(<MultiSelect options={options} value={["a"]} onChange={() => {}} label="Fruit" />);
    const trigger = screen.getByRole("button", { expanded: false });
    expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
    expect(trigger).toHaveAttribute("aria-controls");
  });

  it("chip remove buttons are real buttons with accessible names", () => {
    render(<MultiSelect options={options} value={["a"]} onChange={() => {}} label="Fruit" />);
    const removeButtons = screen.getAllByRole("button", { name: "Remove Apple" });
    expect(removeButtons.length).toBeGreaterThanOrEqual(1);
    removeButtons.forEach((btn) => expect(btn).toBeInTheDocument());
  });
});
