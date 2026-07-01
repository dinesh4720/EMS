/**
 * @vitest-environment jsdom
 *
 * Unit tests for the dashboard ActionItem (STUB-11).
 *
 * The audit flagged that ActionItem accepted an onDismiss prop but rendered no
 * dismiss control, so the fabricated '10-B unstaffed' alert was permanent.
 * These tests prove the dismiss button now renders when an onDismiss callback
 * is supplied, is omitted when it is not, and that clicking it invokes the
 * callback.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import ActionItem from "./ActionItem";

describe("ActionItem", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the dismiss button and invokes onDismiss when clicked", () => {
    const onDismiss = vi.fn();
    render(
      <ActionItem
        kind="warn"
        title="Period 3 · 10-B unstaffed"
        body="Substitute not assigned"
        meta="10:30 – 11:15"
        primary="Assign substitute"
        onDismiss={onDismiss}
      />
    );

    const dismissBtn = screen.getByRole("button", { name: "Dismiss" });
    fireEvent.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("omits the dismiss button when no onDismiss is supplied", () => {
    render(
      <ActionItem
        kind="info"
        title="PTM agenda · Dec 20"
        body="Finalize discussion points"
        meta="3 days left"
      />
    );

    expect(screen.queryByRole("button", { name: "Dismiss" })).toBeNull();
  });

  it("renders the primary CTA and invokes onPrimary when clicked", () => {
    const onPrimary = vi.fn();
    render(
      <ActionItem
        kind="danger"
        title="Unpaid fees"
        body="3 students past cutoff"
        primary="Send reminders"
        onPrimary={onPrimary}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Send reminders/ }));
    expect(onPrimary).toHaveBeenCalledTimes(1);
  });
});
