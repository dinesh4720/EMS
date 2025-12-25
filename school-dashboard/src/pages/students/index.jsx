import { useState, useRef } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Tabs, Tab, Button, Drawer, DrawerContent, DrawerHeader, DrawerBody, Card, Tooltip } from "@heroui/react";
import { GraduationCap, Plus, X } from "lucide-react";
import StudentsList from "./StudentsList";
import StudentOverview from "./StudentOverview";
import StudentAttendance from "./StudentAttendance";
import AddStudent from "./AddStudent";
import { useApp } from "../../context/AppContext";

export default function StudentsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { classesWithTeachers, addStudent } = useApp();
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);

  const getActiveTab = () => {
    if (location.pathname === "/students/attendance") return "attendance";
    return "list";
  };

  const handleOpenAddStudent = () => {
    setIsAddStudentOpen(true);
  };

  const handleCloseAddStudent = () => {
    setIsAddStudentOpen(false);
  };

  const handleSaveStudent = async (studentData) => {
    try {
      await addStudent(studentData);
      handleCloseAddStudent();
    } catch (err) {
      console.error('Failed to add student:', err);
    }
  };

  const classOptions = classesWithTeachers.map(c => `${c.name}-${c.section}`);
  const activeTab = getActiveTab();

  const tabHeaderInfo = {
    list: {
      title: "All Students",
      description: "Manage students, classes, parent contacts, and fee status"
    },
    attendance: {
      title: "Student Attendance",
      description: "Track daily attendance and view attendance statistics"
    }
  };

  // Check if we're viewing a student profile
  // Match any path like /students/123 but not /students or /students/attendance
  const pathParts = location.pathname.split('/').filter(Boolean);
  const isProfileView = pathParts.length === 2 && 
                        pathParts[0] === 'students' && 
                        pathParts[1] !== 'attendance' &&
                        pathParts[1] !== '';

  // If viewing a profile, render just the routes without the card wrapper
  if (isProfileView) {
    return (
      <Routes>
        <Route path=":id" element={<StudentOverview />} />
      </Routes>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <Card className="shadow-sm border border-default-200 bg-background rounded-md">
        <div className="px-6 py-3 border-b border-default-200">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => {
              if (key === "list") navigate("/students");
              else if (key === "attendance") navigate("/students/attendance");
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
            <Tab key="list" title="All Students" />
            <Tab key="attendance" title="Attendance" />
          </Tabs>
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-6 border-b border-default-200 overflow-hidden">
          {activeTab === "list" && (
            <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-blue-200/80 to-transparent blur-3xl pointer-events-none" />
          )}
          <div className="pl-2 relative z-10">
            <h1 className="text-2xl font-medium text-default-900">{tabHeaderInfo[activeTab]?.title}</h1>
            <p className="text-sm text-default-500 mt-1">{tabHeaderInfo[activeTab]?.description}</p>
          </div>
          {activeTab === "list" && (
            <button
              className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg border border-primary hover:bg-primary-600 transition-all duration-200 text-sm cursor-pointer whitespace-nowrap relative z-10"
              onClick={handleOpenAddStudent}
            >
              <Plus size={16} />
              <span>New Student</span>
            </button>
          )}
        </div>

        <div className="min-h-[500px] px-6 py-6">
          <Routes>
            <Route index element={<StudentsList />} />
            <Route path="attendance" element={<StudentAttendance />} />
          </Routes>
        </div>
      </Card>

      {/* Add Student Drawer */}
      <Drawer
        isOpen={isAddStudentOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseAddStudent();
        }}
        placement="right"
        size="lg"
      >
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="border-b border-default-200 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <GraduationCap size={20} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-default-900">New Student Admission</h2>
                    <p className="text-xs text-default-500">Fill in the student details below</p>
                  </div>
                </div>
                <Button isIconOnly size="sm" variant="light" onPress={handleCloseAddStudent}>
                  <X size={20} className="text-default-500" />
                </Button>
              </DrawerHeader>
              <DrawerBody className="p-6 overflow-y-auto">
                <AddStudent 
                  onClose={handleCloseAddStudent} 
                  onSave={handleSaveStudent}
                  classOptions={classOptions}
                  classesWithTeachers={classesWithTeachers}
                />
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
