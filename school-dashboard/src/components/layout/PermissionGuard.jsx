import { usePermissions } from "../../context/PermissionContext";
import PermissionDenied from "./PermissionDenied";
import ModuleDisabled from "./ModuleDisabled";
import { Spinner } from "@heroui/react";

/**
 * Permission Guard Component
 * Wraps components/routes and checks if user has required permissions
 * 
 * @param {string} module - Module name (e.g., 'staff', 'students')
 * @param {string} action - Action type ('view', 'create', 'edit', 'delete')
 * @param {ReactNode} children - Component to render if permission granted
 * @param {ReactNode} fallback - Optional custom fallback component
 */
export default function PermissionGuard({ 
  module, 
  action = 'view', 
  children, 
  fallback 
}) {
  const { hasPermission, loading, isModuleEnabled } = usePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  // Module enablement (per-school) is checked before role permission: a feature
  // the school hasn't turned on shouldn't prompt the user to "request access".
  if (module && !isModuleEnabled(module)) {
    return <ModuleDisabled module={module} />;
  }

  const permitted = hasPermission(module, action);

  if (!permitted) {
    return fallback || <PermissionDenied module={module} action={action} />;
  }

  return <>{children}</>;
}

/**
 * Hook to use permission guard in components
 * Returns a function that checks permission and shows denied UI if needed
 */
export function usePermissionGuard() {
  const { hasPermission } = usePermissions();

  const checkPermission = (module, action = 'view') => {
    return hasPermission(module, action);
  };

  return { checkPermission };
}
