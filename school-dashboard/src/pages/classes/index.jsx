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
import { useTranslation } from 'react-i18next';

const classNames = ["Nursery", "LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];
const sections = ["A", "B", "C", "D"];

export default function ClassesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { teachers, addClass, staff, refetch, schoolSettings } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", section: "", strength: "", teacherId: "", room: "", block: "" });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDrawerOpenChange = (open) => {
    setIsOpen(open);
    if (!open && isSubmitting) {
      setIsSubmitting(false);
    }
  };

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
    if (!formData.strength) newErrors.strength = "Class capacity is required";
    else if (isNaN(formData.strength) || parseInt(formData.strength) <= 0) newErrors.strength = "Capacity must be a positive number";
    else if (parseInt(formData.strength) > 200) newErrors.strength = "Capacity cannot exceed 200";
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
        toast.error(t('toast.error.selectedTeacherNotFound'));
        setIsSubmitting(false);
        return;
      }

      // Build default subjects from school settings or fall back to defaults
      const defaultSubjects = (schoolSettings?.subjects || [])
        .map(s => (typeof s === 'string' ? s : s.name))
        .filter(Boolean);

      // Create the class with consistent ID handling
      const capacity = parseInt(formData.strength);
      await addClass({
        name: formData.name,
        section: formData.section,
        strengthLimit: { current: capacity, default: capacity },
        classTeacherId: String(formData.teacherId), // Ensure string for MongoDB ObjectId
        teacher: selectedTeacher.name,
        teacherPhoto: selectedTeacher.picture || selectedTeacher.photo,
        subjects: defaultSubjects.length > 0 ? defaultSubjects : ["Hindi", "English", "Math", "Science"],
        ...(formData.room && { room: formData.room }),
        ...(formData.block && { block: formData.block }),
      });

      // Fire refetch in background — don't block the UI on cache refresh
      if (refetch) {
        refetch(true).catch(() => {});
      }

      toast.success(`Class ${formData.name}-${formData.section} created successfully with ${selectedTeacher.name} as class teacher`);

      // Close drawer and reset form
      setIsOpen(false);
      setFormData({ name: "", section: "", strength: "", teacherId: "", room: "", block: "" });
      setErrors({});
    } catch (error) {
      console.error('Error creating class:', error);

      // Handle specific error types
      let errorMessage = 'Failed to create class';
      const serverMessage = error.response?.data?.message || error.message;
      if (serverMessage) {
        if (serverMessage.includes('already assigned')) {
          errorMessage = 'This teacher is already assigned to another class';
        } else if (serverMessage.includes('Unauthorized') || serverMessage.includes('Authentication')) {
          errorMessage = 'You are not authorized to perform this action';
        } else {
          errorMessage = serverMessage;
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

      <Drawer isOpen={isOpen} onOpenChange={handleDrawerOpenChange} placement="right" size="md" classNames={{ wrapper: "justify-end", base: "m-2 rounded-md h-[calc(100%-1rem)]", backdrop: "bg-black/30" }}>
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="flex justify-between items-center border-b border-gray-100 dark:border-zinc-800 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                    <BookOpen size={20} className="text-gray-700 dark:text-zinc-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{t('pages.addNewClass')}</h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.fillInTheClassDetailsBelow')}</p>
                  </div>
                </div>
                <Button isIconOnly size="sm" variant="light" onPress={onClose} title={t('pages.close2')}>
                  <X size={20} className="text-gray-500 dark:text-zinc-400" />
                </Button>
              </DrawerHeader>
              <DrawerBody className="py-6 px-6">
                <div className="space-y-4">
                  <Select size="sm" label={t('pages.className1')} placeholder={t('pages.selectClass2')} selectedKeys={formData.name ? new Set([formData.name]) : new Set()} onSelectionChange={(keys) => setFormData({ ...formData, name: Array.from(keys)[0] || "" })} isInvalid={!!errors.name} errorMessage={errors.name} isRequired variant="bordered" radius="lg" aria-label={t('aria.inputs.className')}>
                    {classNames.map(c => <SelectItem key={c} textValue={c}>{c}</SelectItem>)}
                  </Select>
                  <Select size="sm" label={t('pages.section1')} placeholder={t('pages.selectSection')} selectedKeys={formData.section ? new Set([formData.section]) : new Set()} onSelectionChange={(keys) => setFormData({ ...formData, section: Array.from(keys)[0] || "" })} isInvalid={!!errors.section} errorMessage={errors.section} isRequired variant="bordered" radius="lg" aria-label={t('aria.inputs.section')}>
                    {sections.map(s => <SelectItem key={s} textValue={s}>{s}</SelectItem>)}
                  </Select>
                  <Input size="sm" type="number" label={t('pages.strength')} placeholder={t('pages.numberOfStudents')} value={formData.strength} onValueChange={(value) => setFormData({ ...formData, strength: value })} isInvalid={!!errors.strength} errorMessage={errors.strength} isRequired variant="bordered" radius="lg" />
                  <Select size="sm" label={t('pages.classTeacher2')} placeholder={t('pages.selectTeacher')} selectedKeys={formData.teacherId ? new Set([formData.teacherId]) : new Set()} onSelectionChange={(keys) => setFormData({ ...formData, teacherId: Array.from(keys)[0] || "" })} isInvalid={!!errors.teacherId} errorMessage={errors.teacherId} isRequired variant="bordered" radius="lg" aria-label={t('aria.inputs.classTeacher')}>
                    {staff.filter(s => {
                      const roles = Array.isArray(s.role) ? s.role : (s.role ? [s.role] : []);
                      return roles.includes('Teacher') || roles.includes('Teaching');
                    }).map(t => <SelectItem key={String(t.id || t._id)} textValue={`${t.name} ${t.department || ''}`}>{t.name} {t.department ? `(${t.department})` : ''}</SelectItem>)}
                  </Select>
                  <div className="grid grid-cols-2 gap-3">
                    <Input size="sm" label="Room" placeholder={t('classes.roomPlaceholder')} value={formData.room} onValueChange={(value) => setFormData({ ...formData, room: value })} variant="bordered" radius="lg" />
                    <Input size="sm" label="Block" placeholder={t('classes.blockPlaceholder')} value={formData.block} onValueChange={(value) => setFormData({ ...formData, block: value })} variant="bordered" radius="lg" />
                  </div>
                </div>
              </DrawerBody>
              <DrawerFooter className="border-t border-gray-100 dark:border-zinc-800 px-6 py-4">
                <Button variant="flat" onPress={onClose} radius="lg" isDisabled={isSubmitting}>{t('pages.cancel2')}</Button>
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
