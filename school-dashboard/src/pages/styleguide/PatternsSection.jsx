import { useState } from "react";
import { Plus, Search, Wallet, BellRing, Clock, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

import { Story, StoryGroup } from "./shared";
import TwoPaneDemo from "./sections/patterns/TwoPaneDemo";
import { TWO_PANE_STAFF } from "./sections/patterns/twoPaneStaff";
import DetailPaneMini from "./sections/patterns/DetailPaneMini";
import ComposerDemoOverlay from "./sections/patterns/ComposerDemoOverlay";
import StickyHeadFootDemo from "./sections/patterns/StickyHeadFootDemo";
import BulkActionBarDemo from "./sections/patterns/BulkActionBarDemo";
import FrostedDemoOverlay from "./sections/patterns/FrostedDemoOverlay";
import DensityTableDemo from "./sections/patterns/DensityTableDemo";
import PeriodStripDemo from "./sections/patterns/PeriodStripDemo";
import ClassTileDemo from "./sections/patterns/ClassTileDemo";
import ChatListDemo from "./sections/patterns/ChatListDemo";
import CalendarGridDemo from "./sections/patterns/CalendarGridDemo";

/* ──────────────────────────────────────────────────────────────────
 * Patterns — scoped, page-level patterns built from primitives + tokens.
 * These have hand-written CSS in src/styles/{classes,fees,calendar,messaging}.
 *
 * Each pattern demo lives in its own file under ./sections/patterns/.
 * This module just mounts them in order alongside the inline showcase
 * groups (toolbar, KPI tile, KPI strip) that need shell-local state.
 * ────────────────────────────────────────────────────────────────── */

export default function PatternsSection() {
  const [filter, setFilter] = useState("all");
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [bulkSelect, setBulkSelect] = useState(false);

  return (
    <>
      <StoryGroup
        id="pattern-two-pane"
        title="Two-pane list + frosted detail"
        sub="Canonical list shape — left list scrolls, right .detail-pane stays pinned with sticky head/foot. Selection lives in the URL so back/forward and direct-link work. Source of truth: src/pages/staffs/StaffList.jsx."
      >
        <Story title="Live mini two-pane" layout="plain">
          <TwoPaneDemo />
        </Story>
      </StoryGroup>

      <StoryGroup
        id="pattern-composer"
        title="Composer overlay"
        sub="Full-bleed frosted card portaled to document.body. Replaces the legacy HeroUI <Drawer> for create / multi-step flows. Solid surface for the form area, frosted nav rail on the left, no scrim animation. Source of truth: src/pages/staffs/AddStaffComposer.jsx."
      >
        <Story title="Live composer overlay">
          <button
            type="button"
            className="btn btn--accent"
            onClick={() => setComposerOpen(true)}
          >
            <Plus size={14} aria-hidden /> Open composer overlay
          </button>
          <ComposerDemoOverlay open={composerOpen} onClose={() => setComposerOpen(false)} />
        </Story>
      </StoryGroup>

      <StoryGroup
        id="pattern-detail-pane"
        title="Frosted detail pane"
        sub=".detail-pane / .detail-pane__head / .detail-pane__hero / .detail-pane__metrics / .dp-metric / .dp-feed / .dp-kv / .detail-pane__foot — the right rail of the two-pane shell. Head + foot are sticky so primary actions stay reachable while the body scrolls."
      >
        <Story title="Standalone pane" layout="plain">
          <div style={{ display: "flex", justifyContent: "center", padding: 16 }}>
            <div style={{ width: 320, height: 420, border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", display: "flex" }}>
              <DetailPaneMini staff={TWO_PANE_STAFF[0]} onClear={() => {}} />
            </div>
          </div>
        </Story>
      </StoryGroup>

      <StoryGroup
        id="pattern-sticky"
        title="Sticky head & foot"
        sub="Scroll body with pinned chrome — the recipe used inside .detail-pane, .composer, and .drawer. Body gets overflow:auto + min-height:0; head and foot are position:sticky."
      >
        <Story title="Live scroll demo" layout="plain">
          <div style={{ padding: 16 }}>
            <StickyHeadFootDemo />
          </div>
        </Story>
      </StoryGroup>

      <StoryGroup
        id="pattern-toolbar"
        title="Toolbar + segmented filter"
        sub=".toolbar / .toolbar__search / .seg / .seg__btn — used at the top of list pages"
      >
        <Story title="Search + segmented filter" layout="plain">
          <div className="toolbar" style={{ borderBottom: "none", padding: 16 }}>
            <div className="toolbar__search" style={{ flex: 1, maxWidth: 320 }}>
              <Search size={13} style={{ color: "var(--fg-subtle)" }} aria-hidden />
              <input type="text" placeholder="Search…" aria-label="Search demo" />
              <span className="kbd" aria-hidden>/</span>
            </div>
            <div className="seg" role="tablist" aria-label="Filter">
              {[
                { key: "all", label: "All" },
                { key: "active", label: "Active" },
                { key: "needs", label: "Needs attention" },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  role="tab"
                  aria-selected={filter === f.key}
                  className={`seg__btn${filter === f.key ? " is-active" : ""}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </Story>
      </StoryGroup>

      <StoryGroup
        id="pattern-tile"
        title="KPI tile"
        sub=".tile — dense numerical summary used across dashboard, fees, front-desk"
      >
        <Story title="Tile grid" layout="grid">
          <div className="tile">
            <div className="tile__head"><span className="subtle text-xs">Total students</span></div>
            <div className="tile__value tnum">1,247</div>
            <div className="tile__sub">+12 this term</div>
          </div>
          <div className="tile">
            <div className="tile__head"><span className="subtle text-xs">Attendance</span></div>
            <div className="tile__value tnum">94%</div>
            <div className="tile__sub" style={{ color: "var(--ok)" }}>↑ +1.2 vs last week</div>
          </div>
          <div className="tile">
            <div className="tile__head"><span className="subtle text-xs">Outstanding fees</span></div>
            <div className="tile__value tnum">₹1.84L</div>
            <div className="tile__sub" style={{ color: "var(--danger)" }}>23 students overdue</div>
          </div>
          <div className="tile">
            <div className="tile__head"><span className="subtle text-xs">Active staff</span></div>
            <div className="tile__value tnum">87</div>
            <div className="tile__sub">3 on leave today</div>
          </div>
        </Story>
      </StoryGroup>

      <StoryGroup
        id="pattern-kpi"
        title="KPI strips"
        sub=".fees-kpi / .fd-kpi / .academics-kpi — clickable cells that filter the table below"
      >
        <Story title="Fees KPI strip" layout="plain">
          <div style={{ padding: 16 }}>
            <div className="fees-kpi">
              <button type="button" className="fees-kpi__cell">
                <div className="fees-kpi__head">
                  <span className="fees-kpi__label">Collected today</span>
                  <span className="fees-kpi__icon fees-kpi__icon--ok" aria-hidden>
                    <Wallet size={13} />
                  </span>
                </div>
                <span className="fees-kpi__value tnum">₹52,400</span>
                <span className="fees-kpi__sub">
                  <span className="fees-kpi__delta fees-kpi__delta--up">
                    <TrendingUp size={11} aria-hidden /> +12%
                  </span>
                  vs yesterday
                </span>
              </button>
              <button type="button" className="fees-kpi__cell">
                <div className="fees-kpi__head">
                  <span className="fees-kpi__label">Outstanding total</span>
                  <span className="fees-kpi__icon fees-kpi__icon--warn" aria-hidden>
                    <Clock size={13} />
                  </span>
                </div>
                <span className="fees-kpi__value tnum">₹1,84,200</span>
                <span className="fees-kpi__sub">
                  <span className="fees-kpi__delta fees-kpi__delta--down">
                    <TrendingDown size={11} aria-hidden /> −3%
                  </span>
                  pending + overdue
                </span>
              </button>
              <button type="button" className="fees-kpi__cell is-active">
                <div className="fees-kpi__head">
                  <span className="fees-kpi__label">Overdue · students</span>
                  <span className="fees-kpi__icon fees-kpi__icon--danger" aria-hidden>
                    <AlertTriangle size={13} />
                  </span>
                </div>
                <span className="fees-kpi__value fees-kpi__value--danger tnum">23</span>
                <span className="fees-kpi__sub">tap to triage</span>
              </button>
            </div>
          </div>
        </Story>

        <Story title="Bulk action chip" sub="Legacy .fees-bulk surface (pre-REVAMP-101)">
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => setBulkSelect((v) => !v)}
          >
            Toggle selection
          </button>
          {bulkSelect && (
            <div className="fees-bulk" role="status">
              <span className="fees-bulk__label">
                <span className="fees-bulk__count">3</span> selected
              </span>
              <span className="fees-bulk__divider" aria-hidden />
              <button type="button" className="btn btn--sm">
                <BellRing size={12} aria-hidden /> Send reminder
              </button>
              <button type="button" className="btn btn--sm">Mark paid</button>
              <span style={{ flex: 1 }} />
              <button type="button" className="btn btn--sm" onClick={() => setBulkSelect(false)}>
                Clear
              </button>
            </div>
          )}
        </Story>

        <Story
          title="Bulk action bar (canonical)"
          sub="useBulkSelection + <BulkActionBar/> — Esc clears, shift-click range, 'Select all matching N' when filtered (REVAMP-101)"
        >
          <BulkActionBarDemo />
        </Story>
      </StoryGroup>

      <StoryGroup
        id="pattern-table"
        title="Density table"
        sub=".fees-table grid pattern — also fd-table, academics-table"
      >
        <DensityTableDemo />
      </StoryGroup>

      <StoryGroup
        id="pattern-period"
        title="Period strip"
        sub=".period-strip + .period-cell — Phase 6 Classes attendance"
      >
        <PeriodStripDemo />
      </StoryGroup>

      <StoryGroup
        id="pattern-class-tile"
        title="Class tile"
        sub=".class-tile — attendance % grid with sparkline"
      >
        <ClassTileDemo />
      </StoryGroup>

      <StoryGroup
        id="pattern-chat"
        title="Chat list + bubbles"
        sub=".chat-list / .chat-bubble — Phase 10 Messaging"
      >
        <ChatListDemo />
      </StoryGroup>

      <StoryGroup
        id="pattern-calendar"
        title="Calendar grid"
        sub=".calendar-month + .calendar-event — Phase 8"
      >
        <CalendarGridDemo />
      </StoryGroup>

      <StoryGroup
        id="pattern-frosted"
        title="Frosted overlay"
        sub=".frosted-overlay — shared chrome for student detail, payment sheet, visitor sheet, calendar drawer"
      >
        <Story title="Live demo">
          <button type="button" className="btn btn--accent" onClick={() => setOverlayOpen(true)}>
            <Plus size={14} aria-hidden /> Open frosted overlay
          </button>
          <FrostedDemoOverlay open={overlayOpen} onClose={() => setOverlayOpen(false)} />
        </Story>
      </StoryGroup>
    </>
  );
}
