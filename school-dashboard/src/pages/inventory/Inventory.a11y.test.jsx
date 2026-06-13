/**
 * @vitest-environment jsdom
 *
 * Accessibility regression tests for the Inventory module.
 *
 * These tests mount Inventory pages with realistic mocked data and run axe-core
 * via vitest-axe. They guard the fixes applied in DK-1005 (tab semantics, table
 * labels, progress labels, heading structure, motion) and catch regressions as
 * the module evolves.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { axe } from "vitest-axe";

vi.mock("../../services/api", () => ({
  inventoryApi: {
    getStats: vi.fn(() => Promise.resolve({
      totalAssets: 16,
      activeAssets: 6,
      underMaintenance: 10,
      pendingProcurements: 1,
      totalVendors: 2,
      lowStockAssets: 1,
    })),
    getLowStockAssets: vi.fn(() => Promise.resolve([
      { _id: "asset-3", name: "Cricket Kit", category: "SPORTS", location: "Sports Room", quantity: 1, minimumQuantity: 2 },
    ])),
    getMaintenance: vi.fn(() => Promise.resolve([
      { _id: "maint-1", assetId: { _id: "asset-1", name: "Projector A1" }, maintenanceType: "PREVENTIVE", description: "Annual bulb replacement", scheduledDate: "2026-04-01T00:00:00Z", status: "SCHEDULED" },
    ])),
    getAssets: vi.fn(() => Promise.resolve({
      data: [
        { _id: "asset-1", name: "Projector A1", category: "ELECTRONICS", assetTag: "EL-001", location: "Room 101", assignedTo: { name: "Class 5A" }, quantity: 5, minimumQuantity: 2, purchasePrice: 25000, currentValue: 22000, condition: "GOOD", status: "ACTIVE", vendorId: { name: "Tech Supplies" } },
        { _id: "asset-2", name: "Lab Table Set", category: "FURNITURE", assetTag: "FU-010", location: "Science Lab", quantity: 10, minimumQuantity: 5, purchasePrice: 8000, condition: "FAIR", status: "UNDER_MAINTENANCE" },
      ],
      total: 2,
    })),
    getVendors: vi.fn(() => Promise.resolve([
      { _id: "vendor-1", name: "Tech Supplies India", contactPerson: "Ramesh", phone: "9876543210", email: "ramesh@tech.in", category: "Electronics", isActive: true },
      { _id: "vendor-2", name: "Furniture World", contactPerson: "Suresh", phone: "9988776655", email: "suresh@fw.in", category: "Furniture", isActive: true },
    ])),
    getProcurement: vi.fn(() => Promise.resolve([
      { _id: "proc-1", itemName: "Whiteboard Markers", category: "STATIONERY", quantity: 200, estimatedCost: 4000, status: "PENDING", requestedBy: { name: "Admin" } },
    ])),
    getAudits: vi.fn(() => Promise.resolve([
      { _id: "audit-1", title: "Q1 2026 Asset Audit", status: "COMPLETED", startDate: "2026-01-10T00:00:00Z", auditItems: [{ assetId: { _id: "asset-1", name: "Projector A1" }, expectedQuantity: 5, actualQuantity: 5, condition: "GOOD" }] },
    ])),
    getReports: vi.fn(() => Promise.resolve({
      totals: { totalItems: 16, totalPurchaseValue: 280000, totalCurrentValue: 210000 },
      categoryBreakdown: [{ _id: "ELECTRONICS", count: 5, totalValue: 125000 }, { _id: "FURNITURE", count: 10, totalValue: 80000 }],
      conditionSummary: [{ _id: "GOOD", count: 5 }, { _id: "FAIR", count: 10 }],
      statusSummary: [{ _id: "ACTIVE", count: 6 }, { _id: "UNDER_MAINTENANCE", count: 10 }],
    })),
  },
  staffApi: {
    getAll: vi.fn(() => Promise.resolve([
      { _id: "staff-1", name: "Ananya Sharma" },
      { _id: "staff-2", name: "Ravi Menon" },
    ])),
  },
}));

const TRANSLATIONS = {
  "pages.home": "Home",
  "pages.inventory1": "Inventory",
  "pages.dashboard1": "Dashboard",
  "pages.assets": "Assets",
  "pages.vendors": "Vendors",
  "pages.maintenance": "Maintenance",
  "pages.procurement": "Procurement",
  "pages.audits": "Audits",
  "pages.reports1": "Reports",
  "pages.totalAssets": "Total Assets",
  "pages.active": "Active",
  "pages.underMaintenance": "Under Maintenance",
  "pages.pendingProcurement": "Pending Procurement",
  "pages.activeVendors": "Active Vendors",
  "pages.lowStock": "Low Stock",
  "pages.lowStockAlerts": "Low Stock Alerts",
  "pages.noLowStockItems": "No low stock items",
  "pages.scheduledMaintenance": "Scheduled Maintenance",
  "pages.noScheduledMaintenance": "No scheduled maintenance",
  "pages.assetManagement": "Asset Management",
  "pages.searchAssets": "Search assets",
  "pages.name1": "Name",
  "pages.category1": "Category",
  "pages.location": "Location",
  "pages.assignedTo": "Assigned To",
  "pages.qty": "Qty",
  "pages.currentValue": "Current Value",
  "pages.condition": "Condition",
  "pages.status2": "Status",
  "pages.vendor": "Vendor",
  "pages.actions1": "Actions",
  "pages.addAsset": "Add Asset",
  "pages.noAssetsFound": "No assets found",
  "pages.assetsTotal": "{{count}} assets total",
  "pages.previous": "Previous",
  "pages.next": "Next",
  "pages.searchVendors": "Search vendors",
  "pages.noVendorsFound": "No vendors found",
  "pages.allStatuses": "All Statuses",
  "pages.allStatus1": "All Status",
  "pages.noMaintenanceLogs": "No maintenance logs",
  "pages.noProcurementRequests": "No procurement requests",
  "pages.noAuditsFound": "No audits found",
  "pages.noData": "No data",
  "pages.byCategory": "By Category",
  "pages.byCondition": "By Condition",
  "pages.byStatus": "By Status",
  "pages.depreciationOverview": "Depreciation Overview",
  "pages.purchaseValue": "Purchase Value",
  "pages.current": "Current Value",
  "pages.noPurchaseValueDataAvailable": "No purchase value data available",
  "toast.error.failedToLoadInventoryData": "Failed to load inventory data",
  "toast.error.failedToLoadAssets": "Failed to load assets",
  "toast.error.failedToLoadVendors": "Failed to load vendors",
  "toast.error.failedToLoadMaintenanceLogs": "Failed to load maintenance logs",
  "toast.error.failedToLoadProcurementData": "Failed to load procurement data",
  "toast.error.failedToLoadAudits": "Failed to load audits",
  "toast.error.failedToLoadReports": "Failed to load reports",
  "toast.error.failedToLoad": "Failed to load",
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, fallback, interpolations) => {
      const text = TRANSLATIONS[key] ?? (typeof fallback === "string" ? fallback : key);
      if (!interpolations) return text;
      return Object.entries(interpolations).reduce(
        (acc, [k, v]) => acc.replace(new RegExp(`{{${k}}}`, "g"), String(v)),
        text
      );
    },
  }),
  initReactI18next: { type: "3rdParty", init: () => {} },
  I18nextProvider: ({ children }) => children,
}));

import InventoryPage from "./index";

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/inventory/*" element={<InventoryPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Inventory module accessibility", () => {
  it("renders the dashboard without detectable axe violations", async () => {
    const { container } = renderAt("/inventory");
    await screen.findByText("Low Stock", {}, { timeout: 3000 });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("exposes module tabs with proper tablist semantics", async () => {
    const { container } = renderAt("/inventory");
    await screen.findByText("Low Stock", {}, { timeout: 3000 });

    const tablist = within(container).getByRole("tablist");
    expect(tablist).toBeTruthy();

    const tabs = within(tablist).getAllByRole("tab");
    expect(tabs.length).toBeGreaterThanOrEqual(8);

    const selected = tabs.find((tab) => tab.getAttribute("aria-selected") === "true");
    expect(selected?.textContent).toMatch(/Dashboard/i);
  });

  it("renders the assets page without detectable axe violations", async () => {
    const { container } = renderAt("/inventory/assets");
    await screen.findAllByText("Projector A1", {}, { timeout: 3000 });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("assets table has an accessible label", async () => {
    const { container } = renderAt("/inventory/assets");
    await screen.findAllByText("Projector A1", {}, { timeout: 3000 });

    const table = within(container).getByRole("table", { name: /Asset management/i });
    expect(table).toBeTruthy();
  });

  it("renders the vendors page without detectable axe violations", async () => {
    const { container } = renderAt("/inventory/vendors");
    await screen.findByText("Tech Supplies India", {}, { timeout: 3000 });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("vendor cards use proper heading hierarchy", async () => {
    renderAt("/inventory/vendors");
    await screen.findByText("Tech Supplies India", {}, { timeout: 3000 });

    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.some((h) => h.textContent?.includes("Tech Supplies India"))).toBeTruthy();
  });

  it("renders the maintenance page without detectable axe violations", async () => {
    const { container } = renderAt("/inventory/maintenance");
    await screen.findAllByText("Projector A1", {}, { timeout: 3000 });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders the procurement page without detectable axe violations", async () => {
    const { container } = renderAt("/inventory/procurement");
    await screen.findByText("Whiteboard Markers", {}, { timeout: 3000 });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders the audits page without detectable axe violations", async () => {
    const { container } = renderAt("/inventory/audits");
    await screen.findByText("Q1 2026 Asset Audit", {}, { timeout: 3000 });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders the reports page without detectable axe violations", async () => {
    const { container } = renderAt("/inventory/reports");
    await screen.findByText("Total Items", {}, { timeout: 3000 });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders the transactions page without detectable axe violations", async () => {
    const { container } = renderAt("/inventory/transactions");
    await within(container).findByRole("button", { name: /Filter by status/i }, { timeout: 3000 });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
