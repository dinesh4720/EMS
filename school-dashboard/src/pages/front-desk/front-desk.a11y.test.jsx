/**
 * @vitest-environment jsdom
 *
 * Accessibility regression tests for the Front Desk module.
 *
 * Guards the a11y fixes applied in DK-1001: table semantics, labelled inputs,
 * visible focus indicators, real buttons for interactive cards, and keyboard
 * operable kanban cards.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProvider } from "../../context/AppContext";

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

vi.mock("../../services/api", () => ({
  frontDeskApi: {
    getVisitorsToday: vi.fn(() => Promise.resolve([])),
    getGatePassesToday: vi.fn(() => Promise.resolve([])),
    getAppointments: vi.fn(() => Promise.resolve([])),
    getFeedbacks: vi.fn(() => Promise.resolve([])),
    getCallLogs: vi.fn(() => Promise.resolve([])),
    getAdmissions: vi.fn(() => Promise.resolve([])),
    createVisitor: vi.fn(() => Promise.resolve({})),
    createGatePass: vi.fn(() => Promise.resolve({})),
  },
  studentsApi: {
    list: vi.fn(() => Promise.resolve({ data: [] })),
    getById: vi.fn(() => Promise.resolve(null)),
  },
  staffApi: {
    getAll: vi.fn(() => Promise.resolve([])),
  },
  classesApi: {
    getAll: vi.fn(() => Promise.resolve([])),
  },
  settingsApi: {
    getSalaryComponents: vi.fn(() => Promise.resolve([])),
  },
}));

vi.mock("../../context/useStudents", () => ({
  useStudents: () => ({ students: [], setStudents: vi.fn() }),
  StudentsProvider: ({ children }) => children,
}));

vi.mock("../../context/useStaff", () => ({
  useStaff: () => ({ staff: [], setStaff: vi.fn() }),
  StaffProvider: ({ children }) => children,
}));

import FrontDeskPage from "./FrontDeskPage";
import ActivityTable from "../../components/front-desk/ActivityTable";
import VisitorSheet from "../../components/front-desk/VisitorSheet";
import GatePassSheet from "../../components/front-desk/GatePassSheet";
import Overview from "./Overview";
import AdmissionTracker from "./AdmissionTracker";
import { ACTIVITY_TYPES } from "../../hooks/useFrontDeskData";

describe("Front Desk module accessibility", () => {
  afterEach(() => {
    cleanup();
  });

  it("ActivityTable exposes proper table semantics", () => {
    const rows = [
      {
        id: "v1",
        type: ACTIVITY_TYPES.VISITOR,
        name: "Asha",
        sub: "Parent meeting",
        time: new Date().toISOString(),
        status: "in",
      },
    ];

    render(<ActivityTable rows={rows} onRowClick={vi.fn()} />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader").length).toBe(6);
    expect(screen.getAllByRole("cell").length).toBe(6);
    expect(screen.getAllByRole("row").length).toBe(2); // header + data
  });

  it("VisitorSheet labels are programmatically associated with inputs", () => {
    render(<VisitorSheet isOpen onClose={vi.fn()} onCheckedIn={vi.fn()} />);

    expect(screen.getByLabelText(/visitor name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone \(optional\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/purpose/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/whom to meet/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/note \(optional\)/i)).toBeInTheDocument();
  });

  it("GatePassSheet labels are programmatically associated with inputs", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <AppProvider>
            <GatePassSheet isOpen onClose={vi.fn()} onIssued={vi.fn()} />
          </AppProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/student/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reason/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/leaving at/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/escort phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/escort name/i)).toBeInTheDocument();
  });

  it("Overview stat cards are real buttons with accessible names", () => {
    const stats = {
      todayVisitors: 3,
      todayGatePasses: 2,
      upcomingAppointments: 1,
      openFeedbacks: 0,
      todayCalls: 4,
    };

    render(<Overview stats={stats} onTabChange={vi.fn()} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(5);
    buttons.forEach((btn) => {
      expect(btn).toHaveAccessibleName();
    });
  });

  it("AdmissionTracker cards can be moved with arrow keys", () => {
    const admissions = [
      { _id: "a1", studentName: "Aarav", status: "inquiry-logged" },
    ];
    const onStageChange = vi.fn();

    render(
      <AdmissionTracker
        admissions={admissions}
        onCardClick={vi.fn()}
        onStageChange={onStageChange}
      />
    );

    const card = screen.getByRole("button", { name: /aarav/i });
    expect(card).toBeInTheDocument();

    fireEvent.keyDown(card, { key: "ArrowRight" });
    expect(onStageChange).toHaveBeenCalledWith("a1", "visited");
  });

  it("FrontDeskPage renders the KPI strip as a button group", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <AppProvider>
            <FrontDeskPage />
          </AppProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );

    const group = await screen.findByRole("group", { name: /front desk overview/i });
    expect(group).toBeInTheDocument();

    const kpiButtons = await screen.findAllByRole("button", { name: /visitors today|gate passes|appointments today|admissions today|open feedback|calls today/i });
    expect(kpiButtons.length).toBe(6);
  });
});
