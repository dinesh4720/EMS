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
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useConfirmDialog from '../../hooks/useConfirmDialog';
import logger from '../../utils/logger';
import { MODULES_CONFIG, PERMISSION_TEMPLATES } from '../../constants/permissionConfig';
import { permissionsArrayToObject, permissionsObjectToArray, countPermissions } from '../../utils/permissionsTransform';

export default function RolesAccess() {
  const { t } = useTranslation();
  const MODULES = useMemo(() => MODULES_CONFIG.map(m => ({
    ...m,
    label: t(`constants.permissions.modules.${m.key}`, m.key),
  })), [t]);
  const navigate = useNavigate();
  const { staff } = useApp();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();
  // activeTab state removed - was unused
  const [editingRole, setEditingRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingRoles, setFetchingRoles] = useState(true);
  const [roles, setRoles] = useState([]);
  const [originalFormData, setOriginalFormData] = useState(null);

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
      logger.error('Failed to fetch roles:', error);
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
      const initial = {
        name: role.name,
        permissions: JSON.parse(JSON.stringify(role.permissions)),
        locked: JSON.parse(JSON.stringify(role.locked || {})),
      };
      setFormData(initial);
      setOriginalFormData(initial);
    } else {
      setEditingRole(null);
      const initial = { name: "", permissions: {}, locked: {} };
      setFormData(initial);
      setOriginalFormData(initial);
    }
    onOpen();
  };

  const handleResetChanges = () => {
    if (originalFormData) {
      setFormData(JSON.parse(JSON.stringify(originalFormData)));
    }
  };

  const isPermissionChanged = (moduleKey, action) => {
    if (!originalFormData || !editingRole) return false;
    const orig = originalFormData.permissions[moduleKey]?.[action] || false;
    const curr = formData.permissions[moduleKey]?.[action] || false;
    return orig !== curr;
  };

  const changedCount = useMemo(() => {
    if (!originalFormData || !editingRole) return 0;
    let count = 0;
    MODULES_CONFIG.forEach(({ key, actions }) => {
      actions.forEach(action => {
        const orig = originalFormData.permissions[key]?.[action] || false;
        const curr = formData.permissions[key]?.[action] || false;
        if (orig !== curr) count++;
      });
    });
    return count;
  }, [formData.permissions, originalFormData, editingRole]);

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

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
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
      logger.error('Failed to save role:', error);
      toast.error(error.message || 'Failed to save role');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.userCount > 0) {
      toast.error(`Cannot delete role "${role.name}". ${role.userCount} user(s) are currently assigned to it. Please reassign them first.`);
      return;
    }
    showConfirm({
      title: 'Delete Role',
      message: t('confirm.deleteRole'),
      variant: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await permissionsApi.deleteCustomRole(roleId);
          toast.success(t('toast.success.roleDeletedSuccessfully'));
          await fetchRoles();
        } catch (error) {
          logger.error('Failed to delete role:', error);
          toast.error(error.message || 'Failed to delete role');
        }
      },
    });
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
                          aria-label="Edit role"
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
                          aria-label="Delete role"
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
                    onChange={(e) => handleCopyFromRole(e.target.value)}
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
                            const isChanged = isPermissionChanged(module.key, action);

                            return (
                              <TableCell key={action} className={`text-center${isChanged ? " bg-warning-50 dark:bg-warning-900/10" : ""}`}>
                                {hasAction ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <Checkbox
                                      size="sm"
                                      isSelected={isChecked}
                                      onValueChange={(value) =>
                                        handlePermissionChange(module.key, action, value)
                                      }
                                      isDisabled={isLocked}
                                      color={isChanged ? "warning" : "primary"}
                                    />
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="light"
                                      aria-label={isLocked ? "Unlock permission" : "Lock permission"}
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
          <ModalFooter className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {changedCount > 0 && (
                <>
                  <span className="text-sm text-warning-600 dark:text-warning-400 font-medium">
                    {changedCount} unsaved change{changedCount !== 1 ? "s" : ""}
                  </span>
                  <Button
                    size="sm"
                    variant="flat"
                    color="warning"
                    onPress={handleResetChanges}
                  >
                    Revert
                  </Button>
                </>
              )}
            </div>
            <div className="flex gap-2">
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
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </div>
  );
}
