import { Plus, IndianRupee, ClipboardCheck, Megaphone } from "lucide-react";

const DEFAULT_ACTIONS = [
  { id: "student", label: "Add student", icon: Plus, to: "/students" },
  { id: "fee", label: "Collect fee", icon: IndianRupee, to: "/fees" },
  { id: "attendance", label: "Take attendance", icon: ClipboardCheck, to: "/classes" },
  { id: "announce", label: "Announce", icon: Megaphone, to: "/messaging" },
];

/**
 * QuickActions — compact, icon-led shortcut buttons.
 * Day-to-day verbs surfaced as a single row.
 */
export default function QuickActions({ actions = DEFAULT_ACTIONS, onNavigate }) {
  return (
    <div className="quick-actions-row">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            type="button"
            className="quick-action-btn"
            onClick={() => onNavigate?.(action.to, action)}
          >
            <span className="quick-action-btn__icon">
              <Icon size={14} strokeWidth={2.2} />
            </span>
            <span className="quick-action-btn__label">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
