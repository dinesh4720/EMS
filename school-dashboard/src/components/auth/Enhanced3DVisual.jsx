import { useTranslation } from "react-i18next";

/**
 * Enhanced3DVisual — CSS-only layered school-building scene.
 * Builds on the existing SchoolBuilding3D concept with environmental
 * particles, pulsing sky, sequential window lighting, and orbiting accents.
 * No WebGL required — fully CSS/SVG driven for broader compatibility.
 */
export default function Enhanced3DVisual() {
  const { t } = useTranslation();

  return (
    <div className="auth-visual__inner enhanced-3d-visual" aria-hidden="true">
      {/* Radial sky gradients with subtle pulse */}
      <div className="e3d-sky e3d-sky--primary" />
      <div className="e3d-sky e3d-sky--secondary" />

      {/* Floating particles */}
      <div className="e3d-particles">
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className="e3d-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${4 + Math.random() * 4}s`,
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
            }}
          />
        ))}
      </div>

      {/* School building composition */}
      <div className="e3d-building-wrap">
        <div className="e3d-building">
          {/* Main structure */}
          <div className="e3d-building__body">
            {/* Windows — 3x5 grid */}
            <div className="e3d-windows">
              {Array.from({ length: 15 }).map((_, i) => (
                <div
                  key={i}
                  className="e3d-window"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>

            {/* Door */}
            <div className="e3d-door">
              <div className="e3d-door__shine" />
            </div>
          </div>

          {/* Tower */}
          <div className="e3d-tower">
            <div className="e3d-tower__roof" />
            <div className="e3d-tower__clock">
              <div className="e3d-tower__clock-hand" />
            </div>
          </div>

          {/* Roof accent */}
          <div className="e3d-building__roof" />
        </div>

        {/* Breathing shadow */}
        <div className="e3d-shadow" />

        {/* Orbiting accent ring */}
        <div className="e3d-orbit">
          <div className="e3d-orbit__dot" />
        </div>
      </div>

      {/* Ground plane */}
      <div className="e3d-ground" />

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
