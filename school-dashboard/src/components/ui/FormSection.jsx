import PropTypes from "prop-types";
import { cn } from "../../utils/cn";

export default function FormSection({
  title,
  description,
  actions,
  columns = 1,
  children,
  className,
}) {
  const gridClass =
    columns === 2
      ? "grid grid-cols-1 md:grid-cols-2 gap-4"
      : columns === 3
      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      : "space-y-4";

  return (
    <section className={cn("space-y-4", className)}>
      {(title || description || actions) && (
        <header className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="space-y-1">
            {title && (
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-[var(--color-text-muted)] max-w-prose">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={gridClass}>{children}</div>
    </section>
  );
}

FormSection.propTypes = {
  title: PropTypes.node,
  description: PropTypes.node,
  actions: PropTypes.node,
  columns: PropTypes.oneOf([1, 2, 3]),
  children: PropTypes.node,
  className: PropTypes.string,
};
