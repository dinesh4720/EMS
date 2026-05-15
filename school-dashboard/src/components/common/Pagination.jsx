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
        <span className="text-sm text-fg-muted tabular-nums">
          {totalItems.toLocaleString()} {itemLabel}
        </span>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {/* Previous */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentPage <= 1 || disabled}
          className="flex items-center gap-1 px-3 py-1.5 text-sm border border-border-token rounded-lg hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed text-fg transition-colors"
        >
          <ChevronLeft size={14} />
          Previous
        </button>

        {/* Page indicator */}
        <span className="text-sm text-fg-muted px-1 select-none tabular-nums">
          {currentPage} / {totalPages}
        </span>

        {/* Next */}
        <button
          type="button"
          onClick={handleNext}
          disabled={currentPage >= totalPages || disabled}
          className="flex items-center gap-1 px-3 py-1.5 text-sm border border-border-token rounded-lg hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed text-fg transition-colors"
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
              className={`w-20 px-2 py-1.5 text-sm border rounded-lg text-center bg-surface text-fg disabled:opacity-50 transition-colors tabular-nums ${
                inputError
                  ? "border-danger-token focus:outline-none focus:ring-1 focus:ring-danger-token"
                  : "border-border-token focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/50"
              }`}
            />
            <button
              type="button"
              onClick={handleGoToPage}
              disabled={disabled}
              className="px-2 py-1.5 text-sm border border-border-token rounded-lg hover:bg-surface-hover disabled:opacity-50 text-fg transition-colors"
            >
              Go
            </button>
            {inputError && (
              <span
                role="alert"
                className="text-xs text-danger-token whitespace-nowrap"
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
