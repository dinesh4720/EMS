import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Search, Palette, Layers, Layout, Smile, Accessibility } from "lucide-react";

import TokensSection from "./styleguide/TokensSection";
import PrimitivesSection from "./styleguide/PrimitivesSection";
import PatternsSection from "./styleguide/PatternsSection";
import IconsSection from "./styleguide/IconsSection";
import AccessibilityResponsiveSection from "./styleguide/AccessibilityResponsiveSection";

/* ──────────────────────────────────────────────────────────────────
 * Style Guide — single source of truth for tokens, primitives, and
 * patterns. Sticky TOC + theme/density toolbar + searchable content.
 * ────────────────────────────────────────────────────────────────── */

const TOC = [
  {
    title: "Tokens",
    icon: Palette,
    items: [
      { id: "tokens-color-surfaces", label: "Surfaces" },
      { id: "tokens-color-foreground", label: "Foreground" },
      { id: "tokens-color-borders-dividers", label: "Borders & dividers" },
      { id: "tokens-color-accent", label: "Accent" },
      { id: "tokens-color-semantic-success", label: "Semantic — Success" },
      { id: "tokens-color-semantic-warning", label: "Semantic — Warning" },
      { id: "tokens-color-semantic-danger", label: "Semantic — Danger" },
      { id: "tokens-color-semantic-info", label: "Semantic — Info" },
      { id: "tokens-color-glass", label: "Glass" },
      { id: "tokens-typography", label: "Typography" },
      { id: "tokens-radius", label: "Radius" },
      { id: "tokens-shadow", label: "Elevation" },
      { id: "tokens-spacing", label: "Spacing" },
      { id: "tokens-motion", label: "Motion" },
      { id: "tokens-zindex", label: "Z-index" },
      { id: "tokens-density", label: "Density" },
    ],
  },
  {
    title: "Primitives",
    icon: Layers,
    items: [
      { id: "prim-buttons", label: "Buttons" },
      { id: "prim-forms", label: "Forms" },
      { id: "prim-composer-atoms", label: "Composer atoms" },
      { id: "prim-surfaces", label: "Surfaces" },
      { id: "prim-feedback", label: "Feedback & state" },
      { id: "prim-navigation", label: "Navigation" },
      { id: "prim-overlays", label: "Overlays" },
      { id: "prim-prop-tables", label: "Reference" },
    ],
  },
  {
    title: "Patterns",
    icon: Layout,
    items: [
      { id: "pattern-two-pane", label: "Two-pane list" },
      { id: "pattern-composer", label: "Composer overlay" },
      { id: "pattern-detail-pane", label: "Detail pane" },
      { id: "pattern-sticky", label: "Sticky head & foot" },
      { id: "pattern-toolbar", label: "Toolbar + filter" },
      { id: "pattern-tile", label: "KPI tile" },
      { id: "pattern-kpi", label: "KPI strips" },
      { id: "pattern-table", label: "Density table" },
      { id: "pattern-period", label: "Period strip" },
      { id: "pattern-class-tile", label: "Class tile" },
      { id: "pattern-chat", label: "Chat" },
      { id: "pattern-calendar", label: "Calendar grid" },
      { id: "pattern-frosted", label: "Frosted overlay" },
    ],
  },
  {
    title: "Library",
    icon: Smile,
    items: [{ id: "icons", label: "Icons" }],
  },
  {
    title: "Quality",
    icon: Accessibility,
    items: [
      { id: "a11y", label: "Accessibility" },
      { id: "responsive", label: "Responsive" },
    ],
  },
];

function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (elements.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target?.id) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-100px 0px -65% 0px", threshold: 0.01 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);

  return active;
}

function Toolbar({ search, onSearchChange, density, onDensityChange }) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="sg-toolbar">
      <div style={{ minWidth: 0 }}>
        <h1 className="sg-toolbar__title">Style guide</h1>
        <p className="sg-toolbar__sub">Tokens · primitives · patterns · copy-paste reference</p>
      </div>
      <div style={{ flex: 1, minWidth: 0 }} />

      <div className="sg-toolbar__search">
        <Search size={13} style={{ color: "var(--fg-subtle)" }} aria-hidden />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter sections…"
          aria-label="Filter style guide sections"
        />
      </div>

      <div className="sg-toolbar__group" role="group" aria-label="Density">
        <button
          type="button"
          className={`sg-toolbar__chip${density === "default" ? " is-active" : ""}`}
          onClick={() => onDensityChange("default")}
        >
          Default
        </button>
        <button
          type="button"
          className={`sg-toolbar__chip${density === "compact" ? " is-active" : ""}`}
          onClick={() => onDensityChange("compact")}
        >
          Compact
        </button>
      </div>

      <div className="sg-toolbar__group" role="group" aria-label="Theme">
        <button
          type="button"
          className={`sg-toolbar__chip${!isDark ? " is-active" : ""}`}
          onClick={() => setTheme("light")}
          aria-label="Light theme"
        >
          <Sun size={11} aria-hidden /> Light
        </button>
        <button
          type="button"
          className={`sg-toolbar__chip${isDark ? " is-active" : ""}`}
          onClick={() => setTheme("dark")}
          aria-label="Dark theme"
        >
          <Moon size={11} aria-hidden /> Dark
        </button>
      </div>
    </div>
  );
}

function Toc({ filter }) {
  const allIds = useMemo(
    () => TOC.flatMap((g) => g.items.map((i) => i.id)),
    []
  );
  const active = useActiveSection(allIds);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return TOC;
    return TOC.map((group) => ({
      ...group,
      items: group.items.filter(
        (i) =>
          i.label.toLowerCase().includes(q) ||
          group.title.toLowerCase().includes(q)
      ),
    })).filter((g) => g.items.length > 0);
  }, [filter]);

  return (
    <nav className="sg-toc" aria-label="Style guide sections">
      {filtered.map((group) => {
        const Icon = group.icon;
        return (
          <div key={group.title} className="sg-toc__group">
            <h3 className="sg-toc__group-title">
              <Icon
                size={11}
                aria-hidden
                style={{ display: "inline-block", marginRight: 6, verticalAlign: "-1px" }}
              />
              {group.title}
            </h3>
            <ul className="sg-toc__list">
              {group.items.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className={`sg-toc__link${active === item.id ? " is-active" : ""}`}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      {filtered.length === 0 && (
        <p style={{ fontSize: 12, color: "var(--fg-subtle)", padding: "8px 12px" }}>
          No sections match.
        </p>
      )}
    </nav>
  );
}

export default function StyleGuide() {
  const [search, setSearch] = useState("");
  const [density, setDensity] = useState("default");

  useEffect(() => {
    const root = document.body;
    if (density === "compact") root.setAttribute("data-density", "compact");
    else root.removeAttribute("data-density");
    return () => root.removeAttribute("data-density");
  }, [density]);

  return (
    <div className="page" style={{ paddingBottom: 64 }}>
      <Toolbar
        search={search}
        onSearchChange={setSearch}
        density={density}
        onDensityChange={setDensity}
      />

      <div className="sg-shell">
        <Toc filter={search} />
        <main className="sg-content">
          <TokensSection />
          <PrimitivesSection />
          <PatternsSection />
          <IconsSection />
          <AccessibilityResponsiveSection />
        </main>
      </div>
    </div>
  );
}
