import { memo, Fragment } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "../../utils/cn";

const SIZE = {
  sm: "text-xs gap-1",
  md: "text-sm gap-1.5",
};

const Breadcrumbs = memo(function Breadcrumbs({
  items = [],
  separator,
  showHomeIcon = false,
  size = "md",
  className,
  maxItems,
}) {
  if (!items || items.length === 0) return null;

  let visible = items;
  let collapsed = false;
  if (maxItems && items.length > maxItems && maxItems >= 2) {
    visible = [items[0], ...items.slice(items.length - (maxItems - 1))];
    collapsed = true;
  }

  const sep = separator ?? (
    <ChevronRight
      size={14}
      className="text-gray-400 dark:text-zinc-600 shrink-0"
      aria-hidden="true"
    />
  );

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className={cn("flex items-center flex-wrap", SIZE[size])}>
        {visible.map((item, idx) => {
          const isLast = idx === visible.length - 1;
          const isFirstCollapsed = collapsed && idx === 1;
          const key = item.key ?? `${item.label}-${idx}`;
          const label =
            idx === 0 && showHomeIcon && !item.icon ? (
              <span className="flex items-center gap-1.5">
                <Home size={14} aria-hidden="true" />
                <span className={item.hideLabelOnMobile ? "hidden sm:inline" : undefined}>
                  {item.label}
                </span>
              </span>
            ) : item.icon ? (
              <span className="flex items-center gap-1.5">
                {item.icon}
                <span>{item.label}</span>
              </span>
            ) : (
              item.label
            );

          return (
            <Fragment key={key}>
              {idx > 0 && (
                <li aria-hidden="true" className="flex items-center px-1">
                  {sep}
                </li>
              )}
              {isFirstCollapsed && (
                <>
                  <li className="text-gray-400 dark:text-zinc-600 px-1">…</li>
                  <li aria-hidden="true" className="flex items-center px-1">
                    {sep}
                  </li>
                </>
              )}
              <li className="min-w-0">
                {isLast || (!item.href && !item.onClick) ? (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className={cn(
                      "truncate inline-block max-w-[16rem]",
                      isLast
                        ? "font-medium text-gray-900 dark:text-zinc-100"
                        : "text-gray-500 dark:text-zinc-400",
                    )}
                  >
                    {label}
                  </span>
                ) : item.onClick ? (
                  <button
                    type="button"
                    onClick={item.onClick}
                    className="truncate inline-block max-w-[16rem] text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded"
                  >
                    {label}
                  </button>
                ) : (
                  <Link
                    to={item.href}
                    className="truncate inline-block max-w-[16rem] text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded"
                  >
                    {label}
                  </Link>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
});

Breadcrumbs.displayName = "Breadcrumbs";

export default Breadcrumbs;
