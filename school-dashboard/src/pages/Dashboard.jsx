import React from "react";
import CriticalAlerts from "../components/CriticalAlerts";
import TodaySnapshot from "../components/TodaySnapshot";
import QuickStats from "../components/QuickStats";
import RecentActivity from "../components/RecentActivity";
import { dashboardData } from "../data/mockData";
import { Button } from "@heroui/react";
import { CheckSquare, IndianRupee, Megaphone, Users, GraduationCap, TrendingUp, AlertOctagon } from "lucide-react";
import Banner from "../components/Banner";
import { useApp } from "../context/AppContext";
import { DashboardIllustration } from "../components/Illustrations";
import KPICardHovy from "../components/KPICardHovy";
import DashboardCharts from "../components/DashboardCharts";

export default function Dashboard() {
  const { dashboardStats } = useApp();

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* 1. Hero Section */}
      <div className="relative z-10">
        <Banner
          title="Welcome to EduMaster"
          description="Everything looks good today. Here is your daily school overview and pending tasks."
          illustration={DashboardIllustration}
          className="shadow-2xl shadow-primary/10"
        />
      </div>

      {/* 2. Key Metrics - Bento Grid Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICardHovy
          label="Total Students"
          value={dashboardStats.totalStudents}
          trend={`${dashboardStats.totalClasses} Classes`}
          trendUp={true}
          icon={<GraduationCap />}
          color="text-indigo-500"
          className="lg:col-span-1"
        />
        <KPICardHovy
          label="Total Staff"
          value={`${dashboardStats.activeStaff}/${dashboardStats.totalStaff}`}
          trend={`${dashboardStats.totalTeachers} Teachers`}
          trendUp={true}
          icon={<Users />}
          color="text-pink-500"
          className="lg:col-span-1"
        />
        <KPICardHovy
          label="Pending Fees for this Term"
          value="₹12.5L" // Mock data representing total pending fees
          trend="Due from 45 students"
          trendUp={false}
          icon={<IndianRupee />}
          color="text-amber-500"
          className="lg:col-span-2 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10"
        />
      </div>

      {/* 3. Charts Section */}
      <DashboardCharts />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* 4. Main Content Area (Work Queue) */}
        <div className="xl:col-span-2 space-y-6">
          <SectionHeader title="Attention Needed" icon={<AlertOctagon size={20} className="text-amber-500" />} />
          <CriticalAlerts data={dashboardData.criticalAlerts} />

          <div className="pt-4">
            <SectionHeader title="School Feed" icon={<Megaphone size={20} className="text-blue-500" />} />
            <RecentActivity
              payments={dashboardData.recentPayments}
              announcements={dashboardData.recentAnnouncements}
              communications={dashboardData.parentCommunications}
            />
          </div>
        </div>

        {/* 4. Sidebar / Quick Stats */}
        <div className="space-y-6">
          <SectionHeader title="Daily Pulse" icon={<TrendingUp size={20} className="text-purple-500" />} />
          <TodaySnapshot data={dashboardData.todaySnapshot} />

          <div className="pt-2">
            <h4 className="text-sm font-semibold text-default-500 uppercase tracking-wider mb-4 ml-1">Performance</h4>
            <QuickStats data={dashboardData.quickStats} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, icon }) {
  return (
    <div className="flex items-center gap-2 mb-4 ml-1">
      {icon}
      <h3 className="text-xl font-medium text-default-800 tracking-tight">{title}</h3>
    </div>
  );
}
