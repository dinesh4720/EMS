import PixelArtVisual from "./PixelArtVisual";
import Enhanced3DVisual from "./Enhanced3DVisual";
import FeatureCardsVisual from "./FeatureCardsVisual";

const VALID_VARIANTS = ["pixel", "enhanced3d", "cards"];

function resolveVariant(preferred) {
  const raw =
    preferred ??
    (typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("visual")
      : null);
  if (VALID_VARIANTS.includes(raw)) return raw;
  return "enhanced3d";
}

/**
 * AuthVisual — frosted right rail for the auth split layout.
 * Renders one of three visual variants:
 *   - "enhanced3d"→ CSS-only enhanced building scene
 *   - "pixel"     → retro pixel-art school scene
 *   - "cards"     → animated feature-card grid
 *
 * Variant selection order:
 *   1. `variant` prop
 *   2. `?visual=<name>` query param
 *   3. fallback to "enhanced3d"
 */
export default function AuthVisual({ variant }) {
  const active = resolveVariant(variant);

  const renderVisual = () => {
    switch (active) {
      case "pixel":
        return <PixelArtVisual />;
      case "enhanced3d":
        return <Enhanced3DVisual />;
      case "cards":
        return <FeatureCardsVisual />;
      default:
        return <Enhanced3DVisual />;
    }
  };

  return (
    <aside className="auth-visual" aria-hidden="true">
      {renderVisual()}
    </aside>
  );
}
