import { useState, useMemo } from "react";
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
import ConfirmDialog from "../../components/ConfirmDialog";
import { useTranslation } from 'react-i18next';

export default function ClassSectionsSettings() {
  const { t } = useTranslation();
  const { classes, staff, students, addClass, updateClass, deleteClass, loading } = useApp();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingSection, setEditingSection] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, section: null });
  const [deleting, setDeleting] = useState(false);

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

  // Sort classes alphabetically by name
  const sortedClasses = useMemo(() => {
    return [...classes].sort((a, b) => {
      const nameA = a.name || '';
      const nameB = b.name || '';
      // Extract class number for numeric sorting
      const numA = parseInt(nameA.split('-')[0]) || 0;
      const numB = parseInt(nameB.split('-')[0]) || 0;
      if (numA !== numB) return numA - numB;
      // If same class number, sort by section
      const sectionA = a.section || nameA.split('-')[1] || '';
      const sectionB = b.section || nameB.split('-')[1] || '';
      return sectionA.localeCompare(sectionB);
    });
  }, [classes]);

  const handleOpenModal = (section = null) => {
    setFormErrors({});
    if (section) {
      setEditingSection(section);
      // Extract class name from full name (e.g., "10-A" -> "10")
      const className = section.name ? section.name.split('-')[0] : '';
      setFormData({
        name: className,
        section: section.section || section.name.split('-')[1] || "",
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
    const newErrors = {};
    if (!formData.name) newErrors.name = t('toast.error.classNameAndSectionAreRequired');
    if (!formData.section) newErrors.section = t('toast.error.classNameAndSectionAreRequired');
    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      toast.error(t('toast.error.classNameAndSectionAreRequired'));
      return;
    }

    setSaving(true);
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
        toast.success(t('toast.success.sectionUpdatedSuccessfully'));
      } else {
        await addClass(sectionData);
        toast.success(t('toast.success.sectionAddedSuccessfully'));
      }

      onClose();
    } catch (error) {
      console.error("Failed to save section:", error);
      toast.error(t('toast.error.failedToSaveSection'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (section) => {
    setDeleteConfirm({ isOpen: true, section });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.section) return;

    setDeleting(true);
    try {
      await deleteClass(deleteConfirm.section.id);
      toast.success(t('toast.success.sectionDeletedSuccessfully'));
      setDeleteConfirm({ isOpen: false, section: null });
    } catch (error) {
      console.error("Failed to delete section:", error);
      toast.error(t('toast.error.failedToDeleteSection'));
    } finally {
      setDeleting(false);
    }
  };

  // FIXED: Use String() comparison for ObjectId matching and filter by active status
  const getStudentCount = (classId) => {
    return students.filter(s =>
      String(s.classId) === String(classId) &&
      (s.status || 'active') === 'active' &&
      s.isDeleted !== true
    ).length;
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
    <div className="pb-10 space-y-6">
      <div className="flex justify-end">
        <Button color="primary" radius="full" className="shadow-md font-medium px-6" startContent={<Plus size={18} />} onPress={() => handleOpenModal()}>{t('pages.addSection1')}</Button>
      </div>

      {/* Sections Table */}
      <div className="bg-white border border-default-200 rounded-xl overflow-hidden shadow-sm">
        <Table
          aria-label={t('aria.tables.classSections')}
          removeWrapper
          radius="none"
          classNames={{
            base: "overflow-visible",
            th: "bg-default-50 text-default-500 font-medium text-xs uppercase tracking-wider h-12 border-b border-default-200",
            td: "py-4 border-b border-default-100",
            tbody: "[&>tr:last-child>td]:border-none"
          }}
        >
          <TableHeader>
            <TableColumn scope="col">{t('pages.cLASS')}</TableColumn>
            <TableColumn scope="col">{t('pages.sECTION')}</TableColumn>
            <TableColumn scope="col">{t('pages.cLASSTeacher')}</TableColumn>
            <TableColumn scope="col">{t('pages.sTUDENTS')}</TableColumn>
            <TableColumn scope="col">{t('pages.rOOM')}</TableColumn>
            <TableColumn scope="col">{t('pages.hOD')}</TableColumn>
            <TableColumn scope="col">{t('pages.gROUP')}</TableColumn>
            <TableColumn scope="col">{t('pages.aCTIONS')}</TableColumn>
          </TableHeader>
          <TableBody
            items={sortedClasses}
            emptyContent={loading ? "Loading..." : "No sections found"}
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
                        <span className="text-gray-400">{t('pages.notAssigned')}</span>
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
                        onPress={() => handleDeleteClick(section)}
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
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={isOpen} onClose={() => { onClose(); setFormErrors({}); }} size="2xl">
        <ModalContent>
          <ModalHeader>
            {editingSection ? "Edit Section" : "Add New Section"}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t('pages.className1')}
                  placeholder="e.g., 10, 11, 12"
                  value={formData.name}
                  onValueChange={(v) => { setFormData({ ...formData, name: v }); setFormErrors(prev => ({ ...prev, name: '' })); }}
                  variant="bordered"
                  isRequired
                  isInvalid={!!formErrors.name}
                  errorMessage={formErrors.name}
                />
                <Input
                  label={t('pages.section1')}
                  placeholder="e.g., A, B, C"
                  value={formData.section}
                  onValueChange={(v) => { setFormData({ ...formData, section: v }); setFormErrors(prev => ({ ...prev, section: '' })); }}
                  variant="bordered"
                  isRequired
                  isInvalid={!!formErrors.section}
                  errorMessage={formErrors.section}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t('pages.strengthLimit')}
                  placeholder={t('pages.maximumStudents')}
                  type="number"
                  value={formData.strengthLimit}
                  onValueChange={(v) => setFormData({ ...formData, strengthLimit: v })}
                  variant="bordered"
                />
                <Select
                  label={t('pages.classTeacher2')}
                  placeholder={t('pages.selectTeacher')}
                  selectedKeys={formData.classTeacherId ? [formData.classTeacherId] : []}
                  onSelectionChange={(keys) => setFormData({ ...formData, classTeacherId: Array.from(keys)[0] || "" })}
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
                  label={t('pages.roomNumber')}
                  placeholder="e.g., 101, 202"
                  value={formData.roomNo}
                  onValueChange={(v) => setFormData({ ...formData, roomNo: v })}
                  variant="bordered"
                />
                <Input
                  label={t('pages.block')}
                  placeholder="e.g., A Block, B Block"
                  value={formData.blockNo}
                  onValueChange={(v) => setFormData({ ...formData, blockNo: v })}
                  variant="bordered"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label={t('pages.hODHeadOfDepartment')}
                  placeholder={t('pages.selectHod')}
                  selectedKeys={formData.hodId ? [formData.hodId] : []}
                  onSelectionChange={(keys) => setFormData({ ...formData, hodId: Array.from(keys)[0] || "" })}
                  variant="bordered"
                >
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  label={t('pages.groupHigherSecondary')}
                  placeholder={t('pages.selectGroup')}
                  selectedKeys={formData.group ? [formData.group] : []}
                  onSelectionChange={(keys) => setFormData({ ...formData, group: Array.from(keys)[0] || "" })}
                  variant="bordered"
                >
                  <SelectItem key="Science" value="Science">{t('pages.science')}</SelectItem>
                  <SelectItem key="Commerce" value="Commerce">{t('pages.commerce')}</SelectItem>
                  <SelectItem key="Arts" value="Arts">{t('pages.arts')}</SelectItem>
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
              isLoading={saving}
              className="transition-all duration-200"
            >
              {editingSection ? "Update" : "Add"} Section
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, section: null })}
        onConfirm={handleDeleteConfirm}
        title={t('pages.deleteSection')}
        message={`Are you sure you want to delete section "${deleteConfirm.section?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
