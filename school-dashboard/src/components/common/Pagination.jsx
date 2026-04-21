import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PropTypes from "prop-types";

/**
 * Reusable Pagination component with a validated jump-to-page input.
 *
 * Validates that the page number input is a whole integer within [1, totalPages].
 * Entering non-integers (e.g. '1.5') or out-of-range values (e.g. '-1', '0')
 * shows an inline error instead of silently clamping to page 1.
 */
export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
  totalItems,
  itemLabel = "items",
}) {
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState("");

  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (inputError) setInputError("");
  };

  // Validates the raw string is a whole integer within [1, totalPages].
  // Returns an error string if invalid, or null if valid.
  const validatePageInput = (raw) => {
    if (raw.trim() === "") return "Enter a page number";

    const num = Number(raw);

    // Reject non-integers (e.g. '1.5', '1e2' with decimal result, etc.)
    if (!Number.isInteger(num)) {
      return "Page must be a whole number";
    }

    if (num < 1) {
      return "Page must be 1 or greater";
    }

    if (num > totalPages) {
      return `Page must be ${totalPages} or less`;
    }

    return null;
  };

  const handleGoToPage = () => {
    const error = validatePageInput(inputValue);
    if (error) {
      setInputError(error);
      return;
    }
    const page = Number(inputValue);
    setInputValue("");
    setInputError("");
    onPageChange(page);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleGoToPage();
  };

  if (totalPages <= 1 && !totalItems) return null;

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between py-3">
      {totalItems !== undefined && (
        <span className="text-sm text-gray-500 dark:text-zinc-400">
          {totalItems.toLocaleString()} {itemLabel}
        </span>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {/* Previous */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentPage <= 1 || disabled}
          className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-zinc-300 transition-colors"
        >
          <ChevronLeft size={14} />
          Previous
        </button>

        {/* Page indicator */}
        <span className="text-sm text-gray-600 dark:text-zinc-400 px-1 select-none">
          {currentPage} / {totalPages}
        </span>

        {/* Next */}
        <button
          type="button"
          onClick={handleNext}
          disabled={currentPage >= totalPages || disabled}
          className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-zinc-300 transition-colors"
        >
          Next
          <ChevronRight size={14} />
        </button>

        {/* Jump-to-page input — line ~89 of this file */}
        {totalPages > 2 && (
          <div className="flex items-center gap-1 ml-1">
            <input
              type="text"
              inputMode="numeric"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Go to…"
              aria-label="Go to page number"
              disabled={disabled}
              className={`w-20 px-2 py-1.5 text-sm border rounded-lg text-center bg-white dark:bg-zinc-950 text-gray-700 dark:text-zinc-300 disabled:opacity-50 transition-colors ${
                inputError
                  ? "border-red-400 dark:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-400"
                  : "border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:focus:ring-blue-600"
              }`}
            />
            <button
              type="button"
              onClick={handleGoToPage}
              disabled={disabled}
              className="px-2 py-1.5 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900 disabled:opacity-50 text-gray-700 dark:text-zinc-300 transition-colors"
            >
              Go
            </button>
            {inputError && (
              <span
                role="alert"
                className="text-xs text-red-500 dark:text-red-400 whitespace-nowrap"
              >
                {inputError}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  totalItems: PropTypes.number,
  itemLabel: PropTypes.string,
};
