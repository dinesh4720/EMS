import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Search, X } from "lucide-react";

/**
 * SearchInput — reusable search box with icon, clear button, and optional loading spinner.
 *
 * @param {string} value - controlled input value
 * @param {Function} onChange - called with the new string value (not the event)
 * @param {string} placeholder - input placeholder text
 * @param {string} [name] - input name attribute
 * @param {boolean} [isLoading=false] - show spinner instead of search icon
 * @param {Function} [onKeyDown] - optional keyDown handler on the input
 * @param {string} [className] - overrides the container className entirely
 */
export default function SearchInput({
    value,
    onChange,
    placeholder,
    name,
    isLoading = false,
    onKeyDown,
    className = "w-full sm:max-w-[250px] px-3 py-2 bg-surface rounded-lg border border-border-token hover:border-border-strong focus-within:border-gray-400 dark:focus-within:border-zinc-600 transition-all",
}) {
    const location = useLocation();

    // Clear search when navigating to a different route so stale terms
    // from a previous module never bleed into the next section.
    // onChange is intentionally omitted from deps — we only want this to
    // fire on pathname changes, not on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { onChange(""); }, [location.pathname]);

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {isLoading ? (
                <div className="w-4 h-4 border-2 border-gray-300 dark:border-zinc-600 border-t-teal-500 rounded-full animate-spin flex-shrink-0" />
            ) : (
                <Search size={16} className="text-fg-faint flex-shrink-0" />
            )}
            <input
                type="search"
                name={name}
                placeholder={placeholder}
                className="flex-1 bg-transparent outline-none text-sm text-fg placeholder:text-gray-500 dark:placeholder:text-zinc-500"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={onKeyDown}
                autoComplete="off"
                data-form-type="other"
            />
            {value && (
                <button
                    onClick={() => onChange("")}
                    aria-label="Clear search"
                    className="p-0.5 hover:bg-surface-2 rounded cursor-pointer"
                >
                    <X size={14} className="text-fg-faint" />
                </button>
            )}
        </div>
    );
}
