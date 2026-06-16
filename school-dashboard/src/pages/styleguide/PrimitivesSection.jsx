import ButtonsSection from "./sections/primitives/ButtonsSection";
import FormsSection from "./sections/primitives/FormsSection";
import ComposerAtomsSection from "./sections/primitives/ComposerAtomsSection";
import SurfacesSection from "./sections/primitives/SurfacesSection";
import FeedbackSection from "./sections/primitives/FeedbackSection";
import NavigationSection from "./sections/primitives/NavigationSection";
import OverlaysSection from "./sections/primitives/OverlaysSection";
import PropTablesSection from "./sections/primitives/PropTablesSection";

/* ──────────────────────────────────────────────────────────────────
 * Primitives — every UI primitive in src/components/ui showcased
 * with state variations and copy-paste-ready code.
 *
 * Each section lives in its own file under ./sections/primitives/.
 * This module just mounts them in order.
 * ────────────────────────────────────────────────────────────────── */

export default function PrimitivesSection() {
  return (
    <>
      <ButtonsSection />
      <FormsSection />
      <ComposerAtomsSection />
      <SurfacesSection />
      <FeedbackSection />
      <NavigationSection />
      <OverlaysSection />
      <PropTablesSection />
    </>
  );
}
