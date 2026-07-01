/**
 * @vitest-environment jsdom
 *
 * Regression tests for SCH-207 — inventory asset selectors don't scale.
 *
 * The audit and maintenance modals used to pre-load the whole asset collection
 * into a plain <Select> (one with NO limit, one hard-capped at 500 which
 * silently dropped asset #501+). AssetPicker replaces that with a searchable,
 * server-paginated selector. These tests lock in the guarantees:
 *
 *  1. Lazy — nothing is fetched until the picker opens (so a modal with the
 *     picker doesn't eagerly pull assets on mount).
 *  2. Bounded — every fetch carries a `limit`; the whole collection is never
 *     pulled at once.
 *  3. Server-side search — the typed query is sent to the server (debounced),
 *     not filtered client-side over a pre-loaded list.
 *  4. Nothing silently dropped — when more matches exist than are shown, an
 *     explicit "showing first N of M" overflow hint is rendered.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent, cleanup } from "@testing-library/react";

const getAssets = vi.fn((_params, _options) => Promise.resolve({
  data: [
    { _id: "asset-1", name: "Projector A1", assetTag: "EL-001" },
    { _id: "asset-2", name: "Lab Table", assetTag: "FU-010" },
  ],
  total: 2,
}));
const getAsset = vi.fn((id) => Promise.resolve({ _id: id, name: "Resolved Asset", assetTag: "RS-1" }));

vi.mock("../../services/api", () => ({
  inventoryApi: {
    getAssets: (...args) => getAssets(...args),
    getAsset: (...args) => getAsset(...args),
  },
}));

import AssetPicker from "./AssetPicker";

async function flush(ms = 0) {
  await act(async () => { await vi.advanceTimersByTimeAsync(ms); });
}

function openPicker() {
  fireEvent.click(screen.getByRole("combobox"));
}

describe("AssetPicker — SCH-207", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getAssets.mockClear();
    getAsset.mockClear();
  });
  afterEach(() => {
    cleanup();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("does not fetch the asset list until it is opened (lazy)", async () => {
    render(<AssetPicker value="" onChange={() => {}} label="Asset" />);
    await flush(0);
    expect(getAssets).not.toHaveBeenCalled();
  });

  it("fetches a bounded page on open — never the whole collection", async () => {
    render(<AssetPicker value="" onChange={() => {}} label="Asset" />);
    await flush(0);
    openPicker();
    await flush(0);

    expect(getAssets).toHaveBeenCalledTimes(1);
    const [params, options] = getAssets.mock.calls[0];
    // A limit is always present — the fix is precisely that no call is unbounded.
    expect(params.limit).toBeGreaterThan(0);
    expect(params.search).toBe("");
    // Stale-response guard: each fetch is abortable.
    expect(options?.signal).toBeInstanceOf(AbortSignal);
  });

  it("sends the typed query to the server (debounced) instead of filtering locally", async () => {
    render(<AssetPicker value="" onChange={() => {}} label="Asset" />);
    await flush(0);
    openPicker();
    await flush(0);
    expect(getAssets).toHaveBeenCalledTimes(1);

    const input = screen.getByPlaceholderText("Search assets by name or tag…");
    for (const value of ["p", "pr", "pro", "proj"]) {
      fireEvent.change(input, { target: { value } });
      await flush(50);
    }
    // Still inside the debounce window → no extra fetch yet.
    expect(getAssets).toHaveBeenCalledTimes(1);

    // Cross the threshold → exactly one more fetch, carrying the query + a limit.
    await flush(300);
    expect(getAssets).toHaveBeenCalledTimes(2);
    expect(getAssets.mock.calls[1][0].search).toBe("proj");
    expect(getAssets.mock.calls[1][0].limit).toBeGreaterThan(0);
  });

  it("surfaces an overflow hint so matches beyond the page are never silently dropped", async () => {
    getAssets.mockResolvedValueOnce({
      data: [
        { _id: "asset-1", name: "Projector A1", assetTag: "EL-001" },
        { _id: "asset-2", name: "Lab Table", assetTag: "FU-010" },
      ],
      total: 1200, // far more than the page — the old 500-cap bug territory
    });
    render(<AssetPicker value="" onChange={() => {}} label="Asset" />);
    await flush(0);
    openPicker();
    await flush(0);

    expect(screen.getByText(/showing first 2 of 1200/i)).toBeTruthy();
    expect(screen.getByText(/refine your search/i)).toBeTruthy();
  });

  it("selecting an option reports the id and shows its label without a full reload", async () => {
    const onChange = vi.fn();
    render(<AssetPicker value="" onChange={onChange} label="Asset" />);
    await flush(0);
    openPicker();
    await flush(0);

    fireEvent.mouseDown(screen.getByText("Projector A1"));
    await flush(0);
    expect(onChange).toHaveBeenCalledWith("asset-1");
  });

  it("labels a preselected asset from `selectedAsset` without any fetch", async () => {
    render(
      <AssetPicker
        value="asset-9"
        onChange={() => {}}
        selectedAsset={{ _id: "asset-9", name: "Server Rack", assetTag: "IT-9" }}
        label="Asset"
      />
    );
    await flush(0);
    expect(screen.getByRole("combobox").textContent).toContain("Server Rack (IT-9)");
    // No round-trip needed — the label came from the prop, list stays unfetched.
    expect(getAsset).not.toHaveBeenCalled();
    expect(getAssets).not.toHaveBeenCalled();
  });

  it("resolves a preselected asset's label via a single-asset fetch when not provided", async () => {
    render(<AssetPicker value="asset-42" onChange={() => {}} label="Asset" />);
    await flush(0);
    expect(getAsset).toHaveBeenCalledWith("asset-42");
    // Resolving one asset must not pull the whole list.
    expect(getAssets).not.toHaveBeenCalled();
    expect(screen.getByRole("combobox").textContent).toContain("Resolved Asset");
  });
});
