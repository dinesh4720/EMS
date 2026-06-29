/**
 * @vitest-environment jsdom
 *
 * Regression tests for the Communication Logs page (PAG-22).
 *
 * Two bugs were tracked here:
 *   1. A hard `limit: 200` cap on the initial fetch meant only the most recent
 *      200 sent communications were ever loaded — search/filters could not see
 *      older logs. The page now pages through the backend's existing
 *      pagination and loads the full history, so search/filters span every log.
 *   2. The current page was not reliably reset when a filter changed, which
 *      could strand the user on a page index past `totalPages`. A single effect
 *      now resets to page 1 whenever any filter changes.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() } }));

const { getAll, getStats } = vi.hoisted(() => ({
  getAll: vi.fn(),
  getStats: vi.fn(),
}));

vi.mock("../../services/api", () => ({
  announcementsApi: { getAll, getStats },
}));

import CommunicationLogs from "./CommunicationLogs";

function makeAnn(id, title) {
  return {
    _id: id,
    title,
    content: `${title} body`,
    channels: [{ type: "email", stats: { sentCount: 1, deliveredCount: 1, failedCount: 0 } }],
    recipients: [{ type: "all" }],
    createdAt: "2026-06-01T10:00:00Z",
    sentAt: "2026-06-01T10:00:00Z",
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <CommunicationLogs />
    </MemoryRouter>
  );
}

beforeEach(() => {
  getStats.mockResolvedValue({ sentThisMonth: 5, totalDelivered: 100, scheduled: 2 });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CommunicationLogs — full-history load (PAG-22)", () => {
  it("pages through every server page instead of a single capped fetch", async () => {
    getAll.mockImplementation((params) => {
      const page = Number(params?.page) || 1;
      if (page === 1) {
        return Promise.resolve({
          announcements: [makeAnn("a1", "Recent Campaign"), makeAnn("a2", "Newsletter Blast")],
          totalPages: 2,
          total: 3,
        });
      }
      return Promise.resolve({
        announcements: [makeAnn("a3", "Archived Campaign")],
        totalPages: 2,
        total: 3,
      });
    });

    renderPage();

    // The page-2-only record must be present — proving the loop fetched beyond
    // the first page rather than stopping at an arbitrary cap.
    expect(await screen.findByText("Archived Campaign")).toBeInTheDocument();

    expect(getAll).toHaveBeenCalledWith({ status: "sent", page: 1, limit: 200 });
    expect(getAll).toHaveBeenCalledWith({ status: "sent", page: 2, limit: 200 });
    // No bare `{ limit: 200 }` cap call (the old behaviour).
    expect(getAll).toHaveBeenCalledTimes(2);
  });

  it("searches across the full loaded history, not just the first page", async () => {
    getAll.mockImplementation((params) => {
      const page = Number(params?.page) || 1;
      if (page === 1) {
        return Promise.resolve({
          announcements: [makeAnn("a1", "Recent Campaign")],
          totalPages: 2,
          total: 2,
        });
      }
      return Promise.resolve({
        announcements: [makeAnn("a3", "Archived Campaign")],
        totalPages: 2,
        total: 2,
      });
    });

    renderPage();
    await screen.findByText("Archived Campaign");

    fireEvent.change(screen.getByPlaceholderText(/Search by title/i), {
      target: { value: "Archived" },
    });

    // The match lives on server page 2 — it is only findable because the whole
    // history was loaded client-side.
    expect(screen.getByText("Archived Campaign")).toBeInTheDocument();
    expect(screen.queryByText("Recent Campaign")).not.toBeInTheDocument();
  });
});

describe("CommunicationLogs — page reset on filter change (PAG-22)", () => {
  it("returns to page 1 when a filter changes after paging forward", async () => {
    const many = Array.from({ length: 30 }, (_, i) =>
      makeAnn(`c${i}`, `Campaign ${String(i + 1).padStart(2, "0")}`)
    );
    getAll.mockResolvedValue({ announcements: many, totalPages: 1, total: many.length });

    renderPage();

    // 30 records / 15 per client page = 2 pages.
    await screen.findByText("Page 1 of 2");

    fireEvent.click(screen.getByLabelText("Next page"));
    expect(await screen.findByText("Page 2 of 2")).toBeInTheDocument();

    // Searching keeps 2 pages of results but must snap back to page 1.
    fireEvent.change(screen.getByPlaceholderText(/Search by title/i), {
      target: { value: "Campaign" },
    });

    expect(await screen.findByText("Page 1 of 2")).toBeInTheDocument();
  });
});
