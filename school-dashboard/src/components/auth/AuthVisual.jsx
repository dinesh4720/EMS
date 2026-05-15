import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import ErrorBoundary from "../ErrorBoundary";
import lazyWithRetry from "../../utils/lazyWithRetry";
import hasWebGL from "../../utils/hasWebGL";

const SchoolBuilding3D = hasWebGL
  ? lazyWithRetry(() => import("../SchoolBuilding3D"))
  : null;

function AuthVisualFallback() {
  return <div className="auth-visual__inner" aria-hidden="true" />;
}

/**
 * AuthVisual — frosted right rail for the auth split layout. Renders the 3D
 * school building when WebGL is available, otherwise a calm gradient. The
 * <aside> is hidden below the lg breakpoint via .auth-visual so the form
 * takes the full viewport on tablets and phones.
 */
export default function AuthVisual() {
  const { t } = useTranslation();
  return (
    <aside className="auth-visual" aria-hidden={!SchoolBuilding3D}>
      <div className="auth-visual__inner">
        {SchoolBuilding3D ? (
          <ErrorBoundary fallback={<AuthVisualFallback />}>
            <Suspense fallback={<AuthVisualFallback />}>
              <SchoolBuilding3D />
            </Suspense>
          </ErrorBoundary>
        ) : null}
      </div>
      <div className="auth-visual__panel glass" role="note">
        <span className="auth-visual__panel-title">
          {t("login.visualPanelTitle", "One workspace for every school")}
        </span>
        <span className="auth-visual__panel-sub">
          {t(
            "login.visualPanelSub",
            "Attendance, fees, results, and parent messaging — calm, dense, fast."
          )}
        </span>
      </div>
    </aside>
  );
}
