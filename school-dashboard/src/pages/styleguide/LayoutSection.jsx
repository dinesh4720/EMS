import { useState } from "react";
import {
  Users, TrendingUp, TrendingDown, Wallet, Bell, Plus, Search,
  LayoutDashboard, Settings, ShieldAlert, Check,
} from "lucide-react";

import PageHeader from "../../components/ui/PageHeader";
import PageLayout from "../../components/ui/PageLayout";
import PageShell from "../../components/ui/PageShell";
import Divider from "../../components/ui/Divider";
import StatCard from "../../components/ui/StatCard";
import ChartCard from "../../components/ui/ChartCard";
import QuickActionTile from "../../components/ui/QuickActionTile";
import MinimalCard from "../../components/ui/MinimalCard";
import MinimalButton from "../../components/ui/MinimalButton";
import MinimalTabs from "../../components/ui/MinimalTabs";
import Timeline from "../../components/ui/Timeline";
import SectionHeading from "../../components/ui/SectionHeading";
import ContentSection from "../../components/ui/ContentSection";
import FormSection from "../../components/ui/FormSection";
import SchoolSwitcher from "../../components/layout/SchoolSwitcher";
import UserMenu from "../../components/layout/UserMenu";
import NotificationBell from "../../components/layout/NotificationBell";
import PermissionDenied from "../../components/layout/PermissionDenied";
import PermissionGuard from "../../components/layout/PermissionGuard";

import { Story, StoryGroup } from "./shared";

const TIMELINE_ITEMS = [
  { icon: Users, tone: "primary", title: "New student enrolled", description: "Riya Mehta joined Class 3-A", time: "2 min ago" },
  { icon: Wallet, tone: "success", title: "Fee collected", description: "₹13,000 received for Term 1", time: "1 hr ago" },
  { icon: Bell, tone: "warning", title: "Late attendance", description: "3 students marked late today", time: "3 hr ago" },
];

