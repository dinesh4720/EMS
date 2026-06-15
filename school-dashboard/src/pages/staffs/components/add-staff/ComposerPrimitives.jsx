export function ComposerField({
  label,
  required,
  hint,
  error,
  className = "",
  name,
  registerField,
  children,
}) {
  const hintId = name ? `${name}-hint` : undefined;
  const errorId = name && error ? `${name}-error` : undefined;
  return (
    <div
      className={`field ${className}`}
      ref={name && registerField ? registerField(name) : undefined}
    >
      <label className="field__label">
        {label}
        {required && <span className="req">*</span>}
      </label>
      {children}
      {error ? (
        <span
          id={errorId}
          role="alert"
          className="field__hint"
          style={{ color: "var(--danger)" }}
        >
          {error}
        </span>
      ) : hint ? (
        <span id={hintId} className="field__hint">{hint}</span>
      ) : null}
    </div>
  );
}

export function ComposerAvatar({ previewUrl, initials, name }) {
  if (previewUrl) {
    return (
      <img
        src={previewUrl}
        alt="Profile"
        style={{
          width: 56,
          height: 56,
          borderRadius: 999,
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }
  // Same oklch two-hue formula as PhotoAvatar / the design system —
  // every name gets a unique gradient. Empty/"?" placeholder still
  // gets a subtle neutral surface so it reads as "awaiting input"
  // instead of an arbitrarily-coloured disc.
  const trimmed = (name || "").trim();
  const showGradient = trimmed.length > 0 && initials !== "?";
  const code1 = trimmed.charCodeAt(0) || 63;
  const code2 = trimmed.charCodeAt(1 % Math.max(trimmed.length, 1)) || 63;
  const hue1 = (code1 * 7) % 360;
  const hue2 = (code2 * 11) % 360;
  const background = showGradient
    ? `linear-gradient(135deg, oklch(70% 0.14 ${hue1}), oklch(55% 0.16 ${hue2}))`
    : "var(--surface-2)";
  return (
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: 999,
        background,
        border: showGradient ? "none" : "1px solid var(--border)",
        display: "grid",
        placeItems: "center",
        color: showGradient ? "var(--surface)" : "var(--fg-muted)",
        fontWeight: 600,
        fontSize: 18,
        letterSpacing: "-0.02em",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}
