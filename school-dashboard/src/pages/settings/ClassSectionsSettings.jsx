import { useState } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import { Plus, Edit2, Trash2, Users, DoorOpen, Building2 } from "lucide-react";
import { useApp } from "../../context/AppContext";
import toast from "react-hot-toast";

export default function ClassSectionsSettings() {
  const { classes, staff, students, addClass, updateClass, deleteClass } = useApp();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingSection, setEditingSection] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    section: "",
    strengthLimit: "",
    roomNo: "",
    blockNo: "",
    hodId: "",
    group: "",
    classTeacherId: "",
  });

  const teachers = staff.filter(s => s.role === "Teacher" && s.status === "active");

  const handleOpenModal = (section = null) => {
    if (section) {
      setEditingSection(section);
      setFormData({
        name: section.name,
        section: section.section || "",
        strengthLimit: section.strengthLimit || "",
        roomNo: section.roomNo || "",
        blockNo: section.blockNo || "",
        hodId: section.hodId || "",
        group: section.group || "",
        classTeacherId: section.classTeacherId || "",
      });
    } else {
      setEditingSection(null);
      setFormData({
        name: "",
        section: "",
        strengthLimit: "",
        roomNo: "",
        blockNo: "",
        hodId: "",
        group: "",
        classTeacherId: "",
      });
    }
    onOpen();
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.section) {
      toast.error("Class name and section are required");
      return;
    }

    setLoading(true);
    try {
      const sectionData = {
        name: `${formData.name}-${formData.section}`,
        section: formData.section,
        strengthLimit: parseInt(formData.strengthLimit) || null,
        roomNo: formData.roomNo || null,
        blockNo: formData.blockNo || null,
        hodId: formData.hodId || null,
        group: formData.group || null,
        classTeacherId: formData.classTeacherId || null,
      };

      if (editingSection) {
        await updateClass(editingSection.id, sectionData);
      } else {
        await addClass(sectionData);
      }

      onClose();
    } catch (error) {
      console.error("Failed to save section:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this section?")) return;

    setLoading(true);
    try {
      await deleteClass(id);
    } catch (error) {
      console.error("Failed to delete section:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStudentCount = (classId) => {
    return students.filter(s => s.classId === classId).length;
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? teacher.name : "Unassigned";
  };

  const isNearLimit = (classId, limit) => {
    if (!limit) return false;
    const count = getStudentCount(classId);
    return count >= limit * 0.9;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Class Sections</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage class sections, strength limits, and room assignments
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus size={16} />}
          onPress={() => handleOpenModal()}
          className="transition-all duration-200"
        >
          Add Section
        </Button>
      </div>

      {/* Sections Table */}
      <Card className="rounded-lg">
        <CardBody className="p-0">
          <Table
            aria-label="Class sections table"
            removeWrapper
            classNames={{
              th: "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold",
              td: "py-4",
            }}
          >
            <TableHeader>
              <TableColumn>CLASS</TableColumn>
              <TableColumn>SECTION</TableColumn>
              <TableColumn>CLASS TEACHER</TableColumn>
              <TableColumn>STUDENTS</TableColumn>
              <TableColumn>ROOM</TableColumn>
              <TableColumn>HOD</TableColumn>
              <TableColumn>GROUP</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody
              items={classes}
              emptyContent="No sections found"
              loadingContent={<Spinner />}
            >
              {(section) => {
                const studentCount = getStudentCount(section.id);
                const nearLimit = isNearLimit(section.id, section.strengthLimit);

                return (
                  <TableRow key={section.id}>
                    <TableCell>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {section.name.split('-')[0]}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat" color="primary">
                        {section.section || section.name.split('-')[1] || 'A'}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {getTeacherName(section.classTeacherId)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-gray-500" />
                        <span className={nearLimit ? "text-orange-600 font-medium" : ""}>
                          {studentCount}
                          {section.strengthLimit && ` / ${section.strengthLimit}`}
                        </span>
                        {nearLimit && (
                          <Chip size="sm" color="warning" variant="flat">
                            Near Limit
                          </Chip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        {section.roomNo ? (
                          <>
                            <DoorOpen size={14} />
                            <span>{section.roomNo}</span>
                            {section.blockNo && (
                              <>
                                <Building2 size={14} className="ml-2" />
                                <span>{section.blockNo}</span>
                              </>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400">Not assigned</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {section.hodId ? getTeacherName(section.hodId) : "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {section.group ? (
                        <Chip size="sm" variant="flat" color="secondary">
                          {section.group}
                        </Chip>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => handleOpenModal(section)}
                          className="transition-all duration-200"
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => handleDelete(section.id)}
                          className="transition-all duration-200"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Add/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>
            {editingSection ? "Edit Section" : "Add New Section"}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Class Name"
                  placeholder="e.g., 10, 11, 12"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  variant="bordered"
                  isRequired
                />
                <Input
                  label="Section"
                  placeholder="e.g., A, B, C"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  variant="bordered"
                  isRequired
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Strength Limit"
                  placeholder="Maximum students"
                  type="number"
                  value={formData.strengthLimit}
                  onChange={(e) => setFormData({ ...formData, strengthLimit: e.target.value })}
                  variant="bordered"
                />
                <Select
                  label="Class Teacher"
                  placeholder="Select teacher"
                  selectedKeys={formData.classTeacherId ? [formData.classTeacherId] : []}
                  onChange={(e) => setFormData({ ...formData, classTeacherId: e.target.value })}
                  variant="bordered"
                >
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Room Number"
                  placeholder="e.g., 101, 202"
                  value={formData.roomNo}
                  onChange={(e) => setFormData({ ...formData, roomNo: e.target.value })}
                  variant="bordered"
                />
                <Input
                  label="Block"
                  placeholder="e.g., A Block, B Block"
                  value={formData.blockNo}
                  onChange={(e) => setFormData({ ...formData, blockNo: e.target.value })}
                  variant="bordered"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="HOD (Head of Department)"
                  placeholder="Select HOD"
                  selectedKeys={formData.hodId ? [formData.hodId] : []}
                  onChange={(e) => setFormData({ ...formData, hodId: e.target.value })}
                  variant="bordered"
                >
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  label="Group (Higher Secondary)"
                  placeholder="Select group"
                  selectedKeys={formData.group ? [formData.group] : []}
                  onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                  variant="bordered"
                >
                  <SelectItem key="Science" value="Science">Science</SelectItem>
                  <SelectItem key="Commerce" value="Commerce">Commerce</SelectItem>
                  <SelectItem key="Arts" value="Arts">Arts</SelectItem>
                </Select>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleSubmit}
              isLoading={loading}
              className="transition-all duration-200"
            >
              {editingSection ? "Update" : "Add"} Section
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
