export function fmt(n, digits) {
  return n.toFixed(digits).replace(/\.0+$/, "");
}

export function compactINR(n) {
  if (n == null) return "—";
  if (n < 0) return `-${compactINR(-n)}`;
  if (n >= 1e7) return `₹${fmt(n / 1e7, n >= 1e8 ? 0 : 1)}Cr`;
  if (n >= 1e5) return `₹${fmt(n / 1e5, n >= 1e6 ? 0 : 1)}L`;
  if (n >= 1e3) return `₹${fmt(n / 1e3, n >= 1e4 ? 0 : 1)}K`;
  return `₹${Math.round(n)}`;
}

export function initials(name) {
  return (name || "")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,oklch(70% 0.14 30),oklch(55% 0.18 350))",
  "linear-gradient(135deg,oklch(72% 0.13 220),oklch(58% 0.17 270))",
  "linear-gradient(135deg,oklch(75% 0.14 130),oklch(60% 0.18 160))",
  "linear-gradient(135deg,oklch(80% 0.15 60),oklch(65% 0.18 30))",
  "linear-gradient(135deg,oklch(75% 0.16 320),oklch(58% 0.18 290))",
  "linear-gradient(135deg,oklch(72% 0.15 200),oklch(55% 0.18 250))",
];

export function avatarFor(name, fallbackIndex = 0) {
  const seed = (name || "").split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[(seed || fallbackIndex) % AVATAR_GRADIENTS.length];
}

export function isBirthdayToday(dobStr) {
  if (!dobStr) return false;
  const today = new Date();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();

  let month, day;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dobStr)) {
    [, day, month] = dobStr.match(/^(\d{2})\/(\d{2})\/\d{4}$/);
  } else {
    const d = new Date(dobStr);
    if (isNaN(d.getTime())) return false;
    month = d.getMonth() + 1;
    day = d.getDate();
  }
  return parseInt(month, 10) - 1 === todayMonth && parseInt(day, 10) === todayDate;
}
