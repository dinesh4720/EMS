import { memo } from "react";
import PropTypes from "prop-types";
import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { sizeProp } from "../../utils/propTypes";

/**
 * ErrorState - Reusable error state for data-fetching pages.
 *
 * Props:
 *   title       - Heading text (optional, defaults to i18n key)
 *   message     - Error detail / subtext (optional)
 *   onRetry     - Retry callback; shows retry button when provided
 *   variant     - 'network' | 'generic' (default: 'generic')
 *   size        - 'sm' | 'md' | 'lg' (default: 'md')
 *   className   - extra wrapper classes
 */
const ErrorState = ({
  title,
  message,
  onRetry,
  variant = "generic",
  size = "md",
  className = "",
}) => {
  const { t } = useTranslation();

  const sizeConfig = {
    sm: {
      wrapper: "py-8",
      iconBox: "w-12 h-12 rounded-xl",
      iconSize: 24,
      titleClass: "text-sm font-semibold",
      descClass: "text-xs max-w-[260px]",
      btnClass: "px-3 py-1.5 text-xs",
    },
    md: {
      wrapper: "py-12",
      iconBox: "w-16 h-16 rounded-2xl",
      iconSize: 32,
      titleClass: "text-base font-semibold",
      descClass: "text-sm max-w-xs",
      btnClass: "px-4 py-2 text-sm",
    },
    lg: {
      wrapper: "py-16",
      iconBox: "w-20 h-20 rounded-2xl",
      iconSize: 40,
      titleClass: "text-lg font-semibold",
      descClass: "text-sm max-w-sm",
      btnClass: "px-5 py-2.5 text-sm",
    },
  };

  const s = sizeConfig[size] ?? sizeConfig.md;
  const isNetwork = variant === "network";
  const Icon = isNetwork ? WifiOff : AlertTriangle;

  const defaultTitle = isNetwork
    ? t("common.networkError", "Connection failed")
    : t("common.loadError", "Failed to load data");

  const defaultMessage = isNetwork
    ? t("common.networkErrorDesc", "Please check your internet connection and try again.")
    : t("common.loadErrorDesc", "Something went wrong while loading. Please try again.");

  return (
    <div
      className={`flex flex-col items-center justify-center ${s.wrapper} px-4 ${className}`}
    >
      <div
        className={`${s.iconBox} bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-4 shrink-0`}
      >
        <Icon
          size={s.iconSize}
          className="text-red-400 dark:text-red-500"
          strokeWidth={1.5}
        />
      </div>

      <p
        className={`${s.titleClass} text-gray-700 dark:text-zinc-300 text-center`}
      >
        {title || defaultTitle}
      </p>

      <p
        className={`${s.descClass} text-gray-400 dark:text-zinc-500 text-center mt-1.5`}
      >
        {message || defaultMessage}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={`inline-flex items-center gap-1.5 ${s.btnClass} mt-5 bg-gray-900 hover:bg-gray-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white font-medium rounded-lg transition-colors`}
        >
          <RefreshCw size={14} strokeWidth={2} />
          {t("common.retry", "Try again")}
        </button>
      )}
    </div>
  );
};

ErrorState.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  onRetry: PropTypes.func,
  variant: PropTypes.oneOf(["network", "generic"]),
  size: sizeProp,
  className: PropTypes.string,
};

export default memo(ErrorState);
