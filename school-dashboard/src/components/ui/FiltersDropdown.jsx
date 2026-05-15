import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { SlidersHorizontal, Search, X, Check } from "lucide-react";
import { useTranslation } from 'react-i18next';

/**
 * FiltersDropdown — two-pane filter panel.
 *
 * Layout:
 *   - Left sidebar: compact category headings
 *   - Right pane:  scrollable filter options
 *   - Header:      title + clear + close
 *   - Footer:      active count + Done
 */
export default function FiltersDropdown({
    filters = {},
    onFilterChange,
    onClearAll,
    onApply = () => {},
    searchQuery = "",
    onSearchChange,
    activeFiltersCount = 0,
    presets = [],
    onPresetClick,
}) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const contentRef = useRef(null);
    const groupRefs = useRef({});

    const filterEntries = useMemo(() => Object.entries(filters), [filters]);
    const [activeCategory, setActiveCategory] = useState(
        filterEntries[0]?.[0] ?? null
    );

    const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
    const close = useCallback(() => {
        setIsOpen(false);
        onApply();
    }, [onApply]);

    // Reset active category when opening
    useEffect(() => {
        if (isOpen && filterEntries.length > 0) {
            setActiveCategory(filterEntries[0][0]);
        }
    }, [isOpen, filterEntries]);

    // Click outside → close
    useEffect(() => {
        if (!isOpen) return;
        const onDocClick = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                close();
            }
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, [isOpen, close]);

    // Escape → close
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => {
            if (e.key === "Escape") close();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [isOpen, close]);

    // Scroll right pane to selected category
    const scrollToCategory = useCallback((key) => {
        setActiveCategory(key);
        const el = groupRefs.current[key];
        const content = contentRef.current;
        if (el && content) {
            content.scrollTo({ top: el.offsetTop - 8, behavior: "smooth" });
        }
    }, []);

    // Scroll tracking: update active category as user scrolls the right pane
    useEffect(() => {
        if (!isOpen || !contentRef.current || filterEntries.length === 0) return;
        const content = contentRef.current;

        const onScroll = () => {
            const scrollTop = content.scrollTop;
            // Use a point 20% down from the top of the viewport as the "active" marker
            const marker = scrollTop + content.clientHeight * 0.2;

            let bestKey = filterEntries[0][0];
            let bestDist = Infinity;

            filterEntries.forEach(([key]) => {
                const el = groupRefs.current[key];
                if (!el) return;
                const dist = Math.abs(el.offsetTop - marker);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestKey = key;
                }
            });

            setActiveCategory(bestKey);
        };

        content.addEventListener("scroll", onScroll, { passive: true });
        // Initial calculation after a tick so refs are populated
        const raf = requestAnimationFrame(onScroll);
        return () => {
            content.removeEventListener("scroll", onScroll);
            cancelAnimationFrame(raf);
        };
    }, [isOpen, filterEntries]);

    const handleFilterSelect = useCallback((filterKey, value) => {
        onFilterChange(filterKey, value);
    }, [onFilterChange]);

    return (
        <div className="filter-dropdown" ref={containerRef}>
            <button
                type="button"
                className="btn relative"
                onClick={toggle}
                aria-haspopup="dialog"
                aria-expanded={isOpen}
            >
                <SlidersHorizontal size={13} aria-hidden />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                    <span
                        className="chip chip--accent"
                        style={{ position: "absolute", top: -5, right: -5, height: 16, padding: "0 5px", fontSize: 10 }}
                    >
                        {activeFiltersCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div
                    className="filter-dropdown__panel"
                    role="dialog"
                    aria-label="Filters"
                >
                    {/* Header */}
                    <div className="filter-dropdown__head">
                        <span className="filter-dropdown__head-title">Filters</span>
                        <div className="row gap-2">
                            {activeFiltersCount > 0 && (
                                <button
                                    type="button"
                                    className="btn btn--ghost btn--sm"
                                    onClick={() => {
                                        onClearAll();
                                        close();
                                    }}
                                >
                                    Clear all
                                </button>
                            )}
                            <button
                                type="button"
                                className="iconbtn"
                                style={{ width: 24, height: 24 }}
                                onClick={close}
                                aria-label="Close filters"
                            >
                                <X size={13} />
                            </button>
                        </div>
                    </div>

                    {/* Presets */}
                    {presets.length > 0 && (
                        <div className="filter-dropdown__presets">
                            {presets.map((preset) => (
                                <button
                                    key={preset.id}
                                    type="button"
                                    className={`chip ${preset.applied ? "chip--accent" : ""}`}
                                    onClick={() => {
                                        onPresetClick(preset);
                                        close();
                                    }}
                                >
                                    {preset.applied && <Check size={11} aria-hidden />}
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Search */}
                    {onSearchChange && (
                        <div className="filter-dropdown__search">
                            <label className="toolbar__search" style={{ width: "100%" }}>
                                <Search size={13} style={{ color: "var(--fg-subtle)", flexShrink: 0 }} aria-hidden />
                                <input
                                    type="search"
                                    placeholder={t('common.searchPlaceholder')}
                                    value={searchQuery}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    autoComplete="off"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        className="iconbtn"
                                        style={{ width: 18, height: 18 }}
                                        onClick={() => onSearchChange("")}
                                        aria-label="Clear search"
                                    >
                                        <X size={12} aria-hidden />
                                    </button>
                                )}
                            </label>
                        </div>
                    )}

                    {/* Two-pane body: sidebar + scrollable content */}
                    <div className="filter-dropdown__body">
                        {/* Left sidebar — compact category headings */}
                        <div className="filter-dropdown__sidebar" role="tablist" aria-label="Filter categories">
                            {filterEntries.map(([filterKey, filterConfig]) => {
                                const isActive = activeCategory === filterKey;
                                const hasValue = filterConfig.value !== undefined && filterConfig.value !== null && filterConfig.value !== "";
                                return (
                                    <button
                                        key={filterKey}
                                        type="button"
                                        role="tab"
                                        aria-selected={isActive}
                                        className={`filter-dropdown__cat ${isActive ? "is-active" : ""} ${hasValue ? "has-value" : ""}`}
                                        onClick={() => scrollToCategory(filterKey)}
                                    >
                                        <span className="filter-dropdown__cat-label">{filterConfig.label}</span>
                                        {hasValue && (
                                            <span className="filter-dropdown__cat-dot" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Right pane — scrollable filter options */}
                        <div className="filter-dropdown__content" ref={contentRef}>
                            {filterEntries.map(([filterKey, filterConfig]) => (
                                <div
                                    key={filterKey}
                                    className="filter-dropdown__section"
                                    data-key={filterKey}
                                    ref={(el) => { groupRefs.current[filterKey] = el; }}
                                >
                                    <div className="filter-dropdown__section-title">{filterConfig.label}</div>
                                    <div className="filter-dropdown__section-body">
                                        {filterConfig.options.map((option) => {
                                            const isSelected = filterConfig.value === option;
                                            const count = filterConfig.counts?.[option];
                                            const displayLabel = filterConfig.displayLabels?.[option] || option;
                                            return (
                                                <button
                                                    key={`${filterKey}-${option}`}
                                                    type="button"
                                                    className={`filter-dropdown__option ${isSelected ? "is-selected" : ""}`}
                                                    onClick={() => handleFilterSelect(filterKey, option)}
                                                >
                                                    <span
                                                        className="filter-dropdown__check"
                                                        style={{
                                                            borderColor: isSelected ? "var(--accent)" : "var(--border-strong)",
                                                            background: isSelected ? "var(--accent)" : "transparent",
                                                        }}
                                                    >
                                                        {isSelected && <Check size={9} strokeWidth={3} color="white" />}
                                                    </span>
                                                    <span className="filter-dropdown__option-label">{displayLabel}</span>
                                                    {count !== undefined && (
                                                        <span className="mono tnum" style={{ fontSize: 11, color: "var(--fg-faint)", marginLeft: "auto" }}>
                                                            {count}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="filter-dropdown__foot">
                        {activeFiltersCount > 0 ? (
                            <>
                                <span className="mono tnum" style={{ fontSize: 12, color: "var(--fg-subtle)" }}>
                                    {activeFiltersCount} active
                                </span>
                                <button
                                    type="button"
                                    className="btn btn--accent btn--sm"
                                    onClick={close}
                                >
                                    Done
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                className="btn btn--sm"
                                style={{ marginLeft: "auto" }}
                                onClick={close}
                            >
                                Done
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
