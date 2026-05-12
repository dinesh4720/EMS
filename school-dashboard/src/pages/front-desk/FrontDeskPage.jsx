import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Users, DoorOpen } from "lucide-react";

import useFrontDeskData, { ACTIVITY_TYPES } from "../../hooks/useFrontDeskData";
import FrontDeskKpiStrip from "../../components/front-desk/FrontDeskKpiStrip";
import ActivityTable from "../../components/front-desk/ActivityTable";
import VisitorSheet from "../../components/front-desk/VisitorSheet";
import GatePassSheet from "../../components/front-desk/GatePassSheet";
import ToolbarSearch from "../../components/ui/ToolbarSearch";

const VALID_TYPES = new Set(["all", ...Object.values(ACTIVITY_TYPES)]);

// Phase 9 — top-level Front Desk page. Single canonical surface;
// activity type lives in URL via ?type=... so KPI cells become deep-links.
export default function FrontDeskPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const type = (() => {
    const raw = searchParams.get("type");
    return VALID_TYPES.has(raw) ? raw : "all";
  })();
  const sheet = searchParams.get("sheet"); // "visitor" | "gatepass" | null

  const [search, setSearch] = useState(searchParams.get("q") || "");

  const { kpis, filtered, isLoading, refetch } = useFrontDeskData({
    type,
    search,
  });

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

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="page fd-page">
      <div className="page__head">
        <div>
          <h1 className="page__title">Front desk</h1>
          <div className="page__sub mono tnum">
            {todayLabel} · {kpis.visitorsToday} visitors · {kpis.gatePassesPending} passes pending
          </div>
        </div>
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
      </div>

      <FrontDeskKpiStrip
        kpis={kpis}
        activeType={type}
        onTypeChange={setType}
      />

      <div className="toolbar" style={{ borderBottom: "none", paddingTop: 0 }}>
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

      {isLoading ? (
        <div className="fd-table">
          <div className="fd-table__empty">Loading activity…</div>
        </div>
      ) : (
        <ActivityTable rows={filtered} />
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
  );
}
