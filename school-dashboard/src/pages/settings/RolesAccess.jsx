import { useState, useMemo, useEffect, useCallback } from "react";
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
} from "@heroui/react";
import { Plus, Edit, Shield, Lock, Unlock, Copy, Trash2 } from "lucide-react";
import { useApp } from "../../context/AppContext";
import toast from "react-hot-toast";
import { STAFF_ROLES } from "../../constants/roles";
import { useTranslation } from 'react-i18next';
import SkeletonTable from '../../components/skeletons/SkeletonTable';
import { permissionsApi } from '../../services/api';

// Transform backend permissions array to frontend object format
const permissionsArrayToObject = (permsArray = []) => {
  const obj = {};
  permsArray.forEach(p => {
    obj[p.module] = { view: !!p.view, create: !!p.create, edit: !!p.edit, delete: !!p.delete, publish: !!p.publish };
  });
  return obj;
};

// Transform frontend permissions object to backend array format
const permissionsObjectToArray = (permsObj = {}) => {
  return Object.entries(permsObj).map(([module, actions]) => ({
    module,
    ...actions,
  }));
};

// Define all modules and their actions (keys only — labels are translated in component)
const MODULES_CONFIG = [
  { key: "dashboard", actions: ["view"] },
  { key: "staff", actions: ["view", "create", "edit", "delete"] },
  { key: "students", actions: ["view", "create", "edit", "delete"] },
  { key: "classes", actions: ["view", "create", "edit", "delete"] },
  { key: "academics", actions: ["view", "create", "edit", "delete", "publish"] },
  { key: "attendance", actions: ["view", "create", "edit", "delete"] },
  { key: "timetable", actions: ["view", "create", "edit", "delete"] },
  { key: "fees", actions: ["view", "create", "edit", "delete"] },
  { key: "payroll", actions: ["view", "create", "edit", "delete"] },
  { key: "messaging", actions: ["view", "create", "edit", "delete"] },
  { key: "reports", actions: ["view", "create", "edit", "delete"] },
  { key: "settings", actions: ["view", "create", "edit", "delete"] },
  { key: "front-desk", actions: ["view", "create", "edit", "delete"] },
  { key: "intake-forms", actions: ["view", "create", "edit", "delete"] },
  { key: "communication", actions: ["view", "create", "edit", "delete"] },
];