export default function LayoutSection() {
  const [tab, setTab] = useState("overview");
  const [layoutTab, setLayoutTab] = useState("tab1");

  return (
    <>
      <StoryGroup
        id="layout-headers"
        title="Page Structure"
        sub="Headers, section headings, and content containers."
      >
        <Story title="PageHeader" layout="col">
          <PageHeader
            title="Students"
            description="Manage enrollments, attendance, and performance."
            breadcrumb={<span className="text-xs text-fg-subtle">Home / Students</span>}
            actions={<MinimalButton size="sm" icon={<Plus size={14} />}>Add</MinimalButton>}
          />
          <PageHeader
            title="Large header"
            size="lg"
            actions={
              <div className="flex gap-2">
                <MinimalButton variant="ghost" size="sm">Export</MinimalButton>
                <MinimalButton variant="primary" size="sm">Save</MinimalButton>
              </div>
            }
          />
        </Story>

        <Story title="SectionHeading" layout="col">
          <SectionHeading title="Academic Details" subtitle="Class, section, and roll number" />
          <SectionHeading title="With action" action={<button className="text-xs text-accent">Edit</button>} />
        </Story>

        <Story title="ContentSection & FormSection" layout="col">
          <ContentSection title="Personal Info">
            <div className="h-12 bg-surface-2 rounded" aria-hidden />
          </ContentSection>
          <FormSection title="Contact Details" description="Phone and address for communication.">
            <div className="h-12 bg-surface-2 rounded" aria-hidden />
          </FormSection>
        </Story>
      </StoryGroup>

      <StoryGroup
        id="layout-shell"
        title="App Shell"
        sub="Layout primitives that structure the full page."
      >
        <Story title="PageLayout" layout="col">
          <PageLayout
            header={<span className="text-sm font-medium">Page title</span>}
            tabs={[
              { key: "tab1", title: "Overview" },
              { key: "tab2", title: "Details" },
            ]}
            activeTab={layoutTab}
            onTabChange={setLayoutTab}
          >
            <div className="h-20 bg-surface-2 rounded flex items-center justify-center text-xs text-fg-subtle">
              Page content area
            </div>
          </PageLayout>
        </Story>

        <Story title="PageShell" layout="col">
          <PageShell
            title="PageShell demo"
            description="Sets document title and meta automatically."
            size="md"
          >
            <div className="h-20 bg-surface-2 rounded flex items-center justify-center text-xs text-fg-subtle">
              Content wrapped in PageShell
            </div>
          </PageShell>
        </Story>
      </StoryGroup>

      <StoryGroup
        id="layout-nav"
        title="Navigation Chrome"
        sub="Sidebar, topbar, and menu components."
      >
        <Story title="SchoolSwitcher" layout="row">
          <div className="w-64 border border-divider rounded-lg overflow-hidden">
            <SchoolSwitcher />
          </div>
          <div className="w-16 border border-divider rounded-lg overflow-hidden">
            <SchoolSwitcher collapsed />
          </div>
        </Story>

        <Story title="UserMenu" layout="row">
          <UserMenu />
          <UserMenu collapsed />
        </Story>

        <Story title="NotificationBell" layout="row">
          <NotificationBell />
        </Story>
      </StoryGroup>

      <StoryGroup
        id="layout-perm"
        title="Permission"
        sub="Access control components."
      >
        <Story title="PermissionDenied" layout="center">
          <div className="max-w-md">
            <PermissionDenied module="students" action="edit" />
          </div>
        </Story>

        <Story title="PermissionGuard" layout="center">
          <PermissionGuard module="students" action="view">
            <div className="p-4 bg-ok-bg border border-ok-border rounded-lg text-ok text-sm">
              <Check size={14} className="inline mr-1" />
              You have permission to see this content.
            </div>
          </PermissionGuard>
        </Story>
      </StoryGroup>

      <StoryGroup
        id="layout-divider"
        title="Divider"
        sub="Horizontal and vertical separators with optional labels."
      >
        <Story title="Divider variants" layout="col">
          <Divider />
          <Divider label="OR" />
          <Divider spacing="lg" />
          <div className="flex h-8 items-center gap-2">
            <span className="text-sm">Left</span>
            <Divider orientation="vertical" />
            <span className="text-sm">Right</span>
          </div>
        </Story>
      </StoryGroup>

      <StoryGroup
        id="layout-cards"
        title="Cards & Tiles"
        sub="Stat cards, chart containers, quick actions, and minimal cards."
      >
        <Story title="StatCard" layout="grid">
          <StatCard label="Total Students" value="1,248" icon={Users} color="primary" />
          <StatCard label="Fee Collected" value="₹4.2L" icon={Wallet} color="success" trend={{ positive: true, value: "12%" }} />
          <StatCard label="Pending" value="₹1.1L" icon={TrendingDown} color="danger" trend={{ positive: false, value: "3%" }} />
          <StatCard label="Attendance" value="94%" icon={TrendingUp} color="emerald" />
        </Story>

        <Story title="ChartCard" layout="col">
          <ChartCard
            title="Monthly Revenue"
            description="Fee collection trend over 6 months"
            height={180}
            footer={<span className="text-xs text-fg-subtle">Last updated 10 min ago</span>}
          >
            <div className="h-full flex items-end gap-2 px-2">
              {[40, 65, 50, 80, 55, 90].map((height, idx) => (
                <div key={idx} className="flex-1 bg-accent-bg rounded-t" style={{ height: `${height}%` }} aria-hidden />
              ))}
            </div>
          </ChartCard>
        </Story>

        <Story title="QuickActionTile" layout="grid">
          <QuickActionTile
            label="Collect Fee"
            description="Record a new payment"
            icon={Wallet}
            tone="primary"
          />
          <QuickActionTile
            label="Mark Attendance"
            description="Daily roll-call"
            icon={Users}
            tone="success"
            layout="stacked"
          />
        </Story>

        <Story title="MinimalCard" layout="grid">
          <MinimalCard title="Compact" description="Basic minimal card with title.">
            <div className="h-8 bg-surface-2 rounded" aria-hidden />
          </MinimalCard>
          <MinimalCard title="With footer" footer={<span className="text-xs text-fg-subtle">Updated now</span>}>
            <div className="h-8 bg-surface-2 rounded" aria-hidden />
          </MinimalCard>
        </Story>
      </StoryGroup>

      <StoryGroup
        id="layout-minimal"
        title="Minimal Primitives"
        sub="Lightweight button and tab variants for dense UIs."
      >
        <Story title="MinimalButton" layout="row">
          <MinimalButton>Primary</MinimalButton>
          <MinimalButton variant="secondary">Secondary</MinimalButton>
          <MinimalButton variant="ghost">Ghost</MinimalButton>
          <MinimalButton variant="danger">Danger</MinimalButton>
          <MinimalButton size="sm" icon={<Plus size={14} />}>Small</MinimalButton>
        </Story>

        <Story title="MinimalTabs" layout="col">
          <MinimalTabs
            tabs={[
              { key: "overview", label: "Overview" },
              { key: "fees", label: "Fees" },
              { key: "attendance", label: "Attendance" },
            ]}
            activeKey={tab}
            onChange={setTab}
            variant="pills"
          />
          <MinimalTabs
            tabs={[
              { key: "a", label: "Details" },
              { key: "b", label: "History" },
              { key: "c", label: "Settings" },
            ]}
            activeKey="a"
            onChange={() => {}}
            variant="underline"
          />
        </Story>
      </StoryGroup>

      <StoryGroup
        id="layout-timeline"
        title="Timeline"
        sub="Chronological event list with icons, tones, and skeleton loading."
      >
        <Story title="Timeline" layout="col">
          <Timeline items={TIMELINE_ITEMS} />
        </Story>
      </StoryGroup>
    </>
  );
}
