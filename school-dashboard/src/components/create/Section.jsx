import { cn } from "../../utils/cn";

export function Section({ title, hint, headRight, className, children }) {
  return (
    <section className={cn("section", className)}>
      {(title || hint || headRight) && (
        <header className="section__head">
          <div className="min-w-0">
            {title && <div className="section__title">{title}</div>}
            {hint && <div className="section__hint">{hint}</div>}
          </div>
          {headRight}
        </header>
      )}
      {children}
    </section>
  );
}

export function FieldGrid({ columns = 2, className, children }) {
  const cls = cn("fgrid", columns === 3 && "fgrid--3", className);
  return <div className={cls}>{children}</div>;
}
