/**
 * @vitest-environment jsdom
 *
 * Accessibility regression tests for the Hostel module.
 *
 * Guards the a11y fixes applied in DK-1003: labelled filters, focus-visible
 * indicators, table aria-labels, toggle-chip aria-pressed, and modal form
 * associations.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

function AppRoot({ children }) {
  return <div id="root">{children}</div>;
}

const tFn = vi.fn((key) => key);
const i18nMock = { language: "en" };

vi.mock(import("react-i18next"), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useTranslation: () => ({
      t: tFn,
      i18n: i18nMock,
    }),
  };
});

vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() } }));

vi.mock("../../hooks/useHostelLookups", () => ({
  useHostelLookups: () => ({
    hostels: [
      { _id: "h1", name: "Sunrise Boys Hostel" },
      { _id: "h2", name: "Lakshmi Girls Hostel" },
    ],
    rooms: [{ _id: "r1", roomNumber: "101", occupiedBeds: 1, capacity: 2, type: "double" }],
    students: [{ _id: "s1", name: "Aarav Kumar", admissionNo: "ADM-101" }],
    studentsLoading: false,
    error: null,
    clearError: vi.fn(),
  }),
}));

const mockHostels = [
  { _id: "h1", name: "Sunrise Boys Hostel", type: "boys", totalRooms: 10, totalCapacity: 40, occupiedBeds: 12, wardenId: { name: "Mr. Rajan" } },
  { _id: "h2", name: "Lakshmi Girls Hostel", type: "girls", totalRooms: 10, totalCapacity: 40, occupiedBeds: 8, wardenName: "Mrs. Priya" },
];

const mockRooms = [
  { _id: "r1", roomNumber: "101", floor: 1, type: "double", capacity: 2, occupiedBeds: 1, monthlyFee: 5000, hostelId: { name: "Sunrise Boys Hostel" } },
];

const mockAllocations = [
  { _id: "a1", studentName: "Aarav Kumar", admissionNo: "ADM-101", hostelName: "Sunrise Boys Hostel", roomNumber: "101", bedNumber: "A", startDate: "2026-01-15", status: "active" },
];

vi.mock("../../services/api", () => ({
  hostelApi: {
    getStats: vi.fn(() => Promise.resolve({
      totalHostels: 2, totalRooms: 20, totalCapacity: 80,
      availableBeds: 60, occupiedBeds: 20, occupancyRate: 25,
      activeAllocations: 18, vacatedAllocations: 2,
    })),
    getHostels: vi.fn(() => Promise.resolve({ hostels: mockHostels })),
    getRooms: vi.fn(() => Promise.resolve({ rooms: mockRooms, pages: 1 })),
    getAllocations: vi.fn(() => Promise.resolve({ allocations: mockAllocations, pages: 1 })),
  },
  staffApi: {
    getAll: vi.fn(() => Promise.resolve([{ _id: "w1", name: "Mr. Rajan" }])),
  },
  studentsApi: {
    list: vi.fn(() => Promise.resolve({ data: [{ _id: "s1", name: "Aarav Kumar", admissionNo: "ADM-101" }] })),
  },
}));

import HostelDashboard from "./HostelDashboard";
import HostelList from "./HostelList";
import RoomsList from "./RoomsList";
import AllocationsList from "./AllocationsList";

describe("Hostel module accessibility", () => {
  afterEach(() => {
    cleanup();
  });

  it("HostelDashboard renders stats inside a labelled section", async () => {
    render(
      <MemoryRouter>
        <AppRoot>
          <HostelDashboard />
        </AppRoot>
      </MemoryRouter>
    );

    const section = await screen.findByRole("region", { name: /hostel overview/i });
    expect(section).toBeInTheDocument();

    const stats = await screen.findAllByRole("heading", { level: 3 });
    expect(stats.length).toBeGreaterThanOrEqual(4);
  });

  it("HostelList exposes labelled search and filter controls", async () => {
    render(
      <MemoryRouter>
        <AppRoot>
          <HostelList />
        </AppRoot>
      </MemoryRouter>
    );

    expect(await screen.findByRole("textbox", { name: "pages.searchHostels" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "pages.allTypes1" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Filter by occupancy" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Print preview" })).toBeInTheDocument();
  });

  it("HostelList modal form fields have accessible labels", async () => {
    render(
      <MemoryRouter>
        <AppRoot>
          <HostelList />
        </AppRoot>
      </MemoryRouter>
    );

    await screen.findByText("Sunrise Boys Hostel");

    const addBtn = screen.getByRole("button", { name: /add hostel/i });
    addBtn.click();

    expect(await screen.findByRole("textbox", { name: "pages.hostelName" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "pages.type1" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Warden" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "pages.address2" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "pages.description1" })).toBeInTheDocument();
  });

  it("RoomsList exposes labelled search/filter controls and a labelled table", async () => {
    render(
      <MemoryRouter>
        <AppRoot>
          <RoomsList />
        </AppRoot>
      </MemoryRouter>
    );

    expect(await screen.findByRole("textbox", { name: "pages.searchRooms" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "pages.allHostels" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "pages.allTypes1" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Filter by occupancy" })).toBeInTheDocument();

    const table = screen.getByRole("table", { name: /rooms/i });
    expect(table).toBeInTheDocument();
    expect(table).toHaveAttribute("aria-label", "Rooms");
  });

  it("RoomsList amenity chips expose aria-pressed when toggled", async () => {
    render(
      <MemoryRouter>
        <AppRoot>
          <RoomsList />
        </AppRoot>
      </MemoryRouter>
    );

    await screen.findByText("101");

    const addBtn = screen.getByRole("button", { name: /add room/i });
    addBtn.click();

    const chips = await screen.findAllByRole("button", { name: /^AC$/i });
    expect(chips.length).toBeGreaterThanOrEqual(1);
    const allChips = await screen.findAllByRole("button", { name: /^(AC|WiFi|Attached Bathroom|Hot Water|Balcony|Study Table|Wardrobe)$/i });
    expect(allChips.length).toBe(7);
    allChips.forEach((chip) => {
      expect(chip).toHaveAttribute("aria-pressed");
    });
  });

  it("AllocationsList exposes labelled search/filter controls and a labelled table", async () => {
    render(
      <MemoryRouter>
        <AppRoot>
          <AllocationsList />
        </AppRoot>
      </MemoryRouter>
    );

    expect(await screen.findByRole("textbox", { name: "pages.searchStudent" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "pages.allHostels" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Filter by room" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "pages.status2" })).toBeInTheDocument();

    const table = screen.getByRole("table", { name: /student allocations/i });
    expect(table).toBeInTheDocument();
    expect(table).toHaveAttribute("aria-label", "Student allocations");
  });

  it("AllocationsList allocation modal exposes labelled required fields", async () => {
    render(
      <MemoryRouter>
        <AppRoot>
          <AllocationsList />
        </AppRoot>
      </MemoryRouter>
    );

    await screen.findByText("Aarav Kumar");

    const addBtn = screen.getByRole("button", { name: /allocate student/i });
    addBtn.click();

    expect(await screen.findByRole("combobox", { name: "pages.student" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "pages.hostel1" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "pages.room" })).toBeInTheDocument();
    expect(screen.getByLabelText(/pages.startDate1/i)).toBeInTheDocument();
  });
});
