import React from "react";
import { useApp } from "../context/AppContext";
import { dashboardData } from "../data/mockData";
import StatCard from "../components/StatCard";
import ChartSection from "../components/ChartSection";
import ActivityFeed from "../components/ActivityFeed";
import AlertsPanel from "../components/AlertsPanel";
import QuickActions from "../components/QuickActions";
import SubstitutionAlertPanel from "../components/SubstitutionAlertPanel";
import {
  GraduationCap,
  Users,
  IndianRupee,
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock
} from "lucide-react";

function Dashboard() {
  const { dashboardStats } = useApp();

  // Quick stats data
  const stats = [
    {
      label: "Total Students",
      value: dashboardStats.totalStudents?.toString() || "1,248",
      subtext: `${dashboardStats.totalClasses || 42} classes active`,
      icon: GraduationCap,
      color: "gray",
      trend: { value: "+12%", positive: true }
    },
    {
      label: "Teaching Staff",
      value: dashboardStats.totalTeachers?.toString() || "64",
      subtext: `${dashboardStats.activeStaff || 58} present today`,
      icon: Users,
      color: "gray",
      trend: { value: "+3", positive: true }
    },
    {
      label: "Fee Collection",
      value: "₹18.2L",
      subtext: "85% of target achieved",
      icon: IndianRupee,
      color: "teal",
      trend: { value: "92%", positive: true }
    },
    {
      label: "Avg Attendance",
      value: "94%",
      subtext: "Last 7 days average",
      icon: CheckCircle2,
      color: "gray",
      trend: { value: "+2.4%", positive: true }
    }
  ];

  // Quick actions data
  const quickActions = [
    { label: "Attendance", icon: CheckCircle2, href: "/classes" },
    { label: "Schedule", icon: Calendar, href: "/calendar" },
    { label: "Payments", icon: IndianRupee, href: "/fees" },
    { label: "Announce", icon: AlertCircle, href: "/messaging" },
  ];

  return (
    <div className="min-h-screen pb-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          Overview
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* MAIN CONTENT AREA */}
        <div className="xl:col-span-8 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>

          {/* Quick Actions */}
          <QuickActions actions={quickActions} />

          {/* Charts Section */}
          <ChartSection />

          {/* Activity Feed */}
          <ActivityFeed
            payments={dashboardData.recentPayments}
            announcements={dashboardData.recentAnnouncements}
            communications={dashboardData.parentCommunications}
          />
        </div>

        {/* RIGHT SIDEBAR - ALERTS & INFO */}
        <div className="xl:col-span-4 space-y-4">
          {/* Substitution Alerts - Shows when teachers are absent */}
          <SubstitutionAlertPanel />

          {/* General Alerts Panel */}
          <AlertsPanel />
        </div>
      </div>
    </div>
  );
}

export default React.memo(Dashboard);
