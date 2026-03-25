import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    Button,
    Chip,
    Input,
    Divider,
    ScrollShadow
} from "@heroui/react";
import {
    X,
    Search,
    SlidersHorizontal,
    Check,
    ChevronDown,
    ChevronUp,
    RotateCcw,
    Sparkles
} from "lucide-react";
import { useTranslation } from 'react-i18next';

/**
 * FiltersPanel - A modern, glass-morphism filter panel component
 *
 * @component
 * @example
 * ```jsx
 * <FiltersPanel
 *   isOpen={true}
 *   onClose={() => {}}
 *   filters={{
 *     status: { value: 'active', options: ['active', 'inactive'], counts: { active: 45, inactive: 12 } },
 *     role: { value: 'all', options: ['Teacher', 'Admin'], counts: { Teacher: 30, Admin: 15 } }
 *   }}
 *   onFilterChange={(key, value) => console.log(key, value)}
 *   onClearAll={() => console.log('cleared')}
 *   searchQuery=""
 *   onSearchChange={(value) => console.log(value)}
 *   activeFiltersCount={2}
 * />
 * ```
 */

const FiltersPanel = ({
    isOpen = false,
    onClose = () => { },
    filters = {},
    onFilterChange = () => { },
    onClearAll = () => { },
    searchQuery = "",
    onSearchChange = () => { },
    activeFiltersCount = 0,
    presets = [],
    onPresetClick = () => { },
    title = "Filters",
    placement = "right",
    size = "md"
}) => {
    const { t } = useTranslation();
    // Local state for collapsible sections
    const [expandedSections, setExpandedSections] = useState(() => {
        const initial = {};
        Object.keys(filters).forEach(key => {
            initial[key] = true; // All sections expanded by default
        });
        return initial;
    });

    // Toggle section expansion
    const toggleSection = useCallback((key) => {
        setExpandedSections(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    }, []);

    // Handle filter value change
    const handleFilterChange = useCallback((filterKey, value) => {
        onFilterChange(filterKey, value);
    }, [onFilterChange]);

    // Clear all filters with confirmation
    const handleClearAll = useCallback(() => {
        if (activeFiltersCount > 0) {
            onClearAll();
        }
    }, [activeFiltersCount, onClearAll]);

    // Calculate active filters array for display
    const activeFiltersList = useMemo(() => {
        const list = [];
        Object.entries(filters).forEach(([key, config]) => {
            if (config.value && config.value !== 'all') {
                const option = config.options?.find(opt => opt === config.value);
                if (option) {
                    list.push({
                        key,
                        label: config.label || key,
                        value: config.value,
                        displayValue: config.displayLabels?.[config.value] || config.value
                    });
                }
            }
        });
        return list;
    }, [filters]);

    // Animation variants
    const variants = {
        hidden: { opacity: 0, x: placement === "right" ? 20 : -20 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: placement === "right" ? 20 : -20 }
    };

    const sectionVariants = {
        hidden: { opacity: 0, height: 0 },
        visible: { opacity: 1, height: "auto" },
        exit: { opacity: 0, height: 0 }
    };

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            placement={placement}
            size={size}
            classNames={{
                wrapper: "backdrop-blur-sm bg-black/20",
                base: "bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-xl border-l border-default-200/50 shadow-2xl",
                header: "border-b border-default-200/50 bg-gradient-to-r from-default-50/50 to-transparent",
                body: "p-0",
                footer: "border-t border-default-200/50 bg-default-50/30"
            }}
            motionProps={{
                initial: { opacity: 0, x: placement === "right" ? 400 : -400 },
                animate: { opacity: 1, x: 0 },
                exit: { opacity: 0, x: placement === "right" ? 400 : -400 },
                transition: {
                    type: "spring",
                    damping: 25,
                    stiffness: 200
                }
            }}
        >
            <DrawerContent className="flex flex-col h-full">
                {/* Header */}
                <DrawerHeader className="flex flex-col gap-3 px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                                <SlidersHorizontal size={20} className="text-primary" />
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-lg font-semibold text-foreground tracking-tight">{title}</h2>
                                {activeFiltersCount > 0 && (
                                    <p className="text-xs text-default-500">
                                        {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} applied
                                    </p>
                                )}
                            </div>
                        </div>
                        <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            className="rounded-full hover:bg-default-200 transition-colors"
                            onPress={onClose}
                        >
                            <X size={18} className="text-default-500" />
                        </Button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <Input
                            placeholder={t('components.search')}
                            value={searchQuery}
                            onValueChange={onSearchChange}
                            startContent={
                                <Search size={16} className="text-default-400 group-focus-within:text-primary transition-colors" />
                            }
                            endContent={
                                searchQuery && (
                                    <button
                                        onClick={() => onSearchChange("")}
                                        className="p-1 hover:bg-default-200 rounded-full transition-colors"
                                    >
                                        <X size={14} className="text-default-400" />
                                    </button>
                                )
                            }
                            classNames={{
                                base: "relative",
                                input: "text-sm",
                                inputWrapper: "bg-default-100/80 backdrop-blur-sm border border-default-200/50 hover:border-primary/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200 shadow-sm"
                            }}
                        />
                    </div>
                </DrawerHeader>

                {/* Body */}
                <ScrollShadow className="flex-1 px-6 py-4 custom-scrollbar scrollbar-auto-hide">
                    <div className="flex flex-col gap-5">
                        {/* Quick Presets */}
                        {presets.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="flex flex-col gap-2"
                            >
                                <div className="flex items-center gap-2 px-1">
                                    <Sparkles size={14} className="text-primary" />
                                    <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">{t('components.quickPresets')}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {presets.map((preset, index) => (
                                        <motion.button
                                            key={preset.id || index}
                                            onClick={() => onPresetClick(preset)}
                                            className={`
                                                relative overflow-hidden px-3 py-2.5 rounded-xl text-left text-xs font-medium
                                                transition-all duration-200 border
                                                ${preset.applied
                                                    ? 'bg-primary/10 border-primary/50 text-primary shadow-sm shadow-primary/20'
                                                    : 'bg-default-50/50 border-default-200 text-default-600 hover:border-primary/30 hover:bg-default-100'
                                                }
                                            `}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <span className="relative z-10 flex items-center gap-2">
                                                {preset.icon && <span>{preset.icon}</span>}
                                                {preset.label}
                                            </span>
                                            {preset.applied && (
                                                <motion.div
                                                    layoutId="activePreset"
                                                    className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5"
                                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                />
                                            )}
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Active Filters Display */}
                        {activeFiltersList.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="flex flex-col gap-2"
                            >
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">{t('components.activeFilters')}</span>
                                    <button
                                        onClick={handleClearAll}
                                        className="text-xs text-danger hover:text-danger-700 font-medium flex items-center gap-1 transition-colors"
                                    >
                                        <RotateCcw size={12} />
                                        Clear All
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <AnimatePresence mode="popLayout">
                                        {activeFiltersList.map((filter) => (
                                            <motion.div
                                                key={filter.key}
                                                layout
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                            >
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    color="primary"
                                                    onClose={() => handleFilterChange(filter.key, 'all')}
                                                    classNames={{
                                                        base: "bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 shadow-sm",
                                                        content: "text-xs font-medium",
                                                        closeBtn: "text-primary hover:bg-primary/20"
                                                    }}
                                                >
                                                    <span className="text-default-500">{filter.label}:</span>{" "}
                                                    <span className="font-semibold">{filter.displayValue}</span>
                                                </Chip>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                                <Divider className="my-2 bg-default-200/50" />
                            </motion.div>
                        )}

                        {/* Filter Sections */}
                        <div className="flex flex-col gap-4">
                            {Object.entries(filters).map(([filterKey, config], index) => (
                                <motion.div
                                    key={filterKey}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + (index * 0.05) }}
                                    className="flex flex-col gap-3 bg-default-50/30 rounded-2xl p-4 border border-default-200/50 hover:border-default-300/50 transition-colors"
                                >
                                    {/* Section Header */}
                                    <button
                                        onClick={() => toggleSection(filterKey)}
                                        className="flex items-center justify-between w-full text-left group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-foreground capitalize">
                                                {config.label || filterKey}
                                            </span>
                                            {config.value && config.value !== 'all' && (
                                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                            )}
                                        </div>
                                        <motion.div
                                            animate={{ rotate: expandedSections[filterKey] ? 180 : 0 }}
                                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                            className="p-1 rounded-lg hover:bg-default-200/50 transition-colors"
                                        >
                                            <ChevronDown size={16} className="text-default-400" />
                                        </motion.div>
                                    </button>

                                    {/* Section Options */}
                                    <AnimatePresence mode="wait">
                                        {expandedSections[filterKey] && (
                                            <motion.div
                                                variants={sectionVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit="exit"
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                className="flex flex-col gap-1.5 overflow-hidden"
                                            >
                                                {config.options?.map((option) => {
                                                    const isSelected = config.value === option;
                                                    const count = config.counts?.[option] || 0;
                                                    const displayLabel = config.displayLabels?.[option] || option;

                                                    return (
                                                        <motion.button
                                                            key={option}
                                                            onClick={() => handleFilterChange(filterKey, option)}
                                                            className={`
                                                                relative overflow-hidden rounded-xl px-3 py-2.5 text-left
                                                                transition-all duration-200 border
                                                                ${isSelected
                                                                    ? 'bg-gradient-to-r from-primary/20 to-primary/10 border-primary/40 shadow-sm'
                                                                    : 'bg-background/50 border-default-200 hover:border-primary/30 hover:bg-default-100/50'
                                                                }
                                                            `}
                                                            whileHover={{ x: 4 }}
                                                            whileTap={{ scale: 0.98 }}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2 flex-1">
                                                                    {isSelected && (
                                                                        <motion.div
                                                                            initial={{ scale: 0 }}
                                                                            animate={{ scale: 1 }}
                                                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                                        >
                                                                            <div className="flex items-center justify-center w-5 h-5 rounded-md bg-primary text-white">
                                                                                <Check size={12} strokeWidth={3} />
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                    {!isSelected && (
                                                                        <div className="w-5 h-5 rounded-md border-2 border-default-300" />
                                                                    )}
                                                                    <span className={`text-sm font-medium capitalize ${isSelected ? 'text-foreground' : 'text-default-600'}`}>
                                                                        {displayLabel}
                                                                    </span>
                                                                </div>
                                                                {count > 0 && (
                                                                    <span className={`text-xs font-semibold ${isSelected ? 'text-primary' : 'text-default-400'}`}>
                                                                        {count}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {isSelected && (
                                                                <motion.div
                                                                    layoutId="selectedOption"
                                                                    className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none"
                                                                    initial={{ opacity: 0 }}
                                                                    animate={{ opacity: 1 }}
                                                                    exit={{ opacity: 0 }}
                                                                />
                                                            )}
                                                        </motion.button>
                                                    );
                                                })}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </ScrollShadow>

                {/* Footer */}
                <div className="px-6 py-4 flex gap-3">
                    <Button
                        onPress={handleClearAll}
                        isDisabled={activeFiltersCount === 0}
                        variant="flat"
                        className="flex-1 font-medium"
                        color="danger"
                    >
                        <RotateCcw size={16} />
                        Reset All
                    </Button>
                    <Button
                        onPress={onClose}
                        color="primary"
                        className="flex-1 font-medium shadow-lg shadow-primary/20"
                    >
                        Apply Filters
                        {activeFiltersCount > 0 && (
                            <Chip
                                                                size="sm"
                                                                color="solid"
                                                                variant="solid"
                                                                className="ml-2 text-white"
                                                            >
                                                                {activeFiltersCount}
                                                            </Chip>
                                                        )}
                    </Button>
                </div>
            </DrawerContent>
        </Drawer>
    );
};

export default FiltersPanel;
