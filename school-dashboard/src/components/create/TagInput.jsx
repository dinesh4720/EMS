import { useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * Comma/Enter separated chip input. Controlled via `value` (string[]) + `onChange`.
 */
export function TagInput({ value = [], onChange, placeholder, className }) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);

  const commit = (raw) => {
    const next = raw.trim();
    if (!next) return;
    if (value.includes(next)) {
      setDraft("");
      return;
    }
    onChange?.([...value, next]);
    setDraft("");
  };

  const remove = (tag) => {
    onChange?.(value.filter((t) => t !== tag));
  };

  return (
    <div
      className={cn("taginput", className)}
      onClick={() => inputRef.current?.focus()}
      role="presentation"
    >
      {value.map((tag) => (
        <span key={tag} className="tagchip">
          {tag}
          <button
            type="button"
            aria-label={`Remove ${tag}`}
            onClick={(e) => {
              e.stopPropagation();
              remove(tag);
            }}
          >
            <X size={9} />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit(draft);
          } else if (e.key === "Backspace" && !draft && value.length) {
            remove(value[value.length - 1]);
          }
        }}
        onBlur={() => draft && commit(draft)}
      />
    </div>
  );
}
