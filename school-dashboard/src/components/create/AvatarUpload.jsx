import { User } from "lucide-react";

/**
 * Dashed-border avatar uploader card.
 * `slot` (left): the actual avatar/preview node. Falls back to a placeholder ring.
 * `title`, `hint`: copy. `actions`: nodes to render below hint (buttons).
 */
export function AvatarUpload({ slot, title = "Profile photo", hint, actions }) {
  return (
    <div className="avatar-up">
      <div className="avatar-up__circle">
        {slot ?? <User size={22} strokeWidth={1.5} />}
      </div>
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <span style={{ fontWeight: 520 }}>{title}</span>
        {hint && <span className="subtle text-[12px]">{hint}</span>}
        {actions && <div className="flex flex-wrap gap-2 mt-1">{actions}</div>}
      </div>
    </div>
  );
}
