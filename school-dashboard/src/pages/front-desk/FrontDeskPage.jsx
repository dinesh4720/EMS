import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Users, DoorOpen, Calendar, GraduationCap, MessageSquare, Phone,
} from "lucide-react";

import useFrontDeskData, { ACTIVITY_TYPES } from "../../hooks/useFrontDeskData";
import FrontDeskKpiStrip from "../../components/front-desk/FrontDeskKpiStrip";
import ActivityTable from "../../components/front-desk/ActivityTable";
import VisitorSheet from "../../components/front-desk/VisitorSheet";
import GatePassSheet from "../../components/front-desk/GatePassSheet";
import ToolbarSearch from "../../components/ui/ToolbarSearch";
import Skeleton from "../../components/ui/Skeleton";
import { PageShell } from "../../components/ui";

const VALID_TYPES = new Set(["all", ...Object.values(ACTIVITY_TYPES)]);
const ACTIVITY_PAGE_SIZE = 25;

// REVAMP-29 — Front Desk hub.
// KPI strip (dp-metric pattern), quick actions (.optgrid), filterable activity
// stream. Activity type lives in URL via ?type=... so KPI cells deep-link.
export default function FrontDeskPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const type = (() => {
    const raw = searchParams.get("type");
    return VALID_TYPES.has(raw) ? raw : "all";
  })();
  const sheet = searchParams.get("sheet"); // "visitor" | "gatepass" | null

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [visibleCount, setVisibleCount] = useState(ACTIVITY_PAGE_SIZE);
  const activityRef = useRef(null);

  const { kpis, filtered, isLoading, refetch } = useFrontDeskData({
    type,
    search,
  });

  // Reset paging when filter/search changes so users don't see stale offsets.
  useEffect(() => {
    setVisibleCount(ACTIVITY_PAGE_SIZE);
  }, [type, search]);

  const setType = (next) => {
    setSearchParams(
      (prev) => {
        const out = new URLSearchParams(prev);
        if (!next || next === "all") out.delete("type");
        else out.set("type", next);
        return out;
      },
      { replace: false }
    );
  };

  const openSheet = (which) => {
    setSearchParams(
      (prev) => {
        const out = new URLSearchParams(prev);
        out.set("sheet", which);
        return out;
      },
      { replace: false }
    );
  };
  const closeSheet = () => {
    setSearchParams(
      (prev) => {
        const out = new URLSearchParams(prev);
        out.delete("sheet");
        return out;
      },
      { replace: false }
    );
  };

  const scrollToActivity = () => {
    requestAnimationFrame(() => {
      activityRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  // Dense quick actions — the two with sheets (visitor / gate pass) trigger
  // creation; the rest jump-filter the activity stream and scroll into view.
  const quickActions = [
    {
      key: "visitor",
      label: "New visitor",
      icon: Users,
      action: () => openSheet("visitor"),
      isActive: false,
    },
    {
      key: "gatepass",
      label: "Issue gate pass",
      icon: DoorOpen,
      action: () => openSheet("gatepass"),
      isActive: false,
    },
    {
      key: ACTIVITY_TYPES.APPOINTMENT,
      label: "Appointments",
      icon: Calendar,
      action: () => { setType(ACTIVITY_TYPES.APPOINTMENT); scrollToActivity(); },
      isActive: type === ACTIVITY_TYPES.APPOINTMENT,
    },
    {
      key: ACTIVITY_TYPES.ADMISSION,
      label: "Admissions",
      icon: GraduationCap,
      action: () => { setType(ACTIVITY_TYPES.ADMISSION); scrollToActivity(); },
      isActive: type === ACTIVITY_TYPES.ADMISSION,
    },
    {
      key: ACTIVITY_TYPES.FEEDBACK,
      label: "Feedback",
      icon: MessageSquare,
      action: () => { setType(ACTIVITY_TYPES.FEEDBACK); scrollToActivity(); },
      isActive: type === ACTIVITY_TYPES.FEEDBACK,
    },
    {
      key: ACTIVITY_TYPES.CALL,
      label: "Calls",
      icon: Phone,
      action: () => { setType(ACTIVITY_TYPES.CALL); scrollToActivity(); },
      isActive: type === ACTIVITY_TYPES.CALL,
    },
  ];

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  const toolbar = (
    <div ref={activityRef} className="toolbar" style={{ borderBottom: "none", paddingTop: 0 }}>
      <ToolbarSearch
        value={search}
        onChange={setSearch}
        urlParam="q"
        placeholder="Search names, purposes…"
        ariaLabel="Search activity"
        style={{ flex: 1, maxWidth: 360 }}
      />

      <div className="seg" role="tablist" aria-label="Filter activity">
        {[
          { key: "all", label: "All" },
          { key: ACTIVITY_TYPES.VISITOR, label: "Visitors" },
          { key: ACTIVITY_TYPES.GATE_PASS, label: "Gate passes" },
          { key: ACTIVITY_TYPES.APPOINTMENT, label: "Appointments" },
          { key: ACTIVITY_TYPES.ADMISSION, label: "Admissions" },
          { key: ACTIVITY_TYPES.FEEDBACK, label: "Feedback" },
          { key: ACTIVITY_TYPES.CALL, label: "Calls" },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={type === f.key}
            className={`seg__btn${type === f.key ? " is-active" : ""}`}
            onClick={() => setType(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <PageShell
      title="Front desk"
      description={`${todayLabel} · ${kpis.visitorsToday} visitors · ${kpis.gatePassesPending} passes pending`}
      actions={
        <div className="row gap-2">
          <button
            type="button"
            className="btn"
            onClick={() => openSheet("gatepass")}
          >
            <DoorOpen size={13} aria-hidden /> Issue gate pass
          </button>
          <button
            type="button"
            className="btn btn--accent"
            onClick={() => openSheet("visitor")}
          >
            <Users size={13} aria-hidden /> Check in visitor
          </button>
        </div>
      }
      toolbar={toolbar}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Front desk" },
      ]}
      bodyPadding="none"
    >
      <div className="fd-page" style={{ paddingBottom: 24 }}>
        <FrontDeskKpiStrip
          kpis={kpis}
          activeType={type}
          onTypeChange={setType}
        />

        <section className="fd-quick" aria-label="Quick actions">
          <div className="fd-quick__label">Quick actions</div>
          <div className="optgrid">
            {quickActions.map((q) => (
              <button
                key={q.key}
                type="button"
                className={`opt${q.isActive ? " is-active" : ""}`}
                onClick={q.action}
              >
                <q.icon size={14} className="opt__icon" aria-hidden />
                <span>{q.label}</span>
              </button>
            ))}
          </div>
        </section>

        {isLoading ? (
          <div className="fd-table" role="status" aria-busy="true" aria-label="Loading activity">
            <div className="fd-table__head" role="row">
              <span><Skeleton variant="text" className="h-3 w-12" /></span>
              <span><Skeleton variant="text" className="h-3 w-16" /></span>
              <span><Skeleton variant="text" className="h-3 w-20" /></span>
              <span><Skeleton variant="text" className="h-3 w-10" /></span>
              <span><Skeleton variant="text" className="h-3 w-14" /></span>
              <span className="fd-table__action"><Skeleton variant="text" className="h-3 w-4" /></span>
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="fd-table__row" role="row">
                <span className="row gap-2" style={{ alignItems: "center" }}>
                  <Skeleton variant="circle" className="h-4 w-4" />
                  <Skeleton variant="text" className="h-3 w-14" />
                </span>
                <span><Skeleton variant="text" className="h-3 w-24" /></span>
                <span><Skeleton variant="text" className="h-3 w-32" /></span>
                <span><Skeleton variant="text" className="h-3 w-14" /></span>
                <span><Skeleton variant="rect" className="h-5 w-16" style={{ borderRadius: 999 }} /></span>
                <span className="fd-table__action"><Skeleton variant="text" className="h-3 w-4" /></span>
              </div>
            ))}
          </div>
        ) : (
          <>
            <ActivityTable rows={visible} />
            {hasMore && (
              <div className="fd-more">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setVisibleCount((n) => n + ACTIVITY_PAGE_SIZE)}
                >
                  Show more
                  <span className="mono tnum" style={{ marginLeft: 6, color: "var(--fg-subtle)" }}>
                    ({filtered.length - visibleCount} more)
                  </span>
                </button>
              </div>
            )}
          </>
        )}

        <VisitorSheet
          isOpen={sheet === "visitor"}
          onClose={closeSheet}
          onCheckedIn={refetch}
        />
        <GatePassSheet
          isOpen={sheet === "gatepass"}
          onClose={closeSheet}
          onIssued={refetch}
        />
      </div>
    </PageShell>
  );
}
