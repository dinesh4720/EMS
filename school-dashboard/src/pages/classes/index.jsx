import { useState } from "react";
import { Routes, Route, useParams, Navigate } from "react-router-dom";
import { Button, Input, Select, SelectItem, Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter } from "@heroui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { BookOpen, Plus, X, Users } from "lucide-react";
import ClassesList from "./ClassesList";
import Attendance from "./Attendance";
import Timetable from "./Timetable";
import Substitution from "./Substitution";
import Subjects from "./Subjects";
import ClassDashboard from "./ClassDashboard";
import BulkClassTeacherAssignment from "./BulkClassTeacherAssignment";
import { useApp } from "../../context/AppContext";
import { PageLayout, MinimalButton } from "../../components/ui";
import toast from "react-hot-toast";

const classNames = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const sections = ["A", "B", "C", "D"];

export default function ClassesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { teachers, addClass, staff, refetch } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", section: "", strength: "", teacherId: "" });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getActiveTab = () => {
    if (location.pathname.includes("/attendance")) return "attendance";
    if (location.pathname.includes("/timetable")) return "timetable";
    if (location.pathname.includes("/substitution")) return "substitution";
    if (location.pathname.includes("/subjects")) return "subjects";
    if (location.pathname.includes("/bulk-assignment")) return "bulk-assignment";
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

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Find the selected teacher to get their details
      const selectedTeacher = staff.find(s =>
        String(s.id) === String(formData.teacherId) || String(s._id) === String(formData.teacherId)
      );

      if (!selectedTeacher) {
        toast.error('Selected teacher not found');
        setIsSubmitting(false);
        return;
      }

      // Create the class with consistent ID handling
      await addClass({
        name: formData.name,
        section: formData.section,
        strength: parseInt(formData.strength),
        classTeacherId: String(formData.teacherId), // Ensure string for MongoDB ObjectId
        teacher: selectedTeacher.name,
        teacherPhoto: selectedTeacher.picture || selectedTeacher.photo,
        subjects: ["Hindi", "English", "Math", "Science"]
      });

      // Clear API cache to ensure fresh data
      try {
        const { clearApiCache } = await import('../../services/api');
        clearApiCache();
      } catch (cacheError) {
        console.warn('Failed to clear API cache:', cacheError);
      }

      // Refetch data to update the UI
      if (refetch) {
        await refetch();
      }

      toast.success(`Class ${formData.name}-${formData.section} created successfully with ${selectedTeacher.name} as class teacher`);

      // Close drawer and reset form
      setIsOpen(false);
      setFormData({ name: "", section: "", strength: "", teacherId: "" });
      setErrors({});
    } catch (error) {
      console.error('Error creating class:', error);

      // Handle specific error types
      let errorMessage = 'Failed to create class';
      if (error.message) {
        if (error.message.includes('already assigned')) {
          errorMessage = 'This teacher is already assigned to another class';
        } else if (error.message.includes('Unauthorized') || error.message.includes('Authentication')) {
          errorMessage = 'You are not authorized to perform this action';
        } else {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabChange = (key) => {
    if (key === "list") navigate("/classes");
    else if (key === "bulk-assignment") navigate("/classes/bulk-assignment");
    else if (key === "attendance") navigate("/classes/attendance");
    else if (key === "timetable") navigate("/classes/timetable");
    else if (key === "substitution") navigate("/classes/substitution");
    else if (key === "subjects") navigate("/classes/subjects");
  };

  const activeTab = getActiveTab();

  const pathParts = location.pathname.split('/').filter(Boolean);
  const isClassDashboard = pathParts.length === 2 &&
    pathParts[0] === 'classes' &&
    pathParts[1] !== 'attendance' &&
    pathParts[1] !== 'timetable' &&
    pathParts[1] !== 'substitution' &&
    pathParts[1] !== 'subjects' &&
    pathParts[1] !== 'bulk-assignment' &&
    pathParts[1] !== '';

  const tabs = [
    { key: "list", title: "All Classes" },
    { key: "bulk-assignment", title: "Class Teachers" },
    { key: "attendance", title: "Attendance" },
    { key: "timetable", title: "Timetable" },
    { key: "substitution", title: "Substitution" },
    { key: "subjects", title: "Subjects" }
  ];

  const tabHeaderInfo = {
    list: {
      title: "All Classes",
      description: "Manage classes, sections, teachers, and student strength"
    },
    "bulk-assignment": {
      title: "Class Teacher Assignment",
      description: "Assign class teachers to all classes in bulk"
    },
    attendance: {
      title: "Class Attendance",
      description: "Track and manage daily attendance for all classes"
    },
    timetable: {
      title: "Class Timetable",
      description: "View and manage class schedules and periods"
    },
    substitution: {
      title: "Teacher Substitution",
      description: "Manage teacher substitutions for absent teachers"
    },
    subjects: {
      title: "Subjects & Teachers",
      description: "Manage subjects, chapter progress, and teacher assignments"
    }
  };

  // Render class dashboard standalone (like staff and student dashboards)
  if (isClassDashboard) {
    return (
      <Routes>
        <Route path=":id" element={<ClassDashboard />} />
      </Routes>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <PageLayout
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        header={
          activeTab !== "timetable" ? {
            title: tabHeaderInfo[activeTab]?.title,
            description: tabHeaderInfo[activeTab]?.description
          } : null
        }
        actions={
          activeTab === "list" ? (
            <MinimalButton icon={<Plus size={16} />} onClick={() => setIsOpen(true)}>
              Add Class
            </MinimalButton>
          ) : null
        }
        noPadding={activeTab === "timetable"}
        className={activeTab === "timetable" ? "" : "min-h-[600px]"}
      >
        <Routes>
          <Route index element={<ClassesList />} />
          <Route path="bulk-assignment" element={<BulkClassTeacherAssignment />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="timetable" element={<Timetable />} />
          <Route path="substitution" element={<Substitution />} />
          <Route path="subjects" element={<Subjects />} />
        </Routes>
      </PageLayout>

      <Drawer isOpen={isOpen} onOpenChange={setIsOpen} placement="right" size="md" classNames={{ wrapper: "justify-end", base: "m-2 rounded-md h-[calc(100%-1rem)]", backdrop: "bg-black/30" }}>
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="flex justify-between items-center border-b border-gray-100 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <BookOpen size={20} className="text-gray-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Add New Class</h3>
                    <p className="text-xs text-gray-500">Fill in the class details below</p>
                  </div>
                </div>
                <Button isIconOnly size="sm" variant="light" onPress={onClose} title="Close">
                  <X size={20} className="text-gray-500" />
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
                    {staff.filter(s => {
                      const roles = Array.isArray(s.role) ? s.role : (s.role ? [s.role] : []);
                      const staffTypes = Array.isArray(s.staffType) ? s.staffType : (s.staffType ? [s.staffType] : []);
                      return roles.includes('Teacher') || staffTypes.includes('Teacher') || s.isClassTeacher;
                    }).map(t => <SelectItem key={String(t.id || t._id)} textValue={`${t.name} ${t.department || ''}`}>{t.name} {t.department ? `(${t.department})` : ''}</SelectItem>)}
                  </Select>
                </div>
              </DrawerBody>
              <DrawerFooter className="border-t border-gray-100 px-6 py-4">
                <Button variant="flat" onPress={onClose} radius="lg" isDisabled={isSubmitting}>Cancel</Button>
                <Button color="primary" onPress={handleSave} radius="lg" isLoading={isSubmitting} isDisabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Add Class'}
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}