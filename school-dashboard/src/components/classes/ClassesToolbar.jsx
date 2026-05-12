import ToolbarSearch from "../ui/ToolbarSearch";

// Toolbar for By-class view. Search + segmented filter.
//   "Mine" segment is APPENDED only when currentUser teaches at least one class.
//   Hide, don't relabel.
const BASE_FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active today" },
  { key: "attention", label: "Needs attention" },
];

export default function ClassesToolbar({
  query,
  onQueryChange,
  filter,
  onFilterChange,
  showMineFilter = false,
}) {
  const filters = showMineFilter
    ? [...BASE_FILTERS, { key: "mine", label: "Mine" }]
    : BASE_FILTERS;

  return (
    <div className="toolbar" style={{ borderBottom: "none", paddingTop: 0 }}>
      <ToolbarSearch
        value={query}
        onChange={onQueryChange}
        urlParam="q"
        placeholder="Search classes…"
        ariaLabel="Search classes"
        style={{ flex: 1, maxWidth: 320 }}
      />

      <div className="seg" role="tablist" aria-label="Filter classes">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={filter === f.key}
            className={`seg__btn${filter === f.key ? " is-active" : ""}`}
            onClick={() => onFilterChange?.(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
