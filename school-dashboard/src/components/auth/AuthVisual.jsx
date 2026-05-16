import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import ErrorBoundary from "../ErrorBoundary";
import lazyWithRetry from "../../utils/lazyWithRetry";
import hasWebGL from "../../utils/hasWebGL";

import PixelArtVisual from "./PixelArtVisual";
import Enhanced3DVisual from "./Enhanced3DVisual";
import FeatureCardsVisual from "./FeatureCardsVisual";

const SchoolBuilding3D = hasWebGL
  ? lazyWithRetry(() => import("../SchoolBuilding3D"))
  : null;

function AuthVisualFallback() {
  return <div className="auth-visual__inner" aria-hidden="true" />;
}

const VALID_VARIANTS = ["pixel", "enhanced3d", "cards", "3d"];

function resolveVariant(preferred) {
  const raw =
    preferred ??
    (typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("visual")
      : null);
  if (VALID_VARIANTS.includes(raw)) return raw;
  return "3d";
}

/**
 * AuthVisual — frosted right rail for the auth split layout.
 * Renders one of four visual variants:
 *   - "3d"        → legacy WebGL SchoolBuilding3D (lazy-loaded)
 *   - "enhanced3d"→ CSS-only enhanced building scene
 *   - "pixel"     → retro pixel-art school scene
 *   - "cards"     → animated feature-card grid
 *
 * Variant selection order:
 *   1. `variant` prop
 *   2. `?visual=<name>` query param
 *   3. fallback to "3d"
 */
export default function AuthVisual({ variant }) {
  const { t } = useTranslation();
  const location = useLocation();

  // Re-compute when location.search changes so toggling the query param works.
  const active = resolveVariant(variant);

  const renderVisual = () => {
    switch (active) {
      case "pixel":
        return <PixelArtVisual />;
      case "enhanced3d":
        return <Enhanced3DVisual />;
      case "cards":
        return <FeatureCardsVisual />;
      case "3d":
      default:
        return SchoolBuilding3D ? (
          <ErrorBoundary fallback={<AuthVisualFallback />}>
            <Suspense fallback={<AuthVisualFallback />}>
              <SchoolBuilding3D />
            </Suspense>
          </ErrorBoundary>
        ) : (
          <AuthVisualFallback />
        );
    }
  };

  return (
    <aside className="auth-visual" aria-hidden={active !== "3d" || !SchoolBuilding3D}>
      {renderVisual()}
    </aside>
  );
}
