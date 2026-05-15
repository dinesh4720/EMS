import { useMemo } from "react";
import PropTypes from "prop-types";
import { Lock, Unlock } from "lucide-react";
import {
  Modal,
  Button,
  Input,
  Select,
  Checkbox,
  IconButton,
  SectionHeading,
} from "../../../components/ui";
import { useTranslation } from 'react-i18next';
import {
  MODULES_CONFIG,
  PERMISSION_TEMPLATES,
} from '../../../constants/permissionConfig';
import { cn } from "../../../utils/cn";

const ACTIONS = ["view", "create", "edit", "delete", "publish"];

export default function RoleFormModal({
  isOpen,
  onClose,
  editingRole,
  formData,
  setFormData,
  originalFormData,
  roles,
  loading,
  onSubmit,
  onApplyTemplate,
  onCopyFromRole,
  onResetChanges,
}) {
  const { t } = useTranslation();

  const modules = useMemo(
    () =>
      MODULES_CONFIG.map((mod) => ({
        ...mod,
        label: t(`constants.permissions.modules.${mod.key}`, mod.key),
      })),
    [t]
  );

  const isPermissionLocked = (moduleKey, action) =>
    formData.locked?.[moduleKey]?.[action] || false;

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
      actions.forEach((action) => {
        const orig = originalFormData.permissions[key]?.[action] || false;
        const curr = formData.permissions[key]?.[action] || false;
        if (orig !== curr) count++;
      });
    });
    return count;
  }, [formData.permissions, originalFormData, editingRole]);

  const handlePermissionChange = (moduleKey, action, value) => {
    setFormData((prev) => ({
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
    setFormData((prev) => {
      const newLocked = { ...prev.locked };
      if (!newLocked[moduleKey]) newLocked[moduleKey] = {};
      newLocked[moduleKey][action] = !newLocked[moduleKey]?.[action];
      return { ...prev, locked: newLocked };
    });
  };

  const footer = (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
      <div className="flex items-center gap-2">
        {changedCount > 0 && (
          <>
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              {changedCount} unsaved change{changedCount !== 1 ? 's' : ''}
            </span>
            <Button size="sm" variant="ghost" onClick={onResetChanges}>
              Revert
            </Button>
          </>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={onSubmit} loading={loading}>
          {editingRole ? 'Update role' : 'Create role'}
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingRole ? 'Edit role' : 'Add new role'}
      description="Configure granular module-level permissions for this role"
      size="5xl"
      scrollBehavior="inside"
      footer={footer}
    >
      <div className="space-y-6">
        <Input
          label={t('pages.roleName')}
          placeholder={t('settings.roleNamePlaceholder')}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <div className="rounded-lg border border-divider bg-surface-2 p-4 space-y-3">
          <SectionHeading size="sm" as="h3">Quick actions</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              size="sm"
              placeholder={t('pages.applyTemplate')}
              value=""
              onChange={(e) => onApplyTemplate(e.target.value)}
            >
              {Object.entries(PERMISSION_TEMPLATES).map(([key, template]) => (
                <option key={key} value={key}>{template.name}</option>
              ))}
            </Select>
            <Select
              size="sm"
              placeholder={t('pages.copyFromRole')}
              value=""
              onChange={(e) => onCopyFromRole(e.target.value)}
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <SectionHeading size="sm" as="h3" className="mb-3">
            Permission matrix
          </SectionHeading>
          <div className="border border-divider rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-xs font-semibold text-fg uppercase tracking-wider">
                <tr>
                  <th scope="col" className="text-left px-4 py-3">{t('pages.mODULE')}</th>
                  {ACTIONS.map((action) => (
                    <th key={action} scope="col" className="text-center px-3 py-3">
                      {t(`pages.${action.toUpperCase()}`, action)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modules.map((module) => (
                  <tr key={module.key} className="border-t border-divider">
                    <td className="px-4 py-3 font-medium text-fg">
                      {module.label}
                    </td>
                    {ACTIONS.map((action) => {
                      const hasAction = module.actions.includes(action);
                      const isChecked = formData.permissions[module.key]?.[action] || false;
                      const isLocked = isPermissionLocked(module.key, action);
                      const isChanged = isPermissionChanged(module.key, action);
                      return (
                        <td
                          key={action}
                          className={cn(
                            "px-3 py-3 text-center",
                            isChanged && "bg-amber-50 dark:bg-amber-900/10"
                          )}
                        >
                          {hasAction ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <Checkbox
                                size="sm"
                                checked={isChecked}
                                onChange={(e) =>
                                  handlePermissionChange(module.key, action, e.target.checked)
                                }
                                disabled={isLocked}
                              />
                              <IconButton
                                size="sm"
                                variant="ghost"
                                aria-label={isLocked ? 'Unlock permission' : 'Lock permission'}
                                onClick={() => handleLockToggle(module.key, action)}
                              >
                                {isLocked ? (
                                  <Lock size={12} className="text-amber-600 dark:text-amber-400" />
                                ) : (
                                  <Unlock size={12} className="text-fg-faint" />
                                )}
                              </IconButton>
                            </div>
                          ) : (
                            <span className="text-fg-faint">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-fg-muted mt-2 flex items-center gap-1">
            <Lock size={12} />
            Locked permissions cannot be changed by users with this role
          </p>
        </div>
      </div>
    </Modal>
  );
}

RoleFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  editingRole: PropTypes.object,
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired,
  originalFormData: PropTypes.object,
  roles: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  onApplyTemplate: PropTypes.func.isRequired,
  onCopyFromRole: PropTypes.func.isRequired,
  onResetChanges: PropTypes.func.isRequired,
};
