import { useMemo, useState } from "react";
import * as Lucide from "lucide-react";
import { Check } from "lucide-react";

import { Story, StoryGroup } from "./shared";

/* ──────────────────────────────────────────────────────────────────
 * Icon library — searchable Lucide grid.
 * Curated to ~120 icons used across the dashboard rather than the full set.
 * ────────────────────────────────────────────────────────────────── */

const CURATED_ICONS = [
  // Navigation / chrome
  "Home", "LayoutGrid", "Menu", "X", "ArrowLeft", "ArrowRight", "ChevronLeft",
  "ChevronRight", "ChevronUp", "ChevronDown", "ChevronsLeft", "ChevronsRight",
  "MoreHorizontal", "MoreVertical",

  // Common actions
  "Plus", "Minus", "Edit3", "Trash2", "Copy", "Check", "Save", "Download",
  "Upload", "Search", "Filter", "RefreshCw", "Settings", "Sliders", "Send",
  "Share2", "Eye", "EyeOff", "Lock", "Unlock", "LogOut", "LogIn",

  // Status
  "CheckCircle2", "XCircle", "AlertTriangle", "AlertCircle", "Info", "Clock",
  "Bell", "BellRing", "BellOff", "Zap", "ShieldCheck", "ShieldAlert", "Ban",
  "MinusCircle",

  // People & comms
  "User", "Users", "UserPlus", "UserCheck", "MessageSquare", "MessageCircle",
  "Mail", "MailOpen", "Phone", "PhoneCall",

  // Education / school
  "BookOpen", "GraduationCap", "Library", "Building2", "DoorOpen", "School",
  "FlaskConical", "Calculator", "Globe", "Award", "Trophy", "Medal",

  // Money / billing
  "Wallet", "CreditCard", "Receipt", "DollarSign", "IndianRupee", "Banknote",
  "BadgePercent",

  // Calendar / time
  "Calendar", "CalendarDays", "CalendarClock", "Clock3", "Hourglass", "Timer",

  // Files / data
  "File", "FileText", "FileCheck2", "FilePlus", "FileSpreadsheet", "FileImage",
  "Folder", "FolderOpen", "Image", "Paperclip", "Database",

  // Charts
  "BarChart3", "BarChart", "LineChart", "PieChart", "TrendingUp", "TrendingDown",
  "Activity",

  // UI bits
  "Star", "Heart", "Flag", "Tag", "Bookmark", "Pin", "MapPin", "Globe2",
  "ExternalLink", "Link", "Link2", "Sparkles", "Lightbulb",

  // Devices / system
  "Wifi", "WifiOff", "Cloud", "CloudOff", "Smartphone", "Monitor", "Printer",
  "Keyboard", "Mouse", "QrCode",
];

function IconCell({ name }) {
  const Icon = Lucide[name];
  const [copied, setCopied] = useState(false);

  if (!Icon) return null;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(`<${name} size={14} aria-hidden />`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {
      /* ignore */
    }
  };

  return (
    <button type="button" className="sg-icon-cell" onClick={onCopy} title={`<${name} />`}>
      <span className="sg-icon-cell__icon">
        {copied ? <Check size={20} /> : <Icon size={20} />}
      </span>
      <span className="sg-icon-cell__name">{name}</span>
    </button>
  );
}

export default function IconsSection() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CURATED_ICONS;
    return CURATED_ICONS.filter((name) => name.toLowerCase().includes(q));
  }, [query]);

  return (
    <StoryGroup
      id="icons"
      title="Icons"
      sub="Lucide React · 13–16px in dense UI · 1.6 stroke. Always pass aria-hidden for decorative icons or aria-label on clickable ones. Click any icon to copy its JSX."
    >
      <Story
        title="Search the curated set"
        sub={`${filtered.length} of ${CURATED_ICONS.length} icons`}
        layout="col"
      >
        <div className="sg-toolbar__search" style={{ maxWidth: 320 }}>
          <Lucide.Search size={13} style={{ color: "var(--fg-subtle)" }} aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search icons by name…"
            aria-label="Search icons"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              style={{
                background: "transparent",
                border: 0,
                cursor: "pointer",
                color: "var(--fg-subtle)",
                padding: 0,
                display: "inline-flex",
              }}
            >
              <Lucide.X size={12} aria-hidden />
            </button>
          )}
        </div>

        <div className="sg-icons-grid" style={{ width: "100%" }}>
          {filtered.map((name) => (
            <IconCell key={name} name={name} />
          ))}
          {filtered.length === 0 && (
            <div
              style={{
                gridColumn: "1 / -1",
                padding: 32,
                textAlign: "center",
                color: "var(--fg-subtle)",
                fontSize: 13,
              }}
            >
              No icons match &ldquo;{query}&rdquo;.
            </div>
          )}
        </div>
      </Story>

      <Story
        title="Sizing guidance"
        sub="13px in chips · 14px in buttons / list rows · 16px in headers / empty states · 20px in heroes"
        layout="row"
      >
        {[12, 13, 14, 16, 18, 20, 24, 32].map((size) => (
          <div
            key={size}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: 8,
              border: "1px solid var(--border-token)",
              borderRadius: 6,
              minWidth: 72,
            }}
          >
            <Lucide.Bell size={size} style={{ color: "var(--fg-muted)" }} aria-hidden />
            <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-subtle)" }}>
              {size}px
            </span>
          </div>
        ))}
      </Story>

      <Story
        title="Strokes"
        sub="Default stroke is 2 — feel free to drop to 1.5 in dense rows or 1.6 to match the site default"
      >
        {[1, 1.5, 2, 2.5].map((s) => (
          <div
            key={s}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: 8,
              border: "1px solid var(--border-token)",
              borderRadius: 6,
              minWidth: 72,
            }}
          >
            <Lucide.GraduationCap size={20} strokeWidth={s} style={{ color: "var(--fg)" }} aria-hidden />
            <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-subtle)" }}>
              {s}
            </span>
          </div>
        ))}
      </Story>

      <Story title="Usage" layout="col">
        <pre className="sg-story__code" style={{ background: "var(--surface)" }}>
{`import { GraduationCap } from "lucide-react";

// Decorative — provide aria-hidden
<GraduationCap size={14} aria-hidden />

// Clickable — provide aria-label on the wrapping button
<IconButton aria-label="Open class">
  <GraduationCap size={14} aria-hidden />
</IconButton>`}
        </pre>
      </Story>
    </StoryGroup>
  );
}
