import { useState } from "react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownSection, DropdownItem } from "@heroui/react";
import { SlidersHorizontal, Search, X, Check } from "lucide-react";

/**
 * FiltersDropdown - A dropdown component for filter management
 *
 * @param {Object} filters - Filter configuration object with role, department, status, etc.
 * @param {Function} onFilterChange - Callback when a filter changes (key, value)
 * @param {Function} onClearAll - Callback to clear all filters
 * @param {Function} onApply - Callback when filters are applied
 * @param {string} searchQuery - Current search query
 * @param {Function} onSearchChange - Callback when search query changes
 * @param {number} activeFiltersCount - Number of active filters
 * @param {Array} presets - Array of preset filter combinations
 * @param {Function} onPresetClick - Callback when a preset is clicked
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
    placement = "bottom-end"
}) {
    const [isOpen, setIsOpen] = useState(false);

    const handleFilterSelect = (filterKey, value) => {
        onFilterChange(filterKey, value);
    };

    return (
        <Dropdown
            isOpen={isOpen}
            onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) {
                    onApply();
                }
            }}
            placement={placement}
            className="max-w-[320px]"
        >
            <DropdownTrigger>
                <button className="relative flex items-center gap-2 px-3 py-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 text-sm cursor-pointer whitespace-nowrap group">
                    <SlidersHorizontal size={16} className="text-default-400 group-hover:rotate-180 transition-transform duration-300" />
                    <span className="text-default-600">Filters</span>
                    {activeFiltersCount > 0 && (
                        <>
                            <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 bg-primary text-white text-xs font-bold rounded-full">
                                {activeFiltersCount}
                            </span>
                            {onClearAll && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onClearAll();
                                    }}
                                    className="flex items-center justify-center p-1 -mr-1 ml-1 rounded-full hover:bg-default-100 transition-colors"
                                    title="Clear all filters"
                                >
                                    <X size={14} className="text-default-500 hover:text-danger" />
                                </button>
                            )}
                        </>
                    )}
                </button>
            </DropdownTrigger>

            <DropdownMenu
                aria-label="Filter options"
                className="max-h-[500px] overflow-y-auto"
                closeOnSelect={false}
            >
                {/* Presets Section */}
                {presets && presets.length > 0 && (
                    <DropdownSection title="Quick Presets" showDivider>
                        {presets.map((preset) => (
                            <DropdownItem
                                key={preset.id}
                                onPress={() => {
                                    onPresetClick(preset);
                                    setIsOpen(false);
                                }}
                                startContent={preset.applied ? <Check size={14} className="text-primary" /> : null}
                            >
                                {preset.label}
                            </DropdownItem>
                        ))}
                    </DropdownSection>
                )}

                {/* Search Section */}
                {onSearchChange && (
                    <DropdownSection title="Search" showDivider>
                        <DropdownItem
                            key="search-input"
                            textValue="Search"
                            isReadOnly
                            className="py-2"
                        >
                            <div
                                className="flex items-center gap-2 px-3 py-2 bg-default-100 rounded-lg"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Search size={14} className="text-default-400 flex-shrink-0" />
                                <input
                                    type="search"
                                    placeholder="Search..."
                                    className="flex-1 bg-transparent outline-none text-sm min-w-0"
                                    value={searchQuery}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    onFocus={(e) => e.stopPropagation()}
                                    autoComplete="off"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSearchChange("");
                                        }}
                                        className="p-0.5 hover:bg-default-200 rounded flex-shrink-0"
                                    >
                                        <X size={12} className="text-default-400" />
                                    </button>
                                )}
                            </div>
                        </DropdownItem>
                    </DropdownSection>
                )}

                {/* Filters Sections */}
                {Object.entries(filters).map(([filterKey, filterConfig], index) => (
                    <DropdownSection
                        key={filterKey}
                        title={filterConfig.label}
                        showDivider={index < Object.entries(filters).length - 1}
                        className="px-0"
                    >
                        {filterConfig.options.map((option) => {
                            const isSelected = filterConfig.value === option;
                            const count = filterConfig.counts?.[option];
                            const displayLabel = filterConfig.displayLabels?.[option] || option;

                            return (
                                <DropdownItem
                                    key={`${filterKey}-${option}`}
                                    onPress={() => handleFilterSelect(filterKey, option)}
                                    startContent={isSelected ? <Check size={14} className="text-primary" /> : <span className="w-3.5"></span>}
                                    endContent={count === undefined ? null : <span className="text-default-400 text-xs">{count}</span>}
                                    textValue={displayLabel}
                                    className="capitalize"
                                >
                                    {displayLabel}
                                </DropdownItem>
                            );
                        })}
                    </DropdownSection>
                ))}

                {/* Actions Section */}
                {(activeFiltersCount > 0 || onClearAll) && (
                    <DropdownSection>
                        {activeFiltersCount > 0 && (
                            <DropdownItem
                                key="apply"
                                onPress={() => {
                                    onApply();
                                    setIsOpen(false);
                                }}
                                className="text-primary font-medium"
                            >
                                Apply Filters ({activeFiltersCount})
                            </DropdownItem>
                        )}
                        <DropdownItem
                            key="clear-all"
                            onPress={() => {
                                onClearAll();
                                setIsOpen(false);
                            }}
                            className="text-danger"
                            color="danger"
                        >
                            Clear All Filters
                        </DropdownItem>
                    </DropdownSection>
                )}
            </DropdownMenu>
        </Dropdown>
    );
}
