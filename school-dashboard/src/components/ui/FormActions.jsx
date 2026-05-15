import PropTypes from "prop-types";
import { cn } from "../../utils/cn";

const ALIGN_STYLES = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
};

/**
 * FormActions - the standard action row at the bottom of a form.
 * Renders children horizontally on desktop and stacks full-width on mobile.
 * Use `sticky` for long forms that need pinned Save/Cancel.
 */
export default function FormActions({
  align = "end",
  sticky = false,
  divider = true,
  className,
  children,
}) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:items-center",
        ALIGN_STYLES[align],
        divider && "border-t border-[var(--color-border)]",
        sticky &&
          "sticky bottom-0 z-10 -mx-6 px-6 pb-4 bg-[var(--color-bg)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-bg)]/80",
        className
      )}
    >
      {children}
    </div>
  );
}

FormActions.propTypes = {
  align: PropTypes.oneOf(["start", "center", "end", "between"]),
  sticky: PropTypes.bool,
  divider: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
};
