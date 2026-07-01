/**
 * @vitest-environment jsdom
 *
 * Regression test for SCH-205.
 *
 * The Data Tools admin nav item links to bare `/data-tools`, but the inner
 * <Routes> only declared `jobs` / `govt-export` / `bulk-import` with no index
 * route — so hitting `/data-tools` matched nothing and rendered a blank page.
 * The fix adds `<Route index element={<Navigate to="jobs" replace />} />`.
 *
 * The three heavy child pages are stubbed so this test only asserts the
 * routing/redirect behaviour, not their internals.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import DataToolsPage from "./index";

vi.mock("./BackgroundJobs", () => ({
  default: () => <div>background-jobs-stub</div>,
}));
vi.mock("./GovtExport", () => ({
  default: () => <div>govt-export-stub</div>,
}));
vi.mock("./BulkImport", () => ({
  default: () => <div>bulk-import-stub</div>,
}));

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/data-tools/*" element={<DataToolsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("DataToolsPage routing (SCH-205)", () => {
  it("redirects the bare /data-tools index to the jobs view", () => {
    renderAt("/data-tools");
    expect(screen.getByText("background-jobs-stub")).toBeInTheDocument();
  });

  it("still renders the explicit child routes", () => {
    renderAt("/data-tools/govt-export");
    expect(screen.getByText("govt-export-stub")).toBeInTheDocument();

    renderAt("/data-tools/bulk-import");
    expect(screen.getByText("bulk-import-stub")).toBeInTheDocument();
  });
});
