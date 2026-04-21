import { useState } from "react";
import { ExternalLink, Users } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import { SkeletonTable } from "../../components/ui/Skeleton";
import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import Divider from "../../components/ui/Divider";

function Anchor({ id, title, description }) {
  return (
    <header id={id} className="space-y-1 scroll-mt-24">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      {description ? (
        <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-2xl">{description}</p>
      ) : null}
    </header>
  );
}

function Code({ children }) {
  return (
    <pre className="text-xs leading-relaxed rounded-md border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/60 p-4 overflow-x-auto">
      <code className="text-gray-800 dark:text-zinc-200 font-mono">{children}</code>
    </pre>
  );
}

function DoDont({ doItems = [], dontItems = [] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card padding="sm" className="border-emerald-200 dark:border-emerald-900/60">
        <div className="flex items-center gap-2 mb-2">
          <Badge color="success" size="sm">
            Do
          </Badge>
        </div>
        <ul className="text-sm text-gray-700 dark:text-zinc-300 space-y-1.5 list-disc pl-5">
          {doItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>
      <Card padding="sm" className="border-red-200 dark:border-red-900/60">
        <div className="flex items-center gap-2 mb-2">
          <Badge color="danger" size="sm">
            Don&apos;t
          </Badge>
        </div>
        <ul className="text-sm text-gray-700 dark:text-zinc-300 space-y-1.5 list-disc pl-5">
          {dontItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function FourStatesDemo() {
  const [state, setState] = useState("loading");
  return (
    <Card padding="sm" className="space-y-4">
      <div
        role="tablist"
        aria-label="Preview state"
        className="flex flex-wrap gap-2"
      >
        {["loading", "empty", "error", "success"].map((key) => (
          <Button
            key={key}
            size="sm"
            variant={state === key ? "primary" : "secondary"}
            onClick={() => setState(key)}
            role="tab"
            aria-selected={state === key}
          >
            {key}
          </Button>
        ))}
      </div>

      <div className="min-h-[240px] rounded-md border border-dashed border-gray-200 dark:border-zinc-800 p-4 flex items-center justify-center">
        {state === "loading" && <SkeletonTable rows={4} columns={4} />}
        {state === "empty" && (
          <EmptyState
            icon={Users}
            title="No students yet"
            description="Add your first student to see them here."
            action={<Button size="sm">Add student</Button>}
            size="sm"
          />
        )}
        {state === "error" && (
          <ErrorState
            title="Couldn't load students"
            description="The server didn't respond in time."
            onRetry={() => setState("loading")}
            size="sm"
          />
        )}
        {state === "success" && (
          <div className="w-full text-sm text-gray-700 dark:text-zinc-300">
            <p className="font-medium mb-2">Success state — render the list/table here.</p>
            <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
              <li className="py-2 flex justify-between">
                <span>Aadhya Shah</span>
                <Badge color="success" size="sm">
                  Active
                </Badge>
              </li>
              <li className="py-2 flex justify-between">
                <span>Rohan Patel</span>
                <Badge color="success" size="sm">
                  Active
                </Badge>
              </li>
              <li className="py-2 flex justify-between">
                <span>Priya Nair</span>
                <Badge color="neutral" size="sm">
                  Inactive
                </Badge>
              </li>
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}

function FourStatesPattern() {
  return (
    <div className="space-y-4">
      <Anchor
        id="patterns-four-states"
        title="Loading / empty / error / success"
        description="Every data-fetching screen renders all four states. No blank screens. No indeterminate spinners as the only feedback."
      />
      <FourStatesDemo />
      <Code>{`function StudentsList() {
  const { data, isLoading, isError, error, refetch } = useStudents();

  if (isLoading) return <SkeletonTable rows={8} columns={5} />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if (!data?.length) {
    return (
      <EmptyState
        icon={Users}
        title="No students yet"
        description="Add your first student to see them here."
        action={<Button onClick={openAddStudent}>Add student</Button>}
      />
    );
  }
  return <StudentsTable rows={data} />;
}`}</Code>
      <DoDont
        doItems={[
          "Use the Skeleton family (Skeleton, SkeletonText, SkeletonRow, SkeletonCard, SkeletonTable).",
          "Give EmptyState a useful primary action (Add X, Import X).",
          "Pass the raw error to ErrorState via `error` — it extracts `message`.",
          "Set aria-busy / aria-live on custom skeleton containers.",
        ]}
        dontItems={[
          "Return null while loading — users see a blank flash.",
          "Inline animate-pulse divs duplicating Skeleton's logic.",
          "Show only a toast on error and leave the page blank.",
          "Use a centered spinner with no structure hint.",
        ]}
      />
    </div>
  );
}

function ResponsivePattern() {
  return (
    <div className="space-y-4">
      <Anchor
        id="patterns-responsive"
        title="Responsive grid"
        description="Design mobile-first. Verify at 375 (mobile), 768 (tablet), and 1280+ (desktop) before closing a migration task."
      />
      <Card padding="sm" className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {["Students", "Staff", "Classes", "Fees"].map((label) => (
            <div
              key={label}
              className="rounded-md border border-gray-100 dark:border-zinc-800 p-4 text-sm text-gray-700 dark:text-zinc-300"
            >
              {label}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-zinc-400">
          1 col at 375px → 2 cols at 768px → 4 cols at 1280px.
        </p>
      </Card>
      <Code>{`<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
  {items.map((item) => <StatCard key={item.id} {...item} />)}
</div>`}</Code>
      <DoDont
        doItems={[
          "Start from the mobile layout and scale up (sm:, md:, lg:).",
          "Hide dense toolbars behind a FiltersPanel or Drawer on <768px.",
          "Let tables overflow horizontally with `overflow-x-auto`, never shrink below usable column widths.",
          "Reserve space for primary actions in a sticky bottom bar on mobile.",
        ]}
        dontItems={[
          "Arbitrary Tailwind values (w-[173px], h-[37px]) — use the spacing scale.",
          "Fixed pixel widths on layout containers.",
          "Desktop-only patterns (multi-column forms, hover-only actions) without a mobile fallback.",
          "Hiding critical actions on small screens instead of repositioning them.",
        ]}
      />
    </div>
  );
}

function FocusPattern() {
  return (
    <div className="space-y-4">
      <Anchor
        id="patterns-focus"
        title="Focus states"
        description="Keyboard users must always see where they are. Use focus-visible, never suppress outlines."
      />
      <Card padding="sm" className="space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <Button size="sm">Tab to me</Button>
          <a
            href="#patterns-focus"
            className="text-sm text-primary-600 dark:text-primary-400 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded"
          >
            Anchor link
          </a>
          <input
            type="text"
            placeholder="Tab to focus"
            className="h-9 px-3 text-sm rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-zinc-400">
          Every interactive element uses{" "}
          <code className="font-mono text-xs">
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
          </code>
          .
        </p>
      </Card>
      <DoDont
        doItems={[
          "Use `focus-visible:` so rings only show for keyboard users.",
          "Use the primary token color for focus rings (never an arbitrary hex).",
          "Preserve focus after modals/drawers close — return it to the trigger.",
          "Add skip-to-content links at page level.",
        ]}
        dontItems={[
          "`outline-none` without a replacement focus indicator.",
          "Hover-only affordances (:hover styles with no :focus equivalent).",
          "Removing focus from inputs on mobile just to hide a ring.",
          "Trapping focus inside a closed dialog.",
        ]}
      />
    </div>
  );
}

const PLAYBOOK_STEPS = [
  {
    n: 1,
    title: "Read first — don't refactor blind",
    body:
      "Read the full file. Read adjacent sub-components. Query Notion for prior UI-XX tasks that touched nearby code. Understand the data flow before you touch anything.",
  },
  {
    n: 2,
    title: "Map scope before editing",
    body:
      "List every file in the module (list, detail, create, edit, tabs, modals, drawers, hooks, utils). If the slice is more than ~6 hours, stop and propose a split — the pilot hit this wall with pages/students/ at ~4,900 lines across 11 files.",
  },
  {
    n: 3,
    title: "Split files over 500 lines in the same pass",
    body:
      "CLAUDE.md is strict: any file over ~500 lines must be broken up during migration. The pilot surfaced StudentDashboard.jsx (878), AddStudent.jsx (617), TCGeneratorModal.jsx (605), StudentFormSubmissions.jsx (602), pages/students/index.jsx (533), StudentAttendance.jsx (525) — all need splits.",
  },
  {
    n: 4,
    title: "Replace ad-hoc markup with primitives",
    body:
      "Inline animate-pulse divs → Skeleton family. Ad-hoc empty text → EmptyState. Red banners → Alert/ErrorState. Custom tab strips → MinimalTabs. Card-like divs → Card. Never rebuild what src/components/ui/ already provides.",
  },
  {
    n: 5,
    title: "Swap raw Tailwind colors for semantic tokens",
    body:
      "Raw gray-*/zinc-* utilities in body content are a code smell. Wrap in primitives or use semantic token classes (text-primary, bg-surface, border-default). Dark mode support comes for free when tokens are used.",
  },
  {
    n: 6,
    title: "Render all four data states",
    body:
      "Every screen that fetches: Skeleton (loading) → EmptyState (no data) → ErrorState with onRetry (failure) → success. No blank flashes, no indeterminate spinners.",
  },
  {
    n: 7,
    title: "Forms: Zod schema mirrors Mongoose exactly",
    body:
      "Any Joi encountered → migrate to Zod in the same change. Every field in the Mongoose schema must exist in the Zod schema with matching types, enums, and required flags. Reuse the backend schema where possible.",
  },
  {
    n: 8,
    title: "Preserve API contracts and URL routes",
    body:
      "This is a UI refactor. Route paths, request/response shapes, and business logic stay identical. If a backend gap blocks the UI, stop and file a follow-up task instead of changing the contract.",
  },
  {
    n: 9,
    title: "Verify responsive at 375 / 768 / 1280",
    body:
      "Use preview_resize at all three breakpoints before marking done. The pilot could not run preview tooling — browser verification must happen in the session that closes the task.",
  },
  {
    n: 10,
    title: "Lint + build + keyboard pass",
    body:
      "`npm run lint` and `npm run build` both zero warnings. Tab through every interactive element — visible focus on each. Keyboard-open every modal/drawer and Escape-close it.",
  },
  {
    n: 11,
    title: "Report back on the Notion task",
    body:
      "Fill WHAT WAS DONE, WHY IT WAS NEEDED, SCREENSHOTS (at 3 breakpoints), PRIMITIVES ADDED/EXTENDED, FOLLOW-UPS. Leave status as In progress — the user marks Done.",
  },
];

function MigrationPlaybook() {
  return (
    <div className="space-y-4">
      <Anchor
        id="patterns-playbook"
        title="Migration playbook"
        description="Follow this sequence when migrating a module. Every step was surfaced as a concrete gap during the UI-14 pilot (Students)."
      />
      <Alert variant="info" title="Rule of thumb">
        If you&apos;re styling something ad-hoc, the primitive probably already exists. Search
        src/components/ui/ first. If it genuinely doesn&apos;t, extend the system and document it
        here before using it in a page.
      </Alert>
      <ol className="space-y-3">
        {PLAYBOOK_STEPS.map((step) => (
          <li
            key={step.n}
            className="rounded-md border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex gap-4"
          >
            <span className="shrink-0 h-7 w-7 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 flex items-center justify-center text-sm font-semibold">
              {step.n}
            </span>
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                {step.title}
              </p>
              <p className="text-sm text-gray-500 dark:text-zinc-400">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

const PILOT_FINDINGS = [
  {
    title: "Inline skeletons duplicate the primitive",
    detail:
      "StudentsList.jsx had ~60 lines of raw bg-gray-200 dark:bg-zinc-700 animate-pulse divs — fixed by the pilot using the Skeleton primitive. Every other list page likely has the same pattern.",
  },
  {
    title: "Raw Tailwind gray-*/zinc-* in body content",
    detail:
      "Sub-components across pages/students/ reference utility colors directly instead of semantic tokens. Schedule a tokens pass alongside each module migration.",
  },
  {
    title: "Large monolithic files",
    detail:
      "Six files in pages/students/ exceed the 500-line split rule. This pattern repeats across older modules — Dashboard, Fees, Academics.",
  },
  {
    title: "Missing preview tooling breaks verification",
    detail:
      "The pilot session had no preview_start/preview_screenshot/preview_resize available. Browser verification at 3 breakpoints must happen in the same session the task is closed; otherwise, file a follow-up.",
  },
  {
    title: "Scope audits are non-negotiable",
    detail:
      "The pilot initially treated Students as one task but measurement showed 15–25 hours of real work. Always audit before starting, and split proactively into UI-XXa/b/c slices.",
  },
];

function PilotRetro() {
  return (
    <div className="space-y-4">
      <Anchor
        id="patterns-pilot-retro"
        title="Pilot retro (UI-14)"
        description="Concrete gaps surfaced when migrating the Students module. Treat these as a pre-flight checklist for every subsequent module task."
      />
      <ul className="space-y-2">
        {PILOT_FINDINGS.map((finding) => (
          <li
            key={finding.title}
            className="rounded-md border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"
          >
            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">
              {finding.title}
            </p>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{finding.detail}</p>
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-500 dark:text-zinc-400 flex items-center gap-1">
        <ExternalLink size={12} aria-hidden="true" />
        Source: Notion task UI-14 retro notes (2026-04-21).
      </p>
    </div>
  );
}

export default function PatternsSection() {
  return (
    <div className="space-y-10">
      <FourStatesPattern />
      <Divider />
      <ResponsivePattern />
      <Divider />
      <FocusPattern />
      <Divider />
      <MigrationPlaybook />
      <Divider />
      <PilotRetro />
    </div>
  );
}
