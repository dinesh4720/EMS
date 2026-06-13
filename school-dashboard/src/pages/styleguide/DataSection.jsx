import { useState } from "react";
import { Download, Plus, SlidersHorizontal } from "lucide-react";

import VirtualizedTable from "../../components/common/VirtualizedTable";
import DataTable from "../../components/ui/DataTable";
import FacetedFilter from "../../components/ui/FacetedFilter";
import FilterBar from "../../components/ui/FilterBar";
import FilterPillsBar from "../../components/ui/FilterPillsBar";
import FiltersDropdown from "../../components/ui/FiltersDropdown";
import FiltersPanel from "../../components/ui/FiltersPanel";
import FilterToolbar from "../../components/ui/FilterToolbar";
import SearchBar from "../../components/ui/SearchBar";
import Button from "../../components/ui/Button";

import { Story, StoryGroup } from "./shared";

const TABLE_DATA = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `Student ${i + 1}`,
  class: `Class ${(i % 5) + 1}`,
  score: 60 + (i % 40),
}));

const TABLE_COLUMNS = [
  { key: "id", label: "ID", width: 60 },
  { key: "name", label: "Name", width: 180 },
  { key: "class", label: "Class", width: 120 },
  { key: "score", label: "Score", width: 100, align: "right" },
];

const FACET_OPTIONS = [
  { value: "active", label: "Active", count: 42 },
  { value: "inactive", label: "Inactive", count: 8 },
  { value: "pending", label: "Pending", count: 12 },
];

const DATA_TABLE_COLUMNS = [
  { key: "name", label: "Name", sortable: true },
  { key: "class", label: "Class", sortable: true },
  { key: "score", label: "Score", align: "right", sortable: true },
];

export default function DataSection() {
  const [filterVal, setFilterVal] = useState([]);
  const [search, setSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <>
      <StoryGroup
        id="data-tables"
        title="Tables"
        sub="Virtualized and data tables for large datasets."
      >
        <Story title="VirtualizedTable" layout="plain">
          <div className="border border-divider rounded-lg overflow-hidden" style={{ height: 300 }}>
            <VirtualizedTable
              data={TABLE_DATA}
              columns={TABLE_COLUMNS}
              getRowKey={(item) => item.id}
              renderRow={(item) => (
                <>
                  <td className="px-4 py-3 text-sm text-fg-muted">{item.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-fg">{item.name}</td>
                  <td className="px-4 py-3 text-sm text-fg-muted">{item.class}</td>
                  <td className="px-4 py-3 text-sm text-right tnum">{item.score}%</td>
                </>
              )}
            />
          </div>
        </Story>

        <Story title="DataTable" layout="plain">
          <DataTable
            columns={DATA_TABLE_COLUMNS}
            data={TABLE_DATA.slice(0, 10)}
            keyField="id"
            selectable
            searchable
            searchKeys={["name", "class"]}
          />
        </Story>
      </StoryGroup>

      <StoryGroup
        id="data-filters"
        title="Filters"
        sub="Search, faceted filters, pills, dropdowns, and panels."
      >
        <Story title="FacetedFilter" layout="row">
          <FacetedFilter
            title="Status"
            options={FACET_OPTIONS}
            value={filterVal}
            onChange={setFilterVal}
          />
          <FacetedFilter
            title="Role"
            options={[
              { value: "teacher", label: "Teacher" },
              { value: "admin", label: "Admin" },
            ]}
            value={filterVal}
            onChange={setFilterVal}
          />
        </Story>

        <Story title="FilterBar" layout="plain">
          <FilterBar
            search={<SearchBar value={search} onChange={setSearch} placeholder="Search…" />}
            filters={
              <FacetedFilter
                title="Status"
                options={FACET_OPTIONS}
                value={filterVal}
                onChange={setFilterVal}
              />
            }
            actions={
              <>
                <Button variant="ghost" size="sm" icon={<Download size={14} />}>Export</Button>
                <Button variant="primary" size="sm" icon={<Plus size={14} />}>Add</Button>
              </>
            }
            activeFilterCount={filterVal.length}
            onReset={() => setFilterVal([])}
          />
        </Story>

        <Story title="FilterToolbar" layout="plain">
          <FilterToolbar
            left={
              <>
                <SearchBar value={search} onChange={setSearch} placeholder="Search…" size="sm" />
                <button className="btn btn--sm btn--ghost">
                  <SlidersHorizontal size={13} /> Filters
                </button>
              </>
            }
            right={
              <>
                <Button variant="ghost" size="sm">Export</Button>
                <Button variant="primary" size="sm">Add</Button>
              </>
            }
          />
        </Story>

        <Story title="FilterPillsBar" layout="plain">
          <FilterPillsBar
            filters={{
              class: {
                label: "Class",
                mode: "single",
                value: "3A",
                options: [
                  { value: "all", label: "All" },
                  { value: "3A", label: "3-A" },
                  { value: "3B", label: "3-B" },
                ],
              },
              status: {
                label: "Status",
                mode: "multi",
                value: ["active"],
                options: [
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ],
              },
            }}
            onFilterChange={() => {}}
            onClearAll={() => {}}
          />
        </Story>

        <Story title="FiltersDropdown" layout="plain">
          <div className="flex justify-center">
            <FiltersDropdown
              filters={{
                status: {
                  label: "Status",
                  mode: "multi",
                  value: ["active"],
                  options: [
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ],
                },
              }}
              onFilterChange={() => {}}
              onClearAll={() => {}}
              activeFiltersCount={1}
            />
          </div>
        </Story>

        <Story title="FiltersPanel" layout="plain">
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => setPanelOpen(true)}>
              Open Filters Panel
            </Button>
          </div>
          <FiltersPanel
            isOpen={panelOpen}
            onClose={() => setPanelOpen(false)}
            filters={{
              status: {
                value: ["active"],
                options: ["active", "inactive", "pending"],
                counts: { active: 42, inactive: 8, pending: 12 },
              },
            }}
            onFilterChange={() => {}}
            onClearAll={() => {}}
            activeFiltersCount={1}
          />
        </Story>
      </StoryGroup>
    </>
  );
}
