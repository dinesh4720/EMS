import { useState, useEffect, useMemo } from "react";
import { Routes, Route } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { Tabs, Tab, Button, Drawer, DrawerContent, DrawerHeader, DrawerBody, Avatar, Chip, Progress, Divider, Card } from "@heroui/react";
import { Plus, X, Mail, Phone, MapPin, Briefcase, CheckSquare, MessageSquare, Clock, Calendar } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import StaffList from "./StaffList";
import StaffAttendance from "./StaffAttendance";
import StaffPayroll from "./StaffPayroll";
import StaffDashboard from "./StaffDashboard"; // Import the dashboard
import AddStaff from "./AddStaff";
import { useApp } from "../../context/AppContext";

export default function StaffsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addStaff } = useApp();
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [shouldRenderAddStaff, setShouldRenderAddStaff] = useState(false);



  const handleOpenStaffProfile = (staffId) => {
    navigate(`/staffs/${staffId}`);
  };

  const activeTab = location.pathname.includes("/staffs/") && location.pathname !== "/staffs/attendance" && location.pathname !== "/staffs/payroll" && location.pathname !== "/staffs" && location.pathname !== "/staffs/"
    ? "profile" // Virtual tab for profile, or just hide tabs if inside profile?
    : (location.pathname === "/staffs/attendance" ? "overview" : location.pathname === "/staffs/payroll" ? "payroll" : "list");

  // If we are in a sub-route like /staffs/:id, we might want to hide the main tabs or keep them?
  // The user interaction assumes clicking a staff opens their dashboard.
  // Usually this means we go to a detail view which might not show the main "All Staffs" tabs.
  const isProfileView = location.pathname !== "/staffs" && location.pathname !== "/staffs/" && location.pathname !== "/staffs/attendance" && location.pathname !== "/staffs/payroll" && !location.pathname.endsWith("/staffs");

  const handleSaveStaff = async (staffData) => {
    // Transform the comprehensive form data to match the existing staff structure
    const transformedData = {
      name: staffData.fullName,
      role: staffData.staffType === "Teaching" ? "Teacher" : staffData.staffType,
      department: staffData.expertise || "General",
      phone: staffData.mobile,
      email: staffData.email,
      status: "active",
      classes: staffData.assignedClasses || [],
      address: staffData.address,
      joinDate: new Date().toISOString().split('T')[0],
      // Store additional comprehensive data
      fullData: staffData
    };
    try {
      await addStaff(transformedData);
      setIsAddStaffOpen(false);
      // Delay unmounting to allow smooth close animation
      setTimeout(() => setShouldRenderAddStaff(false), 300);
    } catch (err) {
      console.error('Failed to add staff:', err);
    }
  };

  const handleOpenAddStaff = () => {
    setShouldRenderAddStaff(true);
    // Small delay to ensure DOM is ready before opening
    requestAnimationFrame(() => {
      setIsAddStaffOpen(true);
    });
  };

  const handleCloseAddStaff = () => {
    setIsAddStaffOpen(false);
    // Delay unmounting to allow smooth close animation
    setTimeout(() => setShouldRenderAddStaff(false), 300);
  };

  const tabHeaderInfo = {
    list: {
      title: "All Staffs",
      description: "Manage staff members, roles, departments, and contact details"
    },
    overview: {
      title: "Staff Attendance",
      description: "Track daily attendance, key metrics, and monthly statistics"
    },
    payroll: {
      title: "Staff Salary & Payroll",
      description: "Manage staff salaries, process payroll logs, and track payments"
    }
  };

  // If viewing a profile, render just the routes, or render routes outside the card structure?
  // The current structure wraps everything in a Card with Tabs.
  // We probably want the Profile to take over the full page.

  if (isProfileView) {
    return (
      <Routes>
        <Route path=":id" element={<StaffDashboard />} />
      </Routes>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <Card className="shadow-sm border border-default-200 bg-background rounded-md">
        <div className="px-6 py-3 border-b border-default-200">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => {
              if (key === "list") navigate("/staffs");
              else if (key === "payroll") navigate("/staffs/payroll");
              else if (key === "overview") navigate("/staffs/attendance");
            }}
            size="md"
            color="default"
            variant="light"
            classNames={{
              tabList: "gap-0 p-1.5 bg-gradient-to-r from-default-100 via-default-200/50 to-default-100 rounded-xl",
              cursor: "bg-white dark:bg-default-50 rounded-lg shadow-lg ring-1 ring-black/5",
              tab: "px-6 h-10 cursor-pointer",
              tabContent: "group-data-[selected=true]:text-default-900 group-data-[selected=true]:font-semibold text-default-500 font-medium"
            }}
          >
            <Tab key="list" title="All Staff" />
            <Tab key="overview" title="Attendance" />
            <Tab key="payroll" title="Payroll" />
          </Tabs>
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-6 border-b border-default-200 overflow-hidden">
          {activeTab === "list" && (
            <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-orange-200/80 to-transparent blur-3xl pointer-events-none" />
          )}
          <div className="pl-2 relative z-10">
            <h1 className="text-2xl font-medium text-default-900">{tabHeaderInfo[activeTab]?.title}</h1>
            <p className="text-sm text-default-500 mt-1">{tabHeaderInfo[activeTab]?.description}</p>
          </div>
          {activeTab === "list" && (
            <button
              className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg border border-primary hover:bg-primary-600 transition-all duration-200 text-sm cursor-pointer whitespace-nowrap relative z-10"
              onClick={handleOpenAddStaff}
            >
              <Plus size={16} />
              <span>Create Staff</span>
            </button>
          )}
        </div>

        <div className="min-h-[500px] px-6 py-6">
          <Routes>
            <Route index element={<StaffList onStaffClick={handleOpenStaffProfile} />} />
            <Route path="list" element={<StaffList onStaffClick={handleOpenStaffProfile} />} />
            <Route path="attendance" element={<StaffAttendance onStaffClick={handleOpenStaffProfile} />} />
            <Route path="payroll" element={<StaffPayroll onStaffClick={handleOpenStaffProfile} />} />
          </Routes>
        </div>
      </Card>

      {/* Add Staff Drawer */}
      {shouldRenderAddStaff && (
        <Drawer
          isOpen={isAddStaffOpen}
          onOpenChange={(open) => {
            if (!open) handleCloseAddStaff();
          }}
          placement="right"
          classNames={{
            wrapper: "justify-end",
            base: "w-[720px] max-w-[95vw]",
            backdrop: "bg-black/30"
          }}
        >
          <DrawerContent>
            {(onClose) => (
              <>
                <DrawerHeader className="border-b border-default-200 px-6 py-3 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">New Staff</h2>
                  <Button isIconOnly size="sm" variant="light" onPress={handleCloseAddStaff}>
                    <X size={20} className="text-default-500" />
                  </Button>
                </DrawerHeader>
                <DrawerBody className="p-0 overflow-y-auto">
                  <AddStaff onClose={handleCloseAddStaff} onSave={handleSaveStaff} />
                </DrawerBody>
              </>
            )}
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}
