import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { cn } from "../../utils/cn";

/**
 * AuthBrand — logo + product name lockup used at the top of every auth page.
 * Centralising this guarantees the wordmark and accent square stay aligned
 * across Login, Signup, Reset, and Privacy pages.
 */
export default function AuthBrand({ className, size = "md" }) {
  const { t } = useTranslation();
  const isLg = size === "lg";
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <div
        className={cn(
          "rounded-lg flex items-center justify-center bg-[var(--color-accent)]",
          isLg ? "w-10 h-10" : "w-9 h-9"
        )}
        aria-hidden="true"
      >
        <span className={cn("text-white font-bold", isLg ? "text-xl" : "text-lg")}>S</span>
      </div>
      <span
        className={cn(
          "font-semibold text-[var(--color-text-primary)]",
          isLg ? "text-2xl" : "text-xl"
        )}
      >
        {t("pages.schoolSync1")}
      </span>
    </div>
  );
}

AuthBrand.propTypes = {
  className: PropTypes.string,
  size: PropTypes.oneOf(["md", "lg"]),
};
