/**
 * FilterToolbar — standard responsive toolbar layout used above data tables.
 *
 * Renders two slots separated by `justify-between`:
 *   - `left`  — search input + filter controls
 *   - `right` — action buttons (export, etc.)
 *
 * @param {React.ReactNode} left       - left-side content (search + filters)
 * @param {React.ReactNode} [right]    - right-side content (action buttons)
 * @param {string} [className]         - extra classes appended to the outer wrapper
 */
export default function FilterToolbar({ left, right, className = "" }) {
    return (
        <div
            className={`flex flex-col sm:flex-row justify-between gap-4 items-center border-b border-gray-200 dark:border-zinc-800 py-4 -mx-6 px-6 mb-6 ${className}`}
        >
            <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                {left}
            </div>
            {right && (
                <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                    {right}
                </div>
            )}
        </div>
    );
}
