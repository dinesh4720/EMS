export default function ComposerAvatar({ previewUrl, initials, name }) {
  if (previewUrl) {
    return (
      <div className="avatar-up__preview">
        <img src={previewUrl} alt="Profile" />
      </div>
    );
  }
  const trimmed = (name || "").trim();
  const showGradient = trimmed.length > 0 && initials !== "?";
  const code1 = trimmed.charCodeAt(0) || 63;
  const code2 = trimmed.charCodeAt(1 % Math.max(trimmed.length, 1)) || 63;
  const hue1 = (code1 * 7) % 360;
  const hue2 = (code2 * 11) % 360;
  // `background` is genuinely data-driven (derived from the name's char codes),
  // so it stays inline; the layout / typography lives in the modifier class.
  const background = showGradient
    ? `linear-gradient(135deg, oklch(70% 0.14 ${hue1}), oklch(55% 0.16 ${hue2}))`
    : undefined;
  return (
    <div
      className={`avatar-up__preview ${showGradient ? "avatar-up__preview--grad" : "avatar-up__preview--bare"}`}
      style={background ? { background } : undefined}
    >
      {initials}
    </div>
  );
}
