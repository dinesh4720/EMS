import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "../context/PermissionContext";
import { Spinner } from "@heroui/react";

/**
 * RequirePermission — client-side guard for sensitive routes.
 *
 * Props:
 *   - module      Permission module name (e.g. 'settings')
 *   - action      Permission action  (default: 'view')
 *   - adminOnly   If true, requires isAdmin() instead of hasPermission()
 *   - children    Content to render when authorized
 *
 * Unauthorized users are redirected to /settings (replace) so there is no
 * UI flash. A spinner is shown while permissions are still loading.
 */
export default function RequirePermission({
  module,
  action = "view",
  adminOnly = false,
  children,
}) {
  const { hasPermission, isAdmin, loading } = usePermissions();
  const navigate = useNavigate();

  const permitted = loading
    ? false
    : adminOnly
      ? isAdmin()
      : hasPermission(module, action);

  useEffect(() => {
    if (!loading && !permitted) {
      navigate("/settings", { replace: true });
    }
  }, [loading, permitted, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!permitted) {
    return null;
  }

  return <>{children}</>;
}
