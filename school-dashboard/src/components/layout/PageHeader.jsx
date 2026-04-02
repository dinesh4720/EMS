/** @deprecated Use components/ui/PageHeader instead — it supports tabs, sticky, and description props */
import { memo } from "react";
import PropTypes from "prop-types";
import { Breadcrumbs, BreadcrumbItem } from "@heroui/react";

const PageHeader = memo(function PageHeader({ title, breadcrumbs = [], actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
      <div className="space-y-1">
        {breadcrumbs.length > 0 && (
          <Breadcrumbs
            size="sm"
            variant="light"
            className="p-0"
            itemClasses={{
              item: "text-gray-500 data-[current=true]:text-gray-700 dark:text-zinc-500 dark:data-[current=true]:text-zinc-300 font-medium",
              separator: "text-gray-300 dark:text-zinc-600"
            }}
          >
            {breadcrumbs.map((item) => (
              <BreadcrumbItem key={item.href || item.label} href={item.href}>{item.label}</BreadcrumbItem>
            ))}
          </Breadcrumbs>
        )}
        <h1 className="text-xl font-medium tracking-tight text-gray-900 dark:text-zinc-100">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
});

PageHeader.displayName = 'PageHeader';

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  breadcrumbs: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      href: PropTypes.string,
    })
  ),
  actions: PropTypes.node,
};

export default PageHeader;
