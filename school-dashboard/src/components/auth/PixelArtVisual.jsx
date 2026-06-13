import { useTranslation } from "react-i18next";

/**
 * PixelArtVisual — Retro 8-bit/16-bit pixel art school scene.
 * Pure SVG + CSS animations. Dark background so the pixel palette pops.
 * All animations respect prefers-reduced-motion.
 */
export default function PixelArtVisual() {
  const { t } = useTranslation();
  return (
    <div className="auth-visual__inner pixel-art-visual" aria-hidden="true">
      <div className="pixel-art-scene">
        {/* Sky with hue-shift animation */}
        <div className="pixel-sky" />

        {/* Sun with pulse */}
        <div className="pixel-sun" />

        {/* Drifting clouds */}
        <div className="pixel-cloud pixel-cloud--1" />
        <div className="pixel-cloud pixel-cloud--2" />
        <div className="pixel-cloud pixel-cloud--3" />

        {/* Floating school building */}
        <div className="pixel-building-wrap">
          <div className="pixel-building">
            {/* Main block */}
            <div className="pixel-building__block" />
            {/* Roof */}
            <div className="pixel-building__roof" />
            {/* Clock tower */}
            <div className="pixel-building__tower">
              <div className="pixel-clock">
                <div className="pixel-clock__hand pixel-clock__hand--hour" />
                <div className="pixel-clock__hand pixel-clock__hand--min" />
              </div>
            </div>
            {/* Windows */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`pixel-window-${i}`}
                className="pixel-window"
                style={{ animationDelay: `${i * 0.3}s` }}
              />
            ))}
            {/* Door */}
            <div className="pixel-door" />
          </div>
          {/* Shadow */}
          <div className="pixel-building-shadow" />
        </div>

        {/* Waving flag */}
        <div className="pixel-flag-wrap">
          <div className="pixel-flag-pole" />
          <div className="pixel-flag" />
        </div>

        {/* Swaying trees */}
        <div className="pixel-tree pixel-tree--left">
          <div className="pixel-tree__trunk" />
          <div className="pixel-tree__leaves" />
        </div>
        <div className="pixel-tree pixel-tree--right">
          <div className="pixel-tree__trunk" />
          <div className="pixel-tree__leaves" />
        </div>

        {/* Flying birds */}
        <div className="pixel-bird pixel-bird--1" />
        <div className="pixel-bird pixel-bird--2" />
        <div className="pixel-bird pixel-bird--3" />

        {/* Ground */}
        <div className="pixel-ground" />
      </div>

      <div className="auth-visual__panel glass" role="note">
        <span className="auth-visual__panel-title">
          {t("login.visualPanelTitle", "One workspace for every school")}
        </span>
        <span className="auth-visual__panel-sub">
          {t("login.visualPanelSub", "Attendance, fees, results, and parent messaging — calm, dense, fast.")}
        </span>
      </div>
    </div>
  );
}
