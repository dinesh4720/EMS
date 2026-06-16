import { Check } from "lucide-react";

export default function SectionHead({ title, hint, done }) {
  return (
    <div className="section__head">
      <div>
        <div className="section__title">{title}</div>
        {hint && <div className="section__hint">{hint}</div>}
      </div>
      {done && (
        <span className="chip chip--ok">
          <Check size={9} strokeWidth={2.5} aria-hidden /> Looks good
        </span>
      )}
    </div>
  );
}
