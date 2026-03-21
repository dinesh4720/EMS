import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  CardHeader,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Input,
  Checkbox,
  Tabs,
  Tab,
  Select,
  SelectItem,
  Spinner,
} from "@heroui/react";
import { Plus, Edit, Shield, Lock, Unlock, Copy, Trash2 } from "lucide-react";
import { useApp } from "../../context/AppContext";
import toast from "react-hot-toast";
import { STAFF_ROLES } from "../../constants/roles";

// Define all modules and their actions
const MODULES = [
  { key: "dashboard", label: "Dashboard", actions: ["view"] },
  { key: "staff", label: "Staff Management", actions: ["view", "create", "edit", "delete"] },
  { key: "students", label: "Students Management", actions: ["view", "create", "edit", "delete"] },
  { key: "classes", label: "Classes Management", actions: ["view", "create", "edit", "delete"] },
  { key: "academics", label: "Academics & Exams", actions: ["view", "create", "edit", "delete", "publish"] },
  { key: "attendance", label: "Attendance", actions: ["view", "create", "edit", "delete"] },
  { key: "timetable", label: "Timetable", actions: ["view", "create", "edit", "delete"] },
  { key: "fees", label: "Fee Management", actions: ["view", "create", "edit", "delete"] },
  { key: "payroll", label: "Payroll", actions: ["view", "create", "edit", "delete"] },
  { key: "communication", label: "Communication", actions: ["view", "create", "edit", "delete"] },
  { key: "reports", label: "Reports", actions: ["view", "create", "edit", "delete"] },
  { key: "settings", label: "Settings", actions: ["view", "create", "edit", "delete"] },
];

const ACTION_LABELS = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  publish: "Publish",
};

// Default permission templates - matching backend UserPermission.js
const PERMISSION_TEMPLATES = {
  admin: {
    name: "Admin",
    description: "Full access to all modules",
    permissions: MODULES.reduce((acc, module) => {
      acc[module.key] = module.actions.reduce((a, action) => ({ ...a, [action]: true }), {});
      return acc;
    }, {}),
  },
  principal: {
    name: "Principal",
    description: "Full administrative access except settings deletion",
    permissions: MODULES.reduce((acc, module) => {
      if (module.key === 'settings') {
        acc[module.key] = { view: true, create: true, edit: true, delete: false };
      } else {
        acc[module.key] = module.actions.reduce((a, action) => ({ ...a, [action]: true }), {});
      }
      return acc;
    }, {}),
  },
  "vice-principal": {
    name: "Vice Principal",
    description: "Administrative access without delete permissions",
    permissions: {
      dashboard: { view: true },
      staff: { view: true, create: true, edit: true },
      students: { view: true, create: true, edit: true },
      classes: { view: true, create: true, edit: true },
      academics: { view: true, create: true, edit: true, publish: true },
      attendance: { view: true, create: true, edit: true },
      timetable: { view: true, create: true, edit: true },
      fees: { view: true },
      payroll: { view: true },
      communication: { view: true, create: true, edit: true },
      reports: { view: true, create: true },
    },
  },
  teacher: {
    name: "Teacher",
    description: "Access to classes, attendance, and students",
    permissions: {
      dashboard: { view: true },
      staff: { view: true },
      students: { view: true, edit: true },
      classes: { view: true },
      academics: { view: true, create: true, edit: true },
      attendance: { view: true, create: true, edit: true },
      timetable: { view: true },
      fees: { view: true },
      communication: { view: true, create: true },
      reports: { view: true },
    },
  },
  accountant: {
    name: "Accountant",
    description: "Access to fees and payroll",
    permissions: {
      dashboard: { view: true },
      staff: { view: true },
      students: { view: true },
      academics: { view: true },
      fees: { view: true, create: true, edit: true, delete: true },
      payroll: { view: true, create: true, edit: true },
      reports: { view: true },
    },
  },
  librarian: {
    name: "Librarian",
    description: "Limited access for library management",
    permissions: {
      dashboard: { view: true },
      staff: { view: true },
      students: { view: true },
      classes: { view: true },
      academics: { view: true },
      attendance: { view: true },
      timetable: { view: true },
      communication: { view: true, create: true },
    },
  },
  "lab-assistant": {
    name: "Lab Assistant",
    description: "Limited access for lab management",
    permissions: {
      dashboard: { view: true },
      staff: { view: true },
      students: { view: true },
      classes: { view: true },
      academics: { view: true },
      attendance: { view: true },
      timetable: { view: true },
      communication: { view: true, create: true },
    },
  },
  receptionist: {
    name: "Receptionist",
    description: "Basic access for front desk operations",
    permissions: {
      dashboard: { view: true },
      staff: { view: true },
      students: { view: true, create: true, edit: true },
      classes: { view: true },
      academics: { view: true },
      communication: { view: true, create: true },
    },
  },
};

