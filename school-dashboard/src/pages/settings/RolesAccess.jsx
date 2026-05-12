import { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Shield, Lock, Trash2 } from "lucide-react";
import {
  PageHeader,
  Card,
  Button,
  IconButton,
  Badge,
  Skeleton,
  EmptyState,
} from "../../components/ui";
import { useApp } from "../../context/AppContext";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import { permissionsApi } from '../../services/api';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useConfirmDialog from '../../hooks/useConfirmDialog';
import logger from '../../utils/logger';
import { PERMISSION_TEMPLATES } from '../../constants/permissionConfig';
import {
  permissionsArrayToObject,
  permissionsObjectToArray,
  countPermissions,
} from '../../utils/permissionsTransform';
import RoleFormModal from './components/RoleFormModal';

export default function RolesAccess() {
  const { t } = useTranslation();
  // staff context retained for future per-role user counts
  useApp();
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();
  const [isOpen, setIsOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingRoles, setFetchingRoles] = useState(true);
  const [roles, setRoles] = useState([]);
  const [originalFormData, setOriginalFormData] = useState(null);
  const [formData, setFormData] = useState({ name: '', permissions: {}, locked: {} });

  const fetchRoles = useCallback(async () => {
    setFetchingRoles(true);
    try {
      const data = await permissionsApi.getCustomRoles();
      const customRoles = (data?.roles || data || []).map((item) => ({
        id: item._id,
        name: item.name,
        description: item.description || '',
        permissions: permissionsArrayToObject(item.permissions),
        locked: item.locked || {},
        isSystem: item.isSystem || false,
        userCount: item.userCount || 0,
      }));
      setRoles(customRoles);
    } catch (error) {
      logger.error('Failed to fetch roles:', error);
      toast.error('Failed to load roles');
    } finally {
      setFetchingRoles(false);
    }
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

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
      const initial = { name: '', permissions: {}, locked: {} };
      setFormData(initial);
      setOriginalFormData(initial);
    }
    setIsOpen(true);
  };

  const handleClose = () => setIsOpen(false);

  const handleResetChanges = () => {
    if (originalFormData) {
      setFormData(JSON.parse(JSON.stringify(originalFormData)));
    }
  };

  const handleApplyTemplate = (templateKey) => {
    const template = PERMISSION_TEMPLATES[templateKey];
    if (template) {
      setFormData((prev) => ({
        ...prev,
        permissions: JSON.parse(JSON.stringify(template.permissions)),
      }));
      toast.success(`Applied ${template.name} template`);
    }
  };

  const handleCopyFromRole = (roleId) => {
    const role = roles.find((item) => item.id === roleId);
    if (role) {
      setFormData((prev) => ({
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
      handleClose();
      await fetchRoles();
    } catch (error) {
      logger.error('Failed to save role:', error);
      toast.error(error.message || 'Failed to save role');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (roleId) => {
    const role = roles.find((item) => item.id === roleId);
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('pages.rolesPermissions')}
        description="Manage user roles and granular permissions"
        bordered={false}
        size="lg"
        className="px-0"
        actions={
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => handleOpenModal()}>
            Add role
          </Button>
        }
      />

      {fetchingRoles ? (
        <Skeleton.Table rows={5} columns={5} />
      ) : roles.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={Shield}
            title="No custom roles yet"
            description="Create custom roles with granular permissions to control what users can see and do."
            action={
              <Button variant="primary" icon={<Plus size={16} />} onClick={() => handleOpenModal()}>
                Create your first role
              </Button>
            }
          />
        </Card>
      ) : (
        <Card padding="none" radius="lg">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label={t('aria.tables.roles')}>
              <thead className="bg-surface-2 text-xs font-semibold text-fg uppercase tracking-wider">
                <tr>
                  <th scope="col" className="text-left px-4 py-3">{t('pages.rOLEName')}</th>
                  <th scope="col" className="text-left px-4 py-3">{t('pages.pERMISSIONS')}</th>
                  <th scope="col" className="text-left px-4 py-3">{t('pages.lOCKEDPermissions')}</th>
                  <th scope="col" className="text-left px-4 py-3">{t('pages.uSERS')}</th>
                  <th scope="col" className="text-right px-4 py-3">{t('pages.aCTIONS')}</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => {
                  const permCount = countPermissions(role.permissions);
                  const lockedCount = countPermissions(role.locked || {});
                  return (
                    <tr key={role.id} className="border-t border-divider">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-[var(--color-primary)]/10 rounded-lg">
                            <Shield size={16} className="text-[var(--color-primary)]" />
                          </div>
                          <span className="font-medium text-fg">
                            {role.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge color="info" size="sm">{permCount} permissions</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {lockedCount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
                            <Lock size={14} />
                            {lockedCount} locked
                          </span>
                        ) : (
                          <span className="text-fg-faint text-sm">{t('pages.none1')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-fg">
                        {role.userCount} users
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <IconButton
                            size="sm"
                            variant="ghost"
                            aria-label="Edit role"
                            onClick={() => handleOpenModal(role)}
                          >
                            <Edit size={16} />
                          </IconButton>
                          <IconButton
                            size="sm"
                            variant="danger"
                            aria-label="Delete role"
                            onClick={() => handleDelete(role.id)}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <RoleFormModal
        isOpen={isOpen}
        onClose={handleClose}
        editingRole={editingRole}
        formData={formData}
        setFormData={setFormData}
        originalFormData={originalFormData}
        roles={roles}
        loading={loading}
        onSubmit={handleSubmit}
        onApplyTemplate={handleApplyTemplate}
        onCopyFromRole={handleCopyFromRole}
        onResetChanges={handleResetChanges}
      />

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </div>
  );
}
