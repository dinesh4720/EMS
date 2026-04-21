import TokensSection from "./styleguide/TokensSection";
import PrimitivesSection from "./styleguide/PrimitivesSection";
import DataPrimitivesSection from "./styleguide/DataPrimitivesSection";
import DataTableSection from "./styleguide/DataTableSection";
import SearchFilterSection from "./styleguide/SearchFilterSection";
import LayoutFeedbackSection from "./styleguide/LayoutFeedbackSection";
import DashboardWidgetsSection from "./styleguide/DashboardWidgetsSection";
import CommandPaletteSection from "./styleguide/CommandPaletteSection";
import PatternsSection from "./styleguide/PatternsSection";

const TOC = [
  {
    title: "Tokens",
    items: [
      { id: "tokens-colors", label: "Colors" },
      { id: "tokens-chart", label: "Chart palette" },
      { id: "tokens-typography", label: "Typography" },
      { id: "tokens-type-scale", label: "Type scale" },
      { id: "tokens-weight", label: "Font weight" },
      { id: "tokens-radius", label: "Radius" },
      { id: "tokens-shadows", label: "Shadows" },
      { id: "tokens-spacing", label: "Spacing" },
      { id: "tokens-motion", label: "Motion" },
    ],
  },
  {
    title: "Primitives",
    items: [
      { id: "primitives-buttons", label: "Button" },
      { id: "primitives-icon-button", label: "IconButton" },
      { id: "primitives-card", label: "Card" },
      { id: "primitives-tabs", label: "Tabs" },
      { id: "primitives-statcard", label: "StatCard" },
      { id: "primitives-status", label: "StatusBadge" },
      { id: "primitives-badge", label: "Badge" },
      { id: "primitives-avatar", label: "Avatar" },
      { id: "primitives-chip", label: "Chip" },
      { id: "primitives-tag", label: "Tag" },
      { id: "primitives-divider", label: "Divider" },
      { id: "primitives-alert", label: "Alert" },
      { id: "primitives-progress", label: "Progress" },
      { id: "primitives-minimalcard", label: "MinimalCard (legacy)" },
      { id: "primitives-input", label: "Input" },
      { id: "primitives-textarea", label: "Textarea" },
      { id: "primitives-select", label: "Select" },
      { id: "primitives-checkbox", label: "Checkbox" },
      { id: "primitives-radio", label: "Radio" },
      { id: "primitives-switch", label: "Switch" },
      { id: "primitives-form-system", label: "Form system" },
      { id: "primitives-file-upload", label: "FileUpload" },
      { id: "primitives-image-upload", label: "ImageUpload" },
      { id: "primitives-inputs", label: "Form inputs (legacy)" },
      { id: "primitives-search", label: "SearchInput" },
      { id: "primitives-pageheader", label: "PageHeader" },
      { id: "primitives-sectionheading", label: "SectionHeading" },
      { id: "primitives-modal", label: "Modal" },
      { id: "primitives-dialog", label: "Dialog" },
      { id: "primitives-drawer", label: "Drawer" },
      { id: "primitives-tooltip", label: "Tooltip" },
      { id: "primitives-popover", label: "Popover" },
      { id: "primitives-dropdownmenu", label: "DropdownMenu" },
      { id: "primitives-toast", label: "Toast" },
      { id: "primitives-datatable", label: "DataTable" },
    ],
  },
  {
    title: "Search & filters",
    items: [
      { id: "primitives-searchbar", label: "SearchBar" },
      { id: "primitives-combobox", label: "Combobox" },
      { id: "primitives-multiselect", label: "MultiSelect" },
      { id: "primitives-faceted", label: "FacetedFilter" },
      { id: "primitives-daterange", label: "DateRangePicker" },
      { id: "primitives-filterbar", label: "FilterBar" },
    ],
  },
  {
    title: "Dashboard widgets",
    items: [
      { id: "primitives-kpitile", label: "KpiTile" },
      { id: "primitives-chartcard", label: "ChartCard" },
      { id: "primitives-timeline", label: "Timeline" },
      { id: "primitives-activityfeed", label: "ActivityFeed" },
      { id: "primitives-quickaction", label: "QuickActionTile" },
    ],
  },
  {
    title: "Layout & feedback",
    items: [
      { id: "layout-pageshell", label: "PageShell" },
      { id: "layout-breadcrumbs", label: "Breadcrumbs" },
      { id: "layout-tabs", label: "Tabs" },
      { id: "layout-empty", label: "EmptyState" },
      { id: "layout-error", label: "ErrorState" },
      { id: "layout-skeleton", label: "Skeleton" },
      { id: "layout-states", label: "Composed states" },
      { id: "layout-command-palette", label: "CommandPalette (⌘K)" },
    ],
  },
  {
    title: "Patterns",
    items: [
      { id: "patterns-four-states", label: "Loading / empty / error / success" },
      { id: "patterns-responsive", label: "Responsive grid" },
      { id: "patterns-focus", label: "Focus states" },
    ],
  },
];

