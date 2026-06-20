/* ============================================================
   Navigation Redesign — Two-level IA configuration
   ============================================================
   Calm rail: only the main sections live on the rail, grouped
   into intent-based categories. A section with sub-pages carries
   a `panel` — clicking it opens an overlay beside the rail that
   lists everything inside it (the VS Code / Gmail two-level
   pattern). Sections without a panel navigate directly.

   Every destination from the previous hierarchical sidebar is
   preserved here — nothing was dropped, only reorganized.
   ============================================================ */

import {
  LayoutDashboard, GraduationCap, Users, CalendarCheck, SendHorizontal,
  TrendingUp, FileOutput, ContactRound, Wallet, BookMarked, BookOpen,
  FilePenLine, ClipboardList, UserCheck, Wand2, School, Calendar,
  IndianRupee, HandCoins, AlertTriangle, Layers, FileBarChart, Undo2,
  Receipt, MessageSquare, LayoutGrid, DoorOpen, Library, Package,
  Building2, Bus, BarChart3, Sparkles, Shield, ClipboardPen, Database,
  ListChecks, Palette, ScrollText, Settings,
} from "lucide-react";

/**
 * Each group: { cat: string | null, items: Section[] }
 * Each Section: { id, icon, label, href?, end?, unread?, panel?: PanelItem[] }
 * Each PanelItem: { id, icon, label, href, end?, badge?, badgeKind? }
 *
 * A section with `panel` opens the overlay on click and never navigates
 * on its own — the first panel item is its landing page. A section with
 * only `href` navigates directly.
 */
