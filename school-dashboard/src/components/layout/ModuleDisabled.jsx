import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Button } from "@heroui/react";
import { PackageOpen, ArrowLeft, SlidersHorizontal } from "lucide-react";
import { usePermissions } from "../../context/PermissionContext";
import { TOGGLEABLE_MODULES } from "../../config/moduleRegistry";

/**
 * Rendered by PermissionGuard when a route belongs to a module the school has
 * switched OFF in Settings → Modules. Distinct from PermissionDenied (which is
 * about the user's role) — here the feature simply isn't enabled for the school.
 * Admins get a shortcut to the Modules settings page.
 */
export default function ModuleDisabled({ module }) {
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();
  const label = useMemo(
    () => TOGGLEABLE_MODULES.find((m) => m.key === module)?.label || module,
    [module]
  );
  const admin = typeof isAdmin === "function" ? isAdmin() : false;

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="max-w-xl w-full">
        <CardBody className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-surface-2 rounded-full">
              <PackageOpen size={48} className="text-fg-subtle" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-fg mb-2">
              {label} isn’t enabled
            </h2>
            <p className="text-fg-muted">
              The <span className="font-semibold text-fg">{label}</span> module is
              switched off for this school.{" "}
              {admin
                ? "Turn it on from Settings → Modules to start using it."
                : "Ask an administrator to enable it from Settings → Modules."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="bordered"
              startContent={<ArrowLeft size={16} />}
              onPress={() => navigate(-1)}
            >
              Go Back
            </Button>
            {admin && (
              <Button
                color="primary"
                startContent={<SlidersHorizontal size={16} />}
                onPress={() => navigate("/settings/modules")}
              >
                Manage Modules
              </Button>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
