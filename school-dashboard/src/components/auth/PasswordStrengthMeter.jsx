import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { cn } from "../../utils/cn";

const TICK_BG = [
  "",
  "bg-red-400",
  "bg-orange-400",
  "bg-yellow-400",
  "bg-[var(--color-accent)]",
  "bg-[var(--color-accent-hover)]",
];

const TEXT_TONE = [
  "",
  "text-red-500",
  "text-orange-500",
  "text-yellow-600 dark:text-yellow-500",
  "text-[var(--color-accent)]",
  "text-[var(--color-accent-hover)]",
];

function score(pwd) {
  if (!pwd) return 0;
  return [
    pwd.length >= 8,
    /[A-Z]/.test(pwd),
    /[a-z]/.test(pwd),
    /[0-9]/.test(pwd),
    /[^A-Za-z0-9]/.test(pwd),
  ].filter(Boolean).length;
}

/**
 * PasswordStrengthMeter — visualises the strength score (0–5) of the supplied
 * password. Mirrors the rules used by the backend signup Zod schema so the UI
 * never tells the user a password is "strong" when the API will reject it.
 */
export default function PasswordStrengthMeter({ password, className }) {
  const { t } = useTranslation();
  const strength = score(password);
  if (!password) return null;

  const labels = [
    "",
    t("signup.passwordStrength.weak"),
    t("signup.passwordStrength.fair"),
    t("signup.passwordStrength.good"),
    t("signup.passwordStrength.strong"),
    t("signup.passwordStrength.veryStrong"),
  ];

  return (
    <div className={cn("mt-1 space-y-1", className)} aria-live="polite">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((tick) => (
          <div
            key={tick}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              tick <= strength ? TICK_BG[strength] : "bg-[var(--color-border-strong)]"
            )}
          />
        ))}
      </div>
      <p className={cn("text-[11px] font-medium", TEXT_TONE[strength])}>{labels[strength]}</p>
    </div>
  );
}

PasswordStrengthMeter.propTypes = {
  password: PropTypes.string,
  className: PropTypes.string,
};
