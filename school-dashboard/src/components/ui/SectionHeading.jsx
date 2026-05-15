import { memo } from "react";
import PropTypes from "prop-types";
import { cn } from "../../utils/cn";

const SIZE_STYLES = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

const SectionHeading = memo(function SectionHeading({
  as: Tag = "h2",
  size = "lg",
  icon: Icon,
  iconSize = 16,
  children,
  description,
  actions,
  className,
}) {
  const titleClass = cn(
    "font-semibold text-fg flex items-center gap-2",
    SIZE_STYLES[size] || SIZE_STYLES.lg
  );

  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2", className)}>
      <div className="min-w-0">
        <Tag className={titleClass}>
          {Icon ? (
            <Icon
              size={iconSize}
              className="text-fg-muted shrink-0"
              aria-hidden="true"
            />
          ) : null}
          <span className="truncate">{children}</span>
        </Tag>
        {description ? (
          <p className="text-xs text-fg-muted mt-1">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      ) : null}
    </div>
  );
});

SectionHeading.displayName = "SectionHeading";

SectionHeading.propTypes = {
  as: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  icon: PropTypes.elementType,
  iconSize: PropTypes.number,
  children: PropTypes.node.isRequired,
  description: PropTypes.node,
  actions: PropTypes.node,
  className: PropTypes.string,
};

export default SectionHeading;
