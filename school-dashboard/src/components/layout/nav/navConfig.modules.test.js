import { describe, it, expect } from "vitest";
import { NAV_GROUPS, filterNavGroups } from "./navConfig";

/** Build an isModuleEnabled(key) that disables the given keys. */
const withDisabled = (...keys) => {
  const off = new Set(keys);
  return (key) => !off.has(key);
};

const sectionIds = (groups) => groups.flatMap((g) => g.items.map((s) => s.id));
const panelIds = (groups, sectionId) =>
  groups.flatMap((g) => g.items).find((s) => s.id === sectionId)?.panel?.map((p) => p.id) ?? [];

describe("filterNavGroups", () => {
  it("returns the full nav when everything is enabled", () => {
    const out = filterNavGroups(NAV_GROUPS, () => true);
    expect(sectionIds(out)).toEqual(sectionIds(NAV_GROUPS));
  });

  it("returns the original groups when isModuleEnabled is not a function", () => {
    expect(filterNavGroups(NAV_GROUPS, null)).toBe(NAV_GROUPS);
  });

  it("hides a direct-href section whose module is disabled", () => {
    const out = filterNavGroups(NAV_GROUPS, withDisabled("expenses"));
    expect(sectionIds(out)).not.toContain("expenses");
    expect(sectionIds(out)).toContain("messaging");
  });

  it("hides a panel section entirely when its module is disabled", () => {
    const out = filterNavGroups(NAV_GROUPS, withDisabled("academics"));
    expect(sectionIds(out)).not.toContain("academics");
    // core siblings remain
    expect(sectionIds(out)).toContain("students");
    expect(sectionIds(out)).toContain("classes");
  });

  it("drops only the disabled panel item, keeping the core section", () => {
    const out = filterNavGroups(NAV_GROUPS, withDisabled("payroll"));
    expect(sectionIds(out)).toContain("staff");
    expect(panelIds(out, "staff")).not.toContain("payroll");
    expect(panelIds(out, "staff")).toContain("staff-all");
  });

  it("keeps core modules even when all toggleable modules are off", () => {
    // Mirror PermissionContext.isModuleEnabled: entries with no moduleKey are
    // always enabled; only listed core keys are on.
    const core = ["dashboard", "students", "staff", "classes", "attendance", "timetable", "settings"];
    const out = filterNavGroups(NAV_GROUPS, (key) => !key || core.includes(key));
    const ids = sectionIds(out);
    expect(ids).toContain("dashboard");
    expect(ids).toContain("students");
    expect(ids).toContain("staff");
    expect(ids).toContain("classes");
    expect(ids).not.toContain("fees");
    expect(ids).not.toContain("academics");
  });

  it("drops an empty group (Finance) when all its modules are off", () => {
    const out = filterNavGroups(NAV_GROUPS, withDisabled("fees", "expenses", "messaging"));
    expect(out.find((g) => g.cat === "Finance & Comms")).toBeUndefined();
  });
});
