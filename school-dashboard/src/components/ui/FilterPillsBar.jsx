import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Plus, X, Check } from "lucide-react";

/**
 * FilterPillsBar — cascading hover menu filter panel.
 *
 * Layout:
 *   - "+ Add filter" button always on the left
 *   - Active filter pills to the right
 *   - Clicking any pill or "+ Add filter" opens a unified panel
 *   - Panel: left column = categories, right column = options for hovered category
 *   - Hover a category → its options appear on the right (Chrome menu style)
 *   - Single-select (class) uses radio circles, multi-select uses checkboxes
 */
export default function FilterPillsBar({
    filters = {},
    onFilterChange,
    onClearAll,
    activeFiltersCount = 0,
    rightActions = null,
}) {
    const [panelOpen, setPanelOpen] = useState(false);
    const [hoveredKey, setHoveredKey] = useState(null);
    const triggerRef = useRef(null);
    const panelRef = useRef(null);

    const filterEntries = useMemo(() => Object.entries(filters), [filters]);

    const activeFilters = useMemo(
        () => filterEntries.filter(([, cfg]) => {
            if (cfg.mode === "single") return cfg.value && cfg.value !== "all";
            return cfg.value && cfg.value.length > 0;
        }),
        [filterEntries]
    );

    // Default hover to first category when panel opens
    useEffect(() => {
        if (panelOpen && !hoveredKey && filterEntries.length > 0) {
            setHoveredKey(filterEntries[0][0]);
        }
    }, [panelOpen, filterEntries, hoveredKey]);

    const closePanel = useCallback(() => {
        setPanelOpen(false);
        setHoveredKey(null);
    }, []);

    // Click outside → close panel
    useEffect(() => {
        if (!panelOpen) return;
        const handler = (e) => {
            const panel = panelRef.current;
            const trigger = triggerRef.current;
            if (panel && !panel.contains(e.target) && trigger && !trigger.contains(e.target)) {
                closePanel();
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [panelOpen, closePanel]);

    // Escape → close
    useEffect(() => {
        if (!panelOpen) return;
        const handler = (e) => {
            if (e.key === "Escape") closePanel();
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [panelOpen, closePanel]);

    const handleSelect = (key, value) => {
        onFilterChange(key, value);
    };

    const handleRemove = (key) => {
        onFilterChange(key, "all");
    };

    const hoveredConfig = hoveredKey ? filters[hoveredKey] : null;

    const openPanel = () => setPanelOpen(true);

    return (
        <div className="filter-pills-bar">
            <div className="filter-pills" ref={triggerRef}>
                {/* + Add filter — always leftmost */}
                <button
                    type="button"
                    className={`filter-pill filter-pill--add ${panelOpen ? "is-open" : ""}`}
                    onClick={openPanel}
                >
                    <Plus size={12} />
                    <span>Add filter</span>
                </button>

                {/* Active pills */}
                {activeFilters.map(([key, cfg]) => (
                    <ActivePill
                        key={key}
                        filterKey={key}
                        config={cfg}
                        onClick={openPanel}
                        onRemove={handleRemove}
                    />
                ))}

                {/* Clear all */}
                {activeFiltersCount > 0 && (
                    <button
                        type="button"
                        className="filter-pills__clear"
                        onClick={onClearAll}
                    >
                        Clear all
                    </button>
                )}
            </div>

            {rightActions && (
                <div className="filter-pills-bar__right">
                    {rightActions}
                </div>
            )}

            {/* Unified cascading panel */}
            {panelOpen && (
                <div className="filter-cascade" ref={panelRef} role="dialog" aria-label="Filters">
                    {/* Left: categories */}
                    <div className="filter-cascade__left">
                        {filterEntries.map(([key, cfg]) => {
                            const isActive = cfg.mode === "single"
                                ? cfg.value && cfg.value !== "all"
                                : cfg.value && cfg.value.length > 0;
                            const isHovered = hoveredKey === key;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    className={`filter-cascade__cat ${isHovered ? "is-hovered" : ""} ${isActive ? "is-active" : ""}`}
                                    onMouseEnter={() => setHoveredKey(key)}
                                    onClick={() => setHoveredKey(key)}
                                >
                                    <span className="filter-cascade__cat-label">{cfg.label}</span>
                                    {isActive && (
                                        <span className="filter-cascade__cat-dot" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Right: options for hovered category */}
                    <div className="filter-cascade__right">
                        {hoveredConfig ? (
                            <OptionPanel
                                filterKey={hoveredKey}
                                config={hoveredConfig}
                                onSelect={handleSelect}
                            />
                        ) : (
                            <div className="filter-cascade__empty">Hover a category to see options</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Active pill in the bar ── */
function ActivePill({ filterKey, config, onClick, onRemove }) {
    const displayValue = useMemo(() => {
        if (config.mode === "single") {
            if (!config.value || config.value === "all") return null;
            return config.displayLabels?.[config.value] || config.value;
        }
        // multi-select
        if (!config.value || config.value.length === 0) return null;
        if (config.value.length === 1) {
            return config.displayLabels?.[config.value[0]] || config.value[0];
        }
        if (config.value.length === 2) {
            const v1 = config.displayLabels?.[config.value[0]] || config.value[0];
            const v2 = config.displayLabels?.[config.value[1]] || config.value[1];
            return `${v1}, ${v2}`;
        }
        return `${config.value.length} selected`;
    }, [config.value, config.displayLabels, config.mode]);

    return (
        <button type="button" className="filter-pill" onClick={onClick}>
            <span className="filter-pill__dot" />
            <span className="filter-pill__cat">{config.label}</span>
            <span className="filter-pill__val">{displayValue}</span>
            <span
                className="filter-pill__x"
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove(filterKey);
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        onRemove(filterKey);
                    }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Remove ${config.label} filter`}
            >
                <X size={11} />
            </span>
        </button>
    );
}

/* ── Right-side option panel for a category ── */
function OptionPanel({ filterKey, config, onSelect }) {
    const isMulti = config.mode === "multi";
    const isSelected = (option) => {
        if (isMulti) return config.value.includes(option);
        return config.value === option;
    };

    return (
        <>
            <div className="filter-cascade__opts-title">{config.label}</div>
            <div className="filter-cascade__opts-body">
                {/* Clear / All option */}
                <OptionRow
                    label={isMulti ? "All (clear selection)" : "All Classes"}
                    isSelected={isMulti ? config.value.length === 0 : config.value === "all"}
                    isMulti={isMulti}
                    onClick={() => onSelect(filterKey, "all")}
                />
                {config.options.map((option) => (
                    <OptionRow
                        key={option}
                        label={config.displayLabels?.[option] || option}
                        count={config.counts?.[option]}
                        isSelected={isSelected(option)}
                        isMulti={isMulti}
                        onClick={() => onSelect(filterKey, option)}
                    />
                ))}
            </div>
        </>
    );
}

/* ── Single option row ── */
function OptionRow({ label, count, isSelected, isMulti, onClick }) {
    return (
        <button
            type="button"
            className={`filter-cascade__option ${isSelected ? "is-selected" : ""}`}
            onClick={onClick}
        >
            <span
                className={isMulti ? "filter-cascade__check" : "filter-cascade__radio"}
                style={
                    isMulti
                        ? {
                            borderColor: isSelected ? "var(--accent)" : "var(--border-strong)",
                            background: isSelected ? "var(--accent)" : "transparent",
                        }
                        : {
                            borderColor: isSelected ? "var(--accent)" : "var(--border-strong)",
                        }
                }
            >
                {isMulti && isSelected && <Check size={9} strokeWidth={3} color="white" />}
                {!isMulti && isSelected && <span className="filter-cascade__radio-inner" />}
            </span>
            <span className="filter-cascade__option-label">{label}</span>
            {count !== undefined && (
                <span className="mono tnum" style={{ fontSize: 11, color: "var(--fg-faint)", marginLeft: "auto" }}>
                    {count}
                </span>
            )}
        </button>
    );
}