// Default permission templates — must match backend UserPermission.js exactly.
// Every module is listed explicitly so applying a template clears stale permissions.
const PERMISSION_TEMPLATES = {
  admin: {
    name: "Admin",
    description: "Full access to all modules",
    permissions: {
      dashboard: { view: true, create: true, edit: true, delete: true },
      staff: { view: true, create: true, edit: true, delete: true },
      students: { view: true, create: true, edit: true, delete: true },
      classes: { view: true, create: true, edit: true, delete: true },
      academics: { view: true, create: true, edit: true, delete: true, publish: true },
      attendance: { view: true, create: true, edit: true, delete: true },
      timetable: { view: true, create: true, edit: true, delete: true },
      fees: { view: true, create: true, edit: true, delete: true },
      payroll: { view: true, create: true, edit: true, delete: true },
      messaging: { view: true, create: true, edit: true, delete: true },
      reports: { view: true, create: true, edit: true, delete: true },
      settings: { view: true, create: true, edit: true, delete: true },
      "front-desk": { view: true, create: true, edit: true, delete: true },
      "intake-forms": { view: true, create: true, edit: true, delete: true },
    },
  },
  principal: {
    name: "Principal",
    description: "Full administrative access except settings deletion",
    permissions: {
      dashboard: { view: true, create: true, edit: true, delete: true },
      staff: { view: true, create: true, edit: true, delete: true },
      students: { view: true, create: true, edit: true, delete: true },
      classes: { view: true, create: true, edit: true, delete: true },
      academics: { view: true, create: true, edit: true, delete: true, publish: true },
      attendance: { view: true, create: true, edit: true, delete: true },
      timetable: { view: true, create: true, edit: true, delete: true },
      fees: { view: true, create: true, edit: true, delete: true },
      payroll: { view: true, create: true, edit: true, delete: true },
      messaging: { view: true, create: true, edit: true, delete: true },
      reports: { view: true, create: true, edit: true, delete: true },
      settings: { view: true, create: true, edit: true, delete: false },
      "front-desk": { view: true, create: true, edit: true, delete: true },
      "intake-forms": { view: true, create: true, edit: true, delete: true },
    },
  },
  "vice-principal": {
    name: "Vice Principal",
    description: "Administrative access without delete permissions",
    permissions: {
      dashboard: { view: true, create: true, edit: true, delete: false },
      staff: { view: true, create: true, edit: true, delete: false },
      students: { view: true, create: true, edit: true, delete: false },
      classes: { view: true, create: true, edit: true, delete: false },
      academics: { view: true, create: true, edit: true, delete: false, publish: true },
      attendance: { view: true, create: true, edit: true, delete: false },
      timetable: { view: true, create: true, edit: true, delete: false },
      fees: { view: true, create: false, edit: false, delete: false },
      payroll: { view: true, create: false, edit: false, delete: false },
      messaging: { view: true, create: true, edit: true, delete: false },
      reports: { view: true, create: true, edit: false, delete: false },
      settings: { view: false, create: false, edit: false, delete: false },
      "front-desk": { view: true, create: true, edit: true, delete: false },
      "intake-forms": { view: true, create: true, edit: true, delete: false },
    },
  },
  teacher: {
    name: "Teacher",
    description: "Access to classes, attendance, and students",
    permissions: {
      dashboard: { view: true, create: false, edit: false, delete: false },
      staff: { view: true, create: false, edit: false, delete: false },
      students: { view: true, create: false, edit: true, delete: false },
      classes: { view: true, create: false, edit: false, delete: false },
      academics: { view: true, create: true, edit: true, delete: false, publish: false },
      attendance: { view: true, create: true, edit: true, delete: false },
      timetable: { view: true, create: false, edit: false, delete: false },
      fees: { view: true, create: false, edit: false, delete: false },
      payroll: { view: false, create: false, edit: false, delete: false },
      messaging: { view: true, create: true, edit: true, delete: false },
      reports: { view: true, create: false, edit: false, delete: false },
      settings: { view: false, create: false, edit: false, delete: false },
      "front-desk": { view: false, create: false, edit: false, delete: false },
      "intake-forms": { view: true, create: true, edit: true, delete: false },
    },
  },
  accountant: {
    name: "Accountant",
    description: "Access to fees and payroll",
    permissions: {
      dashboard: { view: true, create: false, edit: false, delete: false },
      staff: { view: true, create: false, edit: false, delete: false },
      students: { view: true, create: false, edit: false, delete: false },
      classes: { view: true, create: false, edit: false, delete: false },
      academics: { view: true, create: false, edit: false, delete: false, publish: false },
      attendance: { view: true, create: false, edit: false, delete: false },
      timetable: { view: false, create: false, edit: false, delete: false },
      fees: { view: true, create: true, edit: true, delete: true },
      payroll: { view: true, create: true, edit: true, delete: false },
      messaging: { view: true, create: true, edit: false, delete: false },
      reports: { view: true, create: false, edit: false, delete: false },
      settings: { view: false, create: false, edit: false, delete: false },
      "front-desk": { view: false, create: false, edit: false, delete: false },
      "intake-forms": { view: true, create: false, edit: false, delete: false },
    },
  },
  librarian: {
    name: "Librarian",
    description: "Limited access for library management",
    permissions: {
      dashboard: { view: true, create: false, edit: false, delete: false },
      staff: { view: true, create: false, edit: false, delete: false },
      students: { view: true, create: false, edit: false, delete: false },
      classes: { view: true, create: false, edit: false, delete: false },
      academics: { view: true, create: false, edit: false, delete: false, publish: false },
      attendance: { view: true, create: false, edit: false, delete: false },
      timetable: { view: true, create: false, edit: false, delete: false },
      fees: { view: false, create: false, edit: false, delete: false },
      payroll: { view: false, create: false, edit: false, delete: false },
      messaging: { view: true, create: true, edit: false, delete: false },
      reports: { view: false, create: false, edit: false, delete: false },
      settings: { view: false, create: false, edit: false, delete: false },
      "front-desk": { view: false, create: false, edit: false, delete: false },
      "intake-forms": { view: false, create: false, edit: false, delete: false },
    },
  },
  "lab-assistant": {
    name: "Lab Assistant",
    description: "Limited access for lab management",
    permissions: {
      dashboard: { view: true, create: false, edit: false, delete: false },
      staff: { view: true, create: false, edit: false, delete: false },
      students: { view: true, create: false, edit: false, delete: false },
      classes: { view: true, create: false, edit: false, delete: false },
      academics: { view: true, create: false, edit: false, delete: false, publish: false },
      attendance: { view: true, create: false, edit: false, delete: false },
      timetable: { view: true, create: false, edit: false, delete: false },
      fees: { view: false, create: false, edit: false, delete: false },
      payroll: { view: false, create: false, edit: false, delete: false },
      messaging: { view: true, create: true, edit: false, delete: false },
      reports: { view: false, create: false, edit: false, delete: false },
      settings: { view: false, create: false, edit: false, delete: false },
      "front-desk": { view: false, create: false, edit: false, delete: false },
      "intake-forms": { view: false, create: false, edit: false, delete: false },
    },
  },
  receptionist: {
    name: "Receptionist",
    description: "Basic access for front desk operations",
    permissions: {
      dashboard: { view: true, create: false, edit: false, delete: false },
      staff: { view: true, create: false, edit: false, delete: false },
      students: { view: true, create: true, edit: true, delete: false },
      classes: { view: true, create: false, edit: false, delete: false },
      academics: { view: true, create: false, edit: false, delete: false, publish: false },
      attendance: { view: true, create: false, edit: false, delete: false },
      timetable: { view: false, create: false, edit: false, delete: false },
      fees: { view: true, create: false, edit: false, delete: false },
      payroll: { view: false, create: false, edit: false, delete: false },
      messaging: { view: true, create: true, edit: false, delete: false },
      reports: { view: false, create: false, edit: false, delete: false },
      settings: { view: false, create: false, edit: false, delete: false },
      "front-desk": { view: true, create: true, edit: true, delete: false },
      "intake-forms": { view: true, create: true, edit: true, delete: false },
    },
  },
};