function Toc() {
  return (
    <nav
      aria-label="Style guide table of contents"
      className="hidden lg:block sticky top-6 self-start text-sm space-y-5"
    >
      {TOC.map((group) => (
        <div key={group.title} className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-zinc-500">
            {group.title}
          </h3>
          <ul className="space-y-1 border-l border-gray-100 dark:border-zinc-800">
            {group.items.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="block pl-3 -ml-px border-l border-transparent text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:border-gray-300 dark:hover:border-zinc-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-r"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SectionHeader({ id, title, description }) {
  return (
    <header id={id} className="space-y-2 scroll-mt-24">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h2>
      {description ? (
        <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-2xl">{description}</p>
      ) : null}
    </header>
  );
}

export default function StyleGuide() {
  return (
    <div className="animate-fade-in">
      <div className="mx-auto max-w-7xl px-6 py-10 space-y-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Design Style Guide</h1>
          <p className="text-gray-500 dark:text-zinc-400 max-w-2xl">
            Living documentation for the design system — tokens, primitives, and patterns used across
            the school dashboard. All new UI should compose these pieces rather than style ad-hoc.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-10">
          <Toc />

          <div className="space-y-16 min-w-0">
            <div className="space-y-6">
              <SectionHeader
                id="tokens"
                title="Tokens"
                description="CSS custom properties in src/index.css and src/theme/colors.js. Reference these via Tailwind utilities or var(--token) in custom CSS."
              />
              <TokensSection />
            </div>

            <div className="space-y-6">
              <SectionHeader
                id="primitives"
                title="Primitives"
                description="Reusable building blocks exported from src/components/ui. Extend here — never duplicate."
              />
              <PrimitivesSection />
              <DataPrimitivesSection />
              <DataTableSection />
            </div>

            <div className="space-y-6">
              <SectionHeader
                id="search-filters"
                title="Search & filters"
                description="Composable primitives for list and table toolbars — search, combobox, multi-select, faceted filter, date range, and the FilterBar layout that ties them together."
              />
              <SearchFilterSection />
            </div>

            <div className="space-y-6">
              <SectionHeader
                id="dashboard-widgets"
                title="Dashboard widgets"
                description="Composable building blocks for dashboards and overview screens — metric tiles, chart containers, timelines, activity feeds, and quick-action entry points. All primitives handle the four data states where applicable."
              />
              <DashboardWidgetsSection />
            </div>

            <div className="space-y-6">
              <SectionHeader
                id="layout-feedback"
                title="Layout & feedback"
                description="Page-level structure and feedback primitives. Every data-fetching screen must render all four states — skeleton, empty, error, success — inside a PageShell."
              />
              <LayoutFeedbackSection />
              <CommandPaletteSection />
            </div>

            <div className="space-y-6">
              <SectionHeader
                id="patterns"
                title="Patterns"
                description="Common compositions every data-fetching screen should implement."
              />
              <PatternsSection />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
