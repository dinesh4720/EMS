import { Breadcrumbs, BreadcrumbItem } from "@heroui/react";

export default function PageHeader({ title, breadcrumbs = [], actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
      <div className="space-y-1">
        {breadcrumbs.length > 0 && (
          <Breadcrumbs
            size="sm"
            variant="light"
            className="p-0"
            itemClasses={{
              item: "text-gray-500 data-[current=true]:text-gray-700 font-medium",
              separator: "text-gray-300"
            }}
          >
            {breadcrumbs.map((item, index) => (
              <BreadcrumbItem key={index} href={item.href}>{item.label}</BreadcrumbItem>
            ))}
          </Breadcrumbs>
        )}
        <h1 className="text-xl font-medium tracking-tight text-gray-900">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
