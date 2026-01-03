import React from "react";
import TodaySnapshot from "../components/TodaySnapshot";
import QuickStats from "../components/QuickStats";
import RecentActivity from "../components/RecentActivity";
import { dashboardData } from "../data/mockData";
import { Button, Chip, Card, CardBody, CardHeader, Divider } from "@heroui/react";
import {
  CheckSquare, IndianRupee, Megaphone, Users, GraduationCap, TrendingUp, AlertOctagon,
  AlertTriangle, AlertCircle, FileText, Bell, Info
} from "lucide-react";
import Banner from "../components/Banner";
import { useApp } from "../context/AppContext";
import { DashboardIllustration } from "../components/Illustrations";
import KPICardHovy from "../components/KPICardHovy";
import DashboardCharts from "../components/DashboardCharts";

export default function Dashboard() {
  const { dashboardStats } = useApp();

  const dashboardAlerts = [
    {
      id: 1,
      type: "critical",
      title: "Server Maintenance",
      desc: "System scheduled for maintenance at 2:00 AM tonight.",
      time: "1h ago",
      icon: AlertCircle
    },
    {
      id: 2,
      type: "critical",
      title: "5 Staff Absent",
      desc: "Emergency substitution plan required for Science Dept.",
      time: "2h ago",
      icon: Users
    },
    {
      id: 3,
      type: "warning",
      title: "Fee Deadline Approaching",
      desc: "Term 2 fees submission deadline is tomorrow.",
      time: "5h ago",
      icon: IndianRupee
    },
    {
      id: 4,
      type: "warning",
      title: "Low Water Supply",
      desc: "Facility manager reported low levels in Block C.",
      time: "6h ago",
      icon: AlertTriangle
    },
    {
      id: 5,
      type: "info",
      title: "New Policy Update",
      desc: "Updated leave policy document available for review.",
      time: "1d ago",
      icon: FileText
    },
    {
      id: 6,
      type: "success",
      title: "Audit Completed",
      desc: "Annual financial audit passed successfully.",
      time: "2d ago",
      icon: CheckSquare
    },
    {
      id: 7,
      type: "info",
      title: "Sports Day Registration",
      desc: "Registration portal is now open for students.",
      time: "2d ago",
      icon: Bell
    }
  ];

  return (
    <div className="animate-fade-in pb-10">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">

        {/* LEFT COLUMN - MAIN CONTENT (75% Width) */}
        <div className="xl:col-span-3 space-y-6">

          {/* 1. Hero Section */}
          <div className="relative z-10">
            <Banner
              title="Welcome to EduMaster"
              description="Everything looks good today. Here is your daily school overview and pending tasks."
              illustration={DashboardIllustration}
              className="shadow-2xl shadow-primary/10"
            />
          </div>

          {/* 2. Key Metrics - Bento Grid */}
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
              label="Pending Fees"
              value="₹12.5L" // Mock data
              trend="Due from 45 students"
              trendUp={false}
              icon={<IndianRupee />}
              color="text-amber-500"
            />
          </div>

          {/* 3. Charts Section */}
          <DashboardCharts />

          {/* 4. Work Queue & Stats Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <SectionHeader title="Daily Pulse" icon={<TrendingUp size={20} className="text-purple-500" />} />
              <TodaySnapshot data={dashboardData.todaySnapshot} />
            </div>
            <div className="space-y-4">
              <SectionHeader title="Performance" icon={<AlertOctagon size={20} className="text-success-500" />} />
              <QuickStats data={dashboardData.quickStats} />
            </div>
          </div>

          <div className="pt-2">
            <SectionHeader title="School Feed" icon={<Megaphone size={20} className="text-blue-500" />} />
            <RecentActivity
              payments={dashboardData.recentPayments}
              announcements={dashboardData.recentAnnouncements}
              communications={dashboardData.parentCommunications}
            />
          </div>

        </div>

        {/* RIGHT COLUMN - SIDEBAR (Fixed Panel) */}
        <div className="xl:col-span-1 sticky top-6 h-[calc(100vh-3rem)] hidden xl:block">
          <div className="h-full w-full bg-white/60 dark:bg-default-100/50 backdrop-blur-xl rounded-2xl shadow-sm border border-white/20 dark:border-default-200/50 p-5 overflow-y-auto no-scrollbar flex flex-col gap-5">

            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-danger-50 to-danger-100 rounded-xl text-danger-600 shadow-sm">
                  <AlertTriangle size={20} />
                </div>
                <h3 className="text-lg font-bold text-default-900 tracking-tight">Critical Alerts</h3>
              </div>
              <Chip size="sm" color="danger" variant="shadow" className="h-6 font-medium px-1">7 Active</Chip>
            </div>

            <Divider className="shrink-0 bg-default-200/50" />

            {/* Scrollable List */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {dashboardAlerts.map((alert) => (
                <div key={alert.id} className="group flex flex-col gap-1 p-3 rounded-lg border border-default-200 hover:bg-default-50 cursor-pointer transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-full ${alert.type === 'critical' ? 'bg-danger-100 text-danger-600' :
                          alert.type === 'warning' ? 'bg-warning-100 text-warning-600' :
                            alert.type === 'success' ? 'bg-success-100 text-success-600' : 'bg-primary-100 text-primary-600'
                        }`}>
                        {(() => {
                          const Icon = alert.icon || AlertCircle;
                          return <Icon size={14} strokeWidth={2.5} />;
                        })()}
                      </div>
                      <span className="text-xs font-semibold text-default-500">{alert.time}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className={`text-sm font-semibold ${alert.type === 'critical' ? 'text-danger-600' : 'text-default-900'
                      }`}>
                      {alert.title}
                    </h4>
                    <p className="text-xs text-default-500 mt-0.5">
                      {alert.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Actions */}
            <div className="shrink-0 space-y-3 pt-2">
              <Button
                fullWidth
                variant="shadow"
                color="primary"
                className="font-medium bg-gradient-to-r from-primary to-primary-600 shadow-primary/20"
                size="sm"
              >
                View All System Alerts
              </Button>

              <div className="p-4 rounded-xl bg-gradient-to-br from-default-50 to-default-100 border border-default-200/60 text-center hover:border-primary/30 transition-colors cursor-pointer group">
                <p className="text-xs text-default-500 mb-1">Need immediate assistance?</p>
                <div className="text-xs font-bold text-primary group-hover:underline">Contact IT Support</div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}

function SectionHeader({ title, icon }) {
  return (
    <div className="flex items-center gap-2 mb-2 ml-1">
      {icon}
      <h3 className="text-lg font-semibold text-default-800 tracking-tight">{title}</h3>
    </div>
  );
}
