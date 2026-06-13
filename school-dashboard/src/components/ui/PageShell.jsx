import { memo, useEffect } from "react";
import Breadcrumbs from "./Breadcrumbs";
import MinimalTabs from "./MinimalTabs";
import { cn } from "../../utils/cn";

const SITE_NAME = "EMS";
const DEFAULT_DESCRIPTION =
  "EMS — Education Management System dashboard for schools.";

function setMetaDescription(content) {
  if (typeof document === "undefined") return;
  let tag = document.querySelector('meta[name="description"]');
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", "description");
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function useDocumentMeta(title, description) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const previousTitle = document.title;
    const previousMeta =
      document.querySelector('meta[name="description"]')?.getAttribute("content") ||
      DEFAULT_DESCRIPTION;

    if (title) document.title = `${title} · ${SITE_NAME}`;
    if (description) setMetaDescription(description);

    return () => {
      document.title = previousTitle;
      setMetaDescription(previousMeta);
    };
  }, [title, description]);
}

const HEADER_PADDING = {
  sm: "py-3 px-4",
  md: "py-5 px-6",
  lg: "py-6 px-6",
};

const TITLE_SIZE = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
};

const DESCRIPTION_SIZE = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

const BODY_PADDING = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

const PageShell = memo(function PageShell({
  title,
  description,
  documentTitle,
  metaDescription,
  breadcrumbs,
  actions,
  tabs,
  activeTab,
  onTabChange,
  tabsVariant = "pills",
  tabsBaseId,
  size = "md",
  bodyPadding = "md",
  scrollable = true,
  className,
  contentClassName,
  headerClassName,
  children,
  aside,
  toolbar,
}) {
  const hasHeader = Boolean(title || description || actions || breadcrumbs);
  const hasTabs = tabs && tabs.length > 0;

  useDocumentMeta(
    documentTitle ?? (typeof title === "string" ? title : undefined),
    metaDescription ??
      (typeof description === "string" ? description : undefined),
  );

  return (
    <div
      className={cn(
        "bg-surface border border-border-token rounded-lg h-full flex flex-col min-w-0 overflow-hidden",
        className,
      )}
    >
      {hasHeader && (
        <div
          className={cn(
            "border-b border-divider shrink-0",
            HEADER_PADDING[size],
            headerClassName,
          )}
        >
          {breadcrumbs && (
            <div className="mb-2">
              {Array.isArray(breadcrumbs) ? (
                <Breadcrumbs items={breadcrumbs} size="sm" />
              ) : (
                breadcrumbs
              )}
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              {title && (
                <h1
                  className={cn(
                    "font-medium text-fg truncate",
                    TITLE_SIZE[size],
                  )}
                >
                  {title}
                </h1>
              )}
              {description && (
                <p
                  className={cn(
                    "text-fg-muted mt-1",
                    DESCRIPTION_SIZE[size],
                  )}
                >
                  {description}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>
            )}
          </div>
        </div>
      )}

      {hasTabs && (
        <div className="px-4 sm:px-6 pt-3 border-b border-divider shrink-0">
          <MinimalTabs
            tabs={tabs}
            activeKey={activeTab}
            onChange={onTabChange}
            variant={tabsVariant}
            baseId={tabsBaseId}
          />
        </div>
      )}

      {toolbar && (
        <div className="px-4 sm:px-6 py-3 border-b border-divider shrink-0">
          {toolbar}
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        <div
          className={cn(
            "flex-1 flex flex-col min-w-0",
            scrollable ? "overflow-auto" : "overflow-hidden",
            BODY_PADDING[bodyPadding],
            contentClassName,
          )}
        >
          {children}
        </div>
        {aside && (
          <aside className="w-72 shrink-0 border-l border-divider overflow-auto hidden lg:block">
            {aside}
          </aside>
        )}
      </div>
    </div>
  );
});

PageShell.displayName = "PageShell";

export default PageShell;