export default function RolesAccess() {
  const { t } = useTranslation();
  const MODULES = useMemo(() => MODULES_CONFIG.map(m => ({
    ...m,
    label: t(`constants.permissions.modules.${m.key}`, m.key),
  })), [t]);
  const navigate = useNavigate();
  const { staff } = useApp();
  const { isOpen, onOpen, onClose } = useDisclosure();
  // activeTab state removed - was unused
  const [editingRole, setEditingRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingRoles, setFetchingRoles] = useState(true);
  const [roles, setRoles] = useState([]);

  // Fetch custom roles from backend API
  const fetchRoles = useCallback(async () => {
    setFetchingRoles(true);
    try {
      const data = await permissionsApi.getCustomRoles();
      const customRoles = (data?.roles || data || []).map(r => ({
        id: r._id,
        name: r.name,
        description: r.description || '',
        permissions: permissionsArrayToObject(r.permissions),
        locked: r.locked || {},
        isSystem: r.isSystem || false,
        userCount: r.userCount || 0,
      }));
      setRoles(customRoles);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      toast.error('Failed to load roles');
    } finally {
      setFetchingRoles(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

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

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error(t('toast.error.roleNameIsRequired'));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        permissions: permissionsObjectToArray(formData.permissions),
        locked: formData.locked,
      };

      if (editingRole) {
        await permissionsApi.updateCustomRole(editingRole.id, payload);
        toast.success(t('toast.success.roleUpdatedSuccessfully'));
      } else {
        await permissionsApi.createCustomRole(payload);
        toast.success(t('toast.success.roleCreatedSuccessfully'));
      }
      onClose();
      await fetchRoles();
    } catch (error) {
      console.error('Failed to save role:', error);
      toast.error(error.message || 'Failed to save role');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (roleId) => {
    if (!confirm(t('confirm.deleteRole'))) return;
    try {
      await permissionsApi.deleteCustomRole(roleId);
      toast.success(t('toast.success.roleDeletedSuccessfully'));
      await fetchRoles();
    } catch (error) {
      console.error('Failed to delete role:', error);
      toast.error(error.message || 'Failed to delete role');
    }
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
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">{t('pages.rolesPermissions')}</h2>
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
      {fetchingRoles ? (
        <SkeletonTable rows={5} columns={5} />
      ) : (
      <Card className="rounded-lg">
        <CardBody className="p-0">
          <Table
            aria-label={t('aria.tables.roles')}
            removeWrapper
            classNames={{
              th: "bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-semibold",
              td: "py-4",
            }}
          >
            <TableHeader>
              <TableColumn scope="col">{t('pages.rOLEName')}</TableColumn>
              <TableColumn scope="col">{t('pages.pERMISSIONS')}</TableColumn>
              <TableColumn scope="col">{t('pages.lOCKEDPermissions')}</TableColumn>
              <TableColumn scope="col">{t('pages.uSERS')}</TableColumn>
              <TableColumn scope="col">{t('pages.aCTIONS')}</TableColumn>
            </TableHeader>
            <TableBody
              items={roles}
              emptyContent="No roles found"
              loadingContent={<SkeletonTable columns={5} rows={5} />}
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
                        <span className="text-gray-400 dark:text-zinc-500 text-sm">{t('pages.none1')}</span>
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
      )}

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
                label={t('pages.roleName')}
                placeholder={t('settings.roleNamePlaceholder')}
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
                    placeholder={t('pages.applyTemplate')}
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
                    placeholder={t('pages.copyFromRole')}
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
                    aria-label={t('aria.inputs.permissionMatrix')}
                    classNames={{
                      th: "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-semibold text-xs",
                      td: "py-3 border-b border-gray-100 dark:border-zinc-800",
                    }}
                  >
                    <TableHeader>
                      <TableColumn scope="col">{t('pages.mODULE')}</TableColumn>
                      <TableColumn align="center" scope="col">{t('pages.vIEW')}</TableColumn>
                      <TableColumn align="center" scope="col">{t('pages.cREATE')}</TableColumn>
                      <TableColumn align="center" scope="col">{t('pages.eDIT')}</TableColumn>
                      <TableColumn align="center" scope="col">{t('pages.dELETE')}</TableColumn>
                      <TableColumn align="center" scope="col">{t('pages.pUBLISH')}</TableColumn>
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
                                    <Checkbox
                                      size="sm"
                                      isSelected={isChecked}
                                      onValueChange={(value) =>
                                        handlePermissionChange(module.key, action, value)
                                      }
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