export default function RolesAccess() {
  const navigate = useNavigate();
  const { staff } = useApp();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activeTab, setActiveTab] = useState("roles");
  const [editingRole, setEditingRole] = useState(null);
  const [loading, setLoading] = useState(false);

  // Mock roles data - in production, this would come from API
  const [roles, setRoles] = useState([
    {
      id: 1,
      name: "Admin",
      permissions: PERMISSION_TEMPLATES.admin.permissions,
      locked: { settings: { delete: true } },
      userCount: 2,
    },
    {
      id: 2,
      name: "Principal",
      permissions: PERMISSION_TEMPLATES.principal.permissions,
      locked: {},
      userCount: 1,
    },
    {
      id: 3,
      name: "Vice Principal",
      permissions: PERMISSION_TEMPLATES["vice-principal"].permissions,
      locked: {},
      userCount: 1,
    },
    {
      id: 4,
      name: "Teacher",
      permissions: PERMISSION_TEMPLATES.teacher.permissions,
      locked: {},
      userCount: 15,
    },
    {
      id: 5,
      name: "Accountant",
      permissions: PERMISSION_TEMPLATES.accountant.permissions,
      locked: {},
      userCount: 3,
    },
    {
      id: 6,
      name: "Librarian",
      permissions: PERMISSION_TEMPLATES.librarian.permissions,
      locked: {},
      userCount: 1,
    },
    {
      id: 7,
      name: "Lab Assistant",
      permissions: PERMISSION_TEMPLATES["lab-assistant"].permissions,
      locked: {},
      userCount: 2,
    },
    {
      id: 8,
      name: "Receptionist",
      permissions: PERMISSION_TEMPLATES.receptionist.permissions,
      locked: {},
      userCount: 1,
    },
  ]);

  const [formData, setFormData] = useState({
    name: "",
    permissions: {},
    locked: {},
  });

  const handleOpenModal = (role = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        permissions: JSON.parse(JSON.stringify(role.permissions)),
        locked: JSON.parse(JSON.stringify(role.locked || {})),
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: "",
        permissions: {},
        locked: {},
      });
    }
    onOpen();
  };

  const handlePermissionChange = (moduleKey, action, value) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleKey]: {
          ...prev.permissions[moduleKey],
          [action]: value,
        },
      },
    }));
  };

  const handleLockToggle = (moduleKey, action) => {
    setFormData(prev => {
      const newLocked = { ...prev.locked };
      if (!newLocked[moduleKey]) newLocked[moduleKey] = {};
      newLocked[moduleKey][action] = !newLocked[moduleKey]?.[action];
      return { ...prev, locked: newLocked };
    });
  };

  const handleApplyTemplate = (templateKey) => {
    const template = PERMISSION_TEMPLATES[templateKey];
    if (template) {
      setFormData(prev => ({
        ...prev,
        permissions: JSON.parse(JSON.stringify(template.permissions)),
      }));
      toast.success(`Applied ${template.name} template`);
    }
  };

  const handleCopyFromRole = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    if (role) {
      setFormData(prev => ({
        ...prev,
        permissions: JSON.parse(JSON.stringify(role.permissions)),
        locked: JSON.parse(JSON.stringify(role.locked || {})),
      }));
      toast.success(`Copied permissions from ${role.name}`);
    }
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Role name is required");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      if (editingRole) {
        setRoles(prev => prev.map(r => r.id === editingRole.id ? { ...r, ...formData } : r));
        toast.success("Role updated successfully");
      } else {
        const newRole = {
          id: Date.now(),
          ...formData,
          userCount: 0,
        };
        setRoles(prev => [...prev, newRole]);
        toast.success("Role created successfully");
      }
      setLoading(false);
      onClose();
    }, 500);
  };

  const handleDelete = (roleId) => {
    if (!confirm("Are you sure you want to delete this role?")) return;
    setRoles(prev => prev.filter(r => r.id !== roleId));
    toast.success("Role deleted successfully");
  };

  const countPermissions = (permissions) => {
    let count = 0;
    Object.values(permissions).forEach(actions => {
      count += Object.values(actions).filter(Boolean).length;
    });
    return count;
  };

  const isPermissionLocked = (moduleKey, action) => {
    return formData.locked?.[moduleKey]?.[action] || false;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">Roles & Permissions</h2>
          <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
            Manage user roles and granular permissions
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus size={16} />}
          onPress={() => handleOpenModal()}
          className="transition-all duration-200"
        >
          Add Role
        </Button>
      </div>

      {/* Roles Table */}
      <Card className="rounded-lg">
        <CardBody className="p-0">
          <Table
            aria-label="Roles table"
            removeWrapper
            classNames={{
              th: "bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-semibold",
              td: "py-4",
            }}
          >
            <TableHeader>
              <TableColumn>ROLE NAME</TableColumn>
              <TableColumn>PERMISSIONS</TableColumn>
              <TableColumn>LOCKED PERMISSIONS</TableColumn>
              <TableColumn>USERS</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody
              items={roles}
              emptyContent="No roles found"
              loadingContent={<Spinner />}
            >
              {(role) => {
                const permCount = countPermissions(role.permissions);
                const lockedCount = countPermissions(role.locked || {});

                return (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                          <Shield size={16} className="text-primary-600 dark:text-primary-400" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-zinc-100">
                          {role.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat" color="primary">
                        {permCount} permissions
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {lockedCount > 0 ? (
                        <div className="flex items-center gap-2">
                          <Lock size={14} className="text-warning-600" />
                          <span className="text-sm text-gray-700 dark:text-zinc-300">
                            {lockedCount} locked
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-zinc-500 text-sm">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-700 dark:text-zinc-300">
                        {role.userCount} users
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => handleOpenModal(role)}
                          className="transition-all duration-200"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => handleDelete(role.id)}
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

      {/* Add/Edit Role Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            {editingRole ? "Edit Role" : "Add New Role"}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {/* Role Name */}
              <Input
                label="Role Name"
                placeholder="e.g., Teacher, Accountant"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                variant="bordered"
                isRequired
              />

              {/* Quick Actions */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                  Quick Actions:
                </span>
                <div className="flex gap-2">
                  <Select
                    placeholder="Apply template"
                    size="sm"
                    variant="bordered"
                    className="w-48"
                    onChange={(e) => handleApplyTemplate(e.target.value)}
                  >
                    {Object.entries(PERMISSION_TEMPLATES).map(([key, template]) => (
                      <SelectItem key={key} value={key}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </Select>
                  <Select
                    placeholder="Copy from role"
                    size="sm"
                    variant="bordered"
                    className="w-48"
                    onChange={(e) => handleCopyFromRole(parseInt(e.target.value))}
                  >
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Permission Matrix */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-4">
                  Permission Matrix
                </h3>
                <div className="border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                  <Table
                    removeWrapper
                    aria-label="Permission matrix"
                    classNames={{
                      th: "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-semibold text-xs",
                      td: "py-3 border-b border-gray-100 dark:border-zinc-800",
                    }}
                  >
                    <TableHeader>
                      <TableColumn>MODULE</TableColumn>
                      <TableColumn align="center">VIEW</TableColumn>
                      <TableColumn align="center">CREATE</TableColumn>
                      <TableColumn align="center">EDIT</TableColumn>
                      <TableColumn align="center">DELETE</TableColumn>
                      <TableColumn align="center">PUBLISH</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {MODULES.map((module) => (
                        <TableRow key={module.key}>
                          <TableCell>
                            <span className="font-medium text-gray-900 dark:text-zinc-100">
                              {module.label}
                            </span>
                          </TableCell>
                          {["view", "create", "edit", "delete", "publish"].map((action) => {
                            const hasAction = module.actions.includes(action);
                            const isChecked = formData.permissions[module.key]?.[action] || false;
                            const isLocked = isPermissionLocked(module.key, action);

                            return (
                              <TableCell key={action} className="text-center">
                                {hasAction ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <Checkbox size="sm"
                                      isSelected={isChecked}
                                      onValueChange={(value) =>
                                        handlePermissionChange(module.key, action, value)
                                      }
                                      size="sm"
                                      isDisabled={isLocked}
                                    />
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="light"
                                      onPress={() => handleLockToggle(module.key, action)}
                                      className="min-w-6 w-6 h-6"
                                    >
                                      {isLocked ? (
                                        <Lock size={12} className="text-warning-600" />
                                      ) : (
                                        <Unlock size={12} className="text-gray-400 dark:text-zinc-500" />
                                      )}
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-gray-300 dark:text-zinc-600">-</span>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2">
                  <Lock size={12} className="inline mr-1" />
                  Locked permissions cannot be changed by users with this role
                </p>
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
              {editingRole ? "Update" : "Create"} Role
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