export const NAV_GROUPS = [
  {
    cat: null,
    items: [
      { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/", end: true },
    ],
  },
  {
    cat: "School",
    items: [
      {
        id: "students", icon: GraduationCap, label: "Students",
        panel: [
          { id: "students-all", icon: Users, label: "All Students", href: "/students", end: true },
          { id: "attendance", icon: CalendarCheck, label: "Attendance", href: "/students/attendance" },
          { id: "submissions", icon: SendHorizontal, label: "Form Submissions", href: "/students/submissions" },
          { id: "promotion", icon: TrendingUp, label: "Promotion", href: "/students/promotion" },
          { id: "tc", icon: FileOutput, label: "Transfer Certificate", href: "/students/transfer-certificate" },
        ],
      },
      {
        id: "staff", icon: Users, label: "Staff",
        panel: [
          { id: "staff-all", icon: ContactRound, label: "All Staff", href: "/staffs", end: true },
          { id: "payroll", icon: Wallet, label: "Payroll", href: "/staffs/payroll" },
          { id: "subjects", icon: BookMarked, label: "Bulk Subjects", href: "/staffs/bulk-subjects" },
        ],
      },
      {
        id: "academics", icon: BookOpen, label: "Academics",
        panel: [
          { id: "acad-home", icon: BookOpen, label: "Overview", href: "/academics", end: true },
          { id: "exams", icon: FilePenLine, label: "Exams", href: "/academics/exams" },
          { id: "homework", icon: ClipboardList, label: "Homework", href: "/homework" },
          { id: "ptm", icon: UserCheck, label: "PTM", href: "/ptm" },
          { id: "timetable", icon: Wand2, label: "Timetable Wizard", href: "/timetable-wizard" },
        ],
      },
      { id: "classes", icon: School, label: "Classes", href: "/classes" },
      { id: "calendar", icon: Calendar, label: "Calendar", href: "/calendar" },
    ],
  },
  {
    cat: "Finance & Comms",
    items: [
      {
        id: "fees", icon: IndianRupee, label: "Fees",
        panel: [
          { id: "fees-collect", icon: HandCoins, label: "Collection", href: "/fees", end: true },
          { id: "fees-defaulters", icon: AlertTriangle, label: "Defaulters", href: "/fees?status=overdue" },
          { id: "fees-structure", icon: Layers, label: "Structures", href: "/settings/fee-templates" },
          { id: "fees-reports", icon: FileBarChart, label: "Reports", href: "/reports" },
          { id: "fees-refunds", icon: Undo2, label: "Refunds", href: "/fees/refunds" },
        ],
      },
      { id: "expenses", icon: Receipt, label: "Expenses", href: "/expenses" },
      { id: "messaging", icon: MessageSquare, label: "Messaging", href: "/messaging", unread: true },
    ],
  },
  {
    cat: "Workspace",
    items: [
      {
        id: "operations", icon: LayoutGrid, label: "Operations",
        panel: [
          { id: "front-desk", icon: DoorOpen, label: "Front Desk", href: "/front-desk" },
          { id: "library", icon: Library, label: "Library", href: "/library" },
          { id: "inventory", icon: Package, label: "Inventory", href: "/inventory" },
          { id: "hostel", icon: Building2, label: "Hostel", href: "/hostel" },
          { id: "transport", icon: Bus, label: "Transport", href: "/transport" },
        ],
      },
      {
        id: "insights", icon: BarChart3, label: "Insights",
        panel: [
          { id: "reports", icon: FileBarChart, label: "Reports", href: "/reports" },
          { id: "analytics", icon: BarChart3, label: "Analytics", href: "/analytics" },
          { id: "ai", icon: Sparkles, label: "AI Assistant", href: "/ai-assistant" },
        ],
      },
      {
        id: "admin", icon: Shield, label: "Administration",
        panel: [
          { id: "intake", icon: ClipboardPen, label: "Intake Forms", href: "/intake-forms/assignments" },
          { id: "data", icon: Database, label: "Data Tools", href: "/data-tools" },
          // Internal dev-only tools — never registered in production builds.
          ...(import.meta.env.DEV
            ? [
                { id: "checklist", icon: ListChecks, label: "IA & Checklist", href: "/ia" },
                { id: "style", icon: Palette, label: "Style Guide", href: "/style-guide" },
              ]
            : []),
          { id: "audit", icon: ScrollText, label: "Audit Logs", href: "/audit-logs" },
        ],
      },
    ],
  },
];

/** Footer item (rendered separately, below the nav). */
export const SETTINGS_ITEM = { id: "settings", icon: Settings, label: "Settings", href: "/settings" };

/** Bottom-bar tabs for the mobile layout (unchanged set). */
export const MOBILE_TABS = [
  { id: "dashboard", href: "/", label: "Dash", icon: LayoutDashboard, end: true },
  { id: "students", href: "/students", label: "Students", icon: GraduationCap },
  { id: "calendar", href: "/calendar", label: "Calendar", icon: Calendar },
  { id: "messaging", href: "/messaging", label: "Msg", icon: MessageSquare },
];

/** Flat list of every section for lookups. */
export const ALL_SECTIONS = NAV_GROUPS.flatMap((g) => g.items);

/** href → { icon, label } for resolving pinned-page icons. */
const HREF_INDEX = (() => {
  const map = {};
  for (const section of ALL_SECTIONS) {
    if (section.href) map[section.href] = { icon: section.icon, label: section.label };
    for (const item of section.panel || []) {
      const path = item.href.split("?")[0];
      if (!map[path]) map[path] = { icon: item.icon, label: item.label };
    }
  }
  map[SETTINGS_ITEM.href] = { icon: SETTINGS_ITEM.icon, label: SETTINGS_ITEM.label };
  return map;
})();

/** Resolve the best icon for an arbitrary href (used by pinned pages). */
export function resolveIconForHref(href) {
  if (!href) return null;
  if (HREF_INDEX[href]) return HREF_INDEX[href].icon;
  // longest matching prefix
  const match = Object.keys(HREF_INDEX)
    .filter((k) => k !== "/" && href.startsWith(k + "/"))
    .sort((a, b) => b.length - a.length)[0];
  return match ? HREF_INDEX[match].icon : null;
}

/**
 * Which top-level section owns the current route. Mirrors the route tree
 * (cross-links inside panels — e.g. Fees → Reports → /reports — are
 * attributed to their real owner, not the panel they appear in).
 */
export function getActiveSectionId(pathname) {
  const is = (base) => pathname === base || pathname.startsWith(base + "/");
  if (pathname === "/") return "dashboard";
  if (is("/students")) return "students";
  if (is("/staffs")) return "staff";
  if (is("/academics") || pathname === "/homework" || pathname === "/ptm" || pathname === "/timetable-wizard") return "academics";
  if (is("/classes")) return "classes";
  if (is("/calendar")) return "calendar";
  if (is("/fees")) return "fees";
  if (is("/expenses")) return "expenses";
  if (is("/messaging")) return "messaging";
  if (is("/front-desk") || is("/library") || is("/inventory") || is("/hostel") || is("/transport")) return "operations";
  if (is("/reports") || is("/analytics") || pathname === "/ai-assistant") return "insights";
  if (is("/intake-forms") || is("/data-tools") || pathname === "/ia" || pathname === "/style-guide" || is("/audit-logs")) return "admin";
  if (is("/settings")) return "settings";
  return null;
}

/**
 * The single best-matching panel item for the current location. Handles
 * query-string destinations (e.g. Defaulters → /fees?status=overdue) so a
 * filtered view highlights the right row instead of the plain page.
 */
export function getActivePanelItemId(location, panelItems) {
  let bestId = null;
  let bestScore = -1;
  for (const item of panelItems) {
    const [path, query] = item.href.split("?");
    const exact = location.pathname === path;
    const prefix = !item.end && (location.pathname === path || location.pathname.startsWith(path + "/"));
    if (!exact && !prefix) continue;

    let score = exact ? 2 : 1;
    if (query) {
      const want = new URLSearchParams(query);
      const have = new URLSearchParams(location.search);
      let ok = true;
      for (const [k, v] of want) if (have.get(k) !== v) ok = false;
      if (!ok) continue; // query required but absent → not this item
      score += 2; // a query match is more specific than a bare path match
    }
    score += path.length / 1000; // tie-break: prefer the longer/more-specific path
    if (score > bestScore) {
      bestScore = score;
      bestId = item.id;
    }
  }
  return bestId;
}
