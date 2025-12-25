import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Tabs, Tab, Button, Input, Select, SelectItem, Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter, Card } from "@heroui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { BookOpen, Plus, X } from "lucide-react";
import ClassesList from "./ClassesList";
import ClassOverview from "./ClassOverview";
import Attendance from "./Attendance";
import Timetable from "./Timetable";
import { useApp } from "../../context/AppContext";

const classNames = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const sections = ["A", "B", "C", "D"];

export default function ClassesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { teachers, addClass } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", section: "", strength: "", teacherId: "" });
  const [errors, setErrors] = useState({});

  const getActiveTab = () => {
    if (location.pathname.includes("/attendance")) return "attendance";
    if (location.pathname.includes("/timetable")) return "timetable";
    if (location.pathname.match(/\/classes\/\d+/)) return "overview";
    return "list";
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Class name is required";
    if (!formData.section) newErrors.section = "Section is required";
    if (!formData.strength) newErrors.strength = "Strength is required";
    else if (isNaN(formData.strength) || parseInt(formData.strength) <= 0) newErrors.strength = "Invalid strength";
    if (!formData.teacherId) newErrors.teacherId = "Class teacher is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    addClass({
      name: formData.name,
      section: formData.section,
      strength: parseInt(formData.strength),
      classTeacherId: formData.teacherId, // Keep as string for MongoDB ObjectId
      subjects: ["Hindi", "English", "Math", "Science"]
    });
    setIsOpen(false);
    setFormData({ name: "", section: "", strength: "", teacherId: "" });
    setErrors({});
  };

  const activeTab = getActiveTab();

  const tabHeaderInfo = {
    list: {
      title: "All Classes",
      description: "Manage classes, sections, teachers, and student strength"
    },
    attendance: {
      title: "Class Attendance",
      description: "Track and manage daily attendance for all classes"
    },
    timetable: {
      title: "Class Timetable",
      description: "View and manage class schedules and periods"
    },
    overview: {
      title: "Class Overview",
      description: "View detailed class information and statistics"
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <Card className="shadow-sm border border-default-200 bg-background rounded-md">
        <div className="px-6 py-3 border-b border-default-200">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => {
              if (key === "list") navigate("/classes");
              else if (key === "attendance") navigate("/classes/attendance");
              else if (key === "timetable") navigate("/classes/timetable");
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
            <Tab key="list" title="All Classes" />
            <Tab key="attendance" title="Attendance" />
            <Tab key="timetable" title="Timetable" />
            <Tab key="overview" title="Class Overview" isDisabled={!location.pathname.match(/\/classes\/\d+/)} />
          </Tabs>
        </div>

        {activeTab !== "timetable" && (
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-6 border-b border-default-200 overflow-hidden">
            {activeTab === "list" && (
              <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-green-200/80 to-transparent blur-3xl pointer-events-none" />
            )}
            <div className="pl-2 relative z-10">
              <h1 className="text-2xl font-medium text-default-900">{tabHeaderInfo[activeTab]?.title}</h1>
              <p className="text-sm text-default-500 mt-1">{tabHeaderInfo[activeTab]?.description}</p>
            </div>
            {activeTab === "list" && (
              <button
                className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg border border-primary hover:bg-primary-600 transition-all duration-200 text-sm cursor-pointer whitespace-nowrap relative z-10"
                onClick={() => setIsOpen(true)}
              >
                <Plus size={16} />
                <span>Add Class</span>
              </button>
            )}
          </div>
        )}

        <div className={activeTab === "timetable" ? "px-6 py-4" : "min-h-[500px] px-6 py-6"}>
          <Routes>
            <Route index element={<ClassesList />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="timetable" element={<Timetable />} />
            <Route path=":id" element={<ClassOverview />} />
          </Routes>
        </div>
      </Card>

      <Drawer isOpen={isOpen} onOpenChange={setIsOpen} placement="right" size="md" classNames={{ wrapper: "justify-end", base: "m-2 rounded-md shadow-lg h-[calc(100%-1rem)]", backdrop: "bg-black/30" }}>
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="flex justify-between items-center border-b border-default-100 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <BookOpen size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Add New Class</h3>
                    <p className="text-xs text-default-500">Fill in the class details below</p>
                  </div>
                </div>
                <Button isIconOnly size="sm" variant="light" onPress={onClose}>
                  <X size={20} className="text-default-500" />
                </Button>
              </DrawerHeader>
              <DrawerBody className="py-6 px-6">
                <div className="space-y-4">
                  <Select size="sm" label="Class Name" placeholder="Select class" selectedKeys={formData.name ? new Set([formData.name]) : new Set()} onSelectionChange={(keys) => setFormData({ ...formData, name: Array.from(keys)[0] || "" })} isInvalid={!!errors.name} errorMessage={errors.name} isRequired variant="bordered" radius="lg" aria-label="Class Name">
                    {classNames.map(c => <SelectItem key={c} textValue={`Class ${c}`}>Class {c}</SelectItem>)}
                  </Select>
                  <Select size="sm" label="Section" placeholder="Select section" selectedKeys={formData.section ? new Set([formData.section]) : new Set()} onSelectionChange={(keys) => setFormData({ ...formData, section: Array.from(keys)[0] || "" })} isInvalid={!!errors.section} errorMessage={errors.section} isRequired variant="bordered" radius="lg" aria-label="Section">
                    {sections.map(s => <SelectItem key={s} textValue={s}>{s}</SelectItem>)}
                  </Select>
                  <Input size="sm" type="number" label="Strength" placeholder="Number of students" value={formData.strength} onValueChange={(value) => setFormData({ ...formData, strength: value })} isInvalid={!!errors.strength} errorMessage={errors.strength} isRequired variant="bordered" radius="lg" />
                  <Select size="sm" label="Class Teacher" placeholder="Select teacher" selectedKeys={formData.teacherId ? new Set([formData.teacherId]) : new Set()} onSelectionChange={(keys) => setFormData({ ...formData, teacherId: Array.from(keys)[0] || "" })} isInvalid={!!errors.teacherId} errorMessage={errors.teacherId} isRequired variant="bordered" radius="lg" aria-label="Class Teacher">
                    {teachers.map(t => <SelectItem key={t.id.toString()} textValue={`${t.name} ${t.department}`}>{t.name} ({t.department})</SelectItem>)}
                  </Select>
                </div>
              </DrawerBody>
              <DrawerFooter className="border-t border-default-100 px-6 py-4">
                <Button variant="flat" onPress={onClose} radius="lg">Cancel</Button>
                <Button color="primary" onPress={handleSave} radius="lg" className="shadow-md shadow-primary/25">Add Class</Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
